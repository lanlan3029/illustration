/** 与后端 caption/mood-recap 一致：每条正文类字段约 500 字；最多传 50 条 */
export const MOOD_RECAP_MAX_ENTRIES = 50
const MOOD_RECAP_ENTRY_FIELD_MAX = 500
const MOOD_RECAP_TOP_MOOD_MAX = 40
const MOOD_RECAP_TONE_MAX = 20
const MOOD_RECAP_SYSTEM_HINT_MAX = 800

function clampStr(s, max) {
  const t = String(s || '').trim()
  if (t.length <= max) return t
  return t.slice(0, max)
}

/** @param {'week'|'month'} period */
export function getRecordsInRecapWindow(period, records) {
  const ms = period === 'week' ? 7 * 86400000 : 30 * 86400000
  const cutoff = Date.now() - ms
  return records
    .filter((r) => (r.createdAt || 0) >= cutoff)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

function formatEntryDateTime(ts, locale = 'zh') {
  const d = new Date(ts || Date.now())
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { date, time, dateTime: `${date} ${time}` }
}

/**
 * 单条日记 → caption 风格条目（供 /caption/mood-recap）
 * @param {object} r
 * @param {(id: string) => string} moodLabelResolver
 * @param {string} locale
 */
export function buildRecapEntry(r, moodLabelResolver, locale = 'zh') {
  const { date, time, dateTime } = formatEntryDateTime(r.createdAt, locale)
  const moodRaw =
    (r.moodLabel && String(r.moodLabel).trim()) ||
    (r.moodEmojiId ? moodLabelResolver(r.moodEmojiId) : '') ||
    ''
  const mood = clampStr(moodRaw, MOOD_RECAP_TOP_MOOD_MAX)
  const narrative = clampStr(r.narrative, MOOD_RECAP_ENTRY_FIELD_MAX)
  const diaryCaption = clampStr(
    (r.caption || r.diaryCaption || r.quotaSentence || '').trim(),
    MOOD_RECAP_ENTRY_FIELD_MAX
  )
  const body =
    clampStr(diaryCaption || narrative, MOOD_RECAP_ENTRY_FIELD_MAX) ||
    (locale === 'en' ? '(empty)' : '（无正文）')
  return {
    date,
    time,
    date_time: dateTime,
    mood_label: mood,
    user_mood: mood,
    narrative,
    diary_caption: diaryCaption,
    body,
    has_poster: !!(r.posterDataUrl || r.thumbUrl)
  }
}

/**
 * 本地统计（与 AI 无关的兜底）
 * @param {'week'|'month'} period
 * @param {Array} records
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
    .map((r) => (r.caption || r.narrative || '').trim())
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

/**
 * POST /caption/mood-recap 请求体（对齐 image-describe 字段风格）
 * @param {'week'|'month'} period
 * @param {Array} records
 * @param {(id: string) => string} moodLabelResolver
 * @param {string} locale
 * @param {{
 *   targetLength?: number,
 *   generateStructuredRecap?: boolean,
 *   systemHint?: string
 * }} [options]
 */
export function buildRecapCompletionPayload(period, records, moodLabelResolver, locale = 'zh', options = {}) {
  const isEn = locale === 'en' || locale?.startsWith?.('en')
  const subset = getRecordsInRecapWindow(period, records)
  const localRecap = buildRecap(period, records)
  const entries = subset
    .slice(0, MOOD_RECAP_MAX_ENTRIES)
    .map((r) => buildRecapEntry(r, moodLabelResolver, locale))

  const topMoodLabelRaw =
    localRecap.topMoodId && localRecap.topMoodId !== 'unknown'
      ? moodLabelResolver(localRecap.topMoodId) || localRecap.topMoodId
      : ''
  const topMoodLabel = clampStr(topMoodLabelRaw, MOOD_RECAP_TOP_MOOD_MAX)

  const entriesText =
    entries.length === 0
      ? isEn
        ? '(No diary entries in this period.)'
        : '（该时间段内暂无日记条目。）'
      : entries
          .map((e) => {
            const head = isEn
              ? `- ${e.date_time} | mood: ${e.mood_label || '—'}`
              : `- ${e.date_time} | 心情：${e.mood_label || '—'}`
            const extra = e.diary_caption && e.diary_caption !== e.narrative ? `\n  配文：${e.diary_caption}` : ''
            return `${head}\n  ${e.body}${extra}`
          })
          .join('\n\n')

  const rawTarget = options.targetLength ?? (period === 'week' ? 380 : 520)
  const targetLength = Math.min(900, Math.max(200, Number(rawTarget) || (period === 'week' ? 380 : 520)))

  const baseHint = isEn
    ? 'Analyze mood diary entries. Output one JSON line only with keys: overview, mood_trend, themes (array of strings), highlight, suggestion, recap_text. Warm diary tone; no medical claims.'
    : '分析心情日记条目。仅输出一行 JSON，键名：overview、mood_trend、themes（字符串数组）、highlight、suggestion、recap_text。语气温暖、具体，勿编造未出现的内容，勿做医疗诊断。'
  const extraHint = String(options.systemHint || '').trim()
  const systemHintMerged = extraHint ? `${baseHint}\n\n${extraHint}` : baseHint
  const system_hint = systemHintMerged.slice(0, MOOD_RECAP_SYSTEM_HINT_MAX)

  return {
    period: period === 'month' ? 'month' : 'week',
    locale: isEn ? 'en' : 'zh',
    target_length: targetLength,
    generate_structured_recap: options.generateStructuredRecap !== false,
    count: entries.length,
    top_mood: topMoodLabel,
    tone: clampStr(localRecap.tone, MOOD_RECAP_TONE_MAX),
    entries,
    entries_text: entriesText,
    /** 兼容旧后端：整段 prompt 文本 */
    prompt: entriesText,
    stats: {
      count: localRecap.count,
      top_mood_id: localRecap.topMoodId,
      top_mood_label: topMoodLabel,
      tone: localRecap.tone,
      mood_counts: localRecap.stats.moodCounts
    },
    system_hint
  }
}

/** @typedef {{ overview: string, moodTrend: string, themes: string[], highlight: string, suggestion: string, recapText: string }} RecapAiResult */

/**
 * 将 AI 复盘结构化结果格式化为展示/分享文本
 * @param {RecapAiResult|null} result
 * @param {(key: string, params?: object) => string} t
 */
export function recapAiResultToReadable(result, t) {
  if (!result) return ''
  const blocks = []
  if (result.overview) blocks.push(result.overview)
  if (result.moodTrend) {
    blocks.push(`${t('moodDiary.recapSectionTrend')}\n${result.moodTrend}`)
  }
  if (result.themes?.length) {
    blocks.push(
      `${t('moodDiary.recapSectionThemes')}\n${result.themes.map((x) => `· ${x}`).join('\n')}`
    )
  }
  if (result.highlight) {
    blocks.push(`${t('moodDiary.recapSectionHighlight')}\n${result.highlight}`)
  }
  if (result.suggestion) {
    blocks.push(`${t('moodDiary.recapSectionSuggestion')}\n${result.suggestion}`)
  }
  if (blocks.length) return blocks.join('\n\n')
  return (result.recapText || '').trim()
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
