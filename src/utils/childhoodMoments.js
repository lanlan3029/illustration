/** 幸福童年时刻收集 — 活动页常量 */

export const STORAGE_KEY = 'childhood_moment_image'
export const MY_PICTURE_ID_KEY = 'childhood_my_picture_id'
export const SHARE_STORY_KEY = 'childhood_share_story'
export const SHARE_POSTER_URL_KEY = 'childhood_share_poster_url'

const SHARE_TITLE_MAX = 28

/** 生图背景色（抠图用） */
export const CHILDHOOD_MATTING_BG = { r: 255, g: 43, b: 214, hex: '#FF2BD6' }

export const CHILDHOOD_STYLE_PROMPT = `Create one isolated childhood-memory vignette based on the Scene below. Not a repeating pattern, not a sticker sheet.

STYLE PRIORITY (most important):
Soft, airy, gently muted contemporary editorial flat illustration. Keep the treatment flat and simplified, with large readable shapes and a warm everyday atmosphere — NOT kawaii, NOT anime, NOT Disney-style.

Shapes:
Use clean, softly organic silhouettes defined by adjacent flat color blocks. No outlines or contour strokes.
Keep poses and objects readable through shape and distinct colors; avoid inner detail lines.

Figures (keep extremely simple):
Elongated bodies (~6–7 head heights), slim relaxed proportions — NOT chibi, NOT big-head cute kids.
Faces are almost blank: tiny dot eyes OR two dots only — NO nose lines, NO mouth details, NO ears drawn, NO eyebrows, NO blush, NO teeth.
Hair = one solid flat shape (bob / short block / simple ponytail), NO hair strands, NO highlights, NO inner hair lines.
Hands and feet = simplified mitten-like or rounded stubs, NO fingers, NO shoe laces.
Clothing = 1–2 flat color blocks per garment, NO fabric folds, NO shading, NO patterns (no checks, stripes, logos), NO zippers, pockets, or backpack details.
Express emotion through POSE and silhouette only, not facial rendering.

Objects & environment:
Include only the people, objects and setting details needed for the supplied Scene; do not add extra people or decorative walls, plants, buildings or travel motifs.
Reduce objects to flat symbolic shapes. A small floor or ground patch may anchor the scene, but no full background or landscape.
Bricks, tiles, brooms and plants, when required by the Scene: no surface texture, no grain, no wet reflections, no cast shadows on ground.
Keep a few essential props at most and leave generous breathing room.

Color:
Use a harmonious low-to-medium-saturation palette: dusty desaturated slate blue, pale blue-green mint, muted mustard yellow, dusty blush, soft terracotta/coral accents, warm off-white, and softened charcoal brown.
Approximate color guidance: muted slate blue #587784, charcoal gray-brown #514E4B, muted clay coral #CF806A, subdued pale mustard #D5C17B, dusty blue-green #86AAA1, muted blue-gray #83A9B2, warm off-white #F4F0E7.
Distribute these colors naturally across clothing and props. For example, a shirt can be slate blue, coral or warm off-white; trousers charcoal gray-brown; a backpack dusty blue-green; shorts muted blue-gray.
Use natural soft warm skin tones, never vivid orange. If present, floor bricks are muted reddish terracotta #C99782 with light warm joints; a sunlight patch is flat pale buttery yellow #E5D59B; wood is muted warm ochre-brown; broom straw is desaturated straw yellow; bowls have pale mint and gray-blue accents.
These colors are approximate design guidance, not required objects. Prioritize the overall harmonious palette while retaining distinct colors and readable contrast. Do not apply a uniform beige filter or use saturated electric blue.
Fill with flat solid colors only. The matting background specified below is the sole exception to this muted palette.

Rendering rules:
Flat color fills, no shading or added texture, zero gradients, zero 3D, zero photorealism, zero glossy highlights, zero ambient occlusion.

Composition / matting:
NO outer contour, die-cut, white halo, or sticker border around the whole group.
All elements sit DIRECTLY on flat solid #FF2BD6 magenta background with generous empty margin.
This uniform background will be removed to produce a transparent PNG. Keep #FF2BD6 out of all subjects and props. No white background or checkerboard pattern.
Return only the single vignette image, with all people and props fully inside the canvas.

People variety:
Mix boys and girls across scenes — different hair shapes, not the same face recycled.

Scene logic:
People stand on land/floor. Trees and flowers grow from soil. Water is only water.
No impossible scale mixes (no train on a beach). Vehicles/buildings may appear large without tiny foreground people.

Strict negative:
no outlines or contour strokes, no detailed faces, no nose/mouth/ear drawing, no hair strands,
no clothing folds or patterns, no kawaii/chibi/big-head cute style, no anime eyes,
no picture-book realism, no brick texture, no floor reflections, no gradients, no drop shadows,
no orange faceless silhouettes, no geometric icon people, no 3D, no photorealism,
no typography, no labels, no signature, no brand logos, no borders, no white sticker border, no outer halo around the whole vignette.`

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
