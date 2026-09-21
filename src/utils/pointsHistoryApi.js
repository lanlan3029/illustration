/**
 * 积分流水
 * GET /user/points/history?page=1&pageSize=20&kind=all|earn|consume
 */

export async function fetchPointsHistory(http, { page = 1, pageSize = 20, kind = 'all' } = {}) {
  const token = localStorage.getItem('token') || '';
  const res = await http.get('/user/points/history', {
    params: { page, pageSize, kind },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 30000,
  });
  const data = res?.data || {};
  const ok = data.code === 0 || data.desc === 'success';
  if (!ok) {
    const msg = data.message || data.desc || '加载失败';
    throw new Error(typeof msg === 'string' ? msg : '加载失败');
  }
  return data.message || { list: [], total: 0, page: 1, page_size: pageSize };
}
