import axios from 'axios'

const GLOBAL_DRAFT_KEY = 'mood_diary_global_draft_v2'
const OLD_DRAFT_KEY = 'mood_diary_draft_v1'
const REF_IMAGE_SESSION_KEY = 'mood_diary_ref_image_v1'
const ILLUSTRATION_SESSION_KEY = 'mood_diary_raw_illustration_v1'
const COMPOSED_POSTER_SESSION_KEY = 'mood_diary_composed_poster_v1'

/** 同页内存缓存，避免 localStorage 配额导致大图丢失 */
let refImageMemory = null
let illustrationMemory = null
let composedPosterMemory = null

function loadRefImageFromSession() {
  if (refImageMemory) return refImageMemory
  try {
    refImageMemory = sessionStorage.getItem(REF_IMAGE_SESSION_KEY)
  } catch (_) {
    /* ignore */
  }
  return refImageMemory || null
}

function saveRefImageToSession(dataUrl) {
  refImageMemory = dataUrl || null
  try {
    if (dataUrl) sessionStorage.setItem(REF_IMAGE_SESSION_KEY, dataUrl)
    else sessionStorage.removeItem(REF_IMAGE_SESSION_KEY)
  } catch (_) {
    /* ignore */
  }
}

function loadIllustrationFromSession() {
  if (illustrationMemory) return illustrationMemory
  try {
    illustrationMemory = sessionStorage.getItem(ILLUSTRATION_SESSION_KEY)
  } catch (_) {
    /* ignore */
  }
  return illustrationMemory || null
}

function saveIllustrationToSession(url) {
  illustrationMemory = url || null
  try {
    if (url) sessionStorage.setItem(ILLUSTRATION_SESSION_KEY, url)
    else sessionStorage.removeItem(ILLUSTRATION_SESSION_KEY)
  } catch (_) {
    /* ignore */
  }
}

function loadComposedPosterFromSession() {
  if (composedPosterMemory) return composedPosterMemory
  try {
    composedPosterMemory = sessionStorage.getItem(COMPOSED_POSTER_SESSION_KEY)
  } catch (_) {
    /* ignore */
  }
  return composedPosterMemory || null
}

function saveComposedPosterToSession(dataUrl) {
  composedPosterMemory = dataUrl || null
  try {
    if (dataUrl) sessionStorage.setItem(COMPOSED_POSTER_SESSION_KEY, dataUrl)
    else sessionStorage.removeItem(COMPOSED_POSTER_SESSION_KEY)
  } catch (_) {
    /* ignore */
  }
}

function attachRefImage(draft) {
  const d = { ...draft }
  if (!d.inputImageDataUrl && d.hasInputImage) {
    d.inputImageDataUrl = loadRefImageFromSession()
  }
  return d
}

function attachIllustrationUrl(draft) {
  const d = { ...draft }
  if (!d.rawIllustrationUrl && (d.hasRawIllustration || loadIllustrationFromSession())) {
    d.rawIllustrationUrl = loadIllustrationFromSession()
  }
  return d
}

function attachComposedPoster(draft) {
  const d = { ...draft }
  if (!d.composedPosterDataUrl && d.hasComposedPoster) {
    d.composedPosterDataUrl = loadComposedPosterFromSession()
  }
  return d
}

function attachDraftAssets(draft) {
  return attachComposedPoster(attachIllustrationUrl(attachRefImage(draft)))
}

function slimDraftForStorage(draft) {
  const slim = { ...draft }
  if (slim.inputImageDataUrl?.startsWith?.('data:')) {
    slim.inputImageDataUrl = null
    slim.hasInputImage = true
  } else if (!slim.inputImageDataUrl) {
    slim.hasInputImage = false
  }
  if (slim.rawIllustrationUrl?.startsWith?.('data:')) {
    slim.rawIllustrationUrl = null
    slim.hasRawIllustration = true
  } else if (slim.rawIllustrationUrl) {
    slim.hasRawIllustration = true
  } else {
    slim.hasRawIllustration = false
  }
  if (slim.composedPosterDataUrl?.startsWith?.('data:') || slim.composedPosterDataUrl?.startsWith?.('blob:')) {
    slim.composedPosterDataUrl = null
    slim.hasComposedPoster = true
  } else if (!slim.composedPosterDataUrl) {
    slim.hasComposedPoster = false
  } else {
    slim.hasComposedPoster = true
  }
  return slim
}

