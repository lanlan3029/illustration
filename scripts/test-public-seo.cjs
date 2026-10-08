const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { catalog, renderPageContent } = require('../src/utils/publicSeoContent.cjs')
const { renderPublicHtml } = require('./lib/publicSeoBuild.cjs')
const template = '<html><head><title>Default</title><meta name="description" content="Default"><meta name="robots" content="index, follow"></head><body><noscript>Enable JS</noscript><div id="app"></div><script src="/js/app.hash.js"></script></body></html>'

test('each static page includes readable content and its own canonical before JS', () => {
  for (const page of catalog.pages) {
    const html = renderPublicHtml(template, page)
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1)
    assert.ok(html.includes(`href="${catalog.siteUrl}${page.path}"`))
    assert.ok(html.includes(`<h1>${page.heading}</h1>`))
    assert.ok(html.includes(page.intro))
    assert.ok(html.includes('/js/app.hash.js'), 'Vue scripts must be retained')
    assert.ok(!html.includes('<noscript>'), 'readable content must work without JS')
    for (const link of page.links) assert.ok(html.includes(`href="${link.href}"`))
  }
})
test('public metadata pages do not retain the homepage canonical', () => {
  const html = renderPublicHtml(template.replace('</head>', '<link rel="canonical" href="https://www.kidstory.cc/"></head>'), catalog.metadata[0])
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1)
  assert.ok(html.includes('href="https://www.kidstory.cc/books"'))
  assert.ok(html.includes(catalog.metadata[0].description))
})
test('authored content is escaped rather than interpreted as HTML', () => {
  const html = renderPageContent({ heading: '<script>bad()</script>', intro: 'A & B', sections: [{ id: 'example', heading: 'Title', paragraphs: ['<img onerror="bad()">'] }], links: [] })
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('<img'))
  assert.ok(html.includes('A &amp; B'))
})
test('tutorial explicitly explains local-only drafts and separate export steps', () => {
  const guide = catalog.pages.find(page => page.path === '/guides/ai-picture-book-tutorial')
  const html = renderPageContent(guide)
  assert.ok(html.includes('AI 草稿仅保存在当前浏览器'))
  assert.ok(html.includes('这些入口不是自动连续完成的流水线'))
  assert.ok(guide.sections.length >= 7)
  assert.ok(html.includes('清理网站数据'))
})
test('client navigation resets description, canonical and robots for each route', () => {
  const nodes = new Map()
  const document = {
    title: '',
    querySelector(selector) { return nodes.get(selector) || null },
    createElement(tag) {
      return { tag, attributes: {}, setAttribute(key, value) { this.attributes[key] = value } }
    },
    head: { appendChild(element) {
      const a = element.attributes
      if (element.tag === 'meta') nodes.set(`meta[${a.property ? 'property' : 'name'}="${a.property || a.name}"]`, element)
      else nodes.set(`link[rel="${element.rel}"]`, element)
    } },
  }
  const source = fs.readFileSync(path.resolve(__dirname, '../src/utils/seo.js'), 'utf8')
    .replace(/^import publicPages.*$/m, '')
    .replace(/export const /g, 'const ').replace(/export function /g, 'function ').replace(/^export \{.*\}$/m, '')
  const ctx = vm.createContext({ document, publicPages: catalog })
  vm.runInContext(source + '\nglobalThis.apply = applyRouteSeo;', ctx)
  const route = (pathname, requiresAuth = false) => ({ path: pathname, matched: [{ meta: { requiresAuth } }] })
  ctx.apply(route('/ai-picture-book'))
  assert.equal(document.title, catalog.pages[1].title)
  assert.equal(nodes.get('meta[name="description"]').attributes.content, catalog.pages[1].description)
  ctx.apply(route('/creation-studio/book/ai', true))
  assert.equal(nodes.get('meta[name="robots"]').attributes.content, 'noindex, follow')
  ctx.apply(route('/books'))
  assert.equal(nodes.get('meta[name="robots"]').attributes.content, 'index, follow')
  assert.equal(nodes.get('link[rel="canonical"]').href, catalog.siteUrl + '/books')
  assert.equal(nodes.get('meta[name="description"]').attributes.content, catalog.metadata[0].description)
})
if (process.env.SEO_BUILD_DIR) {
  test('production output contains static HTML, independent metadata and discoverable URLs', () => {
    const directory = process.env.SEO_BUILD_DIR
    for (const page of [...catalog.pages, ...catalog.metadata]) {
      const html = fs.readFileSync(path.join(directory, page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`), 'utf8')
      assert.ok(html.includes(`href="${catalog.siteUrl}${page.path}"`))
      assert.ok(html.includes(page.title))
      if (page.sections) assert.ok(html.includes(page.heading))
    }
    assert.ok(!fs.readFileSync(path.join(directory, 'app.html'), 'utf8').includes('rel="canonical"'))
    const sitemap = fs.readFileSync(path.join(directory, 'sitemap.xml'), 'utf8')
    for (const page of catalog.pages) assert.ok(sitemap.includes(`${catalog.siteUrl}${page.path}`))
  })
}
