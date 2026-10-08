const { catalog, escapeHtml, renderPageContent } = require('../../src/utils/publicSeoContent.cjs')
const fs = require('node:fs')
const path = require('node:path')
const stylesheet = fs.readFileSync(path.resolve(__dirname, '../../src/styles/publicSeo.css'), 'utf8')

function replaceMeta(html, attribute, name, content) {
  const regex = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${name}["'])[^>]*>`, 'gi')
  const tag = `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`
  return regex.test(html) ? html.replace(regex, () => tag) : html.replace('</head>', `${tag}</head>`)
}
function renderPublicHtml(template, page) {
  const canonical = `${catalog.siteUrl}${page.path === '/' ? '/' : page.path}`
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(page.title)}</title>`)
  html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
  html = html.replace('</head>', `<link rel="canonical" href="${canonical}"></head>`)
  for (const [attribute, name, content] of [
    ['name', 'description', page.description], ['property', 'og:title', page.title],
    ['property', 'og:description', page.description], ['property', 'og:url', canonical],
    ['name', 'twitter:title', page.title], ['name', 'twitter:description', page.description],
  ]) html = replaceMeta(html, attribute, name, content)
  if (page.sections) {
    if (!/<div id="app">\s*<\/div>/.test(html)) throw new Error('Public SEO: app mount point not found')
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, '')
    html = html.replace(/<div id="app">\s*<\/div>/, () => `<div id="app"><main class="seo-static-shell"><a class="seo-static-home" href="/">KidStory 首页</a>${renderPageContent(page)}</main></div>`)
    html = html.replace('</head>', `<style>${stylesheet}\n.seo-static-shell{height:100vh;overflow:auto;background:white}.seo-static-home{display:block;margin:16px 28px;color:#674796}</style></head>`)
  }
  return html
}
class PublicSeoBuildPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('PublicSeoBuildPlugin', compilation => {
      compilation.hooks.processAssets.tap({ name: 'PublicSeoBuildPlugin', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
        const template = compilation.getAsset('index.html')?.source.source().toString()
        if (!template) throw new Error('Public SEO: index.html not found')
        const Source = compiler.webpack.sources.RawSource
        // SPA fallback must not declare every unknown route canonical to the homepage.
        compilation.emitAsset('app.html', new Source(template.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')))
        for (const page of [...catalog.metadata, ...catalog.pages]) {
          const output = page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`
          const html = new Source(renderPublicHtml(template, page))
          if (compilation.getAsset(output)) compilation.updateAsset(output, html)
          else compilation.emitAsset(output, html)
        }
        const sitemapAsset = compilation.getAsset('sitemap.xml')
        if (sitemapAsset) {
          const sitemap = sitemapAsset.source.source().toString().replace('</urlset>', catalog.pages.filter(page => page.path !== '/').map(page => `  <url><loc>${catalog.siteUrl}${page.path}</loc></url>`).join('\n') + '\n</urlset>')
          compilation.updateAsset('sitemap.xml', new Source(sitemap))
        }
      })
    })
  }
}
module.exports = { PublicSeoBuildPlugin, renderPublicHtml, replaceMeta }
