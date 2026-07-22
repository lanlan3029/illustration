import { DEFAULT_API_ORIGIN, resolveApiOrigin } from '@/utils/createCharacterTask'

export const REMBG_PATH = '/image-segmentation/rembg'
export const REMBG_DEFAULT_TIMEOUT_MS = 120000

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

function buildAuthHeaders(extra = {}) {
  const headers = { ...extra }
  if (headers.Authorization === undefined) {
    const token = localStorage.getItem('token')
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * @param {unknown} data
 * @returns {{ provider: string, imageURL: string, localPath: string, filename: string }}
 */
export function parseRembgResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('抠图失败，请重试')
  }
  const code = data.code
  if (code !== 0 && code !== '0') {
    const msg = data.message
    throw new Error(typeof msg === 'string' ? msg : '抠图失败，请重试')
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
  }
}

/**
 * 上传文件抠图（multipart，字段名 image）
 * @param {import('axios').AxiosInstance} http
 * @param {File|Blob} file
 */
export async function rembgFromFile(http, file, options = {}) {
  const formData = new FormData()
  const blob = file instanceof File ? file : new File([file], 'image.png', { type: file.type || 'image/png' })
  formData.append('image', blob)

  const response = await http.post(getRembgApiUrl(options.apiBaseUrl), formData, {
    headers: buildAuthHeaders({ 'Content-Type': 'multipart/form-data' }),
    timeout: options.timeout ?? REMBG_DEFAULT_TIMEOUT_MS,
  })
  return parseRembgResponse(response.data)
}

/**
 * JSON：{ image_url }
 * @param {import('axios').AxiosInstance} http
 */
export async function rembgFromImageUrl(http, imageUrl, options = {}) {
  const payloadUrl = resolveImageSourceUrl(imageUrl) || imageUrl
  const response = await http.post(
    getRembgApiUrl(options.apiBaseUrl),
    { image_url: payloadUrl },
    {
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      timeout: options.timeout ?? REMBG_DEFAULT_TIMEOUT_MS,
    }
  )
  return parseRembgResponse(response.data)
}

/**
 * JSON：{ image_base64 }
 * @param {import('axios').AxiosInstance} http
 */
export async function rembgFromBase64(http, imageBase64, options = {}) {
  const raw = String(imageBase64 || '').trim()
  const payload = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw.replace(/\s/g, '')}`
  const response = await http.post(
    getRembgApiUrl(options.apiBaseUrl),
    { image_base64: payload },
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

export { DEFAULT_API_ORIGIN }
