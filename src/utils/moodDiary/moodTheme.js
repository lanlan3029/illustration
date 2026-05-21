/** Mood accent + atmosphere — borders, page tint, copy keys */

const MOOD_ACCENT_GROUPS = [
  {
    ids: ['big-grin', 'happy-grin', 'laughing-tears', 'blushing-smile', 'wink', 'tongue-out', 'thumbs-up', 'angel'],
    accent: '#e8c96a',
    soft: '#faf6ec',
    dot: '#e8c96a'
  },
  {
    ids: ['neutral-smile', 'cool', 'annoyed', 'devil'],
    accent: '#8eb4c8',
    soft: '#e8edf2',
    dot: '#8eb4c8'
  },
  {
    ids: ['worried', 'sad', 'sobbing', 'disappointed', 'cold', 'sick', 'dizzy', 'frowning'],
    accent: '#8fa8c4',
    soft: '#dfe8f3',
    dot: '#7aa8e8'
  },
  {
    ids: ['angry', 'frustrated', 'pouting'],
    accent: '#d89090',
    soft: '#f5eaea',
    dot: '#d89090'
  },
  {
    ids: ['surprised', 'star-eyes', 'heart', 'heart-eyes', 'kissing'],
    accent: '#c898b0',
    soft: '#f5eef2',
    dot: '#c898b0'
  }
]

const DEFAULT_ACCENT = {
  accent: '#9eb0c0',
  soft: '#eef1f4',
  dot: '#9eb0c0'
}

const accentById = new Map()
MOOD_ACCENT_GROUPS.forEach((g) => {
  g.ids.forEach((id) => {
    accentById.set(id, { accent: g.accent, soft: g.soft, dot: g.dot })
  })
})

