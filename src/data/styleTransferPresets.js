/** AI 优化 · 内置场景（无需用户另传参考图） */

export const SCENARIO_META = {
  hd: { styleStrength: 0.22 },
  unified: { styleStrength: 0.48 },
  scrapbook: { styleStrength: 0.62 },
  soft: { styleStrength: 0.4 },
  vibrant: { styleStrength: 0.38 },
  vintage: { styleStrength: 0.52 }
}

function paintHd(ctx, w, h) {
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

function paintUnified(ctx, w, h) {
  const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 40, w * 0.5, h * 0.5, w * 0.75)
  g.addColorStop(0, '#fff4e8')
  g.addColorStop(0.45, '#f3d9c4')
  g.addColorStop(1, '#c9a88a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(w * 0.1, h * 0.55, w * 0.8, h * 0.28)
}

function paintScrapbook(ctx, w, h) {
  ctx.fillStyle = '#f3ebe0'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(210, 190, 160, 0.25)'
  for (let i = 0; i < 80; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
  }
  ctx.fillStyle = '#f4c7d9'
  ctx.fillRect(w * 0.08, h * 0.12, w * 0.22, h * 0.06)
  ctx.fillStyle = '#b8e0f0'
  ctx.fillRect(w * 0.68, h * 0.72, w * 0.18, h * 0.05)
  ctx.strokeStyle = '#8b7355'
  ctx.lineWidth = 2
  ctx.strokeRect(w * 0.15, h * 0.25, w * 0.55, h * 0.45)
}

function paintSoft(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#fcefee')
  g.addColorStop(0.5, '#e8f4fc')
  g.addColorStop(1, '#fdf6e3')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath()
  ctx.arc(w * 0.7, h * 0.35, w * 0.18, 0, Math.PI * 2)
  ctx.fill()
}

function paintVibrant(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#ff6b6b')
  g.addColorStop(0.35, '#ffd93d')
  g.addColorStop(0.7, '#6bcb77')
  g.addColorStop(1, '#4d96ff')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 0.25
  ctx.fillStyle = '#fff'
  ctx.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6)
  ctx.globalAlpha = 1
}

function paintVintage(ctx, w, h) {
  ctx.fillStyle = '#d4c4a8'
  ctx.fillRect(0, 0, w, h)
  const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7)
  g.addColorStop(0, 'rgba(255,240,210,0.9)')
  g.addColorStop(1, 'rgba(120,90,60,0.45)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(90,70,50,${Math.random() * 0.08})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
  }
}

const PAINTERS = {
  hd: paintHd,
  unified: paintUnified,
  scrapbook: paintScrapbook,
  soft: paintSoft,
  vibrant: paintVibrant,
  vintage: paintVintage
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
