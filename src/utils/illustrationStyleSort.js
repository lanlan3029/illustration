/** KidStory 内置精选风格 id 1–37（与 handraw 全库 1001+ 区分） */
export const FEATURED_STYLE_ID_MIN = 1
export const FEATURED_STYLE_ID_MAX = 37

export function isFeaturedIllustrationStyle(style) {
  const id = Number(style?.id)
  return Number.isFinite(id) && id >= FEATURED_STYLE_ID_MIN && id <= FEATURED_STYLE_ID_MAX
}

/** 列表默认顺序：精选 id 升序，其余按 sort_order / id */
export function sortStylesFeaturedFirst(list) {
  if (!Array.isArray(list) || !list.length) return []
  const featured = []
  const rest = []
  for (const s of list) {
    if (isFeaturedIllustrationStyle(s)) featured.push(s)
    else rest.push(s)
  }
  featured.sort((a, b) => Number(a.id) - Number(b.id))
  rest.sort((a, b) => {
    const sa = Number(a.sort_order ?? a.id) || 0
    const sb = Number(b.sort_order ?? b.id) || 0
    return sa - sb || Number(a.id) - Number(b.id)
  })
  return [...featured, ...rest]
}
