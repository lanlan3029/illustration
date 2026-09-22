#!/usr/bin/env node
/**
 * 将童年预置故事写入 /ill/ 接口。
 * 用户字段留空，content 写入 description。
 *
 * 用法：
 *   API_BASE=https://api.kidstory.cc TOKEN=xxx node scripts/seed-childhood-stories.mjs
 */

import { CHILDHOOD_SEED_STORIES, toIllSeedPayload } from '../src/utils/childhoodSeedStories.js'

const API_BASE = (process.env.API_BASE || process.env.VUE_APP_API_BASE_URL || 'https://api.kidstory.cc').replace(/\/$/, '')
const TOKEN = process.env.TOKEN || ''

async function seedOne(story, index) {
  const payload = toIllSeedPayload(story, index)
  const headers = { 'Content-Type': 'application/json' }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`

  const res = await fetch(`${API_BASE}/ill/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (!res.ok) {
    throw new Error(`#${index + 1} ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }

  return data
}

async function main() {
  console.log(`Seeding ${CHILDHOOD_SEED_STORIES.length} childhood stories → ${API_BASE}/ill/`)
  let ok = 0
  for (let i = 0; i < CHILDHOOD_SEED_STORIES.length; i += 1) {
    const story = CHILDHOOD_SEED_STORIES[i]
    try {
      await seedOne(story, i)
      ok += 1
      console.log(`✓ [${i + 1}/${CHILDHOOD_SEED_STORIES.length}] ${story.content.slice(0, 36)}…`)
    } catch (err) {
      console.error(`✗ [${i + 1}/${CHILDHOOD_SEED_STORIES.length}]`, err.message)
    }
    await new Promise((r) => setTimeout(r, 120))
  }
  console.log(`Done: ${ok}/${CHILDHOOD_SEED_STORIES.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
