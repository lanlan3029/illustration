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
 * 图片在上、白底文案在下（高度约为图高的 1/3）。
 */
export function composeCanvasWithText(img, text) {
  const imageHeight = img.height
  const imageWidth = img.width
  const textAreaHeight = Math.floor(imageHeight / 3)
  const canvas = document.createElement('canvas')
  canvas.width = imageWidth
  canvas.height = imageHeight + textAreaHeight
  const ctx = canvas.getContext('2d')

  ctx.drawImage(img, 0, 0, imageWidth, imageHeight)

  const textY = imageHeight
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, textY, imageWidth, textAreaHeight)

  const padding = 40
  const maxTextWidth = imageWidth - padding * 2
  const fontSize = Math.max(24, Math.min(32, Math.floor(imageWidth / 30)))
  const lineHeight = fontSize * 1.6
  const content = text == null ? '' : String(text)

  ctx.fillStyle = '#333333'
  ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const lines = []
  let currentLine = ''
  for (let i = 0; i < content.length; i++) {
    const testLine = currentLine + content[i]
    if (ctx.measureText(testLine).width > maxTextWidth && currentLine !== '') {
      lines.push(currentLine)
      currentLine = content[i]
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const maxLines = Math.max(1, Math.floor((textAreaHeight - padding * 2) / lineHeight))
  const displayLines = lines.slice(0, maxLines)
  const totalTextHeight = displayLines.length * lineHeight
  const startY = textY + (textAreaHeight - totalTextHeight) / 2

  displayLines.forEach((line, index) => {
    ctx.fillText(line, padding, startY + index * lineHeight)
  })

  if (lines.length > maxLines && displayLines.length) {
    const lastLine = displayLines[displayLines.length - 1]
    const lastLineY = startY + (displayLines.length - 1) * lineHeight
    const lastLineWidth = ctx.measureText(lastLine).width
    if (lastLineWidth + ctx.measureText('...').width < maxTextWidth) {
      ctx.fillText('...', padding + lastLineWidth, lastLineY)
    }
  }

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