function defaultDraft() {
  return {
    v: 2,
    savedAt: 0,
    narrative: '',
    mood: '',
    moodEmojiId: null,
    moodLabel: '',
    inputImagePath: null,
    inputImageDataUrl: null,
    inputImageName: '',
    hasInputImage: false,
    artStyle: '',
    artStyleId: 1,
    emotionFlow: null,
    imageVisionCache: null,
    sceneDescription: '',
    captionCandidates: [],
    captionPicked: null,
    generateIllustrationPrompt: '',
    quotaSentence: '',
    /** 海报底部日记体配文（由画面描述生成，约 90 字） */
    diaryCaption: '',
    matching: null,
    rawIllustrationUrl: null,
    hasRawIllustration: false,
    composedPosterDataUrl: null,
    /** photo | illustration；空表示尚未选择 */
    posterMode: '',
    posterTemplateId: 'creamCard',
    colorBlockPlacement: 'top',
    imagePlacement: 'below',
    dominantHex: '',
    describeInputHash: '',
    artStyleElementDetails: '',
    /** Dashboard poster slot loading while pipeline runs */
    posterGenerating: false,
    posterGeneratingSlot: 0,
    /** 生成后暂存的本机日记条目 id（未点「保存到我的创作」前） */
    pendingLocalRecordId: null,
    hasComposedPoster: false
  }
}

function migrateOldDraft() {
  try {
    const raw = localStorage.getItem(OLD_DRAFT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const d = defaultDraft()
    if (typeof data.diaryContent === 'string') d.narrative = data.diaryContent
    if (data.selectedMoodId) {
      d.moodEmojiId = data.selectedMoodId
      d.mood = data.selectedMoodId
    }
    if (data.selectedStyleId != null) d.artStyleId = Number(data.selectedStyleId) || 1
    return d
  } catch (_) {
    return null
  }
}

export function resolvePosterMode(draft) {
  const d = draft || getDraft()
  if (d.posterMode === 'photo' || d.posterMode === 'illustration') {
    return d.posterMode
  }
  return d.inputImageDataUrl ? 'photo' : 'illustration'
}

export function getDraft() {
  try {
    const raw = localStorage.getItem(GLOBAL_DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return attachDraftAssets({ ...defaultDraft(), ...parsed })
      }
    }
    const migrated = migrateOldDraft()
    if (migrated) {
      const merged = attachDraftAssets({ ...defaultDraft(), ...migrated, savedAt: Date.now() })
      localStorage.setItem(GLOBAL_DRAFT_KEY, JSON.stringify(slimDraftForStorage(merged)))
      return merged
    }
  } catch (_) {
    /* ignore */
  }
  return attachDraftAssets(defaultDraft())
}

export function setDraft(partial) {
  const prev = getDraft()
  if ('inputImageDataUrl' in partial) {
    saveRefImageToSession(partial.inputImageDataUrl || null)
  }
  if ('rawIllustrationUrl' in partial) {
    saveIllustrationToSession(partial.rawIllustrationUrl || null)
  }
  if ('composedPosterDataUrl' in partial) {
    saveComposedPosterToSession(partial.composedPosterDataUrl || null)
  }
  const merged = attachDraftAssets({
    ...prev,
    ...partial,
    savedAt: Date.now()
  })
  if (merged.inputImageDataUrl?.startsWith?.('data:')) {
    saveRefImageToSession(merged.inputImageDataUrl)
  }
  if (merged.rawIllustrationUrl) {
    saveIllustrationToSession(merged.rawIllustrationUrl)
  }
  if (merged.composedPosterDataUrl) {
    saveComposedPosterToSession(merged.composedPosterDataUrl)
  }
  try {
    localStorage.setItem(GLOBAL_DRAFT_KEY, JSON.stringify(slimDraftForStorage(merged)))
  } catch (_) {
    /* quota */
  }
  return merged
}

export function clearDraftFields(keys) {
  const d = getDraft()
  const next = { ...d }
  for (const k of keys) delete next[k]
  setDraft(next)
}

/** Data URL → short path label for draft field parity with mini program */
export function dataUrlToPathHint(name) {
  return name ? `local:${name}` : 'local:image'
}

/**
 * Normalize remote image URL (same behavior as legacy MoodDiary).
 * @param {string} url
 */
export async function normalizeImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  const baseStatic = axios.defaults.baseURL || ''
  if (baseStatic.includes('kidstory.cc')) return `https://static.kidstory.cc/${url.replace(/^\//, '')}`
  return url.startsWith('/') ? url : `/${url}`
}
