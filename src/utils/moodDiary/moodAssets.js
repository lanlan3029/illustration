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
  { id: 'happy-grin', zh: '嘴角上扬', en: '嘴角上扬' },
  { id: 'big-grin', zh: '心花怒放', en: '心花怒放' },
  { id: 'laughing-tears', zh: '哭笑不得', en: '哭笑不得' },
  { id: 'cool', zh: '有点得意', en: '有点得意' },
  { id: 'neutral-smile', zh: '淡淡微笑', en: '淡淡微笑' },
  { id: 'worried', zh: '心事重重', en: '心事重重' },
  { id: 'sad', zh: '委屈巴巴', en: '委屈巴巴' },
  { id: 'frustrated', zh: '有点挫败', en: '有点挫败' },
  { id: 'angry', zh: '火冒三丈', en: '火冒三丈' },
  { id: 'cold', zh: '脑袋发懵', en: '脑袋发懵' },
  { id: 'sick', zh: '有点难受', en: '有点难受' },
  { id: 'surprised', zh: '无比震惊', en: '无比震惊' },
  { id: 'dizzy', zh: '晕头转向', en: '晕头转向' },
  { id: 'sobbing', zh: '泣不成声', en: '泣不成声' },
  { id: 'star-eyes', zh: '有点兴奋', en: '有点兴奋' },
  { id: 'disappointed', zh: '有些失望', en: '有些失望' },
  { id: 'blushing-smile', zh: '有点害羞', en: '有点害羞' },
  { id: 'heart-eyes', zh: '有点喜欢', en: '有点喜欢' },
  { id: 'kissing', zh: '美滋滋', en: '美滋滋' },
  { id: 'wink', zh: '小坏心思', en: '小坏心思' },
  { id: 'tongue-out', zh: '有点调皮', en: '有点调皮' },
  { id: 'pouting', zh: '略有不服', en: '略有不服' },
  { id: 'annoyed', zh: '有点烦躁', en: '有点烦躁' },
  { id: 'thumbs-up', zh: '挺满意', en: '挺满意' },
  { id: 'frowning', zh: '略感无奈', en: '略感无奈' },
  { id: 'angel', zh: '不关我事', en: '不关我事' },
  { id: 'devil', zh: '有点任性', en: '有点任性' },
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
