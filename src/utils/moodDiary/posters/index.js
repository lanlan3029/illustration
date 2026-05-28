import { DEFAULT_POSTER_TEMPLATE_ID } from './constants'
import { ensureMoodDiaryFontsLoaded } from '../fonts'
import {
  canvasToDataUrl,
  extractDominantHex,
  loadPosterImage
} from './shared'
import { composePosterTemplate } from './templates'

export { POSTER_TEMPLATE_IDS, DEFAULT_POSTER_TEMPLATE_ID } from './constants'
export {
  MOOD_FONT_KAI,
  MOOD_FONT_SERIF,
  MOOD_POSTER_BODY_FONT,
  MOOD_POSTER_DISPLAY_FONT,
  ensureMoodDiaryFontsLoaded,
  preloadMoodDiaryFonts
} from '../fonts'

export const POSTER_TEMPLATE_META = [
  { id: 'coverStory', nameKey: 'moodDiary.posterTplCoverStory' },
  { id: 'creamCard', nameKey: 'moodDiary.posterTplCreamCard' },
  { id: 'gazette', nameKey: 'moodDiary.posterTplGazette' },
  { id: 'framedPhoto', nameKey: 'moodDiary.posterTplFramedPhoto' },
  { id: 'colorBlock', nameKey: 'moodDiary.posterTplColorBlock' },
  { id: 'titleAbove', nameKey: 'moodDiary.posterTplTitleAbove' },
  { id: 'magazine', nameKey: 'moodDiary.posterTplMagazine' },
  { id: 'multiGrid', nameKey: 'moodDiary.posterTplMultiGrid' }
]

/**
 * @param {string} imageUrl
 * @param {{
 *   templateId?: string,
 *   bodyText?: string,
 *   excerptText?: string,
 *   moodLabel?: string,
 *   createdAt?: number,
 *   footerName?: string,
 *   dominantHex?: string,
 *   locale?: string,
 *   colorBlockPlacement?: string,
 *   imagePlacement?: string
 * }} opts
 */
export async function composePoster(imageUrl, opts = {}) {
  if (!imageUrl) throw new Error('poster image missing')
  await ensureMoodDiaryFontsLoaded()
  const img = await loadPosterImage(imageUrl)
  const dominantHex = opts.dominantHex || extractDominantHex(img)
  const templateId = opts.templateId || DEFAULT_POSTER_TEMPLATE_ID
  const canvas = composePosterTemplate(templateId, img, {
    ...opts,
    dominantHex
  })
  return canvasToDataUrl(canvas)
}

/** @deprecated 兼容旧调用 */
export async function composeMoodPoster(imageUrl, diaryText, opts = {}) {
  return composePoster(imageUrl, {
    templateId: DEFAULT_POSTER_TEMPLATE_ID,
    bodyText: diaryText,
    excerptText: opts.captionLine || opts.userNarrative || ''
  })
}

export { loadPosterImage, extractDominantHex } from './shared'
