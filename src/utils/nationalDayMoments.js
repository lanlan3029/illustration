/** 国庆感受收集 — 预置插画与生图文案 */

export const NATIONAL_DAY_PICTURE_TYPE = 'national-day'

export const STORAGE_KEY = 'national_day_moment_image'
export const MY_PICTURE_ID_KEY = 'national_day_my_picture_id'
export const SHARE_STORY_KEY = 'national_day_share_story'

const SHARE_TITLE_MAX = 28

export const NATIONAL_DAY_STYLE_PROMPT = `Draw the Scene as ONE quiet lifestyle editorial illustration, matching a single illustrator across a National Day feelings collection.

Composition:
One wide everyday scene with generous cream empty space. Show the feeling through a small number of people, furniture and objects. Keep the view flat and simple, like a magazine vignette, not a detailed room or a poster.

People:
Soft rounded cartoon bodies, slightly large heads, tiny dot eyes, a small curved mouth, peach skin, simple hair shapes. Hands and shoes are simplified. Poses are still and everyday: sitting, lying, looking at a phone, standing apart.

Color and line:
Warm cream paper background #F6F1E6 with a faint paper grain. Muted fills only: dusty blue, sage, butter yellow, blush, warm gray and soft peach. Thin warm-brown outlines, flat color, almost no shading. No neon, no photorealism, no 3D.

Strict exclusions:
No typography, captions, logos, watermarks, speech bubbles or holiday slogans inside the picture. No national flags as the main subject. No crowded parade unless the Scene explicitly asks for one.

Scene:`

export function buildNationalDayPrompt(scene) {
  const text = (scene || '').trim()
  if (!text) return ''
  return `${NATIONAL_DAY_STYLE_PROMPT}\n${text}`
}

export function buildNationalDayPictureTitle(description) {
  const text = (description || '').trim()
  if (!text) return '国庆感受'
  return text.length <= 24 ? text : `${text.slice(0, 24)}…`
}

export function normalizeFeeling(text) {
  return String(text || '').replace(/\s+/g, '')
}

export function buildShareTitle(story) {
  const text = (story || '').trim().replace(/\s+/g, ' ')
  if (!text) return '国庆感受收集'
  if (text.length <= SHARE_TITLE_MAX) return text
  return `${text.slice(0, SHARE_TITLE_MAX)}…`
}

export function buildShareLink(pictureId, baseHref) {
  try {
    const origin = typeof window !== 'undefined' && /(^|\.)kidstory\.cc$/.test(window.location.hostname)
      ? window.location.origin : 'https://www.kidstory.cc'
    const url = new URL('/national-day', baseHref || origin)
    if (pictureId) url.searchParams.set('mine', pictureId)
    return url.toString()
  } catch {
    return baseHref || ''
  }
}

export function toAbsoluteShareUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (typeof window === 'undefined') return url
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}
