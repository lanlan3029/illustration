const moodImageContext = require.context('@/assets/images/mood', false, /\.webp$/)

export const moodOptionDefs = [
  { id: 'happy-grin', file: 'happy-grin.webp', zh: '开心', en: 'Happy' },
  { id: 'big-grin', file: 'big-grin.webp', zh: '大笑', en: 'Big grin' },
  { id: 'laughing-tears', file: 'laughing-tears.webp', zh: '笑哭', en: 'Laughing tears' },
  { id: 'cool', file: 'cool.webp', zh: '自信', en: 'Cool' },
  { id: 'neutral-smile', file: 'neutral-smile.webp', zh: '平静', en: 'Neutral' },
  { id: 'worried', file: 'worried.webp', zh: '担心', en: 'Worried' },
  { id: 'sad', file: 'sad.webp', zh: '难过', en: 'Sad' },
  { id: 'frustrated', file: 'frustrated.webp', zh: '烦躁', en: 'Frustrated' },
  { id: 'angry', file: 'angry.webp', zh: '生气', en: 'Angry' },
  { id: 'cold', file: 'cold.webp', zh: '疲惫', en: 'Tired' },
  { id: 'sick', file: 'sick.webp', zh: '不舒服', en: 'Unwell' },
  { id: 'surprised', file: 'surprised.webp', zh: '惊讶', en: 'Surprised' }
]

/** 快捷首页 5 档 */
export const quickMoodIds = ['big-grin', 'neutral-smile', 'worried', 'sad', 'angry']

export function resolveMoodList(isZh) {
  return moodOptionDefs.map((item) => ({
    id: item.id,
    label: isZh ? item.zh : item.en,
    src: moodImageContext(`./${item.file}`)
  }))
}

export function findMoodById(id, isZh) {
  if (!id) return null
  return resolveMoodList(isZh).find((m) => m.id === id) || null
}

export { ILLUSTRATION_STYLE_CONFIGS as popularStyleConfigs } from '@/data/illustrationStyleConfigs'
