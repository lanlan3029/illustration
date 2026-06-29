import { ILLUSTRATION_STYLE_CONFIGS } from '@/data/illustrationStyleConfigs'

/** 站点功能截图（已压缩为 guides/*.webp，宽约 1200px） */
export const GUIDE_SCREENSHOTS = {
  homeOverview: require('@/assets/images/home/guides/home-overview.webp'),
  charMy: require('@/assets/images/home/guides/char-my.webp'),
  charGen: require('@/assets/images/home/guides/char-gen.webp'),
  charGroup: require('@/assets/images/home/guides/char-group.webp'),
  aiIllustration: require('@/assets/images/home/guides/ai-illustration.webp'),
  myIllustrations: require('@/assets/images/home/guides/my-illustrations.webp'),
  editorPro: require('@/assets/images/home/guides/editor-pro.webp'),
  aiBook: require('@/assets/images/home/guides/ai-book.webp'),
  myBooks: require('@/assets/images/home/guides/my-books.webp'),
  layoutExport: require('@/assets/images/home/guides/layout-export.webp'),
  printLayout: require('@/assets/images/home/guides/print-layout.webp'),
  publishPdf: require('@/assets/images/home/guides/publish-pdf.webp'),
  uploadLocalBook: require('@/assets/images/home/guides/upload.png'),
}

/** 首页四大功能模块 */
export const FEATURE_MODULES = [
  {
    id: 'character',
    image: GUIDE_SCREENSHOTS.charMy,
    route: '/creation-studio/character',
  },
  {
    id: 'illustration',
    image: GUIDE_SCREENSHOTS.aiIllustration,
    route: '/creation-studio/illustration/ai',
  },
  {
    id: 'book',
    image: GUIDE_SCREENSHOTS.aiBook,
    route: '/creation-studio/book/ai',
  },
  {
    id: 'layout',
    image: GUIDE_SCREENSHOTS.layoutExport,
    route: '/creation-studio/book/compose',
  },
]

/** Before / After 案例（真实截图对比） */
export const BEFORE_AFTER_CASES = [
  {
    id: 'aiIllustration',
    beforeImage: GUIDE_SCREENSHOTS.aiIllustration,
    afterImage: GUIDE_SCREENSHOTS.myIllustrations,
    toolKeys: ['guides.cases.aiIllustration.tools.ai', 'guides.cases.aiIllustration.tools.mine'],
  },
  {
    id: 'editorLayout',
    beforeImage: GUIDE_SCREENSHOTS.myIllustrations,
    afterImage: GUIDE_SCREENSHOTS.editorPro,
    toolKeys: ['guides.cases.editorLayout.tools.mine', 'guides.cases.editorLayout.tools.editor'],
  },
  {
    id: 'bookPrint',
    beforeImage: GUIDE_SCREENSHOTS.layoutExport,
    afterImage: GUIDE_SCREENSHOTS.printLayout,
    toolKeys: ['guides.cases.bookPrint.tools.compose', 'guides.cases.bookPrint.tools.print'],
  },
]

/** 工作流教程 */
export const WORKFLOW_GUIDES = [
  {
    id: 'characterFlow',
    icon: '🧑‍🎨',
    stepCount: 4,
    screenshots: [GUIDE_SCREENSHOTS.charGen, GUIDE_SCREENSHOTS.charMy, GUIDE_SCREENSHOTS.charGroup],
    links: [
      { labelKey: 'guides.workflows.characterFlow.links.gen', to: '/creation-studio/character/generate/new' },
      { labelKey: 'guides.workflows.characterFlow.links.mine', to: '/creation-studio/character' },
      { labelKey: 'guides.workflows.characterFlow.links.group', to: '/creation-studio/character/groups' },
    ],
  },
  {
    id: 'aiBookFlow',
    icon: '📚',
    stepCount: 5,
    screenshots: [GUIDE_SCREENSHOTS.aiBook, GUIDE_SCREENSHOTS.myBooks, GUIDE_SCREENSHOTS.layoutExport],
    links: [
      { labelKey: 'guides.workflows.aiBookFlow.links.ai', to: '/creation-studio/book/ai' },
      { labelKey: 'guides.workflows.aiBookFlow.links.mine', to: '/creation-studio/book/mine' },
      { labelKey: 'guides.workflows.aiBookFlow.links.compose', to: '/creation-studio/book/compose' },
    ],
  },
  {
    id: 'printPdfFlow',
    icon: '🖨️',
    stepCount: 5,
    screenshots: [GUIDE_SCREENSHOTS.layoutExport, GUIDE_SCREENSHOTS.printLayout, GUIDE_SCREENSHOTS.publishPdf],
    links: [
      { labelKey: 'guides.workflows.printPdfFlow.links.compose', to: '/creation-studio/book/compose' },
      { labelKey: 'guides.workflows.printPdfFlow.links.print', to: '/print-book-layout' },
    ],
  },
]

/** 风格分类说明 */
export const STYLE_CATEGORY_GUIDES = [
  { id: 'sketch', category: 'sketch', styleKeys: ['penLineArt', 'vintageSketch', 'crayonNoiseHandDrawn', 'engravingLines'] },
  { id: 'paint', category: 'paint', styleKeys: ['healingWatercolor', 'gouacheChildrenBook', 'oilPainting', 'feltCollage'] },
  { id: 'toon', category: 'toon', styleKeys: ['minimalPopArt', 'pixarStyle', 'simpleCartoon', 'europeanComic'] },
]

/** 精选风格详解 */
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

export const INSPIRATION_LINKS = [
  { name: 'freepik', url: 'https://www.freepik.com/', src: require('@/assets/logo/freepik.svg') },
  { name: 'blush', url: 'https://blush.design/zh-CN', src: require('@/assets/logo/blush.svg') },
]

export const WECHAT_QR = require('@/assets/logo/code.jpg')
