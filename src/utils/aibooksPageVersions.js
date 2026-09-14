/**
 * AI 绘本页级版本（浏览器内 bookData.pageVersions）
 */

export function emptyPageVersionsState() {
  return {};
}

export function ensurePageVersions(bookData) {
  if (!bookData) return emptyPageVersionsState();
  if (!bookData.pageVersions || typeof bookData.pageVersions !== 'object') {
    bookData.pageVersions = {};
  }
  return bookData.pageVersions;
}

export function initPageVersionsFromImages(bookData) {
  if (!bookData?.images) return;
  const pv = ensurePageVersions(bookData);
  bookData.images.forEach((url, index) => {
    if (!url) return;
    if (pv[index]?.versions?.length) return;
    pv[index] = {
      currentIndex: 0,
      versions: [{ url, source: 'generate', prompt: '', createdAt: Date.now() }],
    };
  });
}

export function getPageDisplayUrl(bookData, sceneIndex) {
  const pv = bookData?.pageVersions?.[sceneIndex];
  if (pv?.versions?.length) {
    const idx = Math.min(Math.max(0, pv.currentIndex ?? 0), pv.versions.length - 1);
    return pv.versions[idx]?.url || bookData?.images?.[sceneIndex] || '';
  }
  return bookData?.images?.[sceneIndex] || '';
}

export function getPageVersions(bookData, sceneIndex) {
  return bookData?.pageVersions?.[sceneIndex]?.versions || [];
}

export function getPageCurrentVersionIndex(bookData, sceneIndex) {
  return bookData?.pageVersions?.[sceneIndex]?.currentIndex ?? 0;
}

export function setPageCurrentVersion(bookData, sceneIndex, versionIndex) {
  const pv = ensurePageVersions(bookData);
  const entry = pv[sceneIndex];
  if (!entry?.versions?.length) return false;
  const idx = Math.min(Math.max(0, versionIndex), entry.versions.length - 1);
  entry.currentIndex = idx;
  const url = entry.versions[idx]?.url;
  if (url && bookData.images) {
    bookData.images[sceneIndex] = url;
  }
  return true;
}

export function pushPageVersion(bookData, sceneIndex, { url, source = 'inpaint', prompt = '' }) {
  if (!url || !bookData) return;
  const pv = ensurePageVersions(bookData);
  if (!pv[sceneIndex]) {
    pv[sceneIndex] = { currentIndex: 0, versions: [] };
  }
  pv[sceneIndex].versions.push({
    url,
    source,
    prompt,
    createdAt: Date.now(),
  });
  pv[sceneIndex].currentIndex = pv[sceneIndex].versions.length - 1;
  if (!Array.isArray(bookData.images)) {
    bookData.images = [];
  }
  while (bookData.images.length <= sceneIndex) bookData.images.push(null);
  bookData.images[sceneIndex] = url;
}

export function syncImagesFromCurrentVersions(bookData) {
  if (!bookData?.images) return;
  initPageVersionsFromImages(bookData);
  const pv = bookData.pageVersions || {};
  Object.keys(pv).forEach((key) => {
    const sceneIndex = Number(key);
    const url = getPageDisplayUrl(bookData, sceneIndex);
    if (url) bookData.images[sceneIndex] = url;
  });
}
