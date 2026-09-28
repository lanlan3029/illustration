#!/usr/bin/env node
/**
 * 从 handraw styles.json 生成前端 handraw 全库索引（279 条）
 * HANDRAW_ROOT=... node scripts/generate-handraw-library-index.mjs
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
const OUT = path.join(__dirname, '../src/data/handrawLibraryIndex.js')

const DEFAULT_HANDRAW_ROOT = path.join(
  process.env.HOME || '',
  'Downloads/今天下载/handraw-style-master'
)
const handrawRoot = process.env.HANDRAW_ROOT || DEFAULT_HANDRAW_ROOT
const ID_OFFSET = 1000

function pad3(n) {
  return String(n).padStart(3, '0')
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

function main() {
  const stylesPath = path.join(
    handrawRoot,
    'skills/handdraw-style-prompter/references/styles.json'
  )
  if (!fs.existsSync(stylesPath)) {
    console.error('找不到 styles.json:', stylesPath)
    process.exit(1)
  }
  const styles = JSON.parse(fs.readFileSync(stylesPath, 'utf8'))
  const items = styles.map((entry) => {
    const numInt = parseInt(entry.number, 10)
    const num = pad3(numInt)
    const id = ID_OFFSET + numInt
    return {
      id,
      key: toCamelKey(num, entry.generation_name),
      handrawNo: num,
      category: categoryFromGroup(entry.group),
      art_style_zh: buildHandrawArtStyleZh(entry),
      art_style_en: buildHandrawArtStyleEn(entry),
      basePrompt: buildHandrawElementDetailsZh(entry),
      basePromptEn: buildHandrawElementDetailsEn(entry),
      sort_order: numInt,
    }
  })

  const body = `/** 自动生成：scripts/generate-handraw-library-index.mjs · 勿手改 */
/** @type {ReadonlyArray<{ id: number, key: string, handrawNo: string, category: string, art_style_zh: string, art_style_en: string, basePrompt: string, sort_order: number }>} */
export const HANDRAW_LIBRARY_INDEX = ${JSON.stringify(items, null, 2)}

export const HANDRAW_LIBRARY_COUNT = ${items.length}
`

  fs.writeFileSync(OUT, body, 'utf8')
  console.log(`Wrote ${items.length} entries → ${OUT}`)
}

main()
