/**
 * AI 插画风格预览图 CDN（与后端 public/prompt/{id}.webp 一致）。
 */
export const ILLUSTRATION_STYLE_CDN_BASE = 'https://static.kidstory.cc'

/** @param {number|string} id */
export function illustrationStyleImageUrl(id) {
  return `${ILLUSTRATION_STYLE_CDN_BASE}/prompt/${id}.webp`
}

/**
 * AI 插画页与心情日记生成页共用的风格列表（fallback；线上优先走 API）。
 * category 使用后端 API 白名单值。
 */
export const ILLUSTRATION_STYLE_CONFIGS = [
  { key: 'penLineArt', id: 1, image: illustrationStyleImageUrl(1), category: 'sketch' },
  { key: 'minimalPopArt', id: 3, image: illustrationStyleImageUrl(3), category: 'flat' },
  { key: 'colorfulOutlineRomanticism', id: 6, image: illustrationStyleImageUrl(6), category: 'watercolor' },
  { key: 'crayonNoiseHandDrawn', id: 15, image: illustrationStyleImageUrl(15), category: 'crayon' },
  { key: 'vintageSketch', id: 17, image: illustrationStyleImageUrl(17), category: 'sketch' },
  { key: 'pixarStyle', id: 5, image: illustrationStyleImageUrl(5), category: '3d' },
  { key: 'engravingLines', id: 7, image: illustrationStyleImageUrl(7), category: 'ink' },
  { key: 'pencilSketch3D', id: 16, image: illustrationStyleImageUrl(16), category: 'sketch' },
  { key: 'feltCollage', id: 18, image: illustrationStyleImageUrl(18), category: 'collage' },
  { key: 'blackWhiteDoodle', id: 2, image: illustrationStyleImageUrl(2), category: 'sketch' },
  { key: 'collageIllustration', id: 4, image: illustrationStyleImageUrl(4), category: 'collage' },
  { key: 'rusticHandDrawn', id: 8, image: illustrationStyleImageUrl(8), category: 'sketch' },
  { key: 'maximalistCopperplate', id: 9, image: illustrationStyleImageUrl(9), category: 'ink' },
  { key: 'doodleSoul', id: 10, image: illustrationStyleImageUrl(10), category: 'sketch' },
  { key: 'keithHaringDoodle', id: 11, image: illustrationStyleImageUrl(11), category: 'marker' },
  { key: 'abstractFlatDesign', id: 12, image: illustrationStyleImageUrl(12), category: 'flat' },
  { key: 'simpleCartoon', id: 13, image: illustrationStyleImageUrl(13), category: 'cartoon' },
  { key: 'healingWatercolor', id: 14, image: illustrationStyleImageUrl(14), category: 'watercolor' },
  { key: 'oilPainting', id: 19, image: illustrationStyleImageUrl(19), category: 'oil' },
  { key: 'europeanComic', id: 20, image: illustrationStyleImageUrl(20), category: 'cartoon' },
  { key: 'gouacheChildrenBook', id: 21, image: illustrationStyleImageUrl(21), category: 'pastel' },
  { key: 'nordicWhimsical', id: 22, image: illustrationStyleImageUrl(22), category: 'sketch' },
  { key: 'cozyNaiveFolkArt', id: 23, image: illustrationStyleImageUrl(23), category: 'other' },
  { key: 'narrativeEditorialFolk', id: 24, image: illustrationStyleImageUrl(24), category: 'other' },
  /** 输入框只显示 inputTemplate（C）；elementDetails（A）生成时自动前置。服务端 id 25 已占用，用 29 */
  {
    key: 'poeticMinimalZine',
    id: 29,
    image: illustrationStyleImageUrl(29),
    category: 'collage',
    prependBaseOnGenerate: true,
    preferredSize: '768x1024',
  },
  /** 喜茶灵感·实物简笔画无字海报；线上 id 30 */
  {
    key: 'objectDoodlePosterNoText',
    id: 30,
    image: illustrationStyleImageUrl(30),
    category: 'collage',
    prependBaseOnGenerate: true,
    preferredSize: '768x1024',
  },
]
