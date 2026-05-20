import axios from 'axios'
import { MOOD_ILLUSTRATION_TYPE } from './constants'
import { getMoodApiConfig, resolveApiUrl } from './config'

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

function assertImageDescribeResponse(data, httpStatus) {
  const code = data?.code
  if (httpStatus === 429 || code === -2 || code === '-2') {
    const err = new Error(
      typeof data?.message === 'string' ? data.message : '请求过于频繁，请稍后再试'
    )
    err.rateLimited = true
    throw err
  }
  if (code === -1 || code === '-1') {
    throw new Error(typeof data?.message === 'string' ? data.message : 'image-describe failed')
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
        : pickFirstStr(data, ['desc']) || 'image-describe failed'
    )
  }
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

function shouldUseJsonBody(imageInput, options) {
  if (options.preferMultipart) return false
  if (options.imageUrl) return true
  if (options.imageBase64) return true
  if (typeof imageInput === 'string') {
    return imageInput.startsWith('data:') || /^https?:\/\//i.test(imageInput)
  }
  return false
}

function appendDescribeFormFields(fd, options) {
  const hint = String(options.hint || options.extraHint || '').trim()
  if (hint) {
    fd.append('hint', hint)
    fd.append('extra_hint', hint)
  }
  const narrativeTrim = String(options.narrative || '').trim().slice(0, 500)
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
  } else if (options.imageBase64) {
    body.image_base64 = options.imageBase64
  } else if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:')) body.image_base64 = imageInput
    else if (/^https?:\/\//i.test(imageInput)) body.image_url = imageInput
  }

  const hint = String(options.hint || options.extraHint || '').trim()
  if (hint) {
    body.hint = hint
    body.extra_hint = hint
  }
  const narrativeTrim = String(options.narrative || '').trim().slice(0, 500)
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

/**
 * POST /caption/image-describe
 * multipart（File）或 JSON（image_base64 / image_url）二选一。
 * @param {File|Blob|string|null} imageInput File/Blob 走 multipart；data URL / http URL 走 JSON
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
 *   imageBase64?: string,
 *   preferMultipart?: boolean
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
      if (!body.image_base64 && !body.image_url) {
        throw new Error('image_base64 or image_url required for JSON image-describe')
      }
      res = await axios.post(url, body, {
        timeout: 90000,
        headers: { ...authHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      let file = imageInput
      if (!(file instanceof Blob)) {
        if (!file) throw new Error('image file required for multipart image-describe')
        file = await dataUrlToFile(file, options.filename || 'reference.jpg')
      }
      const filename = options.filename || (file.name || 'reference.jpg')
      const fd = new FormData()
      fd.append('picture', file, filename)
      fd.append('image', file, filename)
      appendDescribeFormFields(fd, options)
      res = await axios.post(url, fd, {
        timeout: 90000,
        headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' }
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

export async function fetchCaptionPick(body, endpoint) {
  const url = resolveApiUrl(endpoint)
  const res = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000
  })
  return unwrapData(res)
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
  const body = {
    ...payload,
    type: payload.type ?? MOOD_ILLUSTRATION_TYPE,
    // 兼容后端可能使用 illustration_type（若后端不需要可忽略该字段）
    illustration_type: payload.illustration_type ?? payload.type ?? MOOD_ILLUSTRATION_TYPE
  }
  const res = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000
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
  const res = await axios.post(
    '/ill/',
    {
      picture: dataUrl,
      title,
      description,
      type: illType
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
      }
    }
  )
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
 * 将选定时间段内的日记条目发给对话补全类接口做复盘分析。
 * payload 建议使用 buildRecapCompletionPayload 生成。
 */
export async function fetchRecapChatCompletion(payload, endpoint) {
  const url = resolveApiUrl(endpoint)
  if (!url) throw new Error('recap completion endpoint missing')
  const res = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
    },
    timeout: 120000
  })
  const data = unwrapData(res)
  const inner = data.message ?? data.data ?? data
  if (typeof inner === 'string') return inner.trim()

  let text =
    pickFirstStr(inner, ['content', 'analysis', 'text', 'result', 'summary', 'reply']) ||
    ''

  const choiceMsg = inner?.choices?.[0]?.message ?? inner?.choices?.[0]
  if (!text && choiceMsg?.content) text = String(choiceMsg.content).trim()

  if (!text) text = typeof inner?.result === 'string' ? inner.result.trim() : ''

  if (!text) throw new Error(data.message || pickFirstStr(data, ['desc']) || 'recap analysis failed')
  return text
}
