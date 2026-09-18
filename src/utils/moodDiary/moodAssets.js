import {
  getMoodAssetsManifest,
  getPickerExcludedIds,
  pngAssetPath,
} from './moodAssetsApi'

/**
 * 心情选项元数据（文案；图片 URL 由 moodAssetsApi 提供）。
 * 与服务端 manifest items[].id 对齐。
 */
export const moodOptionDefs = [
  { id: 'happy-grin', zh: '开心', en: 'Happy' },
  { id: 'big-grin', zh: '兴奋', en: 'Excited' },
  { id: 'laughing-tears', zh: '无奈', en: 'Helpless' },
  { id: 'cool', zh: '满足', en: 'Satisfied' },
  { id: 'neutral-smile', zh: '愉快', en: 'Pleasant' },
  { id: 'worried', zh: '焦虑', en: 'Anxious' },
  { id: 'sad', zh: '委屈', en: 'Hurt' },
  { id: 'frustrated', zh: '沮丧', en: 'Frustrated' },
  { id: 'angry', zh: '愤怒', en: 'Angry' },
  { id: 'cold', zh: '迷茫', en: 'Lost' },
  { id: 'sick', zh: '难过', en: 'Sad' },
  { id: 'surprised', zh: '尴尬', en: 'Awkward' },
  { id: 'dizzy', zh: '紧张', en: 'Nervous' },
  { id: 'sobbing', zh: '伤心', en: 'Grief' },
  { id: 'star-eyes', zh: '兴奋', en: 'Excited' },
  { id: 'disappointed', zh: '失望', en: 'Disappointed' },
  { id: 'blushing-smile', zh: '幸福', en: 'Blissful' },
  { id: 'heart-eyes', zh: '喜欢', en: 'Fond' },
  { id: 'kissing', zh: '被爱', en: 'Loved' },
  { id: 'wink', zh: '期待', en: 'Eager' },
  { id: 'tongue-out', zh: '轻松', en: 'Relaxed' },
  { id: 'pouting', zh: '不满', en: 'Unhappy' },
  { id: 'annoyed', zh: '烦躁', en: 'Irritated' },
  { id: 'thumbs-up', zh: '满意', en: 'Pleased' },
  { id: 'frowning', zh: '厌倦', en: 'Weary' },
  { id: 'angel', zh: '平静', en: 'Calm' },
  { id: 'devil', zh: '任性', en: 'Willful' },
]

/** 快捷首页 5 档 */
export const quickMoodIds = ['big-grin', 'neutral-smile', 'worried', 'sad', 'angry']

function labelFor(def, isZh, remoteItem) {
  if (isZh && remoteItem?.label) return remoteItem.label
  return isZh ? def.zh : def.en
}

export function resolveMoodList(isZh) {
  const manifest = getMoodAssetsManifest()
  const remoteItems = Array.isArray(manifest?.items) ? manifest.items : null
  const remoteById = remoteItems
    ? Object.fromEntries(remoteItems.map((item) => [item.id, item]))
    : null

  const defs = moodOptionDefs.filter((def) => {
    if (!remoteById) return true
    const remote = remoteById[def.id]
    if (!remote) return false
    if (remote.available === false) return false
    return true
  })

  return defs.map((def) => ({
    id: def.id,
    label: labelFor(def, isZh, remoteById?.[def.id]),
    src: pngAssetPath(def.id),
  }))
}

export function findMoodById(id, isZh) {
  if (!id) return null
  return resolveMoodList(isZh).find((m) => m.id === id) || null
}

export function findMoodByLabel(label, isZh) {
  const text = String(label || '').trim()
  if (!text) return null
  return resolveMoodList(isZh).find((m) => m.label === text) || null
}

/** 从已保存记录解析心情 emoji id（id 优先，其次 moodLabel） */
export function resolveRecordMoodId(record, isZh) {
  if (!record) return null
  const id = record.moodEmojiId || record.mood
  if (id) return id
  return findMoodByLabel(record.moodLabel, isZh)?.id || null
}

export { getPickerExcludedIds, pngAssetPath }
export { ILLUSTRATION_STYLE_CONFIGS as popularStyleConfigs } from '@/data/illustrationStyleConfigs'
