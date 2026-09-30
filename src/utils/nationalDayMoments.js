/** 国庆感受收集 — 预置插画与生图文案 */

export const NATIONAL_DAY_PICTURE_TYPE = 'national-day'

export const STORAGE_KEY = 'national_day_moment_image'
export const MY_PICTURE_ID_KEY = 'national_day_my_picture_id'
export const SHARE_STORY_KEY = 'national_day_share_story'

const SHARE_TITLE_MAX = 28

export const NATIONAL_DAY_STYLE_PROMPT = `Style: Handraw #015, Brian Rea soft relationship editorial line art.

Draw exactly ONE square illustration of ONE frozen moment. Choose a single instant from the feeling below. Do not illustrate a sequence, a day, or several actions.

Picture:
- One or two simplified people, seen once. Thin warm line, almost no facial detail: two small marks for eyes and a short mouth.
- Clothes and objects are a few flat soft color blocks. Background is mostly empty cream or pale paper, with at most one or two props.
- Quiet lifestyle editorial, lots of negative space, no interior detail, no furniture catalog, no cute anime rendering.

Forbidden:
- No comic panels, storyboard, collage, or repeated copies of the same person.
- No arrows, speech bubbles, thought clouds, captions, letters, or logos.
- No photorealism, 3D, thick manga shading, or dense background.

Feeling, depict only one moment:`

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