/** Atmosphere profiles — page bg, hero, CTA & placeholder i18n keys */
const ATMOSPHERE_PROFILES = [
  {
    ids: ['big-grin', 'happy-grin', 'laughing-tears', 'blushing-smile', 'wink', 'tongue-out', 'thumbs-up', 'angel'],
    key: 'happy',
    pageBg: '#faf6ec',
    pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232, 201, 106, 0.18), transparent 70%)',
    cardBg: 'rgba(255, 252, 247, 0.92)',
    heroBg: 'linear-gradient(165deg, rgba(255, 252, 247, 0.95) 0%, rgba(245, 236, 210, 0.5) 100%)',
    ctaKey: 'moodDiary.ctaHappy',
    placeholderKey: 'moodDiary.placeholderHappy',
    heroKey: 'moodDiary.heroHappy',
    memoryKey: 'moodDiary.memoryHappy',
    previewTint: 'rgba(232, 201, 106, 0.12)'
  },
  {
    ids: ['neutral-smile', 'cool'],
    key: 'calm',
    pageBg: '#eef2f6',
    pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(142, 180, 200, 0.14), transparent 70%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    heroBg: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(232, 237, 242, 0.6) 100%)',
    ctaKey: 'moodDiary.ctaCalm',
    placeholderKey: 'moodDiary.placeholderCalm',
    heroKey: 'moodDiary.heroCalm',
    memoryKey: 'moodDiary.memoryCalm',
    previewTint: 'rgba(142, 180, 200, 0.1)'
  },
  {
    ids: ['worried', 'dizzy', 'frustrated', 'frowning'],
    key: 'anxious',
    pageBg: '#eceae4',
    pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180, 170, 140, 0.12), transparent 70%)',
    cardBg: 'rgba(255, 254, 251, 0.92)',
    heroBg: 'linear-gradient(165deg, rgba(255,254,251,0.95) 0%, rgba(236, 234, 228, 0.55) 100%)',
    ctaKey: 'moodDiary.ctaAnxious',
    placeholderKey: 'moodDiary.placeholderAnxious',
    heroKey: 'moodDiary.heroAnxious',
    memoryKey: 'moodDiary.memoryAnxious',
    previewTint: 'rgba(180, 170, 140, 0.1)'
  },
  {
    ids: ['sad', 'sobbing', 'disappointed', 'sick'],
    key: 'sad',
    pageBg: '#e8eef4',
    pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(143, 168, 196, 0.16), transparent 70%)',
    cardBg: 'rgba(252, 253, 255, 0.92)',
    heroBg: 'linear-gradient(165deg, rgba(252,253,255,0.95) 0%, rgba(223, 232, 243, 0.55) 100%)',
    ctaKey: 'moodDiary.ctaSad',
    placeholderKey: 'moodDiary.placeholderSad',
    heroKey: 'moodDiary.heroSad',
    memoryKey: 'moodDiary.memorySad',
    previewTint: 'rgba(143, 168, 196, 0.14)'
  },
  {
    ids: ['cold'],
    key: 'lonely',
    pageBg: '#e4e6ea',
    pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(100, 110, 130, 0.12), transparent 70%)',
    cardBg: 'rgba(248, 249, 251, 0.92)',
    heroBg: 'linear-gradient(165deg, rgba(248,249,251,0.95) 0%, rgba(220, 224, 232, 0.5) 100%)',
    ctaKey: 'moodDiary.ctaLonely',
    placeholderKey: 'moodDiary.placeholderLonely',
    heroKey: 'moodDiary.heroLonely',
    memoryKey: 'moodDiary.memoryLonely',
    previewTint: 'rgba(100, 110, 130, 0.12)'
  },
  {
    ids: ['angry', 'pouting', 'annoyed'],
    key: 'angry',
    pageBg: '#f5ecec',
    pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(216, 144, 144, 0.14), transparent 70%)',
    cardBg: 'rgba(255, 252, 252, 0.92)',
    heroBg: 'linear-gradient(165deg, rgba(255,252,252,0.95) 0%, rgba(245, 234, 234, 0.5) 100%)',
    ctaKey: 'moodDiary.ctaAngry',
    placeholderKey: 'moodDiary.placeholderAngry',
    heroKey: 'moodDiary.heroAngry',
    memoryKey: 'moodDiary.memoryAngry',
    previewTint: 'rgba(216, 144, 144, 0.12)'
  },
  {
    ids: ['surprised', 'star-eyes', 'heart', 'heart-eyes', 'kissing', 'devil'],
    key: 'love',
    pageBg: '#f5eef2',
    pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200, 152, 176, 0.14), transparent 70%)',
    cardBg: 'rgba(255, 252, 254, 0.92)',
    heroBg: 'linear-gradient(165deg, rgba(255,252,254,0.95) 0%, rgba(245, 238, 242, 0.5) 100%)',
    ctaKey: 'moodDiary.ctaLove',
    placeholderKey: 'moodDiary.placeholderLove',
    heroKey: 'moodDiary.heroLove',
    memoryKey: 'moodDiary.memoryLove',
    previewTint: 'rgba(200, 152, 176, 0.12)'
  }
]

const DEFAULT_ATMOSPHERE = {
  key: 'default',
  pageBg: '#f4f2ef',
  pageGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(158, 176, 192, 0.1), transparent 70%)',
  cardBg: 'rgba(255, 255, 255, 0.92)',
  heroBg: 'linear-gradient(165deg, rgba(255,255,255,0.96) 0%, rgba(244, 242, 239, 0.5) 100%)',
  ctaKey: 'moodDiary.ctaDefault',
  placeholderKey: 'moodDiary.placeholderDefault',
  heroKey: 'moodDiary.heroDefault',
  memoryKey: 'moodDiary.memoryDefault',
  previewTint: 'rgba(158, 176, 192, 0.08)'
}

const atmosphereById = new Map()
ATMOSPHERE_PROFILES.forEach((p) => {
  p.ids.forEach((id) => atmosphereById.set(id, p))
})

