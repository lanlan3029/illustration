import { GUIDE_SCREENSHOTS } from '@/data/guides/guideContent'

export const PROGRAM_HERO_IMAGE = GUIDE_SCREENSHOTS.aiBook
export const PROGRAM_GALLERY_IMAGE = GUIDE_SCREENSHOTS.myBooks

export const SECTION_NAV = [
  { id: 'why', labelKey: 'creatorProgram.nav.why' },
  { id: 'how', labelKey: 'creatorProgram.nav.how' },
  { id: 'rewards', labelKey: 'creatorProgram.nav.rewards' },
  { id: 'themes', labelKey: 'creatorProgram.nav.themes' },
]

/** 投稿 4 步 */
export const SUBMIT_STEPS = [
  {
    id: 'create',
    image: GUIDE_SCREENSHOTS.aiBook,
    route: '/creation-studio/book/ai',
    linkKey: 'creatorProgram.submit.steps.create.link',
  },
  {
    id: 'submit',
    image: GUIDE_SCREENSHOTS.publishPdf,
    route: '/creation-studio/book/mine',
    linkKey: 'creatorProgram.submit.steps.submit.link',
  },
  {
    id: 'showcase',
    image: GUIDE_SCREENSHOTS.myBooks,
    route: '/books/',
    linkKey: 'creatorProgram.submit.steps.showcase.link',
  },
  {
    id: 'contest',
    image: GUIDE_SCREENSHOTS.homeOverview,
    route: '/books/',
    linkKey: 'creatorProgram.submit.steps.contest.link',
  },
]

export const WHY_KEYS = ['kid', 'family', 'memory']

export const MONTHLY_REWARD_KEYS = ['print', 'homepage', 'badge', 'certificate']

export const PERK_KEYS = ['youngAuthor', 'editorPick', 'themeHall', 'growth']

/** 灵感主题（展示部分） */
export const THEME_KEYS = [
  'myFirstBook',
  'family',
  'animalFriends',
  'myDream',
  'bedtime',
  'festivals',
  'braveKid',
  'growingUp',
]

export const RULE_KEYS = ['original', 'guardian', 'copyright', 'takedown']
