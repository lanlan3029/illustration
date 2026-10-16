/** Remove only generated style labels/details, preserving the user's story. */
export function replaceBookStyle(prompt, styles, selected) {
  let text = String(prompt || '')
  for (const style of styles || []) {
    const marker = `【画风：${style.artStyle}】`
    // Older drafts may contain the visible details even after metadata changed.
    for (const details of [style.elementDetails, style.basePrompt, style.inputTemplate].filter(Boolean)) {
      text = text.split(marker + details).join('')
    }
    text = text.split(marker).join('')
  }
  text = text.replace(/【画风：[^】\n]+】/g, '').trim()
  if (!selected) return text
  const details = (selected.prependBaseOnGenerate || selected.basePrompt || selected.inputTemplate)
    ? '' : selected.elementDetails || ''
  return [text, `【画风：${selected.artStyle}】${details}`].filter(Boolean).join('\n\n')
}

/** Keep accepted jobs running to completion; stop scheduling on fatal errors. */
export async function runBookImageQueue(jobs, run, concurrency = 2) {
  let next = 0, fatal
  await Promise.all(Array.from({length: Math.min(concurrency, jobs.length)}, async () => {
    while (!fatal && next < jobs.length) {
      const job = jobs[next++]
      try { await run(job) } catch (error) { fatal = error }
    }
  }))
  if (fatal) throw fatal
}
