import { POSTER_H, POSTER_W } from './constants'
import {
  applyDarkOverlay,
  applyFilmGrain,
  applyVignette,
  composeEditorialBase,
  drawAccentLine,
  drawEditorialBody,
  drawEditorialFooter,
  drawEditorialImage,
  drawEditorialMeta,
  drawEditorialTitle,
  drawPoetryLines,
  extractEditorialContent,
  fillEditorialBackground,
  g,
  measureEditorialBodyHeight,
  measureEditorialTitleHeight,
  resolveEditorialTheme
} from './editorial'

/** 1 · Quiet Editorial — 左文右图，平静治愈 */
export function composeQuietEditorial(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const { theme, content } = o
    fillEditorialBackground(c, theme)
    drawEditorialMeta(c, o, theme)

    const imgX = g(52)
    const imgY = g(22)
    const imgW = g(37)
    const imgH = g(107)
    drawEditorialImage(c, image, { x: imgX, y: imgY, w: imgW, h: imgH })

    const leftX = g(10)
    const colW = g(30)
    let textY = g(28)
    drawAccentLine(c, leftX, textY, theme)
    textY += g(3)

    if (content.title) {
      textY = drawEditorialTitle(c, content.title, leftX, textY, colW, theme, { maxLines: 2 })
      textY += g(4)
    }
    if (content.body) {
      drawEditorialBody(c, content.body, leftX, textY, colW, theme, {
        maxLines: content.layoutType === 'reading' ? 14 : 10
      })
    }
    drawEditorialFooter(c, theme, o.footerName)
  })
}

/** 2 · Full Bleed Mood — 全屏图 + 暗层白字 */
export function composeFullBleedMood(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const theme = resolveEditorialTheme({ ...o, editorialTheme: 'anxiety' })
    drawEditorialImage(c, image, { x: 0, y: 0, w: POSTER_W, h: POSTER_H })
    applyDarkOverlay(c, 0.35)

    const textTheme = { ...theme, text: '#FFFFFF', muted: 'rgba(255,255,255,0.82)' }
    drawEditorialMeta(c, o, textTheme, g(6))

    const padX = g(10)
    const textW = POSTER_W - padX * 2
    const content = extractEditorialContent(o)
    const titleH = measureEditorialTitleHeight(c, content.title, textW, { maxLines: 2 })
    const bodyH = measureEditorialBodyHeight(c, content.body, textW, { maxLines: 8 })
    const blockH = titleH + (content.title && content.body ? g(4) : 0) + bodyH
    let textY = POSTER_H - g(14) - blockH

    if (content.title) {
      textY = drawEditorialTitle(c, content.title, padX, textY, textW, textTheme, {
        maxLines: 2,
        align: 'left'
      })
      textY += g(4)
    }
    if (content.body) {
      drawEditorialBody(c, content.body, padX, textY, textW, textTheme, {
        maxLines: 8,
        color: 'rgba(255,255,255,0.78)'
      })
    }
    drawEditorialFooter(c, textTheme, o.footerName)
  })
}

/** 3 · Minimal Reading — 大留白 + 窄栏长文 */
export function composeMinimalReading(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const { theme, content } = o
    fillEditorialBackground(c, theme)
    drawEditorialMeta(c, o, theme)

    const colW = g(28)
    const colX = (POSTER_W - colW) / 2
    let textY = g(18)

    if (content.title) {
      textY = drawEditorialTitle(c, content.title, colX, textY, colW, theme, {
        align: 'center',
        maxLines: 2
      })
      textY += g(6)
    }

    const imgH = g(36)
    const imgY = textY
    drawEditorialImage(c, image, {
      x: colX,
      y: imgY,
      w: colW,
      h: imgH,
      radius: g(1)
    })
    textY = imgY + imgH + g(6)

    if (content.body) {
      drawEditorialBody(c, content.body, colX, textY, colW, theme, {
        align: 'center',
        maxLines: 16
      })
    }
    drawEditorialFooter(c, theme, o.footerName)
  })
}

/** 4 · Image Window — 杂志「窗户」竖图 */
export function composeImageWindow(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const { theme, content } = o
    fillEditorialBackground(c, theme)
    drawEditorialMeta(c, o, theme)

    const winW = g(22)
    const winH = g(72)
    const winX = (POSTER_W - winW) / 2
    const winY = g(24)
    drawEditorialImage(c, image, {
      x: winX,
      y: winY,
      w: winW,
      h: winH,
      frame: true,
      frameColor: theme.accent
    })

    const textW = g(56)
    const textX = (POSTER_W - textW) / 2
    let textY = winY + winH + g(8)

    if (content.title) {
      textY = drawEditorialTitle(c, content.title, textX, textY, textW, theme, {
        align: 'center',
        maxLines: 2
      })
      textY += g(4)
    }
    if (content.body) {
      drawEditorialBody(c, content.body, textX, textY, textW, theme, {
        align: 'center',
        maxLines: 6
      })
    }
    drawEditorialFooter(c, theme, o.footerName)
  })
}