export function getMoodAccent(moodId) {
  if (!moodId) return { ...DEFAULT_ACCENT }
  return accentById.get(moodId) || { ...DEFAULT_ACCENT }
}

export function getMoodAtmosphere(moodId) {
  if (!moodId) return { ...DEFAULT_ATMOSPHERE, ...DEFAULT_ACCENT }
  const profile = atmosphereById.get(moodId) || DEFAULT_ATMOSPHERE
  const accent = getMoodAccent(moodId)
  return { ...profile, ...accent }
}

export function atmosphereCssVars(moodId) {
  const a = getMoodAtmosphere(moodId)
  return {
    '--md-atm-bg': a.pageBg,
    '--md-atm-glow': a.pageGlow,
    '--md-atm-card': a.cardBg,
    '--md-atm-hero': a.heroBg,
    '--md-atm-preview': a.previewTint,
    '--now-mood-accent': a.accent,
    '--now-mood-soft': a.soft
  }
}

const COPILOT_ZH = {
  angry: [
    '今天的火气需要出口，写下来，让纸面替我安静一点。',
    '不必强装没事——此刻的愤怒，也值得被认真记录。',
    '把不满写进字句里，也许比憋在心里更轻盈。'
  ],
  frustrated: [
    '心态有点崩，但写下来，就是对自己温柔的开始。',
    '今天不太顺，把这些乱糟糟的感受先安放在这里。',
    '允许自己崩溃一秒，然后留一句给未来的自己。'
  ],
  sad: [
    '委屈不必藏起来，写几句，让心情有个落脚处。',
    '今天的蓝色心情，也值得被温柔地看见。',
    '低落的时候，文字也可以像一条薄毯。'
  ],
  worried: [
    '眉头紧锁的日子，写下来的担心会小一点。',
    '把焦虑拆成字，也许就没那么压人了。',
    '不确定的事很多，但此刻的感受是真实的。'
  ],
  'big-grin': [
    '今天的好心情值得被放大——写一句，留给以后回味。',
    '嘴角上扬的时刻，别让它悄悄溜走。',
    '把快乐写具体一点：颜色、声音、温度。'
  ],
  default: [
    '不知道写什么？从「此刻我在___」开始就好。',
    '不用完美，两三句真实感受就足够。',
    '今天发生了什么，让你有现在的这种心情？'
  ]
}

const COPILOT_EN = {
  angry: [
    'Let the heat out on the page — you deserve a calmer breath.',
    'No need to pretend — anger is worth naming honestly.',
    'Write it down; sometimes words carry what we cannot say aloud.'
  ],
  frustrated: [
    'Rough day — putting it in words is already a kind start.',
    'Capture the mess before it fades; future you might thank you.',
    'Allow one honest sentence about what went wrong.'
  ],
  sad: [
    'Sadness deserves a soft place to land — even on a screen.',
    'Write the blue mood down; visibility can feel lighter.',
    'A few gentle lines can be a blanket for today.'
  ],
  worried: [
    'Worries shrink a little when they meet the page.',
    'Name one thing that tightened your chest today.',
    'Uncertainty is loud — your feelings are still valid.'
  ],
  'big-grin': [
    'Good moods fade fast — freeze this one in words.',
    'What made you grin? Color, sound, a small detail.',
    'Happiness reads better when you make it specific.'
  ],
  default: [
    'Start with “Right now I feel ___” — that is enough.',
    'Two honest sentences beat a perfect paragraph.',
    'What happened today that shaped this mood?'
  ]
}

export function getMoodCopilotLines(moodId, isZh) {
  const pool = isZh ? COPILOT_ZH : COPILOT_EN
  const key = moodId && pool[moodId] ? moodId : 'default'
  return pool[key] || pool.default
}

export function pickRandomCopilotLine(moodId, isZh) {
  const lines = getMoodCopilotLines(moodId, isZh)
  return lines[Math.floor(Math.random() * lines.length)]
}
