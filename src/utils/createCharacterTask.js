// 统一处理 /create-character 的异步任务模式。
//
// 生产建议：默认异步（短 POST + 轮询），同步仅作 sync: true 兼容兜底。
//   异步：提交 60s、单次轮询 15s、总等待 180～240s（轮询计数，非长连接）
//   上游生图 ~120s 体现在 estimated_wait_sec 与轮询总时长，而非 POST 超时
//   同步兜底：带参考图 POST 130～150s；纯文 320s+

/** 异步提交：只等任务受理（202），不等上游生图完成 */
export const ASYNC_SUBMIT_TIMEOUT_MS = 60000

/** 单次轮询请求超时 */
export const POLL_REQUEST_TIMEOUT_MS = 15000

/** 轮询总等待下限（上游 ~120s + 缓冲） */
export const POLL_MIN_WAIT_MS = 180000

/** 轮询总等待上限 */
export const POLL_MAX_WAIT_MS = 240000

/** 同步兜底：带参考图 POST 超时（130～150s 取中值） */
export const SYNC_POST_TIMEOUT_WITH_REFS_MS = 140000

/** 同步兜底：纯文 POST 超时（320s+） */
export const SYNC_POST_TIMEOUT_TEXT_ONLY_MS = 330000

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 请求体是否携带参考图（单张或多张） */
export function hasReferenceImages(requestData) {
  const img = requestData && requestData.image
  if (!img) return false
  if (Array.isArray(img)) return img.length > 0
  return Boolean(img)
}

/**
 * 根据后端 estimated_wait_sec 计算轮询总等待时长，钳制在 180～240s。
 * 上游生图耗时由轮询窗口承载，而非拉长 POST。
 */
export function computePollMaxWaitMs(envelope) {
  const sec = envelope && envelope.estimated_wait_sec
  if (typeof sec === 'number' && sec > 0) {
    // 预估耗时 + 60s 缓冲，再钳制到生产窗口
    const ms = sec * 1000 + 60000
    return Math.min(POLL_MAX_WAIT_MS, Math.max(POLL_MIN_WAIT_MS, ms))
  }
  return POLL_MAX_WAIT_MS
}

function buildAuthHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  }
  if (headers.Authorization === undefined) {
    const token = localStorage.getItem('token')
    if (token) {
      headers.Authorization = 'Bearer ' + token
    }
  }
  return headers
}

function resolveApiUrl(apiBaseUrl) {
  return apiBaseUrl ? `${apiBaseUrl}/create-character` : '/create-character'
}

/**
 * 轮询异步生图任务，直到成功/失败。
 * 成功时归一化为与同步一致的响应结构 { code, desc, message }。
 */
export async function pollCreateCharacterTask(http, taskId, opts = {}) {
  const baseInterval = opts.pollIntervalMs || 2000
  const apiBaseUrl = opts.apiBaseUrl
  const maxWaitMs = opts.maxWaitMs || POLL_MAX_WAIT_MS
  const taskUrl = apiBaseUrl
    ? `${apiBaseUrl}/create-character/task/${taskId}`
    : `/create-character/task/${taskId}`
  const deadline = Date.now() + maxWaitMs
  let consecutiveErrors = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() > deadline) {
      throw new Error('生成超时，请稍后重试')
    }

    let poll
    try {
      poll = await http.get(taskUrl, {
        headers: buildAuthHeaders(opts.headers),
        timeout: POLL_REQUEST_TIMEOUT_MS
      })
      consecutiveErrors = 0
    } catch (e) {
      consecutiveErrors += 1
      if (consecutiveErrors >= 6) {
        throw e
      }
      await sleep(baseInterval)
      continue
    }

    const m = poll.data && poll.data.message
    if (!m) {
      await sleep(baseInterval)
      continue
    }
    if (m.status === 'succeeded') {
      return { code: 0, desc: 'success', message: m }
    }
    if (m.status === 'failed') {
      throw new Error(m.error || '生成失败，请重试')
    }
    await sleep(m.retry_after_ms || baseInterval)
  }
}

/**
 * 若响应为异步任务则轮询；否则原样返回（同步兜底路径）。
 */
export async function resolveCreateCharacterResult(http, responseData, opts = {}) {
  const envelope = responseData && responseData.message
  if (!(envelope && envelope.async && envelope.task_id)) {
    return responseData
  }
  return pollCreateCharacterTask(http, envelope.task_id, {
    pollIntervalMs: envelope.poll_interval_ms,
    apiBaseUrl: opts.apiBaseUrl,
    maxWaitMs: computePollMaxWaitMs(envelope),
    headers: opts.headers
  })
}

/**
 * POST /create-character 并解析结果。
 *
 * 默认异步（不传 sync: true）：提交超时 60s，收到 task_id 后按 estimated_wait_sec 轮询 180～240s。
 * 仅当 opts.sync === true 时走同步兜底：带参考图 140s、纯文 330s，并附带 sync: true。
 *
 * @returns {Promise<Object>} 归一化后的 { code, desc, message }
 */
export async function postCreateCharacter(http, requestData, opts = {}) {
  const sync = opts.sync === true
  const url = resolveApiUrl(opts.apiBaseUrl)
  const body = sync ? { ...requestData, sync: true } : { ...requestData }
  const timeout = sync
    ? (hasReferenceImages(requestData)
      ? SYNC_POST_TIMEOUT_WITH_REFS_MS
      : SYNC_POST_TIMEOUT_TEXT_ONLY_MS)
    : ASYNC_SUBMIT_TIMEOUT_MS

  const response = await http.post(url, body, {
    headers: buildAuthHeaders(opts.headers),
    timeout,
    ...(opts.axiosConfig || {})
  })

  return resolveCreateCharacterResult(http, response.data, {
    apiBaseUrl: opts.apiBaseUrl,
    headers: opts.headers
  })
}
