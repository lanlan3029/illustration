import { DEFAULT_API_ORIGIN, resolveApiOrigin } from '@/utils/createCharacterTask'

export const REMBG_PATH = '/image-segmentation/rembg'
export const REMBG_STATUS_PATH = '/image-segmentation/status'
export const REMBG_DEFAULT_TIMEOUT_MS = 120000
export const REMBG_MODE_STORAGE_KEY = 'kidstory_rembg_mode'
export const DEFAULT_REMBG_MODE = 'subject'

/** 后端不可用时的默认模式列表 */
export const DEFAULT_REMBG_MODES = [
  { value: 'subject', label: '抠出主体', desc: '人像、实物' },
  { value: 'background', label: '删除背景', desc: '插画、拼贴、浅色元素' },
  { value: 'hard_edge', label: '利落切边', desc: '要干净硬边时' },
]

/** 相对路径 → 可加载的完整 URL（供 image_url JSON 提交） */
export function resolveImageSourceUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `https://static.kidstory.cc${url}`
  return `https://static.kidstory.cc/${String(url).replace(/^\/+/, '')}`
}

export function getRembgApiUrl(apiBaseUrl) {
  return `${resolveApiOrigin(apiBaseUrl)}${REMBG_PATH}`
}

export function getRembgStatusUrl(apiBaseUrl) {
  return `${resolveApiOrigin(apiBaseUrl)}${REMBG_STATUS_PATH}`
}

function buildAuthHeaders(extra = {}) {
  const headers = { ...extra }
  if (headers.Authorization === undefined) {
    const token = localStorage.getItem('token')
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export function normalizeRembgMode(mode) {
  const v = String(mode || '').trim()
  if (!v) return DEFAULT_REMBG_MODE
  return v
}

export function readStoredRembgMode() {
  try {
    return normalizeRembgMode(localStorage.getItem(REMBG_MODE_STORAGE_KEY))
  } catch {
    return DEFAULT_REMBG_MODE
  }
}

export function storeRembgMode(mode) {
  try {
    localStorage.setItem(REMBG_MODE_STORAGE_KEY, normalizeRembgMode(mode))
  } catch {
    /* ignore */
  }
}

/**
 * @param {unknown} data
 * @returns {string|null}
 */
export function extractRembgErrorMessage(data) {
  if (!data || typeof data !== 'object') return null
  if (typeof data.desc === 'string' && data.desc.trim()) return data.desc.trim()
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim()
  return null
}

/**
 * @param {unknown} data
 * @returns {{ provider: string, imageURL: string, localPath: string, filename: string, mode: string, modeLabel: string }}
 */
export function parseRembgResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('抠图失败，请重试')
  }
  const code = data.code
  if (code !== 0 && code !== '0') {
    throw new Error(extractRembgErrorMessage(data) || '抠图失败，请重试')
  }
  const message = data.message && typeof data.message === 'object' ? data.message : {}
  const imageURL = message.imageURL || message.image_url
  if (!imageURL) {
    throw new Error('未找到抠图结果')
  }
  return {
    provider: message.provider || 'rembg',
    imageURL,
    localPath: message.localPath || message.local_path || '',
    filename: message.filename || '',
    mode: message.mode || '',
    modeLabel: message.mode_label || message.modeLabel || '',
  }
}

/**
 * GET /image-segmentation/status → message.rembg.modes
 * @param {import('axios').AxiosInstance} http
 */
export async function fetchRembgModes(http, options = {}) {
  try {
    const response = await http.get(getRembgStatusUrl(options.apiBaseUrl), {
      headers: buildAuthHeaders(),
      timeout: options.timeout ?? 10000,
    })
    const modes = response?.data?.message?.rembg?.modes
    if (Array.isArray(modes) && modes.length) {
      return modes
        .filter((item) => item && item.value)
        .map((item) => ({
          value: String(item.value),
          label: item.label || item.value,
          desc: item.desc || '',
        }))
    }
  } catch (e) {
    console.warn('[rembg] fetch modes failed, using defaults', e)
  }
  return DEFAULT_REMBG_MODES.slice()
}

function appendModeToFormData(formData, options) {
  formData.append('mode', normalizeRembgMode(options.mode))
}

function modePayload(options) {
  return { mode: normalizeRembgMode(options.mode) }
}

/**
 * 上传文件抠图（multipart：image + mode）
 * @param {import('axios').AxiosInstance} http
 * @param {File|Blob} file
 */
export async function rembgFromFile(http, file, options = {}) {
  const formData = new FormData()
  const blob = file instanceof File ? file : new File([file], 'image.png', { type: file.type || 'image/png' })
  formData.append('image', blob)
  appendModeToFormData(formData, options)

  const response = await http.post(getRembgApiUrl(options.apiBaseUrl), formData, {
    headers: buildAuthHeaders({ 'Content-Type': 'multipart/form-data' }),
    timeout: options.timeout ?? REMBG_DEFAULT_TIMEOUT_MS,
  })
  return parseRembgResponse(response.data)
}

/**
 * JSON：{ image_url, mode }
 * @param {import('axios').AxiosInstance} http
 */
export async function rembgFromImageUrl(http, imageUrl, options = {}) {
  const payloadUrl = resolveImageSourceUrl(imageUrl) || imageUrl
  const response = await http.post(
    getRembgApiUrl(options.apiBaseUrl),
    { image_url: payloadUrl, ...modePayload(options) },
    {
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      timeout: options.timeout ?? REMBG_DEFAULT_TIMEOUT_MS,
    }
  )
  return parseRembgResponse(response.data)
}

/**
 * JSON：{ image_base64, mode }
 * @param {import('axios').AxiosInstance} http
 */
export async function rembgFromBase64(http, imageBase64, options = {}) {
  const raw = String(imageBase64 || '').trim()
  const payload = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw.replace(/\s/g, '')}`
  const response = await http.post(
    getRembgApiUrl(options.apiBaseUrl),
    { image_base64: payload, ...modePayload(options) },
    {
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      timeout: options.timeout ?? REMBG_DEFAULT_TIMEOUT_MS,
    }
  )
  return parseRembgResponse(response.data)
}

/**
 * 按输入类型自动选择 rembg 调用方式
 * @param {import('axios').AxiosInstance} http
 * @param {string|File|Blob} imageSource
 */
export async function rembgFromImageSource(http, imageSource, options = {}) {
  if (imageSource instanceof File || imageSource instanceof Blob) {
    return rembgFromFile(http, imageSource, options)
  }
  if (typeof imageSource === 'string') {
    if (imageSource.startsWith('data:')) {
      return rembgFromBase64(http, imageSource, options)
    }
    return rembgFromImageUrl(http, imageSource, options)
  }
  throw new Error('无效的图片输入')
}

/**
 * 从 axios 错误中提取后端 message / desc
 * @param {unknown} error
 */
export function formatRembgRequestError(error, fallback = '抠图失败，请重试') {
  const data = error?.response?.data
  const apiMsg = extractRembgErrorMessage(data)
  if (apiMsg) return apiMsg
  if (error?.code === 'ECONNABORTED' || String(error?.message || '').includes('timeout')) {
    return '请求超时，请检查网络或稍后重试'
  }
  if (error?.message) return error.message
  return fallback
}

export { DEFAULT_API_ORIGIN }
