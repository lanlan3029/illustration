import { ILLUSTRATION_STYLE_CONFIGS } from '@/data/illustrationStyleConfigs'

/** Before / After 案例（图片 + i18n key） */
export const BEFORE_AFTER_CASES = [
  {
    id: 'editorRefine',
    beforeImage: require('@/assets/prompt/14.webp'),
    afterImage: require('@/assets/images/home/showcase-editor.png'),
    toolKeys: ['guides.cases.editorRefine.tools.editor', 'guides.cases.editorRefine.tools.template'],
  },
  {
    id: 'lassoSticker',
    beforeImage: require('@/assets/prompt/5.webp'),
    afterImage: require('@/assets/images/window.png'),
    toolKeys: ['guides.cases.lassoSticker.tools.lasso', 'guides.cases.lassoSticker.tools.editor'],
  },
  {
    id: 'printLayout',
    beforeImage: require('@/assets/images/cards/books.png'),
    afterImage: require('@/assets/images/cards/daily-health-app.png'),
    toolKeys: ['guides.cases.printLayout.tools.compose', 'guides.cases.printLayout.tools.print'],
  },
]

/** 工作流教程 */
export const WORKFLOW_GUIDES = [
  {
    id: 'lassoStickerBook',
    icon: '✂️',
    stepCount: 5,
    links: [
      { labelKey: 'guides.workflows.lassoStickerBook.links.lasso', to: '/lasso-crop' },
      { labelKey: 'guides.workflows.lassoStickerBook.links.editor', to: '/editorpro' },
      { labelKey: 'guides.workflows.lassoStickerBook.links.compose', to: '/creation-studio/book/compose' },
    ],
  },
  {
    id: 'printPdf',
    icon: '📖',
    stepCount: 6,
    links: [
      { labelKey: 'guides.workflows.printPdf.links.studio', to: '/creation-studio/illustration/mine' },
      { labelKey: 'guides.workflows.printPdf.links.compose', to: '/creation-studio/book/compose' },
      { labelKey: 'guides.workflows.printPdf.links.print', to: '/print-book-layout' },
    ],
  },
  {
    id: 'aiToBook',
    icon: '✨',
    stepCount: 4,
    links: [
      { labelKey: 'guides.workflows.aiToBook.links.ai', to: '/creation-studio/illustration/ai' },
      { labelKey: 'guides.workflows.aiToBook.links.editor', to: '/editorpro' },
      { labelKey: 'guides.workflows.aiToBook.links.books', to: '/creation-studio/book/ai' },
    ],
  },
]

/** 风格分类说明 */
export const STYLE_CATEGORY_GUIDES = [
  { id: 'sketch', category: 'sketch', styleKeys: ['penLineArt', 'vintageSketch', 'crayonNoiseHandDrawn', 'engravingLines'] },
  { id: 'paint', category: 'paint', styleKeys: ['healingWatercolor', 'gouacheChildrenBook', 'oilPainting', 'feltCollage'] },
  { id: 'toon', category: 'toon', styleKeys: ['minimalPopArt', 'pixarStyle', 'simpleCartoon', 'europeanComic'] },
]

/** 精选风格详解（含题材与二次编辑建议） */
export const FEATURED_STYLE_GUIDES = [
  'healingWatercolor',
  'minimalPopArt',
  'vintageSketch',
  'pixarStyle',
  'crayonNoiseHandDrawn',
  'gouacheChildrenBook',
  'penLineArt',
  'feltCollage',
  'nordicWhimsical',
  'cozyNaiveFolkArt',
]

const styleImageMap = Object.fromEntries(
  ILLUSTRATION_STYLE_CONFIGS.map((c) => [c.key, c.image])
)

const styleCategoryMap = Object.fromEntries(
  ILLUSTRATION_STYLE_CONFIGS.map((c) => [c.key, c.category])
)

export function getStyleGuideCards(t) {
  return FEATURED_STYLE_GUIDES.map((key) => ({
    key,
    image: styleImageMap[key],
    category: styleCategoryMap[key],
    artStyle: t(`aibooks.styles.${key}.artStyle`),
    categoryLabel: t(`guides.styleCategories.${styleCategoryMap[key]}.name`),
  }))
}

export function getCategoryStylePreviews(categoryId, limit = 4) {
  const group = STYLE_CATEGORY_GUIDES.find((g) => g.id === categoryId)
  if (!group) return []
  return group.styleKeys.slice(0, limit).map((key) => ({
    key,
    image: styleImageMap[key],
  }))
}

/** 灵感外链（保留原 Connection 页） */
export const INSPIRATION_LINKS = [
  { name: 'freepik', url: 'https://www.freepik.com/', src: require('@/assets/logo/freepik.svg') },
  { name: 'blush', url: 'https://blush.design/zh-CN', src: require('@/assets/logo/blush.svg') },
]

export const WECHAT_QR = require('@/assets/logo/code.jpg')
