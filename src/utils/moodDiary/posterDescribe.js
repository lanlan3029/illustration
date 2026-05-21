import {
  dataUrlToFile,
  fetchCaptionImageDescribe,
  getActiveMoodEndpoints,
  imageDescribeResultToDraftPatch
} from './api'
import { getDraft, setDraft } from './draft'
import { MOOD_DIARY_NARRATIVE_MAX } from './constants'

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
      imagePart
    ].join('|')
  )
}

export function isDescribeStale(draft) {
  if (!draft.inputImageDataUrl) return false
  const hash = buildDescribeInputHash(draft)
  if (draft.describeInputHash !== hash) return true
  return !(draft.sceneDescription || draft.diaryCaption || draft.generateIllustrationPrompt)
}

/**
 * 有参考图时调用 image-describe，结果写入 draft（只调一次，除非输入变化）
 */
export async function ensurePosterDescribe(draft, options = {}) {
  if (!draft.inputImageDataUrl) return draft
  if (!isDescribeStale(draft) && !options.force) return getDraft()

  const cfg = getActiveMoodEndpoints()
  if (!cfg.captionImageDescribeEndpoint) return draft

  const file = await dataUrlToFile(
    draft.inputImageDataUrl,
    draft.inputImageName || 'reference.jpg'
  )
  const narrativeHint = (draft.narrative || '').slice(0, MOOD_DIARY_NARRATIVE_MAX)
  const result = await fetchCaptionImageDescribe(
    file,
    {
      hint: narrativeHint,
      extraHint: narrativeHint,
      narrative: (draft.narrative || '').trim(),
      moodLabel: draft.moodLabel || '',
      illustrationStyle: options.illustrationStyle || draft.artStyle || '',
      targetLength: 90,
      generateDiaryCaption: true,
      filename: draft.inputImageName || 'reference.jpg'
    },
    cfg.captionImageDescribeEndpoint
  )
  const patch = imageDescribeResultToDraftPatch(result)
  const merged = { ...draft, ...patch }
  setDraft({
    ...patch,
    describeInputHash: buildDescribeInputHash(merged)
  })
  return getDraft()
}
