import axios from 'axios'

const STATUS_PATH = 'pb/mood-assets/status'
const MANIFEST_PATH = 'pb/mood-assets/manifest'
const DEFAULT_BASE_URL = 'https://api.kidstory.cc/static/mood-vessel/png'
const DEFAULT_EXCLUDED = ['thumbs-up', 'star-eyes']

/** @type {{ configured?: boolean, version?: string, baseUrl?: string, pickerExcludedIds?: string[], items?: object[] } | null} */
let manifestCache = null
let hydratePromise = null
let assetsVersion = 0
const listeners = new Set()

function notify() {
  assetsVersion += 1
  listeners.forEach((fn) => {
    try {
      fn(assetsVersion)
    } catch {
      /* ignore */
    }
  })
}

function unwrapPayload(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.data && typeof payload.data === 'object') return payload.data
  if (payload.message && typeof payload.message === 'object' && !Array.isArray(payload.message)) {
    return payload.message
  }
  return payload
}

function indexItems(items) {
  const map = new Map()
  ;(items || []).forEach((item) => {
    if (item?.id) map.set(item.id, item)
  })
  return map
}

/** @type {Map<string, object>} */
let itemById = new Map()

/**
 * 订阅清单更新（用于触发 Vue 重新渲染）。
 * @param {(version: number) => void} fn
 * @returns {() => void}
 */
export function onMoodAssetsChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getMoodAssetsVersion() {
  return assetsVersion
}

export function getMoodAssetsManifest() {
  return manifestCache
}

export function getPickerExcludedIds() {
  const remote = manifestCache?.pickerExcludedIds
  if (Array.isArray(remote) && remote.length) return remote
  return DEFAULT_EXCLUDED
}

/**
 * 按 id 解析展示用 PNG URL（优先 manifest.url）。
 * @param {string} id
 */
export function pngAssetPath(id) {
  const key = String(id || '').trim()
  if (!key) return ''

  const remote = itemById.get(key)
  if (remote?.url) return remote.url
  if (remote?.available === false) return ''

  const base = (manifestCache?.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')
  const version = manifestCache?.version
  const url = `${base}/${key}.png`
  return version ? `${url}?v=${encodeURIComponent(version)}` : url
}

/**
 * 启动时拉取 status（可选）+ manifest。
 * @returns {Promise<object|null>}
 */
export async function hydrateMoodAssets() {
  if (hydratePromise) return hydratePromise

  hydratePromise = (async () => {
    try {
      try {
        await axios.get(STATUS_PATH, { timeout: 8000 })
      } catch {
        // status 仅探活，失败不阻断
      }

      const res = await axios.get(MANIFEST_PATH, { timeout: 15000 })
      const data = unwrapPayload(res.data)
      if (!data || data.configured === false) {
        manifestCache = null
        itemById = new Map()
        notify()
        return null
      }

      const items = Array.isArray(data.items) ? data.items : []
      manifestCache = {
        configured: data.configured !== false,
        version: data.version || '',
        baseUrl: data.baseUrl || DEFAULT_BASE_URL,
        pickerExcludedIds: Array.isArray(data.pickerExcludedIds)
          ? data.pickerExcludedIds
          : DEFAULT_EXCLUDED,
        items,
      }
      itemById = indexItems(items)
      notify()
      return manifestCache
    } catch (err) {
      console.warn('[moodAssets] hydrate failed, using CDN fallback URLs', err)
      manifestCache = null
      itemById = new Map()
      notify()
      return null
    } finally {
      hydratePromise = null
    }
  })()

  return hydratePromise
}

export { DEFAULT_BASE_URL as MOOD_ASSETS_DEFAULT_BASE_URL }
