import { applyStickerStyle, loadImage } from '@/utils/lassoCrop';

export { loadImage, downloadDataUrl, readFileAsDataUrl } from '@/utils/lassoCrop';

export const DEFAULT_MATTING_OPTIONS = {
  threshold: 240,
  tolerance: 28,
  feather: 1,
  floodFromEdges: true,
  sticker: true,
};

/** 是否接近白/浅色背景 */
export function isNearWhite(r, g, b, threshold = 240, tolerance = 28) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const avg = (r + g + b) / 3;
  return avg >= threshold && max - min <= tolerance;
}

/** 从四边泛洪，只去掉与边缘连通的近白区域（避免误删角色内部浅色） */
function buildEdgeBackgroundMask(data, width, height, threshold, tolerance) {
  const size = width * height;
  const bg = new Uint8Array(size);
  const queue = [];

  const idx = (x, y) => y * width + x;
  const tryPush = (x, y) => {
    const i = idx(x, y);
    if (bg[i]) return;
    const p = i * 4;
    if (!isNearWhite(data[p], data[p + 1], data[p + 2], threshold, tolerance)) return;
    bg[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x += 1) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (queue.length) {
    const i = queue.pop();
    const x = i % width;
    const y = (i - x) / width;
    if (x > 0) tryPush(x - 1, y);
    if (x < width - 1) tryPush(x + 1, y);
    if (y > 0) tryPush(x, y - 1);
    if (y < height - 1) tryPush(x, y + 1);
  }

  return bg;
}

/** 对 alpha 通道做简单盒式模糊羽化 */
function featherAlpha(data, width, height, radius) {
  if (!radius || radius < 1) return;
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    alpha[j] = data[i + 3];
  }

  const out = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          sum += alpha[ny * width + nx];
          count += 1;
        }
      }
      out[y * width + x] = Math.round(sum / count);
    }
  }

  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    data[i + 3] = out[j];
  }
}

/**
 * Canvas 白底抠图：阈值 + 边缘泛洪，输出透明 PNG canvas
 */
export function mattingWhiteBackground(image, options = {}) {
  const opts = { ...DEFAULT_MATTING_OPTIONS, ...options };
  const { threshold, tolerance, feather, floodFromEdges } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 不可用');

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  let bgMask = null;
  if (floodFromEdges) {
    bgMask = buildEdgeBackgroundMask(data, width, height, threshold, tolerance);
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelIdx = i / 4;
    const isBg = floodFromEdges
      ? bgMask[pixelIdx] === 1
      : isNearWhite(r, g, b, threshold, tolerance);
    data[i + 3] = isBg ? 0 : 255;
  }

  featherAlpha(data, width, height, feather);
  ctx.putImageData(imageData, 0, 0);

  if (opts.sticker === false) return canvas;
  return applyStickerStyle(canvas, typeof opts.sticker === 'object' ? opts.sticker : {});
}

export async function mattingFromDataUrl(dataUrl, options = {}) {
  const image = await loadImage(dataUrl);
  return mattingWhiteBackground(image, options);
}

/** 相对路径 / OSS 路径 → 可加载的完整 URL */
export function resolveImageSourceUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `https://static.kidstory.cc${url}`;
  return `https://static.kidstory.cc/${String(url).replace(/^\/+/, '')}`;
}

export async function mattingFromImageUrl(url, options = {}) {
  const src = resolveImageSourceUrl(url);
  const image = await loadImage(src);
  return mattingWhiteBackground(image, options);
}

/** 白底抠图 → PNG data URL（供编辑器 / 保存角色使用） */
export async function matCharacterImageUrl(imageUrl, options = {}) {
  const canvas = await mattingFromImageUrl(imageUrl, options);
  return canvasToDataUrl(canvas);
}

import { rembgFromImageSource } from '@/utils/imageSegmentation'

/**
 * rembg 抠图并可选更新已有角色
 * @returns {{ imageURL: string, localPath: string, filename: string, provider?: string } | string}
 */
export async function segmentCharacterImageClient(http, imageUrl, characterParams = {}, options = {}) {
  const meta = await rembgFromImageSource(http, imageUrl, {
    apiBaseUrl: options.apiBaseUrl,
    timeout: options.timeout,
  })

  if (characterParams.character_id && http) {
    const token = localStorage.getItem('token') || ''
    const payload = {
      character_id: characterParams.character_id,
      image_url: meta.imageURL,
    }
    if (characterParams.character_type) payload.character_type = characterParams.character_type
    if (characterParams.description) payload.description = characterParams.description
    if (characterParams.is_public !== undefined) payload.is_public = characterParams.is_public
    await http.post('/character', payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  }

  if (options.returnMeta) return meta
  return meta.imageURL
}

export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png');
}
