import {
  createCharacterIllustration,
  fetchEmotionPipeline,
  getActiveMoodEndpoints
} from './api'
import { setDraft } from './draft'
import {
  buildLocalDiaryCaptionFromVision,
  normalizeDiaryCaptionLength
} from './diaryCaption'

function mergeVision(base, vision) {
  if (!vision) return base
  return `${base} [参考图：${vision}]`
}

export function buildLocalIllustrationPrompt(draft, styleLabel, styleDetails, t) {
  const text = (draft.narrative || '').trim()
  const moodTxt = draft.moodLabel
    ? `${t ? t('moodDiary.selectedMood') : '心情'}：${draft.moodLabel}。`
    : ''
  return `${text}。${moodTxt}${styleLabel}，${styleDetails}`
}

export async function generateIllustrationImage(draft, options = {}) {
  const cfg = getActiveMoodEndpoints()
  const styleLabel = options.artStyle || draft.artStyle || ''
  const styleDetails = options.elementDetails || draft.artStyleElementDetails || ''
  const localPrompt = buildLocalIllustrationPrompt(
    draft,
    styleLabel,
    styleDetails,
    options.t
  )

  let imagePrompt = (draft.generateIllustrationPrompt || '').trim()

  if (imagePrompt && styleLabel && !imagePrompt.includes(styleLabel)) {
    imagePrompt = `${imagePrompt}，${styleLabel}${styleDetails ? `，${styleDetails}` : ''}`
  }

  if (!imagePrompt) {
    if (cfg.emotionPipelineEndpoint) {
      const ep = await fetchEmotionPipeline(
        draft.narrative,
        !!draft.inputImageDataUrl,
        cfg.emotionPipelineEndpoint
      )
      if (ep) imagePrompt = ep
    }
  }

  if (!imagePrompt.trim()) imagePrompt = localPrompt

  const sceneForPrompt = (draft.sceneDescription || draft.imageVisionCache || '').trim()
  if (sceneForPrompt && !draft.generateIllustrationPrompt) {
    imagePrompt = mergeVision(imagePrompt, sceneForPrompt)
  }

  const createPayload = {
    prompt: imagePrompt,
    character_name: 'mood_diary',
    character_type: 'illustration',
    size: '1024x1024',
    quality: 'standard',
    response_format: 'b64_json',
    watermark: false
  }
  if (draft.inputImageDataUrl) {
    createPayload.image = draft.inputImageDataUrl
  }

  const { imageUrl } = await createCharacterIllustration(createPayload)
  setDraft({
    rawIllustrationUrl: imageUrl,
    generateIllustrationPrompt: imagePrompt
  })
  return imageUrl
}

export function resolvePosterBodyTexts(draft) {
  let diaryCaptionLine = normalizeDiaryCaptionLength(draft.diaryCaption || draft.quotaSentence || '')
  if (!diaryCaptionLine) {
    const sceneDescription = (draft.sceneDescription || draft.imageVisionCache || '').trim()
    if (sceneDescription) {
      diaryCaptionLine = buildLocalDiaryCaptionFromVision(sceneDescription, {
        moodLabel: draft.moodLabel,
        narrative: draft.narrative
      })
    } else if (draft.captionPicked) {
      diaryCaptionLine = normalizeDiaryCaptionLength(draft.captionPicked)
    }
  }
  const userNarrative = (draft.narrative || '').trim()
  const posterMain = diaryCaptionLine || userNarrative
  const posterSub =
    diaryCaptionLine && userNarrative && diaryCaptionLine !== userNarrative ? userNarrative : ''
  return { posterMain, posterSub, diaryCaptionLine }
}

/** 风格变更或未生成插画时需重跑 illustrate */
export function isIllustrationStale(draft, styleOptions = {}) {
  const d = draft
  if (!d?.rawIllustrationUrl) return true
  const styleId = styleOptions.artStyleId ?? d.artStyleId
  const artStyle = styleOptions.artStyle ?? d.artStyle ?? ''
  if (Number(d.artStyleId) !== Number(styleId)) return true
  if ((d.artStyle || '') !== (artStyle || '')) return true
  return false
}

export async function resolveMainImageUrl(draft, posterMode) {
  if (posterMode === 'photo') {
    if (!draft.inputImageDataUrl) throw new Error('photo mode requires image')
    return draft.inputImageDataUrl
  }
  if (draft.rawIllustrationUrl && draft.posterMode === posterMode) {
    return draft.rawIllustrationUrl
  }
  return generateIllustrationImage(draft, {
    artStyle: draft.artStyle,
    elementDetails: draft.artStyleElementDetails,
    t: null
  })
}
