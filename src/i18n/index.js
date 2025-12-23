import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

// 从本地存储读取语言设置，默认为中文
const savedLocale = localStorage.getItem('lang') || 'zh'

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
        zh,
        en
    },
    legacy: false, // 使用 Composition API 模式
    globalInjection: true // 全局注入 $t 函数
})

// 监听语言变化，更新 HTML lang 属性
i18n.global.locale.value = savedLocale

// 导出更新 HTML lang 的函数，供外部调用
export const updateDocumentLang = (lang) => {
    updateHtmlLang(lang)
}

export default i18n
