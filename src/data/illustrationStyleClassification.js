import { backendCategoryToUiTab } from '@/data/illustrationStyleCategories'
import { handrawNumberFromStyle } from '@/utils/handrawStyleGroups'

// 按每条风格的视觉描述与完整提示词人工归类，不沿用来源库的 A–H 或地域分组。
// 一条风格只有一个主分类；纸艺优先按材质归类，国风依据传统笔墨、服饰或纹样。
export const ILLUSTRATION_STYLE_CATEGORY_IDS = ['sketch', 'paint', 'toon', 'collage', 'chinese', 'other', 'skill']

export const HANDRAW_STYLE_CATEGORY_NUMBERS = {
  sketch: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 14, 15, 22, 23, 25, 27, 29, 30, 32, 33, 37, 40, 41, 48, 51, 52,
    69, 70, 73, 76, 77, 79, 80, 82, 83, 85, 86, 94, 95, 98, 101, 104, 105, 107, 108, 110, 112, 117,
    125, 155, 156, 157, 158, 159, 160, 161, 165, 166, 167, 170, 171, 173, 175, 176, 198, 199, 200,
    207, 229, 235, 244, 253, 274, 275, 279,
  ],
  paint: [
    21, 34, 36, 39, 42, 43, 44, 45, 49, 78, 88, 111, 113, 114, 116, 120, 121, 124, 128, 130, 144,
    147, 150, 153, 162, 164, 168, 169, 174, 182, 183, 184, 196, 197, 201, 202, 212, 213, 214, 216,
    219, 222, 223, 226, 228, 230, 231, 233, 238, 243, 251, 252, 254, 258, 259, 271,
  ],
  toon: [
    10, 12, 13, 16, 17, 18, 19, 20, 24, 26, 28, 31, 35, 38, 46, 47, 53, 54, 55, 56, 57, 58, 59, 60,
    61, 62, 65, 66, 67, 71, 75, 81, 84, 87, 89, 90, 91, 92, 93, 96, 97, 99, 100, 102, 103, 106,
    109, 115, 118, 119, 122, 123, 129, 145, 146, 148, 151, 152, 154, 163, 172, 177, 178, 179, 180,
    181, 185, 186, 187, 195, 205, 206, 215, 217, 218, 220, 221, 224, 227, 232, 234, 236, 237, 239,
    241, 245, 246, 247, 248, 250, 260, 261, 262, 263, 264, 265, 266, 276, 277,
  ],
  collage: [
    50, 63, 64, 68, 225, 249, 272, 273, 278,
  ],
  chinese: [
    126, 127, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 143, 149, 188, 189, 190, 191,
    192, 193, 194, 203, 204, 208, 209, 210, 211, 240, 242, 255, 256, 257, 267, 268, 270,
  ],
  other: [
    72, 74, 142, 269,
  ],
}

const handrawCategoryByNumber = new Map(
  Object.entries(HANDRAW_STYLE_CATEGORY_NUMBERS).flatMap(([category, numbers]) => numbers.map(number => [number, category]))
)

// 内置风格与早期导入的命名变体按自身提示词归类；同一来源编号可能对应不同变体。
const namedStyleCategories = {
  keithHaringDoodle: 'sketch',
  cozyNaiveFolkArt: 'toon',
  narrativeEditorialFolk: 'paint',
  handraw041CozyFlatLife: 'toon',
  handraw052BoldContour: 'toon',
  handraw088EditorialFlat: 'toon',
  handraw124NaiveFolk: 'toon',
  handraw156MutedPastel: 'paint',
  handraw193NightBanquet: 'toon',
  handraw210WinterMemory: 'sketch',
  handraw241MagazineSpot: 'toon',
  handraw267LiteraryQuote: 'paint',
  handraw268LiteratiInk: 'chinese',
  handraw276FutureEditorial: 'toon',
}

export function illustrationStyleCategory(style) {
  if (!style) return 'other'
  // 生成功能型风格按技能展示，其余沿用手工整理后的主分类。
  if (style.category === 'skill') return 'skill'
  if (namedStyleCategories[style.key]) return namedStyleCategories[style.key]
  const number = handrawNumberFromStyle(style)
  return handrawCategoryByNumber.get(number) || backendCategoryToUiTab(style.category)
}
