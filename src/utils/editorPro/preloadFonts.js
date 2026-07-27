import localFonts from '@/assets/editorpro/fonts/font.js'

/** 仅预加载本地自定义字体（排除系统 CSS 栈） */
export function getCustomEditorFontFamilies() {
  return (localFonts || [])
    .map((f) => String(f.fontFamily || f.name || '').trim())
    .filter((family) => family && !family.includes(','))
}

let preloadPromise = null

/**
 * 进入编辑器后后台预加载自定义字体。
 * 浏览器默认要等到页面真正用到 @font-face 才下载；
 * 下拉里用 font-family 渲染名称时才会触发，所以会感觉「点开才开始下、等很久」。
 */
export function preloadEditorFonts() {
  if (preloadPromise) return preloadPromise
  if (typeof document === 'undefined' || !document.fonts?.load) {
    preloadPromise = Promise.resolve()
    return preloadPromise
  }

  const families = getCustomEditorFontFamilies()
  // 并发拉取；浏览器会自己调度带宽。用中文测试串确保 CJK 字形就绪。
  preloadPromise = Promise.all(
    families.map((family) =>
      document.fonts
        .load(`400 16px "${family.replace(/"/g, '')}"`, '汉字字体预览Aa')
        .catch(() => undefined)
    )
  ).then(() => undefined)

  return preloadPromise
}

export async function ensureEditorFontsLoaded() {
  await preloadEditorFonts()
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
}
