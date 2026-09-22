/** 童年人群 — 部件拼接与砖墙布局（参照 avatar_crowd_demo.html） */

const BASE = (process.env.BASE_URL || '/').replace(/\/?$/, '/')
export const PARTS_BASE = `${BASE}avatar_parts/`

export const CROWD_STORAGE_KEY = 'childhood_avatar_crowd'

export const LAYOUT = {
  perRow: 6,
  xGap: 0.72,
  yGap: 0.4,
  brick: 0.5,
  topPad: 20,
  sidePad: 16,
  bottomPad: 64,
}

export const PERSON_ASPECT = 1533 / 1136

export const LAYER_SPECS = [
  {
    cls: 'avatar-crowd__layer avatar-crowd__layer--body',
    kind: 'body',
    left: 147 / 1136,
    top: 639 / 1533,
    width: 818 / 1136,
    height: 733 / 1533,
    zIndex: 1,
  },
  {
    cls: 'avatar-crowd__layer avatar-crowd__layer--head',
    kind: 'head',
    left: 372 / 1136,
    top: 180 / 1533,
    width: 473 / 1136,
    height: 567 / 1533,
    zIndex: 2,
  },
  {
    cls: 'avatar-crowd__layer avatar-crowd__layer--face',
    kind: 'face',
    left: 531 / 1136,
    top: 366 / 1533,
    width: 289 / 1136,
    height: 293 / 1533,
    zIndex: 3,
  },
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickSeeded(arr, seed) {
  if (!arr.length) return ''
  return arr[seed % arr.length]
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

function stemOf(filename) {
  return String(filename || '').replace(/\.svg$/i, '')
}

function vibeOf(styleTags, kind, filename) {
  if (!styleTags?.[kind]) return 'n'
  return styleTags[kind][stemOf(filename)] || 'n'
}

function filterByVibes(styleTags, kind, files, allowedVibes) {
  const hit = files.filter((f) => allowedVibes.indexOf(vibeOf(styleTags, kind, f)) >= 0)
  return hit.length ? hit : files
}

export function partUrl(kind, filename) {
  return `${PARTS_BASE}${encodeURIComponent(kind)}/${encodeURIComponent(filename)}`
}

export function makeJitter() {
  return {
    x: (Math.random() - 0.5) * 0.06,
    y: (Math.random() - 0.5) * 0.04,
    s: 0.96 + Math.random() * 0.06,
    bob: (Math.random() - 0.5) * 0.02,
  }
}

export function makeSeededJitter(seed) {
  const r1 = ((seed * 9301 + 49297) % 233280) / 233280
  const r2 = (((seed + 1) * 9301 + 49297) % 233280) / 233280
  const r3 = (((seed + 2) * 9301 + 49297) % 233280) / 233280
  const r4 = (((seed + 3) * 9301 + 49297) % 233280) / 233280
  return {
    x: (r1 - 0.5) * 0.06,
    y: (r2 - 0.5) * 0.04,
    s: 0.96 + r3 * 0.06,
    bob: (r4 - 0.5) * 0.02,
  }
}

export function randomRecipe(manifest, styleTags) {
  const body = pick(manifest.body)
  const bodyVibe = vibeOf(styleTags, 'body', body)
  const allowedHeads = styleTags?.compatible?.[bodyVibe] || ['f', 'm', 'n']
  const head = pick(filterByVibes(styleTags, 'head', manifest.head, allowedHeads))
  const face = pick(manifest.face)
  return { body, face, head, vibe: bodyVibe }
}

export function seededRecipe(manifest, styleTags, seedKey) {
  const seed = hashSeed(seedKey)
  const body = pickSeeded(manifest.body, seed)
  const bodyVibe = vibeOf(styleTags, 'body', body)
  const allowedHeads = styleTags?.compatible?.[bodyVibe] || ['f', 'm', 'n']
  const headPool = filterByVibes(styleTags, 'head', manifest.head, allowedHeads)
  const head = pickSeeded(headPool, seed + 17)
  const face = pickSeeded(manifest.face, seed + 53)
  return { body, face, head, vibe: bodyVibe }
}

export function createSeedPerson(story, manifest, styleTags) {
  const seedKey = story.user_id || story.id
  const seed = hashSeed(seedKey)
  return {
    id: story.id,
    createdAt: 0,
    note: story.content,
    username: story.username || '',
    user_id: story.user_id || '',
    isSeed: true,
    recipe: seededRecipe(manifest, styleTags, seedKey),
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

export function createPerson(note, manifest, styleTags) {
  const createdAt = Date.now()
  return {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    isSeed: false,
    note: (note || '').trim(),
    recipe: randomRecipe(manifest, styleTags),
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
  const h = w * PERSON_ASPECT
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
    return today
  } catch {
    return []
  }
}

export function saveCrowdToStorage(people) {
  try {
    const today = filterTodayPeople(people)
    const payload = today.map(({ id, createdAt, note, recipe, jitter }) => ({
      id,
      createdAt,
      note,
      recipe,
      jitter,
    }))
    localStorage.setItem(CROWD_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}
