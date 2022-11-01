import Vue from 'vue'
import App from './App.vue'
import router from './router'
import '@/custom-component' // 注册自定义组件
import store from './store'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import '@/assets/iconfont/iconfont.css'
import '@/styles/reset.css'
import '@/styles/cropper.css'
import 'animate.css';
import '@/assets/lefticon/iconfont.css'

Vue.config.productionTip = false
Vue.use(ElementUI)

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')