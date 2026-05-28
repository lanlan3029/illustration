import {
  dataUrlToFile,
  fetchCaptionImageDescribe,
  fetchCaptionPickIllustrationPrompt,
  fetchEmotionPipeline,
  getActiveMoodEndpoints,
  imageDescribeResultToDraftPatch
} from './api'
import { getDraft, setDraft } from './draft'
import { MOOD_DIARY_NARRATIVE_MAX } from './constants'
import { buildLocalIllustrationPrompt } from './posterIllustrate'
import { normalizeDiaryCaptionFromApi, normalizeDiaryCaptionLength } from './diaryCaption'

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return String(h)
}

export function buildDescribeInputHash(draft) {
  const imagePart = draft.inputImageDataUrl
    ? simpleHash(String(draft.inputImageDataUrl).slice(0, 200))
    : ''
  return simpleHash(
    [
      (draft.narrative || '').trim(),
      draft.moodEmojiId || draft.mood || '',
      draft.moodLabel || '',
      imagePart,
      draft.artStyleId || '',
      draft.artStyle || '',
      draft.artStyleElementDetails || ''
    ].join('|')
  )
}

/** 描述结果是否过期（有图 / 无图均适用） */
export function isDescribeStale(draft) {
  const hash = buildDescribeInputHash(draft || getDraft())
  const d = draft || getDraft()
  if (d.describeInputHash !== hash) return true
  return !(d.sceneDescription || d.diaryCaption || d.generateIllustrationPrompt)
}

export function isPhotoDescribeStale(draft) {
  const d = draft || getDraft()
  if (!d.inputImageDataUrl) return true
  return isDescribeStale(d)
}

function buildDescribeRequestOptions(draft, options = {}) {
  const narrativeHint = (draft.narrative || '').slice(0, MOOD_DIARY_NARRATIVE_MAX)
  return {
    hint: narrativeHint,
    extraHint: narrativeHint,
    narrative: (draft.narrative || '').trim(),
    moodLabel: draft.moodLabel || '',
    illustrationStyle: options.illustrationStyle || draft.artStyle || '',
    targetLength: 40,
    generateDiaryCaption: true,
    filename: draft.inputImageName || 'reference.jpg',
    instruction: narrativeHint,
    candidates: Array.isArray(draft.captionCandidates) ? draft.captionCandidates : undefined
  }
}

function pickResultToDescribeResult(pickResult, draft) {
  const narrative = (draft.narrative || '').trim()
  const diaryCaption =
    normalizeDiaryCaptionFromApi(pickResult.diaryCaption || '') ||
    normalizeDiaryCaptionLength(narrative)
  return {
    description: pickResult.description || '',
    sceneDescription: pickResult.sceneDescription || '',
    diaryCaption,
    illustrationPrompt: pickResult.illustrationPrompt || '',
    illustrationStyle: pickResult.illustrationStyle || '',
    inputMode: pickResult.inputMode || ''
  }
}

async function buildTextOnlyDescribeFallback(draft, options = {}) {
  const cfg = getActiveMoodEndpoints()
  let illustrationPrompt = ''
  if (cfg.emotionPipelineEndpoint) {
    illustrationPrompt =
      (await fetchEmotionPipeline(
        (draft.narrative || '').trim(),
        false,
        cfg.emotionPipelineEndpoint
      )) || ''
  }
  if (!illustrationPrompt) {
    illustrationPrompt = buildLocalIllustrationPrompt(
      draft,
      options.illustrationStyle || draft.artStyle || '',
      options.elementDetails || draft.artStyleElementDetails || '',
      options.t
    )
  }
  const diaryCaption = normalizeDiaryCaptionFromApi((draft.narrative || '').trim())
  return {
    description: '',
    sceneDescription: '',
    diaryCaption,
    illustrationPrompt,
    illustrationStyle: options.illustrationStyle || draft.artStyle || '',
    inputMode: 'diary_first'
  }
}

function applyDescribePatch(draft, result, options = {}) {
  const patch = imageDescribeResultToDraftPatch(result)
  if (!options.applyArtStyleFromApi) {
    delete patch.artStyle
  }
  const merged = { ...draft, ...patch }
  setDraft({
    ...patch,
    describeInputHash: buildDescribeInputHash(merged),
    rawIllustrationUrl: options.resetIllustration ? null : draft.rawIllustrationUrl
  })
  return getDraft()
}

/**
 * 插画日记 prepare：
 * - 有图 → image-describe（vision + 日记 + prompt）
 * - 无图 → caption/pick（generate_illustration_prompt，纯文本 LLM）
 */
export async function ensureIllustrationPosterDescribe(draft, options = {}) {
  const d = draft || getDraft()
  if (!isDescribeStale(d) && !options.force) return getDraft()

  const cfg = getActiveMoodEndpoints()
  const reqOpts = buildDescribeRequestOptions(d, options)
  let result

  if (d.inputImageDataUrl) {
    if (!cfg.captionImageDescribeEndpoint) return d
    const file = await dataUrlToFile(d.inputImageDataUrl, d.inputImageName || 'reference.jpg')
    result = await fetchCaptionImageDescribe(
      file,
      reqOpts,
      cfg.captionImageDescribeEndpoint
    )
  } else if (cfg.captionPickEndpoint) {
    const pickResult = await fetchCaptionPickIllustrationPrompt(reqOpts, cfg.captionPickEndpoint)
    result = pickResultToDescribeResult(pickResult, d)
  } else {
    result = await buildTextOnlyDescribeFallback(d, options)
  }

  return applyDescribePatch(d, result, {
    applyArtStyleFromApi: false,
    resetIllustration: true
  })
}

/**
 * 照片日记：有参考图时调用 image-describe（只调一次，除非输入变化）
 */
export async function ensurePosterDescribe(draft, options = {}) {
  const d = draft || getDraft()
  if (!d.inputImageDataUrl) return d
  if (!isPhotoDescribeStale(d) && !options.force) return getDraft()
  return ensureIllustrationPosterDescribe(d, options)
}
