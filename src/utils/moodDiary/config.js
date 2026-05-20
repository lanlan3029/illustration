/**
 * Mood diary backend hooks (optional). Set in .env with VUE_APP_MOOD_*.
 * Empty = skip that step (pure local fallback).
 */
export function getMoodApiConfig() {
  const pick = process.env.VUE_APP_MOOD_CAPTION_PICK || ''
  const imageDescribe = process.env.VUE_APP_MOOD_IMAGE_DESCRIBE || ''
  const emotionPipeline = process.env.VUE_APP_MOOD_EMOTION_PIPELINE || ''
  const emotionAlign = process.env.VUE_APP_MOOD_EMOTION_ALIGN || ''
  const illSave = process.env.VUE_APP_MOOD_ILL_SAVE || ''
  const recapCompletion = process.env.VUE_APP_MOOD_RECAP_COMPLETION || ''
  return {
    /** POST /caption/image-describe（multipart 或 JSON）；默认一次返回描述 + 日记 + illustration_prompt */
    captionImageDescribeEndpoint: imageDescribe.trim() || null,
    emotionPipelineEndpoint: emotionPipeline.trim() || null,
    emotionAlignEndpoint: emotionAlign.trim() || null,
    captionPickEndpoint: pick.trim() || null,
    illSaveEndpoint: illSave.trim() || null,
    recapCompletionEndpoint: recapCompletion.trim() || null
  }
}

export function resolveApiUrl(pathOrFull) {
  if (!pathOrFull) return null
  if (pathOrFull.startsWith('http://') || pathOrFull.startsWith('https://')) return pathOrFull
  const base = process.env.VUE_APP_API_BASE_URL || ''
  return base ? `${base.replace(/\/$/, '')}${pathOrFull.startsWith('/') ? '' : '/'}${pathOrFull}` : pathOrFull
}
