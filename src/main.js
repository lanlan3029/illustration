import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import customComponents from '@/custom-component' // 注册自定义组件
import store from './store'
// 基础重置样式应最先加载，避免覆盖第三方组件样式
import '@/styles/reset.css'
// 响应式断点 token 与公共工具类（需在业务样式之前引入）
import '@/styles/breakpoints.css'
// Element Plus - 保持全量导入以确保兼容性
// 如需按需导入，建议使用 unplugin-vue-components（需要额外配置）
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import '@/assets/iconfont/iconfont.css'
import i18n from './i18n'
import '@/styles/editorPro.css';
import '@/assets/editorpro/fonts/font.css';

// 非关键 CSS - 延迟加载
// cropper.css 和 animate.css 在需要时动态导入
// import '@/styles/cropper.css'
// import 'animate.css/animate.css'
import '@/assets/lefticon/iconfont.css'
import axios from 'axios'
import { installChunkLoadRecovery } from '@/utils/chunkLoadRecovery'

installChunkLoadRecovery();

// History 路由：兼容旧 #/ 链接，301 式 replace 到无 hash 路径
function redirectLegacyHashRoutes() {
  const { origin, pathname, search, hash } = window.location
  const hashPath = (hash || '').replace(/^#/, '').replace(/^\/?/, '')
  if (!hashPath || hashPath === '/') return
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return

  const path = `/${hashPath}`
  window.location.replace(`${origin}${path}${search || ''}`)
}
redirectLegacyHashRoutes()

const app = createApp(App)

app.use(router)
app.use(store)
app.use(i18n)
app.use(ElementPlus)
app.use(ViewUIPlus)
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