import { hashSeed } from '@/utils/avatarCrowd'

const SCENE_ASPECT = 0.82
const MIN_GAP = 18
const PAD = 10

function seededUnit(seed) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function itemMetrics(person, index, containerWidth, attempt) {
  const seed = hashSeed(`${person.id}-${index}-${attempt}`)
  const r1 = seededUnit(seed)
  const r2 = seededUnit(seed + 11)
  const r3 = seededUnit(seed + 23)
  const r4 = seededUnit(seed + 37)

  const baseW = containerWidth * 0.105
  const width = baseW * (0.82 + r1 * 0.28)
  const height = width * SCENE_ASPECT
  const rotate = (r2 - 0.5) * 7

  return { width, height, rotate, r3, r4 }
}

function rectsOverlap(a, b, gap) {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  )
}

function spiralCandidate(index, attempt, metrics, containerWidth, maxY) {
  const seed = hashSeed(`pos-${index}-${attempt}`)
  const r1 = seededUnit(seed)
  const r2 = seededUnit(seed + 13)
  const r3 = seededUnit(seed + 29)

  const angle = index * 2.399963 + attempt * 0.85 + (r1 - 0.5) * 1.4
  const radius = (18 + Math.sqrt(index + 1) * 28 + attempt * 6) * (0.88 + r2 * 0.22)

  const cx = containerWidth * (0.38 + r3 * 0.18)
  const cy = containerWidth * 0.28 + index * 6

  let left = cx + Math.cos(angle) * radius - metrics.width / 2
  let top = cy + Math.sin(angle) * radius * 0.72 - metrics.height / 2

  left += (metrics.r3 - 0.5) * containerWidth * 0.08
  top += (metrics.r4 - 0.5) * containerWidth * 0.06

  left = Math.max(PAD, Math.min(left, containerWidth - metrics.width - PAD))
  top = Math.max(PAD, Math.min(top, Math.max(maxY, containerWidth * 1.05)))

  return { left, top }
}

function randomCandidate(index, attempt, metrics, containerWidth, maxY) {
  const seed = hashSeed(`rand-${index}-${attempt}`)
  const r1 = seededUnit(seed)
  const r2 = seededUnit(seed + 17)

  const left = PAD + r1 * Math.max(0, containerWidth - metrics.width - PAD * 2)
  const top = PAD + r2 * Math.max(maxY, containerWidth * 0.95)

  return { left, top }
}

function placeOne(person, index, containerWidth, placed) {
  const maxAttempts = 64

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const metrics = itemMetrics(person, index, containerWidth, attempt)
    const maxY = placed.reduce((m, p) => Math.max(m, p.top + p.height), PAD)

    const useSpiral = attempt < 36
    const { left, top } = useSpiral
      ? spiralCandidate(index, attempt, metrics, containerWidth, maxY)
      : randomCandidate(index, attempt - 36, metrics, containerWidth, maxY + 20)

    const candidate = {
      id: person.id,
      left,
      top,
      width: metrics.width,
      height: metrics.height,
      rotate: metrics.rotate,
      baseScale: 1,
    }

    const collides = placed.some((p) =>
      rectsOverlap(
        { left: candidate.left, top: candidate.top, width: candidate.width, height: candidate.height },
        { left: p.left, top: p.top, width: p.width, height: p.height },
        MIN_GAP
      )
    )

    if (!collides) return candidate
  }

  const metrics = itemMetrics(person, index, 999)
  const fallbackTop = placed.reduce((m, p) => Math.max(m, p.top + p.height + MIN_GAP), PAD)
  return {
    id: person.id,
    left: PAD + (index % 3) * (metrics.width + MIN_GAP),
    top: fallbackTop,
    width: metrics.width,
    height: metrics.height,
    rotate: 0,
    baseScale: 1,
  }
}

/**
 * @returns {{ positions: Array<{id, left, top, width, height, rotate, baseScale}>, height: number }}
 */
export function layoutGalleryScenes(people, containerWidth) {
  const n = people.length
  if (!n || !containerWidth) {
    return { positions: [], height: 320 }
  }

  const mobile = containerWidth < 720
  if (mobile) {
    const cols = containerWidth < 420 ? 2 : 3
    const gap = 16
    const pad = PAD
    const cellW = ((containerWidth - pad * 2 - gap * (cols - 1)) / cols) * 0.92
    const cellH = cellW * SCENE_ASPECT

    const positions = people.map((person, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const seed = hashSeed(person.id)
      const rotate = (seededUnit(seed) - 0.5) * 5
      return {
        id: person.id,
        left: pad + col * (cellW + gap),
        top: pad + row * (cellH + gap),
        width: cellW,
        height: cellH,
        rotate,
        baseScale: 1,
      }
    })

    const rows = Math.ceil(n / cols)
    const height = pad * 2 + rows * cellH + Math.max(0, rows - 1) * gap + 16
    return { positions, height }
  }

  const placed = []
  people.forEach((person, index) => {
    placed.push(placeOne(person, index, containerWidth, placed))
  })

  const maxBottom = placed.reduce((m, p) => Math.max(m, p.top + p.height), 0)
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
    height: Math.max(380, maxBottom + PAD + 32),
  }
}
