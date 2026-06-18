/** 从「我的插画」等入口带入 editorpro 的待编辑图片（内存优先，sessionStorage 作小图兜底） */
const IMAGE_KEY = 'editorpro_pending_image'
const META_KEY = 'editorpro_pending_meta'
const MAX_STORAGE_URL_LEN = 400000

/** 大图 data URL 放内存，避免 sessionStorage 配额溢出导致跳转失败 */
let memoryPending = null

function canPersistUrl(url) {
  return url && (!url.startsWith('data:') || url.length < MAX_STORAGE_URL_LEN)
}

export function setEditorproPendingImage(url, meta = {}) {
  if (!url) return
  memoryPending = { url, meta: meta || {} }
  try {
    sessionStorage.removeItem(IMAGE_KEY)
    sessionStorage.removeItem(META_KEY)
    if (canPersistUrl(url)) {
      sessionStorage.setItem(IMAGE_KEY, url)
    }
    if (meta && Object.keys(meta).length > 0) {
      sessionStorage.setItem(META_KEY, JSON.stringify(meta))
    }
  } catch (e) {
    /* 存储失败不影响内存 handoff */
  }
}

export function takeEditorproPendingImage() {
  if (memoryPending?.url) {
    const out = { url: memoryPending.url, meta: memoryPending.meta || null }
    memoryPending = null
    try {
      sessionStorage.removeItem(IMAGE_KEY)
      sessionStorage.removeItem(META_KEY)
    } catch (e) {
      /* ignore */
    }
    return out
  }

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
