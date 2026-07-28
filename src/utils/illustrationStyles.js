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
  return {
    id: item.id,
    key: item.key,
    category: item.category,
    artStyle: item.artStyle || '',
    elementDetails: item.elementDetails || '',
    image: imageUrl,
    imageUrl,
  }
}

/**
 * @param {(key: string) => string} t
 * @returns {NormalizedStyle[]}
 */
export function buildFallbackIllustrationStyles(t) {
  return ILLUSTRATION_STYLE_CONFIGS.map((config) => ({
    id: config.id,
    key: config.key,
    category: config.category,
    artStyle: t(`aibooks.styles.${config.key}.artStyle`),
    elementDetails: t(`aibooks.styles.${config.key}.elementDetails`),
    image: config.image,
    imageUrl: typeof config.image === 'string' ? config.image : String(config.image),
  }))
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
        cache.items = normalized
        cache.locale = locale
        cache.category = category
        return normalized
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

export function nextIllustrationStyleId(styles = ILLUSTRATION_STYLE_CONFIGS) {
  return styles.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1
}
