import html2canvas from 'html2canvas'
import JsPDF from 'jspdf'
import { MOOD_FONT_KAI, MOOD_FONT_SERIF, ensureMoodDiaryFontsLoaded } from './fonts'
import { groupRecordsFromList } from './recordGroups'
import { getRecordsSorted } from './records'

const EXPORT_WIDTH_PX = 794

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatEntryDate(ts, locale) {
  const d = new Date(ts || Date.now())
  const loc = locale === 'zh' || locale?.startsWith?.('zh') ? 'zh-CN' : 'en-US'
  return d.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' })
}

function entryBody(record) {
  return (record.caption || record.narrative || '').trim()
}

function buildEntryHtml(record, locale) {
  const text = entryBody(record)
  const mood = record.moodLabel ? `<span class="md-pdf-entry-mood">${escapeHtml(record.moodLabel)}</span>` : ''
  const poster = record.posterDataUrl
    ? `<img class="md-pdf-entry-img" src="${escapeHtml(record.posterDataUrl)}" alt="" />`
    : ''
  const textBlock = text
    ? `<p class="md-pdf-entry-text">${escapeHtml(text)}</p>`
    : `<p class="md-pdf-entry-text md-pdf-entry-text--muted">${escapeHtml('—')}</p>`

  return `
    <article class="md-pdf-entry">
      <header class="md-pdf-entry-head">
        <time class="md-pdf-entry-date">${escapeHtml(formatEntryDate(record.createdAt, locale))}</time>
        ${mood}
      </header>
      ${poster}
      ${textBlock}
    </article>
  `
}

function buildExportStyles() {
  return `
    .md-pdf-root {
      width: ${EXPORT_WIDTH_PX}px;
      box-sizing: border-box;
      padding: 40px 44px 48px;
      background: #fffcfe;
      color: #5f5970;
      font-family: ${MOOD_FONT_KAI};
      -webkit-font-smoothing: antialiased;
    }
    .md-pdf-header {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e6deef;
    }
    .md-pdf-title {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 700;
      font-family: ${MOOD_FONT_SERIF};
      color: #5f5970;
      letter-spacing: 0.02em;
    }
    .md-pdf-sub {
      margin: 0;
      font-size: 13px;
      color: #9d96a8;
    }
    .md-pdf-month {
      margin: 26px 0 14px;
    }
    .md-pdf-month-label {
      margin: 0 0 12px;
      font-size: 18px;
      font-weight: 700;
      color: #5f5970;
    }
    .md-pdf-entry {
      margin-bottom: 18px;
      padding: 16px 18px;
      border: 1px solid #e6deef;
      border-radius: 14px;
      background: #faf7fc;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .md-pdf-entry-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .md-pdf-entry-date {
      font-size: 13px;
      font-weight: 600;
      color: #9d96a8;
    }
    .md-pdf-entry-mood {
      flex-shrink: 0;
      padding: 3px 10px;
      border-radius: 999px;
      background: #edf8f4;
      color: #7ecbb8;
      font-size: 12px;
      font-weight: 600;
    }
    .md-pdf-entry-img {
      display: block;
      width: 240px;
      max-width: 100%;
      height: auto;
      margin: 0 auto 12px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(196, 181, 224, 0.18);
    }
    .md-pdf-entry-text {
      margin: 0;
      font-size: 14px;
      line-height: 1.65;
      color: #5f5970;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .md-pdf-entry-text--muted {
      color: #9d96a8;
    }
  `
}

function buildExportDom(groups, { title, exportedLabel, locale }) {
  const monthBlocks = groups
    .map(
      (group) => `
      <section class="md-pdf-month">
        <h2 class="md-pdf-month-label">${escapeHtml(group.label)}</h2>
        ${group.records.map((record) => buildEntryHtml(record, locale)).join('')}
      </section>
    `
    )
    .join('')

  const root = document.createElement('div')
  root.className = 'md-pdf-root'
  root.innerHTML = `
    <style>${buildExportStyles()}</style>
    <header class="md-pdf-header">
      <h1 class="md-pdf-title">${escapeHtml(title)}</h1>
      <p class="md-pdf-sub">${escapeHtml(exportedLabel)}</p>
    </header>
    ${monthBlocks}
  `
  root.style.position = 'fixed'
  root.style.left = '-10000px'
  root.style.top = '0'
  root.style.zIndex = '-1'
  root.style.pointerEvents = 'none'
  return root
}

async function preloadImages(container) {
  const images = [...container.querySelectorAll('img')]
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth) {
            resolve()
            return
          }
          if (typeof img.src === 'string' && /^https?:\/\//.test(img.src)) {
            img.crossOrigin = 'anonymous'
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
    )
  )
}

function canvasToPdf(canvas) {
  const pdf = new JsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
    return pdf
  }

  let position = 0
  let leftHeight = imgHeight
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  leftHeight -= pageHeight

  while (leftHeight > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    leftHeight -= pageHeight
  }

  return pdf
}

function buildFilename(locale, suffix) {
  const ts = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}`
  const tag = suffix ? `-${String(suffix).replace(/[^\w-]/g, '')}` : ''
  return locale === 'zh' || locale?.startsWith?.('zh')
    ? `心情日记-${stamp}${tag}.pdf`
    : `mood-diary-${stamp}${tag}.pdf`
}

/**
 * Export mood diary records to a PDF file.
 * @param {{
 *   locale?: string,
 *   title: string,
 *   exportedLabel: string,
 *   emptyMessage: string,
 *   records?: object[],
 *   filenameSuffix?: string
 * }} options
 */
export async function exportMoodDiaryPdf(options) {
  const locale = options.locale || 'zh'
  const records = Array.isArray(options.records) && options.records.length
    ? options.records
    : getRecordsSorted()
  if (!records.length) {
    throw new Error(options.emptyMessage || 'No diary entries')
  }

  const groups = groupRecordsFromList(records, locale)
  const container = buildExportDom(groups, {
    title: options.title,
    exportedLabel: options.exportedLabel,
    locale
  })

  document.body.appendChild(container)
  try {
    await ensureMoodDiaryFontsLoaded()
    await preloadImages(container)
    await new Promise((resolve) => requestAnimationFrame(() => resolve()))

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#fffcfe',
      logging: false,
      width: EXPORT_WIDTH_PX,
      windowWidth: EXPORT_WIDTH_PX
    })

    const pdf = canvasToPdf(canvas)
    pdf.save(buildFilename(locale, options.filenameSuffix))
  } finally {
    container.remove()
  }
}
