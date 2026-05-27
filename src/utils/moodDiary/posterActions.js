import { getDraft, setDraft } from './draft'
import { addRecord, removeRecord, updateRecord } from './records'
import { MOOD_ILLUSTRATION_TYPE } from './constants'
import { getActiveMoodEndpoints, saveIllLegacyCreation, saveIllMood } from './api'
import { buildMoodIllPersistFields } from './moodIllPersist'

function buildLocalRecordPayload(posterUrl, diaryCaptionLine, draft, extra = {}) {
  const d = draft || getDraft()
  return {
    moodEmojiId: d.moodEmojiId,
    moodLabel: d.moodLabel,
    narrative: d.narrative,
    posterDataUrl: posterUrl,
    caption: diaryCaptionLine || d.diaryCaption || d.captionPicked || '',
    emotionFlow: d.emotionFlow,
    artStyle: d.artStyle,
    ...extra
  }
}

/** 生成成功后写入/更新本机日记（未同步云端） */
export function persistGeneratedPosterLocally(posterUrl, diaryCaptionLine) {
  const d = getDraft()
  const payload = buildLocalRecordPayload(posterUrl, diaryCaptionLine, d, {
    pendingUnsaved: true,
    savedToCloud: false
  })
  if (d.pendingLocalRecordId) {
    const updated = updateRecord(d.pendingLocalRecordId, payload)
    if (updated) return updated
  }
  const row = addRecord(payload)
  setDraft({ pendingLocalRecordId: row.id })
  return row
}

/** 放弃当前生成预览；可选删除本机暂存条目 */
export function clearPendingGeneratedPoster(options = {}) {
  const d = getDraft()
  if (options.removeLocalRecord && d.pendingLocalRecordId) {
    removeRecord(d.pendingLocalRecordId)
  }
  setDraft({
    composedPosterDataUrl: null,
    hasComposedPoster: false,
    pendingLocalRecordId: options.keepLocalRecord ? d.pendingLocalRecordId : null
  })
}

/**
 * 保存到本机日记并尝试同步云端「我的创作」
 * @returns {Promise<{ localOk: boolean, cloudOk: boolean, localOnly?: boolean }>}
 */
export async function saveMoodPoster(posterUrl, diaryCaptionLine, t) {
  const d = getDraft()
  const moodFields = buildMoodIllPersistFields(d)
  const recordPayload = buildLocalRecordPayload(posterUrl, diaryCaptionLine, d, {
    pendingUnsaved: false,
    savedToCloud: false
  })

  let localRow = null
  if (d.pendingLocalRecordId) {
    localRow = updateRecord(d.pendingLocalRecordId, recordPayload)
  }
  if (!localRow) {
    localRow = addRecord(recordPayload)
  }

  const cfg = getActiveMoodEndpoints()
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
  const canCloud = !!(cfg.illSaveEndpoint || (token && token !== 'undefined'))

  if (!canCloud) {
    updateRecord(localRow.id, { pendingUnsaved: true, savedToCloud: false })
    setDraft({ pendingLocalRecordId: localRow.id })
    return { localOk: true, cloudOk: false, localOnly: true }
  }

  try {
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
      await saveIllLegacyCreation(
        posterUrl,
        t('moodDiary.creationTitle'),
        moodFields.description,
        MOOD_ILLUSTRATION_TYPE,
        { moodFields }
      )
    }
    updateRecord(localRow.id, { pendingUnsaved: false, savedToCloud: true })
    setDraft({ pendingLocalRecordId: localRow.id })
    return { localOk: true, cloudOk: true }
  } catch (e) {
    updateRecord(localRow.id, { pendingUnsaved: true, savedToCloud: false })
    setDraft({ pendingLocalRecordId: localRow.id })
    const msg = e?.message || t('moodDiary.saveCreationFailed')
    throw new Error(msg)
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
