/**
 * 相册模版共用布局工具（跨页 2:1 / 单页 1:1）
 */
import {
  SPREAD_W,
  SPREAD_H,
  PAGE_W,
  PAGE_H,
  photoSlot,
  decorationRect,
} from './placeholder'

export const ALBUM_MARGIN = 40
export const ALBUM_GAP = 12
export const SPREAD_SPINE_GAP = 24

/** 跨页左/右页可用区域 */
export function spreadPageBounds(side = 'left', spreadW = SPREAD_W, spreadH = SPREAD_H) {
  const m = ALBUM_MARGIN
  const mid = spreadW / 2
  const top = m
  const innerH = spreadH - m * 2
  if (side === 'left') {
    return { x: m, y: top, w: mid - SPREAD_SPINE_GAP / 2 - m, h: innerH }
  }
  return { x: mid + SPREAD_SPINE_GAP / 2, y: top, w: spreadW - m - (mid + SPREAD_SPINE_GAP / 2), h: innerH }
}

/** 单页可用区域 */
export function singlePageBounds(pageW = PAGE_W, pageH = PAGE_H, margin = ALBUM_MARGIN) {
  return { x: margin, y: margin, w: pageW - margin * 2, h: pageH - margin * 2 }
}

export function boundsSlot(bounds, label = '照片') {
  return photoSlot({ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h, label })
}

export function rectSlot({ x, y, w, h, label = '照片' }) {
  return photoSlot({ left: x, top: y, width: w, height: h, label })
}

/** 区域内 cols×rows 网格 */
export function gridSlots(bounds, cols, rows, gap = ALBUM_GAP, labelPrefix = '') {
  const cellW = (bounds.w - gap * (cols - 1)) / cols
  const cellH = (bounds.h - gap * (rows - 1)) / rows
  const slots = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const n = row * cols + col + 1
      slots.push(
        rectSlot({
          x: bounds.x + col * (cellW + gap),
          y: bounds.y + row * (cellH + gap),
          w: cellW,
          h: cellH,
          label: labelPrefix ? `${labelPrefix}${n}` : String(n),
        })
      )
    }
  }
  return slots
}

/** 区域内居中方形 */
export function centeredSquare(bounds, size, label = '照片') {
  return rectSlot({
    x: bounds.x + (bounds.w - size) / 2,
    y: bounds.y + (bounds.h - size) / 2,
    w: size,
    h: size,
    label,
  })
}

/** 上宽 + 下两小（跨页左页 / 单页通用） */
export function asymmetricTopWideLayout(bounds, gap = ALBUM_GAP) {
  const topH = bounds.h * 0.46
  const bottomH = bounds.h * 0.54 - gap
  const halfW = (bounds.w - gap) / 2
  return [
    rectSlot({ x: bounds.x, y: bounds.y, w: bounds.w, h: topH, label: '1' }),
    rectSlot({ x: bounds.x, y: bounds.y + topH + gap, w: halfW, h: bottomH, label: '2' }),
    rectSlot({
      x: bounds.x + halfW + gap,
      y: bounds.y + topH + gap,
      w: halfW,
      h: bottomH,
      label: '3',
    }),
  ]
}

/** 左大竖图 + 右上下两格 */
export function verticalWithStackLayout(leftBounds, rightBounds, gap = ALBUM_GAP) {
  const tallW = Math.min(leftBounds.w, leftBounds.h)
  return [
    rectSlot({
      x: leftBounds.x + (leftBounds.w - tallW) / 2,
      y: leftBounds.y,
      w: tallW,
      h: leftBounds.h,
      label: '左',
    }),
    rectSlot({ x: rightBounds.x, y: rightBounds.y, w: rightBounds.w, h: rightBounds.h / 2 - gap / 2, label: '右上' }),
    rectSlot({
      x: rightBounds.x,
      y: rightBounds.y + rightBounds.h / 2 + gap / 2,
      w: rightBounds.w,
      h: rightBounds.h / 2 - gap / 2,
      label: '右下',
    }),
  ]
}

/** 跨页中缝装饰线 */
export function spreadSpine(spreadW = SPREAD_W, spreadH = SPREAD_H) {
  const mid = spreadW / 2
  return decorationRect({
    left: mid - 8,
    top: ALBUM_MARGIN,
    width: 16,
    height: spreadH - ALBUM_MARGIN * 2,
    fill: '#ececec',
  })
}

/** 左页大方 + 右页 2×2 */
export function largeLeftGridRightLayout(leftBounds, rightBounds, gap = ALBUM_GAP) {
  const size = Math.min(leftBounds.w, leftBounds.h)
  return [
    centeredSquare(leftBounds, size, '左页'),
    ...gridSlots(rightBounds, 2, 2, gap),
  ]
}

/** 跨页四竖条 */
export function fourVerticalsAcross(spreadW = SPREAD_W, spreadH = SPREAD_H, gap = 16) {
  const m = ALBUM_MARGIN
  const bounds = { x: m, y: m, w: spreadW - m * 2, h: spreadH - m * 2 }
  const w = (bounds.w - gap * 3) / 4
  return Array.from({ length: 4 }, (_, i) =>
    rectSlot({
      x: bounds.x + i * (w + gap),
      y: bounds.y,
      w,
      h: bounds.h,
      label: String(i + 1),
    })
  )
}

/** 跨页 3×2 六宫格 */
export function grid3x2Across(spreadW = SPREAD_W, spreadH = SPREAD_H, gap = 16) {
  const m = ALBUM_MARGIN
  const bounds = { x: m, y: m, w: spreadW - m * 2, h: spreadH - m * 2 }
  return gridSlots(bounds, 3, 2, gap)
}

/** 三列拼贴（跨页） */
export function threeColumnSpread(leftBounds, rightBounds, gap = ALBUM_GAP) {
  const col1W = leftBounds.w * 0.72
  const midW = rightBounds.w * 0.55 + leftBounds.w * 0.28 - gap
  const col3W = rightBounds.w * 0.45 - 8
  return [
    rectSlot({ x: leftBounds.x, y: leftBounds.y, w: col1W, h: leftBounds.h, label: '1' }),
    rectSlot({
      x: leftBounds.x + col1W + gap,
      y: leftBounds.y,
      w: midW,
      h: leftBounds.h / 2 - gap / 2,
      label: '2',
    }),
    rectSlot({
      x: leftBounds.x + col1W + gap,
      y: leftBounds.y + leftBounds.h / 2 + gap / 2,
      w: midW,
      h: leftBounds.h / 2 - gap / 2,
      label: '3',
    }),
    rectSlot({
      x: rightBounds.x + rightBounds.w * 0.55,
      y: rightBounds.y,
      w: col3W,
      h: rightBounds.h,
      label: '4',
    }),
  ]
}

/** 左右页各一竖条 */
export function twinColumnPages(leftBounds, rightBounds, colW = 640) {
  const colH = Math.min(leftBounds.h, rightBounds.h, 960)
  return [
    rectSlot({
      x: leftBounds.x + (leftBounds.w - colW) / 2,
      y: leftBounds.y + (leftBounds.h - colH) / 2,
      w: colW,
      h: colH,
      label: '左页',
    }),
    rectSlot({
      x: rightBounds.x + (rightBounds.w - colW) / 2,
      y: rightBounds.y + (rightBounds.h - colH) / 2,
      w: colW,
      h: colH,
      label: '右页',
    }),
  ]
}
