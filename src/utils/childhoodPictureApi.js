/** 童年场景群 — 图元 API（type=childhood） */

import { createPersonFromPicture, hashSeed } from '@/utils/avatarCrowd'

export const CHILDHOOD_PICTURE_TYPE = 'childhood'
export const CHILDHOOD_SHARE_POSTER_TYPE = '_orphan'

function seededUnit(seed) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

export function extractPictureRecord(payload) {
  return payload?.message ?? payload?.data ?? payload
}

export function extractPictureId(record) {
  if (!record) return ''
  return String(record._id || record.id || '')
}

/** 从列表中挑选散落背景图（排除主角） */
export function pickCrowdImageUrls(items, options = {}) {
  const { excludeId = '', limit = 10, seed = 0 } = options
  const pool = (items || [])
    .map((item) => ({
      id: extractPictureId(item),
      url: resolvePictureUrl(item),
    }))
    .filter((item) => item.url && item.id !== excludeId)

  if (!pool.length) return []

  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededUnit(hashSeed(`${seed}-${i}`)) * (i + 1))
    const tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }

  return shuffled.slice(0, limit).map((item) => item.url)
}

function withCacheBust(url, item) {
  if (!url || !item?.updatedAt) return url
  const stamp = encodeURIComponent(item.updatedAt)
  return url.includes('?') ? `${url}&v=${stamp}` : `${url}?v=${stamp}`
}

export function resolvePictureUrl(item) {
  if (!item) return ''
  let content = item.content
  if (Array.isArray(content)) content = content[0]
  if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
    return withCacheBust(content, item)
  }
  if (typeof content === 'string' && content.trim()) {
    return withCacheBust(
      `https://static.kidstory.cc/${content.replace(/^\//, '')}`,
      item
    )
  }
  const fallback = item.picture || item.image_url || item.image || item.url
  if (!fallback) return ''
  if (typeof fallback === 'string' && (fallback.startsWith('http://') || fallback.startsWith('https://'))) {
    return withCacheBust(fallback, item)
  }
  return withCacheBust(
    `https://static.kidstory.cc/${String(fallback).replace(/^\//, '')}`,
    item
  )
}

function normalizePictureList(payload) {
  const list = payload?.message ?? payload?.data ?? payload?.list ?? payload?.items ?? payload
  return Array.isArray(list) ? list : []
}

/** 后端 config.per_page 默认 18，且 GET /picture/ 会忽略客户端 limit */
const BACKEND_PAGE_SIZE = 18

async function fetchChildhoodScenesPage(http, page, sort) {
  const res = await http.get('/picture/', {
    params: {
      type: CHILDHOOD_PICTURE_TYPE,
      sort_param: sort.param,
      sort_num: sort.num,
      page,
    },
  })
  const data = res?.data || {}
  if (data.desc && data.desc !== 'success' && data.code !== 0 && data.code !== '0') {
    throw new Error(data.message || '加载童年场景失败')
  }
  return normalizePictureList(data)
}

/**
 * 拉取童年场景图元（公开，无需登录）
 * 默认分页拉全量，避免新上传条目因 per_page=18 + 升序排在第 2 页而丢失
 * @param {import('axios').AxiosInstance} http
 * @param {{ page?: number, fetchAll?: boolean, maxPages?: number, sort_param?: string, sort_num?: string }} options
 */
export async function fetchChildhoodScenes(http, options = {}) {
  const sort = {
    param: options.sort_param || 'createdAt',
    num: options.sort_num || 'asc',
  }
  const maxPages = options.maxPages || 40

  if (options.page && options.fetchAll === false) {
    return fetchChildhoodScenesPage(http, options.page, sort)
  }

  const all = []
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await fetchChildhoodScenesPage(http, page, sort)
    if (!batch.length) break
    all.push(...batch)
    if (batch.length < BACKEND_PAGE_SIZE) break
  }
  return all
}

/** 上传回执 → 画廊 person（可先用本地 dataUrl 即时展示） */
export function createFreshPersonFromRecord(record, index = 0, imageUrlOverride = '') {
  const person = createPersonFromPicture(record, index)
  const id = extractPictureId(record)
  if (id) person.id = id
  if (imageUrlOverride) {
    person.imageUrl = imageUrlOverride
  }
  return person
}
