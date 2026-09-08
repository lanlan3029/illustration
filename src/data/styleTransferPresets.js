/** AI 优化 · 内置场景（无需用户另传参考图） */

export const SCENARIO_META = {
  hdRestore: { styleStrength: 0.18 },
  colorOptimize: { styleStrength: 0.32 },
  autoCompose: { styleStrength: 0.28 },
  photoScrapbook: { styleStrength: 0.58 },
  autoDoodle: { styleStrength: 0.48 },
  autoCollage: { styleStrength: 0.62 }
}

function strokeDoodleStar(ctx, cx, cy, r) {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const outer = (Math.PI * 2 * i) / 5 - Math.PI / 2
    const inner = outer + Math.PI / 5
    ctx.lineTo(cx + Math.cos(outer) * r, cy + Math.sin(outer) * r)
    ctx.lineTo(cx + Math.cos(inner) * r * 0.42, cy + Math.sin(inner) * r * 0.42)
  }
  ctx.closePath()
  ctx.stroke()
}

function strokeDoodleHeart(ctx, cx, cy, size) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + size * 0.35)
  ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy + size * 0.55)
  ctx.bezierCurveTo(cx - size, cy + size * 1.2, cx, cy + size * 1.55, cx, cy + size * 1.9)
  ctx.bezierCurveTo(cx, cy + size * 1.55, cx + size, cy + size * 1.2, cx + size, cy + size * 0.55)
  ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + size * 0.35)
  ctx.stroke()
}

function strokeSquiggle(ctx, x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  ctx.quadraticCurveTo(midX + 18, midY - 22, x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 10, y2 - 6)
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 4, y2 - 12)
  ctx.stroke()
}

function strokeWavyLine(ctx, x, y, length, amplitude) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  const steps = 6
  for (let i = 1; i <= steps; i++) {
    const px = x + (length / steps) * i
    const py = y + (i % 2 === 0 ? -amplitude : amplitude)
    ctx.lineTo(px, py)
  }
  ctx.stroke()
}

