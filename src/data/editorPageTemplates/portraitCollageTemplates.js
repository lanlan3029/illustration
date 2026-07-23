/**
 * 竖版 3:4 拼图页面模版（Grid / Mosaic 布局）
 */
import { buildTemplate, TEMPLATE_ASPECT_RATIO } from './placeholder'
import {
  portraitInner,
  vCenteredArea,
  gridPhotoSlots,
  slotAt,
  PG,
} from './portraitCollageLayout'

const opts = { aspectRatio: TEMPLATE_ASPECT_RATIO }
const inner = () => portraitInner()

function tpl(id, category, preview, slots) {
  return {
    id,
    category,
    aspectRatio: TEMPLATE_ASPECT_RATIO,
    preview: `/editor-page-templates/${preview}`,
    json: buildTemplate(slots, opts),
  }
}

/** 马赛克 4：左三行 + 右竖条 */
function mosaic4Slots(b) {
  const gap = PG
  const leftW = (b.w - gap) * 0.42
  const rightW = b.w - leftW - gap
  const rowH = (b.h - gap * 2) / 3
  return [
    ...Array.from({ length: 3 }, (_, i) =>
      slotAt({ x: b.x, y: b.y + i * (rowH + gap), w: leftW, h: rowH, label: String(i + 1) })
    ),
    slotAt({ x: b.x + leftW + gap, y: b.y, w: rightW, h: b.h, label: '4' }),
  ]
}

/** 马赛克 5：三列，中列上下分割 */
function mosaic5Slots(b) {
  const gap = PG
  const colW = (b.w - gap * 2) / 3
  const midH = (b.h - gap) / 2
  return [
    slotAt({ x: b.x, y: b.y, w: colW, h: b.h, label: '1' }),
    slotAt({ x: b.x + colW + gap, y: b.y, w: colW, h: midH, label: '2' }),
    slotAt({ x: b.x + colW + gap, y: b.y + midH + gap, w: colW, h: midH, label: '3' }),
    slotAt({ x: b.x + (colW + gap) * 2, y: b.y, w: colW, h: b.h, label: '4' }),
  ]
}

/** 马赛克 6：上两列 + 下两行 */
function mosaic6Slots(b) {
  const gap = PG
  const topH = (b.h - gap) * 0.52
  const bottomH = b.h - topH - gap
  const halfW = (b.w - gap) / 2
  const rowH = (bottomH - gap) / 2
  return [
    slotAt({ x: b.x, y: b.y, w: halfW, h: topH, label: '1' }),
    slotAt({ x: b.x + halfW + gap, y: b.y, w: halfW, h: topH, label: '2' }),
    slotAt({ x: b.x, y: b.y + topH + gap, w: b.w, h: rowH, label: '3' }),
    slotAt({ x: b.x, y: b.y + topH + gap + rowH + gap, w: b.w, h: rowH, label: '4' }),
  ]
}

/** 马赛克 7：左上大方 + 右竖条 + 左下两格 */
function mosaic7Slots(b) {
  const gap = PG
  const rightW = b.w * 0.36
  const leftW = b.w - rightW - gap
  const topH = b.h * 0.58
  const bottomH = b.h - topH - gap
  const halfW = (leftW - gap) / 2
  return [
    slotAt({ x: b.x, y: b.y, w: leftW, h: topH, label: '1' }),
    slotAt({ x: b.x + leftW + gap, y: b.y, w: rightW, h: b.h, label: '2' }),
    slotAt({ x: b.x, y: b.y + topH + gap, w: halfW, h: bottomH, label: '3' }),
    slotAt({ x: b.x + halfW + gap, y: b.y + topH + gap, w: halfW, h: bottomH, label: '4' }),
  ]
}

