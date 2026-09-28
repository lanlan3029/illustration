/** handraw styles.json → KidStory 中英展示名与底词（upload 脚本与 library 索引共用） */

/** 与上游 prompt_style.py 一致：traits 只保留正向描述句 */
export function filterHandrawTraitsForPrompt(traits) {
  const raw = String(traits || '').trim()
  if (!raw) return ''
  return raw
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter((s) => s && !/避免|不要|不准|禁止|勿|不可|不能|严禁/.test(s))
    .join('；')
}

export function padHandrawNumber(raw) {
  const n = parseInt(String(raw).replace(/^0+/, '') || '0', 10)
  return String(n).padStart(3, '0')
}

/** UI 中文名：优先用 traits 首句（源数据为中文） */
export function buildHandrawArtStyleZh(entry) {
  const num = padHandrawNumber(entry.number)
  const traits = String(entry.traits || '').trim()
  const firstClause = traits.split(/[；;\n]/)[0].trim()
  if (firstClause) {
    const short = firstClause.length > 40 ? `${firstClause.slice(0, 40)}…` : firstClause
    return `#${num} · ${short}`
  }
  const ref = String(entry.reference || '').trim()
  if (ref) return `#${num} · ${ref}风格`
  return `#${num} · ${entry.generation_name || 'Handraw'}`
}

export function buildHandrawArtStyleEn(entry) {
  const num = padHandrawNumber(entry.number)
  const name = String(entry.generation_name || entry.reference || 'Handraw').trim()
  return `#${num} · ${name}`
}

export function buildHandrawElementDetailsZh(entry) {
  const num = padHandrawNumber(entry.number)
  const name = entry.generation_name || ''
  const ref = entry.reference || ''
  const traits = filterHandrawTraitsForPrompt(entry.traits)
  const parts = [`风格编号 #${num}。`]
  if (name) parts.push(`风格名称：${name}。`)
  if (ref) parts.push(`参考作者/风格名称：${ref}。`)
  if (traits) parts.push(`核心风格特征：${traits}。`)
  parts.push('单幅手绘插画；画面内容以用户主题为准，不要照搬任何参考图里的具体人物、场景或构图。')
  return parts.join('')
}

export function buildHandrawElementDetailsEn(entry) {
  const num = padHandrawNumber(entry.number)
  const ref = entry.reference || ''
  const name = entry.generation_name || ''
  const traits = filterHandrawTraitsForPrompt(entry.traits)
  const parts = [`Style number #${num}.`]
  if (name) parts.push(`Style name: ${name}.`)
  if (ref) parts.push(`Reference author/style name: ${ref}.`)
  if (traits) parts.push(`Core style traits: ${traits}.`)
  parts.push(
    'Single hand-drawn illustration vignette. Follow the user theme for subject matter; do not copy subjects or composition from any reference sheet.'
  )
  return parts.join(' ')
}
