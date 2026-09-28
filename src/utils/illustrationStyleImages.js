import { ILLUSTRATION_STYLE_CDN_BASE } from '@/data/illustrationStyleConfigs'
import { HANDRAW_ID_OFFSET, handrawNumberFromStyle } from '@/utils/handrawStyleGroups'

const DEFAULT_API_ORIGIN = 'https://api.kidstory.cc'

export function illustrationPromptAssetBase() {
  const api = (process.env.VUE_APP_API_BASE_URL || DEFAULT_API_ORIGIN).replace(/\/$/, '')
  return api
}

/**
 * 风格预览图：老风格在 static CDN；handraw 全库 (id≥1001) 在 API public/prompt，CDN 同步前走 API。
 * @param {number|string} id
 */
export function illustrationStyleImageUrl(id) {
  const n = Number(id)
  const rel = `prompt/${n}.webp`
  if (Number.isFinite(n) && n >= HANDRAW_ID_OFFSET + 1) {
    return `${illustrationPromptAssetBase()}/${rel}`
  }
  return `${ILLUSTRATION_STYLE_CDN_BASE}/${rel}`
}

/**
 * @param {{ id?: number, imageUrl?: string, image?: string, key?: string, handrawNo?: string }} style
 */
export function resolveIllustrationStyleImageUrl(style) {
  const raw = String(style?.imageUrl || style?.image || '').trim()
  const id = Number(style?.id)
  const handrawNum = handrawNumberFromStyle(style)

  if (handrawNum >= 1) {
    return illustrationStyleImageUrl(HANDRAW_ID_OFFSET + handrawNum)
  }

  if (Number.isFinite(id) && id >= HANDRAW_ID_OFFSET + 1) {
    return illustrationStyleImageUrl(id)
  }

  if (raw) {
    if (/^https?:\/\/static\.kidstory\.cc\/prompt\/(\d+)\.webp/i.test(raw)) {
      const m = raw.match(/\/prompt\/(\d+)\.webp/i)
      const fileId = m ? Number(m[1]) : 0
      if (fileId >= HANDRAW_ID_OFFSET + 1) {
        return illustrationStyleImageUrl(fileId)
      }
    }
    return raw
  }

  if (Number.isFinite(id) && id > 0) {
    return illustrationStyleImageUrl(id)
  }
  return ''
}
