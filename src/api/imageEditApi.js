import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 320000;

function resolveInpaintUrl(apiBaseUrl) {
  return apiBaseUrl ? `${apiBaseUrl.replace(/\/+$/, '')}/image-edit/inpaint` : '/image-edit/inpaint';
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * 局部重绘
 * @returns {Promise<{ image_url: string, image_remote_url?: string }>}
 */
export async function postImageInpaint(http, { image, mask, prompt, size, resolution, apiBaseUrl } = {}) {
  const client = http || axios;
  const res = await client.post(
    resolveInpaintUrl(apiBaseUrl),
    {
      prompt: String(prompt || '').trim(),
      image,
      mask,
      size: size || '4:3',
      resolution: resolution || '1k',
    },
    {
      headers: authHeaders(),
      timeout: DEFAULT_TIMEOUT_MS,
    }
  );
  const data = res?.data;
  if (!data || (data.code !== 0 && data.code !== '0' && data.desc !== 'success')) {
    const msg = data?.message || data?.desc || '局部重绘失败';
    throw new Error(typeof msg === 'string' ? msg : '局部重绘失败');
  }
  const message = data.message || {};
  const imageUrl = message.image_url || message.image_remote_url;
  if (!imageUrl) throw new Error('未返回重绘结果');
  return {
    image_url: imageUrl,
    image_remote_url: message.image_remote_url,
    points: message.points,
  };
}
