/** 幸福童年时刻收集 — 活动页常量 */

export const STORAGE_KEY = 'childhood_moment_image'
export const MY_PICTURE_ID_KEY = 'childhood_my_picture_id'
export const SHARE_STORY_KEY = 'childhood_share_story'
export const SHARE_POSTER_URL_KEY = 'childhood_share_poster_url'

const SHARE_TITLE_MAX = 28

/** 生图背景色（抠图用） */
export const CHILDHOOD_MATTING_BG = { r: 255, g: 43, b: 214, hex: '#FF2BD6' }

export const CHILDHOOD_STYLE_PROMPT = `Draw the Scene as ONE charming, flat 2D cartoon vignette for a collection of childhood memories. Every vignette must look drawn by the same illustrator for the same cheerful family picture book.

Character design — rounded and distinctly cartoon:
Use compact, softly rounded bodies, slightly large round heads, short simple limbs and gentle, playful poses. Adults are about 4–5 heads tall; young children about 2.5–3 heads tall. Give each face tiny dark dot eyes, a small curved smile, a minimal nose mark and optional soft peach cheeks. Show affection through these simple expressions and body language. Hair is a solid warm dark-brown shape with a few rounded waves or curls, never individual strands. Hands are small rounded cartoon shapes with very few finger marks; shoes are simple rounded shapes.

Linework and flat fills:
Use delicate warm-brown hand-drawn contour lines around people, clothing and important objects, with slightly organic curves and rounded joins. Keep the line weight thin and consistent, never a heavy black comic outline. Fill each shape with one clean, opaque, uniform color. Use only a few simple interior lines for clothing, bowls, windows and furniture. Clothing may have a sparse check or dot pattern where appropriate, drawn as simple flat marks. Do not model volume with tonal shading. Draw food as a few colorful symbolic shapes, not realistic ingredients.

Consistent family-cartoon palette:
Warm dark-brown hair and outlines #653D2D, soft peach skin #F2BA87, creamy white #FFF9E9, pastel lavender #C3A0CF, mint/seafoam #91BFA9, cheerful soft cornflower blue #779CD6, mellow yellow #F3CC72, warm peach ground #F5C99D, olive green #859746 and occasional soft pink #E9ADB5. Favor lavender, mint, cream and yellow for clothing; use blue and olive for vehicles and props. Keep colors distinct, clean and gently cheerful, not smoky, gray-brown, monochrome beige or realistic skin rendering. Avoid neon colors in the subject.

Scene construction:
Follow only the people, actions and objects in the supplied Scene. Show the complete group in one small isolated composition, with generous empty space around it. Props are cute simplified cartoon shapes: softly rounded tables, chairs, bowls, beds, cars or houses. Use a shallow, simple view with minimal perspective and a small peach-colored oval or irregular ground patch. Keep architecture symbolic and small, not a detailed room or architectural cutaway. Use a few lines at most to suggest a floor, never a detailed brick grid. If the Scene calls for a sun or moon, use a tiny flat yellow/orange symbol.

Strict style exclusions:
No realistic or semi-realistic people; no tall slender fashion figures; no blank faceless editorial figures; no anatomical detail, realistic hands, individual hair strands, fabric rendering, complex clothing folds, realistic food, wood grain, brick textures, watercolor washes, paper grain, gradients, dimensional shading, cast shadows, dramatic lighting, 3D or photographic detail. No typography, labels, logos, frame, sticker border or white halo.

Removable background — technical requirement:
Use exactly solid ${CHILDHOOD_MATTING_BG.hex} as the entire background, including EVERY enclosed opening between arms and torsos, between legs, under tables, between chair rails, and between overlapping objects. No background shadows, glow or background color variation. This key color is reserved ONLY for background: never use magenta, fuchsia, hot pink or a purple-pink shade close to it in clothes, skin, props or outline strokes. Pastel lavender and soft dusty pink must stay pale and clearly different from the saturated key. The application removes this color to produce a genuinely transparent PNG.

Return only the single cartoon vignette image.`

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

/** 用一个问题邀请朋友留下自己的回忆。 */
export function buildShareDesc() {
  return '这让你想起了什么？留下一段回忆，画成你的童年。'
}

export function buildShareLink(pictureId, baseHref) {
  try {
    const origin = typeof window !== 'undefined' && /(^|\.)kidstory\.cc$/.test(window.location.hostname)
      ? window.location.origin : 'https://www.kidstory.cc'
    const url = new URL('/childhood', baseHref || origin)
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
