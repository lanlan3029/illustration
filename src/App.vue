<template>
<div id="app">
  <top-bar/>
  <login-register v-if="isMask" />
  <main class="app-main">
    <router-view />
  </main>
  <the-footer :class="{ 'fixed-footer': $route.path==='/' }"/>
  </div>
</template>
<script>
import {mapState} from "vuex"
import TopBar from './components/TopBar.vue'
import LoginRegister from "./components/LoginRegister.vue"
import TheFooter from './components/TheFooter.vue'

document.oncontextmenu = function () {
        return false;
      };
export default {
  components: {
    TopBar,LoginRegister,TheFooter
  },
  data(){
    return{
    }   
  },
   computed:mapState([
        "isMask",      
    ]),
    
  methods:{
   
   
}
}
</script>




<style >
html, body{
  height: 100%;
  overflow-y: auto;
}
#app {
    font-family:
        "PingFang SC", "Lantinghei SC", "Microsoft YaHei", "HanHei SC", "Helvetica Neue", "Open Sans", Arial, "Hiragino Sans GB", 微软雅黑, STHeiti, "WenQuanYi Micro Hei", SimSun, sans-serif, HYWenHei-GEW ;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-main{
    flex: 1; /* 占据剩余空间 */
    width: 100%;
    overflow: hidden;
    padding-top: 50px; /* 为固定导航栏留出空间（TopBar高度50px） */
    transition: padding-top 0.3s ease-out; /* 与导航栏滚动效果同步 */
}

/* 仅首页吸底显示页脚 */
.fixed-footer{
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}
</style>