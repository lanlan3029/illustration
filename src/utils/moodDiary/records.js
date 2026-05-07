const RECORDS_KEY = 'mood_diary_records_v1'
const MAX = 600

export function getRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch (_) {
    return []
  }
}

/** @param {object} record */
export function addRecord(record) {
  const list = getRecords()
  const row = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    ...record
  }
  list.unshift(row)
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(list.slice(0, MAX)))
  } catch (_) {
    /* ignore */
  }
  return row
}

export function getRecordsSorted() {
  return [...getRecords()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
