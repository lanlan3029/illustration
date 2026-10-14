import { buildTemplate, photoSlot } from './placeholder'

// Independent layout definitions; all coordinates are computed for the current canvas.
export const COLLAGE_LAYOUTS = [
  { id: 'columns', label: ['双图横排', 'Two columns'], cols: 2, rows: 1 },
  { id: 'rows', label: ['双图竖排', 'Two rows'], cols: 1, rows: 2 },
  { id: 'three', label: ['三图横排', 'Three columns'], cols: 3, rows: 1 },
  { id: 'hero', label: ['一大两小', 'One plus two'], hero: true },
  { id: 'four', label: ['四宫格', 'Four photos'], cols: 2, rows: 2 },
  { id: 'nine', label: ['九宫格', 'Nine photos'], cols: 3, rows: 3 },
]

export function collageFrames(id, width, height, spacing = 2) {
  const layout = COLLAGE_LAYOUTS.find((item) => item.id === id)
  if (!layout || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid collage layout or canvas size')
  }
  const gap = Math.min(width, height) * Math.min(8, Math.max(0, Number(spacing) || 0)) / 100
  const cols = layout.hero ? 2 : layout.cols
  const rows = layout.hero ? 2 : layout.rows
  const w = (width - gap * (cols + 1)) / cols
  const h = (height - gap * (rows + 1)) / rows
  if (layout.hero) return [
    { left: gap, top: gap, width: w, height: height - gap * 2 },
    { left: gap * 2 + w, top: gap, width: w, height: h },
    { left: gap * 2 + w, top: gap * 2 + h, width: w, height: h },
  ]
  return Array.from({ length: cols * rows }, (_, index) => ({
    left: gap + (index % cols) * (w + gap),
    top: gap + Math.floor(index / cols) * (h + gap),
    width: w,
    height: h,
  }))
}

export function buildCollageTemplate(id, width, height, { spacing = 2, background = '#ffffff' } = {}) {
  const frames = collageFrames(id, width, height, spacing)
  const json = buildTemplate(frames.map((frame, i) => photoSlot({ ...frame, label: `${i + 1}` })), { width, height })
  json.objects[0].fill = /^#[0-9a-f]{6}$/i.test(background) ? background : '#ffffff'
  return json
}
