/** 自由绘制裁剪：路径闭合距离、坐标换算、透明 PNG 导出 */

export const CLOSE_DISTANCE = 15;
export const MIN_LASSO_POINTS = 8;

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getPointsBounds(points) {
  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  const width = Math.max(1, Math.ceil(maxX - minX));
  const height = Math.max(1, Math.ceil(maxY - minY));
  return { minX, minY, maxX, maxY, width, height };
}

/** display 坐标 → 原图像素坐标 */
export function displayPointsToImagePoints(displayPoints, displaySize, naturalWidth, naturalHeight) {
  const scaleX = naturalWidth / displaySize.width;
  const scaleY = naturalHeight / displaySize.height;
  return displayPoints.map((p) => ({
    x: p.x * scaleX,
    y: p.y * scaleY,
  }));
}

export const STICKER_STYLE_DEFAULTS = {
  borderColor: '#ffffff',
  shadowColor: 'rgba(0, 0, 0, 0.22)',
  shadowBlur: 8,
  shadowOffsetX: 0,
  shadowOffsetY: 3,
  extraPad: 6,
};

/** 根据裁剪尺寸计算白边宽度 */
export function getStickerBorderWidth(width, height) {
  return Math.max(4, Math.min(10, Math.round(Math.min(width, height) * 0.018)));
}

/** 白描边 + 轻阴影，形成贴纸风格 */
export function applyStickerStyle(sourceCanvas, options = {}) {
  const opts = { ...STICKER_STYLE_DEFAULTS, ...options };
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const borderWidth = opts.borderWidth ?? getStickerBorderWidth(sw, sh);
  const { borderColor, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, extraPad } = opts;

  const bordered = document.createElement('canvas');
  bordered.width = sw + borderWidth * 2;
  bordered.height = sh + borderWidth * 2;
  const bctx = bordered.getContext('2d');
  if (!bctx) throw new Error('Canvas 不可用');

  const r = borderWidth;
  for (let dx = -r; dx <= r; dx += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      if (dx * dx + dy * dy <= r * r) {
        bctx.drawImage(sourceCanvas, borderWidth + dx, borderWidth + dy);
      }
    }
  }
  bctx.globalCompositeOperation = 'source-in';
  bctx.fillStyle = borderColor;
  bctx.fillRect(0, 0, bordered.width, bordered.height);
  bctx.globalCompositeOperation = 'source-over';
  bctx.drawImage(sourceCanvas, borderWidth, borderWidth);

  const bleed = extraPad + shadowBlur + Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY));
  const out = document.createElement('canvas');
  out.width = bordered.width + bleed * 2;
  out.height = bordered.height + bleed * 2;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Canvas 不可用');

  const ox = bleed;
  const oy = bleed;
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.drawImage(bordered, ox, oy);
  ctx.restore();
  ctx.drawImage(bordered, ox, oy);

  return out;
}

/** 按闭合路径裁剪，输出带贴纸风格的透明 PNG canvas */
export function cropImageByLasso(image, imagePoints, options = {}) {
  const bounds = getPointsBounds(imagePoints);
  const canvas = document.createElement('canvas');
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 不可用');

  ctx.beginPath();
  imagePoints.forEach((p, i) => {
    const x = p.x - bounds.minX;
    const y = p.y - bounds.minY;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, -bounds.minX, -bounds.minY);

  if (options.sticker === false) return canvas;
  const stickerOpts = typeof options.sticker === 'object' ? options.sticker : {};
  return applyStickerStyle(canvas, stickerOpts);
}

export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png');
}

export function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(parts[1]);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    arr[i] = binary.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

export function downloadDataUrl(dataUrl, filename = 'sticker.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
