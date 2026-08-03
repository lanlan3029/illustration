import { backendCategoryToUiTab } from '@/data/illustrationStyleCategories'
import { ILLUSTRATION_STYLE_CONFIGS } from '@/data/illustrationStyleConfigs'
import { fetchPublicIllustrationStyles } from '@/utils/illustrationStylesApi'

/**
 * @typedef {{
 *   id: number,
 *   key: string,
 *   category: string,
 *   artStyle: string,
 *   elementDetails: string,
 *   basePrompt?: string,
 *   inputTemplate?: string,
 *   prependBaseOnGenerate?: boolean,
 *   preferredSize?: string,
 *   image: string,
 *   imageUrl?: string,
 * }} NormalizedStyle
 */

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
/**
 * 底词前置风格：长规则进 basePrompt（仅生成用），elementDetails 对用户置空。
 * @param {NormalizedStyle} style
 * @returns {NormalizedStyle}
 */
export function sealHiddenBasePrompt(style) {
  if (!style) return style
  const hide = Boolean(style.prependBaseOnGenerate || style.inputTemplate)
  if (!hide) return style
  const base = String(style.basePrompt || style.elementDetails || '').trim()
  return {
    ...style,
    basePrompt: base,
    elementDetails: '',
    prependBaseOnGenerate: true,
  }
}

/** 生成时取隐藏底词 A */
export function resolveStyleBasePrompt(style) {
  if (!style) return ''
  return String(style.basePrompt || style.elementDetails || '').trim()
}

export function normalizeIllustrationStyle(item) {
  const imageUrl = item.imageUrl || item.image || ''
  const category = item.category || 'sketch'
  const style = {
    id: item.id,
    key: item.key,
    category,
    uiTab: backendCategoryToUiTab(category),
    artStyle: item.artStyle || '',
    elementDetails: item.elementDetails || '',
    basePrompt: item.basePrompt || '',
    image: imageUrl,
    imageUrl,
    inputTemplate: item.inputTemplate || '',
    prependBaseOnGenerate: Boolean(item.prependBaseOnGenerate || item.inputTemplate),
    preferredSize: item.preferredSize || '',
  }
  return sealHiddenBasePrompt(style)
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
    const details = t(`aibooks.styles.${config.key}.elementDetails`)
    return sealHiddenBasePrompt({
      id: config.id,
      key: config.key,
      category: config.category,
      uiTab: backendCategoryToUiTab(config.category),
      artStyle: t(`aibooks.styles.${config.key}.artStyle`),
      elementDetails: details,
      image: config.image,
      imageUrl: typeof config.image === 'string' ? config.image : String(config.image),
      inputTemplate,
      prependBaseOnGenerate: Boolean(config.prependBaseOnGenerate || inputTemplate),
      preferredSize: config.preferredSize || '',
    })
  })
}

/** 是否为诗意极简 zine 海报（兼容线上 key 非 poeticMinimalZine 的情况） */
export function isPoeticMinimalZineStyle(style) {
  if (!style) return false
  if (style.key === 'poeticMinimalZine') return true
  const label = `${style.key || ''} ${style.artStyle || ''}`
  return /诗意极简.*zine|zine.*海报|Poetic Minimal Zine/i.test(label)
}

function findSpecialMatchInList(list, special) {
  const byKey = list.find((s) => s.key && s.key === special.key)
  if (byKey) return byKey
  // 线上已上传但 key 不同时，按中/英文风格名识别，避免再插一条造成双 #29
  if (special.key === 'poeticMinimalZine') {
    return list.find((s) => isPoeticMinimalZineStyle(s)) || null
  }
  return null
}

/**
 * API 列表合并本地特殊风格（带 inputTemplate / 底词前置）。
 * 已存在同名风格则只挂模板字段，不再追加，避免双 id。
 * @param {NormalizedStyle[]} apiItems
 * @param {(key: string) => string} t
 */
export function mergeLocalSpecialIllustrationStyles(apiItems, t) {
  const list = Array.isArray(apiItems) ? apiItems.map(normalizeIllustrationStyle) : []
  if (!t) return list
  const local = buildFallbackIllustrationStyles(t)
  const specials = local.filter((s) => s.inputTemplate || s.prependBaseOnGenerate)
  const usedIds = new Set(list.map((s) => Number(s.id)).filter((n) => n > 0))

  for (const special of specials) {
    const existing = findSpecialMatchInList(list, special)
    if (existing) {
      existing.inputTemplate = special.inputTemplate || existing.inputTemplate
      existing.prependBaseOnGenerate = true
      existing.preferredSize = special.preferredSize || existing.preferredSize
      // 底词进 basePrompt；线上/本地谁有用谁，不暴露到 elementDetails
      const base = String(
        existing.basePrompt
        || existing.elementDetails
        || special.basePrompt
        || special.elementDetails
        || ''
      ).trim()
      if (base) existing.basePrompt = base
      existing.elementDetails = ''
      continue
    }
    // 本地兜底追加时避开已占用 id
    let id = Number(special.id) || 0
    if (!id || usedIds.has(id)) {
      id = (usedIds.size ? Math.max(...usedIds) : 0) + 1
    }
    usedIds.add(id)
    list.push(sealHiddenBasePrompt({ ...special, id }))
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
