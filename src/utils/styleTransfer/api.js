/**
 * AI 优化：图生图，与 AI 生图共用 POST /create-character
 */
import {
  postCreateCharacter,
  isCreateCharacterResponseOk,
  resolveGenerationImageUrl,
  DEFAULT_API_ORIGIN,
} from '@/utils/createCharacterTask'
import { compressDataUrlForUpload } from '@/utils/moodDiary/posterUpload'

const ASPECT_CANDIDATES = [
  [1, 1],
  [3, 2],
  [2, 3],
  [4, 3],
  [3, 4],
  [5, 4],
  [4, 5],
  [16, 9],
  [9, 16],
]

function resolveApiOrigin(apiBaseUrl) {
  const raw = apiBaseUrl || process.env.VUE_APP_API_BASE_URL || DEFAULT_API_ORIGIN
  return String(raw).replace(/\/$/, '')
}

export function closestAspectRatio(width, height) {
  if (!(width > 0) || !(height > 0)) return '4:3'
  const ratio = width / height
  let best = '4:3'
  let bestDiff = Infinity
  for (const [a, b] of ASPECT_CANDIDATES) {
    const diff = Math.abs(ratio - a / b)
    if (diff < bestDiff) {
      bestDiff = diff
      best = `${a}:${b}`
    }
  }
  return best
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getDataUrlImageSize(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve({ width: 0, height: 0 })
      return
    }
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
      })
    }
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = dataUrl
  })
}

export function buildOptimizationPrompt(userPrompt) {
  const text = String(userPrompt || '').trim()
  return [
    'Based on the provided reference image, optimize it as follows.',
    text,
    'Output a single finished image. Preserve the original subject, composition, and important details unless the instructions above explicitly require layout changes.',
  ].join('\n')
}

function normalizeApiError(raw) {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object') {
    const nested = raw.message ?? raw.msg ?? raw.error ?? raw.desc
    if (nested != null && nested !== raw) {
      const s = normalizeApiError(nested)
      if (s) return s
    }
    try {
      return JSON.stringify(raw)
    } catch (_) {
      return '生成失败，请重试'
    }
  }
  return String(raw)
}

/**
 * @param {import('axios').AxiosInstance} http
 * @param {{ imageFile: File, prompt: string, size?: string, resolution?: string }} payload
 */
export async function generateStyleTransfer(http, payload, opts = {}) {
  const prompt = buildOptimizationPrompt(payload.prompt)
  let image = await fileToDataUrl(payload.imageFile)
  image = await compressDataUrlForUpload(image, 900 * 1024)

  const dims = await getDataUrlImageSize(image)
  const size = payload.size || closestAspectRatio(dims.width, dims.height)

  const requestData = {
    prompt,
    image,
    size,
    model: 'gpt-image-2',
    resolution: payload.resolution || '1k',
    quality: payload.resolution || '1k',
    watermark: false,
  }

  const responseData = await postCreateCharacter(http, requestData, {
    apiBaseUrl: opts.apiBaseUrl,
  })

  if (!isCreateCharacterResponseOk(responseData)) {
    const err = normalizeApiError(
      responseData?.message?.error ?? responseData?.message ?? responseData?.error ?? responseData?.desc
    )
    throw new Error(err || '生成失败，请重试')
  }

  const message = responseData.message || responseData
  const imageUrl = resolveGenerationImageUrl(message, opts.apiBaseUrl, 'image/png')
  if (!imageUrl) throw new Error('响应中未找到图片')

  return { imageUrl, message, prompt }
}
