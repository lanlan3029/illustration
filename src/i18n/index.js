import { createI18n } from 'vue-i18n'
import { i18n as viewUiLocaleBridge } from 'view-ui-plus/src/locale'
import viewUiZh from 'view-ui-plus/dist/locale/zh-CN.js'
import viewUiEn from 'view-ui-plus/dist/locale/en-US.js'
import zh from './locales/zh.json'
import en from './locales/en.json'

/** 深度合并 locale 对象，后者覆盖前者（用于 App 文案覆盖 View UI Plus 默认文案） */
function deepMergeLocale(base, override) {
    const result = { ...(base || {}) }
    Object.keys(override || {}).forEach((key) => {
        const baseVal = base?.[key]
        const overrideVal = override[key]
        if (
            overrideVal &&
            typeof overrideVal === 'object' &&
            !Array.isArray(overrideVal) &&
            baseVal &&
            typeof baseVal === 'object' &&
            !Array.isArray(baseVal)
        ) {
            result[key] = deepMergeLocale(baseVal, overrideVal)
        } else {
            result[key] = overrideVal
        }
    })
    return result
}

/** View UI Plus 组件（DatePicker 等）使用 i.* 文案，需并入 vue-i18n */
function withViewUiLocale(appMessages, viewUiMessages) {
    return {
        ...appMessages,
        i: deepMergeLocale(viewUiMessages?.i, appMessages?.i),
    }
}

// 与 TopBar 一致：使用 key `lang`（纯字符串）。兼容旧版编辑器里误存的 `app_lang`（JSON）
function getSavedLocale() {
    const raw = localStorage.getItem('lang')
    if (raw === 'zh' || raw === 'en') return raw
    try {
        const legacy = localStorage.getItem('app_lang')
        if (legacy) {
            const v = JSON.parse(legacy)
            if (v === 'zh' || v === 'en') {
                localStorage.setItem('lang', v)
                return v
            }
        }
    } catch (_) { /* ignore */ }
    return 'zh'
}

const savedLocale = getSavedLocale()

// 更新 HTML lang 属性
const updateHtmlLang = (lang) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lang
    }
}

// 初始化时设置 HTML lang
updateHtmlLang(savedLocale)

const i18n = createI18n({
    locale: savedLocale,
    fallbackLocale: 'zh',
    messages: {
        zh: withViewUiLocale(zh, viewUiZh),
        en: withViewUiLocale(en, viewUiEn),
    },
    legacy: false, // 使用 Composition API 模式
    globalInjection: true // 全局注入 $t 函数
})

// 监听语言变化，更新 HTML lang 属性
i18n.global.locale.value = savedLocale

// 让 View UI Plus 与 vue-i18n 共用同一套 messages（含 i.datepicker.ok 等）
viewUiLocaleBridge(i18n)

// 导出更新 HTML lang 的函数，供外部调用
export const updateDocumentLang = (lang) => {
    updateHtmlLang(lang)
}

export default i18n
