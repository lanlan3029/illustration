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
import axios from 'axios'

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.prototype.$http = axios

axios.defaults.baseURL = 'https://api.kidstory.cc/'

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')

//百度统计
var _hmt = _hmt || [];
window._hmt = _hmt;
(function () {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?0d659afc1e301d15807bbc3442ccbeae";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();