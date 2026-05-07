/** @param {'week'|'month'} period */
export function getRecordsInRecapWindow(period, records) {
  const ms = period === 'week' ? 7 * 86400000 : 30 * 86400000
  const cutoff = Date.now() - ms
  return records
    .filter((r) => (r.createdAt || 0) >= cutoff)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

/**
 * 供对话补全接口：条目 + 可读日期时间在同一结构中
 * @param {'week'|'month'} period
 * @param {Array} records
 * @param {(id: string) => string} moodLabelResolver
 * @param {string} locale
 */
export function buildRecapCompletionPayload(period, records, moodLabelResolver, locale = 'zh') {
  const entries = getRecordsInRecapWindow(period, records).map((r) => {
    const d = new Date(r.createdAt || Date.now())
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    const mood =
      (r.moodLabel && String(r.moodLabel).trim()) ||
      (r.moodEmojiId ? moodLabelResolver(r.moodEmojiId) : '') ||
      ''
    return {
      date,
      time,
      dateTime: `${date} ${time}`,
      narrative: (r.narrative || '').trim(),
      moodLabel: mood
    }
  })
  const prompt =
    entries.length === 0
      ? locale === 'en'
        ? '(No diary entries in this period.)'
        : '（该时间段内暂无日记条目。）'
      : entries
          .map((e) => {
            const moodPart = e.moodLabel || '—'
            const body = e.narrative || (locale === 'en' ? '(empty)' : '（无正文）')
            const lineHead = locale === 'en' ? `- ${e.dateTime} | mood: ${moodPart}` : `- ${e.dateTime} | 心情：${moodPart}`
            return `${lineHead}\n  ${body}`
          })
          .join('\n\n')
  return {
    period,
    locale,
    count: entries.length,
    entries,
    /** 一段式文本，便于直接塞入对话补全、无结构化的后端 */
    prompt
  }
}

/**
 * Frontend-only recap summaries (parity with mini program recapEngine).
 * @param {'week'|'month'} period
 * @param {Array<{ moodEmojiId?: string, createdAt?: number, narrative?: string }>} records
 */
export function buildRecap(period, records) {
  const subset = getRecordsInRecapWindow(period, records)

  const moodCounts = {}
  for (const r of subset) {
    const id = r.moodEmojiId || 'unknown'
    moodCounts[id] = (moodCounts[id] || 0) + 1
  }
  const sorted = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])
  const topId = sorted[0]?.[0]

  const title = period === 'week' ? 'weeklyRecapTitle' : 'monthlyRecapTitle'
  const lines = []
  lines.push(subset.length ? `recordsCount:${subset.length}` : 'recordsCount:0')
  if (topId && topId !== 'unknown') {
    lines.push(`topMood:${topId}:${sorted[0][1]}`)
  }
  const wordHint = subset
    .map((r) => (r.narrative || '').trim())
    .filter(Boolean)
    .join(' ')
  const wc = wordHint.replace(/\s/g, '').length
  lines.push(`writingCharsApprox:${wc}`)

  let tone = 'mixed'
  if (['happy-grin', 'big-grin', 'laughing-tears', 'cool'].includes(topId)) tone = 'up'
  if (['sad', 'frustrated', 'angry', 'worried', 'sick'].includes(topId)) tone = 'reflective'

  return {
    period,
    titleKey: title,
    topMoodId: topId || null,
    count: subset.length,
    tone,
    lines,
    stats: { moodCounts, sortedMoods: sorted }
  }
}

export function recapToReadable(recap, t, moodLabelResolver) {
  const periodLabel =
    recap.period === 'week'
      ? t('moodDiary.recapPeriodWeek')
      : t('moodDiary.recapPeriodMonth')
  const blocks = [`${periodLabel} · ${t('moodDiary.recapRecords', { n: recap.count })}`]
  if (recap.topMoodId && recap.topMoodId !== 'unknown') {
    const label = moodLabelResolver(recap.topMoodId) || recap.topMoodId
    const n = recap.stats.sortedMoods[0]?.[1] || 0
    blocks.push(t('moodDiary.recapTopMood', { mood: label, n }))
  }
  if (recap.count === 0) {
    blocks.push(t('moodDiary.recapEmptyHint'))
  } else if (recap.tone === 'up') {
    blocks.push(t('moodDiary.recapToneUp'))
  } else if (recap.tone === 'reflective') {
    blocks.push(t('moodDiary.recapToneCare'))
  } else {
    blocks.push(t('moodDiary.recapToneMixed'))
  }
  return blocks.join('\n')
}
