/**
 * KidStory 原片抽象编页（自研）
 * 参考图 → 抽象母题异步任务 → 本地合成原片+色板+标题
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

export async function expandGeneratePhotoEditorial(
  http,
  { image, note, plan, size, resolution, photoWidth, photoHeight } = {},
  opts = {}
) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const body = {
    image: String(image || '').trim(),
    note: String(note || '').trim(),
  }
  if (plan && typeof plan === 'object') body.plan = plan
  if (size) body.size = size
  if (resolution) body.resolution = resolution
  if (Number(photoWidth) > 0) body.photo_width = Number(photoWidth)
  if (Number(photoHeight) > 0) body.photo_height = Number(photoHeight)

  const res = await http.post(`${root}/photo-editorial/expand-generate`, body, {
    timeout: 130000,
    headers: authHeaders(opts.headers),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  const data = unwrapData(res)
  if (res.data?.code !== 0 && res.data?.code !== '0' && res.status !== 202) {
    throw new Error(res.data?.message || '提交失败')
  }
  const taskId = data?.task_id || data?.taskId
  if (!taskId) throw new Error('未返回 task_id')
  return {
    ...data,
    task_id: taskId,
    session_id: data.session_id || data.sessionId,
    poll_url: data.poll_url || data.pollUrl,
    poll_interval_ms: data.poll_interval_ms || data.pollIntervalMs || 2000,
  }
}

export async function composePhotoEditorial(
  http,
  { sessionId, motifUrl, plan } = {},
  opts = {}
) {
  const root = resolveApiRoot(opts.apiBaseUrl)
  const res = await http.post(
    `${root}/photo-editorial/compose`,
    {
      session_id: sessionId,
      motif_url: motifUrl,
      plan,
    },
    {
      timeout: 120000,
      headers: authHeaders(opts.headers),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  )
  const data = unwrapData(res)
  if (res.data?.code !== 0 && res.data?.code !== '0') {
    throw new Error(res.data?.message || '合成失败')
  }
  if (!data?.image) throw new Error('合成成功但无图片')
  return data
}

/**
 * 母题生成 + 轮询 + 本地合成
 */
export async function generatePhotoEditorial(http, payload, opts = {}) {
  const submit = await expandGeneratePhotoEditorial(http, payload, opts)
  const done = await pollCreateCharacterTask(http, submit.task_id, {
    pollUrl: submit.poll_url,
    pollIntervalMs: submit.poll_interval_ms || 2000,
    apiBaseUrl: opts.apiBaseUrl,
    headers: opts.headers,
  })
  const motifUrl = resolveGenerationImageUrl(done.message, opts.apiBaseUrl)
  if (!motifUrl) throw new Error('母题任务成功但无图片')

  const composed = await composePhotoEditorial(
    http,
    {
      sessionId: submit.session_id,
      motifUrl,
      plan: submit.plan,
    },
    opts
  )

  return {
    imageUrl: composed.image,
    plan: composed.plan || submit.plan,
    sessionId: submit.session_id,
    motifUrl,
    message: done.message,
    submit,
  }
}
