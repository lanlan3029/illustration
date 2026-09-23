/** 幸福童年时刻收集 — 活动页常量 */

export const STORAGE_KEY = 'childhood_moment_image'

/** 生图背景色（抠图用） */
export const CHILDHOOD_MATTING_BG = { r: 255, g: 43, b: 214, hex: '#FF2BD6' }

export const CHILDHOOD_STYLE_PROMPT = `One isolated lifestyle vignette, not a repeating pattern, not a sticker sheet.

Style lock:
Thin slightly wobbly dark outlines, flat pastel fills, naive lifestyle illustration.
Medium body proportions, round heads, tiny dot eyes, small simple mouths, blunt rounded hands and feet.
Hair as solid brown/black shapes, no individual strands.
Clothes: white tee, lavender pants, blue jeans, gingham shirt; peach skin.
A little hand-drawn jitter, not CAD-smooth, not scribbly.
NO outer contour / die-cut / white halo around the whole group.
Each shape sits DIRECTLY on a flat solid #FF2BD6 magenta background, generous empty margin.

People:
Children must be both boys and girls across a series — not the same short-haired boy every time.
Girls: bob, pigtails, clip, or dress. Boys: short hair.
Do not reuse one face with different clothes.

Logic:
People stand on land/floor. Trees and flowers grow from soil. Water is only water.
Do not put a train on a beach, a tree in the sea, or mix mismatched scales.
A vehicle or building can be drawn alone and large, without tiny foreground people.

Palette:
Skin #F7D2C4, line #2B2B2B, lavender #C9B6E8, denim #6B8FDB, grass #7CB342, mint/fog-blue props.

Negative:
no orange faceless silhouettes, no geometric icon people, no chubby or fashion-slim bodies,
no photorealism, no 3D, no gradients, no drop shadows, no signature, no brand logos,
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
