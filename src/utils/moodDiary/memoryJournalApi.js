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

/**
 * 压缩照片列表后再提交（1～9 张 dataURL）
 * @param {string[]} photos
 * @param {number} [maxBytes]
 */
export async function compressMemoryJournalPhotos(photos, maxBytes = 720 * 1024) {
  const list = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, 9)
  return Promise.all(list.map((p) => compressDataUrlForUpload(p, maxBytes)))
}

/**
 * 只分析、不生图
 * @param {{ diary: string, photos: string[], date?: string, name?: string, http?: import('axios').AxiosInstance }} opts
 */
export async function analyzeMemoryJournal(opts) {
  const http = opts.http || axios
  const photos = await compressMemoryJournalPhotos(opts.photos || [])
  const res = await http.post(
    MEMORY_JOURNAL_PATH,
    {
      diary: String(opts.diary || '').trim(),
      photos,
      date: opts.date || undefined,
      name: opts.name || undefined,
      analyze_only: true,
      generate: false
    },
    {
      timeout: 180000,
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
 * photos: dataURL[]，1～9 张
 */
export async function generateMemoryJournalPoster(opts) {
  const { diary, date, name, onStage } = opts
  const http = opts.http || axios
  const apiBase = (opts.apiBaseUrl || API_BASE).replace(/\/$/, '')

  onStage?.({ key: 'photo', label: '正在理解你的照片' })
  const photos = await compressMemoryJournalPhotos(opts.photos || [])
  if (!photos.length) {
    throw new Error('请至少上传一张照片')
  }

  const submit = await http.post(
    MEMORY_JOURNAL_PATH,
    {
      diary: String(diary || '').trim(),
      photos,
      date: date || undefined,
      name: name || undefined,
      generate: true
    },
    {
      timeout: 180000,
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

  return {
    imageUrl,
    analysis: payload.analysis || null,
    taskId: payload.task_id,
    finalPrompt: payload.final_prompt || ''
  }
}
