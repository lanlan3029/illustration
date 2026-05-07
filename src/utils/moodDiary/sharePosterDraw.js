/**
 * Long share poster — web analogue of drawSharePoster.
 * @param {{ title?: string, bodyLines?: string[], siteLine?: string }} payload
 */
export async function drawSharePoster(payload = {}) {
  const title = payload.title || 'KidStory Mood'
  const bodyLines = Array.isArray(payload.bodyLines) ? payload.bodyLines : ['']
  const siteLine = payload.siteLine || 'kidstory.cc'

  const canvas = document.createElement('canvas')
  const w = 750
  const pad = 48
  const lineH = 40
  const titleH = 56
  const qrSize = 160
  const bodyH = bodyLines.length * lineH + 40
  const h = pad * 2 + titleH + bodyH + qrSize + 100
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, '#f8f6ff')
  gradient.addColorStop(1, '#fff5f8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#2a1f42'
  ctx.font = 'bold 34px PingFang SC, Microsoft YaHei, sans-serif'
  ctx.fillText(title, pad, pad + titleH / 2)

  ctx.font = '26px PingFang SC, Microsoft YaHei, sans-serif'
  ctx.fillStyle = '#45405c'
  let y = pad + titleH + 20
  for (const line of bodyLines) {
    ctx.fillText(line.slice(0, 34), pad, y)
    y += lineH
  }

  y += 24
  const qrX = (w - qrSize) / 2
  drawFakeQr(ctx, qrX, y, qrSize)
  ctx.fillStyle = '#6b667d'
  ctx.font = '22px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(siteLine, w / 2, y + qrSize + 36)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/jpeg', 0.9)
}

function drawFakeQr(ctx, x, y, size) {
  ctx.save()
  ctx.fillStyle = '#fff'
  ctx.fillRect(x, y, size, size)
  ctx.strokeStyle = '#2a1f42'
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, size, size)
  const cell = size / 12
  ctx.fillStyle = '#2a1f42'
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      if ((i * 13 + j * 7) % 5 === 0) {
        ctx.fillRect(x + i * cell, y + j * cell, cell - 1, cell - 1)
      }
    }
  }
  ctx.restore()
}

export function downloadDataUrl(filename, dataUrl) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
