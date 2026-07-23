/** 常见儿童/章节书印刷尺寸（英寸），导出基准 300 DPI */

export const BOOK_EXPORT_DPI = 300
export const INCH_TO_PT = 72

export const DEFAULT_BOOK_EXPORT_FORMAT_ID = 'square-safe'

export const BOOK_EXPORT_FORMATS = [
  {
    id: 'square-bleed',
    widthIn: 8.5,
    heightIn: 8.5,
    bleed: true,
    safeMarginIn: 0,
    fit: 'cover',
    nameKey: 'bookExport.formatSquareBleed',
    descKey: 'bookExport.formatSquareBleedDesc',
    aspectRatioCss: '1 / 1',
  },
  {
    id: 'square-safe',
    widthIn: 8.5,
    heightIn: 8.5,
    bleed: false,
    safeMarginIn: 0.375,
    fit: 'contain',
    nameKey: 'bookExport.formatSquareSafe',
    descKey: 'bookExport.formatSquareSafeDesc',
    aspectRatioCss: '1 / 1',
  },
  {
    id: 'chapter',
    widthIn: 5.5,
    heightIn: 8.5,
    bleed: false,
    safeMarginIn: 0.5,
    fit: 'contain',
    nameKey: 'bookExport.formatChapter',
    descKey: 'bookExport.formatChapterDesc',
    aspectRatioCss: '11 / 17',
  },
  {
    id: 'letter-workbook',
    widthIn: 8.5,
    heightIn: 11,
    bleed: false,
    safeMarginIn: 0.5,
    fit: 'contain',
    nameKey: 'bookExport.formatLetterWorkbook',
    descKey: 'bookExport.formatLetterWorkbookDesc',
    aspectRatioCss: '17 / 22',
  },
]

export function getBookExportFormat(id) {
  return BOOK_EXPORT_FORMATS.find((f) => f.id === id) || BOOK_EXPORT_FORMATS.find((f) => f.id === DEFAULT_BOOK_EXPORT_FORMAT_ID)
}

export function getFormatPixelSize(format, dpi = BOOK_EXPORT_DPI) {
  return {
    width: Math.round(format.widthIn * dpi),
    height: Math.round(format.heightIn * dpi),
  }
}

export function getFormatPdfSizePt(format) {
  return {
    width: format.widthIn * INCH_TO_PT,
    height: format.heightIn * INCH_TO_PT,
  }
}

export function formatSizeLabel(format, dpi = BOOK_EXPORT_DPI) {
  const px = getFormatPixelSize(format, dpi)
  return `${format.widthIn}×${format.heightIn} in · ${px.width}×${px.height}px · ${dpi} DPI`
}

/** 从旧版单页比例迁移 */
export function migrateLegacyPageRatio(pageRatio) {
  if (pageRatio === '1:1') return 'square-safe'
  if (pageRatio === '3:4') return 'chapter'
  if (pageRatio === '2:1') return 'square-bleed'
  return DEFAULT_BOOK_EXPORT_FORMAT_ID
}
