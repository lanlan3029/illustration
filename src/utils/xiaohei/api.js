/**
 * 怪诞小黑正文配图 Skill
 * 一句话 → POST /xiaohei/expand-generate → 轮询 /create-character/task/:id
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
 * 只扩写，不生图
 * @returns {Promise<{ plan: object, final_prompt?: string }>}
 */
export async function expandXiaoheiSentence(http, sentence, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.post(
    `${root}/xiaohei/expand`,
    { sentence: String(sentence || '').trim() },
    { timeout: 60000, headers: authHeaders(opts.headers) }
  )
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '扩写失败')
  }
  return unwrapData(res)
}

/**
 * 扩写并入队生图（可传入已编辑 plan）
 * @returns {Promise<{ task_id: string, poll_url?: string, poll_interval_ms?: number, plan?: object }>}
 */
export async function expandGenerateXiaohei(http, { sentence, plan, size } = {}, opts = {}) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const body = {
    sentence: String(sentence || '').trim(),
  }
  if (plan?.core_idea) body.plan = plan
  if (size) body.size = size

  const res = await http.post(`${root}/xiaohei/expand-generate`, body, {
    timeout: 60000,
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

/**
 * 提交 + 轮询，返回可展示图片 URL
 */
export async function generateXiaoheiIllustration(http, payload, opts = {}) {
  const submit = await expandGenerateXiaohei(http, payload, opts)
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
