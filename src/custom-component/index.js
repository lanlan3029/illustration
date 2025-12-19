import { defineAsyncComponent } from 'vue'

const components = [
    { name: 'Picture', file: 'Picture' }, // 保持 Picture 名称，但检查是否已注册
    { name: 'v-text', file: 'VText' } // 使用 kebab-case 名称以匹配 component-list.js 中的 'v-text'
]

export default {
    install(app) {
        components.forEach(({ name, file }) => {
            // 使用 defineAsyncComponent 确保异步组件正确解析
            app.component(name, defineAsyncComponent(() => import(`@/custom-component/${file}`)))
        })
    }
}