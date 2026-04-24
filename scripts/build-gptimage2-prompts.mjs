/**
 * Parse awesome-gptimage2 README into structured JSON.
 * Run: node scripts/build-gptimage2-prompts.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const README = path.join(__dirname, '../src/data/awesome-gptimage2-README.md')
const out = path.join(__dirname, '../src/data/gptimage2Prompts.json')

const sectionMap = [
    { re: /^### 一[、.]/, id: 'ecommerce', name: '电商与产品' },
    { re: /^### 二[、.]/, id: 'brandPoster', name: '品牌海报设计' },
    { re: /^### 三[、.]/, id: 'creativeType', name: '创意字体' },
    { re: /^### 四[、.]/, id: 'infographic', name: '知识科普与信息图' },
    { re: /^### 五[、.]/, id: 'uiClone', name: 'UI 界面复刻' },
    { re: /^### 六[、.]/, id: 'photography', name: '真实摄影' },
    { re: /^### 七[、.]/, id: 'characterConsistency', name: '角色与一致性' },
    { re: /^### 八[、.]/, id: 'imageEdit', name: '图片编辑与参考' },
    { re: /^### 九[、.]/, id: 'artCreation', name: '艺术创作' },
    { re: /^### 十[、.]/, id: 'funPlay', name: '趣味玩法' }
]

const text = fs.readFileSync(README, 'utf8')
const lines = text.split(/\r?\n/)

let currentCategory = null
const items = []
let pending = null // { title, lineStart }

let i = 0
while (i < lines.length) {
    const line = lines[i]

    for (const s of sectionMap) {
        if (s.re.test(line)) {
            currentCategory = s
            break
        }
    }

    const h4 = line.match(/^####\s+(.+)$/)
    if (h4 && currentCategory) {
        if (h4[1].startsWith('补充案例') || h4[1].includes('原文中')) {
            i++
            continue
        }
        pending = { title: h4[1].trim(), categoryId: currentCategory.id, i }
        // find ```text then prompt until ```
        i++
        while (i < lines.length && !lines[i].trim().startsWith('```')) i++
        if (i < lines.length) i++ // skip opening fence
        const promptLines = []
        while (i < lines.length) {
            const L = lines[i]
            if (L.trim() === '```' || (L.trim().startsWith('```') && L.trim() !== '```text')) {
                if (L.trim() === '```' || L.trim() === '```\n') break
                if (L.trim() !== '```text' && L.trim().match(/^```\w*$/)) break
            }
            if (L.trim() === '```') break
            promptLines.push(L)
            i++
        }
        let prompt = promptLines.join('\n').trim()
        // find first image url after this block
        let image = ''
        let j = i
        for (; j < lines.length; j++) {
            const m = lines[j].match(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/)
            if (m) {
                const url = m[2]
                if (!url.match(/\.(other)$/i)) {
                    image = url
                    break
                }
            }
            if (lines[j].match(/^####\s/)) break
        }
        if (prompt.length > 0 && !prompt.startsWith('[')) {
            const id = `gp2-${currentCategory.id}-${items.filter(x => x.categoryId === currentCategory.id).length + 1}`
            items.push({
                id,
                categoryId: currentCategory.id,
                title: pending.title,
                prompt,
                image: image || ''
            })
        }
        i++
        continue
    }
    i++
}

const categories = sectionMap.map(s => ({
    id: s.id,
    name: s.name
}))

const payload = {
    source: 'https://github.com/xianyu110/awesome-gptimage2',
    generatedAt: new Date().toISOString(),
    categories,
    items
}

fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8')
console.log('Wrote', out, 'items:', items.length)