/** 5 · Film Mood — 胶片暗角 + 颗粒 */
export function composeFilmMood(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const theme = resolveEditorialTheme({ ...o, editorialTheme: 'anxiety' })
    drawEditorialImage(c, image, { x: 0, y: 0, w: POSTER_W, h: POSTER_H })
    applyDarkOverlay(c, 0.32)
    applyVignette(c, 0.55)
    applyFilmGrain(c, 0.07)

    const textTheme = { ...theme, text: '#FFFFFF', muted: 'rgba(255,255,255,0.78)' }
    drawEditorialMeta(c, o, textTheme, g(6))

    const content = extractEditorialContent(o)
    const padX = g(10)
    const textW = POSTER_W - padX * 2
    const titleH = measureEditorialTitleHeight(c, content.title, textW, { maxLines: 2 })
    const bodyH = measureEditorialBodyHeight(c, content.body, textW, { maxLines: 7 })
    const blockH = titleH + (content.title && content.body ? g(4) : 0) + bodyH
    let textY = POSTER_H - g(16) - blockH

    if (content.title) {
      textY = drawEditorialTitle(c, content.title, padX, textY, textW, textTheme, { maxLines: 2 })
      textY += g(4)
    }
    if (content.body) {
      drawEditorialBody(c, content.body, padX, textY, textW, textTheme, {
        maxLines: 7,
        color: 'rgba(255,255,255,0.72)'
      })
    }
    drawEditorialFooter(c, textTheme, o.footerName)
  })
}

/** 6 · Soft Paper — 暖纸色 + 点缀色 */
export function composeSoftPaper(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const theme = { ...resolveEditorialTheme(o), bg: '#F6F1EA' }
    fillEditorialBackground(c, theme)
    drawEditorialMeta(c, o, theme)

    const margin = g(5)
    const innerW = POSTER_W - margin * 2
    const imgH = g(52)
    drawEditorialImage(c, image, {
      x: margin,
      y: g(14),
      w: innerW,
      h: imgH,
      radius: g(2)
    })

    const textX = margin + g(2)
    const textW = innerW - g(4)
    let textY = g(14) + imgH + g(6)
    drawAccentLine(c, textX, textY, theme, g(9))
    textY += g(4)

    const content = extractEditorialContent(o)
    if (content.title) {
      textY = drawEditorialTitle(c, content.title, textX, textY, textW, theme, { maxLines: 2 })
      textY += g(4)
    }
    if (content.body) {
      drawEditorialBody(c, content.body, textX, textY, textW, theme, { maxLines: 10 })
    }
    drawEditorialFooter(c, theme, o.footerName)
  })
}

/** 7 · Museum Layout — 极简大标题 + 小图 */
export function composeMuseumLayout(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const { theme, content } = o
    fillEditorialBackground(c, theme)
    drawEditorialMeta(c, o, theme)

    const padX = g(10)
    const textW = POSTER_W - padX * 2
    let textY = g(16)

    const titleText = content.title || content.body.slice(0, 28)
    textY = drawEditorialTitle(c, titleText, padX, textY, textW, theme, {
      large: true,
      maxLines: 3
    })
    textY += g(8)

    const thumbW = g(28)
    const thumbH = g(34)
    drawEditorialImage(c, image, {
      x: padX,
      y: textY,
      w: thumbW,
      h: thumbH
    })

    const bodyX = padX + thumbW + g(4)
    const bodyW = POSTER_W - bodyX - padX
    const bodyText =
      content.title && content.body ? content.body : content.body || ''
    if (bodyText && bodyText !== titleText) {
      drawEditorialBody(c, bodyText, bodyX, textY + g(2), bodyW, theme, {
        maxLines: 8,
        maxChars: 90
      })
    }
    drawEditorialFooter(c, theme, o.footerName)
  })
}

/** 8 · Poetry Layout — 诗集式居中短句 */
export function composePoetryLayout(ctx, img, opts) {
  composeEditorialBase(ctx, img, opts, (c, image, o) => {
    const { theme, content } = o
    fillEditorialBackground(c, theme)
    drawEditorialMeta(c, o, theme)

    const imgW = g(32)
    const imgH = g(24)
    drawEditorialImage(c, image, {
      x: (POSTER_W - imgW) / 2,
      y: g(14),
      w: imgW,
      h: imgH,
      radius: g(1)
    })

    const textW = g(48)
    const textX = (POSTER_W - textW) / 2
    let textY = g(14) + imgH + g(10)

    const poetrySource = content.title || content.body
    if (poetrySource) {
      drawPoetryLines(c, poetrySource, textX, textY, textW, theme, { maxChars: 80 })
    }

    if (content.title && content.body && content.body !== content.title) {
      const subY = POSTER_H - g(22)
      drawEditorialBody(c, content.body, textX, subY, textW, theme, {
        align: 'center',
        maxLines: 4,
        maxChars: 60
      })
    }
    drawEditorialFooter(c, theme, o.footerName)
  })
}

export const EDITORIAL_RENDERERS = {
  quietEditorial: composeQuietEditorial,
  fullBleedMood: composeFullBleedMood,
  minimalReading: composeMinimalReading,
  imageWindow: composeImageWindow,
  filmMood: composeFilmMood,
  softPaper: composeSoftPaper,
  museumLayout: composeMuseumLayout,
  poetryLayout: composePoetryLayout
}

export const EDITORIAL_TEMPLATE_IDS = Object.keys(EDITORIAL_RENDERERS)

/** 根据正文字数推荐模版 */
export function suggestEditorialTemplate(opts = {}) {
  const { layoutType } = extractEditorialContent(opts)
  const theme = resolveEditorialTheme(opts)
  if (theme.id === 'anxiety') return 'fullBleedMood'
  if (theme.id === 'gratitude') return 'softPaper'
  if (layoutType === 'reading') return 'minimalReading'
  if (layoutType === 'poster') return 'poetryLayout'
  return 'quietEditorial'
}
