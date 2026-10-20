function decodeImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => fail(), 15000)
    function fail() {
      clearTimeout(timer)
      image.onload = image.onerror = null
      reject(new Error('模板装饰图片加载失败，请重试。'))
    }
    if (!url.startsWith('data:')) image.crossOrigin = 'anonymous'
    image.onerror = fail
    image.onload = async () => {
      try {
        await image.decode?.()
        clearTimeout(timer)
        image.onload = image.onerror = null
        resolve(image)
      } catch { fail() }
    }
    image.src = url
  })
}

export function collectDesignImageSources(json) {
  const urls = new Set()
  function walk(value) {
    if (!value || typeof value !== 'object') return
    if (typeof value.src === 'string' &&
      (value.src.startsWith('/editor-design-templates/') || value.src.startsWith('data:image/'))) urls.add(value.src)
    Object.values(value).forEach(walk)
  }
  walk(json)
  return [...urls]
}

// Bound decoded bitmap memory instead of retaining every template's images.
export function createDesignImageCache({ loadImage = decodeImage, concurrency = 3,
  maxPixels = 24 * 1024 * 1024, maxEntries = 48 } = {}) {
  const cache = new Map(), queue = []
  let active = 0, pixels = 0
  function trim() {
    for (const [url, entry] of cache) {
      if (pixels <= maxPixels && cache.size <= maxEntries) break
      if (!entry.ready) continue
      cache.delete(url)
      pixels -= entry.pixels
    }
  }
  function pump() {
    while (active < concurrency && queue.length) {
      const entry = queue.shift()
      active++
      Promise.resolve().then(() => loadImage(entry.url)).then(image => {
        entry.pixels = (image.naturalWidth || image.width) * (image.naturalHeight || image.height)
        entry.ready = true
        entry.image = image
        pixels += entry.pixels
        entry.resolve(image)
        trim()
      }, error => {
        cache.delete(entry.url)
        entry.reject(error)
      }).finally(() => { active--; pump() })
    }
  }
  function load(url) {
    if (cache.has(url)) {
      const entry = cache.get(url)
      cache.delete(url); cache.set(url, entry)
      return entry.promise
    }
    const entry = { url, ready: false, pixels: 0 }
    entry.promise = new Promise((resolve, reject) => { entry.resolve = resolve; entry.reject = reject })
    cache.set(url, entry); queue.push(entry); pump()
    return entry.promise
  }
  return { preload: json => Promise.all(collectDesignImageSources(json).map(load)) }
}

const imageCache = createDesignImageCache()
export const preloadDesignTemplateAssets = json => imageCache.preload(json)
