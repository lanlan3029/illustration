/**
 * 拾景纸刊 Skill
 * 参考图 → POST /gathered-scenes/expand-generate → 轮询 /create-character/task/:id
 */
import {
  pollCreateCharacterTask,
  resolveGenerationImageUrl,
  DEFAULT_API_ORIGIN,
} from '@/utils/createCharacterTask'

function resolveApiRoot(apiBaseUrl) {
  const raw = apiBaseUrl || process.env.VUE_APP_API_BASE_URL || DEFAULT_API_ORIGIN
  return String(raw).replace(/\/$/, '')
}

function unwrapData(res) {
  return res?.data?.data || res?.data?.message || res?.data || res
}

function authHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra }
  if (headers.Authorization === undefined) {
    const token = localStorage.getItem('token')
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * @param {'gathered'|'distillation'} mode
 */
export function normalizeGatheredScenesMode(mode) {
  const m = String(mode || '').toLowerCase()
  if (m === 'distillation' || m === 'scene_distillation' || m === 'scenedistillation') {
    return 'distillation'
  }
  return 'gathered'
}

/**
 * 只分析，不生图
 */
export async function expandGatheredScenes(http, { mode, image, note } = {}, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.post(
    `${root}/gathered-scenes/expand`,
    {
      mode: normalizeGatheredScenesMode(mode),
      image: String(image || '').trim(),
      note: String(note || '').trim(),
    },
    { timeout: 130000, headers: authHeaders(opts.headers) }
  )
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '分析失败')
  }
  return unwrapData(res)
}

/**
 * 分析并入队生图
 */
export async function expandGenerateGatheredScenes(
  http,
  { mode, image, note, plan, size, resolution } = {},
  opts = {}
) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const body = {
    mode: normalizeGatheredScenesMode(mode),
    image: String(image || '').trim(),
    note: String(note || '').trim(),
  }
  if (plan && typeof plan === 'object') body.plan = plan
  if (size) body.size = size
  if (resolution) body.resolution = resolution

  const res = await http.post(`${root}/gathered-scenes/expand-generate`, body, {
    timeout: 130000,
    headers: authHeaders(opts.headers),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  const data = unwrapData(res)
  if (res.data?.code !== 0 && res.data?.code !== '0' && res.status !== 202) {
    throw new Error(res.data?.message || '提交生图失败')
  }
  const taskId = data?.task_id || data?.taskId
  if (!taskId) throw new Error('未返回 task_id')
  return {
    ...data,
    task_id: taskId,
    poll_url: data.poll_url || data.pollUrl,
    poll_interval_ms: data.poll_interval_ms || data.pollIntervalMs || 2000,
  }
}

/**
 * 提交 + 轮询
 */
export async function generateGatheredScenesPoster(http, payload, opts = {}) {
  const submit = await expandGenerateGatheredScenes(http, payload, opts)
  const done = await pollCreateCharacterTask(http, submit.task_id, {
    pollUrl: submit.poll_url,
    pollIntervalMs: submit.poll_interval_ms || 2000,
    apiBaseUrl: opts.apiBaseUrl,
    headers: opts.headers,
  })
  const imageUrl = resolveGenerationImageUrl(done.message, opts.apiBaseUrl)
  if (!imageUrl) throw new Error('任务成功但无图片')
  return {
    imageUrl,
    plan: submit.plan,
    mode: submit.mode,
    message: done.message,
    submit,
  }
}
