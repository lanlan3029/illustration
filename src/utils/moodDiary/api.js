import axios from 'axios'
import { MOOD_ILLUSTRATION_TYPE, MOOD_DIARY_NARRATIVE_MAX } from './constants'
import { getMoodApiConfig, resolveApiUrl } from './config'
import { resolvePictureUploadBlob, compressDataUrlForUpload } from './posterUpload'

function unwrapData(res) {
  const d = res && res.data !== undefined ? res.data : res
  return d
}

function pickFirstStr(obj, keys) {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** 解析 image-describe 的 data 载荷（含 vision 返回的单行 JSON 字符串） */
function parseVisionDescribeFields(raw) {
  let description = ''
  let sceneDescription = ''
  let diaryCaption = ''
  let illustrationPrompt = ''
  let illustrationStyle = ''

  const absorbObject = (obj) => {
    if (!obj || typeof obj !== 'object') return
    diaryCaption =
      diaryCaption ||
      pickFirstStr(obj, ['diary_caption', 'diaryCaption', 'diary', 'caption_diary'])
    sceneDescription =
      sceneDescription ||
      pickFirstStr(obj, ['scene_description', 'sceneDescription', 'description', 'vision'])
    description =
      description || pickFirstStr(obj, ['description', 'scene_description', 'text'])
    illustrationPrompt =
      illustrationPrompt ||
      pickFirstStr(obj, [
        'illustration_prompt',
        'illustrationPrompt',
        'image_prompt',
        'imagePrompt',
        'prompt'
      ])
    illustrationStyle =
      illustrationStyle || pickFirstStr(obj, ['illustration_style', 'illustrationStyle'])
  }

  if (typeof raw === 'string') {
    const s = raw.trim()
    if (s.startsWith('{')) {
      try {
        absorbObject(JSON.parse(s))
      } catch (_) {
        description = s
        sceneDescription = s
      }
    } else {
      description = s
      sceneDescription = s
    }
  } else if (raw && typeof raw === 'object') {
    absorbObject(raw)
  }

  if (!sceneDescription) sceneDescription = description
  if (!description) description = sceneDescription
  return {
    description,
    sceneDescription,
    diaryCaption,
    illustrationPrompt,
    illustrationStyle
  }
}

/** /caption/* 统一响应：code 0 成功，-1 失败，-2 / 429 限流 */
function assertCaptionApiResponse(data, httpStatus, failLabel = 'caption request') {
  const code = data?.code
  if (httpStatus === 429 || code === -2 || code === '-2') {
    const err = new Error(
      typeof data?.message === 'string' ? data.message : '请求过于频繁，请稍后再试'
    )
    err.rateLimited = true
    throw err
  }
  if (code === -1 || code === '-1') {
    throw new Error(typeof data?.message === 'string' ? data.message : failLabel)
  }
  const ok =
    code === 0 ||
    code === '0' ||
    data?.desc === 'success' ||
    data?.statuscode === 'success'
  if (!ok && code != null && code !== undefined) {
    throw new Error(
      typeof data?.message === 'string'
        ? data.message
        : pickFirstStr(data, ['desc']) || failLabel
    )
  }
}

function assertImageDescribeResponse(data, httpStatus) {
  assertCaptionApiResponse(data, httpStatus, 'image-describe failed')
}

function extractImageDescribeResult(data) {
  const payload = data?.data ?? data?.message ?? data
  let result = parseVisionDescribeFields(payload)

  if (!result.diaryCaption) {
    result = {
      ...result,
      diaryCaption: pickFirstStr(data, ['diary_caption', 'diaryCaption'])
    }
  }
  if (!result.sceneDescription && !result.description) {
    const top = parseVisionDescribeFields(data)
    result = { ...top, ...result, diaryCaption: result.diaryCaption || top.diaryCaption }
  }
  if (!result.illustrationPrompt && payload && typeof payload === 'object') {
    result.illustrationPrompt = pickFirstStr(payload, [
      'illustration_prompt',
      'illustrationPrompt',
      'image_prompt'
    ])
  }

  if (!result.sceneDescription) result.sceneDescription = result.description
  if (!result.description) result.description = result.sceneDescription

  return result
}

function normalizeRecapThemes(raw) {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x || '').trim()).filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/[,，、\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

/** 解析 mood-recap 的 data（含 LLM 单行 JSON 字符串） */
function parseRecapDataFields(raw) {
  let overview = ''
  let moodTrend = ''
  let themes = []
  let highlight = ''
  let suggestion = ''
  let recapText = ''

  const absorbObject = (obj) => {
    if (!obj || typeof obj !== 'object') return
    overview = overview || pickFirstStr(obj, ['overview', 'summary', 'opening'])
    moodTrend =
      moodTrend || pickFirstStr(obj, ['mood_trend', 'moodTrend', 'trend', 'mood_change'])
    if (!themes.length) themes = normalizeRecapThemes(obj.themes ?? obj.topics ?? obj.tags)
    highlight = highlight || pickFirstStr(obj, ['highlight', 'moment', 'memorable'])
    suggestion =
      suggestion || pickFirstStr(obj, ['suggestion', 'advice', 'gentle_suggestion', 'tip'])
    recapText =
      recapText ||
      pickFirstStr(obj, [
        'recap_text',
        'recapText',
        'content',
        'analysis',
        'text',
        'result',
        'summary',
        'reply'
      ])
  }

  if (typeof raw === 'string') {
    const s = raw.trim()
    if (s.startsWith('{')) {
      try {
        absorbObject(JSON.parse(s))
      } catch (_) {
        recapText = s
      }
    } else {
      recapText = s
    }
  } else if (raw && typeof raw === 'object') {
    absorbObject(raw)
  }

  if (!recapText && overview) {
    recapText = [overview, moodTrend, highlight, suggestion].filter(Boolean).join('\n\n')
  }

  return { overview, moodTrend, themes, highlight, suggestion, recapText }
}

function extractRecapResult(data) {
  const payload = data?.data ?? data?.message ?? data
  let result = parseRecapDataFields(payload)

  if (!result.recapText && !result.overview) {
    const top = parseRecapDataFields(data)
    result = {
      overview: result.overview || top.overview,
      moodTrend: result.moodTrend || top.moodTrend,
      themes: result.themes.length ? result.themes : top.themes,
      highlight: result.highlight || top.highlight,
      suggestion: result.suggestion || top.suggestion,
      recapText: result.recapText || top.recapText
    }
  }

  const choiceMsg = payload?.choices?.[0]?.message ?? payload?.choices?.[0]
  if (!result.recapText && choiceMsg?.content) {
    result = { ...result, ...parseRecapDataFields(choiceMsg.content) }
  }

  if (!result.recapText && typeof data?.message === 'string' && !String(data.message).startsWith('{')) {
    result.recapText = String(data.message).trim()
  }

  return result
}

/** mood-recap 超时（LLM 分析多条日记） */
const MOOD_RECAP_TIMEOUT_MS = 120000

/**
 * POST /caption/mood-recap（须 Bearer；与 KidStory caption.ts 契约一致）
 * - 成功：HTTP 200 + code 0 + data（结构化六段或仅 recap_text）
 * - 未登录：HTTP 401 + code -1
 * - 限流：HTTP 429 + code -2（可选 retryAfter）
 * - LLM 失败/超时：HTTP 200 + code -1
 * 请求体见 buildRecapCompletionPayload。
 * @param {object} payload
 * @param {string} endpoint
 * @returns {Promise<{ overview: string, moodTrend: string, themes: string[], highlight: string, suggestion: string, recapText: string }>}
 */
export async function fetchCaptionMoodRecap(payload, endpoint) {
  const url = resolveApiUrl(endpoint)
  if (!url) throw new Error('caption mood-recap endpoint missing')

  const authHeaders = {
    Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
    'Content-Type': 'application/json'
  }

  let res
  try {
    res = await axios.post(url, payload, {
      timeout: MOOD_RECAP_TIMEOUT_MS,
      headers: authHeaders
    })
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response ? unwrapData(err.response) : null
    console.warn('[mood-diary] POST /caption/mood-recap 失败', {
      status,
      data,
      message: err?.message
    })
    if (status === 401) {
      const msg =
        typeof data?.message === 'string' && data.message.trim()
          ? data.message.trim()
          : '请先登录'
      throw new Error(msg)
    }
    if (status === 429 || data?.code === -2 || data?.code === '-2') {
      let msg = data?.message || '请求过于频繁，请稍后再试'
      const ra = data?.retryAfter
      if (ra != null && Number.isFinite(Number(ra))) {
        msg += `（约 ${Number(ra)}s 后可重试）`
      }
      throw new Error(msg)
    }
    if (data?.code === -1 || data?.code === '-1') {
      throw new Error(data?.message || 'mood-recap failed')
    }
    throw err
  }

  const data = unwrapData(res)
  console.log('[mood-diary] POST /caption/mood-recap 响应', {
    httpStatus: res?.status,
    code: data?.code,
    desc: data?.desc,
    message: data?.message,
    data: data?.data ?? null
  })
  assertCaptionApiResponse(data, res?.status, 'mood-recap failed')
  const parsed = extractRecapResult(data)
  console.log('[mood-diary] POST /caption/mood-recap 解析结果', parsed)
  if (
    !parsed.recapText &&
    !parsed.overview &&
    !parsed.moodTrend &&
    !parsed.highlight &&
    !parsed.suggestion &&
    !parsed.themes?.length
  ) {
    throw new Error(
      typeof data?.message === 'string' ? data.message : 'mood-recap empty result'
    )
  }
  return parsed
}

/**
 * 推荐 multipart 传图；仅无本地文件且为远程 URL 时用 JSON（image_url）。
 */
function shouldUseJsonBody(imageInput, options) {
  if (options.preferJson) return true
  if (options.preferMultipart) return false
  if (imageInput instanceof Blob) return false
  const remote =
    options.imageUrl ||
    (typeof imageInput === 'string' && /^https?:\/\//i.test(imageInput))
  return !!remote
}

/** data URL / File → Blob，统一走 multipart */
async function resolveDescribeUploadFile(imageInput, options) {
  if (imageInput instanceof Blob) return imageInput
  if (typeof imageInput === 'string' && imageInput.trim()) {
    return dataUrlToFile(imageInput, options.filename || 'reference.jpg')
  }
  return null
}

function appendDescribeFormFields(fd, options) {
  const hint = String(options.hint || options.extraHint || '').trim()
  if (hint) {
    fd.append('hint', hint)
    fd.append('extra_hint', hint)
  }
  const narrativeTrim = String(options.narrative || '').trim().slice(0, MOOD_DIARY_NARRATIVE_MAX)
  if (narrativeTrim) fd.append('narrative', narrativeTrim)
  const mood = String(options.moodLabel || options.userMood || '').trim()
  if (mood) {
    fd.append('mood_label', mood)
    fd.append('user_mood', mood)
  }
  const style = String(options.illustrationStyle || '').trim()
  if (style) fd.append('illustration_style', style)
  fd.append('target_length', String(options.targetLength ?? 90))
  fd.append(
    'generate_diary_caption',
    options.generateDiaryCaption !== false ? 'true' : 'false'
  )
}

function buildDescribeJsonBody(imageInput, options) {
  const body = {
    target_length: options.targetLength ?? 90,
    generate_diary_caption: options.generateDiaryCaption !== false
  }
  const imageUrl = options.imageUrl || ''
  if (imageUrl) {
    body.image_url = imageUrl
  } else if (typeof imageInput === 'string' && /^https?:\/\//i.test(imageInput)) {
    body.image_url = imageInput
  }

  const hint = String(options.hint || options.extraHint || '').trim()
  if (hint) {
    body.hint = hint
    body.extra_hint = hint
  }
  const narrativeTrim = String(options.narrative || '').trim().slice(0, MOOD_DIARY_NARRATIVE_MAX)
  if (narrativeTrim) body.narrative = narrativeTrim
  const mood = String(options.moodLabel || options.userMood || '').trim()
  if (mood) {
    body.mood_label = mood
    body.user_mood = mood
  }
  const style = String(options.illustrationStyle || '').trim()
  if (style) body.illustration_style = style
  return body
}

/** image-describe 超时（与小程序一致，vision 较慢） */
const IMAGE_DESCRIBE_TIMEOUT_MS = 130000

/**
 * POST /caption/image-describe（纯文字，无图）
 * 用于插画日记：根据 narrative + mood 生成 diaryCaption / illustrationPrompt
 */
export async function fetchCaptionNarrativeDescribe(options = {}, endpoint) {
  const url = resolveApiUrl(endpoint)
  if (!url) throw new Error('caption image-describe endpoint missing')

  const authHeaders = {
    Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
    'Content-Type': 'application/json'
  }
  const body = buildDescribeJsonBody(null, options)

  let res
  try {
    res = await axios.post(url, body, {
      timeout: IMAGE_DESCRIBE_TIMEOUT_MS,
      headers: authHeaders
    })
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response ? unwrapData(err.response) : null
    console.warn('[mood-diary] POST /caption/image-describe (text) 失败', {
      status,
      data,
      message: err?.message
    })
    if (status === 429 || data?.code === -2 || data?.code === '-2') {
      throw new Error(data?.message || '请求过于频繁，请稍后再试')
    }
    if (data?.code === -1 || data?.code === '-1') {
      throw new Error(data?.message || 'image-describe failed')
    }
    throw err
  }

  const data = unwrapData(res)
  console.log('[mood-diary] POST /caption/image-describe (text) 响应', {
    httpStatus: res?.status,
    code: data?.code,
    desc: data?.desc,
    message: data?.message,
    data: data?.data ?? null
  })
  assertImageDescribeResponse(data, res?.status)
  const parsed = extractImageDescribeResult(data)
  console.log('[mood-diary] POST /caption/image-describe (text) 解析结果', parsed)
  return parsed
}

/**
 * POST /caption/image-describe
 * 默认 multipart 传图（与小程序一致）；勿用整段 base64 JSON。
 * @param {File|Blob|string|null} imageInput File/Blob，或 data URL（会转为 File 再 multipart）
 * @param {{
 *   hint?: string,
 *   extraHint?: string,
 *   narrative?: string,
 *   moodLabel?: string,
 *   userMood?: string,
 *   illustrationStyle?: string,
 *   targetLength?: number,
 *   generateDiaryCaption?: boolean,
 *   filename?: string,
 *   imageUrl?: string,
 *   preferJson?: boolean
 * }} [options]
 * @param {string} endpoint
 */
export async function fetchCaptionImageDescribe(imageInput, options = {}, endpoint) {
  const url = resolveApiUrl(endpoint)
  if (!url) throw new Error('caption image-describe endpoint missing')

  const authHeaders = {
    Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
  }

  let res
  try {
    if (shouldUseJsonBody(imageInput, options)) {
      const body = buildDescribeJsonBody(imageInput, options)
      if (!body.image_url) {
        throw new Error('image_url required for JSON image-describe')
      }
      res = await axios.post(url, body, {
        timeout: IMAGE_DESCRIBE_TIMEOUT_MS,
        headers: { ...authHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      const file = await resolveDescribeUploadFile(imageInput, options)
      if (!file) throw new Error('image file required for multipart image-describe')
      const filename = options.filename || file.name || 'reference.jpg'
      const fd = new FormData()
      fd.append('picture', file, filename)
      appendDescribeFormFields(fd, options)
      // 不手动设置 Content-Type，由运行时附带 boundary（与 wx.request 一致）
      res = await axios.post(url, fd, {
        timeout: IMAGE_DESCRIBE_TIMEOUT_MS,
        headers: authHeaders
      })
    }
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response ? unwrapData(err.response) : null
    console.warn('[mood-diary] POST /caption/image-describe 失败', {
      status,
      data,
      message: err?.message
    })
    if (status === 429 || data?.code === -2 || data?.code === '-2') {
      throw new Error(data?.message || '请求过于频繁，请稍后再试')
    }
    if (data?.code === -1 || data?.code === '-1') {
      throw new Error(data?.message || 'image-describe failed')
    }
    throw err
  }

  const data = unwrapData(res)
  console.log('[mood-diary] POST /caption/image-describe 响应', {
    httpStatus: res?.status,
    code: data?.code,
    desc: data?.desc,
    message: data?.message,
    data: data?.data ?? null
  })
  assertImageDescribeResponse(data, res?.status)
  const parsed = extractImageDescribeResult(data)
  console.log('[mood-diary] POST /caption/image-describe 解析结果', parsed)
  return parsed
}

/** 写入草稿：画面描述、日记配文、文生图 prompt */
export function imageDescribeResultToDraftPatch(result) {
  const scene = (result.sceneDescription || result.description || '').trim()
  const diary = (result.diaryCaption || '').trim()
  const patch = {
    imageVisionCache: scene,
    sceneDescription: scene
  }
  if (diary) {
    patch.diaryCaption = diary
    patch.quotaSentence = diary
  }
  const illPrompt = (result.illustrationPrompt || '').trim()
  if (illPrompt) {
    patch.generateIllustrationPrompt = illPrompt
  }
  const illStyle = (result.illustrationStyle || '').trim()
  if (illStyle) {
    patch.artStyle = illStyle
  }
  return patch
}

/**
 * @deprecated 仅画面描述（generate_diary_caption=false）
 */
export async function fetchImageDescribe(file, hint, endpoint) {
  const result = await fetchCaptionImageDescribe(
    file,
    { hint, generateDiaryCaption: false },
    endpoint
  )
  return result.description || result.sceneDescription
}

/** @param {string} dataUrl */
export async function dataUrlToFile(dataUrl, filename = 'ref.jpg') {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const type = blob.type || 'image/jpeg'
  return new File([blob], filename, { type })
}

export async function fetchEmotionPipeline(text, hasImage, endpoint) {
  const url = resolveApiUrl(endpoint)
  const res = await axios.post(url, { input: { text, hasImage: !!hasImage } }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 90000
  })
  const data = unwrapData(res)
  const inner = data.message || data.data || data.result || data
  const prompt =
    pickFirstStr(inner, ['imagePrompt', 'image_prompt', 'prompt', 'illustration_prompt']) ||
    pickFirstStr(data, ['imagePrompt', 'image_prompt', 'prompt'])
  return prompt
}

export async function fetchEmotionAlign(matching, endpoint) {
  const url = resolveApiUrl(endpoint)
  const res = await axios.post(url, matching, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000
  })
  return unwrapData(res).message || unwrapData(res).data || unwrapData(res)
}

export async function createCharacterIllustration(payload) {
  const apiRoot = process.env.VUE_APP_API_BASE_URL || ''
  const apiUrl = apiRoot ? `${apiRoot.replace(/\/$/, '')}/create-character` : '/create-character'
  const res = await axios.post(apiUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
    },
    timeout: 180000
  })
  const data = unwrapData(res)
  const ok = data.code === 0 || data.code === '0' || data.desc === 'success' || data.statuscode === 'success'
  if (!ok || !data.message) throw new Error(data.message || 'create-character failed')

  const msg = data.message
  let imageUrl = msg.image_url || msg.character_image_url || msg.image || msg.url || ''
  if (!imageUrl && msg.image_base64) {
    imageUrl = msg.image_base64.startsWith('data:')
      ? msg.image_base64
      : `data:image/jpeg;base64,${msg.image_base64}`
  }
  if (!imageUrl && msg.character_image_base64) {
    imageUrl = msg.character_image_base64.startsWith('data:')
      ? msg.character_image_base64
      : `data:image/jpeg;base64,${msg.character_image_base64}`
  }
  if (!imageUrl && msg.full_response?.data?.[0]) {
    const first = msg.full_response.data[0]
    if (first.b64_json) imageUrl = `data:image/jpeg;base64,${first.b64_json}`
    else imageUrl = first.url || ''
  }
  if (!imageUrl) throw new Error('No image in response')
  return { imageUrl, raw: data }
}

export async function saveIllMood(payload, endpoint) {
  const url = resolveApiUrl(endpoint)
  let imageUrl = payload.image_url
  if (imageUrl?.startsWith?.('data:')) {
    imageUrl = await compressDataUrlForUpload(imageUrl)
  }
  const body = {
    ...payload,
    image_url: imageUrl,
    type: payload.type ?? MOOD_ILLUSTRATION_TYPE,
    illustration_type: payload.illustration_type ?? payload.type ?? MOOD_ILLUSTRATION_TYPE
  }
  const res = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000
  })
  const data = unwrapData(res)
  const ok =
    data.code === 0 ||
    data.code === '0' ||
    data.desc === 'success' ||
    data.statuscode === 'success'
  if (!ok) throw new Error(data.message || 'save failed')
  return data
}

