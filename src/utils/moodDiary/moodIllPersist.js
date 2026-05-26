/**
 * 心情日记 ↔ 云端 /ill/ 字段约定（type === 'mood'）
 *
 * - description     用户正文
 * - mood_emoji_id   心情 id（如 big-grin）；展示文案由前端 moodAssets 反查
 * - tags            兜底：后端尚未支持 mood_emoji_id 时写入 ["mood:big-grin"]
 */

const MOOD_TAG_PREFIX = 'mood:'

/** @param {object} draft */
export function buildMoodIllPersistFields(draft) {
  const moodEmojiId = String(draft?.moodEmojiId || draft?.mood || '').trim()
  const description = String(draft?.narrative || '').trim()

  return {
    mood_emoji_id: moodEmojiId,
    description,
    tags: moodEmojiId ? [`${MOOD_TAG_PREFIX}${moodEmojiId}`] : []
  }
}

function parseMoodIdFromTags(tags) {
  if (!Array.isArray(tags)) return null
  for (const raw of tags) {
    const t = String(raw || '').trim()
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
