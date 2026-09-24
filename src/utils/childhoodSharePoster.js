import QRCodeStyling from 'qr-code-styling'
import { loadImage } from '@/utils/lassoCrop'

const PAPER = '#fff9ec'
const INK = '#51483e'
const SERIF = '"Songti SC", "STSong", "SimSun", serif'
const SANS = '"PingFang SC", "Microsoft YaHei", sans-serif'

function canvasOf(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas
}

// Trim transparent padding so cutouts with different source dimensions have equal visual weight.
function trimImage(image) {
  const canvas = canvasOf(image.naturalWidth || image.width, image.naturalHeight || image.height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let left = canvas.width, right = -1, top = canvas.height, bottom = -1
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] < 20) continue
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
  }
  if (right < left) throw new Error('插画为空，请换一张图片')
  const cropped = canvasOf(right - left + 1, bottom - top + 1)
  cropped.getContext('2d').drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height)
  return cropped
}

async function readCutout(src) {
  // A failed image request must not leave the postcard dialog spinning indefinitely.
  let timeout
  try {
    const image = await Promise.race([
      loadImage(src),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('图片加载超时，请重试')), 15000) }),
    ])
    return trimImage(image)
  } finally { clearTimeout(timeout) }
}

function contain(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height)
  const w = image.width * scale, h = image.height * scale
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h)
}

export function wrapPostcardText(ctx, text, maxWidth, maxLines) {
  const lines = []
  let line = ''
  const characters = Array.from(String(text || '').trim())
  let truncated = false
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    if (char === '\r') continue
    if (char === '\n' || (line && ctx.measureText(line + char).width > maxWidth)) {
      lines.push(line)
      line = ''
      if (lines.length === maxLines) { truncated = i < characters.length; break }
      if (char === '\n') continue
    }
    line += char
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (truncated) {
    let last = lines[maxLines - 1]
    while (last && ctx.measureText(last + '…').width > maxWidth) last = Array.from(last).slice(0, -1).join('')
    lines[maxLines - 1] = last + '…'
  }
  return { lines, truncated }
}

export function formatPostcardDate(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

/** Two paper postcards over the exact same illustration collage. Outputs a full-resolution PNG. */
export async function drawChildhoodSharePoster({ heroSrc, crowdSrcs = [], story = '', date = '', shareUrl, width = 1080 } = {}) {
  if (!heroSrc || !shareUrl) throw new Error('缺少插画或分享链接')
  const [hero, crowd] = await Promise.all([
    readCutout(heroSrc),
    Promise.all([...new Set(crowdSrcs)].filter(src => src !== heroSrc).slice(0, 4).map(src => readCutout(src).catch(() => null))),
    document.fonts?.ready,
  ])
  const collage = canvasOf(820, 470)
  const scene = collage.getContext('2d')
  scene.fillStyle = '#e9ede2'
  scene.fillRect(0, 0, 820, 470)
  const positions = [[26, 28], [612, 28], [26, 264], [612, 264]]
  crowd.forEach((image, index) => {
    if (image) contain(scene, image, ...positions[index], 180, 178)
  })
  contain(scene, hero, 210, 42, 400, 392)

  const qr = new QRCodeStyling({
    width: 210, height: 210, type: 'canvas', data: shareUrl, margin: 16,
    qrOptions: { errorCorrectionLevel: 'M' },
    dotsOptions: { color: '#393e34', type: 'square' },
    backgroundOptions: { color: PAPER },
  })
  const qrBlob = await qr.getRawData('png')
  const qrUrl = URL.createObjectURL(qrBlob)
  let qrImage
  try { qrImage = await loadImage(qrUrl) } finally { URL.revokeObjectURL(qrUrl) }

  const canvas = canvasOf(width, Math.round(width * 4 / 3))
  const ctx = canvas.getContext('2d')
  ctx.scale(width / 1080, width / 1080)
  ctx.fillStyle = '#dce2d2'
  ctx.fillRect(0, 0, 1080, 1440)
  // Repeat the very same collage at a larger scale, without inventing a second background.
  ctx.drawImage(collage, -450, -40, 1980, 1135)
  ctx.drawImage(collage, -450, 1095, 1980, 1135)
  ctx.fillStyle = 'rgba(83, 99, 72, 0.16)'
  ctx.fillRect(0, 0, 1080, 1440)

  function paper(x, y, w, h) {
    ctx.save()
    ctx.shadowColor = 'rgba(48, 53, 39, 0.15)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 9
    ctx.fillStyle = PAPER
    ctx.fillRect(x, y, w, h)
    ctx.restore()
  }
  paper(100, 140, 880, 560)
  ctx.drawImage(collage, 130, 166, 820, 470)
  ctx.fillStyle = INK
  ctx.font = `24px ${SERIF}`
  ctx.fillText('把小时候，寄给长大后的我们。', 138, 674)
  ctx.font = `15px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText('CHILDHOOD MEMORIES', 941, 674)
  ctx.textAlign = 'left'

  paper(100, 734, 880, 556)
  ctx.fillStyle = '#728372'
  ctx.font = `italic 28px Georgia, ${SERIF}`
  ctx.fillText('A little memory, a lot of love.', 150, 793)
  ctx.font = `18px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText('童年邮局 / KidStory', 929, 790)
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = `30px ${SERIF}`
  const { lines, truncated } = wrapPostcardText(ctx, story || '有些小小的幸福，长大后还记得。', 770, 5)
  lines.forEach((line, i) => ctx.fillText(line, 150, 858 + i * 44))
  ctx.strokeStyle = '#e4dbca'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(150, 872 + i * 44); ctx.lineTo(929, 872 + i * 44); ctx.stroke()
  }
  ctx.fillStyle = '#6b7665'
  ctx.font = `18px ${SANS}`
  ctx.fillText(truncated ? '扫描二维码，读完整故事，也写下你的童年。' : '你小时候，哪件小事让你一直记到现在？', 150, 1121)
  ctx.fillStyle = INK
  ctx.font = `23px Georgia, ${SERIF}`
  ctx.fillText(formatPostcardDate(date) || '那些年 · 值得记住的一天', 150, 1211)
  ctx.font = `15px ${SANS}`
  ctx.fillStyle = '#81796b'
  ctx.fillText('幸福童年收集 · 留下一段回忆，画成你的童年', 150, 1245)
  ctx.drawImage(qrImage, 777, 1080, 168, 168)
  ctx.font = `16px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('扫码写一段你的童年', 861, 1270)
  ctx.fillStyle = '#48563f'
  ctx.font = `18px Georgia, ${SERIF}`
  ctx.fillText('K I D S T O R Y   /   童 年 来 信', 540, 1372)
  return canvas.toDataURL('image/png')
}
