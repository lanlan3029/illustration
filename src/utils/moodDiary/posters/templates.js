import { COLORS, POSTER_FONT_STACK } from './constants'
import {
  POSTER_H,
  POSTER_W,
  SF,
  SX,
  SY,
  createPosterCanvas,
  drawBodyText,
  drawExcerpt,
  wrapTextByWidth,
  drawImageContain,
  drawImageCover,
  drawPosterBodyBlock,
  drawPosterBodyBlockInZone,
  drawPosterFooter,
  drawPosterHeader,
  getBodyLineHeight,
  measurePosterBodyBlockHeight,
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

  drawPosterHeader(ctx, { theme, ...opts })

  const blockTheme = { ...theme, textColor: theme.textColor }
  const padX = placement === 'left' || placement === 'right' ? 36 : 52
  const textW = blockRect.w - padX * 2
  const textX = blockRect.x + padX
  const isHorizontal = placement === 'top' || placement === 'bottom'
  const headerClear = isHorizontal ? 56 * SY : 28 * SY
  const footerClear = isHorizontal ? 48 * SY : 28 * SY
  const zoneTop = blockRect.y + headerClear
  const zoneHeight = blockRect.h - headerClear - footerClear

  drawPosterBodyBlockInZone(ctx, {
    bodyText: body.text,
    excerptText: excerpt,
    x: textX,
    width: textW,
    zoneTop,
    zoneHeight,
    align: 'center',
    theme: blockTheme,
    excerptColor: blockTheme.textColor,
    excerptMaxLines: 3
  })

  drawPosterFooter(ctx, theme, opts.footerName)
}

