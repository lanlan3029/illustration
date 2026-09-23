import { hashSeed } from '@/utils/avatarCrowd'
import { loadImage } from '@/utils/lassoCrop'

const BG = '#faf4f2'
const SCENE_ASPECT = 0.82

/** 归一化槽位：避开中心 hero 区 */
const CROWD_SLOTS = [
  { x: 0.03, y: 0.05, w: 0.24, rot: -10 },
  { x: 0.74, y: 0.03, w: 0.22, rot: 8 },
  { x: 0.02, y: 0.34, w: 0.21, rot: 6 },
  { x: 0.76, y: 0.32, w: 0.23, rot: -7 },
  { x: 0.06, y: 0.62, w: 0.2, rot: -5 },
  { x: 0.72, y: 0.6, w: 0.22, rot: 9 },
  { x: 0.28, y: 0.02, w: 0.18, rot: 4 },
  { x: 0.52, y: 0.04, w: 0.19, rot: -6 },
  { x: 0.18, y: 0.78, w: 0.2, rot: 7 },
  { x: 0.58, y: 0.76, w: 0.21, rot: -8 },
  { x: 0.38, y: 0.68, w: 0.17, rot: 5 },
  { x: 0.82, y: 0.78, w: 0.16, rot: -4 },
]

function seededUnit(seed) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

async function loadOptionalImage(src) {
  if (!src) return null
  try {
    return await loadImage(src)
  } catch {
    return null
  }
}

/** 底对齐绘制，与页面 gallery 一致 */
function drawImageContainBottom(ctx, img, cx, bottomY, maxW, maxH, rotateDeg = 0, alpha = 1) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return

  const scale = Math.min(maxW / iw, maxH / ih)
  const w = iw * scale
  const h = ih * scale

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cx, bottomY)
  ctx.rotate((rotateDeg * Math.PI) / 180)
  ctx.drawImage(img, -w / 2, -h, w, h)
  ctx.restore()
}

function drawSoftShadow(ctx, cx, bottomY, w, h) {
  ctx.save()
  ctx.fillStyle = 'rgba(80, 60, 100, 0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, bottomY + 6, w * 0.38, h * 0.06, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * 合成分享图：用户插画居中，周围散落其他童年图
 * @param {{ heroSrc: string, crowdSrcs?: string[], width?: number, height?: number, seed?: number }} options
 * @returns {Promise<string>} JPEG data URL
 */
export async function drawChildhoodSharePoster(options = {}) {
  const {
    heroSrc,
    crowdSrcs = [],
    width = 750,
    height = 750,
    seed = Date.now(),
  } = options

  if (!heroSrc) {
    throw new Error('heroSrc required')
  }

  const heroImg = await loadOptionalImage(heroSrc)
  if (!heroImg) {
    throw new Error('hero image load failed')
  }

  const crowdImgs = await Promise.all(
    crowdSrcs.slice(0, CROWD_SLOTS.length).map((src) => loadOptionalImage(src))
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, width, height)

  const heroW = width * 0.48
  const heroH = heroW / SCENE_ASPECT
  const heroCx = width * 0.5
  const heroBottom = height * 0.72

  CROWD_SLOTS.forEach((slot, index) => {
    const img = crowdImgs[index]
    if (!img) return

    const jitter = seededUnit(hashSeed(`${seed}-${index}`))
    const slotW = width * slot.w * (0.92 + jitter * 0.12)
    const slotH = slotW / SCENE_ASPECT
    const cx = width * slot.x + slotW * 0.5 + (jitter - 0.5) * width * 0.02
    const bottomY = height * slot.y + slotH + (jitter - 0.5) * height * 0.015
    const rot = slot.rot + (jitter - 0.5) * 6

    drawSoftShadow(ctx, cx, bottomY, slotW, slotH)
    drawImageContainBottom(ctx, img, cx, bottomY, slotW, slotH, rot, 0.88)
  })

  drawSoftShadow(ctx, heroCx, heroBottom, heroW, heroH)
  drawImageContainBottom(ctx, heroImg, heroCx, heroBottom, heroW, heroH, 0, 1)

  return canvas.toDataURL('image/jpeg', 0.9)
}
