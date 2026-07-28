import { checkWebPSupport } from '@/utils/imageOptimizer'

const DEFAULTS = {
  maxWidth: 450,
  maxHeight: 450,
  maxSizeKB: 80,
  initialQuality: 0.85,
  minQuality: 0.35,
  qualityStep: 0.08,
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

function fitDimensions(width, height, maxWidth, maxHeight) {
  let w = width
  let h = height
  if (w <= maxWidth && h <= maxHeight) return { width: w, height: h }
  const ratio = Math.min(maxWidth / w, maxHeight / h)
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  }
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('图片压缩失败'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}

/**
 * 将图片文件压缩并转为 WebP（不支持 WebP 时回退 JPEG）。
 * @param {File|Blob} file
 * @param {object} [options]
 * @returns {Promise<{ blob: Blob, width: number, height: number, sizeKB: number, mimeType: string, previewUrl: string }>}
 */
export async function compressImageToWebp(file, options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const img = await loadImageFromFile(file)
  const { width, height } = fitDimensions(img.width, img.height, opts.maxWidth, opts.maxHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  const supportsWebP = await checkWebPSupport()
  const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg'
  const maxBytes = opts.maxSizeKB * 1024

  let quality = opts.initialQuality
  let blob = await canvasToBlob(canvas, mimeType, quality)

  while (blob.size > maxBytes && quality > opts.minQuality) {
    quality = Math.max(opts.minQuality, quality - opts.qualityStep)
    blob = await canvasToBlob(canvas, mimeType, quality)
  }

  const previewUrl = URL.createObjectURL(blob)

  return {
    blob,
    width,
    height,
    sizeKB: Math.round((blob.size / 1024) * 10) / 10,
    mimeType,
    previewUrl,
  }
}

export function revokePreviewUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
