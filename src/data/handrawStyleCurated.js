const HANDRAW_PREVIEW_CDN = 'https://static.kidstory.cc'

/**
 * 精选 handraw-style 编号 → KidStory AI 插画
 * 上游：https://github.com/yang0/handraw-style
 *
 * - element_details_* 写入后端（隐藏底词，生成时前置）
 * - 默认不传参考图（requiresReference: false），减轻带宽与上游成本
 * - 预览图：运维放置 public/prompt/{id}.webp 或从 handraw 画廊导出后上传 CDN
 */

/** 新风格占用 id 37–48，与 illustrationStyleConfigs 一致 */
export const HANDRAW_STYLE_ID_START = 37

export const HANDRAW_CURATED_STYLES = [
  {
    handrawNo: '018',
    id: 37,
    key: 'handraw018MinimalDeadpan',
    category: 'flat',
    art_style_zh: 'Handraw #018 · 极简冷幽默条漫',
    art_style_en: 'Handraw #018 · Minimal Deadpan Dialogue Cartoon',
    requiresReference: false,
    prependBaseOnGenerate: true,
    preferredSize: '1024x1024',
    element_details_en: `Style #018 · Minimal Deadpan Dialogue Cartoon.
Flat editorial cartoon, deadpan humor, sparse panels feeling in a single vignette.
Bold dark brown outlines, large flat color blocks, minimal dot eyes, tiny mouths.
Muted retro pastels, cream paper mood. No gradients, no 3D, no cute chibi big-head style.
Simple readable silhouettes, awkward calm poses, magazine editorial tone.`,
  },
  {
    handrawNo: '041',
    id: 38,
    key: 'handraw041CozyFlatLife',
    category: 'flat',
    art_style_zh: 'Handraw #041 · 治愈扁平生活',
    art_style_en: 'Handraw #041 · Cozy Flat Lifestyle',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #041 · Cozy flat lifestyle illustration.
Sophisticated flat hand-drawn editorial art for children's magazine.
Simple organic shapes, soft muted pastels (dusty pink, sage, dusty blue, cream).
Bold contour lines, minimal facial features, elongated relaxed figures.
Warm friendly atmosphere, not kawaii, not Disney. Flat fills only, no texture or shadows.`,
  },
  {
    handrawNo: '052',
    id: 39,
    key: 'handraw052BoldContour',
    category: 'marker',
    art_style_zh: 'Handraw #052 · 粗线轮廓叙事',
    art_style_en: 'Handraw #052 · Bold Contour Narrative',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #052 · Bold contour narrative illustration.
Thick hand-drawn outlines, poster-like flat colors, confident organic silhouettes.
Minimal face detail (dots only), emotion from body language.
Limited palette with one accent color. No gradients, no photorealism, no thin delicate linework.`,
  },
  {
    handrawNo: '088',
    id: 40,
    key: 'handraw088EditorialFlat',
    category: 'flat',
    art_style_zh: 'Handraw #088 · 杂志扁平 editorial',
    art_style_en: 'Handraw #088 · Editorial Flat Scene',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #088 · Editorial flat scene illustration.
Contemporary picture-book editorial: flat color blocks, slightly wobbly ink edges.
Muted lavender, olive, coral, mustard accents on cream atmosphere.
Reduce background to essential props; generous negative space.
No glossy effects, no complex perspective, no detailed fabric folds.`,
  },
  {
    handrawNo: '124',
    id: 41,
    key: 'handraw124NaiveFolk',
    category: 'other',
    art_style_zh: 'Handraw #124 · 稚拙民俗 editorial',
    art_style_en: 'Handraw #124 · Naive Folk Editorial',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #124 · Naive folk editorial illustration.
Hand-drawn naive shapes, folk art simplicity with modern editorial layout.
Flat earthy pastels, dark brown linework, charming imperfection.
Simplified people and objects, no realistic rendering, no 3D.`,
  },
  {
    handrawNo: '156',
    id: 42,
    key: 'handraw156MutedPastel',
    category: 'pastel',
    art_style_zh: 'Handraw #156 · 复古粉彩场景',
    art_style_en: 'Handraw #156 · Retro Muted Pastel Scene',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #156 · Retro muted pastel scene.
Soft chalk-like flat fills, gentle hand-drawn outlines, nostalgic warmth.
Simplified scenery, calm daily-life moment, magazine illustration sophistication.
No neon, no anime eyes, no high detail faces.`,
  },
  {
    handrawNo: '193',
    id: 43,
    key: 'handraw193NightBanquet',
    category: 'ink',
    art_style_zh: 'Handraw #193 · 夜宴叙事插画',
    art_style_en: 'Handraw #193 · Night Banquet Narrative',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #193 · Night banquet narrative illustration.
Flat decorative storytelling, stylized figures in festive scene.
Rich flat colors with controlled contrast, bold outlines, ceremonial rhythm.
Simplified faces, elegant poses, editorial historical fantasy tone—not photoreal.`,
  },
  {
    handrawNo: '210',
    id: 44,
    key: 'handraw210WinterMemory',
    category: 'sketch',
    art_style_zh: 'Handraw #210 · 冬日记忆速写',
    art_style_en: 'Handraw #210 · Winter Memory Sketch',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #210 · Winter memory sketch illustration.
Loose hand-drawn lines with flat color accents, snowy calm atmosphere.
Childhood memory feeling, simple figures, minimal facial marks.
Off-white and cold blue pastels, warm small accent (orange/red). No realistic snow texture.`,
  },
  {
    handrawNo: '241',
    id: 45,
    key: 'handraw241MagazineSpot',
    category: 'collage',
    art_style_zh: 'Handraw #241 · 杂志 spot 插图',
    art_style_en: 'Handraw #241 · Magazine Spot Illustration',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #241 · Magazine spot illustration.
Single clear focal scene, editorial spot art for article.
Flat shapes, strong silhouette, limited detail, playful composition.
Works at small size; avoid clutter and micro-textures.`,
  },
  {
    handrawNo: '267',
    id: 46,
    key: 'handraw267LiteraryQuote',
    category: 'other',
    art_style_zh: 'Handraw #267 · 文学金句配图',
    art_style_en: 'Handraw #267 · Literary Quote Illustration',
    requiresReference: false,
    prependBaseOnGenerate: true,
    preferredSize: '768x1024',
    element_details_en: `Style #267 · Literary quote illustration mode (image-only output).
Poetic metaphor scene, quiet emotional tone, editorial rather than cartoon.
Flat hand-drawn style, soft palette, one symbolic vignette matching the mood.
Do not render long text inside the image unless user explicitly asks for text-in-image mode.`,
  },
  {
    handrawNo: '268',
    id: 47,
    key: 'handraw268LiteratiInk',
    category: 'ink',
    art_style_zh: 'Handraw #268 · 当代人文水墨漫画',
    art_style_en: 'Handraw #268 · Contemporary Literati Ink Cartoon',
    requiresReference: false,
    prependBaseOnGenerate: true,
    preferredSize: '768x1024',
    element_details_en: `Style #268 · Contemporary literati ink cartoon.
Warm paper white, large留白, relaxed brush-and-ink lines with flat color spots.
Summarized figures, slightly clumsy proportions, mood from gesture.
Ink black lines with small vermillion/ochre/sage accents; humble, leisurely, human.`,
  },
  {
    handrawNo: '276',
    id: 48,
    key: 'handraw276FutureEditorial',
    category: 'digital',
    art_style_zh: 'Handraw #276 · 未来感 editorial 扁平',
    art_style_en: 'Handraw #276 · Future Editorial Flat',
    requiresReference: false,
    prependBaseOnGenerate: true,
    element_details_en: `Style #276 · Future editorial flat illustration.
Modern conceptual scene with hand-drawn flat shapes and bold outlines.
Muted tech-life palette, friendly not cyberpunk dark, readable metaphor objects.
Minimal detail, no photoreal UI, no 3D renders.`,
  },
]

