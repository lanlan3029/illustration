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

function writeRecords(list) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(list.slice(0, MAX)))
    return true
  } catch (_) {
    return false
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
  writeRecords(list)
  return row
}

/** @param {string} id @param {object} partial */
export function updateRecord(id, partial) {
  if (!id) return null
  const list = getRecords()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) return null
  list[idx] = { ...list[idx], ...partial }
  writeRecords(list)
  return list[idx]
}

/** @param {string} id */
export function removeRecord(id) {
  if (!id) return false
  const list = getRecords().filter((r) => r.id !== id)
  return writeRecords(list)
}

export function getRecordsSorted() {
  return [...getRecords()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
