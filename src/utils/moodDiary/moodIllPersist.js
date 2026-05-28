/**
 * 心情日记 ↔ 云端 /ill/ 字段约定（type === 'mood'）
 *
 * - description     用户正文
 * - diary_caption   AI 情绪概括（非 scene_description）
 * - mood_emoji_id   心情 id（如 big-grin）；展示文案由前端 moodAssets 反查
 * - tags            兜底：["mood:big-grin"]（FormData 逐条 append，勿 JSON.stringify 整数组）
 */

const MOOD_TAG_PREFIX = 'mood:'

/** @param {object} draft */
export function buildMoodIllPersistFields(draft) {
  const moodEmojiId = String(draft?.moodEmojiId || draft?.mood || '').trim()
  const description = String(draft?.narrative || '').trim()
  const diaryCaption = String(draft?.diaryCaption || draft?.quotaSentence || '').trim()

  return {
    mood_emoji_id: moodEmojiId,
    description,
    diary_caption: diaryCaption,
    tags: moodEmojiId ? [`${MOOD_TAG_PREFIX}${moodEmojiId}`] : []
  }
}

/** 兼容 tags 被存成 ["mood:x"] 或 ["[\"mood:x\"]"] 等形态 */
export function normalizeIllTags(tags) {
  if (tags == null) return []
  if (typeof tags === 'string') {
    const trimmed = tags.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
      try {
        return normalizeIllTags(JSON.parse(trimmed))
      } catch (_) {
        return [trimmed]
      }
    }
    return [trimmed]
  }
  if (!Array.isArray(tags)) return []

  const out = []
  for (const raw of tags) {
    const t = String(raw ?? '').trim()
    if (!t) continue
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t)
        if (Array.isArray(parsed)) {
          out.push(...normalizeIllTags(parsed))
          continue
        }
      } catch (_) {
        /* use raw string below */
      }
    }
    out.push(t)
  }
  return out
}

export function parseMoodIdFromTags(tags) {
  for (const t of normalizeIllTags(tags)) {
    if (t.startsWith(MOOD_TAG_PREFIX)) {
      const id = t.slice(MOOD_TAG_PREFIX.length).trim()
      if (id) return id
    }
  }
  return null
}

/** 从 /ill/ 条目解析心情日记字段 */
export function parseMoodFromIllItem(item) {
  if (!item || typeof item !== 'object') {
    return { moodEmojiId: null, narrative: '', diaryCaption: '' }
  }

  const moodEmojiId =
    String(item.mood_emoji_id || item.moodEmojiId || item.mood || '').trim() ||
    parseMoodIdFromTags(item.tags) ||
    null

  const narrative = String(item.description || item.narrative || '').trim()
  const diaryCaption = String(item.diary_caption || item.diaryCaption || '').trim()

  return { moodEmojiId, narrative, diaryCaption }
}
