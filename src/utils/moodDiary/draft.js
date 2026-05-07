import axios from 'axios'

const GLOBAL_DRAFT_KEY = 'mood_diary_global_draft_v2'
const OLD_DRAFT_KEY = 'mood_diary_draft_v1'

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
    artStyle: '',
    artStyleId: 1,
    emotionFlow: null,
    imageVisionCache: null,
    captionCandidates: [],
    captionPicked: null,
    generateIllustrationPrompt: '',
    quotaSentence: '',
    matching: null,
    rawIllustrationUrl: null,
    composedPosterDataUrl: null
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

export function getDraft() {
  try {
    const raw = localStorage.getItem(GLOBAL_DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return { ...defaultDraft(), ...parsed }
    }
    const migrated = migrateOldDraft()
    if (migrated) {
      const merged = { ...defaultDraft(), ...migrated, savedAt: Date.now() }
      localStorage.setItem(GLOBAL_DRAFT_KEY, JSON.stringify(merged))
      return merged
    }
  } catch (_) {
    /* ignore */
  }
  return defaultDraft()
}

export function setDraft(partial) {
  const prev = getDraft()
  const merged = {
    ...prev,
    ...partial,
    savedAt: Date.now()
  }
  try {
    localStorage.setItem(GLOBAL_DRAFT_KEY, JSON.stringify(merged))
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
