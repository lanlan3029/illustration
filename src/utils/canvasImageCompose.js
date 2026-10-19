/**
 * 跨域安全拉图 + canvas 图下文案合成。
 *
 * 拉图顺序：
 * 1) 直连 fetch / axios blob（含 api.kidstory.cc 落盘路径）
 * 2) 失败 → GET /create-character/fetch-image?url= 后端代理（绕过 getapib CORS）
 * 3) blob → objectURL → Image → canvas（同源，可 toBlob）
 */

import { DEFAULT_API_ORIGIN, resolveApiOrigin } from '@/utils/createCharacterTask'

function assertImageBlob(blob) {
  if (!blob || !(blob instanceof Blob) || blob.size === 0) {
    throw new Error('图片数据为空')
  }
  if (blob.type && blob.type.includes('application/json')) {
    throw new Error('图片代理返回错误')
  }
  return blob
}

function buildFetchCandidates(imageUrl, apiBaseUrl) {
  const src = String(imageUrl || '').trim()
  if (!src) return []
  const candidates = [src]
  const taskPath = src.match(/(\/upload\/generation-tasks\/[^\s?#]+)/i)
  if (taskPath && taskPath[1]) {
    const origin = resolveApiOrigin(apiBaseUrl) || DEFAULT_API_ORIGIN
    candidates.push(taskPath[1])
    candidates.push(`${origin}${taskPath[1]}`)
  }
  return [...new Set(candidates)]
}

/**
 * 直连失败再走后端代理，返回 Blob。
 * @param {string} imageUrl
 * @param {{ http?: import('axios').AxiosInstance, apiBaseUrl?: string }} [opts]
 */
export async function loadImageBlob(imageUrl, opts = {}) {
  const src = String(imageUrl || '').trim()
  if (!src) throw new Error('无图片地址')
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    const res = await fetch(src)
    if (!res.ok) throw new Error('本地图片读取失败')
    return assertImageBlob(await res.blob())
  }

  const http = opts.http
  const candidates = buildFetchCandidates(src, opts.apiBaseUrl)

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
      })
      if (res.ok) return assertImageBlob(await res.blob())
    } catch (_) {
      /* try next */
    }

    if (http) {
      try {
        const res = await http.get(candidate, {
          responseType: 'blob',
          withCredentials: false,
          timeout: 60000,
        })
        if (res.data) return assertImageBlob(res.data)
      } catch (_) {
        /* try next */
      }
    }
  }

  if (!http) {
    throw new Error('图片跨域无法读取（缺少 http 客户端做代理）')
  }

  const res = await http.get('/create-character/fetch-image', {
    params: { url: src },
    responseType: 'blob',
    timeout: 90000,
  })
  return assertImageBlob(res.data)
}

export function loadHtmlImage(src, { crossOrigin = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/**
 * 图片保留原始像素；字号、留白随图宽缩放，文字区按实际行数展开。
 */
export function composeCanvasWithText(img, text) {
  const imageHeight = img.naturalHeight || img.height
  const imageWidth = img.naturalWidth || img.width
  const canvas = document.createElement('canvas')
  canvas.width = imageWidth
  const ctx = canvas.getContext('2d')

  // 2048px 宽对应 64px 字号；不同分辨率和横竖图保持相同阅读比例。
  const fontSize = imageWidth / 32
  const padding = imageWidth / 32
  const verticalPadding = fontSize * 0.8
  const lineHeight = fontSize * 1.6
  const maxTextWidth = imageWidth - padding * 2
  const font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif`
  const content = text == null ? '' : String(text).trim()
  ctx.font = font

  const lines = []
  if (content) {
    for (const paragraph of content.split(/\r\n|\r|\n/)) {
      let currentLine = ''
      for (const character of paragraph) {
        const testLine = currentLine + character
        if (currentLine && ctx.measureText(testLine).width > maxTextWidth) {
          lines.push(currentLine)
          currentLine = character
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)
    }
  }

  const textAreaHeight = lines.length
    ? Math.ceil(verticalPadding * 2 + lines.length * lineHeight)
    : 0
  // 设置高度会重置 context 状态，因此在最终画布尺寸确定后重新设置文字样式。
  canvas.height = imageHeight + textAreaHeight
  ctx.drawImage(img, 0, 0, imageWidth, imageHeight)
  if (!lines.length) return canvas

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, imageHeight, imageWidth, textAreaHeight)
  ctx.fillStyle = '#333333'
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  lines.forEach((line, index) => {
    ctx.fillText(line, padding, imageHeight + verticalPadding + index * lineHeight)
  })
  return canvas
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('生成图片失败'))),
        'image/png',
        0.95
      )
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 拉图（直连→代理）后拼「图 + 底部文字」，返回 PNG Blob。
 * @param {string} imageUrl
 * @param {string} text
 * @param {{ http?: import('axios').AxiosInstance, apiBaseUrl?: string }} [opts]
 */
export async function createImageWithText(imageUrl, text, opts = {}) {
  const blob = await loadImageBlob(imageUrl, opts)
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await loadHtmlImage(objectUrl)
    const canvas = composeCanvasWithText(img, text)
    return await canvasToPngBlob(canvas)
  } finally {
    try {
      URL.revokeObjectURL(objectUrl)
    } catch (_) {
      /* ignore */
    }
  }
}
