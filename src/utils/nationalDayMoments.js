/** 国庆感受收集 — 预置插画与生图文案 */

export const NATIONAL_DAY_PICTURE_TYPE = 'national-day'

export const STORAGE_KEY = 'national_day_moment_image'
export const MY_PICTURE_ID_KEY = 'national_day_my_picture_id'
export const SHARE_STORY_KEY = 'national_day_share_story'

const SHARE_TITLE_MAX = 28

export const NATIONAL_DAY_STYLE_PROMPT = `Handraw 风格 #015 · Soft Relationship Editorial Line Art

参考作者：Brian Rea。

视觉要点：极简人物线稿、人与关系、柔和色块、生活型社论；脸部与服装主动做减法，依靠清楚轮廓、眼口和少量关键形状建立人物辨识度；配色控制在柔和低刺激色域，用少量点色区分层次，背景保持轻和干净。

单幅正方形插画，构图按 1:1 展开，不要画成横幅。默认纯画面，除非用户要求图中带字。

扁平手绘 editorial；避免写实摄影与 3D。

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
