import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'

const elementPlusLocales = {
    zh: zhCn,
    en,
}

/** 与 vue-i18n 的 zh / en 对齐，供 ElConfigProvider 使用 */
export function getElementPlusLocale(lang) {
    return elementPlusLocales[lang] || zhCn
}
