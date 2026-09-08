/** 站点 SEO 默认值与路由标题 */
export const SEO = {
  siteName: 'KidStory',
  siteUrl: 'https://www.kidstory.cc',
  defaultTitle: 'KidStory | AI插画与绘本创作平台',
  defaultDescription:
    'KidStory 是 AI 插画与绘本创作平台，支持 AI 生图、角色与组图绘本、心情日记、在线编辑与 PDF 导出，浏览原创插画与绘本作品。',
  defaultKeywords:
    'KidStory,AI插画,AI绘本,儿童绘本,插画创作,绘本创作,在线编辑器,图元上传,PDF导出,心情日记,原创插画',
}

function setLinkRel(rel, href) {
  if (typeof document === 'undefined' || !href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function canonicalForPath(path) {
  const p = String(path || '/').replace(/\/+$/, '') || ''
  return p ? `${SEO.siteUrl}${p}` : `${SEO.siteUrl}/`
}

/**
 * 根据路由更新 document.title 与 canonical（公开页可设 meta.seoTitle）
 * @param {import('vue-router').RouteLocationNormalized} route
 */
export function applyRouteSeo(route) {
  const record = route.matched
    .slice()
    .reverse()
    .find((r) => r.meta?.seoTitle)
  const seoTitle = record?.meta?.seoTitle
  document.title = seoTitle ? `${seoTitle} | ${SEO.siteName}` : SEO.defaultTitle
  setLinkRel('canonical', canonicalForPath(route.path))
}

export { setLinkRel, canonicalForPath }
