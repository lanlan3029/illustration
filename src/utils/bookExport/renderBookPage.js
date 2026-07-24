import JsPDF from 'jspdf'
import {
  BOOK_EXPORT_DPI,
  getFormatPdfSizePt,
  getFormatPixelSize,
} from '@/data/bookExportFormats'
import {
  assertPrintPixels,
  canvasToJpegDataUrl,
  canvasToPngDataUrl,
} from '@/utils/bookExport/dpiMeta'

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
  ctx.imageSmoothingEnabled = true
  if ('imageSmoothingQuality' in ctx) {
    ctx.imageSmoothingQuality = 'high'
  }
  ctx.drawImage(img, dx, dy, dw, dh)
}

/**
 * 将插画渲染到目标画布（默认 300 DPI 像素）
 * @param {HTMLImageElement|string|null} image  null 则空白页
 * @param {object} format
 * @param {'digital'|'kdp'} [mode]
 * @param {number} [dpi]
 */
export async function renderBookPage(image, format, mode = 'digital', dpi = BOOK_EXPORT_DPI) {
  const { width: pageW, height: pageH } = getFormatPixelSize(format, dpi, mode)
  if (!pageW || !pageH || Number.isNaN(pageW) || Number.isNaN(pageH)) {
    throw new Error(`invalid print pixel size: ${pageW}x${pageH}`)
  }

  const fit = format.fit || 'cover'
  const canvas = document.createElement('canvas')
  canvas.width = pageW
  canvas.height = pageH
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('2d context unavailable')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, pageW, pageH)

  if (!image) {
    assertPrintPixels(canvas, pageW, pageH)
    return canvas
  }

  const img = typeof image === 'string' ? await loadImageElement(image) : image
  drawImageInRect(ctx, img, 0, 0, pageW, pageH, mode === 'kdp' ? 'cover' : fit)
  assertPrintPixels(canvas, pageW, pageH)
  return canvas
}

export function canvasToDataUrl(canvas, mime = 'image/jpeg', quality = 0.95) {
  if (mime === 'image/png') {
    return canvasToPngDataUrl(canvas, BOOK_EXPORT_DPI)
  }
  return canvasToJpegDataUrl(canvas, quality, BOOK_EXPORT_DPI)
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
  const dataUrl = canvasToDataUrl(canvas, mime)
  downloadDataUrl(dataUrl, filename)
}

/**
 * 单页序列 PDF：页面物理尺寸(pt) + 内嵌 300 DPI 位图（JPEG 写入 300 DPI JFIF）
 * @param {{ src?: string|null, blank?: boolean }[]} pages
 * @param {object} format
 * @param {'digital'|'kdp'} [mode]
 */
export async function buildBookPdfFromPages(pages, format, mode = 'digital') {
  const list = Array.isArray(pages) ? pages : []
  if (!list.length) {
    throw new Error('no pages')
  }

  const dpi = BOOK_EXPORT_DPI
  const expectedPx = getFormatPixelSize(format, dpi, mode)
  const { width: pdfW, height: pdfH } = getFormatPdfSizePt(format, mode)
  const orientation = pdfW >= pdfH ? 'l' : 'p'
  let pdf = null

  for (let i = 0; i < list.length; i += 1) {
    const src = list[i]?.blank ? null : (list[i]?.src || null)
    // eslint-disable-next-line no-await-in-loop
    const canvas = await renderBookPage(src, format, mode, dpi)
    assertPrintPixels(canvas, expectedPx.width, expectedPx.height)

    let dataUrl
    try {
      dataUrl = canvasToJpegDataUrl(canvas, 0.95, dpi)
    } catch (err) {
      // 部分环境大画布 JPEG 失败时回退 PNG
      console.warn('JPEG export failed, fallback PNG', err)
      dataUrl = canvasToPngDataUrl(canvas, dpi)
    }

    if (!pdf) {
      pdf = new JsPDF({
        orientation,
        unit: 'pt',
        format: [pdfW, pdfH],
        compress: true,
        precision: 2,
      })
    } else {
      pdf.addPage([pdfW, pdfH], orientation)
    }

    const formatType = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
    pdf.addImage(dataUrl, formatType, 0, 0, pdfW, pdfH, undefined, 'NONE')

    // 校验内嵌图像素，避免静默缩图
    const props = pdf.getImageProperties(dataUrl)
    if (props.width !== expectedPx.width || props.height !== expectedPx.height) {
      throw new Error(
        `PDF image not ${dpi} DPI: embedded ${props.width}x${props.height}, expected ${expectedPx.width}x${expectedPx.height}`
      )
    }
  }

  return pdf
}

/**
 * 逐页下载 300 DPI PNG（含 pHYs 元数据）
 */
export async function downloadBookPagesAsPng(pages, format, fileBaseName = 'book', mode = 'digital') {
  const list = Array.isArray(pages) ? pages : []
  const dpi = BOOK_EXPORT_DPI
  const expectedPx = getFormatPixelSize(format, dpi, mode)

  for (let i = 0; i < list.length; i += 1) {
    const src = list[i]?.blank ? null : (list[i]?.src || null)
    // eslint-disable-next-line no-await-in-loop
    const canvas = await renderBookPage(src, format, mode, dpi)
    assertPrintPixels(canvas, expectedPx.width, expectedPx.height)
    const num = String(i + 1).padStart(2, '0')
    const suffix = mode === 'kdp' ? 'kdp' : 'digital'
    downloadCanvas(canvas, `${fileBaseName}-${suffix}-${dpi}dpi-page-${num}.png`, 'image/png')
    if (i < list.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await delay(350)
    }
  }
}

/** @deprecated 保留兼容 */
export async function renderSpreadPage(leftSrc, rightSrc, format, dpi = BOOK_EXPORT_DPI) {
  const pagePx = getFormatPixelSize(format, dpi, 'kdp')
  const spreadW = pagePx.width * 2
  const spreadH = pagePx.height
  const canvas = document.createElement('canvas')
  canvas.width = spreadW
  canvas.height = spreadH
  const ctx = canvas.getContext('2d', { alpha: false })
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, spreadW, spreadH)

  if (leftSrc) {
    const leftCanvas = await renderBookPage(leftSrc, format, 'kdp', dpi)
    ctx.drawImage(leftCanvas, 0, 0)
  }
  if (rightSrc) {
    const rightCanvas = await renderBookPage(rightSrc, format, 'kdp', dpi)
    ctx.drawImage(rightCanvas, pagePx.width, 0)
  }
  return canvas
}

export async function buildPrintLayoutPdf(blocks, format, getIllUrl) {
  const pages = []
  for (const block of blocks || []) {
    for (const pg of block.pages || []) {
      if (pg.illustration) {
        pages.push({ src: getIllUrl(pg.illustration) })
      } else if (pg.kind === 'story' || pg.kind === 'title' || pg.kind === 'copyright' || pg.kind === 'dedication' || pg.kind === 'closing') {
        pages.push({ blank: true })
      }
    }
  }
  return buildBookPdfFromPages(pages, format, 'kdp')
}

export async function downloadPrintLayoutPagesAsPng(blocks, format, getIllUrl, fileBaseName = 'print-layout') {
  const pages = []
  for (const block of blocks || []) {
    for (const pg of block.pages || []) {
      if (pg.illustration) {
        pages.push({ src: getIllUrl(pg.illustration) })
      }
    }
  }
  return downloadBookPagesAsPng(pages, format, fileBaseName, 'kdp')
}
