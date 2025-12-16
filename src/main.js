import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import customComponents from '@/custom-component' // 注册自定义组件
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/iconfont/iconfont.css'

import '@/styles/reset.css'
import '@/styles/cropper.css'
import 'animate.css/animate.css'
import '@/assets/lefticon/iconfont.css'
import axios from 'axios'

const app = createApp(App)

app.use(router)
app.use(store)
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

//百度统计
var _hmt = _hmt || [];
window._hmt = _hmt;
(function () {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?0d659afc1e301d15807bbc3442ccbeae";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();