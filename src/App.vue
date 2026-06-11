<template>
<div id="app" :class="{ 'has-tabbar': isMobile }">
  <top-bar/>
  <login-register v-if="isMask" />
  <main class="app-main">
    <router-view />
  </main>
  <the-footer v-if="!isMobile" :class="{ 'fixed-footer': route.path==='/' }"/>
  <mobile-tab-bar v-if="isMobile" />
  </div>
</template>
<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import TopBar from './components/TopBar.vue'
import LoginRegister from "./components/LoginRegister.vue"
import TheFooter from './components/TheFooter.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

document.oncontextmenu = function () {
        return false;
      };
export default {
  name: 'App',
  components: {
    TopBar,
    LoginRegister,
    TheFooter,
    MobileTabBar
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const { isMobile } = useBreakpoint()
    
    const isMask = computed(() => store.state.isMask)
    
    return {
      isMask,
      route,
      isMobile
    }
  }
}
</script>




<style >
/*
 * 滚动模型：body/#app 锁死在视口高度，唯一滚动容器是 .app-main。
 * 避免 body overflow:hidden + 子页面撑高 #app 导致下方内容被裁切却无法滚动。
 */
html {
  height: 100%;
  height: 100dvh;
}

html, body {
  height: 100%;
  height: 100dvh;
  overflow: hidden;
}

#app {
    font-family:
        "PingFang SC", "Lantinghei SC", "Microsoft YaHei", "HanHei SC", "Helvetica Neue", "Open Sans", Arial, "Hiragino Sans GB", 微软雅黑, STHeiti, "WenQuanYi Micro Hei", SimSun, sans-serif, HYWenHei-GEW ;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    height: 100%;
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.app-main{
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
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

/* 顶部有固定 TopBar，消息提示整体下移，避免被遮挡 */
.ivu-message {
  top: 72px !important;
}

.el-message {
  top: 72px !important;
}

/* 手机端：为底部 Tab 导航预留安全留白，避免内容被遮挡 */
@media (max-width: 768px) {
  #app.has-tabbar .app-main {
    padding-bottom: calc(var(--kid-tabbar-h, 58px) + env(safe-area-inset-bottom, 0px) + 8px);
  }
}
</style>