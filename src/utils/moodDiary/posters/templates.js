import { COLORS } from './constants'
import {
  POSTER_H,
  POSTER_W,
  SF,
  SY,
  createPosterCanvas,
  drawBodyText,
  drawExcerpt,
  drawImageContain,
  drawImageCover,
  drawPosterFooter,
  drawPosterHeader,
  isLightHex,
  prepareBodyText,
  resolveTheme,
  roundRectPath
} from './shared'

function baseMeta(opts) {
  const dominantHex = opts.dominantHex || COLORS.accent
  const body = prepareBodyText(opts.bodyText)
  const excerpt =
    opts.excerptText && opts.excerptText !== opts.bodyText ? opts.excerptText : ''
  return { dominantHex, body, excerpt }
}

export function composeCoverStory(ctx, img, opts) {
  const { body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('dominant', '#000000')
  theme.textColor = '#ffffff'
  drawImageCover(ctx, img, 0, 0, POSTER_W, POSTER_H, 0)

  const gradTop = ctx.createLinearGradient(0, 0, 0, POSTER_H * 0.18)
  gradTop.addColorStop(0, 'rgba(0,0,0,0.55)')
  gradTop.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradTop
  ctx.fillRect(0, 0, POSTER_W, POSTER_H * 0.18)

  const gradBottom = ctx.createLinearGradient(0, POSTER_H * 0.42, 0, POSTER_H)
  gradBottom.addColorStop(0, 'rgba(0,0,0,0)')
  gradBottom.addColorStop(0.45, 'rgba(0,0,0,0.55)')
  gradBottom.addColorStop(1, 'rgba(0,0,0,0.92)')
  ctx.fillStyle = gradBottom
  ctx.fillRect(0, POSTER_H * 0.42, POSTER_W, POSTER_H * 0.58)

  drawPosterHeader(ctx, { theme, ...opts })
  const textW = POSTER_W - 100
  const textX = 50
  let y = POSTER_H * 0.62
  y = drawBodyText(ctx, body.text, textX, y, textW, 'center', theme, body.compact)
  if (excerpt) {
    drawExcerpt(ctx, excerpt, textX, y + 8, textW, 'center', 'rgba(255,255,255,0.78)', 2)
  }
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeCreamCard(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('cream', dominantHex)
  ctx.fillStyle = COLORS.bgPage
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const cardX = 18
  const cardY = 19.2
  const cardW = POSTER_W - 36
  const cardH = POSTER_H - 38.4
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 14 * SF)
  ctx.fillStyle = COLORS.bgCard
  ctx.fill()

  drawPosterHeader(ctx, { theme, ...opts })

  const imageX = 40.5
  const imageY = 158.4
  const imageW = 594
  const imageH = 648
  drawImageCover(ctx, img, imageX, imageY, imageW, imageH, 14 * SF)

  let y = imageY + imageH + 20 * SY
  y = drawBodyText(ctx, body.text, imageX, y, imageW, 'right', theme, body.compact)
  if (excerpt) {
    drawExcerpt(ctx, excerpt, imageX, y + 6, imageW, 'right', '#a39e96', 2)
  }
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeGazette(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('paper', dominantHex)
  ctx.fillStyle = COLORS.bgPage
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const boxX = 70
  const boxY = 150
  const boxW = 535
  const boxH = 540
  drawImageContain(ctx, img, boxX, boxY, boxW, boxH)

  let y = boxY + boxH + 80
  const pad = 50
  y = drawBodyText(ctx, body.text, pad, y, POSTER_W - pad * 2, 'center', theme, body.compact)
  if (excerpt) {
    drawExcerpt(ctx, excerpt, pad, y + 8, POSTER_W - pad * 2, 'center', COLORS.textSecondary, 3)
  }
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeFramedPhoto(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const light = isLightHex(dominantHex)
  const theme = resolveTheme('dominant', dominantHex)
  ctx.fillStyle = dominantHex
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const boxW = 430
  const boxH = 540
  const boxX = (POSTER_W - boxW) / 2
  const boxY = 200
  drawImageContain(ctx, img, boxX, boxY, boxW, boxH)
  ctx.strokeStyle = theme.textColor
  ctx.lineWidth = 4
  ctx.strokeRect(boxX, boxY, boxW, boxH)

  const barW = 44 * SF
  const barH = Math.max(2, 2 * SF)
  const barX = (POSTER_W - barW) / 2
  const barY = boxY + boxH + 48
  ctx.fillStyle = theme.textColor
  ctx.fillRect(barX, barY, barW, barH)

  let y = barY + 28 * SY
  y = drawBodyText(ctx, body.text, 60, y, POSTER_W - 120, 'center', theme, body.compact)
  if (excerpt) {
    const exColor = light ? 'rgba(26,26,26,0.62)' : 'rgba(255,255,255,0.7)'
    drawExcerpt(ctx, excerpt, 60, y + 8, POSTER_W - 120, 'center', exColor, 3)
  }
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeColorBlock(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const placement = opts.colorBlockPlacement || 'top'
  const theme = resolveTheme('dominant', dominantHex)
  ctx.fillStyle = COLORS.bgPage
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  let blockRect = { x: 0, y: 0, w: POSTER_W, h: POSTER_H * 0.42 }
  let photoRect = { x: 0, y: blockRect.h, w: POSTER_W, h: POSTER_H - blockRect.h }

  if (placement === 'bottom') {
    photoRect = { x: 0, y: 0, w: POSTER_W, h: POSTER_H * 0.58 }
    blockRect = { x: 0, y: photoRect.h, w: POSTER_W, h: POSTER_H - photoRect.h }
  } else if (placement === 'left') {
    blockRect = { x: 0, y: 0, w: POSTER_W * 0.45, h: POSTER_H }
    photoRect = { x: blockRect.w, y: 0, w: POSTER_W - blockRect.w, h: POSTER_H }
  } else if (placement === 'right') {
    photoRect = { x: 0, y: 0, w: POSTER_W * 0.55, h: POSTER_H }
    blockRect = { x: photoRect.w, y: 0, w: POSTER_W - photoRect.w, h: POSTER_H }
  }

  drawImageCover(ctx, img, photoRect.x, photoRect.y, photoRect.w, photoRect.h, 0)
  ctx.fillStyle = dominantHex
  ctx.fillRect(blockRect.x, blockRect.y, blockRect.w, blockRect.h)

  const blockTheme = { ...theme, textColor: theme.textColor }
  const padX = placement === 'left' || placement === 'right' ? 30 : 60
  const padY = 80
  let y = blockRect.y + padY
  y = drawBodyText(
    ctx,
    body.text,
    blockRect.x + padX,
    y,
    blockRect.w - padX * 2,
    'center',
    blockTheme,
    body.compact
  )
  if (excerpt) {
    drawExcerpt(
      ctx,
      excerpt,
      blockRect.x + padX,
      y + 8,
      blockRect.w - padX * 2,
      'center',
      blockTheme.textColor,
      3
    )
  }

  drawPosterHeader(ctx, { theme, ...opts })
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeTitleAbove(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('dominant', dominantHex)
  ctx.fillStyle = dominantHex
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const imageTop = 280
  const imageW = Math.min(515, POSTER_W - 80)
  const imageH = POSTER_H - 200 - imageTop
  const imageX = (POSTER_W - imageW) / 2
  drawImageContain(ctx, img, imageX, imageTop, imageW, imageH)

  const titleBottom = imageTop - 24
  const titleTop = Math.max(42 * SY, titleBottom - 120)
  drawBodyText(
    ctx,
    body.text,
    60,
    titleTop,
    POSTER_W - 120,
    'center',
    theme,
    body.compact
  )

  if (excerpt) {
    const y = Math.max(imageTop + imageH + 16, POSTER_H - 180)
    drawExcerpt(ctx, excerpt, 60, y, POSTER_W - 120, 'center', theme.textColor, 3)
  }
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeMagazine(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('paper', dominantHex)
  const panelTheme = resolveTheme('dominant', dominantHex)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const margin = 40
  const panelX = margin
  const panelY = margin
  const panelW = POSTER_W - margin * 2
  const panelH = POSTER_H - margin * 2
  ctx.fillStyle = dominantHex
  ctx.fillRect(panelX, panelY, panelW, panelH)

  const headerTheme = {
    ...theme,
    pillBg: '#f5f0e8',
    pillTextColor: theme.dateColor
  }
  drawPosterHeader(ctx, {
    theme: headerTheme,
    ...opts,
    pillHeight: 14,
    pillRadius: 7
  })

  const imgW = 360
  const imgH = 540
  const imgX = panelX + panelW - imgW + 32
  const imgY = 360
  drawImageContain(ctx, img, imgX, imgY, imgW, imgH)

  const leftPad = panelX + 30
  ctx.fillStyle = panelTheme.textColor
  ctx.fillRect(leftPad, 478, 70, 3)

  const colW = imgX - leftPad - 5
  drawBodyText(ctx, body.text, leftPad, 520, colW, 'left', panelTheme, body.compact)
  if (excerpt) {
    drawExcerpt(ctx, excerpt, imgX, imgY + imgH + 12, imgW, 'center', panelTheme.textColor, 2)
  }
  drawPosterFooter(ctx, panelTheme, opts.footerName)
}

export function composeMultiGrid(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('paper', dominantHex)
  const placement = opts.imagePlacement || 'below'
  ctx.fillStyle = COLORS.bgPage
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const side = 40
  const top = 50 * SY
  const bottom = POSTER_H - 60 * SY
  const textBlockH = 160
  let gridY = placement === 'below' ? bottom - (bottom - top - textBlockH) : top + textBlockH + 20
  let textY = placement === 'below' ? top + 20 : top + 20
  if (placement === 'above') {
    gridY = top + 20
    textY = gridY + (bottom - top - textBlockH) + 20
  }

  const gridH = bottom - top - textBlockH - 20
  drawImageCover(ctx, img, side, gridY, POSTER_W - side * 2, gridH, 8)

  let y = drawBodyText(ctx, body.text, side, textY, POSTER_W - side * 2, 'left', theme, body.compact)
  if (excerpt) {
    drawExcerpt(ctx, excerpt, side, y + 8, POSTER_W - side * 2, 'left', COLORS.textSecondary, 3)
  }
  drawPosterFooter(ctx, theme, opts.footerName)
}

const RENDERERS = {
  coverStory: composeCoverStory,
  creamCard: composeCreamCard,
  gazette: composeGazette,
  framedPhoto: composeFramedPhoto,
  colorBlock: composeColorBlock,
  titleAbove: composeTitleAbove,
  magazine: composeMagazine,
  multiGrid: composeMultiGrid
}

export function renderPosterTemplate(ctx, templateId, img, opts) {
  const fn = RENDERERS[templateId] || RENDERERS.creamCard
  fn(ctx, img, opts)
}

export function composePosterTemplate(templateId, img, opts) {
  const { canvas, ctx } = createPosterCanvas()
  renderPosterTemplate(ctx, templateId, img, opts)
  return canvas
}
