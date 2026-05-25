import { FALLBACK_WAITING_QUOTES } from './waitingQuotesFallback'
import { fetchWaitingQuotesFromApi } from './api'
import { findMoodById } from './moodAssets'

export const DEFAULT_QUOTE_LIMIT = 10
export const MIN_QUOTE_LIMIT = 1
export const MAX_QUOTE_LIMIT = 10

const quoteCache = new Map()

function buildQuoteCacheKey(options = {}) {
  const locale = normalizeWaitingQuoteLocale(options.locale)
  const limit = clampQuoteLimit(options.limit ?? DEFAULT_QUOTE_LIMIT)
  const moodResolved = options.draft
    ? resolveWaitingQuoteMood(options.draft, locale)
    : {
        moodEmojiId: options.moodEmojiId || '',
        moodLabel: options.moodLabel || ''
      }
  const moodEmojiId = moodResolved.moodEmojiId || options.moodEmojiId || ''
  const moodLabel = moodResolved.moodLabel || options.moodLabel || ''
  return `${locale}|${moodEmojiId}|${moodLabel}|${limit}`
}

export function normalizeWaitingQuoteLocale(locale) {
  const l = String(locale || 'zh').toLowerCase()
  if (l.startsWith('en')) return 'en'
  return 'zh'
}

export function clampQuoteLimit(limit) {
  const n = Number(limit)
  if (!Number.isFinite(n)) return DEFAULT_QUOTE_LIMIT
  return Math.min(MAX_QUOTE_LIMIT, Math.max(MIN_QUOTE_LIMIT, Math.round(n)))
}

/** 从 draft 解析 mood emoji id 与中文标签（供 API mood / mood_label） */
export function resolveWaitingQuoteMood(draft, locale = 'zh') {
  const moodEmojiId = draft?.moodEmojiId || draft?.mood || null
  let moodLabel = String(draft?.moodLabel || '').trim()
  if (!moodLabel && moodEmojiId) {
    const hit = findMoodById(moodEmojiId, normalizeWaitingQuoteLocale(locale) === 'zh')
    moodLabel = hit?.label || ''
  }
  return { moodEmojiId: moodEmojiId ? String(moodEmojiId) : '', moodLabel }
}

function normalizeQuote(row) {
  if (!row || typeof row !== 'object') return null
  const text = String(row.hitokoto || row.text || row.content || row.sentence || row.quote || '').trim()
  if (!text) return null
  return {
    id: String(row._id || row.uuid || `${row.id || 'quote'}-${text.slice(0, 24)}`),
    text,
    author: String(row.from || row.author || row.source || '').trim(),
    moodPrimary: String(row.mood_primary || '').trim(),
    moodSecondary: Array.isArray(row.mood_secondary) ? row.mood_secondary.map(String) : [],
    sentiment: String(row.sentiment || '').trim()
  }
}

function localeMatches(quoteLocale, locale) {
  const q = (quoteLocale || 'zh').toLowerCase()
  const l = (locale || 'zh').toLowerCase()
  if (l.startsWith('zh')) return q.startsWith('zh') || q === 'zh'
  if (l.startsWith('en')) return q.startsWith('en') || q === 'en'
  return q === l
}

function shuffleInPlace(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function pickFallbackQuotes({ locale = 'zh', limit = DEFAULT_QUOTE_LIMIT }) {
  const pool = FALLBACK_WAITING_QUOTES.filter((q) => localeMatches(q.locale, locale))
  const list = pool.length ? pool : FALLBACK_WAITING_QUOTES
  return shuffleInPlace([...list]).slice(0, limit).map((row) => normalizeQuote({ ...row, hitokoto: row.text }))
}

/**
 * @param {{
 *   locale?: string,
 *   moodEmojiId?: string|null,
 *   moodLabel?: string,
 *   limit?: number,
 *   draft?: object|null
 * }} options
 * @returns {Promise<{ quotes: object[], fromApi: boolean }>}
 */
export async function loadWaitingQuotes(options = {}) {
  const cacheKey = buildQuoteCacheKey(options)
  const cached = quoteCache.get(cacheKey)
  if (cached) {
    return {
      quotes: cached.quotes.map((quote) => ({ ...quote })),
      fromApi: cached.fromApi
    }
  }

  const locale = normalizeWaitingQuoteLocale(options.locale)
  const limit = clampQuoteLimit(options.limit ?? DEFAULT_QUOTE_LIMIT)
  const moodResolved = options.draft
    ? resolveWaitingQuoteMood(options.draft, locale)
    : {
        moodEmojiId: options.moodEmojiId || '',
        moodLabel: options.moodLabel || ''
      }
  const moodEmojiId = moodResolved.moodEmojiId || options.moodEmojiId || ''
  const moodLabel = moodResolved.moodLabel || options.moodLabel || ''

  let list = []
  let fromApi = false

  try {
    list = await fetchWaitingQuotesFromApi({
      locale,
      mood: moodEmojiId,
      mood_label: moodLabel,
      limit
    })
    fromApi = list.length > 0
  } catch (e) {
    console.warn('[mood-diary] waiting quotes api failed, use fallback', e?.message || e)
  }

  const result = !list.length
    ? {
        quotes: pickFallbackQuotes({ locale, limit }).filter(Boolean),
        fromApi: false
      }
    : {
        quotes: list.slice(0, limit).map(normalizeQuote).filter(Boolean),
        fromApi
      }

  if (result.quotes.length) {
    quoteCache.set(cacheKey, {
      quotes: result.quotes.map((quote) => ({ ...quote })),
      fromApi: result.fromApi
    })
  }

  return {
    quotes: result.quotes.map((quote) => ({ ...quote })),
    fromApi: result.fromApi
  }
}

/** 进入生成流程前预拉句子，减少等待页空白时间 */
export function prefetchWaitingQuotes(options = {}) {
  return loadWaitingQuotes(options).catch(() => ({ quotes: [], fromApi: false }))
}
