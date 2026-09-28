import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Load the pure browser module without changing the Vue project's module type.
const source = await readFile(new URL('../src/utils/chromaKeyMatting.js', import.meta.url), 'utf8');
const { applyChromaKey } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const key = { r: 255, g: 43, b: 214 };
const rgba = (rgb, alpha = 255) => [...rgb, alpha];
const keyRgb = [key.r, key.g, key.b];
const pixel = (data, width, x, y) => Array.from(data.slice((y * width + x) * 4, (y * width + x + 1) * 4));
function fixture(width, height, fill) {
  return Uint8ClampedArray.from(Array.from({ length: width * height }, (_, i) => fill(i % width, Math.floor(i / width))).flat());
}

test('clears fully enclosed key-color holes, even with no key pixels on the canvas border', () => {
  const data = fixture(9, 9, (x, y) => rgba(x >= 3 && x <= 5 && y >= 3 && y <= 5 ? keyRgb : [165, 110, 65]));
  applyChromaKey(data, 9, 9, key);
  assert.deepEqual(pixel(data, 9, 4, 4), [0, 0, 0, 0]);
  assert.deepEqual(pixel(data, 9, 2, 4), [165, 110, 65, 255]);
});

test('removes dark or slightly shifted magenta left inside furniture', () => {
  const data = Uint8ClampedArray.from([...rgba([135, 20, 110]), ...rgba([247, 28, 200])]);
  applyChromaKey(data, 2, 1, key);
  assert.deepEqual(Array.from(data), Array(8).fill(0));
});

test('preserves pastel lavender, blush, mint, blue, skin, cream and brown linework', () => {
  const colors = [[195, 160, 207], [233, 173, 181], [145, 191, 169], [119, 156, 214], [242, 186, 135], [255, 249, 233], [101, 61, 45]];
  const data = Uint8ClampedArray.from(colors.flatMap(c => rgba(c)));
  const original = data.slice();
  applyChromaKey(data, colors.length, 1, key);
  assert.deepEqual(data, original);
});

test('reconstructs an antialiased foreground edge rather than leaving a magenta fringe', () => {
  const foreground = [90, 90, 90];
  const mixed = foreground.map((v, c) => Math.round(v * 0.7 + keyRgb[c] * 0.3));
  const data = fixture(10, 9, x => rgba(x < 3 ? keyRgb : x === 3 ? mixed : foreground));
  applyChromaKey(data, 10, 9, key);
  const edge = pixel(data, 10, 3, 4);
  assert.deepEqual(edge.slice(0, 3), foreground);
  assert.ok(Math.abs(edge[3] - 179) <= 2);
  assert.deepEqual(pixel(data, 10, 2, 4), [0, 0, 0, 0]);
});

test('never revives transparent pixels or increases existing alpha', () => {
  const data = fixture(12, 9, (x, y) => rgba(x < 3 ? keyRgb : [101, 61, 45], (x + y) % 3 === 0 ? 0 : 120));
  const original = data.slice();
  applyChromaKey(data, 12, 9, key);
  for (let p = 3; p < data.length; p += 4) assert.ok(data[p] <= original[p]);
});

test('estimates the actual background when generation deviates from the requested hex', () => {
  const actualKey = [250, 15, 230];
  const foreground = [90, 90, 90];
  const mixed = foreground.map((v, c) => Math.round(v * 0.7 + actualKey[c] * 0.3));
  const data = fixture(12, 9, x => rgba(x < 3 ? actualKey : x === 3 ? mixed : foreground));
  applyChromaKey(data, 12, 9, key);
  const edge = pixel(data, 12, 3, 4);
  assert.deepEqual(edge.slice(0, 3), foreground);
  assert.ok(Math.abs(edge[3] - 179) <= 2);
});

test('cleans nonlinear magenta fringe on an older cutout', () => {
  const foreground = [90, 90, 90];
  const data = fixture(12, 9, x => rgba(x < 3 ? keyRgb : x === 3 ? [160, 78, 122] : foreground));
  applyChromaKey(data, 12, 9, key);
  const edge = pixel(data, 12, 3, 4);
  assert.deepEqual(edge.slice(0, 3), foreground);
  assert.ok(edge[3] > 0 && edge[3] < 255);
});

test('keeps fine dark strokes and already clean semitransparent edges', () => {
  const data = fixture(9, 9, x => x === 4 ? rgba([101, 61, 45], 128) : rgba(keyRgb, 0));
  applyChromaKey(data, 9, 9, key);
  assert.deepEqual(pixel(data, 9, 4, 4), [101, 61, 45, 128]);
});

test('retains a pastel garment touching the key background', () => {
  const lavender = [195, 160, 207];
  const data = fixture(10, 9, x => rgba(x < 3 ? keyRgb : lavender));
  applyChromaKey(data, 10, 9, key);
  assert.deepEqual(pixel(data, 10, 3, 4), [...lavender, 255]);
});

test('rejects inconsistent dimensions rather than partially modifying a buffer', () => {
  assert.throws(() => applyChromaKey(new Uint8ClampedArray(4), 2, 2, key), /dimensions/);
});
