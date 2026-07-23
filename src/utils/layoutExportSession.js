import { DEFAULT_BOOK_EXPORT_FORMAT_ID, getBookExportFormat } from '@/data/bookExportFormats'

export const LAYOUT_EXPORT_SESSION_KEY = 'layout_export_session'

/** @deprecated 迁移用 */
const LEGACY_FORMAT_KEY = 'book_export_format_id'
const LEGACY_CONFIRMED_KEY = 'layout_export_format_confirmed'
const LEGACY_PURPOSE_KEY = 'layout_export_purpose'

function emptySession() {
  return {
    formatId: DEFAULT_BOOK_EXPORT_FORMAT_ID,
    formatConfirmed: false,
    purpose: null,
    checkedImages: [],
    updatedAt: null,
  }
}

function normalizeCheckedImages(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => item?._id)
    .map((item) => ({
      _id: item._id,
      content: item.content,
      title: item.title,
    }))
}

function migrateLegacySession() {
  const session = emptySession()
  let migrated = false

  try {
    const legacyFormat = sessionStorage.getItem(LEGACY_FORMAT_KEY)
    if (legacyFormat && getBookExportFormat(legacyFormat)) {
      session.formatId = legacyFormat
      migrated = true
    }
    if (sessionStorage.getItem(LEGACY_CONFIRMED_KEY) === '1') {
      session.formatConfirmed = true
      migrated = true
    }
    const legacyPurpose = sessionStorage.getItem(LEGACY_PURPOSE_KEY)
    if (legacyPurpose === 'digital' || legacyPurpose === 'print') {
      session.purpose = legacyPurpose
      migrated = true
    }
  } catch {
    /* ignore */
  }

  if (migrated) {
    writeLayoutExportSession(session)
  }
  return session
}

export function readLayoutExportSession() {
  try {
    const raw = sessionStorage.getItem(LAYOUT_EXPORT_SESSION_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        ...emptySession(),
        ...data,
        checkedImages: normalizeCheckedImages(data.checkedImages),
      }
    }
  } catch {
    /* ignore */
  }
  return migrateLegacySession()
}

export function writeLayoutExportSession(patch) {
  const current = readLayoutExportSession()
  const next = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  }
  if (patch.checkedImages !== undefined) {
    next.checkedImages = normalizeCheckedImages(patch.checkedImages)
  }
  try {
    sessionStorage.setItem(LAYOUT_EXPORT_SESSION_KEY, JSON.stringify(next))
    syncLegacyKeys(next)
  } catch {
    /* quota */
  }
  return next
}

function syncLegacyKeys(session) {
  try {
    if (session.formatId) {
      sessionStorage.setItem(LEGACY_FORMAT_KEY, session.formatId)
    }
    if (session.formatConfirmed) {
      sessionStorage.setItem(LEGACY_CONFIRMED_KEY, '1')
    } else {
      sessionStorage.removeItem(LEGACY_CONFIRMED_KEY)
    }
    if (session.purpose) {
      sessionStorage.setItem(LEGACY_PURPOSE_KEY, session.purpose)
    } else {
      sessionStorage.removeItem(LEGACY_PURPOSE_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function canResumeLayoutExport(session = readLayoutExportSession()) {
  return Boolean(
    session?.formatConfirmed
    && (session.purpose === 'digital' || session.purpose === 'print')
    && session.formatId
    && getBookExportFormat(session.formatId)
  )
}

export function getLayoutExportFormatId(session = readLayoutExportSession()) {
  const id = session?.formatId
  return getBookExportFormat(id) ? id : DEFAULT_BOOK_EXPORT_FORMAT_ID
}
