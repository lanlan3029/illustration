import { COLORS, POSTER_FONT_STACK } from './constants'
import { MOOD_POSTER_DISPLAY_FONT } from '../fonts'
import {
  POSTER_H,
  POSTER_W,
  SF,
  drawImageCover,
  drawPosterFooter,
  formatPosterDate,
  isLightHex,
  roundRectPath,
  truncateMoodLabel,
  wrapTextByWidth
} from './shared'

/** 8px 基线网格，布局一律 GRID * n */
export const EDITORIAL_GRID = 8

export function g(n) {
  return EDITORIAL_GRID * n
}

export const EDITORIAL_FONT_SERIF = MOOD_POSTER_DISPLAY_FONT

export const TYPE_SCALE = {
  meta: Math.round(11 * SF),
  mood: Math.round(16 * SF),
  body: Math.round(14 * SF),
  quote: Math.round(20 * SF),
  title: Math.round(42 * SF),
  titleLg: Math.round(48 * SF),
  footer: Math.round(10 * SF)
}

export const EDITORIAL_THEMES = {
  calm: {
    bg: '#F7F4EE',
    text: '#1A1A1A',
    accent: '#A8C3B0',
    muted: 'rgba(26,26,26,0.55)'
  },
  anxiety: {
    bg: '#0F1115',
    text: '#FFFFFF',
    accent: '#6C7A89',
    muted: 'rgba(255,255,255,0.72)'
  },
  gratitude: {
    bg: '#F6EFE3',
    text: '#2B2B2B',
    accent: '#D6B98C',
    muted: 'rgba(43,43,43,0.62)'
  },
  default: {
    bg: '#F7F4EE',
    text: '#1A1A1A',
    accent: '#A8C3B0',
    muted: 'rgba(26,26,26,0.55)'
  }
}

const MOOD_THEME_HINTS = [
  { theme: 'anxiety', words: ['焦虑', '不安', '紧张', '孤独', '难过', '悲伤', '深夜', '雨'] },
  { theme: 'gratitude', words: ['感恩', '温暖', '感谢', '幸福', '喜欢', '爱', '平静'] },
  { theme: 'calm', words: ['平静', '放松', '治愈', '毫无杂念', '得意', '兴奋'] }
]

export function resolveLayoutType(textLength) {
  if (textLength <= 40) return 'poster'
  if (textLength <= 90) return 'editorial'
  return 'reading'
}

export function normalizeDiary(text, max = 120) {
  return String(text || '')
    .replace(/\n+/g, '\n')
    .trim()
    .slice(0, max)
}

export function normalizeEditorialTitle(text, max = 28) {
  const raw = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!raw) return ''
  if (raw.length <= max) return raw
  const slice = raw.slice(0, max)
  const breakAt = Math.max(slice.lastIndexOf('，'), slice.lastIndexOf('。'), slice.lastIndexOf('\n'))
  if (breakAt > max * 0.4) return slice.slice(0, breakAt + 1).trim()
  return `${slice}…`
}

export function resolveFontSize(textLength) {
  if (textLength < 40) return TYPE_SCALE.body
  if (textLength < 80) return Math.round(13 * SF)
  return Math.round(12 * SF)
}

export function resolveLineHeight(fontSize) {
  return Math.round(fontSize * 1.9)
}

export function resolveEditorialTheme(opts = {}) {
  if (opts.editorialTheme && EDITORIAL_THEMES[opts.editorialTheme]) {
    return { ...EDITORIAL_THEMES[opts.editorialTheme], id: opts.editorialTheme }
  }
  const mood = String(opts.moodLabel || '').trim()
  for (const row of MOOD_THEME_HINTS) {
    if (row.words.some((w) => mood.includes(w))) {
      return { ...EDITORIAL_THEMES[row.theme], id: row.theme }
    }
  }
  const accent = opts.dominantHex || COLORS.accent
  return {
    ...EDITORIAL_THEMES.default,
    id: 'default',
    accent: isLightHex(accent) ? accent : EDITORIAL_THEMES.default.accent
  }
}

/** 提取 Editorial 层级：title = AI 理解句，body = 用户日记 */
export function extractEditorialContent(opts = {}) {
  const bodyRaw = normalizeDiary(
    opts.userNarrative || opts.narrativeText || opts.bodyText || '',
    120
  )
  let titleRaw = String(
    opts.editorialTitle ||
      opts.aiCaptionText ||
      opts.diaryCaption ||
      opts.excerptText ||
      ''
  ).trim()
  if (!titleRaw && bodyRaw) {
    titleRaw = bodyRaw.slice(0, 28)
  }
  if (titleRaw && titleRaw === bodyRaw) titleRaw = ''
  const title = normalizeEditorialTitle(titleRaw)
  const body = bodyRaw
  return {
    title,
    body,
    layoutType: resolveLayoutType(body.length || title.length)
  }
}

export function fillEditorialBackground(ctx, theme) {
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
}

export function drawEditorialMeta(ctx, opts, theme, y = g(6)) {
  const date = formatPosterDate(opts.createdAt, opts.locale)
  const mood = truncateMoodLabel(opts.moodLabel)
  ctx.font = `500 ${TYPE_SCALE.meta}px ${POSTER_FONT_STACK}`
  ctx.fillStyle = theme.muted
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(date, g(10), y)
  if (mood) {
    ctx.textAlign = 'right'
    ctx.fillText(mood, POSTER_W - g(10), y)
  }
}

export function drawAccentLine(ctx, x, y, theme, width = g(7)) {
  ctx.fillStyle = theme.accent
  ctx.fillRect(x, y, width, g(0.5))
}

