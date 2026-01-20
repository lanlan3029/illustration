import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import customComponents from '@/custom-component' // 注册自定义组件
import store from './store'
// Element Plus - 保持全量导入以确保兼容性
// 如需按需导入，建议使用 unplugin-vue-components（需要额外配置）
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

// 挂载应用
app.mount('#app')

// 处理微信登录回调：如果 URL 包含 /wechat/callback 且没有 hash，跳转到 hash 路由
// 因为路由使用 hash 模式（createWebHashHistory），但微信回调 URL 不包含 hash
// 需要将 /wechat/callback?code=xxx 转换为 /#/wechat/callback?code=xxx
// 在应用挂载后立即检查并跳转
setTimeout(() => {
  if (window.location.pathname === '/wechat/callback' && !window.location.hash) {
    const search = window.location.search
    // 跳转到 hash 路由，保留查询参数
    // 使用 replace 避免在浏览器历史中留下记录
    window.location.replace(`/#/wechat/callback${search}`)
  }
}, 0)

// 图标按需导入，不再全局注册所有图标
// 各组件需要使用时自行导入所需的图标组件