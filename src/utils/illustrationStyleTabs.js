import { isFeaturedIllustrationStyle } from '@/utils/illustrationStyleSort'
import { illustrationStyleCategory, ILLUSTRATION_STYLE_CATEGORY_IDS } from '@/data/illustrationStyleClassification'

export const ILLUSTRATION_MAIN_TAB_IDS = ['curated', 'all']

/** 精选/全部是浏览范围，category 是统一的表现形式筛选。 */
export function stylesForIllustrationTab(tabId, styles, options = {}) {
  let list = Array.isArray(styles) ? styles : []
  if (tabId === 'curated') list = list.filter(isFeaturedIllustrationStyle)
  const category = options.category || (ILLUSTRATION_STYLE_CATEGORY_IDS.includes(tabId) ? tabId : 'all')
  return category === 'all' ? list : list.filter(style => illustrationStyleCategory(style) === category)
}

export function countStylesForIllustrationTab(tabId, styles, options = {}) {
  return stylesForIllustrationTab(tabId, styles, options).length
}

export function visibleIllustrationMainTabIds() {
  return ILLUSTRATION_MAIN_TAB_IDS
}

export function visibleIllustrationCategoryIds(styles) {
  const present = new Set((styles || []).map(illustrationStyleCategory))
  return ILLUSTRATION_STYLE_CATEGORY_IDS.filter(category => present.has(category))
}
