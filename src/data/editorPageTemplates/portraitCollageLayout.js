/**
 * 竖版 3:4 拼图布局（参照 Grid 模版，内容区垂直居中）
 */
import { CANVAS_W, CANVAS_H, photoSlot } from './placeholder'

export const PM = 50
export const PG = 10

export function portraitInner() {
  return { x: PM, y: PM, w: CANVAS_W - PM * 2, h: CANVAS_H - PM * 2 }
}

/** 在画布内垂直居中放置固定高度的内容区 */
export function vCenteredArea(contentH, inner = portraitInner()) {
  const h = Math.min(contentH, inner.h)
  return {
    x: inner.x,
    y: inner.y + (inner.h - h) / 2,
    w: inner.w,
    h,
  }
}

export function slotAt({ x, y, w, h, label = '照片' }) {
  return photoSlot({ left: x, top: y, width: w, height: h, label })
}

export function gridPhotoSlots(bounds, cols, rows, gap = PG) {
  const cellW = (bounds.w - gap * (cols - 1)) / cols
  const cellH = (bounds.h - gap * (rows - 1)) / rows
  const slots = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      slots.push(
        slotAt({
          x: bounds.x + col * (cellW + gap),
          y: bounds.y + row * (cellH + gap),
          w: cellW,
          h: cellH,
          label: String(row * cols + col + 1),
        })
      )
    }
  }
  return slots
}

export { CANVAS_W, CANVAS_H }
