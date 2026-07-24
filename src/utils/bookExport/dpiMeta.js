import { BOOK_EXPORT_DPI } from '@/data/bookExportFormats'

/** 英寸 ↔ 米 */
const INCH_TO_METER = 0.0254

function dataUrlToBytes(dataUrl) {
  const base64 = String(dataUrl).split(',')[1]
  if (!base64) throw new Error('invalid data url')
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i)
  }
  return bytes
}

function bytesToDataUrl(bytes, mime) {
  let binary = ''
  const chunk = 0x2000
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk)
    binary += String.fromCharCode.apply(null, slice)
  }
  return `data:${mime};base64,${btoa(binary)}`
}

/**
 * 将浏览器导出的 JPEG JFIF 密度改为指定 DPI（默认可被 PS 识别为 72）
 */
export function setJpegDpi(dataUrl, dpi = BOOK_EXPORT_DPI) {
  const bytes = dataUrlToBytes(dataUrl)
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return dataUrl

  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) break
    const marker = bytes[offset + 1]
    if (marker === 0xd9 || marker === 0xda) break
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (length < 2) break

    // APP0 + JFIF
    if (
      marker === 0xe0
      && length >= 16
      && bytes[offset + 4] === 0x4a // J
      && bytes[offset + 5] === 0x46 // F
      && bytes[offset + 6] === 0x49 // I
      && bytes[offset + 7] === 0x46 // F
    ) {
      const unitIndex = offset + 11
      const xIndex = offset + 12
      const yIndex = offset + 14
      bytes[unitIndex] = 1 // density in DPI
      bytes[xIndex] = (dpi >> 8) & 0xff
      bytes[xIndex + 1] = dpi & 0xff
      bytes[yIndex] = (dpi >> 8) & 0xff
      bytes[yIndex + 1] = dpi & 0xff
      return bytesToDataUrl(bytes, 'image/jpeg')
    }

    offset += 2 + length
  }

  return dataUrl
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i]
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function u32be(value) {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]
}

/**
 * 为 PNG 写入 pHYs（像素/米），让 Photoshop 等按指定 DPI 打开
 */
export function setPngDpi(pngBytes, dpi = BOOK_EXPORT_DPI) {
  const bytes = pngBytes instanceof Uint8Array ? pngBytes : new Uint8Array(pngBytes)
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i += 1) {
    if (bytes[i] !== signature[i]) return bytes
  }

  const ppm = Math.round(dpi / INCH_TO_METER)
  const physData = new Uint8Array([
    ...u32be(ppm),
    ...u32be(ppm),
    1, // unit: meter
  ])
  const type = [0x70, 0x48, 0x59, 0x73] // pHYs
  const chunkBody = new Uint8Array([...type, ...physData])
  const crc = crc32(chunkBody)
  const physChunk = new Uint8Array([
    ...u32be(physData.length),
    ...chunkBody,
    ...u32be(crc),
  ])

  // 插在 IHDR 之后；若已有 pHYs 则替换
  let offset = 8
  let ihdrEnd = -1
  let physStart = -1
  let physEnd = -1

  while (offset + 8 <= bytes.length) {
    const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]
    const typeStr = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
    const next = offset + 12 + length
    if (typeStr === 'IHDR') ihdrEnd = next
    if (typeStr === 'pHYs') {
      physStart = offset
      physEnd = next
      break
    }
    if (typeStr === 'IDAT' || typeStr === 'IEND') break
    offset = next
  }

  if (physStart >= 0) {
    const out = new Uint8Array(bytes.length - (physEnd - physStart) + physChunk.length)
    out.set(bytes.subarray(0, physStart), 0)
    out.set(physChunk, physStart)
    out.set(bytes.subarray(physEnd), physStart + physChunk.length)
    return out
  }

  if (ihdrEnd < 0) return bytes
  const out = new Uint8Array(bytes.length + physChunk.length)
  out.set(bytes.subarray(0, ihdrEnd), 0)
  out.set(physChunk, ihdrEnd)
  out.set(bytes.subarray(ihdrEnd), ihdrEnd + physChunk.length)
  return out
}

export function canvasToJpegDataUrl(canvas, quality = 0.95, dpi = BOOK_EXPORT_DPI) {
  const raw = canvas.toDataURL('image/jpeg', quality)
  return setJpegDpi(raw, dpi)
}

export function canvasToPngDataUrl(canvas, dpi = BOOK_EXPORT_DPI) {
  const raw = canvas.toDataURL('image/png')
  const withDpi = setPngDpi(dataUrlToBytes(raw), dpi)
  return bytesToDataUrl(withDpi, 'image/png')
}

export function assertPrintPixels(canvas, expectedWidth, expectedHeight) {
  if (!canvas || canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
    throw new Error(
      `export canvas size mismatch: got ${canvas && canvas.width}x${canvas && canvas.height}, expected ${expectedWidth}x${expectedHeight}`
    )
  }
}
