/**
 * 图片编辑器画布草稿：IndexedDB 优先（含图片 dataURL 时体积大），
 * localStorage 仅作无图/小稿兜底。
 */

const DB_NAME = 'editorpro-draft'
const DB_VERSION = 1
const STORE = 'drafts'
const DRAFT_KEY = 'current'
const LS_FALLBACK_KEY = 'editorpro_canvas_draft'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const SKIP_IDS = new Set(['workspace', 'workspaceMask', 'coverMask', 'guidLine', 'guideline'])

function isSystemObject(obj) {
  if (!obj) return true
  const id = String(obj.id || obj.name || '')
  if (SKIP_IDS.has(id)) return true
  if (id.toLowerCase().includes('guidline') || id.toLowerCase().includes('guideline')) return true
  return false
}

export function canvasHasUserContent(canvas) {
  if (!canvas || typeof canvas.getObjects !== 'function') return false
  return canvas.getObjects().some((obj) => !isSystemObject(obj))
}

export function jsonHasUserContent(json) {
  const objects = json && json.objects
  if (!Array.isArray(objects)) return false
  return objects.some((obj) => !isSystemObject(obj))
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'))
  })
}

function writeLocalStorage(payload) {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(payload))
    return true
  } catch (e) {
    return false
  }
}

function readLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function isFresh(payload) {
  if (!payload || !payload.json) return false
  const savedAt = Number(payload.savedAt) || 0
  return Date.now() - savedAt < MAX_AGE_MS
}

export async function saveEditorproDraft(json) {
  if (!json) return false
  const payload = { json, savedAt: Date.now() }
  // 同步兜底：关闭页面前尽量先落 localStorage（大稿可能失败）
  writeLocalStorage(payload)
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
      tx.objectStore(STORE).put(payload, DRAFT_KEY)
    })
    return true
  } catch (e) {
    return writeLocalStorage(payload)
  }
}

/** 关闭页面前尽量同步落盘（优先 IndexedDB，失败再 LS） */
export function saveEditorproDraftSync(json) {
  if (!json) return false
  const payload = { json, savedAt: Date.now() }
  writeLocalStorage(payload)
  try {
    if (typeof indexedDB === 'undefined') return true
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => {
      try {
        const db = req.result
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(payload, DRAFT_KEY)
        tx.oncomplete = () => db.close()
        tx.onerror = () => db.close()
      } catch (e) {
        /* ignore */
      }
    }
  } catch (e) {
    /* ignore */
  }
  return true
}

/**
 * 把画布对象里的外链/blob 图尽量嵌成 dataURL，避免刷新后失效。
 * 失败则保留原 src。
 */
export async function buildEditorproDraftJson(canvas, getJson) {
  if (!canvas || typeof getJson !== 'function') return null
  let json
  try {
    json = typeof structuredClone === 'function'
      ? structuredClone(getJson())
      : JSON.parse(JSON.stringify(getJson()))
  } catch (e) {
    json = getJson()
  }
  if (!json || !Array.isArray(json.objects)) return json

  const live = canvas.getObjects()
  const tasks = []
  const walk = (obj, jsonObj) => {
    if (!obj || !jsonObj) return
    if ((obj.type === 'group' || jsonObj.type === 'group') && Array.isArray(jsonObj.objects)) {
      const children = obj.getObjects?.() || obj._objects || []
      children.forEach((child, i) => walk(child, jsonObj.objects[i]))
    }
    if (obj.type === 'image' || jsonObj.type === 'image') {
      tasks.push(
        (async () => {
          try {
            const src = jsonObj.src || obj.getSrc?.() || ''
            if (src.startsWith('data:')) return
            if (typeof obj.toDataURL === 'function') {
              jsonObj.src = obj.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: false })
            }
          } catch (e) {
            /* keep original src */
          }
        })()
      )
    }
  }
  live.forEach((obj, i) => walk(obj, json.objects[i]))
  if (tasks.length) await Promise.all(tasks)
  return json
}

export async function loadEditorproDraft() {
  let payload = null
  try {
    const db = await openDb()
    payload = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(DRAFT_KEY)
      req.onsuccess = () => {
        db.close()
        resolve(req.result || null)
      }
      req.onerror = () => {
        db.close()
        reject(req.error)
      }
    })
  } catch (e) {
    payload = null
  }
  if (!isFresh(payload)) {
    payload = readLocalStorage()
  }
  if (!isFresh(payload)) return null
  return payload.json
}

export async function clearEditorproDraft() {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
      tx.objectStore(STORE).delete(DRAFT_KEY)
    })
  } catch (e) {
    /* ignore */
  }
  try {
    localStorage.removeItem(LS_FALLBACK_KEY)
  } catch (e) {
    /* ignore */
  }
}
