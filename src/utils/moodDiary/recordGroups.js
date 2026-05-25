import { getRecordsSorted } from '@/utils/moodDiary/records'

export function getRecentPosters(limit = 3) {
  return getRecordsSorted()
    .filter((r) => r.posterDataUrl)
    .slice(0, limit)
    .map((r) => ({
      ...r,
      thumbUrl: r.posterDataUrl
    }))
}

/** 合并本地与云端记录，云端优先保留 */
export function mergeBookRecords(localRecords, cloudRecords) {
  const seen = new Set()
  const merged = []
  const push = (r) => {
    if (!r?.posterDataUrl) return
    const key = r.cloudId || r.id || r.posterDataUrl
    if (seen.has(key)) return
    seen.add(key)
    merged.push(r)
  }
  for (const r of cloudRecords) push(r)
  for (const r of localRecords) push(r)
  return merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

/** @returns {{ key: string, label: string, records: object[] }[]} */
export function groupRecordsFromList(records, locale = 'zh') {
  const sorted = [...records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  const map = new Map()
  for (const r of sorted) {
    const d = new Date(r.createdAt || Date.now())
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  return [...map.entries()].map(([key, recordsInMonth]) => ({
    key,
    label: formatMonthLabel(key, locale),
    records: recordsInMonth
  }))
}

/** @returns {{ key: string, label: string, records: object[] }[]} */
export function groupRecordsByMonth(locale = 'zh') {
  return groupRecordsFromList(getRecordsSorted(), locale)
}

function formatMonthLabel(key, locale) {
  const [y, m] = key.split('-').map(Number)
  if (locale === 'zh' || locale?.startsWith?.('zh')) {
    return `${y}年${m}月`
  }
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString(locale || 'en', { year: 'numeric', month: 'long' })
}

/** @returns {Map<number, object[]>} day (1-31) -> records */
export function getRecordsForCalendarMonth(year, month, records) {
  const sorted = records
    ? [...records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    : getRecordsSorted()
  const byDay = new Map()
  for (const r of sorted) {
    if (!r?.posterDataUrl) continue
    const d = new Date(r.createdAt || Date.now())
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    const day = d.getDate()
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day).push(r)
  }
  return byDay
}

export function buildCalendarCells(year, month) {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })
  return cells
}

/** Last N days emotion timeline for dashboard */
export function buildEmotionTimeline(dayCount = 14, locale = 'zh') {
  const sorted = getRecordsSorted()
  const byDateKey = new Map()
  for (const r of sorted) {
    const d = new Date(r.createdAt || Date.now())
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDateKey.has(key)) byDateKey.set(key, [])
    byDateKey.get(key).push(r)
  }
  const loc = locale === 'zh' || locale?.startsWith?.('zh') ? 'zh-CN' : 'en-US'
  const items = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const recs = byDateKey.get(key) || []
    const latest = recs[0]
    items.push({
      date: d,
      dateKey: key,
      day: d.getDate(),
      weekday: d.toLocaleDateString(loc, { weekday: 'short' }),
      records: recs,
      moodEmojiId: latest?.moodEmojiId || latest?.mood || null,
      moodLabel: latest?.moodLabel || '',
      hasRecord: recs.length > 0
    })
  }
  return items
}
