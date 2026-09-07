/**
 * 心情日记 · AI 相关涂鸦图元
 *
 * 流程：
 * 1) 根据日记正文规划 3–6 个「可画物件」主题（优先后端 LLM；失败则本地抽取）
 * 2) 每个主题用 create-character 生成白底黑线涂鸦
 * 3) 白底抠成透明 PNG，供手账拼贴排版 / 临时图元使用
 */
import axios from 'axios'
import { createCharacterIllustration } from './api'
import { getMoodApiConfig, resolveApiUrl } from './config'
import { matCharacterImageUrl } from '@/utils/canvasMatting'

const MAX_DOODLES = 5
const MIN_DOODLES = 3

function unwrapData(res) {
  const d = res && res.data !== undefined ? res.data : res
  return d
}

function authHeaders() {
  const token = localStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

/**
 * 涂鸦生图提示：线稿贴纸，白底，无字，便于抠透明
 * @param {{ label: string, hint?: string }} motif
 * @param {{ diary?: string, moodLabel?: string }} ctx
 */
export function buildDoodleImagePrompt(motif, ctx = {}) {
  const label = String(motif?.label || '').trim() || '小物件'
  const hint = String(motif?.hint || '').trim()
  const mood = String(ctx.moodLabel || '').trim()
  const diaryBit = String(ctx.diary || '')
    .trim()
    .slice(0, 80)
  return [
    `儿童手账黑线简笔画贴纸：${label}`,
    hint ? `细节：${hint}` : '',
    diaryBit ? `来自日记语境：${diaryBit}` : '',
    mood ? `情绪氛围：${mood}` : '',
    '单物件居中，粗细均匀的黑色轮廓线，极简涂鸦，无填色或仅极淡灰',
    '纯白背景，无阴影，无透视场景，无边框，无文字无字母无水印',
    '像手账本上随手画的小图标，透明贴纸感，PNG 白底'
  ]
    .filter(Boolean)
    .join('，')
}

/**
 * 本地从日记抽可画物件（无后端时的兜底；仍靠 AI 生图保证「图元」质量）
 * @param {string} diary
 * @param {string} [moodLabel]
 * @returns {{ id: string, label: string, hint: string }[]}
 */
export function planDoodlesLocal(diary, moodLabel = '') {
  const text = String(diary || '').trim()
  const found = []
  const push = (label, hint = '') => {
    if (!label || found.some((x) => x.label === label)) return
    found.push({
      id: `local-${found.length + 1}`,
      label,
      hint
    })
  }

  // 常见「看得见」的日记物件（按出现优先）
  const lexicon = [
    ['咖啡', '一杯咖啡'],
    ['奶茶', '一杯奶茶'],
    ['花束', '一束花'],
    ['花', '一朵小花'],
    ['猫', '一只小猫剪影'],
    ['狗', '一只小狗'],
    ['海', '海浪与太阳'],
    ['雨', '雨伞或雨滴'],
    ['火车', '小火车'],
    ['地铁', '地铁车厢示意'],
    ['飞机', '小飞机'],
    ['自行车', '自行车'],
    ['书', '一本打开的书'],
    ['相机', '旁轴相机'],
    ['电影', '胶片与票根'],
    ['票', '一张车票'],
    ['蛋糕', '一小块蛋糕'],
    ['面包', '面包'],
    ['月亮', '弯月'],
    ['星星', '小星星'],
    ['心', '爱心'],
    ['信', '信封'],
    ['耳机', '耳机'],
    ['月亮', '月亮'],
    ['日落', '夕阳'],
    ['树', '一棵小树'],
    ['山', '远山轮廓'],
    ['雪', '雪花'],
    ['风筝', '风筝'],
    ['气球', '气球'],
    ['戒指', '戒指'],
    ['戒指', '小戒指'],
    ['酒', '高脚杯'],
    ['茶', '茶杯']
  ]

  for (const [key, label] of lexicon) {
    if (text.includes(key)) push(label, `日记提到「${key}」`)
    if (found.length >= MAX_DOODLES) break
  }

  // 情绪兜底涂鸦
  const moodFallbacks = {
    开心: ['小太阳', '爱心'],
    快乐: ['小太阳', '气球'],
    难过: ['乌云', '雨滴'],
    平静: ['叶子', '茶杯'],
    想你: ['信封', '爱心'],
    恋爱: ['花束', '爱心']
  }
  const mood = String(moodLabel || '')
  for (const [k, arr] of Object.entries(moodFallbacks)) {
    if (mood.includes(k)) arr.forEach((l) => push(l, `心情：${k}`))
  }

  const fillers = ['小星星', '箭头', '爱心', '叶子', '相机']
  for (const l of fillers) {
    if (found.length >= MIN_DOODLES) break
    push(l, '手账点缀')
  }

  return found.slice(0, MAX_DOODLES)
}

/**
 * 解析后端返回的 doodles 列表
 * @param {any} raw
 */
function normalizeDoodlePlan(raw) {
  let list = raw
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    list = raw.doodles || raw.items || raw.motifs || raw.list || []
  }
  if (!Array.isArray(list)) return []
  return list
    .map((item, i) => {
      if (typeof item === 'string') {
        return { id: `ai-${i + 1}`, label: item.trim(), hint: '' }
      }
      if (!item || typeof item !== 'object') return null
      const label = String(item.label || item.name || item.title || item.object || '').trim()
      if (!label) return null
      return {
        id: String(item.id || `ai-${i + 1}`),
        label,
        hint: String(item.hint || item.detail || item.reason || '').trim()
      }
    })
    .filter(Boolean)
    .slice(0, MAX_DOODLES)
}

