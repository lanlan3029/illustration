import { hashSeed } from '@/utils/avatarCrowd'

const SCENE_ASPECT = 0.82
const ITEM_WIDTH_RATIO = 0.15
const MIN_GAP = 18
const PAD = 12
const MAX_RESOLVE_STEPS = 72

function seededUnit(seed) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/** 旋转后的外接矩形尺寸 */
function rotatedSize(width, height, rotateDeg) {
  if (!rotateDeg) return { width, height }
  const rad = (Math.abs(rotateDeg) * Math.PI) / 180
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)
  return {
    width: Math.abs(width * cos) + Math.abs(height * sin),
    height: Math.abs(width * sin) + Math.abs(height * cos),
  }
}

function collisionBox(rect, gap = 0) {
  const rb = rotatedSize(rect.width, rect.height, rect.rotate || 0)
  const padX = (rb.width - rect.width) / 2
  const padY = (rb.height - rect.height) / 2
  return {
    left: rect.left - padX - gap / 2,
    top: rect.top - padY - gap / 2,
    width: rb.width + gap,
    height: rb.height + gap,
  }
}

function rectsOverlap(a, b) {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  )
}

function collidesAny(candidate, placed, gap) {
  const box = collisionBox(candidate, gap)
  return placed.some((p) => rectsOverlap(box, collisionBox(p, gap)))
}

function itemMetrics(person, index) {
  const seed = hashSeed(`${person.id}-${index}`)
  const r1 = seededUnit(seed)
  const r2 = seededUnit(seed + 11)
  const r3 = seededUnit(seed + 23)
  const r4 = seededUnit(seed + 31)
  const r5 = seededUnit(seed + 47)

  const widthRatio = ITEM_WIDTH_RATIO * (0.88 + r1 * 0.22)
  const rotate = (r2 - 0.5) * 8
  const baseScale = 0.92 + r5 * 0.12

  return {
    widthRatio,
    rotate,
    baseScale,
    jx: (r3 - 0.5) * 1.2,
    jy: (r4 - 0.5) * 1.2,
  }
}

function resolvePosition(candidate, placed, containerWidth, gap) {
  if (!collidesAny(candidate, placed, gap)) {
    return candidate
  }

  let fallback = { ...candidate }
  let fallbackScore = Infinity

  for (let step = 1; step <= MAX_RESOLVE_STEPS; step += 1) {
    const ring = Math.ceil(step / 8)
    const dir = (step - 1) % 8
    const angle = (dir * Math.PI) / 4
    const dx = Math.cos(angle) * ring * (gap + 5)
    const dy = Math.sin(angle) * ring * (gap + 4)

    const left = clamp(
      candidate.left + dx,
      PAD,
      containerWidth - candidate.width - PAD
    )
    const top = Math.max(PAD, candidate.top + dy)
    const tryRect = { ...candidate, left, top }

    if (!collidesAny(tryRect, placed, gap)) {
      return tryRect
    }

    const score = Math.abs(dx) + Math.abs(dy) * 1.15
    if (score < fallbackScore) {
      fallbackScore = score
      fallback = tryRect
    }
  }

  const bottom = placed.reduce((m, p) => Math.max(m, p.top + p.height), PAD)
  const dropped = {
    ...candidate,
    left: clamp(candidate.left, PAD, containerWidth - candidate.width - PAD),
    top: bottom + gap,
  }
  if (!collidesAny(dropped, placed, gap)) {
    return dropped
  }

  return fallback
}

/**
 * 砖墙散落：按列居中 + 旋转外接盒碰撞检测，避免重叠
 */
export function layoutGalleryScenes(people, containerWidth) {
  const n = people.length
  if (!n || !containerWidth) {
    return { positions: [], height: 320 }
  }

  const mobile = containerWidth < 720
  const avgW = containerWidth * ITEM_WIDTH_RATIO

  const cols = mobile
    ? containerWidth < 420
      ? 2
      : 3
    : Math.max(3, Math.min(5, Math.floor((containerWidth - PAD * 2 + MIN_GAP) / (avgW + MIN_GAP))))

  const cellW = (containerWidth - PAD * 2) / cols
  const placed = []
  let rowY = PAD
  let rowIndex = 0
  let rowMaxH = 0

  people.forEach((person, index) => {
    const col = index % cols
    if (col === 0 && index > 0) {
      rowY += rowMaxH + MIN_GAP + seededUnit(hashSeed(`row-gap-${rowIndex}`)) * 10
      rowMaxH = 0
      rowIndex += 1
    }

    const { widthRatio, rotate, baseScale, jx, jy } = itemMetrics(person, index)
    const width = Math.min(cellW * 0.76, Math.max(90, containerWidth * widthRatio))
    const height = width * SCENE_ASPECT
    rowMaxH = Math.max(rowMaxH, height)

    const brick = rowIndex % 2 === 1 ? cellW * 0.18 : 0
    const jitterX = jx * Math.min(10, cellW * 0.05)
    const jitterY = jy * Math.min(8, height * 0.05)

    const baseLeft = PAD + col * cellW + (cellW - width) / 2 + brick + jitterX
    const baseTop = rowY + jitterY

    let candidate = {
      id: person.id,
      left: baseLeft,
      top: baseTop,
      width,
      height,
      rotate,
      baseScale,
    }

    candidate = resolvePosition(candidate, placed, containerWidth, MIN_GAP)
    candidate.left = clamp(candidate.left, PAD, containerWidth - candidate.width - PAD)

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
    height: Math.max(mobile ? 280 : 340, maxBottom + PAD + 24),
  }
}
