export function originalImageExtension(mime = '', url = '') {
  const formats = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
  const type = mime.split(';')[0].toLowerCase()
  if (formats[type]) return formats[type]
  const match = url.split(/[?#]/)[0].match(/\.(png|jpe?g|webp|gif|avif)$/i)
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'png'
}

async function decodeImage(blob) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob)
  const url = URL.createObjectURL(blob)
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('图片解码失败'))
      image.src = url
    })
  } finally { URL.revokeObjectURL(url) }
}

/** Convert only at download time; never resize or rewrite the stored illustration. */
export async function fetchIllustrationPng(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const blob = await response.blob()
  const signature = new Uint8Array(await blob.slice(0, 8).arrayBuffer())
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte)) {
    return blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' })
  }
  const image = await decodeImage(blob)
  const canvas = document.createElement('canvas')
  try {
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const context = canvas.getContext('2d')
    if (!context || !canvas.width || !canvas.height) throw new Error('图片转换失败')
    context.drawImage(image, 0, 0)
    return await new Promise((resolve, reject) => {
      canvas.toBlob(png => png ? resolve(png) : reject(new Error('PNG 转换失败')), 'image/png')
    })
  } finally {
    image.close?.()
    canvas.width = canvas.height = 0
  }
}
