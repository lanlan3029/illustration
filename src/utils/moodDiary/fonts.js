/** 思源宋体 — 标题 / Editorial 展示 */
export const MOOD_FONT_SERIF =
  '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif'

/** 霞鹜文楷 — 正文 / 治愈阅读 */
export const MOOD_FONT_KAI =
  '"LXGW WenKai", "LXGW WenKai SC", "Kaiti SC", "STKaiti", "KaiTi", serif'

/** Canvas 海报正文 */
export const MOOD_POSTER_BODY_FONT = MOOD_FONT_KAI

/** Canvas 海报标题 / Editorial */
export const MOOD_POSTER_DISPLAY_FONT = MOOD_FONT_SERIF

/** UI 正文 */
export const MOOD_UI_FONT_BODY = MOOD_FONT_KAI

/** UI 标题 */
export const MOOD_UI_FONT_DISPLAY = MOOD_FONT_SERIF

const FONT_LOAD_SPECS = [
  `400 16px ${MOOD_FONT_KAI}`,
  `500 16px ${MOOD_FONT_KAI}`,
  `400 14px ${MOOD_FONT_SERIF}`,
  `500 14px ${MOOD_FONT_SERIF}`,
  `600 42px ${MOOD_FONT_SERIF}`,
  `700 28px ${MOOD_FONT_SERIF}`
]

let fontsReady = null

/** 预加载 Web Font（心情日记 Shell 挂载时调用） */
export function preloadMoodDiaryFonts() {
  if (fontsReady) return fontsReady
  if (typeof document === 'undefined' || !document.fonts?.load) {
    fontsReady = Promise.resolve()
    return fontsReady
  }
  fontsReady = Promise.all(
    FONT_LOAD_SPECS.map((spec) => document.fonts.load(spec).catch(() => undefined))
  ).then(() => undefined)
  return fontsReady
}

/** Canvas / PDF 导出前确保字体可用 */
export async function ensureMoodDiaryFontsLoaded() {
  await preloadMoodDiaryFonts()
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
}
