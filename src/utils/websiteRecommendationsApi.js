/**
 * 网站推荐
 * 公开：GET /api/website-recommendations
 * 管理：/api/admin/website-recommendations
 */
import { DEFAULT_API_ORIGIN } from '@/utils/createCharacterTask'

function resolveApiRoot(apiBaseUrl) {
  const raw = apiBaseUrl || process.env.VUE_APP_API_BASE_URL || DEFAULT_API_ORIGIN
  return String(raw).replace(/\/$/, '')
}

function unwrapData(res) {
  return res?.data?.data || res?.data?.message || res?.data || res
}

function authHeaders(extra = {}) {
  const headers = { ...extra }
  if (headers.Authorization === undefined) {
    const token = localStorage.getItem('token')
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function fetchWebsiteRecommendations(http, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const params = {}
  if (opts.featured) params.featured = 1
  const res = await http.get(`${root}/api/website-recommendations/`, {
    params,
    timeout: 30000,
    headers: authHeaders(opts.headers),
  })
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '获取推荐失败')
  }
  return unwrapData(res) || []
}

export async function adminListWebsiteRecommendations(http, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.get(`${root}/api/admin/website-recommendations/`, {
    timeout: 30000,
    headers: authHeaders(opts.headers),
  })
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '获取列表失败')
  }
  return unwrapData(res) || []
}

export async function adminCreateWebsiteRecommendation(http, formData, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.post(`${root}/api/admin/website-recommendations/`, formData, {
    timeout: 120000,
    headers: authHeaders({
      ...(opts.headers || {}),
      'Content-Type': 'multipart/form-data',
    }),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '创建失败')
  }
  return unwrapData(res)
}

export async function adminUpdateWebsiteRecommendation(http, id, formData, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.put(`${root}/api/admin/website-recommendations/${id}`, formData, {
    timeout: 120000,
    headers: authHeaders({
      ...(opts.headers || {}),
      'Content-Type': 'multipart/form-data',
    }),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '更新失败')
  }
  return unwrapData(res)
}

export async function adminDeleteWebsiteRecommendation(http, id, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.delete(`${root}/api/admin/website-recommendations/${id}`, {
    timeout: 30000,
    headers: authHeaders(opts.headers),
  })
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '删除失败')
  }
  return unwrapData(res)
}
