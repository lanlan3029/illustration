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

/** @returns {{ key: string, label: string, records: object[] }[]} */
export function groupRecordsByMonth(locale = 'zh') {
  const sorted = getRecordsSorted()
  const map = new Map()
  for (const r of sorted) {
    const d = new Date(r.createdAt || Date.now())
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  return [...map.entries()].map(([key, records]) => ({
    key,
    label: formatMonthLabel(key, locale),
    records
  }))
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
export function getRecordsForCalendarMonth(year, month) {
  const sorted = getRecordsSorted()
  const byDay = new Map()
  for (const r of sorted) {
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
