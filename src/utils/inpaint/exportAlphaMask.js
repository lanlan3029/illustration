/**
 * 生成 APIMart inpaint 用 mask PNG（与原图同尺寸）
 * 规则：alpha=255 保留，alpha=0 为待重绘区域
 */

import { loadImageBlob, loadHtmlImage } from '@/utils/canvasImageCompose';

export function createEmptyKeepMask(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,255)';
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

/**
 * @param {Array<{x:number,y:number,r:number}>} strokes 原图像素坐标
 */
export function applyBrushStrokesToMask(maskCanvas, strokes, { erase = false } = {}) {
  const ctx = maskCanvas.getContext('2d');
  if (!ctx || !strokes?.length) return;
  strokes.forEach(({ x, y, r }) => {
    ctx.save();
    if (erase) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,255)';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function maskCanvasToDataUrl(maskCanvas) {
  return maskCanvas.toDataURL('image/png');
}

/**
 * 加载原图尺寸与 Image 对象（供 canvas 绘制缓存，避免 redraw 重复请求）
 * @param {string} src data:/blob: URL 或远程 URL
 * @param {{ http?: import('axios').AxiosInstance, apiBaseUrl?: string }} [opts] 远程图走 loadImageBlob（直连→代理）
 */
export async function loadImageNaturalSize(src, opts = {}) {
  const url = String(src || '').trim();
  if (!url) throw new Error('image load failed');

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    const img = await loadHtmlImage(url);
    return {
      img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      blob: null,
      objectUrl: '',
    };
  }

  const blob = await loadImageBlob(url, opts);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadHtmlImage(objectUrl);
    return {
      img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      blob,
      objectUrl,
    };
  } catch (e) {
    URL.revokeObjectURL(objectUrl);
    throw e;
  }
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** display 坐标 → 原图像素 */
export function displayPointToImage(px, py, displayW, displayH, imageW, imageH) {
  return {
    x: (px / displayW) * imageW,
    y: (py / displayH) * imageH,
  };
}

export function brushRadiusImage(brushSize, displayW, imageW) {
  const scale = imageW / (displayW || 1);
  return Math.max(4, (brushSize / 2) * scale);
}

export function strokeBetween(from, to, radius, paintFn) {
  if (!from) {
    paintFn(to.x, to.y, radius);
    return;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const step = Math.max(2, radius * 0.35);
  const n = Math.max(1, Math.ceil(dist / step));
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    paintFn(from.x + dx * t, from.y + dy * t, radius);
  }
}
