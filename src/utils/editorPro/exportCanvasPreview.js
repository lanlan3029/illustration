import { canvasHasUserContent } from '@/utils/editorPro/localDraft'

const STYLE_TRANSFER_KEY = 'styleTransferContentImage'

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
 * @param {import('fabric').Canvas} canvas
 * @param {typeof import('fabric').fabric} fabric
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

/**
 * 导出编辑器画布为 data URL，供 AI 优化 / 上传使用
 * @param {object} canvasEditor
 * @param {{ jpegQuality?: number, preferJpeg?: boolean, fabric?: object }} [opts]
 * @returns {Promise<string>}
 */
export async function exportCanvasPreview(canvasEditor, opts = {}) {
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

  const fabricLib = opts.fabric || canvasEditor?.fabric
  if (fabricLib) {
    await refreshCrossOriginImages(canvas, fabricLib)
  }

  let dataUrl
  try {
    dataUrl = await canvasEditor.preview()
  } catch (err) {
    const wrapped = new Error(
      err?.name === 'SecurityError' ? 'CORS_TAINTED' : 'EXPORT_FAILED'
    )
    wrapped.code = err?.name === 'SecurityError' ? 'CORS_TAINTED' : 'EXPORT_FAILED'
    wrapped.cause = err
    throw wrapped
  }

  if (!dataUrl || typeof dataUrl !== 'string') {
    const err = new Error('EXPORT_EMPTY')
    err.code = 'EXPORT_EMPTY'
    throw err
  }

  const quality = opts.jpegQuality ?? 0.88
  if (dataUrl.startsWith('data:image/png') && dataUrl.length > 1.5 * 1024 * 1024) {
    try {
      dataUrl = await pngDataUrlToJpeg(dataUrl, quality)
    } catch (_) {
      /* 压缩失败仍用 PNG */
    }
  } else if (opts.preferJpeg && dataUrl.startsWith('data:image/png')) {
    try {
      dataUrl = await pngDataUrlToJpeg(dataUrl, quality)
    } catch (_) {
      /* keep png */
    }
  }

  return dataUrl
}

/** 写入 AI 优化跳转用的暂存图（localStorage 满则降级 sessionStorage） */
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
