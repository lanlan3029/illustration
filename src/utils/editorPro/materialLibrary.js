const STATIC_ORIGIN = 'https://static.kidstory.cc/'

export function materialImageUrl(item) {
  let value = item?.content || item?.image_url || item?.character_image_url || ''
  if (Array.isArray(value)) value = value[0]
  if (typeof value !== 'string' || !value.trim()) return ''
  value = value.trim()
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return STATIC_ORIGIN + value.replace(/^\/+/, '')
}

export function materialPreviewUrl(item) {
  const preview = item?.thumbnail || item?.thumbnail_url || item?.thumb_url
  return materialImageUrl({ content: preview }) || materialImageUrl(item)
}

export function extractMaterialList(data) {
  if (data?.code != null && Number(data.code) !== 0 && data.desc !== 'success') {
    throw new Error('Material API rejected the request')
  }
  for (const value of [data?.message, data?.list, data?.items, data?.data,
    data?.data?.data, data?.data?.list, data?.data?.items, data?.data?.message]) {
    if (Array.isArray(value)) return value
  }
  throw new Error('Invalid material list response')
}

// IDs catch repeated records; URLs catch separate records pointing to the same image.
export function mergeMaterials(current, incoming) {
  const ids = new Set()
  const sources = new Set()
  const result = []
  for (const item of [...current, ...incoming]) {
    const src = materialImageUrl(item)
    const id = item?._id || item?.id
    if (!src) continue
    const sourceKey = src.startsWith(STATIC_ORIGIN) ? src.split(/[?#]/)[0] : src
    const duplicate = (id && ids.has(String(id))) || sources.has(sourceKey)
    if (id) ids.add(String(id))
    sources.add(sourceKey)
    if (!duplicate) result.push(item)
  }
  return result
}

export function createMaterialPager({ request, state, now = Date.now, cacheMs = 300000 }) {
  const cache = new Map()
  let revision = 0
  let controller = null
  let disposed = false
  let query = { type: 'decoration', keyword: '' }
  Object.assign(state, { items: [], loading: false, hasMore: true, error: false, nextPage: 1, duplicatePages: 0 })

  const queryKey = () => JSON.stringify(query)
  function invalidate() {
    revision += 1
    controller?.abort()
    controller = null
    state.loading = false
  }

  async function loadMore() {
    if (disposed || state.loading || !state.hasMore) return false
    const currentRevision = revision
    const requestedPage = state.nextPage
    const requestedQuery = { ...query }
    const currentController = new AbortController()
    controller = currentController
    state.loading = true
    state.error = false
    try {
      const response = await request(requestedQuery, requestedPage, currentController.signal)
      if (disposed || currentRevision !== revision) return false
      const incoming = extractMaterialList(response)
      const merged = mergeMaterials(state.items, incoming)
      state.duplicatePages = incoming.length && merged.length === state.items.length ? state.duplicatePages + 1 : 0
      state.items = merged
      state.hasMore = incoming.length > 0 && state.duplicatePages < 2
      state.nextPage = requestedPage + 1
      cache.delete(queryKey())
      cache.set(queryKey(), { items: [...merged], hasMore: state.hasMore,
        nextPage: state.nextPage, duplicatePages: state.duplicatePages, savedAt: now() })
      if (cache.size > 16) cache.delete(cache.keys().next().value)
      return true
    } catch (error) {
      if (!disposed && currentRevision === revision && !currentController.signal.aborted) state.error = true
      return false
    } finally {
      if (currentRevision === revision) {
        state.loading = false
        controller = null
      }
    }
  }

  async function reset(nextQuery, { defer = false } = {}) {
    if (disposed) return false
    invalidate()
    query = { type: nextQuery.type || 'decoration', keyword: String(nextQuery.keyword || '').trim() }
    Object.assign(state, { items: [], hasMore: true, error: false, nextPage: 1, duplicatePages: 0 })
    if (defer) return false
    const saved = cache.get(queryKey())
    if (saved && now() - saved.savedAt < cacheMs) {
      Object.assign(state, { items: [...saved.items], hasMore: saved.hasMore,
        nextPage: saved.nextPage, duplicatePages: saved.duplicatePages })
      return true
    }
    return loadMore()
  }

  return { reset, loadMore, pause: invalidate, dispose() { disposed = true; invalidate(); cache.clear() } }
}
