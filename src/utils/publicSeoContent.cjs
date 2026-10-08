const catalog = require('../data/publicSeoPages.json')
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}
function renderPageContent(page, compact = false) {
  const headingTag = compact ? 'h2' : 'h1'
  return `<article class="public-seo-document"><header><p class="public-seo-kicker">KidStory · 绘本创作</p><${headingTag}>${escapeHtml(page.heading)}</${headingTag}><p class="public-seo-lead">${escapeHtml(page.intro)}</p></header>${compact ? '' : `<nav aria-label="本页目录">${page.sections.map(section => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.heading)}</a>`).join('')}</nav>`}${page.sections.map(section => `<section id="${escapeHtml(section.id)}"><${compact ? 'h3' : 'h2'}>${escapeHtml(section.heading)}</${compact ? 'h3' : 'h2'}>${(section.paragraphs || []).map(text => `<p>${escapeHtml(text)}</p>`).join('')}${section.example ? `<blockquote><p>${escapeHtml(section.example)}</p></blockquote>` : ''}${section.items ? `<ul>${section.items.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : ''}</section>`).join('')}<nav class="public-seo-actions" aria-label="相关页面">${page.links.map(link => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</nav></article>`
}
module.exports = { catalog, escapeHtml, renderPageContent }