/** 马赛克 8：不规则多格 */
function mosaic8Slots(b) {
  const gap = PG
  const w1 = (b.w - gap * 2) / 3
  const w2 = (b.w - gap) / 2
  const h1 = (b.h - gap * 3) / 4
  const h2 = (b.h - gap * 2) / 3
  return [
    slotAt({ x: b.x, y: b.y, w: w2, h: h2, label: '1' }),
    slotAt({ x: b.x + w2 + gap, y: b.y, w: w2, h: h1, label: '2' }),
    slotAt({ x: b.x + w2 + gap, y: b.y + h1 + gap, w: w2, h: h1, label: '3' }),
    slotAt({ x: b.x, y: b.y + h2 + gap, w: w1, h: h1, label: '4' }),
    slotAt({ x: b.x + w1 + gap, y: b.y + h2 + gap, w: w1, h: h1, label: '5' }),
    slotAt({ x: b.x + (w1 + gap) * 2, y: b.y + h2 + gap, w: w1, h: h1, label: '6' }),
    slotAt({ x: b.x, y: b.y + h2 + gap + h1 + gap, w: b.w, h: h1, label: '7' }),
    slotAt({ x: b.x, y: b.y + h2 + gap + (h1 + gap) * 2, w: w2, h: h1, label: '8' }),
    slotAt({ x: b.x + w2 + gap, y: b.y + h2 + gap + (h1 + gap) * 2, w: w2, h: h1, label: '9' }),
  ]
}

export const portraitCollageTemplates = [
  tpl('portrait-col-1', 'collage', 'portrait-col-1.svg', gridPhotoSlots(inner(), 1, 1)),
  tpl('portrait-col-2', 'collage', 'portrait-col-2.svg', gridPhotoSlots(inner(), 2, 1)),
  tpl('portrait-col-3', 'collage', 'portrait-col-3.svg', gridPhotoSlots(inner(), 3, 1)),
  tpl('portrait-col-4', 'collage', 'portrait-col-4.svg', gridPhotoSlots(inner(), 4, 1)),
  tpl('portrait-row-2', 'collage', 'portrait-row-2.svg', gridPhotoSlots(inner(), 1, 2)),
  tpl('portrait-row-3', 'collage', 'portrait-row-3.svg', gridPhotoSlots(inner(), 1, 3)),
  tpl('portrait-row-4', 'collage', 'portrait-row-4.svg', gridPhotoSlots(inner(), 1, 4)),
  tpl('portrait-row-5', 'collage', 'portrait-row-5.svg', gridPhotoSlots(inner(), 1, 5)),
  tpl('portrait-row-6', 'collage', 'portrait-row-6.svg', gridPhotoSlots(inner(), 1, 6)),
  tpl('portrait-grid-2x3', 'collage', 'portrait-grid-2x3.svg', gridPhotoSlots(inner(), 2, 3)),
  tpl('portrait-grid-4x6', 'collage', 'portrait-grid-4x6.svg', gridPhotoSlots(inner(), 4, 6)),
  tpl('portrait-mosaic-1', 'collage', 'portrait-mosaic-1.svg', gridPhotoSlots(inner(), 1, 2)),
  tpl('portrait-mosaic-2', 'collage', 'portrait-mosaic-2.svg', (() => {
    const b = inner()
    const gap = PG
    const topH = b.h * 0.55 - gap / 2
    const bottomH = b.h - topH - gap
    const halfW = (b.w - gap) / 2
    return [
      slotAt({ x: b.x, y: b.y, w: b.w, h: topH, label: '1' }),
      slotAt({ x: b.x, y: b.y + topH + gap, w: halfW, h: bottomH, label: '2' }),
      slotAt({ x: b.x + halfW + gap, y: b.y + topH + gap, w: halfW, h: bottomH, label: '3' }),
    ]
  })()),
  tpl('portrait-mosaic-3', 'collage', 'portrait-mosaic-3.svg', (() => {
    const b = inner()
    const gap = PG
    const topH = b.h * 0.62 - gap / 2
    const bottomH = b.h - topH - gap
    const cellW = (b.w - gap * 3) / 4
    return [
      slotAt({ x: b.x, y: b.y, w: b.w, h: topH, label: '1' }),
      ...Array.from({ length: 4 }, (_, i) =>
        slotAt({
          x: b.x + i * (cellW + gap),
          y: b.y + topH + gap,
          w: cellW,
          h: bottomH,
          label: String(i + 2),
        })
      ),
    ]
  })()),
  tpl('portrait-mosaic-4', 'collage', 'portrait-mosaic-4.svg', mosaic4Slots(inner())),
  tpl('portrait-mosaic-5', 'collage', 'portrait-mosaic-5.svg', mosaic5Slots(inner())),
  tpl('portrait-mosaic-6', 'collage', 'portrait-mosaic-6.svg', mosaic6Slots(inner())),
  tpl('portrait-mosaic-7', 'collage', 'portrait-mosaic-7.svg', mosaic7Slots(inner())),
  tpl('portrait-mosaic-8', 'collage', 'portrait-mosaic-8.svg', mosaic8Slots(inner())),
]

export default portraitCollageTemplates
