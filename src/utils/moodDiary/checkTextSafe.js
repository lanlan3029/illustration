/**
 * Demo-tier client text check — not a business compliance API.
 * Blocks empty / too short / trivial dangerous patterns only.
 */
const MIN_LEN = 2
const MAX_LEN = 2000

export function checkTextSafe(text, t) {
  const s = typeof text === 'string' ? text.trim() : ''
  const fail = (key) => ({ ok: false, message: typeof t === 'function' ? t(key) : key })

  if (!s) return fail('moodDiary.checkSafeEmpty')
  if (s.length < MIN_LEN) return fail('moodDiary.checkSafeTooShort')
  if (s.length > MAX_LEN) return fail('moodDiary.checkSafeTooLong')

  const lower = s.toLowerCase()
  const bad = ['<script', 'javascript:', 'onerror=', 'onload=']
  for (const b of bad) {
    if (lower.includes(b)) return fail('moodDiary.checkSafeBlocked')
  }
  return { ok: true }
}
