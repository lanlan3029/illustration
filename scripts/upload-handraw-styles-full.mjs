#!/usr/bin/env node
/**
 * 将 handraw-style 全部 001–279 风格（预览图 + 提示词）上传到 KidStory 风格库
 * 接口与 https://www.kidstory.cc/user/upload/style-prompt 相同：
 *   POST /api/admin/illustration-styles/  (multipart: picture + 文案)
 *
 * 默认路径（可改 HANDRAW_ROOT）：
 *   images/individual/001-200/*.webp
 *   images/individual/201-400/*.webp
 *   skills/handdraw-style-prompter/references/styles.json
 *
 * 用法：
 *   HANDRAW_ROOT="/path/to/handraw-style-master" \
 *   TOKEN=<管理员JWT> \
 *   node scripts/upload-handraw-styles-full.mjs
 *
 *   node scripts/upload-handraw-styles-full.mjs --dry-run
 *   node scripts/upload-handraw-styles-full.mjs --from 001 --to 050
 *   node scripts/upload-handraw-styles-full.mjs --delay 300
 *
 * id 规则：1000 + handraw 编号（001 → 1001），避免与现有 1–36 冲突
 *
 * 上传成功后须把后端 public/prompt/*.webp 同步到 static.kidstory.cc（与 deploy 一致），
 * 否则前端只能走 api.kidstory.cc/prompt/；若该路径未开放静态文件则会裂图。
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  buildHandrawArtStyleEn,
  buildHandrawArtStyleZh,
  buildHandrawElementDetailsEn,
  buildHandrawElementDetailsZh,
} from './lib/handrawStyleText.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_HANDRAW_ROOT = path.join(
  process.env.HOME || '',
  'Downloads/今天下载/handraw-style-master'
)

const ID_OFFSET = Number(process.env.HANDRAW_ID_OFFSET || 1000)
const token = process.env.TOKEN || ''
const apiBase = (process.env.API_BASE || 'https://api.kidstory.cc').replace(/\/$/, '')
const handrawRoot = process.env.HANDRAW_ROOT || DEFAULT_HANDRAW_ROOT

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const delayMs = Number(getArg('--delay', '400'))
const fromNum = parseArgNum('--from', 1)
const toNum = parseArgNum('--to', 279)

function getArg(name, fallback) {
  const i = args.indexOf(name)
  if (i === -1) return fallback
  return args[i + 1] ?? fallback
}

function parseArgNum(name, fallback) {
  const raw = getArg(name, String(fallback))
  return parseInt(String(raw).replace(/^0+/, '') || '0', 10) || fallback
}

function pad3(n) {
  return String(n).padStart(3, '0')
}

function resolveIndividualImage(root, number) {
  const name = `${number}.webp`
  const dirs = [
    path.join(root, 'images/individual/001-200'),
    path.join(root, 'images/individual/201-400'),
    path.join(root, 'images/individual'),
  ]
  for (const dir of dirs) {
    const full = path.join(dir, name)
    if (fs.existsSync(full)) return full
  }
  return ''
}

function categoryFromGroup(group) {
  const g = String(group || '')
  if (/社论|幽默/.test(g)) return 'sketch'
  if (/绘本|叙事/.test(g)) return 'pastel'
  if (/平面|艺术化/.test(g)) return 'flat'
  if (/日本/.test(g)) return 'cartoon'
  if (/中国/.test(g)) return 'ink'
  if (/网感|媒介|地域/.test(g)) return 'marker'
  return 'other'
}

function toCamelKey(num, generationName) {
  const words = String(generationName || 'Style')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const tail = words
    .map((w, i) => {
      const lower = w.toLowerCase()
      if (i === 0) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
  let key = `handraw${num}${tail || 'Style'}`
  key = key.replace(/[^a-zA-Z0-9]/g, '')
  if (!/^[a-z]/.test(key)) key = `h${key}`
  return key.slice(0, 56)
}

function buildRecords(styles) {
  return styles
    .map((entry) => {
      const numInt = parseInt(entry.number, 10)
      if (!numInt || numInt < fromNum || numInt > toNum) return null
      const num = pad3(numInt)
      const imagePath = resolveIndividualImage(handrawRoot, num)
      if (!imagePath) return null
      const id = ID_OFFSET + numInt
      const key = toCamelKey(num, entry.generation_name)
      return {
        id,
        key,
        num,
        numInt,
        category: categoryFromGroup(entry.group),
        art_style_zh: buildHandrawArtStyleZh(entry),
        art_style_en: buildHandrawArtStyleEn(entry),
        element_details_zh: buildHandrawElementDetailsZh(entry),
        element_details_en: buildHandrawElementDetailsEn(entry),
        imagePath,
        sort_order: numInt,
      }
    })
    .filter(Boolean)
}

async function uploadOne(record) {
  const blob = new Blob([fs.readFileSync(record.imagePath)], { type: 'image/webp' })
  const form = new FormData()
  form.append('picture', blob, `${record.id}.webp`)
  form.append('id', String(record.id))
  form.append('key', record.key)
  form.append('category', record.category)
  form.append('art_style_zh', record.art_style_zh)
  form.append('art_style_en', record.art_style_en)
  form.append('element_details_zh', record.element_details_zh)
  form.append('element_details_en', record.element_details_en)
  form.append('sort_order', String(record.sort_order))
  form.append('is_enabled', 'true')

  const res = await fetch(`${apiBase}/api/admin/illustration-styles/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text.slice(0, 200) }
  }
  if (!res.ok || (data.code !== 0 && data.code !== '0')) {
    const hint =
      res.status === 403 || data.code === 1004
        ? '（需管理员 JWT，且账号 isadmin）'
        : res.status === 401
          ? '（TOKEN 无效或过期）'
          : ''
    throw new Error(`${data.message || `HTTP ${res.status}`}${hint}`)
  }
  return data
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const stylesPath = path.join(
    handrawRoot,
    'skills/handdraw-style-prompter/references/styles.json'
  )
  if (!fs.existsSync(stylesPath)) {
    console.error('找不到 styles.json:', stylesPath)
    console.error('请设置 HANDRAW_ROOT 指向 handraw-style-master 解压目录')
    process.exit(1)
  }

  const styles = JSON.parse(fs.readFileSync(stylesPath, 'utf8'))
  const records = buildRecords(styles)
  const missing = styles.filter((s) => {
    const n = parseInt(s.number, 10)
    if (n < fromNum || n > toNum) return false
    return !resolveIndividualImage(handrawRoot, pad3(n))
  })

  console.log(`HANDRAW_ROOT=${handrawRoot}`)
  console.log(`待上传: ${records.length} 条 (编号 ${pad3(fromNum)}–${pad3(toNum)}, id ${ID_OFFSET + fromNum}–${ID_OFFSET + toNum})`)
  if (missing.length) {
    console.warn(`缺少预览图: ${missing.map((m) => m.number).join(', ')}`)
  }

  if (dryRun) {
    console.log(JSON.stringify(records.slice(0, 3), null, 2))
    console.log(`… 共 ${records.length} 条 (dry-run)`)
    return
  }

  if (!token) {
    console.error('缺少 TOKEN（管理员 JWT，与 style-prompt 页登录同一账号）')
    process.exit(1)
  }

  try {
    const probe = await fetch(`${apiBase}/api/admin/illustration-styles/?is_enabled=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const probeData = await probe.json().catch(() => ({}))
    if (!probe.ok || (probeData.code !== 0 && probeData.code !== '0')) {
      console.error('管理员接口不可用:', probe.status, probeData.message || probeData)
      console.error('请确认 TOKEN 为管理员登录 token，且 API_BASE 指向生产/测试后端')
      process.exit(1)
    }
    console.log(`管理端当前风格数: ${(probeData.data || []).length}`)
  } catch (e) {
    console.error('无法连接 API:', e.message)
    process.exit(1)
  }

  let ok = 0
  let fail = 0
  for (const record of records) {
    try {
      await uploadOne(record)
      ok += 1
      console.log(`OK #${record.num} → id ${record.id} (${record.key})`)
    } catch (err) {
      fail += 1
      console.error(`FAIL #${record.num} id ${record.id}:`, err.message)
    }
    if (delayMs > 0) await sleep(delayMs)
  }

  console.log(`完成: success=${ok}, failed=${fail}`)
  if (fail) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
