/**
 * 照片书编辑型版式（hero / paired / one-plus-two / grid / breathing / sequence）
 * 任意画布：按目标宽高现场重算，统一边距/间距/字号并居中，避免非等比拉伸变形。
 */
import {
  buildTemplate,
  photoSlot,
  editableText,
  decorationRect,
} from './placeholder'

/** 预览用基准（A4 竖版比例） */
export const PHOTO_BOOK_W = 840
export const PHOTO_BOOK_H = 1188
export const PHOTO_BOOK_ASPECT_RATIO = '210:297'

const ACCENT = '#A96650'
const TEXT = '#3B4D45'

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function round(n) {
  return Math.max(1, Math.round(n))
}

/** 统一设计 token：随画布短边缩放，字号与间距全页一致 */
export function photoBookDesignTokens(pageW, pageH) {
  const min = Math.min(pageW, pageH)
  const landscape = pageW / pageH > 1.08
  const portrait = pageH / pageW > 1.15
  const margin = round(clamp(min * 0.07, 36, 72))
  const gap = round(clamp(min * 0.022, 14, 28))
  const fontSize = round(clamp(min * 0.025, 20, 28))
  const captionGap = round(clamp(min * 0.03, 20, 36))
  const accentW = round(clamp(min * 0.055, 40, 64))
  const accentH = round(clamp(min * 0.004, 3, 5))
  const lineGap = round(fontSize * 0.45)

  return {
    pageW,
    pageH,
    min,
    landscape,
    portrait,
    margin,
    gap,
    fontSize,
    captionGap,
    accentW,
    accentH,
    lineGap,
  }
}

function contentBounds(t) {
  return {
    x: t.margin,
    y: t.margin,
    w: t.pageW - t.margin * 2,
    h: t.pageH - t.margin * 2,
  }
}

function slot(x, y, w, h, label) {
  return photoSlot({
    left: round(x),
    top: round(y),
    width: round(w),
    height: round(h),
    label,
  })
}

function caption({ left, top, width, text, fontSize, textAlign = 'left' }) {
  return {
    ...editableText({
      left: round(left),
      top: round(top),
      width: round(width),
      text,
      fontSize: round(fontSize),
      textAlign,
    }),
    fill: TEXT,
  }
}

function accentBar(left, top, t) {
  return decorationRect({
    left: round(left),
    top: round(top),
    width: t.accentW,
    height: t.accentH,
    fill: ACCENT,
  })
}

/** 将内容块在内容区内垂直居中（略偏上更像编辑型，系数 0.45） */
function centerBlockY(boundsH, blockH, bias = 0.45) {
  const free = Math.max(0, boundsH - blockH)
  return free * bias
}

function layoutHero(t) {
  const b = contentBounds(t)
  const photoH = round(Math.min(b.h * 0.56, b.w * (t.landscape ? 0.55 : 0.78)))
  const captionBlock = t.captionGap + t.fontSize + t.lineGap + t.accentH
  const blockH = photoH + captionBlock
  const y0 = b.y + centerBlockY(b.h, blockH)
  const captionTop = y0 + photoH + t.captionGap

  return [
    slot(b.x, y0, b.w, photoH, '主图'),
    caption({
      left: b.x,
      top: captionTop,
      width: Math.min(b.w * 0.7, b.w),
      text: '图注',
      fontSize: t.fontSize,
      textAlign: 'left',
    }),
    accentBar(b.x, captionTop + t.fontSize + t.lineGap, t),
  ]
}

function layoutPaired(t) {
  const b = contentBounds(t)
  const halfW = (b.w - t.gap) / 2
  const photoH = round(Math.min(b.h * 0.58, halfW * (t.landscape ? 0.85 : 1.15)))
  const captionBlock = t.captionGap + t.fontSize
  const blockH = photoH + captionBlock
  const y0 = b.y + centerBlockY(b.h, blockH)
  const captionTop = y0 + photoH + t.captionGap

  return [
    slot(b.x, y0, halfW, photoH, '左'),
    slot(b.x + halfW + t.gap, y0, halfW, photoH, '右'),
    caption({
      left: b.x,
      top: captionTop,
      width: halfW,
      text: '图注 A',
      fontSize: t.fontSize,
    }),
    caption({
      left: b.x + halfW + t.gap,
      top: captionTop,
      width: halfW,
      text: '图注 B',
      fontSize: t.fontSize,
    }),
  ]
}

