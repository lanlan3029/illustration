import { hashSeed } from '@/utils/avatarCrowd'

const SCENE_ASPECT = 0.82
const ITEM_WIDTH_RATIO = 0.12
const MIN_GAP = 14
const PAD = 12

function seededUnit(seed) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function itemMetrics(person, index) {
  const seed = hashSeed(`${person.id}-${index}`)
  const r1 = seededUnit(seed)
  const r2 = seededUnit(seed + 11)
  const r3 = seededUnit(seed + 23)

  const widthRatio = ITEM_WIDTH_RATIO * (0.88 + r1 * 0.2)
  const rotate = (r2 - 0.5) * 6

  return { widthRatio, rotate, jx: (r3 - 0.5) * 2, jy: (seededUnit(seed + 31) - 0.5) * 2 }
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
 * 紧凑砖墙 + 小幅抖动：避免螺旋/随机落点造成的大片空白
 * @returns {{ positions: Array<{id, left, top, width, height, rotate, baseScale}>, height: number }}
 */
export function layoutGalleryScenes(people, containerWidth) {
  const n = people.length
  if (!n || !containerWidth) {
    return { positions: [], height: 320 }
  }

  const mobile = containerWidth < 720
  const avgW = containerWidth * ITEM_WIDTH_RATIO
  const avgH = avgW * SCENE_ASPECT
  const cols = mobile
    ? containerWidth < 420
      ? 2
      : 3
    : Math.max(3, Math.min(5, Math.floor((containerWidth - PAD * 2 + MIN_GAP) / (avgW + MIN_GAP))))
  const rows = Math.ceil(n / cols)
  const brickShift = avgW * 0.42

  const placed = []

  people.forEach((person, index) => {
    const { widthRatio, rotate, jx, jy } = itemMetrics(person, index)
    const width = containerWidth * widthRatio
    const height = width * SCENE_ASPECT

    const col = index % cols
    const row = Math.floor(index / cols)
    const brick = row % 2 === 1 ? brickShift : 0

    const baseLeft = PAD + brick + col * (avgW + MIN_GAP)
    const baseTop = PAD + row * (avgH + MIN_GAP)

    const maxJx = Math.min(10, MIN_GAP * 0.45)
    const maxJy = Math.min(8, MIN_GAP * 0.35)

    let left = baseLeft + jx * maxJx
    let top = baseTop + jy * maxJy

    left = Math.max(PAD, Math.min(left, containerWidth - width - PAD))

    const candidate = {
      id: person.id,
      left,
      top,
      width,
      height,
      rotate,
      baseScale: 1,
    }

    const collides = placed.some((p) =>
      rectsOverlap(candidate, p, MIN_GAP * 0.6)
    )

    if (collides) {
      candidate.left = baseLeft
      candidate.top = baseTop
      candidate.rotate = rotate * 0.5
    }

    placed.push(candidate)
  })

  const maxBottom = placed.reduce((m, p) => Math.max(m, p.top + p.height), PAD)
  const positions = placed.map(({ id, left, top, width, height, rotate, baseScale }) => ({
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
