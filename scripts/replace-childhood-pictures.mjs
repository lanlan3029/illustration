#!/usr/bin/env node
/**
 * 替换服务器上指定的童年场景图（保留原记录 id / 排序，只换图片文件）。
 *
 * 用法：
 *   TOKEN=xxx node scripts/replace-childhood-pictures.mjs
 *   TOKEN=xxx node scripts/replace-childhood-pictures.mjs 02-spicy-sticks.png 15-scooter.png
 *   CUTOUT_DIR=/path/to/cutout TOKEN=xxx node scripts/replace-childhood-pictures.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getChildhoodPictureSeeds } from '../src/utils/childhoodSeedStories.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_BASE = (process.env.API_BASE || process.env.VUE_APP_API_BASE_URL || 'https://api.kidstory.cc').replace(/\/$/, '')
const TOKEN = process.env.TOKEN || ''
const PICTURE_TYPE = 'childhood'
const IS_PUBLIC = process.env.IS_PUBLIC ?? '1'
const DEFAULT_CUTOUT_DIR = path.resolve(
  __dirname,
  '../../ian-xiaohei-illustrations-main/styles/soft-line-pastel/scenes/cutout'
)
const CUTOUT_DIR = process.env.CUTOUT_DIR || DEFAULT_CUTOUT_DIR
const DEFAULT_FILES = ['02-spicy-sticks.png', '15-scooter.png']
const TARGET_FILES = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_FILES

function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${TOKEN}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

function contentPath(record) {
  const value = record?.content
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

async function fetchChildhoodList() {
  const url = `${API_BASE}/picture/?type=${PICTURE_TYPE}&sort_param=createdAt&sort_num=asc&page=1&limit=80`
  const res = await fetch(url, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok || (data.desc && data.desc !== 'success')) {
    throw new Error(`拉取图元失败: ${JSON.stringify(data)}`)
  }
  const list = data.message
  return Array.isArray(list) ? list : []
}

async function uploadTemp(story, filePath) {
  const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' })
  const form = new FormData()
  form.append('picture', blob, story.file)
  form.append('title', story.title || story.content.slice(0, 24))
  form.append('description', story.content)
  form.append('type', PICTURE_TYPE)
  form.append('is_public', IS_PUBLIC)

  const res = await fetch(`${API_BASE}/picture/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const data = await res.json()
  if (!res.ok || (data.desc && data.desc !== 'success')) {
    throw new Error(`上传失败: ${JSON.stringify(data)}`)
  }
  return data.message
}

async function updateContent(id, content) {
  const payload = { content: Array.isArray(content) ? content : [content] }
  const res = await fetch(`${API_BASE}/picture/${id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok || (data.desc && data.desc !== 'success')) {
    throw new Error(`更新失败: ${JSON.stringify(data)}`)
  }
  return data.message
}

async function hideTempRecord(id) {
  const res = await fetch(`${API_BASE}/picture/${id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify({ type: '_orphan', is_public: 0 }),
  })
  const data = await res.json()
  if (!res.ok || (data.desc && data.desc !== 'success')) {
    throw new Error(`隐藏临时记录失败: ${JSON.stringify(data)}`)
  }
}

async function verifyStaticUrl(relativePath) {
  const url = `https://static.kidstory.cc/${String(relativePath).replace(/^\//, '')}`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function replaceOne(story, existing) {
  const filePath = path.join(CUTOUT_DIR, story.file)
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`)
  }

  const oldPath = contentPath(existing)
  console.log(`→ ${story.title} (${story.file})`)
  console.log(`  原记录: ${existing._id}  ${oldPath || '(无路径)'}`)

  const temp = await uploadTemp(story, filePath)
  const newPath = contentPath(temp)
  if (!newPath) {
    throw new Error('上传后未返回 content 路径')
  }

  await updateContent(existing._id, newPath)
  // 不能 DELETE 临时记录：后端会 unlink 磁盘文件，而正式记录已指向同一路径 → CDN 404
  await hideTempRecord(temp._id)

  const onStatic = await verifyStaticUrl(newPath)
  console.log(`  ✓ 已替换为 ${newPath}`)
  if (!onStatic) {
    console.warn(
      `  ⚠ static.kidstory.cc 尚未能访问该文件，请在服务器同步 upload/ 到静态 CDN 后重试 HEAD`
    )
  }
}

async function main() {
  if (!TOKEN) {
    throw new Error('需要 TOKEN 环境变量（登录 token）')
  }

  const seeds = getChildhoodPictureSeeds().filter((story) => TARGET_FILES.includes(story.file))
  if (!seeds.length) {
    throw new Error(`未找到匹配的种子: ${TARGET_FILES.join(', ')}`)
  }

  console.log(`Replacing ${seeds.length} childhood pictures on ${API_BASE}`)
  console.log(`Cutout dir: ${CUTOUT_DIR}`)

  const list = await fetchChildhoodList()
  const byTitle = new Map(list.map((item) => [item.title, item]))

  let ok = 0
  for (const story of seeds) {
    const existing = byTitle.get(story.title)
    if (!existing?._id) {
      console.error(`✗ ${story.file}: 服务器上未找到 title="${story.title}" 的记录`)
      continue
    }
    try {
      await replaceOne(story, existing)
      ok += 1
    } catch (err) {
      console.error(`✗ ${story.file}:`, err.message)
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`Done: ${ok}/${seeds.length}`)
  if (ok !== seeds.length) process.exit(1)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
