import axios from 'axios'
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
 * @param {Blob|File} file
 * @param {string} hint
 * @param {string} endpoint
 */
export async function fetchImageDescribe(file, hint, endpoint) {
  const url = resolveApiUrl(endpoint)
  const fd = new FormData()
  fd.append('picture', file, 'reference.jpg')
  fd.append('hint', hint || '')
  const res = await axios.post(url, fd, {
    timeout: 120000,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  const data = unwrapData(res)
  const msg = data.message || data.data || data
  const text =
    pickFirstStr(msg, ['description', 'caption', 'text', 'result', 'content']) ||
    (typeof msg === 'string' ? msg : '')
  return text || pickFirstStr(data, ['description', 'caption', 'text'])
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

export async function fetchQuotaSentence(body, endpoint) {
  const url = resolveApiUrl(endpoint)
  const res = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 90000
  })
  const data = unwrapData(res)
  const msg = data.message || data.data || data
  if (typeof msg === 'string') return { sentence: msg, matching: body.matching }
  return {
    sentence: pickFirstStr(msg, ['sentence', 'text', 'caption', 'quote']),
    matching: msg.matching || msg.match || body.matching
  }
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
  const res = await axios.post(url, payload, {
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

export async function saveIllLegacyCreation(dataUrl, title, description) {
  const res = await axios.post(
    '/ill/',
    {
      picture: dataUrl,
      title,
      description,
      type: 'others'
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
