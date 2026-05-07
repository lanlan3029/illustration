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

  const canvas = document.createElement('canvas')
  const canvasWidth = 1024
  const imageHeight = 620
  const padding = 44
  const diaryLines = wrapTextLines(diaryText, 28)
  const quoteLines = captionLine ? wrapTextLines(captionLine, 32) : []
  const lineHeight = 42
  const quoteExtra = quoteLines.length ? quoteLines.length * 34 + 40 : 0
  const textHeight = Math.max(180, diaryLines.length * lineHeight + 60 + quoteExtra)
  canvas.width = canvasWidth
  canvas.height = imageHeight + textHeight + padding * 2

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const cardX = 36
  const cardY = 36
  const cardWidth = canvasWidth - 72
  const cardHeight = canvas.height - 72
  roundRectPath(ctx, cardX, cardY, cardWidth, cardHeight, 34)
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(42, 31, 66, 0.16)'
  ctx.shadowBlur = 26
  ctx.shadowOffsetY = 8
  ctx.fill()
  ctx.restore()

  const imageX = cardX + 24
  const imageY = cardY + 24
  const imageW = cardWidth - 48
  const imageH = imageHeight - 24
  ctx.save()
  roundRectPath(ctx, imageX, imageY, imageW, imageH, 28)
  ctx.clip()
  const drawSize = fitContain(image.width, image.height, imageW, imageH)
  const drawX = imageX + (imageW - drawSize.width) / 2
  const drawY = imageY + (imageH - drawSize.height) / 2
  ctx.filter = 'blur(0.3px)'
  ctx.drawImage(image, drawX, drawY, drawSize.width, drawSize.height)
  ctx.restore()
  ctx.filter = 'none'

  const textY = imageY + imageH + 36
  const moodFontSize = 36
  const moodFontFamily =
    '"阿里妈妈灵动体", "苦累蛙圓體", "寒蝉圆体", "Caveat", "PingFang SC", "Microsoft YaHei", sans-serif'
  await ensureMoodFontReady('阿里妈妈灵动体', moodFontSize, diaryLines.join(''))
  ctx.fillStyle = '#2a1f42'
  ctx.font = `400 ${moodFontSize}px ${moodFontFamily}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'
  const textCenterX = imageX + imageW / 2
  diaryLines.forEach((line, index) => {
    ctx.fillText(line, textCenterX, textY + index * lineHeight)
  })

  let yAfter = textY + diaryLines.length * lineHeight + 16
  if (quoteLines.length) {
    ctx.font = `italic 400 26px ${moodFontFamily}`
    ctx.fillStyle = '#5a4b7a'
    quoteLines.forEach((line, i) => {
      ctx.fillText(`「${line}」`, textCenterX, yAfter + i * 34)
    })
    yAfter += quoteLines.length * 34
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}
