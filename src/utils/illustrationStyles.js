import { backendCategoryToUiTab } from '@/data/illustrationStyleCategories'
import { ILLUSTRATION_STYLE_CONFIGS } from '@/data/illustrationStyleConfigs'
import { fetchPublicIllustrationStyles } from '@/utils/illustrationStylesApi'

/** @typedef {{ id: number, key: string, category: string, artStyle: string, elementDetails: string, image: string, imageUrl?: string }} NormalizedStyle */

const cache = {
  locale: '',
  category: '',
  items: /** @type {NormalizedStyle[]|null} */ (null),
  promise: /** @type {Promise<NormalizedStyle[]>|null} */ (null),
}

/**
 * @param {object} item
 * @returns {NormalizedStyle}
 */
export function normalizeIllustrationStyle(item) {
  const imageUrl = item.imageUrl || item.image || ''
  const category = item.category || 'sketch'
  return {
    id: item.id,
    key: item.key,
    category,
    uiTab: backendCategoryToUiTab(category),
    artStyle: item.artStyle || '',
    elementDetails: item.elementDetails || '',
    image: imageUrl,
    imageUrl,
    inputTemplate: item.inputTemplate || '',
    prependBaseOnGenerate: Boolean(item.prependBaseOnGenerate || item.inputTemplate),
    preferredSize: item.preferredSize || '',
  }
}

/**
 * @param {(key: string) => string} t
 * @returns {NormalizedStyle[]}
 */
export function buildFallbackIllustrationStyles(t) {
  return ILLUSTRATION_STYLE_CONFIGS.map((config) => {
    const inputKey = `aibooks.styles.${config.key}.inputTemplate`
    const inputRaw = t(inputKey)
    const inputTemplate = inputRaw && inputRaw !== inputKey ? inputRaw : ''
    return {
      id: config.id,
      key: config.key,
      category: config.category,
      uiTab: backendCategoryToUiTab(config.category),
      artStyle: t(`aibooks.styles.${config.key}.artStyle`),
      elementDetails: t(`aibooks.styles.${config.key}.elementDetails`),
      image: config.image,
      imageUrl: typeof config.image === 'string' ? config.image : String(config.image),
      inputTemplate,
      prependBaseOnGenerate: Boolean(config.prependBaseOnGenerate || inputTemplate),
      preferredSize: config.preferredSize || '',
    }
  })
}

/**
 * API 列表合并本地特殊风格（带 inputTemplate / 底词前置），避免线上 API 尚未入库时缺失。
 * @param {NormalizedStyle[]} apiItems
 * @param {(key: string) => string} t
 */
export function mergeLocalSpecialIllustrationStyles(apiItems, t) {
  const list = Array.isArray(apiItems) ? apiItems.map(normalizeIllustrationStyle) : []
  if (!t) return list
  const local = buildFallbackIllustrationStyles(t)
  const specials = local.filter((s) => s.inputTemplate || s.prependBaseOnGenerate)
  const byKey = new Map(list.map((s) => [s.key, s]))
  const byId = new Map(list.map((s) => [s.id, s]))

  for (const special of specials) {
    const existing = byKey.get(special.key) || byId.get(special.id)
    if (existing) {
      existing.inputTemplate = special.inputTemplate || existing.inputTemplate
      existing.prependBaseOnGenerate = true
      existing.preferredSize = special.preferredSize || existing.preferredSize
      if (!existing.elementDetails && special.elementDetails) {
        existing.elementDetails = special.elementDetails
      }
    } else {
      list.push(special)
      byKey.set(special.key, special)
      byId.set(special.id, special)
    }
  }
  return list
}

export function invalidateIllustrationStylesCache() {
  cache.locale = ''
  cache.category = ''
  cache.items = null
  cache.promise = null
}

/**
 * @param {{ locale?: string, category?: string, t?: (key: string) => string, force?: boolean }} [options]
 * @returns {Promise<NormalizedStyle[]>}
 */
export async function loadIllustrationStyles(options = {}) {
  const locale = options.locale === 'en' ? 'en' : 'zh'
  const category = options.category || ''
  const t = options.t

  if (
    !options.force
    && cache.items
    && cache.locale === locale
    && cache.category === category
  ) {
    return cache.items
  }

  if (!options.force && cache.promise) {
    return cache.promise
  }

  cache.promise = fetchPublicIllustrationStyles({ locale, category })
    .then((items) => {
      const normalized = (items || []).map(normalizeIllustrationStyle)
      if (normalized.length) {
        const merged = t
          ? mergeLocalSpecialIllustrationStyles(normalized, t)
          : normalized
        cache.items = merged
        cache.locale = locale
        cache.category = category
        return merged
      }
      throw new Error('empty styles')
    })
    .catch(() => {
      if (!t) {
        return ILLUSTRATION_STYLE_CONFIGS.map((config) => normalizeIllustrationStyle({
          ...config,
          artStyle: config.key,
          elementDetails: '',
          imageUrl: config.image,
        }))
      }
      const fallback = buildFallbackIllustrationStyles(t)
      cache.items = fallback
      cache.locale = locale
      cache.category = category
      return fallback
    })
    .finally(() => {
      cache.promise = null
    })

  return cache.promise
}

export function nextIllustrationStyleId(styles) {
  const list = Array.isArray(styles) && styles.length ? styles : ILLUSTRATION_STYLE_CONFIGS
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
}

/**
 * 从英文艺术风格名生成 camelCase key；中文或无英文时用 style{id}。
 * @param {string} label
 * @param {number} [fallbackId]
 */
export function generateStyleKey(label, fallbackId) {
  const text = String(label || '').trim()
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())

  if (words.length) {
    const key = words
      .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join('')
    if (/^[a-z][a-zA-Z0-9]*$/.test(key)) {
      return key
    }
  }

  if (fallbackId != null) {
    return `style${fallbackId}`
  }
  return 'styleNew'
}

/**
 * @param {string} key
 * @param {string[]} existingKeys
 * @param {string} [excludeKey]
 */
export function ensureUniqueStyleKey(key, existingKeys, excludeKey = '') {
  const list = Array.isArray(existingKeys) ? existingKeys : []
  const taken = new Set(list.filter((k) => k && k !== excludeKey))
  if (!taken.has(key)) return key
  let n = 2
  while (taken.has(`${key}${n}`)) n += 1
  return `${key}${n}`
}
