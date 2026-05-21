/** Web 端逻辑画布：小程序 675×1200 的 1.2 倍，比例仍为 9:16 */
export const POSTER_W = 810
export const POSTER_H = 1440
export const POSTER_BASE_W = 300
export const POSTER_BASE_H = 500
export const POSTER_EXPORT_MULTIPLIER = 2

export const SX = POSTER_W / POSTER_BASE_W
export const SY = POSTER_H / POSTER_BASE_H
export const SF = Math.sqrt(SX * SY)

export const POSTER_USER_BODY_MAX_CHARS = 120
export const POSTER_USER_BODY_COMPACT_MAX_CHARS = 240
export const POSTER_QUOTE_FONT_COMPACT = 16
export const POSTER_QUOTE_LINE_COMPACT = 28

export const POSTER_FONT_STACK =
  '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'

export const COLORS = {
  bgPage: '#F7FBFE',
  bgCard: '#FFFFFF',
  primary: '#111111',
  accent: '#C8E6B0',
  accentStrong: '#4F7A3D',
  textSecondary: '#7A7A7A',
  placeholder: '#A8A8A8',
  imagePlaceholder: '#EAE6DF'
}

export const POSTER_TEMPLATE_IDS = [
  'coverStory',
  'creamCard',
  'gazette',
  'framedPhoto',
  'colorBlock',
  'titleAbove',
  'magazine',
  'multiGrid'
]

export const DEFAULT_POSTER_TEMPLATE_ID = 'creamCard'
