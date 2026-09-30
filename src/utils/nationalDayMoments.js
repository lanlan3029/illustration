/** 国庆感受收集 — 预置插画与生图文案 */

export const NATIONAL_DAY_PICTURE_TYPE = 'national-day'

export const STORAGE_KEY = 'national_day_moment_image'
export const MY_PICTURE_ID_KEY = 'national_day_my_picture_id'
export const SHARE_STORY_KEY = 'national_day_share_story'

const SHARE_TITLE_MAX = 28

export const NATIONAL_DAY_SEEDS = [
  {
    id: 'nd-seed-01',
    title: '还没放假已经怕开工',
    content: '虽然还没放假但是已经恐惧开工了，一想到国庆假期回来又要重新适应上班好痛苦',
    image: require('@/assets/national-day/01-dread-back-to-work.jpg'),
  },
  {
    id: 'nd-seed-02',
    title: '两年没联系别喊我',
    content: '马上快国庆了，郑重声明一下：超过两年未联系的不管是同学还是朋友，结婚都不要喊我，感情一般没什么交集的更是想都别想。',
    image: require('@/assets/national-day/02-wedding-distance.jpg'),
  },
  {
    id: 'nd-seed-03',
    title: '幸福在于对比',
    content: '国庆长假一开始，我明白了一个道理：幸福在于对比，比如你觉得长假只能在家无聊，那你想想还有加班的呢，你觉得堵在高速上很闹心，那你想想还有加班的呢，你觉得在家被父母亲友奚落很伤心，那你想想还有加班的呢，你觉得吃吃喝喝七天会胖，那你想想还有加班的呢，反正我一想还有加班的人，我只要不上班就十分满足了。',
    image: require('@/assets/national-day/03-compare-overtime.jpg'),
  },
  {
    id: 'nd-seed-04',
    title: '躺家吹空调',
    content: '国庆节最舒服最快乐的度假方式果然就是躺在家里吹空调玩手机。',
    image: require('@/assets/national-day/04-home-ac-phone.jpg'),
  },
  {
    id: 'nd-seed-05',
    title: '距离假期只剩一天',
    content: '听过周杰伦的《晴天》听过莫文蔚的《阴天》听过林俊杰的《明天》听过李玖哲的《夏天》但我最喜欢的还是《距离国庆假期只剩1天》',
    image: require('@/assets/national-day/05-one-day-left.jpg'),
  },
]

export const NATIONAL_DAY_STYLE_PROMPT = `Draw the Scene as ONE quiet lifestyle editorial illustration, matching a single illustrator across a National Day feelings collection.

Composition:
One wide everyday scene with generous cream empty space. Show the feeling through a small number of people, furniture and objects. Keep the view flat and simple, like a magazine vignette, not a detailed room or a poster.

People:
Soft rounded cartoon bodies, slightly large heads, tiny dot eyes, a small curved mouth, peach skin, simple hair shapes. Hands and shoes are simplified. Poses are still and everyday: sitting, lying, looking at a phone, standing apart.

Color and line:
Warm cream paper background #F6F1E6 with a faint paper grain. Muted fills only: dusty blue, sage, butter yellow, blush, warm gray and soft peach. Thin warm-brown outlines, flat color, almost no shading. No neon, no photorealism, no 3D.

Strict exclusions:
No typography, captions, logos, watermarks, speech bubbles or holiday slogans inside the picture. No national flags as the main subject. No crowded parade unless the Scene explicitly asks for one.

Scene:`

export function buildNationalDayPrompt(scene) {
  const text = (scene || '').trim()
  if (!text) return ''
  return `${NATIONAL_DAY_STYLE_PROMPT}\n${text}`
}

export function buildNationalDayPictureTitle(description) {
  const text = (description || '').trim()
  if (!text) return '国庆感受'
  return text.length <= 24 ? text : `${text.slice(0, 24)}…`
}

export function normalizeFeeling(text) {
  return String(text || '').replace(/\s+/g, '')
}

export function buildShareTitle(story) {
  const text = (story || '').trim().replace(/\s+/g, ' ')
  if (!text) return '国庆感受收集'
  if (text.length <= SHARE_TITLE_MAX) return text
  return `${text.slice(0, SHARE_TITLE_MAX)}…`
}

export function buildShareLink(pictureId, baseHref) {
  try {
    const origin = typeof window !== 'undefined' && /(^|\.)kidstory\.cc$/.test(window.location.hostname)
      ? window.location.origin : 'https://www.kidstory.cc'
    const url = new URL('/national-day', baseHref || origin)
    if (pictureId) url.searchParams.set('mine', pictureId)
    return url.toString()
  } catch {
    return baseHref || ''
  }
}

export function toAbsoluteShareUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (typeof window === 'undefined') return url
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

export function seedMemories() {
  return NATIONAL_DAY_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    note: seed.content,
    imageUrl: seed.image,
    isSeed: true,
    createdAt: '',
  }))
}
