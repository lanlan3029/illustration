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

// 处理微信登录回调 - 必须在 Vue 应用创建之前执行
// 因为微信回调 URL 是 /wechat/callback?code=xxx，但我们使用 hash 路由模式
// 需要将参数转移到 hash 路由中
(function handleWeChatCallback() {
  // 检查是否是直接访问的微信回调URL（没有hash）
  if (window.location.pathname === '/wechat/callback' && !window.location.hash.includes('/wechat/callback')) {
    const search = window.location.search
    console.log('[main.js] 检测到微信回调URL（无hash）:', window.location.href)
    console.log('[main.js] pathname:', window.location.pathname, 'search:', search, 'hash:', window.location.hash)
    
    if (search) {
      // 重定向到 hash 路由格式
      const hashUrl = `${window.location.origin}/#/wechat/callback${search}`
      console.log('[main.js] 重定向到 hash 路由:', hashUrl)
      window.location.replace(hashUrl)
      // 注意：执行 replace 后会立即跳转，后续代码不会执行
      return // 阻止后续代码执行
    } else {
      console.warn('[main.js] 微信回调URL没有查询参数，可能不是有效的回调')
    }
  } else if (window.location.hash.includes('/wechat/callback')) {
    console.log('[main.js] 检测到微信回调URL（hash路由）:', window.location.href)
  }
})()

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