function layoutOnePlusTwo(t) {
  const b = contentBounds(t)
  if (t.landscape) {
    // 横版：左侧主图 + 右侧两格，铺满内容区
    const leftW = (b.w - t.gap) * 0.58
    const rightW = b.w - leftW - t.gap
    const halfH = (b.h - t.gap) / 2
    return [
      slot(b.x, b.y, leftW, b.h, '主图'),
      slot(b.x + leftW + t.gap, b.y, rightW, halfH, '2'),
      slot(b.x + leftW + t.gap, b.y + halfH + t.gap, rightW, halfH, '3'),
    ]
  }
  // 竖版：上方主图 + 下方两格
  const topH = (b.h - t.gap) * 0.58
  const botH = b.h - topH - t.gap
  const halfW = (b.w - t.gap) / 2
  return [
    slot(b.x, b.y, b.w, topH, '主图'),
    slot(b.x, b.y + topH + t.gap, halfW, botH, '2'),
    slot(b.x + halfW + t.gap, b.y + topH + t.gap, halfW, botH, '3'),
  ]
}

function layoutGrid(t) {
  const b = contentBounds(t)
  const cellW = (b.w - t.gap) / 2
  const cellH = (b.h - t.gap) / 2
  return [
    slot(b.x, b.y, cellW, cellH, '1'),
    slot(b.x + cellW + t.gap, b.y, cellW, cellH, '2'),
    slot(b.x, b.y + cellH + t.gap, cellW, cellH, '3'),
    slot(b.x + cellW + t.gap, b.y + cellH + t.gap, cellW, cellH, '4'),
  ]
}

function layoutBreathing(t) {
  const b = contentBounds(t)
  const photoW = round(Math.min(b.w * 0.72, t.min * 0.78))
  const photoH = round(Math.min(photoW * 0.7, b.h * 0.42))
  const blockH = photoH + t.captionGap + t.fontSize
  const y0 = b.y + centerBlockY(b.h, blockH, 0.48)
  const x0 = b.x + (b.w - photoW) / 2

  return [
    slot(x0, y0, photoW, photoH, '照片'),
    caption({
      left: x0,
      top: y0 + photoH + t.captionGap,
      width: photoW,
      text: '短句',
      fontSize: t.fontSize,
      textAlign: 'center',
    }),
  ]
}

function layoutSequence(t) {
  const b = contentBounds(t)
  const count = 4
  if (t.landscape) {
    const cellW = (b.w - t.gap * (count - 1)) / count
    return Array.from({ length: count }, (_, i) =>
      slot(b.x + i * (cellW + t.gap), b.y, cellW, b.h, String(i + 1))
    )
  }
  const cellH = (b.h - t.gap * (count - 1)) / count
  return Array.from({ length: count }, (_, i) =>
    slot(b.x, b.y + i * (cellH + t.gap), b.w, cellH, String(i + 1))
  )
}

const LAYOUT_BUILDERS = {
  'photobook-hero': layoutHero,
  'photobook-paired': layoutPaired,
  'photobook-one-plus-two': layoutOnePlusTwo,
  'photobook-grid': layoutGrid,
  'photobook-breathing': layoutBreathing,
  'photobook-sequence': layoutSequence,
}

/**
 * 按目标画布尺寸生成照片书模版 JSON（推荐应用路径）
 */
export function buildPhotoBookTemplateJson(id, pageW, pageH) {
  const builder = LAYOUT_BUILDERS[id]
  if (!builder) {
    throw new Error(`unknown photo book template: ${id}`)
  }
  const width = round(pageW)
  const height = round(pageH)
  const tokens = photoBookDesignTokens(width, height)
  return buildTemplate(builder(tokens), {
    width,
    height,
    aspectRatio: `${width}:${height}`,
  })
}

const PHOTO_BOOK_META = {
  category: 'photoBook',
  aspectRatio: PHOTO_BOOK_ASPECT_RATIO,
  anyAspect: true,
  /** 应用时按画布重算版式，不 stretch */
  rebuildLayout: true,
  fitMode: 'rebuild',
}

const TEMPLATE_DEFS = [
  { id: 'photobook-hero', preview: '/editor-page-templates/photobook-hero.svg' },
  { id: 'photobook-paired', preview: '/editor-page-templates/photobook-paired.svg' },
  { id: 'photobook-one-plus-two', preview: '/editor-page-templates/photobook-one-plus-two.svg' },
  { id: 'photobook-grid', preview: '/editor-page-templates/photobook-grid.svg' },
  { id: 'photobook-breathing', preview: '/editor-page-templates/photobook-breathing.svg' },
  { id: 'photobook-sequence', preview: '/editor-page-templates/photobook-sequence.svg' },
]

export const photoBookTemplates = TEMPLATE_DEFS.map((def) => ({
  id: def.id,
  ...PHOTO_BOOK_META,
  preview: def.preview,
  // 列表/回退用 A4 预生成；真正应用走 buildPhotoBookTemplateJson
  json: buildPhotoBookTemplateJson(def.id, PHOTO_BOOK_W, PHOTO_BOOK_H),
}))

export default photoBookTemplates
