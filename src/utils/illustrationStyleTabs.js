import {
  handrawGroupFromNumber,
  handrawNumberFromStyle,
  isHandrawLibraryStyle,
} from '@/utils/handrawStyleGroups'
import { isFeaturedIllustrationStyle } from '@/utils/illustrationStyleSort'
import { backendCategoryToUiTab } from '@/data/illustrationStyleCategories'

/** AI 插画左侧主 Tab id（顺序即展示优先级） */
export const ILLUSTRATION_MAIN_TAB_IDS = [
  'curated',
  'all',
  'sketch',
  'paint',
  'toon',
  'collage',
  'other',
  'skill',
  'handraw',
]

/**
 * @param {string} tabId
 * @param {object[]} styles
 * @param {{ handrawGroup?: string }} [options]
 */
export function stylesForIllustrationTab(tabId, styles, options = {}) {
  const list = Array.isArray(styles) ? styles : []
  if (tabId === 'curated') {
    return list.filter((s) => isFeaturedIllustrationStyle(s))
  }
  if (tabId === 'all') {
    return list
  }
  if (tabId === 'handraw') {
    let out = list.filter((s) => isHandrawLibraryStyle(s))
    const group = options.handrawGroup
    if (group && group !== 'all') {
      out = out.filter((s) => {
        const g = s.handrawGroup || handrawGroupFromNumber(handrawNumberFromStyle(s))
        return group === 'other' ? g === 'G' || g === 'H' : g === group
      })
    }
    return out
  }
  return list.filter((s) => {
    return backendCategoryToUiTab(s.category) === tabId
  })
}

export function countStylesForIllustrationTab(tabId, styles, options = {}) {
  return stylesForIllustrationTab(tabId, styles, options).length
}

/**
 * @param {object[]} styles
 * @param {{ oaiTemplateCount?: number }} [options]
 * @returns {string[]}
 */
export function visibleIllustrationMainTabIds(styles, options = {}) {
  const oai = Number(options.oaiTemplateCount) || 0
  const ids = []
  for (const tabId of ILLUSTRATION_MAIN_TAB_IDS) {
    if (tabId === 'all') {
      const allCount = countStylesForIllustrationTab('all', styles)
      const curatedCount = countStylesForIllustrationTab('curated', styles)
      if (allCount > curatedCount || oai > 0) ids.push(tabId)
      continue
    }
    if (countStylesForIllustrationTab(tabId, styles) > 0) {
      ids.push(tabId)
    }
  }
  return ids
}