export async function saveIllLegacyCreation(dataUrl, title, description, illType = 'others') {
  const blob = await resolvePictureUploadBlob(dataUrl)
  const form = new FormData()
  form.append('picture', blob, 'mood-poster.jpg')
  form.append('title', title || '')
  form.append('description', description || '')
  form.append('type', illType)

  const res = await axios.post('/ill/', form, {
    headers: {
      Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
    },
    timeout: 120000
  })
  const data = unwrapData(res)
  const ok = data?.desc === 'success' || data?.code === 0 || data?.code === '0'
  if (!ok) throw new Error(data.message || 'save failed')
  return data
}

export function getActiveMoodEndpoints() {
  return getMoodApiConfig()
}

/** 与「我的插画」列表一致：content 为 OSS 相对路径或完整 URL */
export function resolveIllustrationContentUrl(content) {
  if (content == null || content === '') return ''
  const s = String(content)
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s
  return `https://static.kidstory.cc/${s.replace(/^\//, '')}`
}

/**
 * 拉取当前用户类别为「心情」的插画（后端需支持 GET /ill/?type=心情）
 * @returns {Promise<Array>}
 */
export async function fetchUserMoodIllustrations(page = 1) {
  const type = encodeURIComponent(MOOD_ILLUSTRATION_TYPE)
  const res = await axios.get(`/ill/?page=${page}&sort_param=createdAt&sort_num=desc&type=${type}`, {
    headers: {
      Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
    },
    timeout: 30000
  })
  const data = unwrapData(res)
  const ok = data.code === 0 || data.code === '0' || data.desc === 'success'
  const raw = data.message ?? data.data
  const list = Array.isArray(raw) ? raw : []
  if (!ok && list.length === 0 && data.message && typeof data.message === 'string') {
    throw new Error(data.message)
  }
  return list
}

/**
 * @deprecated 请用 fetchCaptionMoodRecap；保留为返回纯文本的薄封装。
 * payload 建议使用 buildRecapCompletionPayload 生成。
 */
export async function fetchRecapChatCompletion(payload, endpoint) {
  const result = await fetchCaptionMoodRecap(payload, endpoint)
  return (result.recapText || result.overview || '').trim()
}
