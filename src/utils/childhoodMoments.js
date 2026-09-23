/** 幸福童年时刻收集 — 活动页常量 */

export const STORAGE_KEY = 'childhood_moment_image'
export const MY_PICTURE_ID_KEY = 'childhood_my_picture_id'
export const SHARE_STORY_KEY = 'childhood_share_story'
export const SHARE_POSTER_URL_KEY = 'childhood_share_poster_url'

const SHARE_TITLE_MAX = 28

/** 生图背景色（抠图用） */
export const CHILDHOOD_MATTING_BG = { r: 255, g: 43, b: 214, hex: '#FF2BD6' }

export const CHILDHOOD_STYLE_PROMPT = `One isolated lifestyle vignette for a modern children's picture book and educational website.
Not a repeating pattern, not a sticker sheet.

Visual style:
Flat hand-drawn editorial illustration.
Sophisticated flat illustration, simple organic shapes, large flat color blocks.
Clean but slightly imperfect hand-drawn outlines, bold dark contour lines.
Minimal facial features, elongated expressive figures, relaxed natural poses.
Playful visual rhythm, warm and friendly atmosphere.
Warm, playful, sophisticated, human — editorial rather than childish,
like a contemporary children's magazine illustration.
Keep shapes simple and readable; confident organic silhouettes and expressive body language.

Color:
Soft muted pastel colors with a slightly retro feeling:
cream, dusty pink, muted lavender, sage green, olive green,
dusty blue, coral orange, mustard yellow.
Dark brown linework.

Rendering:
Flat colors, minimal visual detail.
No gradients, no realistic lighting, no 3D, no photorealism,
no heavy texture, no complex background, no glossy effects, no drop shadows.

Composition / matting:
NO outer contour, die-cut, white halo, or sticker border around the whole group.
Each shape sits DIRECTLY on a flat solid #FF2BD6 magenta background, generous empty margin.

People:
Children must be both boys and girls across a series — not the same face every time.
Girls: bob, pigtails, clip, or dress. Boys: short hair.
Do not reuse one face with different clothes.

Scene logic:
People stand on land/floor. Trees and flowers grow from soil. Water is only water.
Do not put a train on a beach, a tree in the sea, or mix mismatched scales.
A vehicle or building can be drawn alone and large, without tiny foreground people.

Negative:
no orange faceless silhouettes, no geometric icon people,
no photorealism, no 3D, no gradients, no signature, no brand logos,
no white sticker border, no outer black outline around the whole silhouette.`

export function buildChildhoodPrompt(scene) {
  const text = (scene || '').trim()
  if (!text) return ''
  return `${CHILDHOOD_STYLE_PROMPT}\n\nScene:\n${text}`
}

export function buildChildhoodPictureTitle(description) {
  const text = (description || '').trim()
  if (!text) return '童年瞬间'
  return text.length <= 24 ? text : `${text.slice(0, 24)}…`
}

export const SHARE = {
  title: '幸福童年收集',
  desc: '写下珍贵童年瞬间，生成治愈插画，一起来收集吧',
}

/** 微信分享标题：故事打头 */
export function buildShareTitle(story) {
  const text = (story || '').trim().replace(/\s+/g, ' ')
  if (!text) return SHARE.title
  if (text.length <= SHARE_TITLE_MAX) return text
  return `${text.slice(0, SHARE_TITLE_MAX)}…`
}

/** 微信分享描述：社会证明 + 轻邀请 */
export function buildShareDesc(count) {
  const n = Number(count) || 0
  if (n > 0) {
    return `今日已有 ${n} 人在收集童年瞬间 · 你也来加一张？`
  }
  return '我把童年画出来了，你也来加一张？'
}

export function buildShareLink(pictureId, baseHref) {
  try {
    const base = (baseHref || (typeof window !== 'undefined' ? window.location.href : '')).split('#')[0]
    const url = new URL(base)
    if (pictureId) {
      url.searchParams.set('mine', pictureId)
    } else {
      url.searchParams.delete('mine')
    }
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
