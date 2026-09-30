import QRCodeStyling from 'qr-code-styling'
import { dataUrlToBlob, loadImage } from '@/utils/lassoCrop'
import { formatPostcardDate, wrapPostcardText } from '@/utils/childhoodSharePoster'

const PAPER = '#fff8f2'
const INK = '#4a2c28'
const SERIF = '"Songti SC", "STSong", "SimSun", serif'
const SANS = '"PingFang SC", "Microsoft YaHei", sans-serif'

function canvasOf(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas
}

async function readImage(src) {
  let timeout
  try {
    return await Promise.race([
      loadImage(src),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('图片加载超时，请重试')), 15000) }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function paintBackdrop(ctx) {
  const wash = ctx.createLinearGradient(0, 0, 0, 1440)
  wash.addColorStop(0, '#fff8f3')
  wash.addColorStop(0.55, '#fde8dc')
  wash.addColorStop(1, '#f7d9cb')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, 1080, 1440)

  const glow = ctx.createRadialGradient(920, 40, 20, 920, 160, 480)
  glow.addColorStop(0, 'rgba(232, 184, 74, 0.22)')
  glow.addColorStop(1, 'rgba(232, 184, 74, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 1440)

  ctx.strokeStyle = 'rgba(194, 59, 50, 0.22)'
  ctx.lineWidth = 2
  roundRect(ctx, 36, 36, 1008, 1368, 28)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(232, 184, 74, 0.7)'
  ctx.lineWidth = 1
  roundRect(ctx, 48, 48, 984, 1344, 22)
  ctx.stroke()
}

function coverRounded(ctx, image, x, y, size, radius) {
  const scale = Math.max(size / image.width, size / image.height)
  const w = image.width * scale
  const h = image.height * scale
  ctx.save()
  roundRect(ctx, x, y, size, size, radius)
  ctx.clip()
  ctx.drawImage(image, x + (size - w) / 2, y + (size - h) / 2, w, h)
  ctx.restore()
}

/** 国庆分享明信片：圆角插画拼贴 + 感受 + 二维码 */
export async function drawNationalDaySharePoster({ heroSrc, crowdSrcs = [], story = '', date = '', shareUrl, width = 1080 } = {}) {
  if (!heroSrc || !shareUrl) throw new Error('缺少插画或分享链接')
  const [hero, crowd] = await Promise.all([
    readImage(heroSrc),
    Promise.all([...new Set(crowdSrcs)].filter((src) => src !== heroSrc).slice(0, 4).map((src) => readImage(src).catch(() => null))),
    document.fonts?.ready,
  ])

  const collage = canvasOf(820, 470)
  const scene = collage.getContext('2d')
  scene.fillStyle = '#f8e6d8'
  scene.fillRect(0, 0, 820, 470)
  const positions = [[36, 36], [604, 36], [36, 258], [604, 258]]
  crowd.forEach((image, index) => {
    if (image) coverRounded(scene, image, positions[index][0], positions[index][1], 176, 28)
  })
  coverRounded(scene, hero, 248, 55, 324, 36)

  const qr = new QRCodeStyling({
    width: 210, height: 210, type: 'canvas', data: shareUrl, margin: 16,
    qrOptions: { errorCorrectionLevel: 'M' },
    dotsOptions: { color: '#6b2e28', type: 'square' },
    backgroundOptions: { color: PAPER },
  })
  const qrBlob = await qr.getRawData('png')
  const qrUrl = URL.createObjectURL(qrBlob)
  let qrImage
  try { qrImage = await loadImage(qrUrl) } finally { URL.revokeObjectURL(qrUrl) }

  const canvas = canvasOf(width, Math.round(width * 4 / 3))
  const ctx = canvas.getContext('2d')
  ctx.scale(width / 1080, width / 1080)
  paintBackdrop(ctx)

  function paper(x, y, w, h) {
    ctx.save()
    ctx.shadowColor = 'rgba(120, 42, 32, 0.16)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 9
    roundRect(ctx, x, y, w, h, 18)
    ctx.fillStyle = PAPER
    ctx.fill()
    ctx.restore()
  }
  paper(100, 140, 880, 560)
  ctx.save()
  roundRect(ctx, 130, 166, 820, 470, 16)
  ctx.clip()
  ctx.drawImage(collage, 130, 166, 820, 470)
  ctx.restore()
  ctx.font = `15px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillStyle = '#c23b32'
  ctx.fillText('NATIONAL DAY', 941, 674)
  ctx.textAlign = 'left'

  paper(100, 734, 880, 556)
  ctx.fillStyle = '#c23b32'
  ctx.font = `italic 28px Georgia, ${SERIF}`
  ctx.fillText('One holiday, one honest feeling.', 150, 793)
  ctx.font = `18px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText('国庆邮局 / KidStory', 929, 790)
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = `30px ${SERIF}`
  const { lines, truncated } = wrapPostcardText(ctx, story || '这个国庆，有一句想留下来的话。', 770, 5)
  lines.forEach((line, i) => ctx.fillText(line, 150, 858 + i * 44))
  ctx.strokeStyle = '#f0d2c4'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(150, 872 + i * 44); ctx.lineTo(929, 872 + i * 44); ctx.stroke()
  }
  ctx.fillStyle = '#8a675f'
  ctx.font = `18px ${SANS}`
  ctx.fillText(truncated ? '扫描二维码，读完整感受，也写下你的国庆。' : '这个国庆，你是想吐槽还是想铭记？', 150, 1121)
  ctx.fillStyle = INK
  ctx.font = `23px Georgia, ${SERIF}`
  ctx.fillText(formatPostcardDate(date) || '国庆 · 值得记住的一天', 150, 1211)
  ctx.font = `15px ${SANS}`
  ctx.fillStyle = '#8a675f'
  ctx.fillText('国庆感受收集 · 写下感受，生成一张插画', 150, 1245)
  ctx.drawImage(qrImage, 777, 1080, 168, 168)
  ctx.font = `16px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillStyle = INK
  ctx.fillText('扫码写下你的国庆', 861, 1270)
  ctx.fillStyle = '#9b2c26'
  ctx.font = `18px Georgia, ${SERIF}`
  ctx.fillText('K I D S T O R Y   /   国 庆 来 信', 540, 1372)
  return canvas.toDataURL('image/png')
}

/** 用本地 blob 下载，避免超长 data URL 被浏览器当成页面打开。 */
export function downloadPostcard(dataUrl, filename = 'national-day-postcard.png') {
  if (!dataUrl || !dataUrl.startsWith('data:')) return false
  const blob = dataUrlToBlob(dataUrl)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  return true
}
