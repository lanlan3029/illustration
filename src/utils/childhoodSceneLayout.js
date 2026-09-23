import { hashSeed } from '@/utils/avatarCrowd'

/** 桌面端散落锚点（归一化 0–1，参照 gallery 参考图） */
const GALLERY_ANCHORS = [
  { x: 0.02, y: 0.04, w: 0.24 },
  { x: 0.28, y: 0.02, w: 0.22 },
  { x: 0.54, y: 0.06, w: 0.2 },
  { x: 0.76, y: 0.03, w: 0.21 },
  { x: 0.05, y: 0.26, w: 0.26 },
  { x: 0.34, y: 0.22, w: 0.22 },
  { x: 0.6, y: 0.24, w: 0.23 },
  { x: 0.82, y: 0.28, w: 0.16 },
  { x: 0.01, y: 0.48, w: 0.21 },
  { x: 0.24, y: 0.46, w: 0.24 },
  { x: 0.5, y: 0.5, w: 0.22 },
  { x: 0.74, y: 0.52, w: 0.2 },
  { x: 0.08, y: 0.7, w: 0.23 },
  { x: 0.32, y: 0.68, w: 0.25 },
  { x: 0.58, y: 0.72, w: 0.21 },
  { x: 0.8, y: 0.7, w: 0.18 },
  { x: 0.04, y: 0.88, w: 0.2 },
  { x: 0.26, y: 0.9, w: 0.22 },
  { x: 0.52, y: 0.86, w: 0.24 },
  { x: 0.76, y: 0.88, w: 0.2 },
  { x: 0.14, y: 0.12, w: 0.18 },
  { x: 0.44, y: 0.38, w: 0.19 },
  { x: 0.68, y: 0.4, w: 0.21 },
  { x: 0.18, y: 0.58, w: 0.2 },
  { x: 0.42, y: 0.78, w: 0.22 },
]

const SCENE_ASPECT = 0.82

function jitterFor(id) {
  const seed = hashSeed(id)
  const r1 = ((seed * 9301 + 49297) % 233280) / 233280
  const r2 = (((seed + 1) * 9301 + 49297) % 233280) / 233280
  return {
    dx: (r1 - 0.5) * 0.03,
    dy: (r2 - 0.5) * 0.025,
    scale: 0.92 + (r1 * 0.12),
  }
}

/**
 * @returns {{ positions: Array<{id, left, top, width, baseScale}>, height: number }}
 */
export function layoutGalleryScenes(people, containerWidth) {
  const n = people.length
  if (!n || !containerWidth) {
    return { positions: [], height: 320 }
  }

  const mobile = containerWidth < 720
  if (mobile) {
    const cols = containerWidth < 420 ? 2 : 3
    const gap = 12
    const pad = 12
    const cellW = (containerWidth - pad * 2 - gap * (cols - 1)) / cols
    const cellH = cellW * SCENE_ASPECT

    const positions = people.map((person, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const j = jitterFor(person.id)
      return {
        id: person.id,
        left: pad + col * (cellW + gap),
        top: pad + row * (cellH + gap),
        width: cellW * j.scale,
        baseScale: 1,
      }
    })

    const rows = Math.ceil(n / cols)
    const height = pad * 2 + rows * cellH + Math.max(0, rows - 1) * gap + 8
    return { positions, height }
  }

  let maxBottom = 0
  const positions = people.map((person, i) => {
    const anchor = GALLERY_ANCHORS[i % GALLERY_ANCHORS.length]
    const j = jitterFor(`${person.id}-${i}`)
    const width = containerWidth * anchor.w * j.scale
    const left = containerWidth * (anchor.x + j.dx)
    const top = containerWidth * (anchor.y + j.dy) * 0.72
    const itemH = width * SCENE_ASPECT
    maxBottom = Math.max(maxBottom, top + itemH)
    return {
      id: person.id,
      left,
      top,
      width,
      baseScale: 1,
    }
  })

  return {
    positions,
    height: Math.max(420, maxBottom + 48),
  }
}
