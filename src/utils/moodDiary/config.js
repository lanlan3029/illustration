/**
 * Mood diary backend hooks (optional). Set in .env with VUE_APP_MOOD_*.
 * Empty = skip that step (pure local fallback).
 */
/** 与 create-character 同域；未配置 env 时使用该默认路径 */
const DEFAULT_CAPTION_IMAGE_DESCRIBE = '/caption/image-describe'
const DEFAULT_CAPTION_PICK = '/caption/pick'
/**
 * 与 KidStory 生产一致时可配完整 URL，例如 https://api.kidstory.cc/caption/mood-recap
 * 兼容旧网关路径 /api/v1/caption/mood-recap（服务端会重写到 /caption/mood-recap）
 */
const DEFAULT_CAPTION_MOOD_RECAP = '/caption/mood-recap'

export function getMoodApiConfig() {
  const imageDescribe =
    (process.env.VUE_APP_MOOD_IMAGE_DESCRIBE || '').trim() ||
    DEFAULT_CAPTION_IMAGE_DESCRIBE
  const captionPick =
    (process.env.VUE_APP_MOOD_CAPTION_PICK || '').trim() || DEFAULT_CAPTION_PICK
  const emotionPipeline = process.env.VUE_APP_MOOD_EMOTION_PIPELINE || ''
  const emotionAlign = process.env.VUE_APP_MOOD_EMOTION_ALIGN || ''
  const illSave = process.env.VUE_APP_MOOD_ILL_SAVE || ''
  const recapCompletion =
    (process.env.VUE_APP_MOOD_RECAP_COMPLETION || '').trim() ||
    DEFAULT_CAPTION_MOOD_RECAP
  return {
    /** POST /caption/image-describe（multipart 或 JSON）；有图时返回描述 + 日记 + illustration_prompt */
    captionImageDescribeEndpoint: imageDescribe.trim() || null,
    /** POST /caption/pick；无图时 generate_illustration_prompt 生成文生图 prompt */
    captionPickEndpoint: captionPick.trim() || null,
    emotionPipelineEndpoint: emotionPipeline.trim() || null,
    emotionAlignEndpoint: emotionAlign.trim() || null,
    illSaveEndpoint: illSave.trim() || null,
    /** POST /caption/mood-recap（JSON）；与 image-describe 同套 code/data 包装 */
    recapCompletionEndpoint: recapCompletion.trim() || null
  }
}

export function resolveApiUrl(pathOrFull) {
  if (!pathOrFull) return null
  if (pathOrFull.startsWith('http://') || pathOrFull.startsWith('https://')) return pathOrFull
  const base = process.env.VUE_APP_API_BASE_URL || ''
  return base ? `${base.replace(/\/$/, '')}${pathOrFull.startsWith('/') ? '' : '/'}${pathOrFull}` : pathOrFull
}
