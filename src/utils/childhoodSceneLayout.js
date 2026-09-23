import { hashSeed } from '@/utils/avatarCrowd'

const SCENE_ASPECT = 0.82
const ITEM_WIDTH_RATIO = 0.115
const MIN_GAP = 10
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

function itemMetrics(person, index) {
  const seed = hashSeed(`${person.id}-${index}`)
  const r1 = seededUnit(seed)
  const r2 = seededUnit(seed + 11)
  const r3 = seededUnit(seed + 23)
  const r4 = seededUnit(seed + 31)
  const r5 = seededUnit(seed + 47)

  const widthRatio = ITEM_WIDTH_RATIO * (0.84 + r1 * 0.32)
  const rotate = (r2 - 0.5) * 12
  const baseScale = 0.9 + r5 * 0.16

  return {
    widthRatio,
    rotate,
    baseScale,
    jx: (r3 - 0.5) * 2,
    jy: (r4 - 0.5) * 2,
  }
}

/**
 * 砖墙散落：尺寸/旋转/行距略有差异，铺满宽度但不排成整齐网格
 */
export function layoutGalleryScenes(people, containerWidth) {
  const n = people.length
  if (!n || !containerWidth) {
    return { positions: [], height: 320 }
  }

  const mobile = containerWidth < 720
  const usableWidth = Math.max(0, containerWidth - PAD * 2)
  const avgW = containerWidth * ITEM_WIDTH_RATIO
  const avgH = avgW * SCENE_ASPECT

  const cols = mobile
    ? containerWidth < 420
      ? 2
      : 3
    : Math.max(3, Math.min(6, Math.floor((usableWidth + MIN_GAP) / (avgW + MIN_GAP))))

  const rows = Math.ceil(n / cols)
  const brickShift = avgW * 0.42

  const rowTops = []
  let yCursor = PAD
  for (let row = 0; row < rows; row += 1) {
    rowTops[row] = yCursor
    const rowStart = row * cols
    const rowEnd = Math.min(n, rowStart + cols)
    let rowMaxH = avgH
    for (let i = rowStart; i < rowEnd; i += 1) {
      const { widthRatio } = itemMetrics(people[i], i)
      rowMaxH = Math.max(rowMaxH, containerWidth * widthRatio * SCENE_ASPECT)
    }
    const rowGap = MIN_GAP + seededUnit(hashSeed(`row-gap-${row}`)) * 12
    yCursor += rowMaxH + rowGap
  }

  const placed = []

  people.forEach((person, index) => {
    const { widthRatio, rotate, baseScale, jx, jy } = itemMetrics(person, index)
    const width = containerWidth * widthRatio
    const height = width * SCENE_ASPECT

    const col = index % cols
    const row = Math.floor(index / cols)
    const brick = row % 2 === 1 ? brickShift : 0

    const maxJx = Math.min(22, width * 0.12 + MIN_GAP * 0.5)
    const maxJy = Math.min(16, height * 0.08 + MIN_GAP * 0.4)

    let left = PAD + brick + col * (avgW + MIN_GAP) + jx * maxJx
    let top = rowTops[row] + jy * maxJy

    left = Math.max(PAD, Math.min(left, containerWidth - width - PAD))

    const candidate = {
      id: person.id,
      left,
      top,
      width,
      height,
      rotate,
      baseScale,
    }

    const collides = placed.some((p) => rectsOverlap(candidate, p, MIN_GAP * 0.45))

    if (collides) {
      candidate.left = PAD + brick + col * (avgW + MIN_GAP) + jx * maxJx * 0.35
      candidate.top = rowTops[row] + jy * maxJy * 0.35
      candidate.rotate = rotate * 0.55
      candidate.left = Math.max(PAD, Math.min(candidate.left, containerWidth - width - PAD))
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
    height: Math.max(mobile ? 280 : 340, maxBottom + PAD + 20),
  }
}
