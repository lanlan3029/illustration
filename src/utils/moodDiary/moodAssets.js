const moodImageContext = require.context('@/assets/images/mood', false, /\.webp$/)

export const moodOptionDefs = [
  { id: 'happy-grin', file: 'happy-grin.webp', zh: '嘴角上扬', en: '嘴角上扬' },
  { id: 'big-grin', file: 'big-grin.webp', zh: '心花怒放', en: '心花怒放' },
  { id: 'laughing-tears', file: 'laughing-tears.webp', zh: '哭笑不得', en: '哭笑不得' },
  { id: 'cool', file: 'cool.webp', zh: '有点得意', en: '有点得意' },
  { id: 'neutral-smile', file: 'neutral-smile.webp', zh: '淡淡微笑', en: '淡淡微笑' },
  { id: 'worried', file: 'worried.webp', zh: '心事重重', en: '心事重重' },
  { id: 'sad', file: 'sad.webp', zh: '委屈巴巴', en: '委屈巴巴' },
  { id: 'frustrated', file: 'frustrated.webp', zh: '有点挫败', en: '有点挫败' },
  { id: 'angry', file: 'angry.webp', zh: '火冒三丈', en: '火冒三丈' },
  { id: 'cold', file: 'cold.webp', zh: '脑袋发懵', en: '脑袋发懵' },
  { id: 'sick', file: 'sick.webp', zh: '有点难受', en: '有点难受' },
  { id: 'surprised', file: 'surprised.webp', zh: '无比震惊', en: '无比震惊' },
  { id: 'dizzy', file: 'dizzy.webp', zh: '晕头转向', en: '晕头转向' },
  { id: 'heart', file: 'heart.webp', zh: '犯花痴', en: '犯花痴' },
  { id: 'sobbing', file: 'sobbing.webp', zh: '泣不成声', en: '泣不成声' },
  { id: 'star-eyes', file: 'star-eyes.webp', zh: '有点兴奋', en: '有点兴奋' },
  { id: 'disappointed', file: 'disappointed.webp', zh: '有些失望', en: '有些失望' },
  { id: 'blushing-smile', file: 'blushing-smile.webp', zh: '有点害羞', en: '有点害羞' },
  { id: 'heart-eyes', file: 'heart-eyes.webp', zh: '有点喜欢', en: '有点喜欢' },
  { id: 'kissing', file: 'kissing.webp', zh: '美滋滋', en: '美滋滋' },
  { id: 'wink', file: 'wink.webp', zh: '小坏心思', en: '小坏心思' },
  { id: 'tongue-out', file: 'tongue-out.webp', zh: '有点调皮', en: '有点调皮' },
  { id: 'pouting', file: 'pouting.webp', zh: '略有不服', en: '略有不服' },
  { id: 'annoyed', file: 'annoyed.webp', zh: '有点烦躁', en: '有点烦躁' },
  { id: 'thumbs-up', file: 'thumbs-up.webp', zh: '挺满意', en: '挺满意' },
  { id: 'frowning', file: 'frowning.webp', zh: '略感无奈', en: '略感无奈' },
  { id: 'angel', file: 'angel.webp', zh: '不关我事', en: '不关我事' },
  { id: 'devil', file: 'devil.webp', zh: '有点任性', en: '有点任性' }
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
