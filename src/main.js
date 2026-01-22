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
// 微信授权成功后，会跳转到：https://www.kidstory.cc/wechat/callback?code=CODE&state=STATE
// 但由于我们使用 hash 路由模式（createWebHashHistory），需要将参数转移到 hash 路由中
// 将 /wechat/callback?code=xxx&state=xxx 转换为 /#/wechat/callback?code=xxx&state=xxx
(function handleWeChatCallback() {
  // 检查是否是直接访问的微信回调URL（没有hash）
  // 微信回调格式：https://www.kidstory.cc/wechat/callback?code=CODE&state=STATE
  if (window.location.pathname === '/wechat/callback' && !window.location.hash.includes('/wechat/callback')) {
    const search = window.location.search // 包含 ?code=xxx&state=xxx
    console.log('[main.js] 检测到微信回调URL（无hash）:', window.location.href)
    console.log('[main.js] pathname:', window.location.pathname, 'search:', search, 'hash:', window.location.hash)
    
    if (search) {
      // 重定向到 hash 路由格式，保留所有查询参数
      // 例如：/#/wechat/callback?code=081L7Fll2dO52h4pKsml2baLOJ3L7FlE&state=3d6be0a40sssssxxxxx6624a415e
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

// 添加请求拦截器：自动在请求头中添加 token
axios.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      // 自动添加 Authorization header
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    // 请求错误处理
    return Promise.reject(error)
  }
)

// 添加响应拦截器：处理 token 过期等情况
axios.interceptors.response.use(
  response => {
    // 正常响应直接返回
    return response
  },
  error => {
    // 如果返回 401 未授权，可能是 token 过期，清除登录状态
    if (error.response && error.response.status === 401) {
      console.warn('Token 已过期或无效，清除登录状态')
      localStorage.removeItem('token')
      localStorage.removeItem('id')
      // 可以在这里触发登出逻辑
    }
    return Promise.reject(error)
  }
)

// 将 axios 挂载到全局属性
app.config.globalProperties.$http = axios
// 将 Element Plus 的 message 挂载到全局属性（为了兼容性）
app.config.globalProperties.$message = ElementPlus.ElMessage

app.mount('#app')

// 图标按需导入，不再全局注册所有图标
// 各组件需要使用时自行导入所需的图标组件