/**
 * AI 规划涂鸦主题
 * - 优先 POST /mood/scrapbook-doodles（或 env VUE_APP_MOOD_SCRAPBOOK_DOODLES）
 * - 否则本地抽取可见物件
 *
 * @param {import('axios').AxiosInstance | null} http
 * @param {{ diary: string, moodLabel?: string }} input
 * @returns {Promise<{ doodles: { id: string, label: string, hint: string }[], source: 'api'|'local' }>}
 */
export async function planScrapbookDoodles(http, input = {}) {
  const diary = String(input.diary || '').trim()
  const moodLabel = String(input.moodLabel || '').trim()
  if (!diary) {
    return { doodles: planDoodlesLocal('', moodLabel), source: 'local' }
  }

  const cfg = getMoodApiConfig()
  const endpoint =
    resolveApiUrl(
      (process.env.VUE_APP_MOOD_SCRAPBOOK_DOODLES || '').trim() ||
        cfg.scrapbookDoodlesEndpoint ||
        '/mood/scrapbook-doodles'
    ) || null

  if (endpoint && http) {
    try {
      const res = await http.post(
        endpoint,
        {
          diary: diary.slice(0, 2000),
          mood: moodLabel,
          mood_label: moodLabel,
          max: MAX_DOODLES,
          style: 'black_line_scrapbook_doodle'
        },
        { timeout: 60000, headers: authHeaders() }
      )
      const data = unwrapData(res)
      if (data?.code === 0 || data?.code === '0' || res.status === 200) {
        const payload = data?.data ?? data?.message ?? data
        const doodles = normalizeDoodlePlan(payload)
        if (doodles.length >= 2) {
          return { doodles: doodles.slice(0, MAX_DOODLES), source: 'api' }
        }
      }
    } catch (e) {
      console.warn('[mood-diary] scrapbook-doodles plan API failed, fallback local', e?.message || e)
    }
  }

  // 无专用接口时：用 caption/pick 的 illustration_prompt 当线索，再合并本地抽取
  try {
    const pickUrl = cfg.captionPickEndpoint
    if (pickUrl) {
      const url = resolveApiUrl(pickUrl)
      const res = await axios.post(
        url,
        {
          generate_illustration_prompt: true,
          narrative: diary.slice(0, 500),
          user_mood: moodLabel,
          instruction:
            '请从日记中列出3到5个适合手账黑线涂鸦的具体物件名称，用中文名词，逗号分隔，不要句子。'
        },
        { timeout: 60000, headers: authHeaders() }
      )
      const data = unwrapData(res)
      const payload = data?.data ?? data?.message ?? data
      const prompt = String(
        payload?.illustration_prompt ||
          payload?.illustrationPrompt ||
          payload?.prompt ||
          ''
      )
      const fromPrompt = prompt
        .split(/[,，、；;]/n]/)
        .map((s) => s.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '').trim())
        .filter((s) => s.length >= 1 && s.length <= 8)
        .slice(0, MAX_DOODLES)
        .map((label, i) => ({ id: `pick-${i + 1}`, label, hint: '来自日记 AI 提取' }))
      if (fromPrompt.length >= 2) {
        const local = planDoodlesLocal(diary, moodLabel)
        const merged = []
        ;[...fromPrompt, ...local].forEach((d) => {
          if (!merged.some((x) => x.label === d.label)) merged.push(d)
        })
        return { doodles: merged.slice(0, MAX_DOODLES), source: 'api' }
      }
    }
  } catch (e) {
    console.warn('[mood-diary] doodle plan via caption/pick failed', e?.message || e)
  }

  return { doodles: planDoodlesLocal(diary, moodLabel), source: 'local' }
}

