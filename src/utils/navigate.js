/**
 * 可靠路由跳转：捕获重复导航，失败时用 path 硬跳转兜底。
 * @param {import('vue-router').Router} router
 * @param {{ name?: string, path?: string, params?: object, query?: object }} location
 * @param {string} [pathFallback] 如 '/editorpro'
 */
export async function navigateTo(router, location, pathFallback) {
  try {
    await router.push(location);
  } catch (err) {
    if (err?.name === 'NavigationDuplicated' || err?.name === 'NavigationFailure') {
      return;
    }
    if (pathFallback) {
      const path = String(pathFallback).replace(/^#/, '');
      const normalized = path.startsWith('/') ? path : `/${path}`;
      window.location.replace(`${window.location.origin}${normalized}`);
      return;
    }
    throw err;
  }
}
