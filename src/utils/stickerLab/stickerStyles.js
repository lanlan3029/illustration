import { applyStickerStyle } from '@/utils/lassoCrop';

export const STICKER_BORDER_COLORS = [
  '#ffffff',
  '#111111',
  '#e84b4b',
  '#ff8c42',
  '#f5d76e',
  '#7ec8a3',
  '#5b8def',
  '#a8c0d0',
  '#f4a4b8',
  '#c9a0dc',
];

function hardenAlphaForBorder(sourceCanvas, thresh = 96) {
  const c = document.createElement('canvas');
  c.width = sourceCanvas.width;
  c.height = sourceCanvas.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  const d = id.data;
  for (let i = 3; i < d.length; i += 4) {
    d[i] = d[i] >= thresh ? 255 : 0;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

export function trimTransparent(sourceCanvas) {
  const ctx = sourceCanvas.getContext('2d');
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) return sourceCanvas;
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  out.getContext('2d').drawImage(sourceCanvas, minX, minY, tw, th, 0, 0, tw, th);
  return out;
}

/** 清理半透明毛边与碎岛像素 */
export function cleanAlphaDebris(canvas) {
  if (!canvas) return canvas;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const n = w * h;
  const alphaThresh = 48;
  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    if (data[i * 4 + 3] < alphaThresh) {
      data[i * 4 + 3] = 0;
      mask[i] = 0;
    } else {
      mask[i] = 1;
    }
  }

  const labels = new Int32Array(n);
  const sizes = [0];
  let label = 0;
  const stack = [];
  for (let i = 0; i < n; i += 1) {
    if (!mask[i] || labels[i]) continue;
    label += 1;
    let count = 0;
    stack.length = 0;
    stack.push(i);
    labels[i] = label;
    while (stack.length) {
      const cur = stack.pop();
      count += 1;
      const cx = cur % w;
      const cy = (cur - cx) / w;
      const neighbors = [
        cx > 0 ? cur - 1 : -1,
        cx < w - 1 ? cur + 1 : -1,
        cy > 0 ? cur - w : -1,
        cy < h - 1 ? cur + w : -1,
      ];
      neighbors.forEach((nb) => {
        if (nb >= 0 && mask[nb] && !labels[nb]) {
          labels[nb] = label;
          stack.push(nb);
        }
      });
    }
    sizes[label] = count;
  }

  let maxSize = 0;
  for (let i = 1; i < sizes.length; i += 1) {
    if (sizes[i] > maxSize) maxSize = sizes[i];
  }
  const minKeep = Math.max(96, Math.floor(n * 0.00035), Math.floor(maxSize * 0.018));
  for (let i = 0; i < n; i += 1) {
    const lab = labels[i];
    if (lab && sizes[lab] < minKeep) data[i * 4 + 3] = 0;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function traceOuterContour(canvas, thresh = 100) {
  const w = canvas.width;
  const h = canvas.height;
  const data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return data[(y * w + x) * 4 + 3] >= thresh;
  };
  let sx = -1;
  let sy = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (solid(x, y) && !solid(x, y - 1)) {
        sx = x;
        sy = y;
        break;
      }
    }
    if (sx >= 0) break;
  }
  if (sx < 0) return [];

  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
  const points = [];
  let x = sx;
  let y = sy;
  let dir = 0;
  let guard = w * h * 2;
  do {
    points.push({ x: x + 0.5, y: y + 0.5 });
    const start = (dir + 6) % 8;
    let found = false;
    for (let i = 0; i < 8; i += 1) {
      const nd = (start + i) % 8;
      const nx = x + dx[nd];
      const ny = y + dy[nd];
      if (solid(nx, ny)) {
        x = nx;
        y = ny;
        dir = nd;
        found = true;
        break;
      }
    }
    if (!found) break;
    guard -= 1;
  } while ((x !== sx || y !== sy) && guard > 0);
  return points;
}

function inflateContour(points, amount) {
  if (!points?.length || points.length < 3 || !amount) return points;
  const n = points.length;
  let cx = 0;
  let cy = 0;
  points.forEach((p) => {
    cx += p.x;
    cy += p.y;
  });
  cx /= n;
  cy /= n;
  return points.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / len) * amount, y: p.y + (dy / len) * amount };
  });
}

function softenOnce(points, closed, strength = 0.28) {
  if (!points?.length || points.length < 3) return points?.slice() || [];
  const s = strength;
  const keep = 1 - s;
  const side = s / 2;
  const n = points.length;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    if (!closed && (i === 0 || i === n - 1)) {
      out.push({ x: points[i].x, y: points[i].y });
      continue;
    }
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    out.push({
      x: curr.x * keep + prev.x * side + next.x * side,
      y: curr.y * keep + prev.y * side + next.y * side,
    });
  }
  return out;
}

/** 虚线描边样式 */
export function applyDashedBorder(sourceCanvas, color = '#111111') {
  const hard = hardenAlphaForBorder(sourceCanvas, 100);
  let contour = traceOuterContour(hard, 100);
  if (contour.length < 12) {
    return applyStickerStyle(sourceCanvas, { borderColor: color, shadowBlur: 0, shadowOffsetY: 0 });
  }

  const step = Math.max(1, Math.floor(contour.length / 1200));
  const pts = [];
  for (let i = 0; i < contour.length; i += step) pts.push(contour[i]);
  let smooth = softenOnce(softenOnce(pts, true, 0.34), true, 0.22);

  const shortEdge = Math.min(sourceCanvas.width, sourceCanvas.height);
  const lineW = Math.max(4.5, Math.min(22, shortEdge * 0.015));
  const dash = Math.max(12, Math.min(48, shortEdge * 0.028));
  const gap = Math.max(8, Math.min(36, dash * 0.78));
  const inflate = Math.max(2.5, Math.min(14, lineW * 0.85));
  smooth = inflateContour(smooth, inflate);
  const pad = Math.ceil(lineW * 3 + inflate + 8);

  const out = document.createElement('canvas');
  out.width = sourceCanvas.width + pad * 2;
  out.height = sourceCanvas.height + pad * 2;
  const ctx = out.getContext('2d');
  ctx.drawImage(sourceCanvas, pad, pad);
  ctx.beginPath();
  ctx.moveTo(smooth[0].x + pad, smooth[0].y + pad);
  for (let i = 1; i < smooth.length; i += 1) {
    ctx.lineTo(smooth[i].x + pad, smooth[i].y + pad);
  }
  ctx.closePath();
  ctx.strokeStyle = color || '#111111';
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = Math.max(2, lineW * 0.65);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = lineW;
  ctx.setLineDash([dash, gap]);
  ctx.stroke();
  ctx.setLineDash([]);
  return out;
}

/**
 * @param {'sticker'|'outline'|'raw'} style
 */
export function finishWithStyle(rawCanvas, style, borderColor = '#ffffff') {
  const cleaned = cleanAlphaDebris(trimTransparent(rawCanvas));
  if (style === 'raw') return cleaned;
  if (style === 'outline') return applyDashedBorder(cleaned, borderColor);
  return applyStickerStyle(cleaned, { borderColor });
}
