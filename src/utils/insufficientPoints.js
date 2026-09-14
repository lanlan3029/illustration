import { ElMessageBox } from 'element-plus';

let dialogOpen = false;

export function extractApiErrorMessage(data) {
  if (!data) return '';
  if (typeof data.message === 'string') return data.message;
  if (data.message?.error) return String(data.message.error);
  if (data.desc === 'insufficient_points') {
    return typeof data.message === 'string' ? data.message : '积分不足';
  }
  if (data.desc && data.desc !== 'success' && data.desc !== 'Internal Server Error') {
    return String(data.desc);
  }
  return '';
}

export function extractErrorMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed.startsWith('{') && trimmed.includes('积分不足')) {
      try {
        return extractApiErrorMessage(JSON.parse(trimmed)) || trimmed;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  const fromResponse = extractApiErrorMessage(error.response?.data);
  if (fromResponse) return fromResponse;
  if (error.message) return extractErrorMessage(String(error.message));
  return '';
}

export function isInsufficientPointsError(message) {
  return /积分不足/.test(String(message || ''));
}

export function isApiPointsError(data) {
  if (!data) return false;
  if (data.desc === 'insufficient_points') return true;
  return isInsufficientPointsError(extractApiErrorMessage(data));
}

export function isInsufficientPointsErrorObject(error) {
  if (error?.insufficientPoints) return true;
  if (isApiPointsError(error?.response?.data)) return true;
  return isInsufficientPointsError(extractErrorMessage(error));
}

export async function showInsufficientPointsDialog({ message, router, t } = {}) {
  if (dialogOpen) return;
  dialogOpen = true;

  const title = t?.('common.insufficientPointsTitle') || '积分不足';
  const detail = message || t?.('common.insufficientPointsDefault') || '当前积分不足，无法继续生成';
  const hint = t?.('common.insufficientPointsHint') || '充值积分后即可继续创作绘本与插画。';
  const confirmText = t?.('common.insufficientPointsRecharge') || '去充值';
  const cancelText = t?.('common.cancel') || '取消';

  try {
    await ElMessageBox.confirm(`${detail}\n\n${hint}`, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      type: 'warning',
      closeOnClickModal: false,
    });
    if (router?.push) {
      router.push('/member/recharge');
    } else {
      window.location.assign('/member/recharge');
    }
  } catch {
    // user dismissed
  } finally {
    dialogOpen = false;
  }
}

/** @returns {Promise<boolean>} true if handled as insufficient points */
export async function handleInsufficientPointsError(error, { router, t } = {}) {
  if (!isInsufficientPointsErrorObject(error)) return false;
  await showInsufficientPointsDialog({
    message: extractErrorMessage(error),
    router,
    t,
  });
  return true;
}

export function throwIfInsufficientPointsResponse(responseData) {
  if (!responseData || responseData.code === 0 || responseData.code === '0' || responseData.desc === 'success') {
    return;
  }
  if (!isApiPointsError(responseData)) return;
  const msg = extractApiErrorMessage(responseData);
  const err = new Error(msg || '积分不足');
  err.insufficientPoints = true;
  throw err;
}

export function markInsufficientPointsError(error, message) {
  const msg = message || extractErrorMessage(error);
  if (!isInsufficientPointsError(msg)) return error;
  const err = error instanceof Error ? error : new Error(msg);
  err.insufficientPoints = true;
  if (!err.message) err.message = msg;
  return err;
}

let pointsDialogPromise = null;

/** 全局 axios 拦截器用：弹出充值引导（去重） */
export function scheduleInsufficientPointsDialog({ message, router, t } = {}) {
  if (pointsDialogPromise) return pointsDialogPromise;
  pointsDialogPromise = showInsufficientPointsDialog({ message, router, t }).finally(() => {
    pointsDialogPromise = null;
  });
  return pointsDialogPromise;
}

export function rejectIfApiPointsError(response, { router, t } = {}) {
  const data = response?.data;
  if (!isApiPointsError(data)) return null;
  const msg = extractApiErrorMessage(data) || '积分不足';
  scheduleInsufficientPointsDialog({ message: msg, router, t });
  const err = new Error(msg);
  err.insufficientPoints = true;
  err.response = response;
  return err;
}
