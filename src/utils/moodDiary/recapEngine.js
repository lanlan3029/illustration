/** 与后端 caption/mood-recap 一致：每条正文类字段约 500 字；最多传 50 条 */
export const MOOD_RECAP_MAX_ENTRIES = 50
const MOOD_RECAP_ENTRY_FIELD_MAX = 240
const MOOD_RECAP_TOP_MOOD_MAX = 40
const MOOD_RECAP_TONE_MAX = 20
const MOOD_RECAP_SYSTEM_HINT_MAX = 800

function clampStr(s, max) {
  const t = String(s || '').trim()
  if (t.length <= max) return t
  return t.slice(0, max)
}

export const MOOD_RECAP_MAX_RANGE_DAYS = 365

function startOfDay(input) {
  const d = new Date(input)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function endOfDay(input) {
  const d = new Date(input)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

function formatDateISO(input) {
  const d = new Date(input)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * @param {'week'|'month'|{ mode: 'custom', start: Date|string|number, end: Date|string|number }} range
 */
export function normalizeRecapRange(range) {
  if (typeof range === 'string') {
    return { mode: 'preset', period: range === 'month' ? 'month' : 'week' }
  }
  if (range?.mode === 'custom' && range.start != null && range.end != null) {
    const startMs = startOfDay(range.start)
    const endMs = endOfDay(range.end)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
      return { mode: 'custom', invalid: true }
    }
    const dayCount = Math.floor((endMs - startMs) / 86400000) + 1
    return {
      mode: 'custom',
      startMs,
      endMs,
      startDate: formatDateISO(startMs),
      endDate: formatDateISO(endMs),
      dayCount,
      tooLong: dayCount > MOOD_RECAP_MAX_RANGE_DAYS
    }
  }
  return { mode: 'preset', period: 'week' }
}

function resolveRecapWindow(range) {
  const normalized = normalizeRecapRange(range)
  if (normalized.mode === 'custom') {
    if (normalized.invalid || normalized.tooLong) {
      return { startMs: 0, endMs: -1, normalized }
    }
    return {
      startMs: normalized.startMs,
      endMs: normalized.endMs,
      normalized
    }
  }
  const ms = normalized.period === 'month' ? 30 * 86400000 : 7 * 86400000
  return {
    startMs: Date.now() - ms,
    endMs: Date.now(),
    normalized
  }
}

/** @param {'week'|'month'|object} range */
export function getRecordsInRecapWindow(range, records) {
  const { startMs, endMs } = resolveRecapWindow(range)
  if (endMs < startMs) return []
  return records
    .filter((r) => {
      const t = r.createdAt || 0
      return t >= startMs && t <= endMs
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function formatRecapRangeLabel(range, locale = 'zh') {
  const normalized = normalizeRecapRange(range)
  if (normalized.mode === 'custom') {
    if (normalized.invalid) return ''
    const isEn = locale === 'en' || locale?.startsWith?.('en')
    if (isEn) return `${normalized.startDate} – ${normalized.endDate}`
    return `${normalized.startDate.replace(/-/g, '/')} – ${normalized.endDate.replace(/-/g, '/')}`
  }
  return normalized.period === 'month' ? 'month' : 'week'
}

function recapTargetLength(range) {
  const normalized = normalizeRecapRange(range)
  if (normalized.mode === 'custom' && normalized.dayCount) {
    if (normalized.dayCount <= 7) return 380
    if (normalized.dayCount <= 30) return 520
    return 640
  }
  return normalized.period === 'month' ? 520 : 380
}

function recapPayloadPeriod(range) {
  const normalized = normalizeRecapRange(range)
  if (normalized.mode === 'custom') return 'custom'
  return normalized.period === 'month' ? 'month' : 'week'
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
 * @param {'week'|'month'|object} range
 * @param {Array} records
 */
export function buildRecap(range, records) {
  const subset = getRecordsInRecapWindow(range, records)
  const normalized = normalizeRecapRange(range)

  const moodCounts = {}
  for (const r of subset) {
    const id = r.moodEmojiId || 'unknown'
    moodCounts[id] = (moodCounts[id] || 0) + 1
  }
  const sorted = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])
  const topId = sorted[0]?.[0]

  const period =
    normalized.mode === 'custom'
      ? 'custom'
      : normalized.period === 'month'
        ? 'month'
        : 'week'
  const title =
    period === 'month'
      ? 'monthlyRecapTitle'
      : period === 'week'
        ? 'weeklyRecapTitle'
        : 'customRecapTitle'
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
    rangeMode: normalized.mode,
    startDate: normalized.startDate || null,
    endDate: normalized.endDate || null,
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
 * @param {'week'|'month'|object} range
 * @param {Array} records
 * @param {(id: string) => string} moodLabelResolver
 * @param {string} locale
 * @param {{
 *   targetLength?: number,
 *   generateStructuredRecap?: boolean,
 *   systemHint?: string
 * }} [options]
 */
export function buildRecapCompletionPayload(range, records, moodLabelResolver, locale = 'zh', options = {}) {
  const isEn = locale === 'en' || locale?.startsWith?.('en')
  const normalized = normalizeRecapRange(range)
  const subset = getRecordsInRecapWindow(range, records)
  const localRecap = buildRecap(range, records)
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

  const rawTarget = options.targetLength ?? recapTargetLength(range)
  const targetLength = Math.min(900, Math.max(200, Number(rawTarget) || recapTargetLength(range)))

  const baseHint = isEn
    ? 'Analyze mood diary entries. Output one JSON line only with keys: overview, mood_trend, themes (array of strings), highlight, suggestion, recap_text. Warm diary tone; no medical claims.'
    : '分析心情日记条目。仅输出一行 JSON，键名：overview、mood_trend、themes（字符串数组）、highlight、suggestion、recap_text。语气温暖、具体，勿编造未出现的内容，勿做医疗诊断。'
  const extraHint = String(options.systemHint || '').trim()
  const systemHintMerged = extraHint ? `${baseHint}\n\n${extraHint}` : baseHint
  const system_hint = systemHintMerged.slice(0, MOOD_RECAP_SYSTEM_HINT_MAX)

  const payload = {
    period: recapPayloadPeriod(range),
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

  if (normalized.mode === 'custom' && normalized.startDate && normalized.endDate) {
    payload.date_from = normalized.startDate
    payload.date_to = normalized.endDate
    payload.start_date = normalized.startDate
    payload.end_date = normalized.endDate
  }

  return payload
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
  let periodLabel
  if (recap.period === 'custom' && recap.startDate && recap.endDate) {
    periodLabel = t('moodDiary.recapPeriodCustom', {
      start: recap.startDate.replace(/-/g, '/'),
      end: recap.endDate.replace(/-/g, '/')
    })
  } else {
    periodLabel =
      recap.period === 'month'
        ? t('moodDiary.recapPeriodMonth')
        : t('moodDiary.recapPeriodWeek')
  }
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
