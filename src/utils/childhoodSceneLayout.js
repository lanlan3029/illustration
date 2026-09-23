import { hashSeed } from '@/utils/avatarCrowd'

const SCENE_ASPECT = 0.82
const MIN_GAP = 12
const PAD = 10

function seededUnit(seed) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function rectsOverlap(a, b, gap) {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  )
}

/**
 * 砖墙布局：列宽撑满容器，左右 padding 对称
 * @returns {{ positions: Array<{id, left, top, width, height, rotate, baseScale}>, height: number }}
 */
export function layoutGalleryScenes(people, containerWidth) {
  const n = people.length
  if (!n || !containerWidth) {
    return { positions: [], height: 320 }
  }

  const mobile = containerWidth < 720
  const usableWidth = Math.max(0, containerWidth - PAD * 2)
  const minItemWidth = mobile ? 64 : 72
  const maxCols = Math.max(2, Math.floor((usableWidth + MIN_GAP) / (minItemWidth + MIN_GAP)))

  let cols = mobile ? (containerWidth < 420 ? 2 : Math.min(3, maxCols)) : Math.min(maxCols, 6)
  cols = Math.max(1, Math.min(cols, n))

  const itemWidth = (usableWidth - (cols - 1) * MIN_GAP) / cols
  const itemHeight = itemWidth * SCENE_ASPECT

  const placed = []

  people.forEach((person, index) => {
    const seed = hashSeed(`${person.id}-${index}`)
    const r2 = seededUnit(seed + 11)
    const r3 = seededUnit(seed + 23)
    const rotate = (r2 - 0.5) * 5
    const jx = (r3 - 0.5) * Math.min(6, MIN_GAP * 0.35)
    const jy = (seededUnit(seed + 31) - 0.5) * Math.min(6, MIN_GAP * 0.3)

    const col = index % cols
    const row = Math.floor(index / cols)
    const rowStart = row * cols
    const itemsInRow = Math.min(cols, n - rowStart)
    const rowWidth = itemsInRow * itemWidth + (itemsInRow - 1) * MIN_GAP
    const rowOffset = (usableWidth - rowWidth) / 2

    let left = PAD + rowOffset + col * (itemWidth + MIN_GAP) + jx
    let top = PAD + row * (itemHeight + MIN_GAP) + jy

    left = Math.max(PAD, Math.min(left, PAD + usableWidth - itemWidth))

    const candidate = {
      id: person.id,
      left,
      top,
      width: itemWidth,
      height: itemHeight,
      rotate,
      baseScale: 1,
    }

    const collides = placed.some((p) => rectsOverlap(candidate, p, MIN_GAP * 0.5))

    if (collides) {
      candidate.left = PAD + rowOffset + col * (itemWidth + MIN_GAP)
      candidate.top = PAD + row * (itemHeight + MIN_GAP)
      candidate.rotate = rotate * 0.5
    }

    placed.push(candidate)
  })

  const maxBottom = placed.reduce((m, p) => Math.max(m, p.top + p.height), PAD)
  const positions = placed.map(({ id, left, top, width, rotate, baseScale }) => ({
    id,
    left,
    top,
    width,
    rotate,
    baseScale,
  }))

  return {
    positions,
    height: Math.max(mobile ? 280 : 340, maxBottom + PAD + 16),
  }
}
