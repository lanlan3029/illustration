// Reserved-color keying for generated illustrations. Unlike white-background
// matting, the key color must never be used in the subject itself.
function hue(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const range = max - min;
  if (!range) return 0;
  const h = max === r ? (g - b) / range : max === g ? (b - r) / range + 2 : (r - g) / range + 4;
  return (h * 60 + 360) % 360;
}

function hueDistance(a, b) {
  const distance = Math.abs(a - b);
  return Math.min(distance, 360 - distance);
}

/**
 * Remove a reserved, saturated background color, including enclosed holes.
 * Works in-place on RGBA pixels and never increases existing alpha.
 * Only edge pixels receive color decontamination; pastel clothing stays intact.
 */
export function applyChromaKey(data, width, height, target, options = {}) {
  if (data.length !== width * height * 4) throw new Error('Invalid RGBA dimensions');
  const tolerance = options.colorTolerance ?? 88;
  const edgeRadius = Math.max(0, Math.min(3, Math.round(options.edgeRadius ?? 3)));
  const targetHue = hue(target.r, target.g, target.b);
  const targetMax = Math.max(target.r, target.g, target.b);
  const targetMin = Math.min(target.r, target.g, target.b);
  const saturatedKey = targetMax > 0 && (targetMax - targetMin) / targetMax > 0.5;
  const size = width * height;
  const background = new Uint8Array(size);
  const edge = new Uint8Array(size);
  const keySum = [0, 0, 0];
  let keySamples = 0;

  for (let i = 0; i < size; i += 1) {
    const p = i * 4;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const distanceSquared = (r - target.r) ** 2 + (g - target.g) ** 2 + (b - target.b) ** 2;
    // Hue also catches darker/compressed key-color patches missed by RGB distance.
    // Require strong saturation so lavender, blush, skin and cream are preserved.
    const keyVariant = saturatedKey && max >= 45 && (max - min) / max >= 0.58 &&
      hueDistance(hue(r, g, b), targetHue) <= 16;
    if (keyVariant && distanceSquared <= tolerance ** 2 && data[p + 3] >= 240 && (max - min) / max >= 0.7) {
      keySum[0] += r;
      keySum[1] += g;
      keySum[2] += b;
      keySamples += 1;
    }
    if (data[p + 3] === 0 || distanceSquared <= tolerance ** 2 || keyVariant) {
      background[i] = 1;
    }
  }
  // Models rarely reproduce the requested hex exactly. Use the opaque key
  // patches to estimate the actual mixing color (including on older cutouts).
  const actualKey = keySamples >= 8
    ? keySum.map(value => value / keySamples)
    : [target.r, target.g, target.b];

  // Mark a narrow band around BOTH outer contours and internal cutout holes.
  // No alpha blur: it would revive cleared pixels and carry the key RGB back in.
  if (edgeRadius) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x;
        if (background[i]) continue;
        for (let dy = -edgeRadius; dy <= edgeRadius && !edge[i]; dy += 1) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -edgeRadius; dx <= edgeRadius; dx += 1) {
            const nx = x + dx;
            if (nx >= 0 && nx < width && background[ny * width + nx]) {
              edge[i] = 1;
              break;
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < size; i += 1) {
    const p = i * 4;
    if (background[i]) {
      // Zero RGB as well, preventing magenta halos during subsequent resizing.
      data[p] = data[p + 1] = data[p + 2] = data[p + 3] = 0;
      continue;
    }
    if (!edge[i]) continue;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    if (!saturatedKey || hueDistance(hue(r, g, b), targetHue) > 55) continue;
    // Old JPEG/feathered cutouts can carry a nonlinear pink fringe. Allow a
    // looser fit only for strong magenta contamination, never pale pink fills.
    const strongSpill = target.r > target.g && target.b > target.g && Math.min(r - g, b - g) > 40;
    const fitTolerance = strongSpill ? 48 : 24;
    const x = i % width, y = Math.floor(i / width);
    let bestScore = Infinity, bestAlpha = 1, best = -1;
    const searchRadius = edgeRadius + 2;
    for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
      const ny = y + dy;
      if (ny < 0 || ny >= height) continue;
      for (let dx = -searchRadius; dx <= searchRadius; dx += 1) {
        const nx = x + dx;
        if (nx < 0 || nx >= width) continue;
        const neighbor = ny * width + nx;
        const q = neighbor * 4;
        if (background[neighbor] || edge[neighbor] || data[q + 3] < 128) continue;
        // P = alpha * foreground + (1-alpha) * key. Fit against nearby
        // uncontaminated foreground, rather than globally desaturating pinks.
        const dr = data[q] - actualKey[0], dg = data[q + 1] - actualKey[1], db = data[q + 2] - actualKey[2];
        const denominator = dr * dr + dg * dg + db * db;
        if (!denominator) continue;
        const alpha = Math.max(0, Math.min(1,
          ((r - actualKey[0]) * dr + (g - actualKey[1]) * dg + (b - actualKey[2]) * db) / denominator));
        const error = (r - actualKey[0] - alpha * dr) ** 2 +
          (g - actualKey[1] - alpha * dg) ** 2 + (b - actualKey[2] - alpha * db) ** 2;
        const score = error + (dx * dx + dy * dy) * 0.25;
        if (error <= fitTolerance ** 2 && score < bestScore) {
          bestScore = score;
          bestAlpha = alpha;
          best = q;
        }
      }
    }
    if (best >= 0 && bestAlpha < 0.96) {
      data[p] = data[best];
      data[p + 1] = data[best + 1];
      data[p + 2] = data[best + 2];
      data[p + 3] = Math.round(data[p + 3] * bestAlpha);
    }
  }
  return data;
}
