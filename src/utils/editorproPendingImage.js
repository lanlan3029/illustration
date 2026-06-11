/** 从「我的插画」等入口带入 editorpro 的待编辑图片（sessionStorage，一次性读取） */
const IMAGE_KEY = 'editorpro_pending_image'
const META_KEY = 'editorpro_pending_meta'

export function setEditorproPendingImage(url, meta = {}) {
  if (!url) return
  sessionStorage.setItem(IMAGE_KEY, url)
  if (meta && Object.keys(meta).length > 0) {
    sessionStorage.setItem(META_KEY, JSON.stringify(meta))
  }
}

export function takeEditorproPendingImage() {
  const url = sessionStorage.getItem(IMAGE_KEY) || ''
  sessionStorage.removeItem(IMAGE_KEY)
  let meta = null
  const raw = sessionStorage.getItem(META_KEY)
  sessionStorage.removeItem(META_KEY)
  if (raw) {
    try {
      meta = JSON.parse(raw)
    } catch (e) {
      meta = null
    }
  }
  return { url, meta }
}
