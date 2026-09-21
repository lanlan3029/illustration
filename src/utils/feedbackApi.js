/**
 * 投诉与改进建议
 * POST /feedback { content, locale? }
 */

export async function submitUserFeedback(http, { content = '', locale = 'zh', apiBaseUrl = '' } = {}) {
  const text = String(content || '').trim();
  const apiUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/+$/, '')}/feedback` : '/feedback';
  const token = localStorage.getItem('token') || '';
  const res = await http.post(
    apiUrl,
    { content: text, locale },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    }
  );
  const data = res?.data || {};
  const ok = data.code === 0 || data.desc === 'success';
  if (!ok) {
    const msg = data.message || data.desc || '提交失败';
    throw new Error(typeof msg === 'string' ? msg : '提交失败');
  }
  return data.message || data.data || data;
}