/**
 * 生成单个透明涂鸦图元
 * @param {{ label: string, hint?: string, id?: string }} motif
 * @param {{ diary?: string, moodLabel?: string, skipMatting?: boolean }} ctx
 */
export async function generateScrapbookDoodleAsset(motif, ctx = {}) {
  const prompt = buildDoodleImagePrompt(motif, ctx)
  const { imageUrl } = await createCharacterIllustration({
    prompt,
    character_name: `mood_doodle_${motif.label || 'item'}`,
    character_type: 'decoration',
    size: '512x512',
    quality: 'standard',
    watermark: false
  })
  if (!imageUrl) throw new Error('涂鸦生成失败')

  let transparentUrl = imageUrl
  if (!ctx.skipMatting) {
    try {
      transparentUrl = await matCharacterImageUrl(imageUrl, { threshold: 245 })
    } catch (e) {
      console.warn('[mood-diary] doodle matting failed, use raw', e?.message || e)
      transparentUrl = imageUrl
    }
  }

  return {
    id: motif.id || `doodle-${Date.now()}`,
    label: motif.label,
    hint: motif.hint || '',
    prompt,
    imageUrl,
    transparentUrl
  }
}

/**
 * 日记 → 规划 → 批量生成涂鸦图元
 * @param {import('axios').AxiosInstance | null} http
 * @param {{ diary: string, moodLabel?: string, max?: number, onProgress?: (done: number, total: number, asset?: object) => void }} input
 */
export async function generateScrapbookDoodlesFromDiary(http, input = {}) {
  const diary = String(input.diary || '').trim()
  const moodLabel = String(input.moodLabel || '').trim()
  const max = Math.min(MAX_DOODLES, Math.max(1, Number(input.max) || MAX_DOODLES))

  const { doodles, source } = await planScrapbookDoodles(http, { diary, moodLabel })
  const plan = doodles.slice(0, max)
  const assets = []

  for (let i = 0; i < plan.length; i++) {
    try {
      const asset = await generateScrapbookDoodleAsset(plan[i], { diary, moodLabel })
      assets.push(asset)
      input.onProgress?.(i + 1, plan.length, asset)
    } catch (e) {
      console.warn('[mood-diary] doodle generate failed', plan[i]?.label, e?.message || e)
      input.onProgress?.(i + 1, plan.length, null)
    }
  }

  return { plan, assets, source }
}
