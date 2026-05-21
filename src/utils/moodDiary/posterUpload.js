/** 上传 /ill/ 时单图目标体积（略低于常见 1MB 网关限制） */
const UPLOAD_TARGET_BYTES = 980 * 1024
const UPLOAD_HARD_LIMIT_BYTES = 1000 * 1024

/**
 * 压缩 data URL 以便上传（JPEG，限制最长边）
 * @param {string} dataUrl
 * @param {number} [maxBytes]
 */
export async function compressDataUrlForUpload(dataUrl, maxBytes = UPLOAD_TARGET_BYTES) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl
  try {
    const blob = await fetch(dataUrl).then((r) => r.blob())
    if (blob.size <= maxBytes) return dataUrl
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        const maxDim = 1400
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        let quality = 0.85
        const tryCanvas = () => {
          canvas.toBlob(
            (out) => {
              if (!out) {
                resolve(dataUrl)
                return
              }
              if (out.size <= maxBytes || quality <= 0.35) {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(out)
              } else {
                quality = Math.max(0.35, quality - 0.12)
                tryCanvas()
              }
            },
            'image/jpeg',
            quality
          )
        }
        tryCanvas()
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  } catch (e) {
    console.warn('[mood-diary] compress poster for upload failed', e)
    return dataUrl
  }
}

async function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((r) => r.blob())
}

async function remoteUrlToBlob(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('fetch image failed')
  return res.blob()
}

/**
 * 将海报 data URL / 远程 URL 转为可上传 Blob（multipart）
 * @param {string} pictureValue
 * @param {number} [maxBytes]
 */
export async function resolvePictureUploadBlob(pictureValue, maxBytes = UPLOAD_TARGET_BYTES) {
  if (!pictureValue) throw new Error('picture missing')

  let source = pictureValue
  if (
    source &&
    !source.startsWith('http://') &&
    !source.startsWith('https://') &&
    !source.startsWith('data:')
  ) {
    source = `https://static.kidstory.cc/${source.replace(/^\//, '')}`
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    const blob = await remoteUrlToBlob(source)
    if (blob.size <= maxBytes) return blob
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    source = await compressDataUrlForUpload(dataUrl, maxBytes)
    return dataUrlToBlob(source)
  }

  let compact = await compressDataUrlForUpload(source, maxBytes)
  let blob = await dataUrlToBlob(compact)
  if (blob.size > UPLOAD_HARD_LIMIT_BYTES) {
    compact = await compressDataUrlForUpload(compact, 900 * 1024)
    blob = await dataUrlToBlob(compact)
  }
  return blob
}