export function composeTitleAbove(ctx, img, opts) {
  const { dominantHex, body, excerpt } = baseMeta(opts)
  const theme = resolveTheme('dominant', dominantHex)
  ctx.fillStyle = dominantHex
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const padX = 52
  const textW = POSTER_W - padX * 2
  const imageTop = 320
  const imageW = Math.min(480, POSTER_W - padX * 2)
  const imageH = 420
  const imageX = (POSTER_W - imageW) / 2
  const imageY = imageTop
  drawImageContain(ctx, img, imageX, imageY, imageW, imageH)

  const titleZoneTop = 56
  const titleZoneBottom = imageY - 28
  const titleZoneH = Math.max(100, titleZoneBottom - titleZoneTop)
  drawPosterBodyBlockInZone(ctx, {
    bodyText: body.text,
    excerptText: '',
    x: padX,
    width: textW,
    zoneTop: titleZoneTop,
    zoneHeight: titleZoneH,
    align: 'center',
    theme,
    excerptColor: theme.textColor,
    excerptMaxLines: 0
  })

  if (excerpt) {
    const excerptTop = imageY + imageH + 32
    const excerptBottom = POSTER_H - 80
    const exFont = Math.round(7 * SF)
    const exLh = Math.round(11 * SY)
    ctx.font = `400 ${exFont}px ${POSTER_FONT_STACK}`
    const exLines = wrapTextByWidth(ctx, excerpt, textW, 3)
    const exH = exLines.length * exLh
    const exY = excerptTop + Math.max(0, (excerptBottom - excerptTop - exH) / 2)
    const exColor = isLightHex(dominantHex) ? 'rgba(26,26,26,0.62)' : 'rgba(255,255,255,0.72)'
    drawExcerpt(ctx, excerpt, padX, exY, textW, 'center', exColor, 3, false)
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

  const imgW = 332
  const imgH = 498
  const imgX = panelX + panelW - imgW - 8
  const imgY = 300
  drawImageContain(ctx, img, imgX, imgY, imgW, imgH)

  const leftPad = panelX + 36
  const accentY = 92
  const accentW = 64
  ctx.fillStyle = panelTheme.textColor
  ctx.fillRect(leftPad, accentY, accentW, 4)

  const colW = imgX - leftPad - 20
  const excerptColor = isLightHex(dominantHex) ? 'rgba(26,26,26,0.62)' : 'rgba(255,255,255,0.72)'

  const mainRaw = String(opts.userNarrative || opts.narrativeText || '').trim()
  let aiRaw = String(opts.aiCaptionText || opts.diaryCaption || '').trim()
  if (!aiRaw && excerpt) aiRaw = String(excerpt).trim()
  const mainBody = prepareBodyText(mainRaw)
  let aiText = prepareBodyText(aiRaw).text
  if (aiText && aiText === mainBody.text) aiText = ''

  let textY = accentY + 36
  if (mainBody.text) {
    textY = drawPosterBodyBlock(ctx, {
      bodyText: mainBody.text,
      excerptText: '',
      x: leftPad,
      y: textY,
      width: colW,
      align: 'left',
      theme: panelTheme,
      excerptColor,
      excerptMaxLines: 0
    })
    if (aiText) {
      textY += getBodyLineHeight(mainBody.compact)
    }
  }

  if (aiText) {
    drawExcerpt(ctx, aiText, leftPad, textY, colW, 'left', excerptColor, 4, false)
  }

  drawPosterFooter(ctx, panelTheme, opts.footerName)
}

export function composeMultiGrid(ctx, img, opts) {
  const { dominantHex } = baseMeta(opts)
  const theme = resolveTheme('paper', dominantHex)
  ctx.fillStyle = COLORS.bgPage
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  drawPosterHeader(ctx, { theme, ...opts })

  const side = 44
  const textW = POSTER_W - side * 2
  const contentTop = 58 * SY
  const contentBottom = POSTER_H - 68 * SY
  const mainGap = 12 * SY
  const aiGap = 16 * SY
  const maxMainH = 200 * SY
  const maxAiH = 150 * SY

  const mainRaw = String(opts.userNarrative || opts.narrativeText || '').trim()
  let aiRaw = String(opts.aiCaptionText || opts.diaryCaption || '').trim()
  if (!aiRaw && opts.excerptText) {
    aiRaw = String(opts.excerptText).trim()
  }
  const mainBody = prepareBodyText(mainRaw)
  const aiBody = prepareBodyText(aiRaw)
  if (aiBody.text && aiBody.text === mainBody.text) {
    aiBody.text = ''
  }

  let mainH = 0
  if (mainBody.text) {
    mainH = Math.min(
      maxMainH,
      measurePosterBodyBlockHeight(ctx, {
        bodyText: mainBody.text,
        excerptText: '',
        width: textW,
        excerptMaxLines: 0
      })
    )
  }

  let aiH = 0
  if (aiBody.text) {
    aiH = Math.min(
      maxAiH,
      measurePosterBodyBlockHeight(ctx, {
        bodyText: aiBody.text,
        excerptText: '',
        width: textW,
        excerptMaxLines: 0
      })
    )
  }

  const gridY = contentTop + mainH + mainGap
  const gridH = Math.max(280 * SY, contentBottom - gridY - aiGap - aiH)

  drawImageCover(ctx, img, side, gridY, textW, gridH, 8)

  if (mainBody.text) {
    const mainZoneBottom = gridY - mainGap
    const mainBlockH = measurePosterBodyBlockHeight(ctx, {
      bodyText: mainBody.text,
      excerptText: '',
      width: textW,
      excerptMaxLines: 0
    })
    const mainY = mainZoneBottom - mainBlockH
    drawPosterBodyBlock(ctx, {
      bodyText: mainBody.text,
      excerptText: '',
      x: side,
      y: Math.max(contentTop, mainY),
      width: textW,
      align: 'left',
      theme,
      excerptColor: COLORS.textSecondary,
      excerptMaxLines: 0
    })
  }

  if (aiBody.text) {
    const aiY = gridY + gridH + aiGap
    drawExcerpt(ctx, aiBody.text, side, aiY, textW, 'left', COLORS.textSecondary, 4, false)
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
