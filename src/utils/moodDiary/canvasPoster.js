import { normalizeImageUrl } from './draft'

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function fitContain(sourceW, sourceH, maxW, maxH) {
  const ratio = Math.min(maxW / sourceW, maxH / sourceH)
  return { width: sourceW * ratio, height: sourceH * ratio }
}

function fitCover(sourceW, sourceH, maxW, maxH) {
  const ratio = Math.max(maxW / sourceW, maxH / sourceH)
  return { width: sourceW * ratio, height: sourceH * ratio }
}

function wrapTextLines(text, maxCharsPerLine) {
  if (!text) return ['']
  const lines = []
  let current = ''
  Array.from(text).forEach((ch) => {
    current += ch
    if (current.length >= maxCharsPerLine) {
      lines.push(current)
      current = ''
    }
  })
  if (current) lines.push(current)
  return lines.slice(0, 10)
}

async function ensureMoodFontReady(family, size, sampleText) {
  const spec = `${size}px "${family}"`
  const sample =
    sampleText && sampleText.trim() ? sampleText.slice(0, 32) : '心情日记字体测试'
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = [
    'position:absolute',
    'left:-9999px',
    'top:-9999px',
    'visibility:hidden',
    'pointer-events:none',
    `font:${spec}`,
    'white-space:pre'
  ].join(';')
  probe.textContent = sample
  document.body.appendChild(probe)

  try {
    if (document.fonts?.load) {
      try {
        await document.fonts.load(spec, sample)
      } catch (_) {
        /* ignore */
      }
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  } finally {
    if (probe.parentNode) probe.parentNode.removeChild(probe)
  }
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('load image failed'))
    img.src = url
  })
}

/**
 * Compose illustration + diary text (+ optional caption line).
 * @param {string} imageUrl
 * @param {string} diaryText
 * @param {{ captionLine?: string }} opts
 */
export async function composeMoodPoster(imageUrl, diaryText, opts = {}) {
  const sourceUrl = await normalizeImageUrl(imageUrl)
  const image = await loadImage(sourceUrl)
  const captionLine = (opts.captionLine || '').trim()

  // 与小程序保持一致：逻辑尺寸 675x1200，导出倍率 x2 => 1350x2400
  const POSTER_W = 675
  const POSTER_H = 1200
  const POSTER_EXPORT_MULTIPLIER = 2

  const SX = POSTER_W / 300
  const SY = POSTER_H / 500

  const canvas = document.createElement('canvas')
  canvas.width = POSTER_W * POSTER_EXPORT_MULTIPLIER
  canvas.height = POSTER_H * POSTER_EXPORT_MULTIPLIER

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')
  ctx.scale(POSTER_EXPORT_MULTIPLIER, POSTER_EXPORT_MULTIPLIER)

  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const cardX = 8 * SX
  const cardY = 8 * SY
  const cardW = POSTER_W - cardX * 2
  const cardH = POSTER_H - cardY * 2
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 12 * SX)
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // 主图区域：w - 36*SX, 270*SY => 594x648（逻辑）
  const imageW = POSTER_W - 36 * SX
  const imageH = 270 * SY
  const imageX = (POSTER_W - imageW) / 2
  const imageY = cardY + 35 * SY
  ctx.save()
  roundRectPath(ctx, imageX, imageY, imageW, imageH, 12 * SX)
  ctx.clip()
  const drawSize = fitCover(image.width, image.height, imageW, imageH)
  const drawX = imageX + (imageW - drawSize.width) / 2
  const drawY = imageY + (imageH - drawSize.height) / 2
  ctx.drawImage(image, drawX, drawY, drawSize.width, drawSize.height)
  ctx.restore()

  const diaryLines = wrapTextLines(diaryText, 19)
  const quoteLines = captionLine ? wrapTextLines(captionLine, 22) : []
  const textY = imageY + imageH + 28 * SY
  const moodFontSize = Math.round(14 * SX)
  const lineHeight = Math.round(22 * SY)
  const moodFontFamily =
    '"阿里妈妈灵动体", "苦累蛙圓體", "寒蝉圆体", "Caveat", "PingFang SC", "Microsoft YaHei", sans-serif'
  await ensureMoodFontReady('阿里妈妈灵动体', moodFontSize, diaryLines.join(''))
  ctx.fillStyle = '#2f3137'
  ctx.font = `400 ${moodFontSize}px ${moodFontFamily}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'
  const textCenterX = POSTER_W / 2
  diaryLines.forEach((line, index) => {
    ctx.fillText(line, textCenterX, textY + index * lineHeight)
  })

  let yAfter = textY + diaryLines.length * lineHeight + 10 * SY
  if (quoteLines.length) {
    ctx.font = `italic 400 ${Math.round(11 * SX)}px ${moodFontFamily}`
    ctx.fillStyle = '#5a5c63'
    quoteLines.forEach((line, i) => {
      ctx.fillText(`「${line}」`, textCenterX, yAfter + i * Math.round(16 * SY))
    })
    yAfter += quoteLines.length * Math.round(16 * SY)
  }

  return canvas.toDataURL('image/png')
}
