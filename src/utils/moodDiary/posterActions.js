import { ElMessage } from 'element-plus'
import { getDraft } from './draft'
import { addRecord } from './records'
import { MOOD_ILLUSTRATION_TYPE } from './constants'
import { getActiveMoodEndpoints, saveIllLegacyCreation, saveIllMood } from './api'
import { buildMoodIllPersistFields } from './moodIllPersist'

/**
 * 保存海报到本地日记 + 云端「我的创作」
 * @param {string} posterUrl
 * @param {string} diaryCaptionLine
 * @param {(key: string) => string} t
 */
export async function saveMoodPoster(posterUrl, diaryCaptionLine, t) {
  const d = getDraft()
  const moodFields = buildMoodIllPersistFields(d)
  addRecord({
    moodEmojiId: d.moodEmojiId,
    moodLabel: d.moodLabel,
    narrative: d.narrative,
    posterDataUrl: posterUrl,
    caption: diaryCaptionLine || d.diaryCaption || d.captionPicked || '',
    emotionFlow: d.emotionFlow,
    artStyle: d.artStyle
  })
  const cfg = getActiveMoodEndpoints()
  if (cfg.illSaveEndpoint) {
    await saveIllMood(
      {
        prompt: d.generateIllustrationPrompt,
        caption: diaryCaptionLine || d.diaryCaption || d.captionPicked,
        image_url: posterUrl,
        description: moodFields.description,
        mood_emoji_id: moodFields.mood_emoji_id,
        tags: moodFields.tags,
        emotionFlow: d.emotionFlow
      },
      cfg.illSaveEndpoint
    )
  } else {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
    if (token && token !== 'undefined') {
      await saveIllLegacyCreation(
        posterUrl,
        t('moodDiary.creationTitle'),
        moodFields.description,
        MOOD_ILLUSTRATION_TYPE,
        { moodFields }
      )
    }
  }
}

export function downloadMoodPosterDataUrl(posterUrl) {
  if (!posterUrl) return
  const ts = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const filename = `mood-diary-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}.jpg`
  const link = document.createElement('a')
  link.href = posterUrl
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
