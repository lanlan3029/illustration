const PREF_KEY = 'mood_diary_poster_template_pref_v1'

export function getPosterTemplatePref() {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { templateId: 'creamCard', colorBlockPlacement: 'top', imagePlacement: 'below' }
    const data = JSON.parse(raw)
    return {
      templateId: data.templateId || 'creamCard',
      colorBlockPlacement: data.colorBlockPlacement || 'top',
      imagePlacement: data.imagePlacement || 'below'
    }
  } catch (_) {
    return { templateId: 'creamCard', colorBlockPlacement: 'top', imagePlacement: 'below' }
  }
}

export function savePosterTemplatePref(partial) {
  const prev = getPosterTemplatePref()
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...prev, ...partial }))
  } catch (_) {
    /* ignore */
  }
}
