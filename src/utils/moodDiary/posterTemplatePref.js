import { DEFAULT_POSTER_TEMPLATE_ID, POSTER_TEMPLATE_IDS } from './posters/constants'

const PREF_KEY = 'mood_diary_poster_template_pref_v1'

function normalizeTemplateId(id) {
  if (id && POSTER_TEMPLATE_IDS.includes(id)) return id
  return DEFAULT_POSTER_TEMPLATE_ID
}

export function getPosterTemplatePref() {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { templateId: 'creamCard', colorBlockPlacement: 'top', imagePlacement: 'below' }
    const data = JSON.parse(raw)
    return {
      templateId: normalizeTemplateId(data.templateId),
      colorBlockPlacement: data.colorBlockPlacement || 'top',
      imagePlacement: data.imagePlacement || 'below'
    }
  } catch (_) {
    return { templateId: 'creamCard', colorBlockPlacement: 'top', imagePlacement: 'below' }
  }
}

export function savePosterTemplatePref(partial) {
  const prev = getPosterTemplatePref()
  const next = { ...prev, ...partial }
  if (next.templateId) {
    next.templateId = normalizeTemplateId(next.templateId)
  }
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(next))
  } catch (_) {
    /* ignore */
  }
}
