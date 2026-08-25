/**
 * 日记横轴时间线
 * POST /diary-timeline/expand → expand-generate → 轮询 /create-character/task/:id
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

export async function expandDiaryTimeline(
  http,
  { diary, style, ratio } = {},
  opts = {}
) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.post(
    `${root}/diary-timeline/expand`,
    {
      diary: String(diary || '').trim(),
      style: style || 'horizontalAlt',
      ratio: ratio || '16:9',
    },
    { timeout: 90000, headers: authHeaders(opts.headers) }
  )
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '拆解失败')
  }
  return unwrapData(res)
}

export async function expandGenerateDiaryTimeline(
  http,
  { diary, style, ratio, plan, resolution } = {},
  opts = {}
) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const body = {
    diary: String(diary || '').trim(),
    style: style || 'horizontalAlt',
    ratio: ratio || '16:9',
  }
  if (plan && typeof plan === 'object') body.plan = plan
  if (resolution) body.resolution = resolution

  const res = await http.post(`${root}/diary-timeline/expand-generate`, body, {
    timeout: 90000,
    headers: authHeaders(opts.headers),
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

export async function generateDiaryTimeline(http, payload, opts = {}) {
  const submit = await expandGenerateDiaryTimeline(http, payload, opts)
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
    message: done.message,
    submit,
  }
}
