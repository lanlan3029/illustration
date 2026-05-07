const moodImageContext = require.context('@/assets/images/mood', false, /\.webp$/)

export const moodOptionDefs = [
  { id: 'happy-grin', file: 'happy-grin.webp', zh: '嘴角上扬', en: '嘴角上扬' },
  { id: 'big-grin', file: 'big-grin.webp', zh: '喜笑颜开', en: '喜笑颜开' },
  { id: 'laughing-tears', file: 'laughing-tears.webp', zh: '笑出鹅叫', en: '笑出鹅叫' },
  { id: 'cool', file: 'cool.webp', zh: '高冷如我', en: '高冷如我' },
  { id: 'neutral-smile', file: 'neutral-smile.webp', zh: '礼貌微笑', en: '礼貌微笑' },
  { id: 'worried', file: 'worried.webp', zh: '眉头一紧', en: '眉头一紧' },
  { id: 'sad', file: 'sad.webp', zh: '委屈巴巴', en: '委屈巴巴' },
  { id: 'frustrated', file: 'frustrated.webp', zh: '心态崩了', en: '心态崩了' },
  { id: 'angry', file: 'angry.webp', zh: '火冒三丈', en: '火冒三丈' },
  { id: 'cold', file: 'cold.webp', zh: '脑壳昏昏', en: '脑壳昏昏' },
  { id: 'sick', file: 'sick.webp', zh: '弱不禁风', en: '弱不禁风' },
  { id: 'surprised', file: 'surprised.webp', zh: '瞳孔地震', en: '瞳孔地震' },
  { id: 'dizzy', file: 'dizzy.webp', zh: '压力山大', en: '压力山大' },
  { id: 'heart', file: 'heart.webp', zh: '爱意泛滥', en: '爱意泛滥' },
  { id: 'sobbing', file: 'sobbing.webp', zh: '泣不成声', en: '泣不成声' },
  { id: 'star-eyes', file: 'star-eyes.webp', zh: '满眼是你', en: '满眼是你' },
  { id: 'disappointed', file: 'disappointed.webp', zh: '终究错付', en: '终究错付' },
  { id: 'blushing-smile', file: 'blushing-smile.webp', zh: '全场最乖', en: '全场最乖' },
  { id: 'heart-eyes', file: 'heart-eyes.webp', zh: '疯狂心动', en: '疯狂心动' },
  { id: 'kissing', file: 'kissing.webp', zh: '隔空亲亲', en: '隔空亲亲' },
  { id: 'wink', file: 'wink.webp', zh: '小坏心思', en: '小坏心思' },
  { id: 'tongue-out', file: 'tongue-out.webp', zh: '略略略略', en: '略略略略' },
  { id: 'pouting', file: 'pouting.webp', zh: '小嘴一撇', en: '小嘴一撇' },
  { id: 'annoyed', file: 'annoyed.webp', zh: '拽得要死', en: '拽得要死' },
  { id: 'thumbs-up', file: 'thumbs-up.webp', zh: '狠狠点赞', en: '狠狠点赞' },
  { id: 'frowning', file: 'frowning.webp', zh: '栓 Q 谢了', en: '栓 Q 谢了' },
  { id: 'angel', file: 'angel.webp', zh: '眼里有光', en: '眼里有光' },
  { id: 'devil', file: 'devil.webp', zh: '拿捏住了', en: '拿捏住了' }
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
