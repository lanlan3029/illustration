import { DEFAULT_POSTER_TEMPLATE_ID } from './constants'
import { ensureMoodDiaryFontsLoaded } from '../fonts'
import {
  canvasToDataUrl,
  extractDominantHex,
  loadPosterImage
} from './shared'
import { composePosterTemplate } from './templates'

export { POSTER_TEMPLATE_IDS, DEFAULT_POSTER_TEMPLATE_ID } from './constants'
export { suggestEditorialTemplate } from './editorialTemplates'
export {
  MOOD_FONT_KAI,
  MOOD_FONT_SERIF,
  MOOD_POSTER_BODY_FONT,
  MOOD_POSTER_DISPLAY_FONT,
  ensureMoodDiaryFontsLoaded,
  preloadMoodDiaryFonts
} from '../fonts'

export const POSTER_TEMPLATE_META = [
  { id: 'coverStory', nameKey: 'moodDiary.posterTplCoverStory', group: 'classic' },
  { id: 'creamCard', nameKey: 'moodDiary.posterTplCreamCard', group: 'classic' },
  { id: 'gazette', nameKey: 'moodDiary.posterTplGazette', group: 'classic' },
  { id: 'framedPhoto', nameKey: 'moodDiary.posterTplFramedPhoto', group: 'classic' },
  { id: 'colorBlock', nameKey: 'moodDiary.posterTplColorBlock', group: 'classic' },
  { id: 'titleAbove', nameKey: 'moodDiary.posterTplTitleAbove', group: 'classic' },
  { id: 'magazine', nameKey: 'moodDiary.posterTplMagazine', group: 'classic' },
  { id: 'multiGrid', nameKey: 'moodDiary.posterTplMultiGrid', group: 'classic' },
  { id: 'quietEditorial', nameKey: 'moodDiary.posterTplQuietEditorial', group: 'editorial' },
  { id: 'fullBleedMood', nameKey: 'moodDiary.posterTplFullBleedMood', group: 'editorial' },
  { id: 'minimalReading', nameKey: 'moodDiary.posterTplMinimalReading', group: 'editorial' },
  { id: 'imageWindow', nameKey: 'moodDiary.posterTplImageWindow', group: 'editorial' },
  { id: 'filmMood', nameKey: 'moodDiary.posterTplFilmMood', group: 'editorial' },
  { id: 'softPaper', nameKey: 'moodDiary.posterTplSoftPaper', group: 'editorial' },
  { id: 'museumLayout', nameKey: 'moodDiary.posterTplMuseumLayout', group: 'editorial' },
  { id: 'poetryLayout', nameKey: 'moodDiary.posterTplPoetryLayout', group: 'editorial' }
]

export const POSTER_TEMPLATE_GROUPS = [
  { id: 'classic', nameKey: 'moodDiary.posterTplGroupClassic' },
  { id: 'editorial', nameKey: 'moodDiary.posterTplGroupEditorial' }
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
