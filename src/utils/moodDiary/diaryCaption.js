/** 海报底部日记体配文目标字数（约 90 字） */
export const DIARY_CAPTION_TARGET_LEN = 90

/**
 * 无云端接口时：根据参考图画面描述拼一段日记体短句（本地截断至约 90 字）。
 * @param {string} sceneDescription imageVisionCache / 图描述 API 返回
 * @param {{ moodLabel?: string, narrative?: string }} [opts]
 */
export function buildLocalDiaryCaptionFromVision(sceneDescription, opts = {}) {
  let scene = String(sceneDescription || '').trim()
  if (!scene) return ''

  scene = scene.replace(/^\[参考图[：:]\s*/, '').replace(/\]\s*$/, '').trim()
  scene = scene.replace(/\s+/g, ' ')

  const mood = String(opts.moodLabel || '').trim()
  let line = scene
  if (mood) {
    line = `今天心情${mood}，${scene}`
  }

  if (line.length > DIARY_CAPTION_TARGET_LEN) {
    line = line.slice(0, DIARY_CAPTION_TARGET_LEN - 1) + '…'
  }
  return line
}

/**
 * 规范化接口或本地结果，保证长度约 90 字内。
 */
export function normalizeDiaryCaptionLength(text, maxLen = DIARY_CAPTION_TARGET_LEN) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  if (s.length <= maxLen) return s
  return s.slice(0, maxLen - 1) + '…'
}
