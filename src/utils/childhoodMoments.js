/** 幸福童年时刻收集 — 活动页常量 */

export const STORAGE_KEY = 'childhood_moment_image'
export const MY_PICTURE_ID_KEY = 'childhood_my_picture_id'
export const SHARE_STORY_KEY = 'childhood_share_story'
export const SHARE_POSTER_URL_KEY = 'childhood_share_poster_url'

const SHARE_TITLE_MAX = 28

/** 生图背景色（抠图用） */
export const CHILDHOOD_MATTING_BG = { r: 255, g: 43, b: 214, hex: '#FF2BD6' }

export const CHILDHOOD_STYLE_PROMPT = `One isolated lifestyle vignette. Not a repeating pattern, not a sticker sheet.

STYLE PRIORITY (most important):
Contemporary editorial flat illustration for a children's magazine — NOT cute commercial picture book art, NOT kawaii, NOT anime, NOT Disney-style.

Linework:
Bold thick dark brown contour lines (#3D2E24), clearly visible from a distance.
Slightly imperfect hand-drawn edges — but STRONG silhouettes, not delicate thin outlines.
Each major shape gets ONE outer contour; avoid inner detail lines.

Figures (keep extremely simple):
Elongated bodies (~6–7 head heights), slim relaxed proportions — NOT chibi, NOT big-head cute kids.
Faces are almost blank: tiny dot eyes OR two dots only — NO nose lines, NO mouth details, NO ears drawn, NO eyebrows, NO blush, NO teeth.
Hair = one solid flat shape (bob / short block / simple ponytail), NO hair strands, NO highlights, NO inner hair lines.
Hands and feet = simplified mitten-like or rounded stubs, NO fingers, NO shoe laces.
Clothing = 1–2 flat color blocks per garment, NO fabric folds, NO shading, NO patterns (no checks, stripes, logos), NO zippers, pockets, or backpack details.
Express emotion through POSE and silhouette only, not facial rendering.

Objects & environment:
Reduce everything to large readable shapes — door, table, tree, floor as flat color masses.
Bricks, tiles, brooms, plants: flat symbolic shapes only — NO surface texture, NO grain, NO wet reflections, NO cast shadows on ground.
Background minimal: a few props max; leave breathing room.

Color:
Soft muted retro pastels: cream, dusty pink, muted lavender, sage, olive, dusty blue, coral, mustard.
Fill with flat solid colors only.

Rendering rules:
Flat color fills, zero gradients, zero 3D, zero photorealism, zero glossy highlights, zero ambient occlusion.

Composition / matting:
NO outer contour, die-cut, white halo, or sticker border around the whole group.
All elements sit DIRECTLY on flat solid #FF2BD6 magenta background with generous empty margin.

People variety:
Mix boys and girls across scenes — different hair shapes, not the same face recycled.

Scene logic:
People stand on land/floor. Trees and flowers grow from soil. Water is only water.
No impossible scale mixes (no train on a beach). Vehicles/buildings may appear large without tiny foreground people.

Strict negative:
no thin delicate linework, no detailed faces, no nose/mouth/ear drawing, no hair strands,
no clothing folds or patterns, no kawaii/chibi/big-head cute style, no anime eyes,
no picture-book realism, no brick texture, no floor reflections, no gradients, no drop shadows,
no orange faceless silhouettes, no geometric icon people, no 3D, no photorealism,
no signature, no brand logos, no white sticker border, no outer halo around the whole vignette.`

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
