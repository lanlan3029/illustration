import JsPDF from 'jspdf'
import {
  BOOK_EXPORT_DPI,
  getFormatPdfSizePt,
  getFormatPixelSize,
} from '@/data/bookExportFormats'

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const isLocal = src.startsWith('data:')
      || src.startsWith('blob:')
      || src.startsWith('/')
      || (typeof window !== 'undefined' && src.startsWith(window.location.origin))
    if (!isLocal) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`image load failed: ${src}`))
    img.src = src
  })
}

function drawImageInRect(ctx, img, x, y, w, h, fit) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih || w <= 0 || h <= 0) return

  const scale = fit === 'cover'
    ? Math.max(w / iw, h / ih)
    : Math.min(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  const dx = x + (w - dw) / 2
  const dy = y + (h - dh) / 2
  ctx.drawImage(img, dx, dy, dw, dh)
}

/**
 * 按印刷模版将插画渲染到 300 DPI 画布
 * @param {HTMLImageElement|string} image
 * @param {object} format
 * @param {number} [dpi]
 */
export async function renderBookPage(image, format, dpi = BOOK_EXPORT_DPI) {
  const img = typeof image === 'string' ? await loadImageElement(image) : image
  const { width: pageW, height: pageH } = getFormatPixelSize(format, dpi)
  const margin = format.bleed ? 0 : Math.round((format.safeMarginIn || 0) * dpi)
  const fit = format.fit || (format.bleed ? 'cover' : 'contain')

  const canvas = document.createElement('canvas')
  canvas.width = pageW
  canvas.height = pageH
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, pageW, pageH)

  const innerX = margin
  const innerY = margin
  const innerW = pageW - margin * 2
  const innerH = pageH - margin * 2
  if (innerW > 0 && innerH > 0) {
    drawImageInRect(ctx, img, innerX, innerY, innerW, innerH, fit)
  }
  return canvas
}

export function canvasToDataUrl(canvas, mime = 'image/jpeg', quality = 0.95) {
  return canvas.toDataURL(mime, quality)
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadCanvas(canvas, filename, mime = 'image/png') {
  const dataUrl = canvas.toDataURL(mime)
  downloadDataUrl(dataUrl, filename)
}

/**
 * @param {{ src: string }[]} pages
 * @param {object} format
 * @param {{ fileBaseName?: string }} [options]
 */
export async function buildBookPdfFromPages(pages, format, options = {}) {
  const list = Array.isArray(pages) ? pages.filter((p) => p?.src) : []
  if (!list.length) {
    throw new Error('no pages')
  }

  const { width: pdfW, height: pdfH } = getFormatPdfSizePt(format)
  const orientation = pdfW >= pdfH ? 'l' : 'p'
  let pdf = null

  for (let i = 0; i < list.length; i += 1) {
    const canvas = await renderBookPage(list[i].src, format)
    const dataUrl = canvasToDataUrl(canvas, 'image/jpeg', 0.95)
    if (!pdf) {
      pdf = new JsPDF({ orientation, unit: 'pt', format: [pdfW, pdfH], compress: true })
    } else {
      pdf.addPage([pdfW, pdfH], orientation)
    }
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST')
  }

  return pdf
}

/**
 * 逐页下载 300 DPI PNG（避免额外 zip 依赖）
 */
export async function downloadBookPagesAsPng(pages, format, fileBaseName = 'book') {
  const list = Array.isArray(pages) ? pages.filter((p) => p?.src) : []
  for (let i = 0; i < list.length; i += 1) {
    const canvas = await renderBookPage(list[i].src, format)
    const num = String(i + 1).padStart(2, '0')
    downloadCanvas(canvas, `${fileBaseName}-page-${num}.png`, 'image/png')
    if (i < list.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await delay(350)
    }
  }
}

/**
 * 跨页：左右两页拼成一张 300 DPI 图写入 PDF
 */
export async function renderSpreadPage(leftSrc, rightSrc, format, dpi = BOOK_EXPORT_DPI) {
  const pagePx = getFormatPixelSize(format, dpi)
  const spreadW = pagePx.width * 2
  const spreadH = pagePx.height
  const canvas = document.createElement('canvas')
  canvas.width = spreadW
  canvas.height = spreadH
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, spreadW, spreadH)

  if (leftSrc) {
    const leftCanvas = await renderBookPage(leftSrc, format, dpi)
    ctx.drawImage(leftCanvas, 0, 0)
  }
  if (rightSrc) {
    const rightCanvas = await renderBookPage(rightSrc, format, dpi)
    ctx.drawImage(rightCanvas, pagePx.width, 0)
  }
  return canvas
}

export async function buildPrintLayoutPdf(blocks, format, getIllUrl) {
  const { width: pagePtW, height: pagePtH } = getFormatPdfSizePt(format)
  const spreadPtW = pagePtW * 2
  let pdf = null

  for (const block of blocks) {
    if (!block.pages.some((p) => p.illustration)) continue

    if (block.type === 'single') {
      const pg = block.pages[0]
      if (!pg?.illustration) continue
      const canvas = await renderBookPage(getIllUrl(pg.illustration), format)
      const dataUrl = canvasToDataUrl(canvas)
      if (!pdf) {
        pdf = new JsPDF('p', 'pt', [pagePtW, pagePtH])
      } else {
        pdf.addPage([pagePtW, pagePtH], 'p')
      }
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pagePtW, pagePtH, undefined, 'FAST')
    } else {
      const left = block.pages[0]?.illustration ? getIllUrl(block.pages[0].illustration) : null
      const right = block.pages[1]?.illustration ? getIllUrl(block.pages[1].illustration) : null
      const canvas = await renderSpreadPage(left, right, format)
      const dataUrl = canvasToDataUrl(canvas)
      if (!pdf) {
        pdf = new JsPDF('l', 'pt', [spreadPtW, pagePtH])
      } else {
        pdf.addPage([spreadPtW, pagePtH], 'l')
      }
      pdf.addImage(dataUrl, 'JPEG', 0, 0, spreadPtW, pagePtH, undefined, 'FAST')
    }
  }

  return pdf
}

export async function downloadPrintLayoutPagesAsPng(blocks, format, getIllUrl, fileBaseName = 'print-layout') {
  let index = 0
  for (const block of blocks) {
    if (!block.pages.some((p) => p.illustration)) continue

    if (block.type === 'single') {
      const pg = block.pages[0]
      if (!pg?.illustration) continue
      index += 1
      const canvas = await renderBookPage(getIllUrl(pg.illustration), format)
      downloadCanvas(canvas, `${fileBaseName}-${String(index).padStart(2, '0')}.png`)
      await delay(350)
    } else {
      const left = block.pages[0]?.illustration ? getIllUrl(block.pages[0].illustration) : null
      const right = block.pages[1]?.illustration ? getIllUrl(block.pages[1].illustration) : null
      if (!left && !right) continue
      index += 1
      const canvas = await renderSpreadPage(left, right, format)
      downloadCanvas(canvas, `${fileBaseName}-spread-${String(index).padStart(2, '0')}.png`)
      await delay(350)
    }
  }
}
