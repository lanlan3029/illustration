import { reactive } from 'vue'

const failedThumbnails = reactive(new Set())

export function illustrationImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const url = value.trim()
  return /^(https?:|data:|blob:)/i.test(url) ? url : `https://static.kidstory.cc/${url.replace(/^\/+/, '')}`
}

export function illustrationPreviewUrl(item) {
  if (typeof item === 'string') return illustrationImageUrl(item)
  const thumbnail = illustrationImageUrl(item?.thumbnail || item?.thumbnail_url || item?.thumb_url || item?.cover_thumbnail)
  if (thumbnail && !failedThumbnails.has(thumbnail)) return thumbnail
  const original = item?.content || item?.image_url || item?.url || ''
  return illustrationImageUrl(Array.isArray(original) ? original[0] : original)
}

export function markIllustrationThumbnailFailed(item) {
  const thumbnail = illustrationImageUrl(item?.thumbnail || item?.thumbnail_url || item?.thumb_url || item?.cover_thumbnail)
  if (thumbnail) failedThumbnails.add(thumbnail)
}
