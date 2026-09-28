/** handraw-style 279 条编号 → A–H 分组（与上游 styles.json 一致） */
export const HANDRAW_ID_OFFSET = 1000
export const HANDRAW_NUMBER_MAX = 279

export const HANDRAW_GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

/** @type {Record<string, { min: number, max: number }>} */
export const HANDRAW_GROUP_RANGES = {
  A: { min: 1, max: 35 },
  B: { min: 36, max: 54 },
  C: { min: 55, max: 82 },
  D: { min: 83, max: 123 },
  E: { min: 124, max: 154 },
  F: { min: 155, max: 200 },
  G: { min: 201, max: 216 },
  H: { min: 217, max: 279 },
}

export function handrawNumberFromStyle(style) {
  if (!style) return 0
  const id = Number(style.id)
  if (Number.isFinite(id) && id > HANDRAW_ID_OFFSET && id <= HANDRAW_ID_OFFSET + HANDRAW_NUMBER_MAX) {
    return id - HANDRAW_ID_OFFSET
  }
  if (style.handrawNo) {
    const fromField = parseInt(String(style.handrawNo).replace(/^0+/, '') || '0', 10)
    if (fromField > 0) return fromField
  }
  const m = String(style.key || '').match(/^handraw(\d{3})/i)
  if (m) return parseInt(m[1], 10)
  return 0
}

export function handrawGroupFromNumber(n) {
  const num = Number(n)
  if (!Number.isFinite(num) || num < 1) return ''
  for (const letter of HANDRAW_GROUP_LETTERS) {
    const { min, max } = HANDRAW_GROUP_RANGES[letter]
    if (num >= min && num <= max) return letter
  }
  return ''
}

export function isHandrawFullLibraryStyle(style) {
  const id = Number(style?.id)
  return Number.isFinite(id) && id > HANDRAW_ID_OFFSET && id <= HANDRAW_ID_OFFSET + HANDRAW_NUMBER_MAX
}

/** 含精选 37–48 与全量 1001–1279 */
export function isHandrawLibraryStyle(style) {
  if (isHandrawFullLibraryStyle(style)) return true
  const num = handrawNumberFromStyle(style)
  if (num >= 1 && num <= HANDRAW_NUMBER_MAX && /^handraw/i.test(String(style?.key || ''))) {
    return true
  }
  return false
}

export function enrichHandrawMeta(style) {
  if (!style || typeof style !== 'object') return style
  const num = handrawNumberFromStyle(style)
  const handrawGroup = handrawGroupFromNumber(num)
  const handrawNo = num ? String(num).padStart(3, '0') : (style.handrawNo || '')
  return { ...style, handrawNo, handrawGroup }
}
