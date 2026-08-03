import axios from 'axios'

const PUBLIC_PATH = 'api/illustration-styles'
const ADMIN_PATH = 'api/admin/illustration-styles'

function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.message)) return payload.message
  if (Array.isArray(payload.list)) return payload.list
  if (Array.isArray(payload.items)) return payload.items
  return []
}

function isOk(payload) {
  if (!payload) return false
  if (payload.code === 0 || payload.code === '0') return true
  if (payload.desc === 'success') return true
  return false
}

function authHeaders() {
  const token = localStorage.getItem('token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** @typedef {{ id: number, key: string, category: string, artStyle: string, elementDetails: string, imageUrl: string }} IllustrationStyleDto */

/**
 * @param {{ category?: string, locale?: 'zh'|'en' }} [options]
 * @returns {Promise<IllustrationStyleDto[]>}
 */
export async function fetchPublicIllustrationStyles(options = {}) {
  const params = {}
  if (options.category) params.category = options.category
  if (options.locale) params.locale = options.locale
  const res = await axios.get(`${PUBLIC_PATH}/`, { params })
  if (!isOk(res.data)) {
    throw new Error(res.data?.message || '加载风格列表失败')
  }
  return extractList(res.data)
}

/**
 * @param {{ enabledOnly?: boolean }} [options] 默认只拉启用中的（软删后不再出现）
 * @returns {Promise<IllustrationStyleDto[]>}
 */
export async function fetchAdminIllustrationStyles(options = {}) {
  const params = {}
  // 管理端默认 is_enabled 不传会返回含下线项；上传页默认只要启用中的
  if (options.enabledOnly !== false) {
    params.is_enabled = true
  }
  const res = await axios.get(`${ADMIN_PATH}/`, {
    headers: authHeaders(),
    params,
  })
  if (!isOk(res.data)) {
    throw new Error(res.data?.message || '加载管理端风格列表失败')
  }
  return extractList(res.data)
}

/**
 * @param {FormData} formData
 * @returns {Promise<IllustrationStyleDto>}
 */
export async function createIllustrationStyle(formData) {
  const res = await axios.post(`${ADMIN_PATH}/`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  })
  if (!isOk(res.data)) {
    throw new Error(res.data?.message || '创建风格失败')
  }
  return res.data?.data || res.data?.message || res.data
}

/**
 * @param {number|string} id
 * @param {FormData} formData
 * @returns {Promise<IllustrationStyleDto>}
 */
export async function updateIllustrationStyle(id, formData) {
  const res = await axios.put(`${ADMIN_PATH}/${id}`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  })
  if (!isOk(res.data)) {
    throw new Error(res.data?.message || '更新风格失败')
  }
  return res.data?.data || res.data?.message || res.data
}

/**
 * @param {number|string} id
 * @param {{ hard?: boolean }} [options]
 */
export async function deleteIllustrationStyle(id, options = {}) {
  const url = options.hard ? `${ADMIN_PATH}/${id}?hard=1` : `${ADMIN_PATH}/${id}`
  const res = await axios.delete(url, { headers: authHeaders() })
  if (!isOk(res.data)) {
    throw new Error(res.data?.message || '删除风格失败')
  }
  return res.data
}

/**
 * @param {object|object[]} body
 */
export async function importIllustrationStyles(body) {
  const res = await axios.post(`${ADMIN_PATH}/import`, body, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
  })
  if (!isOk(res.data)) {
    throw new Error(res.data?.message || '批量导入失败')
  }
  return res.data
}
