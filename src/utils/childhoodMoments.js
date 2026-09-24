/** 幸福童年时刻收集 — 活动页常量 */

export const STORAGE_KEY = 'childhood_moment_image'
export const MY_PICTURE_ID_KEY = 'childhood_my_picture_id'
export const SHARE_STORY_KEY = 'childhood_share_story'
export const SHARE_POSTER_URL_KEY = 'childhood_share_poster_url'

const SHARE_TITLE_MAX = 28

/** 生图背景色（抠图用） */
export const CHILDHOOD_MATTING_BG = { r: 255, g: 43, b: 214, hex: '#FF2BD6' }

export const CHILDHOOD_STYLE_PROMPT = `Illustrate the Scene below as one small, self-contained childhood-memory vignette.

Art direction:
A soft, airy, gently muted editorial illustration of everyday life. Draw recognizable people with natural, relaxed proportions and gently curved silhouettes. Adults have balanced adult proportions; children are visibly smaller with age-appropriate proportions. Convey the interaction through believable gestures, body language and overlapping shapes.
Use smooth, simplified color shapes without outlines. Faces are warm skin-colored shapes without drawn facial features; a small ear shape is welcome where visible. Hair forms a simple dark silhouette. Hands and shoes are simplified but recognizable. Preserve enough structure to explain the action: a shirt collar, a few broad clothing folds, backpack straps and a pocket, bowl rims or table legs when relevant. Keep these details sparse and integrated into the color shapes.

Palette:
Use distinct, harmonious low-to-medium-saturation colors: dusty slate blue #587784, pale blue-green mint, dusty blue-green #86AAA1, muted blue-gray #83A9B2, subdued pale mustard #D5C17B, dusty blush, muted clay coral #CF806A, warm off-white #F4F0E7 and softened charcoal gray-brown #514E4B.
Balance cool blue and mint with warm coral and mustard; maintain readable separation between adjacent shapes. Use natural, soft warm skin tones. Treat the hex values as approximate guidance for a light, calm palette, not as a uniform color filter.
When the Scene includes a father, mother and child, favor slate blue for the father's shirt and charcoal gray-brown for his trousers, clay coral for the mother's top and pale mustard for her lower garment, warm off-white for the child's shirt, blue-gray for shorts and dusty blue-green for a backpack if present. These are color assignments only; include people and objects only when called for by the Scene.
For relevant props, use muted warm ochre-brown wood, desaturated straw-yellow broom bristles, warm off-white bowls with pale mint or gray-blue rims. A brick floor patch can be muted terracotta #C99782 with light warm joints; a sunlight patch can be a simple flat buttery-yellow shape #E5D59B.

Rendering:
Keep the illustration flat and simplified, with mostly solid fills. Use only a few subtle darker color shapes to describe essential folds or overlaps. Minimize shading. Edges are clean and softly curved. No gradients, added texture, grain, realistic materials, glossy highlights, dramatic lighting, 3D rendering or drop shadows.

Scene and composition:
Follow the supplied Scene for the number of people, their actions and the necessary objects. Arrange them as a single coherent interaction, with complete silhouettes and comfortable empty space around the group. A small irregular floor patch may connect the feet and furniture. Keep the ground local to the action rather than filling the canvas. Do not invent decorative walls, plants, buildings, travel motifs or extra people.

Background for transparent output:
The application removes the background after generation to deliver a transparent PNG. Render the entire empty background as exactly solid ${CHILDHOOD_MATTING_BG.hex}, including open gaps between limbs, furniture and props. Reserve this color exclusively for the removable background; never use it in the illustration. Keep all subjects fully inside the canvas. No white or black background, checkerboard pattern, backdrop, border, outline or halo around the group.

Avoid:
Saturated electric blue, vivid orange skin, a uniform beige wash, chibi proportions, oversized heads, anime faces, geometric icon people, overly abstract limbs, typography, labels, signatures and logos.

Return only one vignette image.`

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
