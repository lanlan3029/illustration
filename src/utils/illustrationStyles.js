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
 *   customGenerate?: string,
 *   skillMode?: string,
 *   requiresReference?: boolean,
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
    customGenerate: item.customGenerate || '',
    skillMode: item.skillMode || '',
    requiresReference: Boolean(item.requiresReference),
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
      customGenerate: config.customGenerate || '',
      skillMode: config.skillMode || '',
      requiresReference: Boolean(config.requiresReference),
    })
  })
}

/** 是否为诗意极简 zine 海报（兼容线上 key 非 poeticMinimalZine 的情况） */
export function isPoeticMinimalZineStyle(style) {
  if (!style) return false
  const key = String(style.key || '').toLowerCase()
  if (key === 'poeticminimalzine' || key === 'poeticminimalzineposter') return true
  const label = `${style.key || ''} ${style.artStyle || ''}`
  return /诗意极简.*zine|zine.*海报|Poetic Minimal Zine/i.test(label)
}

/** 喜茶灵感·实物简笔画无字海报 */
export function isObjectDoodlePosterNoTextStyle(style) {
  if (!style) return false
  if (Number(style.id) === 30) return true
  const key = String(style.key || '').toLowerCase()
  if (key === 'objectdoodleposternotext' || key === 'heyteadoodlenotext') return true
  const label = `${style.key || ''} ${style.artStyle || ''}`
  return /实物简笔画|无字.*海报|Object Doodle Poster|Heytea.*[Nn]o.?[Tt]ext|简笔画海报/i.test(label)
}

/** 怪诞小黑正文配图（SKILL：服务端扩写生图） */
export function isXiaoheiAbsurdIllustrationStyle(style) {
  if (!style) return false
  if (Number(style.id) === 31) return true
  if (String(style.customGenerate || '').toLowerCase() === 'xiaohei') return true
  const key = String(style.key || '').toLowerCase()
  if (key === 'xiaoheiabsurdillustration' || key === 'xiaoheiabsurd') return true
  const label = `${style.key || ''} ${style.artStyle || ''}`
  return /小黑怪诞|怪诞小黑|Xiaohei Absurd|小黑.*配图/i.test(label)
}

/** 真景纸刊拼贴（照片作锚点） */
export function isScenesGatheredZineStyle(style) {
  if (!style) return false
  if (Number(style.id) === 34) return true
  if (String(style.customGenerate || '').toLowerCase() === 'gatheredscenes') return true
  if (String(style.skillMode || '').toLowerCase() === 'gathered') return true
  const key = String(style.key || '').toLowerCase()
  if (key === 'scenesgatheredzine' || key === 'gatheredscenes') return true
  const label = `${style.key || ''} ${style.artStyle || ''}`
  return /真景纸刊拼贴|True-Scene Paper Collage|拾景.*实景拼贴|实景拼贴|Gathered Scenes/i.test(label)
}

/** 意象纸刊重绘（照片仅语义） */
export function isSceneDistillationZineStyle(style) {
  if (!style) return false
  if (Number(style.id) === 35) return true
  if (String(style.customGenerate || '').toLowerCase() === 'scenedistillation') return true
  if (String(style.skillMode || '').toLowerCase() === 'distillation') return true
  const key = String(style.key || '').toLowerCase()
  if (key === 'scenedistillationzine' || key === 'scenedistillation') return true
  const label = `${style.key || ''} ${style.artStyle || ''}`
  return /意象纸刊重绘|Mood-Scene Paper Redraw|拾景.*影像蒸馏|影像蒸馏|Scene Distillation/i.test(label)
}

export function isGatheredScenesSkillStyle(style) {
  return isScenesGatheredZineStyle(style) || isSceneDistillationZineStyle(style)
}

export function gatheredScenesModeFromStyle(style) {
  if (isSceneDistillationZineStyle(style)) return 'distillation'
  return 'gathered'
}

function findSpecialMatchInList(list, special) {
  const specialKey = String(special.key || '').toLowerCase()
  const byKey = list.find((s) => s.key && String(s.key).toLowerCase() === specialKey)
  if (byKey) return byKey
  // 线上已上传但 key 不同时，按中/英文风格名识别，避免双 id
  if (specialKey === 'poeticminimalzine') {
    return list.find((s) => isPoeticMinimalZineStyle(s)) || null
  }
  if (specialKey === 'objectdoodleposternotext') {
    return list.find((s) => isObjectDoodlePosterNoTextStyle(s)) || null
  }
  if (specialKey === 'xiaoheiabsurdillustration') {
    return list.find((s) => isXiaoheiAbsurdIllustrationStyle(s)) || null
  }
  if (specialKey === 'scenesgatheredzine') {
    return list.find((s) => isScenesGatheredZineStyle(s)) || null
  }
  if (specialKey === 'scenedistillationzine') {
    return list.find((s) => isSceneDistillationZineStyle(s)) || null
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
      // 本地短模板优先（避免线上弱/空 inputTemplate，或误把长底词当可见文案）
      existing.inputTemplate = special.inputTemplate || existing.inputTemplate
      existing.prependBaseOnGenerate = true
      existing.preferredSize = special.preferredSize || existing.preferredSize
      existing.customGenerate = special.customGenerate || existing.customGenerate
      existing.skillMode = special.skillMode || existing.skillMode
      existing.requiresReference = Boolean(
        special.requiresReference || existing.requiresReference
      )
      existing.category = special.category || existing.category
      existing.uiTab = backendCategoryToUiTab(existing.category)
      // 喜茶无字 / 小黑 / 拾景：本地强化底词优先；其余保留线上底词
      const preferLocalBase =
        special.key === 'objectDoodlePosterNoText'
        || special.key === 'xiaoheiAbsurdIllustration'
        || special.key === 'scenesGatheredZine'
        || special.key === 'sceneDistillationZine'
      const base = String(
        preferLocalBase
          ? (special.basePrompt || special.elementDetails || existing.basePrompt || existing.elementDetails || '')
          : (existing.basePrompt || existing.elementDetails || special.basePrompt || special.elementDetails || '')
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
