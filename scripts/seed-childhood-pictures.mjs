#!/usr/bin/env node
/**
 * 将童年 cutout 场景图上传到 /picture/ 图元接口。
 *
 * 用法：
 *   TOKEN=xxx node scripts/seed-childhood-pictures.mjs
 *   CUTOUT_DIR=/path/to/cutout TOKEN=xxx node scripts/seed-childhood-pictures.mjs
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

async function uploadOne(story, index) {
  if (!TOKEN) {
    throw new Error('需要 TOKEN 环境变量（管理员登录 token）')
  }

  const filePath = path.join(CUTOUT_DIR, story.file)
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`)
  }

  const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' })
  const form = new FormData()
  form.append('picture', blob, story.file)
  form.append('title', story.title || story.content.slice(0, 24))
  form.append('description', story.content)
  form.append('type', PICTURE_TYPE)
  form.append('is_public', IS_PUBLIC)

  const res = await fetch(`${API_BASE}/picture/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (!res.ok || (data.desc && data.desc !== 'success')) {
    throw new Error(
      `#${index + 1} ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`
    )
  }

  return data
}

async function main() {
  const seeds = getChildhoodPictureSeeds()
  console.log(`Uploading ${seeds.length} childhood pictures → ${API_BASE}/picture/ (type=${PICTURE_TYPE})`)
  console.log(`Cutout dir: ${CUTOUT_DIR}`)

  let ok = 0
  for (let i = 0; i < seeds.length; i += 1) {
    const story = seeds[i]
    try {
      await uploadOne(story, i)
      ok += 1
      console.log(`✓ [${i + 1}/${seeds.length}] ${story.title} ← ${story.file}`)
    } catch (err) {
      console.error(`✗ [${i + 1}/${seeds.length}] ${story.file}:`, err.message)
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  console.log(`Done: ${ok}/${seeds.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
