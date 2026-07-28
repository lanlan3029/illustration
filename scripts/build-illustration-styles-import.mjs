/**
 * 从现有前端配置生成批量导入 JSON（不含图片，需另行上传 WebP 或指定 id 覆盖）。
 *
 * 用法：node scripts/build-illustration-styles-import.mjs > scripts/illustration-styles-import.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const configsSource = fs.readFileSync(
  path.join(root, 'src/data/illustrationStyleConfigs.js'),
  'utf8'
)
const zh = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/zh.json'), 'utf8'))
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en.json'), 'utf8'))

const rowRe = /\{\s*key:\s*'([^']+)',\s*id:\s*(\d+),\s*image:[^,]+,\s*category:\s*'([^']+)'\s*\}/g

/** @type {object[]} */
const items = []
let match
while ((match = rowRe.exec(configsSource)) !== null) {
  const [, key, id, category] = match
  const zhEntry = zh.aibooks?.styles?.[key] || {}
  const enEntry = en.aibooks?.styles?.[key] || {}
  items.push({
    id: Number(id),
    key,
    category,
    art_style_zh: zhEntry.artStyle || '',
    element_details_zh: zhEntry.elementDetails || '',
    art_style_en: enEntry.artStyle || '',
    element_details_en: enEntry.elementDetails || '',
    sort_order: Number(id),
    is_enabled: true,
  })
}

console.log(JSON.stringify({ items }, null, 2))
