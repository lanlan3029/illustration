/**
 * 生图历史（基于 image_generation_tasks）
 * GET /user/generation-history?page=1&pageSize=20&source=
 */

export async function fetchGenerationHistory(http, { page = 1, pageSize = 20, source = '' } = {}) {
  const token = localStorage.getItem('token') || '';
  const params = { page, pageSize };
  if (source) params.source = source;
  const res = await http.get('/user/generation-history', {
    params,
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

/**
 * 将生成历史中的图片收集到「我的创作」
 */
export async function collectGenerationToIllustration(http, { imageUrl, prompt = '', title = '' } = {}) {
  const token = localStorage.getItem('token') || '';
  if (!token) throw new Error('请先登录');

  let pictureValue = String(imageUrl || '').trim();
  if (
    pictureValue &&
    !pictureValue.startsWith('http://') &&
    !pictureValue.startsWith('https://') &&
    !pictureValue.startsWith('data:')
  ) {
    pictureValue = `https://static.kidstory.cc/${pictureValue.replace(/^\/+/, '')}`;
  }
  if (!pictureValue) throw new Error('图片地址无效');

  const rawPrompt = String(prompt || '').trim();
  const description = (rawPrompt || '从历史记录收集的插画').slice(0, 10000);
  let illTitle = String(title || '').trim() || 'AI插画';
  if (!title && rawPrompt) {
    const trimmed = rawPrompt.replace(/\s+/g, ' ').trim();
    if (trimmed) {
      illTitle = trimmed.length > 8 ? `${trimmed.slice(0, 8)}…` : trimmed;
    }
  }

  const form = new FormData();
  if (pictureValue.startsWith('data:')) {
    const blob = await (await fetch(pictureValue)).blob();
    form.append('picture', blob, 'illustration.jpg');
  } else {
    form.append('picture', pictureValue);
  }
  form.append('title', illTitle);
  form.append('description', description);
  form.append('type', 'others');

  const res = await http.post('/ill/', form, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 120000,
  });
  const data = res?.data || {};
  const ok = data.code === 0 || data.desc === 'success';
  if (!ok) {
    const msg = data.message || data.desc || '保存失败';
    throw new Error(typeof msg === 'string' ? msg : '保存失败');
  }
  return data.message || data;
}
