// 统一处理 /create-character 的异步任务模式。
//
// 成功判定：只读 res.data.message（不用外层 statuscode / desc 判断任务是否完成）
//   const done = msg.status === 'succeeded' || msg.image_url || msg.image_base64
// 大图轮询通常只有 image_url（无 image_base64），需拼完整 API 地址展示。
//
// 生产建议：默认异步（短 POST + 轮询），同步仅作 sync: true 兼容兜底。

/** 异步提交：只等任务受理（202），不等上游生图完成 */
export const ASYNC_SUBMIT_TIMEOUT_MS = 60000

/** 单次轮询请求超时 */
export const POLL_REQUEST_TIMEOUT_MS = 15000

/** 轮询总等待下限 */
export const POLL_MIN_WAIT_MS = 180000

/** 轮询总等待上限 */
export const POLL_MAX_WAIT_MS = 240000

/** 同步兜底：带参考图 POST 超时 */
export const SYNC_POST_TIMEOUT_WITH_REFS_MS = 140000

/** 同步兜底：纯文 POST 超时 */
export const SYNC_POST_TIMEOUT_TEXT_ONLY_MS = 330000

/** 无 env 时的 API 根地址（拼接相对 image_url） */
export const DEFAULT_API_ORIGIN = 'https://api.kidstory.cc'

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function hasReferenceImages(requestData) {
  const img = requestData && requestData.image
  if (!img) return false
  if (Array.isArray(img)) return img.length > 0
  return Boolean(img)
}

export function computePollMaxWaitMs(envelope) {
  const sec = envelope && envelope.estimated_wait_sec
  if (typeof sec === 'number' && sec > 0) {
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
 * 从 axios 响应体取出 message 对象。
 * 任务状态只认 res.data.message，不用外层 statuscode。
 */
export function extractTaskMessage(responseData) {
  if (!responseData || typeof responseData !== 'object') return null
  const msg = responseData.message
  return msg && typeof msg === 'object' ? msg : null
}

/** API 根地址，用于拼接相对路径 image_url */
export function resolveApiOrigin(apiBaseUrl) {
  const raw = apiBaseUrl || process.env.VUE_APP_API_BASE_URL || DEFAULT_API_ORIGIN
  return String(raw).replace(/\/$/, '')
}

/**
 * 异步任务是否已完成（仅基于 res.data.message，不看外层 statuscode）。
 * 与后端约定：succeeded | image_url | image_base64 任一即停轮询。
 */
export function isPollTaskComplete(message) {
  if (!message || typeof message !== 'object') return false
  return (
    message.status === 'succeeded' ||
    Boolean(message.image_url) ||
    Boolean(message.image_base64)
  )
}

/**
 * 从 message 解析可展示图片地址（轮询大图优先 image_url）。
 * 相对路径拼到 API 根，例如 upload/generation-tasks/{taskId}/result.png
 */
export function resolveGenerationImageUrl(message, apiBaseUrl, mime = 'image/png') {
  if (!message || typeof message !== 'object') return ''

  if (message.image_base64) {
    const trimmed = String(message.image_base64).trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('data:')) return trimmed
    return `data:${mime};base64,${trimmed.replace(/\s/g, '')}`
  }

  if (message.image_url) {
    const u = String(message.image_url).trim()
    if (!u) return ''
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `${resolveApiOrigin(apiBaseUrl)}/${u.replace(/^\//, '')}`
  }

  return ''
}

export function isPollTaskFailed(message) {
  if (!message) return false
  const status = String(message.status || '').toLowerCase()
  return status === 'failed' || status === 'error' || status === 'cancelled' || status === 'canceled'
}

/**
 * POST/轮询结束后的响应是否可继续取图。
 * 有 message 时优先看 message.status / 图片字段，不用外层 statuscode 判断任务成败。
 */
export function isCreateCharacterResponseOk(responseData) {
  const message = extractTaskMessage(responseData)
  if (message) {
    if (isPollTaskFailed(message)) return false
    if (isPollTaskComplete(message)) return true
  }
  if (responseData && (responseData.code === 0 || responseData.code === '0')) return true
  if (responseData && responseData.desc === 'success') return true
  if (responseData && responseData.statuscode === 'success') return true
  if (
    responseData &&
    (responseData.code !== undefined || responseData.desc !== undefined || responseData.statuscode !== undefined)
  ) {
    return false
  }
  return Boolean(message)
}

function shouldAppendPollDebug(opts = {}) {
  if (opts.debug === true) return true
  try {
    return process.env.VUE_APP_CREATE_CHARACTER_DEBUG === '1'
  } catch (e) {
    return false
  }
}

function resolveTaskPollUrl(taskId, opts = {}) {
  const apiBaseUrl = opts.apiBaseUrl
  let url = opts.pollUrl
  if (url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // absolute poll_url
    } else if (apiBaseUrl) {
      const base = apiBaseUrl.replace(/\/$/, '')
      const path = url.startsWith('/') ? url : `/${url}`
      url = `${base}${path}`
    } else {
      url = url.startsWith('/') ? url : `/${url}`
    }
  } else {
    url = apiBaseUrl
      ? `${apiBaseUrl}/create-character/task/${taskId}`
      : `/create-character/task/${taskId}`
  }
  if (shouldAppendPollDebug(opts)) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}_debug=1`
  }
  return url
}

/**
 * 轮询 GET /create-character/task/:taskId，直到 message 满足完成条件。
 */
export async function pollCreateCharacterTask(http, taskId, opts = {}) {
  const baseInterval = opts.pollIntervalMs || 5000
  const maxWaitMs = opts.maxWaitMs || POLL_MAX_WAIT_MS
  const taskUrl = resolveTaskPollUrl(taskId, opts)
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

    // 成功判定：res.data.message.status 或 message 内图片字段
    const message = extractTaskMessage(poll.data)
    if (!message) {
      await sleep(baseInterval)
      continue
    }

    if (process.env.NODE_ENV !== 'production' && shouldAppendPollDebug(opts)) {
      // eslint-disable-next-line no-console
      console.debug('[create-character/task]', taskId, message.status, message)
    }

    if (isPollTaskComplete(message)) {
      return { code: 0, desc: 'success', message }
    }
    if (isPollTaskFailed(message)) {
      throw new Error(message.error || '生成失败，请重试')
    }

    await sleep(message.retry_after_ms || message.poll_interval_ms || baseInterval)
  }
}

/**
 * POST 响应若为异步任务则轮询；否则原样返回（同步兜底）。
 */
export async function resolveCreateCharacterResult(http, responseData, opts = {}) {
  const message = extractTaskMessage(responseData)
  if (!(message && message.async && message.task_id)) {
    return responseData
  }
  if (isPollTaskComplete(message)) {
    return { code: 0, desc: 'success', message }
  }
  if (isPollTaskFailed(message)) {
    const err = message.error || responseData.desc || '生成失败，请重试'
    const suffix = message.points_refunded ? '（积分已退还）' : ''
    throw new Error(`${err}${suffix}`)
  }
  return pollCreateCharacterTask(http, message.task_id, {
    pollIntervalMs: message.poll_interval_ms,
    pollUrl: message.poll_url,
    apiBaseUrl: opts.apiBaseUrl,
    maxWaitMs: computePollMaxWaitMs(message),
    headers: opts.headers,
    debug: opts.debug
  })
}

/**
 * POST /create-character 并解析结果。
 * 默认异步；opts.sync === true 时走同步兜底。
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
    headers: opts.headers,
    debug: opts.debug
  })
}
