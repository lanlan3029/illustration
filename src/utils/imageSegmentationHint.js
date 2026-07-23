/** 上传后启发式建议 rembg 模式（不强制切换） */

const LIGHT_LUMA = 0.82
const CREAM_LUMA = 0.75

function pixelLuma(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function isLightPixel(r, g, b) {
  if (pixelLuma(r, g, b) >= LIGHT_LUMA) return true
  // 米白 / 浅奶油色（水彩纸、济州类底）
  if (r >= 235 && g >= 228 && b >= 210 && pixelLuma(r, g, b) >= CREAM_LUMA) return true
  return false
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * 采样图片四边像素，判断是否像插画 / 浅色底
 * @param {string} dataUrl
 * @param {{ mimeType?: string, fileName?: string }} meta
 * @returns {Promise<{ suggestMode: 'background', reason: 'illustration'|'lightBackground' }|null>}
 */
export async function suggestRembgMode(dataUrl, meta = {}) {
  if (!dataUrl) return null

  const mime = meta.mimeType || ''
  const isPng = mime.includes('png') || /\.png$/i.test(meta.fileName || '')

  try {
    const img = await loadImageFromDataUrl(dataUrl)
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return null

    const canvas = document.createElement('canvas')
    const maxSide = 480
    const scale = Math.min(1, maxSide / Math.max(w, h))
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const strip = Math.max(2, Math.round(Math.min(width, height) * 0.08))
    let lightCount = 0
    let total = 0

    const sample = (x, y) => {
      const i = (y * width + x) * 4
      const a = data[i + 3]
      if (a < 128) return
      total += 1
      if (isLightPixel(data[i], data[i + 1], data[i + 2])) lightCount += 1
    }

    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < strip; y += 1) sample(x, y)
      for (let y = height - strip; y < height; y += 1) sample(x, y)
    }
    for (let y = strip; y < height - strip; y += 1) {
      for (let x = 0; x < strip; x += 1) sample(x, y)
      for (let x = width - strip; x < width; x += 1) sample(x, y)
    }

    if (!total) {
      if (isPng) return { suggestMode: 'background', reason: 'illustration' }
      return null
    }

    const lightRatio = lightCount / total

    if (lightRatio >= 0.68) {
      return { suggestMode: 'background', reason: 'lightBackground' }
    }
    if (isPng && lightRatio >= 0.45) {
      return { suggestMode: 'background', reason: 'illustration' }
    }
    return null
  } catch {
    if (isPng) return { suggestMode: 'background', reason: 'illustration' }
    return null
  }
}
