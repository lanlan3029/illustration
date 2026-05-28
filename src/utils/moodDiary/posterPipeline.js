import { composePoster } from './posters'
import { getDraft, setDraft } from './draft'
import { ensurePosterDescribe } from './posterDescribe'
import { persistGeneratedPosterLocally } from './posterActions'
import {
  generateIllustrationImage,
  resolveMultiGridPosterTexts,
  resolvePosterBodyTexts
} from './posterIllustrate'
import { savePosterTemplatePref } from './posterTemplatePref'

/**
 * @typedef {'photo'|'illustration'} PosterMode
 */

/**
 * 仅本地合成（换模版预览）
 */
export async function composePosterFromDraft(draft, options = {}) {
  const posterMode = options.posterMode || draft.posterMode || 'illustration'
  const templateId = options.templateId || draft.posterTemplateId || 'creamCard'
  const mainImage =
    options.previewImageUrl ||
    (posterMode === 'photo' ? draft.inputImageDataUrl : draft.rawIllustrationUrl || draft.inputImageDataUrl)

  if (!mainImage) throw new Error('no image for compose')

  const { posterMain, posterSub } = resolvePosterBodyTexts(draft)
  const multiGridTexts = resolveMultiGridPosterTexts(draft)
  const dataUrl = await composePoster(mainImage, {
    templateId,
    bodyText: draft.narrative || posterMain,
    excerptText: posterSub,
    userNarrative: draft.narrative || multiGridTexts.textAbove,
    narrativeText: draft.narrative || '',
    aiCaptionText: draft.diaryCaption || multiGridTexts.textBelow || posterSub || '',
    diaryCaption: draft.diaryCaption || posterSub || '',
    moodLabel: draft.moodLabel,
    createdAt: Date.now(),
    footerName: options.footerName || '',
    locale: options.locale || 'zh',
    dominantHex: draft.dominantHex,
    colorBlockPlacement: options.colorBlockPlacement || draft.colorBlockPlacement || 'top',
    imagePlacement: options.imagePlacement || draft.imagePlacement || 'below'
  })
  return dataUrl
}

/**
 * 完整 pipeline：describe → 主图 → compose
 * @param {{
 *   posterMode: PosterMode,
 *   templateId: string,
 *   artStyle?: string,
 *   elementDetails?: string,
 *   artStyleId?: number,
 *   colorBlockPlacement?: string,
 *   imagePlacement?: string,
 *   locale?: string,
 *   footerName?: string,
 *   onStep?: (key: string) => void
 * }} options
 */
export async function runPosterPipeline(options) {
  let draft = getDraft()
  if (!(draft.narrative || '').trim()) {
    throw new Error('empty narrative')
  }

  const posterMode = options.posterMode || 'illustration'
  if (posterMode === 'photo' && !draft.inputImageDataUrl) {
    throw new Error('photo mode requires image')
  }

  setDraft({
    posterMode,
    posterTemplateId: options.templateId,
    artStyle: options.artStyle || draft.artStyle,
    artStyleId: options.artStyleId ?? draft.artStyleId,
    artStyleElementDetails: options.elementDetails || draft.artStyleElementDetails,
    colorBlockPlacement: options.colorBlockPlacement || draft.colorBlockPlacement || 'top',
    imagePlacement: options.imagePlacement || draft.imagePlacement || 'below',
    posterGenerating: true
  })
  draft = getDraft()

  try {
    if (draft.inputImageDataUrl) {
      options.onStep?.('describe')
      draft = await ensurePosterDescribe(draft, {
        illustrationStyle: options.artStyle || draft.artStyle
      })
    }

    let mainImageUrl
    if (posterMode === 'photo') {
      mainImageUrl = draft.inputImageDataUrl
    } else {
      options.onStep?.('illustrate')
      if (draft.rawIllustrationUrl && draft.posterMode === 'illustration') {
        mainImageUrl = draft.rawIllustrationUrl
      } else {
        mainImageUrl = await generateIllustrationImage(draft, {
          artStyle: options.artStyle,
          elementDetails: options.elementDetails
        })
        draft = getDraft()
      }
    }

    options.onStep?.('compose')
    const composeDraft = getDraft()
    const { posterMain, posterSub, diaryCaptionLine } = resolvePosterBodyTexts(composeDraft)
    const multiGridTexts = resolveMultiGridPosterTexts(composeDraft)
    const posterUrl = await composePoster(mainImageUrl, {
      templateId: options.templateId,
      bodyText: composeDraft.narrative || posterMain,
      excerptText: posterSub,
      userNarrative: composeDraft.narrative || multiGridTexts.textAbove,
      narrativeText: composeDraft.narrative || '',
      aiCaptionText: composeDraft.diaryCaption || multiGridTexts.textBelow || posterSub || '',
      diaryCaption: composeDraft.diaryCaption || posterSub || '',
      moodLabel: draft.moodLabel,
      createdAt: Date.now(),
      footerName: options.footerName || '',
      locale: options.locale || 'zh',
      colorBlockPlacement: options.colorBlockPlacement,
      imagePlacement: options.imagePlacement
    })

    setDraft({
      composedPosterDataUrl: posterUrl,
      diaryCaption: diaryCaptionLine,
      quotaSentence: diaryCaptionLine,
      rawIllustrationUrl: posterMode === 'illustration' ? mainImageUrl : draft.rawIllustrationUrl,
      posterGenerating: false
    })
    persistGeneratedPosterLocally(posterUrl, diaryCaptionLine)

    savePosterTemplatePref({
      templateId: options.templateId,
      colorBlockPlacement: options.colorBlockPlacement,
      imagePlacement: options.imagePlacement
    })

    return { posterUrl, diaryCaptionLine }
  } catch (e) {
    setDraft({ posterGenerating: false })
    throw e
  }
}

/** 仅重跑合成（换模版） */
export async function recomposePoster(options) {
  const draft = getDraft()
  const posterUrl = await composePosterFromDraft(draft, options)
  setDraft({ composedPosterDataUrl: posterUrl, posterTemplateId: options.templateId })
  persistGeneratedPosterLocally(posterUrl, draft.diaryCaption || draft.quotaSentence || '')
  savePosterTemplatePref({
    templateId: options.templateId,
    colorBlockPlacement: options.colorBlockPlacement,
    imagePlacement: options.imagePlacement
  })
  return posterUrl
}

/** 插画模式：换风格重画 */
export async function regenerateIllustration(options) {
  setDraft({ rawIllustrationUrl: null })
  return runPosterPipeline({ ...options, posterMode: 'illustration' })
}
