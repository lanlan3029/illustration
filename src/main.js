import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import customComponents from '@/custom-component' // 注册自定义组件
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/iconfont/iconfont.css'
import i18n from './i18n'

// 关键 CSS - 立即加载
import '@/styles/reset.css'

// 非关键 CSS - 延迟加载
// cropper.css 和 animate.css 在需要时动态导入
// import '@/styles/cropper.css'
// import 'animate.css/animate.css'
import '@/assets/lefticon/iconfont.css'
import axios from 'axios'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(i18n)
app.use(ElementPlus)
app.use(customComponents)

// 配置 axios
axios.defaults.baseURL = 'https://api.kidstory.cc/'
// 设置全局请求超时时间（30秒）
axios.defaults.timeout = 30000

// 将 axios 挂载到全局属性
app.config.globalProperties.$http = axios
// 将 Element Plus 的 message 挂载到全局属性（为了兼容性）
app.config.globalProperties.$message = ElementPlus.ElMessage

app.mount('#app')

// 图标按需导入，不再全局注册所有图标
// 各组件需要使用时自行导入所需的图标组件