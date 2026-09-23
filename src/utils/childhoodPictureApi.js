/** 童年场景群 — 图元 API（type=childhood） */

export const CHILDHOOD_PICTURE_TYPE = 'childhood'

export function resolvePictureUrl(item) {
  if (!item) return ''
  let content = item.content
  if (Array.isArray(content)) content = content[0]
  if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
    return content
  }
  if (typeof content === 'string' && content.trim()) {
    return `https://static.kidstory.cc/${content.replace(/^\//, '')}`
  }
  const fallback = item.picture || item.image_url || item.image || item.url
  if (!fallback) return ''
  if (typeof fallback === 'string' && (fallback.startsWith('http://') || fallback.startsWith('https://'))) {
    return fallback
  }
  return `https://static.kidstory.cc/${String(fallback).replace(/^\//, '')}`
}

function normalizePictureList(payload) {
  const list = payload?.message ?? payload?.data ?? payload?.list ?? payload?.items ?? payload
  return Array.isArray(list) ? list : []
}

/**
 * 拉取童年场景图元（公开，无需登录）
 * @param {import('axios').AxiosInstance} http
 * @param {{ page?: number, limit?: number }} options
 */
export async function fetchChildhoodScenes(http, options = {}) {
  const page = options.page || 1
  const limit = options.limit || 60
  const res = await http.get('/picture/', {
    params: {
      type: CHILDHOOD_PICTURE_TYPE,
      sort_param: 'createdAt',
      sort_num: 'asc',
      page,
      limit,
    },
  })
  const data = res?.data || {}
  if (data.desc && data.desc !== 'success' && data.code !== 0 && data.code !== '0') {
    throw new Error(data.message || '加载童年场景失败')
  }
  return normalizePictureList(data)
}