function paintHdRestore(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#f8f9fb')
  g.addColorStop(1, '#e8ecf2')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(40, 50, 70, 0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i < 24; i++) {
    const y = (h / 24) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
}

function paintColorOptimize(ctx, w, h) {
  const g = ctx.createRadialGradient(w * 0.4, h * 0.35, 30, w * 0.5, h * 0.5, w * 0.8)
  g.addColorStop(0, '#fff8f0')
  g.addColorStop(0.4, '#f5e6d3')
  g.addColorStop(0.75, '#e8d4bc')
  g.addColorStop(1, '#d4b896')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillRect(w * 0.15, h * 0.2, w * 0.7, h * 0.55)
}

function paintAutoCompose(ctx, w, h) {
  ctx.fillStyle = '#f5f5f0'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(80, 90, 100, 0.15)'
  ctx.lineWidth = 1
  for (let i = 1; i < 3; i++) {
    const x = (w / 3) * i
    const y = (h / 3) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(1, 154, 216, 0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(w * 0.2, h * 0.15, w * 0.6, h * 0.7)
}

function paintPhotoScrapbook(ctx, w, h) {
  ctx.fillStyle = '#f3ebe0'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(210, 190, 160, 0.22)'
  for (let i = 0; i < 60; i++) {
    const x = (i * 47 + 13) % w
    const y = (i * 31 + 7) % h
    ctx.fillRect(x, y, 2, 2)
  }

  ctx.fillStyle = 'rgba(244, 199, 217, 0.75)'
  ctx.save()
  ctx.translate(w * 0.1, h * 0.1)
  ctx.rotate(-0.06)
  ctx.fillRect(0, 0, w * 0.24, h * 0.055)
  ctx.restore()
  ctx.fillStyle = 'rgba(184, 224, 240, 0.7)'
  ctx.save()
  ctx.translate(w * 0.66, h * 0.78)
  ctx.rotate(0.08)
  ctx.fillRect(0, 0, w * 0.2, h * 0.048)
  ctx.restore()

  ctx.fillStyle = '#e8dfd0'
  ctx.fillRect(w * 0.18, h * 0.3, w * 0.5, h * 0.38)
  ctx.strokeStyle = '#8b7355'
  ctx.lineWidth = 2
  ctx.strokeRect(w * 0.14, h * 0.28, w * 0.52, h * 0.42)

  ctx.textBaseline = 'middle'
  ctx.save()
  ctx.fillStyle = '#c45c7a'
  ctx.font = 'italic 22px Georgia, serif'
  ctx.translate(w * 0.08, h * 0.2)
  ctx.rotate(-0.1)
  ctx.fillText('2026.09.08', 0, 0)
  ctx.restore()

  ctx.save()
  ctx.fillStyle = '#5c7a9e'
  ctx.font = '600 20px "PingFang SC", sans-serif'
  ctx.translate(w * 0.58, h * 0.14)
  ctx.rotate(0.12)
  ctx.fillText('小确幸', 0, 0)
  ctx.restore()

  ctx.save()
  ctx.fillStyle = '#7a6b5a'
  ctx.font = '18px cursive, sans-serif'
  ctx.translate(w * 0.1, h * 0.84)
  ctx.rotate(-0.04)
  ctx.fillText('~ memories ~', 0, 0)
  ctx.restore()

  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  strokeDoodleStar(ctx, w * 0.84, h * 0.16, 12)
  strokeDoodleHeart(ctx, w * 0.78, h * 0.74, 10)
  strokeSquiggle(ctx, w * 0.04, h * 0.52, w * 0.2, h * 0.46)
  strokeWavyLine(ctx, w * 0.68, h * 0.32, w * 0.2, 5)
}

function paintAutoDoodle(ctx, w, h) {
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#eee'
  ctx.fillRect(w * 0.22, h * 0.2, w * 0.56, h * 0.56)

  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  strokeDoodleStar(ctx, w * 0.1, h * 0.12, 10)
  strokeDoodleHeart(ctx, w * 0.88, h * 0.15, 9)
  ctx.beginPath()
  ctx.arc(w * 0.08, h * 0.78, 14, 0, Math.PI * 2)
  ctx.stroke()
  strokeSquiggle(ctx, w * 0.82, h * 0.72, w * 0.92, h * 0.88)
  strokeWavyLine(ctx, w * 0.06, h * 0.42, w * 0.16, 4)
  ctx.beginPath()
  ctx.moveTo(w * 0.9, h * 0.45)
  ctx.lineTo(w * 0.94, h * 0.52)
  ctx.lineTo(w * 0.88, h * 0.55)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(w * 0.12, h * 0.55, 8, 0, Math.PI)
  ctx.stroke()
}

function paintAutoCollage(ctx, w, h) {
  ctx.fillStyle = '#f3ebe0'
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.translate(w * 0.12, h * 0.18)
  ctx.rotate(-0.06)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w * 0.38, h * 0.28)
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, w * 0.38, h * 0.28)
  ctx.restore()

  ctx.save()
  ctx.translate(w * 0.48, h * 0.12)
  ctx.rotate(0.05)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w * 0.42, h * 0.32)
  ctx.strokeStyle = '#ccc'
  ctx.strokeRect(0, 0, w * 0.42, h * 0.32)
  ctx.restore()

  ctx.save()
  ctx.translate(w * 0.28, h * 0.52)
  ctx.rotate(-0.03)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w * 0.5, h * 0.36)
  ctx.strokeStyle = '#ccc'
  ctx.strokeRect(0, 0, w * 0.5, h * 0.36)
  ctx.restore()

  ctx.fillStyle = 'rgba(244, 199, 217, 0.7)'
  ctx.save()
  ctx.translate(w * 0.08, h * 0.08)
  ctx.rotate(-0.12)
  ctx.fillRect(0, 0, w * 0.18, h * 0.04)
  ctx.restore()

  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  strokeWavyLine(ctx, w * 0.72, h * 0.82, w * 0.2, 4)
  strokeDoodleStar(ctx, w * 0.88, h * 0.68, 8)
}

const PAINTERS = {
  hdRestore: paintHdRestore,
  colorOptimize: paintColorOptimize,
  autoCompose: paintAutoCompose,
  photoScrapbook: paintPhotoScrapbook,
  autoDoodle: paintAutoDoodle,
  autoCollage: paintAutoCollage
}

export const SCENARIO_IDS = Object.keys(SCENARIO_META)

/**
 * 生成内置风格参考图（供 ExtendImageStyle 的 style_image）
 * @param {string} scenarioId
 * @returns {string} data URL
 */
export function buildStyleReferenceDataUrl(scenarioId) {
  const paint = PAINTERS[scenarioId]
  if (!paint) throw new Error(`unknown scenario: ${scenarioId}`)
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  paint(ctx, size, size)
  return canvas.toDataURL('image/jpeg', 0.92)
}

export function dataUrlToFile(dataUrl, filename = 'style-ref.jpg') {
  const arr = dataUrl.split(',')
  const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  const u8 = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
  return new File([u8], filename, { type: mime })
}
