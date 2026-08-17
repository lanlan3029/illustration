import axios from 'axios'
import {
  pollCreateCharacterTask,
  resolveGenerationImageUrl,
  DEFAULT_API_ORIGIN
} from '@/utils/createCharacterTask'
import { compressDataUrlForUpload } from '@/utils/moodDiary/posterUpload'

const API_BASE = (process.env.VUE_APP_API_BASE_URL || DEFAULT_API_ORIGIN).replace(/\/$/, '')
const MEMORY_JOURNAL_PATH = '/mood-diary/memory-journal'

function authHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
  return token && token !== 'undefined'
    ? { Authorization: `Bearer ${token}` }
    : {}
}

/** 粗指纹：与后端一致，避免同一张图在数组里出现两次 */
function photoFingerprint(src) {
  const s = String(src || '').trim()
  if (!s) return ''
  if (s.length <= 120) return s
  return `${s.slice(0, 64)}|${s.length}|${s.slice(-48)}`
}

/**
 * 规范为照片数组（绝不为单字符串 / 只取第一张；按指纹去重）
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeMemoryJournalPhotos(raw) {
  const incoming = Array.isArray(raw)
    ? raw
    : (typeof raw === 'string' && raw.trim() ? [raw.trim()] : [])
  const out = []
  const seen = new Set()
  for (const item of incoming) {
    if (typeof item !== 'string') continue
    const t = item.trim()
    if (!t) continue
    const fp = photoFingerprint(t)
    if (!fp || seen.has(fp)) continue
    seen.add(fp)
    out.push(t)
    if (out.length >= 9) break
  }
  return out
}

/**
 * 压缩照片列表后再提交（1～9 张 dataURL；张数多时单张更小，保证全部能进 photos[]）
 * @param {string[]} photos
 * @param {number} [maxBytes]
 */
export async function compressMemoryJournalPhotos(photos, maxBytes) {
  const list = normalizeMemoryJournalPhotos(photos)
  const n = list.length
  const per =
    maxBytes != null
      ? maxBytes
      : n >= 6
        ? 380 * 1024
        : n >= 3
          ? 520 * 1024
          : 720 * 1024
  const out = await Promise.all(list.map((p) => compressDataUrlForUpload(p, per)))
  return out.filter((p) => typeof p === 'string' && p.startsWith('data:'))
}

/**
 * 请求体：必须带完整 photos 数组（后端按数组贴多张贴纸）
 * @param {object} fields
 * @param {string[]} photos
 */
function buildMemoryJournalBody(fields, photos) {
  const list = normalizeMemoryJournalPhotos(photos)
  return {
    diary: String(fields.diary || '').trim(),
    // 只传 photos；勿再附带 images/photo/image，否则后端会重复计入贴纸
    photos: list,
    date: fields.date || undefined,
    name: fields.name || undefined,
    ...(fields.extra || {})
  }
}

/**
 * 只分析、不生图
 * @param {{ diary: string, photos: string[], date?: string, name?: string, http?: import('axios').AxiosInstance }} opts
 */
export async function analyzeMemoryJournal(opts) {
  const http = opts.http || axios
  const photos = await compressMemoryJournalPhotos(opts.photos || [])
  if (!photos.length) {
    throw new Error('请至少上传一张照片')
  }
  const res = await http.post(
    MEMORY_JOURNAL_PATH,
    buildMemoryJournalBody(
      {
        diary: opts.diary,
        date: opts.date,
        name: opts.name,
        extra: { analyze_only: true, generate: false }
      },
      photos
    ),
    {
      timeout: 180000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      }
    }
  )
  const body = res.data || {}
  if (body.code !== undefined && body.code !== 0 && body.code !== '0') {
    throw new Error(body.message || body.desc || '分析失败')
  }
  return body.data || body.message || body
}

/**
 * 提交记忆手账流水线 → 轮询取主图
 * @param {{
 *   diary: string,
 *   photos: string[],
 *   date?: string,
 *   name?: string,
 *   onStage?: (s: { key?: string, label?: string }) => void,
 *   http?: import('axios').AxiosInstance,
 *   apiBaseUrl?: string,
 * }} opts
 * photos: dataURL[]，1～9 张（全部放入 photos，不要只传一张）
 */
export async function generateMemoryJournalPoster(opts) {
  const { diary, date, name, onStage } = opts
  const http = opts.http || axios
  const apiBase = (opts.apiBaseUrl || API_BASE).replace(/\/$/, '')

  onStage?.({ key: 'photo', label: '正在理解你的照片' })
  const inputList = normalizeMemoryJournalPhotos(opts.photos)
  const photos = await compressMemoryJournalPhotos(inputList)
  if (!photos.length) {
    throw new Error('请至少上传一张照片')
  }
  if (photos.length < inputList.length) {
    console.warn(
      '[memory-journal] some photos dropped after compress',
      inputList.length,
      '→',
      photos.length
    )
  }

  const requestBody = buildMemoryJournalBody(
    {
      diary,
      date,
      name,
      extra: { generate: true }
    },
    photos
  )
  // 防御：必须是数组且含全部张数
  if (!Array.isArray(requestBody.photos) || requestBody.photos.length !== photos.length) {
    throw new Error('照片列表组装失败，请重试')
  }

  const submit = await http.post(
    MEMORY_JOURNAL_PATH,
    requestBody,
    {
      timeout: 180000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      }
    }
  )

  const body = submit.data || {}
  if (body.code !== undefined && body.code !== 0 && body.code !== '0') {
    throw new Error(body.message || body.desc || '提交失败')
  }

  const payload = body.data || body.message || body || {}
  const stages = Array.isArray(payload.stages) ? payload.stages : []
  stages.forEach((s) => onStage?.(s))

  if (!payload.async || !payload.task_id) {
    // 同步兜底：直接带图
    const syncUrl = resolveGenerationImageUrl(payload, apiBase)
      || resolveGenerationImageUrl(payload.result || {}, apiBase)
    if (syncUrl) {
      return {
        imageUrl: syncUrl,
        analysis: payload.analysis || null,
        taskId: payload.task_id || '',
        finalPrompt: payload.final_prompt || ''
      }
    }
    throw new Error(body.message || '未返回 task_id')
  }

  onStage?.({ key: 'image', label: '正在生成收藏页' })
  const done = await pollCreateCharacterTask(http, payload.task_id, {
    pollUrl: payload.poll_url,
    pollIntervalMs: payload.poll_interval_ms || 2000,
    apiBaseUrl: apiBase,
    maxWaitMs: 600000
  })
  const message = done?.message || done
  const imageUrl = resolveGenerationImageUrl(message, apiBase)
  if (!imageUrl) throw new Error('生成成功但未拿到图片地址')

  const analysis =
    message?.analysis
    || payload.analysis
    || (message?.diary || message?.caption ? message : null)

  return {
    imageUrl,
    analysis,
    taskId: payload.task_id,
    finalPrompt: payload.final_prompt || message?.final_prompt || ''
  }
}
