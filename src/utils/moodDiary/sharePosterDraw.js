/**
 * Long share poster — macaron mood diary style.
 * @param {{ title?: string, bodyLines?: string[], siteLine?: string }} payload
 */
export function hasSharePosterContent(payload) {
  if (!payload || typeof payload !== 'object') return false
  const lines = payload.bodyLines
  if (!Array.isArray(lines)) return false
  return lines.some((line) => String(line || '').trim())
}

export async function drawSharePoster(payload = {}) {
  const title = String(payload.title || '').trim()
  const bodyLines = Array.isArray(payload.bodyLines)
    ? payload.bodyLines.map((line) => String(line || '').trim()).filter(Boolean)
    : []

  if (!bodyLines.length) {
    throw new Error('share poster empty')
  }

  const canvas = document.createElement('canvas')
  const w = 750
  const outerPad = 36
  const cardPad = 40
  const innerW = w - outerPad * 2 - cardPad * 2
  const lineH = 38
  const titleBlockH = title ? 52 + 28 : 0

  const ctx = canvas.getContext('2d')
  ctx.font = '26px PingFang SC, Microsoft YaHei, sans-serif'

  const wrappedBody = []
  for (const block of bodyLines) {
    const lines = wrapTextLines(ctx, block, innerW)
    if (!lines.length) continue
    wrappedBody.push(...lines)
    wrappedBody.push('')
  }
  if (wrappedBody.length && wrappedBody[wrappedBody.length - 1] === '') wrappedBody.pop()

  if (!wrappedBody.length) {
    throw new Error('share poster empty')
  }

  const bodyBlockH = wrappedBody.length * lineH
  const cardH = cardPad + titleBlockH + bodyBlockH + cardPad
  const h = outerPad * 2 + cardH

  canvas.width = w
  canvas.height = h

  drawBackground(ctx, w, h)
  drawCard(ctx, outerPad, outerPad, w - outerPad * 2, cardH)

  const contentX = outerPad + cardPad
  let y = outerPad + cardPad

  if (title) {
    ctx.fillStyle = '#5f5970'
    ctx.font = 'bold 32px PingFang SC, Microsoft YaHei, sans-serif'
    ctx.fillText(title, contentX, y + 34)
    y += 52

    ctx.strokeStyle = '#a8e0d2'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(contentX, y + 4)
    ctx.lineTo(contentX + 72, y + 4)
    ctx.stroke()
    y += 28
  }

  ctx.font = '24px PingFang SC, Microsoft YaHei, sans-serif'
  ctx.fillStyle = '#5f5970'
  for (const line of wrappedBody) {
    if (!line) {
      y += lineH * 0.45
      continue
    }
    ctx.fillText(line, contentX, y + 24)
    y += lineH
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}

function drawBackground(ctx, w, h) {
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, '#f0ebf6')
  gradient.addColorStop(0.45, '#faf6f2')
  gradient.addColorStop(1, '#edf6fb')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  drawBlob(ctx, w * 0.12, h * 0.1, 120, 'rgba(184, 223, 240, 0.35)')
  drawBlob(ctx, w * 0.88, h * 0.16, 96, 'rgba(255, 200, 216, 0.28)')
  drawBlob(ctx, w * 0.78, h * 0.92, 110, 'rgba(168, 224, 210, 0.26)')
}

function drawBlob(ctx, x, y, r, color) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawCard(ctx, x, y, width, height) {
  ctx.save()
  ctx.shadowColor = 'rgba(196, 181, 224, 0.18)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 10
  roundRect(ctx, x, y, width, height, 24)
  ctx.fillStyle = '#fffcfe'
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#e6deef'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function wrapTextLines(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  let line = ''
  for (const ch of text) {
    if (ch === '\n') {
      if (line) lines.push(line)
      line = ''
      continue
    }
    const next = line + ch
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
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
