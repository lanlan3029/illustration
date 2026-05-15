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

/**
 * POST /api/v1/caption/image-describe（multipart）
 * 默认 generate_diary_caption=true：返回画面描述 + 约 90 字日记配文。
 * @param {Blob|File} file
 * @param {{
 *   hint?: string,
 *   narrative?: string,
 *   moodLabel?: string,
 *   userMood?: string,
 *   targetLength?: number,
 *   generateDiaryCaption?: boolean,
 *   filename?: string
 * }} [options]
 * @param {string} endpoint
 * @returns {Promise<{ description: string, sceneDescription: string, diaryCaption: string }>}
 */
export async function fetchCaptionImageDescribe(file, options = {}, endpoint) {
  const url = resolveApiUrl(endpoint)
  if (!url) throw new Error('caption image-describe endpoint missing')

  const {
    hint = '',
    narrative = '',
    moodLabel = '',
    userMood = '',
    targetLength = 90,
    generateDiaryCaption = true,
    filename = 'reference.jpg'
  } = options

  const fd = new FormData()
  fd.append('picture', file, filename)
  fd.append('hint', hint || '')
  const narrativeTrim = String(narrative || '').trim().slice(0, 500)
  if (narrativeTrim) fd.append('narrative', narrativeTrim)
  const mood = String(moodLabel || userMood || '').trim()
  if (mood) {
    fd.append('mood_label', mood)
    fd.append('user_mood', mood)
  }
  fd.append('target_length', String(targetLength))
  fd.append('generate_diary_caption', generateDiaryCaption ? 'true' : 'false')

  const res = await axios.post(url, fd, {
    timeout: 90000,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
    }
  })

  const data = unwrapData(res)
  const ok =
    data.code === 0 ||
    data.code === '0' ||
    data.desc === 'success' ||
    data.statuscode === 'success'

  const payload = data.data ?? data.message ?? data
  let description = ''
  let sceneDescription = ''
  let diaryCaption = ''

  if (typeof payload === 'string') {
    description = payload.trim()
    sceneDescription = description
  } else if (payload && typeof payload === 'object') {
    description = pickFirstStr(payload, ['description', 'caption', 'text', 'result', 'content'])
    sceneDescription =
      pickFirstStr(payload, ['scene_description', 'sceneDescription', 'description']) ||
      description
    diaryCaption = pickFirstStr(payload, ['diary_caption', 'diaryCaption'])
  }

  if (!description && !sceneDescription) {
    description = pickFirstStr(data, ['description', 'caption', 'text'])
    sceneDescription = description
  }

  if (!ok && !sceneDescription && !description) {
    throw new Error(
      typeof data.message === 'string'
        ? data.message
        : pickFirstStr(data, ['desc']) || 'image-describe failed'
    )
  }

  if (!sceneDescription) sceneDescription = description
  if (!description) description = sceneDescription

  return {
    description,
    sceneDescription,
    diaryCaption
  }
}

/** 写入草稿：画面描述 + 日记配文缓存 */
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
