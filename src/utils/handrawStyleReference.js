export const HANDRAW_STYLE_REFERENCE_AUTO_KEY = 'aiPicture.handrawStyleReferenceAuto'

export const HANDRAW_REFERENCE_ISOLATION_ZH =
  '所附图片仅用于参考画风。只提取参考图的风格特征，例如线条、笔触、媒介、材质、色彩倾向和整体视觉语言；'
  + '不要使用、复制或延续参考图中的任何主体、人物、动物、服装、道具、动作、姿态、场景、背景、构图、布局、文字或故事。'
  + '最终画面内容完全以用户提供的主题为准。'

export const HANDRAW_REFERENCE_ISOLATION_EN =
  'Use the attached image only as a style reference. Extract only its stylistic qualities, such as linework, brushwork, medium, '
  + 'material texture, color tendencies, and overall visual language. Do not use, copy, or carry over any subject, person, animal, '
  + 'clothing, prop, action, pose, setting, background, composition, layout, text, or story from the reference image. '
  + "The user's written theme is the sole source for the image content."

export function handrawReferenceIsolationPrompt(locale) {
  return locale === 'en' ? HANDRAW_REFERENCE_ISOLATION_EN : HANDRAW_REFERENCE_ISOLATION_ZH
}

export function appendHandrawReferenceIsolation(prompt, locale = 'zh') {
  const block = handrawReferenceIsolationPrompt(locale)
  const p = String(prompt || '').trim()
  if (!p) return block
  const marker = block.slice(0, 20)
  if (marker && p.includes(marker)) return p
  return `${p}\n\n${block}`
}

export function readHandrawStyleReferenceAutoPreference() {
  try {
    const raw = localStorage.getItem(HANDRAW_STYLE_REFERENCE_AUTO_KEY)
    if (raw === '0' || raw === 'false') return false
  } catch {
    /* ignore */
  }
  return true
}

export function writeHandrawStyleReferenceAutoPreference(enabled) {
  try {
    localStorage.setItem(HANDRAW_STYLE_REFERENCE_AUTO_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}
