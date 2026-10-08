/**
 * 后端 IllustrationStyle.category 白名单（与 API 一致）。
 */
export const ILLUSTRATION_STYLE_BACKEND_CATEGORIES = [
  'sketch',
  'watercolor',
  'cartoon',
  'flat',
  'oil',
  'pixel',
  'crayon',
  'ink',
  'pastel',
  'marker',
  'digital',
  '3d',
  'collage',
  'other',
  'skill',
]

/** AI 插画页 UI 子 Tab → 后端 category 列表 */
export const UI_TAB_BACKEND_CATEGORIES = {
  sketch: ['sketch', 'ink'],
  paint: ['watercolor', 'oil', 'pastel', 'marker', 'crayon'],
  toon: ['cartoon', 'flat', '3d', 'digital', 'pixel'],
  collage: ['collage'],
  other: ['other'],
  skill: ['skill'],
}

/**
 * @param {string} category 后端 category
 * @returns {'sketch'|'paint'|'toon'|'collage'|'other'|'skill'}
 */
export function backendCategoryToUiTab(category) {
  const c = String(category || '').toLowerCase()
  for (const [tab, list] of Object.entries(UI_TAB_BACKEND_CATEGORIES)) {
    if (list.includes(c)) return tab
  }
  return 'other'
}

/**
 * @param {string} uiTab
 * @param {string} backendCategory
 */
export function styleMatchesUiTab(uiTab, backendCategory) {
  if (!uiTab || uiTab === 'all') return true
  return backendCategoryToUiTab(backendCategory) === uiTab
}
