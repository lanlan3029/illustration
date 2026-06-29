import { GUIDE_SCREENSHOTS } from '@/data/guides/guideContent'

export const PROGRAM_HERO_IMAGE = GUIDE_SCREENSHOTS.aiBook
export const PROGRAM_GALLERY_IMAGE = GUIDE_SCREENSHOTS.myBooks

export const SECTION_NAV = [
  { id: 'why', labelKey: 'creatorProgram.nav.why' },
  { id: 'how', labelKey: 'creatorProgram.nav.how' },
  { id: 'rewards', labelKey: 'creatorProgram.nav.rewards' },
]

/** 投稿方式（按创作进度分情况） */
export const SUBMIT_STEPS = [
  {
    id: 'localBook',
    image: GUIDE_SCREENSHOTS.uploadLocalBook,
    route: '/user/upload/upload-local-book',
    linkKey: 'creatorProgram.submit.steps.localBook.link',
  },
  {
    id: 'existingArt',
    image: GUIDE_SCREENSHOTS.editorPro,
    route: '/editorpro',
    linkKey: 'creatorProgram.submit.steps.existingArt.link',
  },
  {
    id: 'createOnSite',
    image: GUIDE_SCREENSHOTS.aiBook,
    route: '/creation-studio/book/ai',
    linkKey: 'creatorProgram.submit.steps.createOnSite.link',
  },
  {
    id: 'email',
    image: GUIDE_SCREENSHOTS.publishPdf,
    mailto: 'dailystorytime2026@163.com',
    mailSubject: '绘本投稿',
    linkKey: 'creatorProgram.submit.steps.email.link',
  },
]

export const WHY_KEYS = ['kid', 'family', 'memory']

export const FEATURED_REWARD_KEYS = ['print', 'homepage']

export const RULE_KEYS = ['original', 'guardian', 'copyright', 'takedown']
