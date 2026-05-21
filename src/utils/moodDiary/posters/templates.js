import { COLORS } from './constants'
import {
  POSTER_H,
  POSTER_W,
  SF,
  SX,
  SY,
  createPosterCanvas,
  drawBodyText,
  drawExcerpt,
  drawImageContain,
  drawImageCover,
  drawPosterBodyBlock,
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
  const textY = POSTER_H * 0.62
  drawPosterBodyBlock(ctx, {
    bodyText: body.text,
    excerptText: excerpt,
    x: textX,
    y: textY,
    width: textW,
    align: 'center',
    theme,
    excerptColor: 'rgba(255,255,255,0.78)',
    excerptMaxLines: 2
  })
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeCreamCard(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('cream', dominantHex)
  ctx.fillStyle = COLORS.bgPage
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const cardX = 8 * SX
  const cardY = 8 * SY
  const cardW = POSTER_W - cardX * 2
  const cardH = POSTER_H - cardY * 2
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 14 * SF)
  ctx.fillStyle = COLORS.bgCard
  ctx.fill()

  drawPosterHeader(ctx, { theme, ...opts })

  const imagePadX = 10 * SX
  const imageW = cardW - imagePadX * 2
  const imageX = cardX + imagePadX
  const imageY = 66 * SY
  const imageH = 270 * SY
  drawImageCover(ctx, img, imageX, imageY, imageW, imageH, 14 * SF)

  drawPosterBodyBlock(ctx, {
    bodyText: body.text,
    excerptText: excerpt,
    x: imageX,
    y: imageY + imageH + 20 * SY,
    width: imageW,
    align: 'center',
    theme,
    excerptColor: '#a39e96',
    excerptMaxLines: 2
  })
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeGazette(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('paper', dominantHex)
  ctx.fillStyle = COLORS.bgPage
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const boxW = 238 * SX
  const boxH = 225 * SY
  const boxX = (POSTER_W - boxW) / 2
  const boxY = 62.5 * SY
  drawImageContain(ctx, img, boxX, boxY, boxW, boxH)

  drawPosterBodyBlock(ctx, {
    bodyText: body.text,
    excerptText: excerpt,
    x: 50,
    y: boxY + boxH + 80,
    width: POSTER_W - 100,
    align: 'center',
    theme,
    excerptColor: COLORS.textSecondary,
    excerptMaxLines: 3
  })
  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeFramedPhoto(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const light = isLightHex(dominantHex)
  const theme = resolveTheme('dominant', dominantHex)
  ctx.fillStyle = dominantHex
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const boxW = 191 * SX
  const boxH = 225 * SY
  const boxX = (POSTER_W - boxW) / 2
  const boxY = 83.33 * SY
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
  drawPosterBodyBlock(ctx, {
    bodyText: body.text,
    excerptText: excerpt,
    x: 60,
    y,
    width: POSTER_W - 120,
    align: 'center',
    theme,
    excerptColor: light ? 'rgba(26,26,26,0.62)' : 'rgba(255,255,255,0.7)',
    excerptMaxLines: 3
  })
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
  drawPosterBodyBlock(ctx, {
    bodyText: body.text,
    excerptText: excerpt,
    x: blockRect.x + padX,
    y: blockRect.y + padY,
    width: blockRect.w - padX * 2,
    align: 'center',
    theme: blockTheme,
    excerptColor: blockTheme.textColor,
    excerptMaxLines: 3
  })

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
  drawBodyText(ctx, body.text, 60, titleTop, POSTER_W - 120, 'center', theme, body.compact)

  if (excerpt) {
    const y = Math.max(imageTop + imageH + 16, POSTER_H - 180)
    drawExcerpt(ctx, excerpt, 60, y, POSTER_W - 120, 'center', theme.textColor, 3, false)
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
    drawExcerpt(ctx, excerpt, imgX, imgY + imgH + 12, imgW, 'center', panelTheme.textColor, 2, false)
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

  drawPosterBodyBlock(ctx, {
    bodyText: body.text,
    excerptText: excerpt,
    x: side,
    y: textY,
    width: POSTER_W - side * 2,
    align: 'left',
    theme,
    excerptColor: COLORS.textSecondary,
    excerptMaxLines: 3
  })
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
