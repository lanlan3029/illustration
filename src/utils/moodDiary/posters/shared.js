import { normalizeImageUrl } from '../draft'
import {
  COLORS,
  POSTER_EXPORT_MULTIPLIER,
  POSTER_FONT_STACK,
  POSTER_H,
  POSTER_QUOTE_FONT_COMPACT,
  POSTER_QUOTE_LINE_COMPACT,
  POSTER_USER_BODY_COMPACT_MAX_CHARS,
  POSTER_USER_BODY_MAX_CHARS,
  POSTER_W,
  SF,
  SX,
  SY
} from './constants'

export function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

export function fitCover(sourceW, sourceH, maxW, maxH) {
  const ratio = Math.max(maxW / sourceW, maxH / sourceH)
  return { width: sourceW * ratio, height: sourceH * ratio }
}

export function fitContain(sourceW, sourceH, maxW, maxH) {
  const ratio = Math.min(maxW / sourceW, maxH / sourceH)
  return { width: sourceW * ratio, height: sourceH * ratio }
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

export async function loadPosterImage(url) {
  const sourceUrl = await normalizeImageUrl(url)
  return loadImage(sourceUrl)
}

export function isLightHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return true
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

export function resolveTheme(kind, dominantHex = COLORS.accent) {
  const hex = dominantHex || COLORS.accent
  const light = isLightHex(hex)
  if (kind === 'cream') {
    return {
      pillBg: hex,
      pillTextColor: light ? COLORS.accentStrong : '#fff',
      dateColor: COLORS.textSecondary,
      brandColor: COLORS.textSecondary,
      textColor: COLORS.primary
    }
  }
  if (kind === 'paper') {
    return {
      pillBg: hex,
      pillTextColor: light ? COLORS.primary : '#fff',
      dateColor: COLORS.textSecondary,
      brandColor: COLORS.textSecondary,
      textColor: COLORS.primary
    }
  }
  return {
    pillBg: light ? 'rgba(17,17,17,0.78)' : '#fff',
    pillTextColor: light ? '#fff' : '#111',
    dateColor: light ? 'rgba(17,17,17,0.78)' : 'rgba(255,255,255,0.85)',
    brandColor: light ? 'rgba(17,17,17,0.72)' : 'rgba(255,255,255,0.78)',
    textColor: light ? COLORS.primary : '#fff'
  }
}

export function formatPosterDate(ts, locale) {
  const d = new Date(ts || Date.now())
  if (locale === 'zh' || locale?.startsWith?.('zh')) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }
  return d.toLocaleDateString(locale || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function truncateMoodLabel(label) {
  const t = String(label || '').trim()
  if (t.length <= 14) return t
  return `${t.slice(0, 14)}…`
}

function truncateAtPunctuation(text, maxLen) {
  if (text.length <= maxLen) return text
  const slice = text.slice(0, maxLen)
  const marks = ['。', '！', '？', '，', '；', '、', '.', '!', '?', ',', ';']
  for (let i = slice.length - 1; i >= Math.floor(maxLen * 0.5); i--) {
    if (marks.includes(slice[i])) return slice.slice(0, i + (marks.indexOf(slice[i]) < 3 ? 1 : 0))
  }
  return `${slice}…`
}

export function prepareBodyText(text) {
  const raw = String(text || '').trim()
  if (!raw) return { text: '', compact: false, maxChars: POSTER_USER_BODY_MAX_CHARS }
  const compact = raw.length > POSTER_USER_BODY_MAX_CHARS
  const maxChars = compact ? POSTER_USER_BODY_COMPACT_MAX_CHARS : POSTER_USER_BODY_MAX_CHARS
  return { text: truncateAtPunctuation(raw, maxChars), compact, maxChars }
}

export function wrapTextByWidth(ctx, text, maxWidth, maxLines = 12) {
  if (!text) return ['']
  const lines = []
  let line = ''
  for (const ch of text) {
    if (ch === '\n') {
      if (line) lines.push(line)
      line = ''
      continue
    }
    const next = line + ch
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
    if (lines.length >= maxLines) break
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines.length ? lines : ['']
}

export function drawBodyText(ctx, text, x, y, width, align, colors, compact) {
  const body = prepareBodyText(text)
  const fontSize = compact ? POSTER_QUOTE_FONT_COMPACT : Math.round(10 * SF)
  const lineHeight = compact ? POSTER_QUOTE_LINE_COMPACT : Math.round(16 * SY)
  ctx.font = `400 ${fontSize}px ${POSTER_FONT_STACK}`
  ctx.fillStyle = colors.textColor || COLORS.primary
  ctx.textBaseline = 'top'
  ctx.textAlign = align
  const lines = wrapTextByWidth(ctx, body.text, width)
  lines.forEach((ln, i) => {
    const ax = align === 'right' ? x + width : align === 'center' ? x + width / 2 : x
    ctx.fillText(ln, ax, y + i * lineHeight)
  })
  return y + lines.length * lineHeight
}

export function drawExcerpt(ctx, text, x, y, width, align, color, maxLines = 2) {
  const t = String(text || '').trim()
  if (!t) return y
  const fontSize = Math.round(7 * SF)
  const lineHeight = Math.round(11 * SY)
  ctx.font = `400 ${fontSize}px ${POSTER_FONT_STACK}`
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  ctx.textAlign = align
  const lines = wrapTextByWidth(ctx, t, width, maxLines)
  lines.forEach((ln, i) => {
    const ax = align === 'right' ? x + width : align === 'center' ? x + width / 2 : x
    ctx.fillText(`「${ln}」`, ax, y + i * lineHeight)
  })
  return y + lines.length * lineHeight
}

export function drawPosterHeader(ctx, opts) {
  const {
    theme,
    moodLabel = '',
    createdAt = Date.now(),
    locale = 'zh',
    pillHeight = 18,
    pillRadius = 9
  } = opts
  const pillRowCy = 26 * SY
  const dateX = 20 * SX
  ctx.font = `500 ${Math.round(10 * SF)}px ${POSTER_FONT_STACK}`
  ctx.fillStyle = theme.dateColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(formatPosterDate(createdAt, locale), dateX, pillRowCy)

  const mood = truncateMoodLabel(moodLabel)
  if (!mood) return
  const pillH = pillHeight * SY
  const pillPad = 14 * SX
  ctx.font = `600 ${Math.round(10 * SF)}px ${POSTER_FONT_STACK}`
  const textW = ctx.measureText(mood).width
  const pillW = Math.max(46 * SX, textW + pillPad)
  const pillX = POSTER_W - 18 * SX - pillW
  const pillY = pillRowCy - pillH / 2
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillRadius * SF)
  ctx.fillStyle = theme.pillBg
  ctx.fill()
  ctx.fillStyle = theme.pillTextColor
  ctx.textAlign = 'center'
  ctx.fillText(mood, pillX + pillW / 2, pillRowCy)
}

export function drawPosterFooter(ctx, theme, footerName) {
  const name = String(footerName || '').trim()
  if (!name) return
  const footerY = POSTER_H - 38 * SY
  const baseline = footerY + 12 * SY + 3 * SY
  ctx.font = `400 ${Math.round(6 * SF)}px ${POSTER_FONT_STACK}`
  ctx.fillStyle = theme.brandColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(name, POSTER_W / 2, baseline)
}

export function drawImageCover(ctx, img, x, y, w, h, radius = 0) {
  ctx.save()
  if (radius > 0) {
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.clip()
  }
  const size = fitCover(img.width, img.height, w, h)
  const dx = x + (w - size.width) / 2
  const dy = y + (h - size.height) / 2
  ctx.drawImage(img, dx, dy, size.width, size.height)
  ctx.restore()
}

export function drawImageContain(ctx, img, x, y, w, h) {
  const size = fitContain(img.width, img.height, w, h)
  const dx = x + (w - size.width) / 2
  const dy = y + (h - size.height) / 2
  ctx.drawImage(img, dx, dy, size.width, size.height)
}

export function createPosterCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = POSTER_W * POSTER_EXPORT_MULTIPLIER
  canvas.height = POSTER_H * POSTER_EXPORT_MULTIPLIER
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')
  ctx.scale(POSTER_EXPORT_MULTIPLIER, POSTER_EXPORT_MULTIPLIER)
  return { canvas, ctx }
}

export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}

/** 从图片采样主色 */
export function extractDominantHex(img) {
  const sample = document.createElement('canvas')
  const size = 32
  sample.width = size
  sample.height = size
  const sctx = sample.getContext('2d')
  if (!sctx) return COLORS.accent
  sctx.drawImage(img, 0, 0, size, size)
  const { data } = sctx.getImageData(0, 0, size, size)
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
    n++
  }
  if (!n) return COLORS.accent
  const toHex = (v) => Math.round(v / n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export { COLORS, POSTER_H, POSTER_W, SF, SX, SY }
