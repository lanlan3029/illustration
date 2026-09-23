/** 童年场景群 — 布局与用户当日提交 */

import { resolvePictureUrl } from '@/utils/childhoodPictureApi'

export const CROWD_STORAGE_KEY = 'childhood_avatar_crowd'

/** 场景图平均高宽比（用于砖墙布局估算） */
export const SCENE_ASPECT = 0.82

export const LAYOUT = {
  perRow: 5,
  xGap: 0.78,
  yGap: 0.36,
  brick: 0.48,
  topPad: 20,
  sidePad: 12,
  bottomPad: 56,
}

export function hashSeed(str) {
  let h = 2166136261
  const s = String(str || '')
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function makeJitter() {
  return {
    x: (Math.random() - 0.5) * 0.08,
    y: (Math.random() - 0.5) * 0.05,
    s: 0.94 + Math.random() * 0.08,
    bob: (Math.random() - 0.5) * 0.02,
  }
}

export function makeSeededJitter(seed) {
  const r1 = ((seed * 9301 + 49297) % 233280) / 233280
  const r2 = (((seed + 1) * 9301 + 49297) % 233280) / 233280
  const r3 = (((seed + 2) * 9301 + 49297) % 233280) / 233280
  const r4 = (((seed + 3) * 9301 + 49297) % 233280) / 233280
  return {
    x: (r1 - 0.5) * 0.08,
    y: (r2 - 0.5) * 0.05,
    s: 0.94 + r3 * 0.08,
    bob: (r4 - 0.5) * 0.02,
  }
}

/** 图元 API 条目 → 场景群 person */
export function createPersonFromPicture(item, index = 0) {
  const id = item._id || item.id || `childhood-picture-${index}`
  const seed = hashSeed(id)
  const note = (item.description || '').trim() || (item.title || '').trim()
  return {
    id,
    createdAt: item.createdAt ? new Date(item.createdAt).getTime() : 0,
    note,
    title: item.title || '',
    imageUrl: resolvePictureUrl(item),
    isSeed: true,
    jitter: makeSeededJitter(seed),
    visible: false,
    tipOpen: false,
  }
}

export function isPersonToday(person) {
  if (person?.isSeed) return false
  const ts = person?.createdAt || Number.parseInt(String(person?.id || '').split('-')[0], 10)
  if (!ts || Number.isNaN(ts)) return false
  const d = new Date(ts)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function filterTodayPeople(people) {
  return (people || []).filter(isPersonToday)
}

export function createPerson(note) {
  const createdAt = Date.now()
  const text = (note || '').trim()
  return {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    isSeed: false,
    note: text,
    imageUrl: '',
    jitter: makeJitter(),
    visible: false,
    tipOpen: false,
  }
}

export function layoutPeople(people, containerWidth, personWidth, parentHeight = 0) {
  const n = people.length
  if (!n) {
    return { height: Math.max(parentHeight, 320), positions: [] }
  }

  const w = personWidth
  const h = w * SCENE_ASPECT
  const usable = Math.max(280, containerWidth - LAYOUT.sidePad * 2)
  const brickShift = w * LAYOUT.brick

  const perRow = Math.max(
    3,
    Math.min(LAYOUT.perRow, Math.floor((usable - brickShift) / (w * LAYOUT.xGap)))
  )
  const rows = Math.ceil(n / perRow)

  const contentH = LAYOUT.topPad + Math.max(0, rows - 1) * h * LAYOUT.yGap + h + LAYOUT.bottomPad
  const totalH = Math.max(parentHeight, contentH, 320)
  const bottomRowTop = totalH - LAYOUT.bottomPad - h
  const baseX = LAYOUT.sidePad

  const positions = people.map((person, i) => {
    const rowFromFront = Math.floor(i / perRow)
    const col = i % perRow
    const j = person.jitter || { x: 0, y: 0, s: 1, bob: 0 }
    const brick = rowFromFront % 2 === 1 ? brickShift : 0

    return {
      id: person.id,
      left: baseX + brick + col * w * LAYOUT.xGap + j.x * w,
      top: bottomRowTop - rowFromFront * h * LAYOUT.yGap + j.y * h + j.bob * h,
      baseScale: j.s,
      zIndex: 2000 - rowFromFront * 40 + col,
    }
  })

  return { height: totalH, positions }
}

export function loadCrowdFromStorage() {
  try {
    const raw = localStorage.getItem(CROWD_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const today = filterTodayPeople(parsed)
    if (today.length !== parsed.length) {
      saveCrowdToStorage(today)
    }
    return today.map((person) => ({
      ...person,
      imageUrl: person.imageUrl || '',
    }))
  } catch {
    return []
  }
}

export function saveCrowdToStorage(people) {
  try {
    const today = filterTodayPeople(people)
    const payload = today.map(({ id, createdAt, note, jitter }) => ({
      id,
      createdAt,
      note,
      jitter,
    }))
    localStorage.setItem(CROWD_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}
