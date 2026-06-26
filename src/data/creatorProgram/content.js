import { GUIDE_SCREENSHOTS } from '@/data/guides/guideContent'

export const PROGRAM_HERO_IMAGE = GUIDE_SCREENSHOTS.homeOverview
export const PROGRAM_WORKFLOW_IMAGE = GUIDE_SCREENSHOTS.aiBook
export const PROGRAM_COMMUNITY_IMAGE = GUIDE_SCREENSHOTS.myBooks
export const PROGRAM_PUBLISH_IMAGE = GUIDE_SCREENSHOTS.publishPdf

export const SECTION_NAV = [
  { id: 'vision', labelKey: 'creatorProgram.nav.vision' },
  { id: 'join', labelKey: 'creatorProgram.nav.join' },
  { id: 'submit', labelKey: 'creatorProgram.nav.submit' },
  { id: 'rewards', labelKey: 'creatorProgram.nav.rewards' },
  { id: 'themes', labelKey: 'creatorProgram.nav.themes' },
  { id: 'criteria', labelKey: 'creatorProgram.nav.criteria' },
  { id: 'rights', labelKey: 'creatorProgram.nav.rights' },
  { id: 'agreement', labelKey: 'creatorProgram.nav.agreement' },
  { id: 'roadmap', labelKey: 'creatorProgram.nav.roadmap' },
  { id: 'growth', labelKey: 'creatorProgram.nav.growth' },
]

export const AUDIENCE_KEYS = ['parents', 'children', 'teachers', 'fans', 'aiCreators', 'institutions']

export const SUBMIT_STEPS = [
  {
    id: 'create',
    image: GUIDE_SCREENSHOTS.aiBook,
    route: '/creation-studio/book/ai',
    linkKey: 'creatorProgram.submit.steps.create.link',
  },
  {
    id: 'upload',
    image: GUIDE_SCREENSHOTS.layoutExport,
    route: '/creation-studio/book/mine',
    linkKey: 'creatorProgram.submit.steps.upload.link',
  },
  {
    id: 'review',
    image: GUIDE_SCREENSHOTS.publishPdf,
    route: '/creation-studio/book/compose',
    linkKey: 'creatorProgram.submit.steps.review.link',
  },
  {
    id: 'publish',
    image: GUIDE_SCREENSHOTS.myBooks,
    route: '/books/',
    linkKey: 'creatorProgram.submit.steps.publish.link',
  },
  {
    id: 'contest',
    image: GUIDE_SCREENSHOTS.myIllustrations,
    route: '/books/',
    linkKey: 'creatorProgram.submit.steps.contest.link',
  },
]

export const MONTHLY_REWARD_KEYS = ['print', 'homepage', 'wechat', 'badge', 'certificate']

export const HONOR_KEYS = [
  'editorPick',
  'weeklyHot',
  'monthlyBest',
  'yearlyBest',
  'bestStory',
  'bestArt',
  'familyCoCreate',
  'education',
  'mostPopular',
]

export const SHOWCASE_COLUMN_KEYS = [
  'editorPick',
  'weeklyHot',
  'youngAuthor',
  'newcomer',
  'artPick',
  'themeHall',
  'mostLoved',
]

export const THEME_KEYS = [
  'myFirstBook',
  'animalFriends',
  'family',
  'festivals',
  'spring',
  'summerTrip',
  'ecoGuard',
  'braveKid',
  'myDream',
  'bedtime',
  'growingUp',
  'futureWorld',
]

export const CRITERIA = [
  { id: 'story', weight: 30 },
  { id: 'creativity', weight: 25 },
  { id: 'illustration', weight: 20 },
  { id: 'reading', weight: 15 },
  { id: 'education', weight: 10 },
]

export const RIGHTS_KEYS = ['credit', 'recommend', 'feature', 'profile', 'archive', 'exposure']

export const AGREEMENT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8']

export const PHASES = [
  { id: 'phase1', icon: '📚' },
  { id: 'phase2', icon: '🌱' },
  { id: 'phase3', icon: '🏆' },
]

export const VALUE_PILLARS = ['kids', 'parents', 'platform']

export const GROWTH_TIERS = [
  { id: 'rookie', icon: '🌱' },
  { id: 'excellent', icon: '✨' },
  { id: 'star', icon: '⭐' },
  { id: 'gold', icon: '🥇' },
  { id: 'master', icon: '👑' },
]

export const ECOSYSTEM_ITEMS = [
  { id: 'tool', icon: '🎨' },
  { id: 'community', icon: '🤝' },
  { id: 'library', icon: '📖' },
  { id: 'ip', icon: '💫' },
]
