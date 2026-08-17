/**
 * 照片书编辑型版式（对照 ZZ-photo-book：hero / paired / one-plus-two / grid / breathing / sequence）
 * 设计基准：A4 竖版 210×297 mm
 */
import {
  buildTemplate,
  photoSlot,
  editableText,
  decorationRect,
} from './placeholder'

/** 与画布「A4 竖向」同比例（210:297） */
export const PHOTO_BOOK_W = 840
export const PHOTO_BOOK_H = 1188
export const PHOTO_BOOK_ASPECT_RATIO = '210:297'

const MARGIN = 56 // ≈ 14 mm @ 4 px/mm
const GAP = 16
const ACCENT = '#A96650'

const pageOpts = {
  width: PHOTO_BOOK_W,
  height: PHOTO_BOOK_H,
  aspectRatio: PHOTO_BOOK_ASPECT_RATIO,
}

function bounds(margin = MARGIN) {
  return {
    x: margin,
    y: margin,
    w: PHOTO_BOOK_W - margin * 2,
    h: PHOTO_BOOK_H - margin * 2,
  }
}

function slot(x, y, w, h, label) {
  return photoSlot({ left: x, top: y, width: w, height: h, label })
}

/** anyAspect + stretch：任意画布比例都可选用，应用时按宽高分别缩放铺满 */
const PHOTO_BOOK_META = {
  category: 'photoBook',
  aspectRatio: PHOTO_BOOK_ASPECT_RATIO,
  anyAspect: true,
  fitMode: 'stretch',
}

export const photoBookTemplates = [
  {
    id: 'photobook-hero',
    ...PHOTO_BOOK_META,
    preview: '/editor-page-templates/photobook-hero.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const photoH = Math.round(b.h * 0.62)
        const captionTop = b.y + photoH + 28
        return [
          slot(b.x, b.y, b.w, photoH, '主图'),
          editableText({
            left: b.x,
            top: captionTop,
            width: b.w * 0.72,
            text: '图注',
            fontSize: 22,
            textAlign: 'left',
          }),
          decorationRect({
            left: b.x,
            top: captionTop + 48,
            width: 48,
            height: 4,
            fill: ACCENT,
          }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'photobook-paired',
    ...PHOTO_BOOK_META,
    preview: '/editor-page-templates/photobook-paired.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const halfW = (b.w - GAP) / 2
        const photoH = Math.round(b.h * 0.58)
        const captionTop = b.y + photoH + 20
        return [
          slot(b.x, b.y, halfW, photoH, '左'),
          slot(b.x + halfW + GAP, b.y, halfW, photoH, '右'),
          editableText({
            left: b.x,
            top: captionTop,
            width: halfW,
            text: '图注 A',
            fontSize: 18,
            textAlign: 'left',
          }),
          editableText({
            left: b.x + halfW + GAP,
            top: captionTop,
            width: halfW,
            text: '图注 B',
            fontSize: 18,
            textAlign: 'left',
          }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'photobook-one-plus-two',
    ...PHOTO_BOOK_META,
    preview: '/editor-page-templates/photobook-one-plus-two.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const leftW = Math.round((b.w - GAP) * 0.62)
        const rightW = b.w - leftW - GAP
        const halfH = (b.h - GAP) / 2
        return [
          slot(b.x, b.y, leftW, b.h, '主图'),
          slot(b.x + leftW + GAP, b.y, rightW, halfH, '2'),
          slot(b.x + leftW + GAP, b.y + halfH + GAP, rightW, halfH, '3'),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'photobook-grid',
    ...PHOTO_BOOK_META,
    preview: '/editor-page-templates/photobook-grid.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const cellW = (b.w - GAP) / 2
        const cellH = (b.h - GAP) / 2
        return [
          slot(b.x, b.y, cellW, cellH, '1'),
          slot(b.x + cellW + GAP, b.y, cellW, cellH, '2'),
          slot(b.x, b.y + cellH + GAP, cellW, cellH, '3'),
          slot(b.x + cellW + GAP, b.y + cellH + GAP, cellW, cellH, '4'),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'photobook-breathing',
    ...PHOTO_BOOK_META,
    preview: '/editor-page-templates/photobook-breathing.svg',
    json: buildTemplate(
      (() => {
        const b = bounds(88)
        const photoW = Math.round(b.w * 0.72)
        const photoH = Math.round(b.h * 0.38)
        const photoX = b.x + (b.w - photoW) / 2
        const photoY = b.y + Math.round(b.h * 0.18)
        return [
          slot(photoX, photoY, photoW, photoH, '照片'),
          editableText({
            left: photoX,
            top: photoY + photoH + 36,
            width: photoW,
            text: '短句',
            fontSize: 24,
            textAlign: 'center',
          }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'photobook-sequence',
    ...PHOTO_BOOK_META,
    preview: '/editor-page-templates/photobook-sequence.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const rows = 4
        const rowH = (b.h - GAP * (rows - 1)) / rows
        const items = []
        for (let i = 0; i < rows; i += 1) {
          items.push(
            slot(b.x, b.y + i * (rowH + GAP), b.w, rowH, String(i + 1))
          )
        }
        return items
      })(),
      pageOpts
    ),
  },
]

export default photoBookTemplates
