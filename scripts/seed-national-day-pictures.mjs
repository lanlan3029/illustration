#!/usr/bin/env node
/**
 * 将国庆预置插画上传到 /picture/（type=national-day）。
 *
 * 用法：
 *   TOKEN=xxx node scripts/seed-national-day-pictures.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_BASE = (process.env.API_BASE || process.env.VUE_APP_API_BASE_URL || 'https://api.kidstory.cc').replace(/\/$/, '')
const TOKEN = process.env.TOKEN || ''
const PICTURE_TYPE = 'national-day'
const IS_PUBLIC = process.env.IS_PUBLIC ?? '1'
const IMAGE_DIR = process.env.IMAGE_DIR || path.resolve(
  __dirname,
  '../../ian-xiaohei-illustrations-main/assets/101-lifestyle-editorial-illustrations'
)

const SEEDS = [
  {
    file: '01-dread-back-to-work.jpg',
    title: '还没放假已经怕开工',
    content: '虽然还没放假但是已经恐惧开工了，一想到国庆假期回来又要重新适应上班好痛苦',
  },
  {
    file: '02-wedding-distance.jpg',
    title: '两年没联系别喊我',
    content: '马上快国庆了，郑重声明一下：超过两年未联系的不管是同学还是朋友，结婚都不要喊我，感情一般没什么交集的更是想都别想。',
  },
  {
    file: '03-compare-overtime.jpg',
    title: '幸福在于对比',
    content: '国庆长假一开始，我明白了一个道理：幸福在于对比，比如你觉得长假只能在家无聊，那你想想还有加班的呢，你觉得堵在高速上很闹心，那你想想还有加班的呢，你觉得在家被父母亲友奚落很伤心，那你想想还有加班的呢，你觉得吃吃喝喝七天会胖，那你想想还有加班的呢，反正我一想还有加班的人，我只要不上班就十分满足了。',
  },
  {
    file: '04-home-ac-phone.jpg',
    title: '躺家吹空调',
    content: '国庆节最舒服最快乐的度假方式果然就是躺在家里吹空调玩手机。',
  },
  {
    file: '05-one-day-left.jpg',
    title: '距离假期只剩一天',
    content: '听过周杰伦的《晴天》听过莫文蔚的《阴天》听过林俊杰的《明天》听过李玖哲的《夏天》但我最喜欢的还是《距离国庆假期只剩1天》',
  },
]

async function uploadOne(story) {
  const filePath = path.join(IMAGE_DIR, story.file)
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`)
  }
  const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/jpeg' })
  const form = new FormData()
  form.append('picture', blob, story.file)
  form.append('title', story.title)
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
    throw new Error(`${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }
  return data
}

async function main() {
  if (!TOKEN) throw new Error('需要 TOKEN 环境变量（登录 token）')
  console.log(`Uploading ${SEEDS.length} national-day pictures → ${API_BASE}/picture/`)
  console.log(`Image dir: ${IMAGE_DIR}`)
  let ok = 0
  for (let i = 0; i < SEEDS.length; i += 1) {
    const story = SEEDS[i]
    try {
      await uploadOne(story)
      ok += 1
      console.log(`✓ [${i + 1}/${SEEDS.length}] ${story.title}`)
    } catch (err) {
      console.error(`✗ [${i + 1}/${SEEDS.length}] ${story.file}:`, err.message)
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  console.log(`Done: ${ok}/${SEEDS.length}`)
  if (ok !== SEEDS.length) process.exit(1)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
