#!/usr/bin/env node
/**
 * 将精选 handraw 风格写入后端 illustration-styles（upsert）
 *
 * 用法：
 *   TOKEN=<admin_jwt> API_BASE=https://api.kidstory.cc node scripts/import-handraw-styles.mjs
 *   TOKEN=... node scripts/import-handraw-styles.mjs --dry-run
 *
 * 预览图：导入前请将 prompt/37.webp … prompt/48.webp 放到后端 public/prompt/ 并同步 CDN
 * 可从 handraw 画廊截取对应编号风格图（遵守 MIT / 作者署名约定）。
 */

import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const curatedUrl = pathToFileURL(
  path.join(__dirname, '../src/data/handrawStyleCurated.js')
).href

async function loadImportItems() {
  const mod = await import(curatedUrl)
  return mod.buildHandrawImportItems()
}

const dryRun = process.argv.includes('--dry-run')
const token = process.env.TOKEN || ''
const apiBase = (process.env.API_BASE || 'https://api.kidstory.cc').replace(/\/$/, '')

async function main() {
  const items = await loadImportItems()
  console.log(`Handraw curated styles: ${items.length} items (id ${items[0]?.id}–${items[items.length - 1]?.id})`)

  if (dryRun) {
    console.log(JSON.stringify({ items }, null, 2))
    return
  }

  if (!token) {
    console.error('缺少 TOKEN（管理员 JWT）')
    process.exit(1)
  }

  const res = await fetch(`${apiBase}/api/admin/illustration-styles/import/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || (data.code !== 0 && data.code !== '0')) {
    console.error('导入失败', res.status, data)
    process.exit(1)
  }

  console.log('导入结果:', JSON.stringify(data.data || data, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
