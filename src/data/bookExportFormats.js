/** 常见儿童/章节书印刷尺寸（英寸），导出基准 300 DPI
 *
 * KDP 含出血单页（内页手稿）：
 * - 高 = trim 高 + 0.125 × 2
 * - 宽 = trim 宽 + 0.125（仅外口出血，书脊侧不加）
 */

export const BOOK_EXPORT_DPI = 300
export const INCH_TO_PT = 72
/** Amazon KDP 单边出血 */
export const KDP_BLEED_IN = 0.125
/** KDP 建议安全边距（相对裁切边向内） */
export const KDP_SAFE_MARGIN_IN = 0.375
/** KDP 平装内页最少页数 */
export const KDP_MIN_INTERIOR_PAGES = 24

export const DEFAULT_BOOK_EXPORT_FORMAT_ID = 'square-kids'

export const BOOK_EXPORT_FORMATS = [
  {
    id: 'square-kids',
    trimWidthIn: 8.5,
    trimHeightIn: 8.5,
    bleedOuterIn: KDP_BLEED_IN,
    safeMarginIn: KDP_SAFE_MARGIN_IN,
    fit: 'cover',
    nameKey: 'bookExport.formatSquareKids',
    descKey: 'bookExport.formatSquareKidsDesc',
    aspectRatioCss: '1 / 1',
  },
  {
    id: 'chapter',
    trimWidthIn: 5.5,
    trimHeightIn: 8.5,
    bleedOuterIn: KDP_BLEED_IN,
    safeMarginIn: KDP_SAFE_MARGIN_IN,
    fit: 'cover',
    nameKey: 'bookExport.formatChapter',
    descKey: 'bookExport.formatChapterDesc',
    aspectRatioCss: '11 / 17',
  },
  {
    id: 'letter-workbook',
    trimWidthIn: 8.5,
    trimHeightIn: 11,
    bleedOuterIn: KDP_BLEED_IN,
    safeMarginIn: KDP_SAFE_MARGIN_IN,
    fit: 'cover',
    nameKey: 'bookExport.formatLetterWorkbook',
    descKey: 'bookExport.formatLetterWorkbookDesc',
    aspectRatioCss: '17 / 22',
  },
]

/** 旧 id → 新 id */
const LEGACY_FORMAT_MAP = {
  'square-bleed': 'square-kids',
  'square-safe': 'square-kids',
}

export function normalizeBookExportFormatId(id) {
  if (!id) return DEFAULT_BOOK_EXPORT_FORMAT_ID
  return LEGACY_FORMAT_MAP[id] || id
}

export function getBookExportFormat(id) {
  const normalized = normalizeBookExportFormatId(id)
  return (
    BOOK_EXPORT_FORMATS.find((f) => f.id === normalized)
    || BOOK_EXPORT_FORMATS.find((f) => f.id === DEFAULT_BOOK_EXPORT_FORMAT_ID)
  )
}

/**
 * @param {object} format
 * @param {'digital'|'kdp'} [mode]
 */
export function getFormatPageInches(format, mode = 'digital') {
  const trimW = format.trimWidthIn
  const trimH = format.trimHeightIn
  if (mode === 'kdp') {
    const bleed = format.bleedOuterIn ?? KDP_BLEED_IN
    return {
      widthIn: trimW + bleed,
      heightIn: trimH + bleed * 2,
      trimWidthIn: trimW,
      trimHeightIn: trimH,
      bleedOuterIn: bleed,
      safeMarginIn: format.safeMarginIn ?? KDP_SAFE_MARGIN_IN,
    }
  }
  return {
    widthIn: trimW,
    heightIn: trimH,
    trimWidthIn: trimW,
    trimHeightIn: trimH,
    bleedOuterIn: 0,
    safeMarginIn: format.safeMarginIn ?? KDP_SAFE_MARGIN_IN,
  }
}

export function getFormatPixelSize(format, dpi = BOOK_EXPORT_DPI, mode = 'digital') {
  const page = getFormatPageInches(format, mode)
  return {
    width: Math.round(page.widthIn * dpi),
    height: Math.round(page.heightIn * dpi),
  }
}

export function getFormatPdfSizePt(format, mode = 'digital') {
  const page = getFormatPageInches(format, mode)
  return {
    width: page.widthIn * INCH_TO_PT,
    height: page.heightIn * INCH_TO_PT,
  }
}

export function formatSizeLabel(format, dpi = BOOK_EXPORT_DPI) {
  const trimPx = {
    width: Math.round(format.trimWidthIn * dpi),
    height: Math.round(format.trimHeightIn * dpi),
  }
  const kdp = getFormatPageInches(format, 'kdp')
  return `${format.trimWidthIn}×${format.trimHeightIn} in trim · KDP ${kdp.widthIn}×${kdp.heightIn} in · ${trimPx.width}×${trimPx.height}px@${dpi}`
}

/** 预览用：相对画布的裁切/安全区百分比（KDP 含出血画布） */
export function getKdpGuidePercents(format) {
  const page = getFormatPageInches(format, 'kdp')
  const bleed = page.bleedOuterIn
  const safe = page.safeMarginIn
  // 画布坐标系：左=书脊（无出血），右=外口（有出血），上下各有出血
  const trimLeftPct = 0
  const trimRightPct = (1 - bleed / page.widthIn) * 100
  const trimTopPct = (bleed / page.heightIn) * 100
  const trimBottomPct = (1 - bleed / page.heightIn) * 100
  const safeLeftPct = (safe / page.widthIn) * 100
  const safeRightPct = (1 - (bleed + safe) / page.widthIn) * 100
  const safeTopPct = ((bleed + safe) / page.heightIn) * 100
  const safeBottomPct = (1 - (bleed + safe) / page.heightIn) * 100
  return {
    trim: {
      top: trimTopPct,
      right: 100 - trimRightPct,
      bottom: 100 - trimBottomPct,
      left: trimLeftPct,
    },
    safe: {
      top: safeTopPct,
      right: 100 - safeRightPct,
      bottom: 100 - safeBottomPct,
      left: safeLeftPct,
    },
    pageAspect: `${page.widthIn} / ${page.heightIn}`,
    trimAspect: `${format.trimWidthIn} / ${format.trimHeightIn}`,
  }
}

/** 从旧版单页比例迁移 */
export function migrateLegacyPageRatio(pageRatio) {
  if (pageRatio === '1:1' || pageRatio === '2:1') return 'square-kids'
  if (pageRatio === '3:4') return 'chapter'
  return DEFAULT_BOOK_EXPORT_FORMAT_ID
}
