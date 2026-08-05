/**
 * 可靠路由跳转：捕获重复导航，失败时用 hash 兜底。
 * @param {import('vue-router').Router} router
 * @param {{ name?: string, path?: string, params?: object, query?: object }} location
 * @param {string} [hashFallback] 如 '#/editorpro'
 */
export async function navigateTo(router, location, hashFallback) {
  try {
    await router.push(location);
  } catch (err) {
    if (err?.name === 'NavigationDuplicated' || err?.name === 'NavigationFailure') {
      return;
    }
    if (hashFallback) {
      // 始终落到 origin/#/...，避免残留 pathname（如 /mood-diary/...#/editorpro）
      const path = hashFallback.replace(/^#/, '').replace(/^\//, '');
      window.location.replace(`${window.location.origin}/#/${path}`);
      return;
    }
    throw err;
  }
}
