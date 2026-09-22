/** 幸福童年时刻收集 — 活动页常量 */

export const ILL_TYPE = '童年时刻'

/** Gallery 同时展示旧「春节」主题作品，兼容历史数据 */
export const ILL_TYPES_GALLERY = ['童年时刻', '春节']

export const STORAGE_KEY = 'childhood_moment_image'

export const ART_STYLE =
  '温暖童书插画，柔和水彩质感，自然柔光，幸福童年日常瞬间，治愈真实，画面干净，无文字无水印'

export function buildChildhoodPrompt(scene) {
  const text = (scene || '').trim()
  if (!text) return ''
  return `${text}，${ART_STYLE}`
}

export function buildCollectTitle(index) {
  return `童年时刻·第${index}张`
}

export const SHARE = {
  title: '幸福童年时刻收集',
  desc: '把珍贵童年瞬间贴进收集墙，一起来收集吧',
}

function normalizeIllustrationUrl(picture) {
  if (!picture || typeof picture !== 'string') return ''
  const value = picture.trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image')) {
    return value
  }
  return `https://static.kidstory.cc/${value.replace(/^\//, '')}`
}

/** 排除纯文本 description，只认图片路径或 URL */
export function looksLikeImageUrl(value) {
  if (!value || typeof value !== 'string') return false
  const v = value.trim()
  if (v.length < 4) return false
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:image')) return true
  if (/\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(v)) return true
  // 静态资源路径（无中文）
  if (v.includes('/') && !/[\u4e00-\u9fff]/.test(v)) return true
  return false
}

export function getIllustrationUrl(item) {
  if (!item) return ''
  const candidates = [item.picture, item.image_url, item.image, item.url, item.content]
  for (const picture of candidates) {
    if (!picture) continue
    if (typeof picture === 'object' && picture.url) {
      return normalizeIllustrationUrl(picture.url)
    }
    if (typeof picture === 'string' && looksLikeImageUrl(picture)) {
      return normalizeIllustrationUrl(picture)
    }
  }
  return ''
}

export function hasIllustration(item) {
  const url = getIllustrationUrl(item)
  return !!url && url.length > 8
}
