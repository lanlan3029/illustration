import { ElMessageBox } from 'element-plus';

let dialogOpen = false;

export function extractApiErrorMessage(data) {
  if (!data) return '';
  if (typeof data.message === 'string') return data.message;
  if (data.message?.error) return String(data.message.error);
  if (data.desc && data.desc !== 'success') return String(data.desc);
  return '';
}

export function extractErrorMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  const fromResponse = extractApiErrorMessage(error.response?.data);
  if (fromResponse) return fromResponse;
  if (error.message) return String(error.message);
  return '';
}

export function isInsufficientPointsError(message) {
  return /积分不足/.test(String(message || ''));
}

export function isInsufficientPointsErrorObject(error) {
  if (error?.insufficientPoints) return true;
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
  if (!responseData || (responseData.code !== -1 && responseData.code !== '-1')) return;
  const msg = extractApiErrorMessage(responseData);
  if (!isInsufficientPointsError(msg)) return;
  const err = new Error(msg);
  err.insufficientPoints = true;
  throw err;
}
