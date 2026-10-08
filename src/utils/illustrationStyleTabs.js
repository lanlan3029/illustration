import { isFeaturedIllustrationStyle } from '@/utils/illustrationStyleSort'
import { illustrationStyleCategory, ILLUSTRATION_STYLE_CATEGORY_IDS } from '@/data/illustrationStyleClassification'

/** 精选独立为分类；表现形式分类筛选完整风格列表，all 保留供统计使用。 */
export function stylesForIllustrationTab(tabId, styles, options = {}) {
  let list = Array.isArray(styles) ? styles : []
  if (tabId === 'curated') list = list.filter(isFeaturedIllustrationStyle)
  const category = options.category || (ILLUSTRATION_STYLE_CATEGORY_IDS.includes(tabId) ? tabId : 'all')
  return category === 'all' ? list : list.filter(style => illustrationStyleCategory(style) === category)
}

export function countStylesForIllustrationTab(tabId, styles, options = {}) {
  return stylesForIllustrationTab(tabId, styles, options).length
}

export function visibleIllustrationCategoryIds(styles) {
  const present = new Set((styles || []).map(illustrationStyleCategory))
  return ['curated', ...ILLUSTRATION_STYLE_CATEGORY_IDS.filter(category => present.has(category))]
}
