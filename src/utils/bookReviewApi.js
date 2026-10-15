export async function bookReviewRequest(http, path, { method = 'get', params, data } = {}) {
  const response = await http.request({
    url: `/admin/books${path}`, method, params, data, timeout: 30000,
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
  })
  const body = response.data || {}
  if (!(body.code === 0 || body.code === '0' || body.desc === 'success')) {
    throw new Error(typeof body.message === 'string' ? body.message : '操作失败，请稍后重试')
  }
  return body
}