export function drawEditorialTitle(ctx, text, x, y, width, theme, opts = {}) {
  const t = String(text || '').trim()
  if (!t) return y
  const fontSize = opts.large ? TYPE_SCALE.titleLg : TYPE_SCALE.title
  const lineHeight = resolveLineHeight(fontSize)
  const maxLines = opts.maxLines || 3
  ctx.font = `600 ${fontSize}px ${EDITORIAL_FONT_SERIF}`
  ctx.fillStyle = theme.text
  ctx.textAlign = opts.align || 'left'
  ctx.textBaseline = 'top'
  const lines = wrapTextByWidth(ctx, t.replace(/\n/g, ' '), width, maxLines)
  lines.forEach((ln, i) => {
    const ax =
      opts.align === 'center' ? x + width / 2 : opts.align === 'right' ? x + width : x
    ctx.fillText(ln, ax, y + i * lineHeight)
  })
  return y + lines.length * lineHeight
}

export function measureEditorialTitleHeight(ctx, text, width, opts = {}) {
  const t = String(text || '').trim()
  if (!t) return 0
  const fontSize = opts.large ? TYPE_SCALE.titleLg : TYPE_SCALE.title
  const lineHeight = resolveLineHeight(fontSize)
  const maxLines = opts.maxLines || 3
  ctx.font = `600 ${fontSize}px ${EDITORIAL_FONT_SERIF}`
  const lines = wrapTextByWidth(ctx, t.replace(/\n/g, ' '), width, maxLines)
  return lines.length * lineHeight
}

export function drawEditorialBody(ctx, text, x, y, width, theme, opts = {}) {
  const t = normalizeDiary(text, opts.maxChars || 120)
  if (!t) return y
  const fontSize = resolveFontSize(t.length)
  const lineHeight = resolveLineHeight(fontSize)
  const maxLines = opts.maxLines || 12
  ctx.font = `400 ${fontSize}px ${POSTER_FONT_STACK}`
  ctx.fillStyle = opts.color || theme.muted
  ctx.textAlign = opts.align || 'left'
  ctx.textBaseline = 'top'
  const lines = wrapTextByWidth(ctx, t, width, maxLines)
  lines.forEach((ln, i) => {
    const ax =
      opts.align === 'center' ? x + width / 2 : opts.align === 'right' ? x + width : x
    ctx.fillText(ln, ax, y + i * lineHeight)
  })
  return y + lines.length * lineHeight
}

export function measureEditorialBodyHeight(ctx, text, width, opts = {}) {
  const t = normalizeDiary(text, opts.maxChars || 120)
  if (!t) return 0
  const fontSize = resolveFontSize(t.length)
  const lineHeight = resolveLineHeight(fontSize)
  const maxLines = opts.maxLines || 12
  ctx.font = `400 ${fontSize}px ${POSTER_FONT_STACK}`
  const lines = wrapTextByWidth(ctx, t, width, maxLines)
  return lines.length * lineHeight
}

/** 诗集式：按标点 / 换行拆成短句居中 */
export function drawPoetryLines(ctx, text, x, y, width, theme, opts = {}) {
  const raw = normalizeDiary(text, opts.maxChars || 80)
  if (!raw) return y
  const chunks = raw
    .split(/[\n。！？；]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const fontSize = TYPE_SCALE.quote
  const lineHeight = resolveLineHeight(fontSize)
  const gap = g(3)
  ctx.font = `400 ${fontSize}px ${EDITORIAL_FONT_SERIF}`
  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  let cy = y
  chunks.forEach((chunk) => {
    const lines = wrapTextByWidth(ctx, chunk, width, 2)
    lines.forEach((ln) => {
      ctx.fillText(ln, x + width / 2, cy)
      cy += lineHeight
    })
    cy += gap
  })
  return cy
}

export function drawEditorialImage(ctx, img, rect, opts = {}) {
  const { x, y, w, h, radius = 0 } = rect
  if (radius > 0) {
    ctx.save()
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.clip()
    drawImageCover(ctx, img, x, y, w, h, 0)
    ctx.restore()
  } else {
    drawImageCover(ctx, img, x, y, w, h, 0)
  }
  if (opts.frame) {
    ctx.strokeStyle = opts.frameColor || 'rgba(255,255,255,0.35)'
    ctx.lineWidth = opts.frameWidth || 1
    if (radius > 0) {
      roundRectPath(ctx, x, y, w, h, radius)
      ctx.stroke()
    } else {
      ctx.strokeRect(x, y, w, h)
    }
  }
}

export function applyDarkOverlay(ctx, alpha = 0.35) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
}

export function applyVignette(ctx, strength = 0.45) {
  const cx = POSTER_W / 2
  const cy = POSTER_H / 2
  const g = ctx.createRadialGradient(cx, cy, POSTER_W * 0.15, cx, cy, POSTER_W * 0.78)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
}

export function applyFilmGrain(ctx, intensity = 0.05) {
  const w = POSTER_W
  const h = POSTER_H
  ctx.save()
  ctx.globalAlpha = intensity
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const v = Math.random() > 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${v},${v},${v},0.4)`
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.restore()
}

export function drawEditorialFooter(ctx, theme, footerName) {
  const footerTheme = {
    brandColor: theme.muted,
    textColor: theme.text
  }
  drawPosterFooter(ctx, footerTheme, footerName)
}

export function composeEditorialBase(ctx, img, opts, layoutFn) {
  const theme = resolveEditorialTheme(opts)
  const content = extractEditorialContent(opts)
  layoutFn(ctx, img, { ...opts, theme, content })
}
