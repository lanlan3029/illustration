import { canvasHasUserContent } from '@/utils/editorPro/localDraft'
import { compressDataUrlForUpload } from '@/utils/moodDiary/posterUpload'

const STYLE_TRANSFER_KEY = 'styleTransferContentImage'

/** 本地下载 PNG：相对逻辑画布 2 倍像素 */
export const CANVAS_DOWNLOAD_MULTIPLIER = 2
/** 上传 / 预览：1 倍即可，后续再压体积 */
export const CANVAS_UPLOAD_MULTIPLIER = 1
/** 与 /ill/、/character 等接口网关限制对齐 */
export const CANVAS_UPLOAD_MAX_BYTES = 980 * 1024

function pngDataUrlToJpeg(pngDataUrl, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas context unavailable'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = pngDataUrl
  })
}

/**
 * 尝试把外链图片以 crossOrigin 重新载入，降低 canvas 污染导致 toDataURL 失败的概率
 */
async function refreshCrossOriginImages(canvas, fabric) {
  if (!canvas || !fabric) return
  const objects = canvas.getObjects().filter((o) => o && o.type === 'image')
  const tasks = objects.map((obj) => {
    const src =
      (typeof obj.getSrc === 'function' && obj.getSrc()) ||
      obj._originalElement?.src ||
      obj.src ||
      ''
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      fabric.Image.fromURL(
        src,
        (img) => {
          try {
            obj.setElement(img.getElement())
            obj.set({ crossOrigin: 'anonymous' })
          } catch (_) {
            /* keep original */
          }
          resolve()
        },
        { crossOrigin: 'anonymous' }
      )
    })
  })
  if (tasks.length) {
    await Promise.all(tasks)
    canvas.requestRenderAll()
  }
}

function assertCanvasExportable(canvasEditor) {
  if (!canvasEditor || typeof canvasEditor.preview !== 'function') {
    const err = new Error('EDITOR_NOT_READY')
    err.code = 'EDITOR_NOT_READY'
    throw err
  }
  const canvas = canvasEditor.canvas || canvasEditor.fabricCanvas
  if (!canvas || typeof canvas.getObjects !== 'function') {
    const err = new Error('CANVAS_MISSING')
    err.code = 'CANVAS_MISSING'
    throw err
  }
  const workspace = canvas.getObjects().find((o) => o && o.id === 'workspace')
  if (!workspace) {
    const err = new Error('WORKSPACE_MISSING')
    err.code = 'WORKSPACE_MISSING'
    throw err
  }
  if (!canvasHasUserContent(canvas)) {
    const err = new Error('CANVAS_EMPTY')
    err.code = 'CANVAS_EMPTY'
    throw err
  }
  return { canvas, canvasEditor }
}

async function exportRawPng(canvasEditor, opts = {}) {
  const { canvas } = assertCanvasExportable(canvasEditor)
  const fabricLib = opts.fabric || canvasEditor?.fabric
  if (fabricLib) {
    await refreshCrossOriginImages(canvas, fabricLib)
  }

  const multiplier = opts.multiplier ?? CANVAS_UPLOAD_MULTIPLIER
  try {
    const dataUrl = await canvasEditor.preview({
      multiplier,
      format: 'png',
      quality: 1,
    })
    if (!dataUrl || typeof dataUrl !== 'string') {
      const err = new Error('EXPORT_EMPTY')
      err.code = 'EXPORT_EMPTY'
      throw err
    }
    return dataUrl
  } catch (err) {
    const wrapped = new Error(
      err?.name === 'SecurityError' ? 'CORS_TAINTED' : 'EXPORT_FAILED'
    )
    wrapped.code = err?.name === 'SecurityError' ? 'CORS_TAINTED' : 'EXPORT_FAILED'
    wrapped.cause = err
    throw wrapped
  }
}

/** 本地下载：2× PNG，清晰 */
export async function exportCanvasForDownload(canvasEditor, opts = {}) {
  return exportRawPng(canvasEditor, {
    ...opts,
    multiplier: opts.multiplier ?? CANVAS_DOWNLOAD_MULTIPLIER,
  })
}

/** 上传服务器：1× PNG → 压 JPEG，控制体积 */
export async function exportCanvasForUpload(canvasEditor, opts = {}) {
  const raw = await exportRawPng(canvasEditor, {
    ...opts,
    multiplier: opts.multiplier ?? CANVAS_UPLOAD_MULTIPLIER,
  })
  const maxBytes = opts.maxBytes ?? CANVAS_UPLOAD_MAX_BYTES
  try {
    return await compressDataUrlForUpload(raw, maxBytes)
  } catch (_) {
    if (opts.preferJpeg !== false && raw.startsWith('data:image/png')) {
      try {
        return await pngDataUrlToJpeg(raw, opts.jpegQuality ?? 0.88)
      } catch (e) {
        return raw
      }
    }
    return raw
  }
}

/**
 * 通用导出（默认走上传压缩；AI 优化等场景）
 * @param {object} canvasEditor
 * @param {{ purpose?: 'download'|'upload', fabric?: object, jpegQuality?: number, maxBytes?: number }} [opts]
 */
export async function exportCanvasPreview(canvasEditor, opts = {}) {
  if (opts.purpose === 'download') {
    return exportCanvasForDownload(canvasEditor, opts)
  }
  return exportCanvasForUpload(canvasEditor, opts)
}

export function stashStyleTransferImage(dataUrl) {
  try {
    localStorage.setItem(STYLE_TRANSFER_KEY, dataUrl)
    sessionStorage.removeItem(STYLE_TRANSFER_KEY)
    return
  } catch (_) {
    /* QuotaExceededError 等 */
  }
  sessionStorage.setItem(STYLE_TRANSFER_KEY, dataUrl)
}

export function peekStyleTransferImage() {
  return (
    localStorage.getItem(STYLE_TRANSFER_KEY) ||
    sessionStorage.getItem(STYLE_TRANSFER_KEY) ||
    null
  )
}

export function clearStyleTransferImage() {
  localStorage.removeItem(STYLE_TRANSFER_KEY)
  sessionStorage.removeItem(STYLE_TRANSFER_KEY)
}
