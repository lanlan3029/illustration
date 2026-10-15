const STATIC_ORIGIN = 'https://static.kidstory.cc/'

export function resolveBookReviewImage(value) {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  if (!url || /^[a-f\d]{24}$/i.test(url)) return ''
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return ''
  return STATIC_ORIGIN + url.replace(/^(?:\.\/|\/)+/, '')
}

export function getBookReviewPages(book, illustrations = []) {
  const snapshots = Array.isArray(book.content_snapshot) ? book.content_snapshot : []
  const content = Array.isArray(book.content) ? book.content : []
  const images = new Map(illustrations.map(image => [String(image._id), image]))
  return Array.from({ length: Math.max(snapshots.length, content.length) }, (_, index) => {
    const snapshot = snapshots[index]
    const image = images.get(String(content[index]))
    return {
      path: resolveBookReviewImage(snapshot?.path) || resolveBookReviewImage(image?.content) || resolveBookReviewImage(image?.path) || resolveBookReviewImage(content[index]),
      title: snapshot?.title || image?.title || '',
    }
  })
}
