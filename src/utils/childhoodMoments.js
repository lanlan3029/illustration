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

/** 艺术画廊展墙布局（12 列网格，循环复用） */
export const EXHIBIT_LAYOUTS = [
  { gridColumn: '1 / 6', gridRow: 'span 2', rotate: -1.8, size: 'lg', offsetY: 0 },
  { gridColumn: '7 / 11', gridRow: 'span 1', rotate: 1.2, size: 'sm', offsetY: 32 },
  { gridColumn: '11 / 13', gridRow: 'span 2', rotate: -0.8, size: 'md', offsetY: 8 },
  { gridColumn: '2 / 5', gridRow: 'span 1', rotate: 2.1, size: 'sm', offsetY: 24 },
  { gridColumn: '5 / 10', gridRow: 'span 2', rotate: -1.2, size: 'lg', offsetY: 0 },
  { gridColumn: '10 / 13', gridRow: 'span 1', rotate: 0.6, size: 'md', offsetY: 40 },
  { gridColumn: '1 / 4', gridRow: 'span 1', rotate: -2.4, size: 'sm', offsetY: 16 },
  { gridColumn: '4 / 9', gridRow: 'span 2', rotate: 1.5, size: 'lg', offsetY: 0 },
]

export function getExhibitLayout(index) {
  return EXHIBIT_LAYOUTS[index % EXHIBIT_LAYOUTS.length]
}

/** 画廊 SVG 相框样式（对应三张参考框） */
export const FRAME_VARIANTS = ['oval-gold', 'scroll-blue', 'scroll-purple']

export function getFrameVariant(index) {
  return FRAME_VARIANTS[index % FRAME_VARIANTS.length]
}

export function getIllustrationUrl(item) {
  if (!item) return ''
  let picture = item.content || item.picture || item.image_url || item.url || item.image
  if (!picture) return ''
  if (typeof picture === 'string') {
    if (picture.startsWith('http') || picture.startsWith('data:')) return picture
    return `https://static.kidstory.cc/${picture}`
  }
  if (typeof picture === 'object' && picture.url) return picture.url
  return ''
}