/** handraw 主题色（可选后缀，对应 COLORS.md C-01–C-36） */
export const HANDRAW_COLOR_SNIPPETS = {
  'C-01': 'Dominant color: International Klein Blue flat fills and accents.',
  'C-26': 'Dominant color: Persimmon orange warm accent on cream ground.',
  'C-03': 'Accent: Prussian blue small highlights.',
  'C-12': 'Dominant color: Sage green calm atmosphere.',
  'C-18': 'Dominant color: Dusty pink soft mood.',
}

/**
 * @param {HandrawStyleImportItem} item
 * @param {{ colorCode?: string, layoutCode?: string, pureImage?: boolean }} [extras]
 */
export function buildHandrawBasePrompt(item, extras = {}) {
  const parts = [String(item.element_details_en || '').trim()]
  if (extras.colorCode && HANDRAW_COLOR_SNIPPETS[extras.colorCode]) {
    parts.push(HANDRAW_COLOR_SNIPPETS[extras.colorCode])
  }
  if (extras.layoutCode) {
    parts.push(
      `Layout reference (composition only): ${extras.layoutCode} from handraw layout gallery; keep single-image vignette unless user asks for multi-panel.`
    )
  }
  if (extras.pureImage !== false) {
    parts.push('Pure illustration mode: no text in image unless user theme requires visible words.')
  }
  return parts.filter(Boolean).join('\n\n')
}

/** POST /api/admin/illustration-styles/import/ 的 items */
export function buildHandrawImportItems() {
  return HANDRAW_CURATED_STYLES.map((item) => ({
    id: item.id,
    key: item.key,
    category: item.category,
    art_style_zh: item.art_style_zh,
    art_style_en: item.art_style_en,
    element_details_zh: buildHandrawBasePrompt(item),
    element_details_en: buildHandrawBasePrompt(item),
    image_path: `prompt/${item.id}.webp`,
    sort_order: item.id,
    is_enabled: true,
  }))
}

/** 与 ILLUSTRATION_STYLE_CONFIGS 合并的本地条目 */
export function buildHandrawIllustrationStyleConfigs() {
  return HANDRAW_CURATED_STYLES.map((item) => ({
    key: item.key,
    id: item.id,
    image: `${HANDRAW_PREVIEW_CDN}/prompt/${item.id}.webp`,
    category: item.category,
    prependBaseOnGenerate: true,
    preferredSize: item.preferredSize || '1024x1024',
    requiresReference: Boolean(item.requiresReference),
    basePrompt: buildHandrawBasePrompt(item),
    artStyleLabel: item.art_style_zh,
    handrawNo: item.handrawNo,
  }))
}

export function isHandrawIllustrationStyle(style) {
  if (!style) return false
  const key = String(style.key || '').toLowerCase()
  if (key.startsWith('handraw')) return true
  const id = Number(style.id)
  return id >= HANDRAW_STYLE_ID_START && id < HANDRAW_STYLE_ID_START + HANDRAW_CURATED_STYLES.length
}
