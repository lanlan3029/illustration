<template>
  <el-config-provider :locale="elementPlusLocale" :z-index="12000">
    <div id="app" :class="{ 'has-tabbar': isMobile && !hideMobileTabBar, 'compact-editor-shell': route.name === 'editorpro', 'public-story-theme': isPublicPage || isStudioPage || isToolPage, 'studio-story-theme': isStudioPage, 'tool-story-theme': isToolPage, 'story-controls': isStudioPage || isToolPage }">
      <top-bar/>
      <login-register v-if="isMask" />
      <main class="app-main">
        <router-view />
        <the-footer v-if="!isMobile && route.name === 'books'" />
      </main>
      <the-footer v-if="!isMobile && route.name !== 'books'" :class="{ 'fixed-footer': route.path==='/' }"/>
      <mobile-tab-bar v-if="isMobile && !hideMobileTabBar" />
    </div>
  </el-config-provider>
</template>
<script>
import { computed, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElConfigProvider } from 'element-plus'
import { getElementPlusLocale } from '@/i18n/elementPlusLocale'
import TopBar from './components/TopBar.vue'
import TheFooter from './components/TheFooter.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'
import '@/styles/publicStoryTheme.css'


const LoginRegister = defineAsyncComponent(() => import('./components/LoginRegister.vue'))

document.oncontextmenu = function () {
        return false;
      };
export default {
  name: 'App',
  components: {
    ElConfigProvider,
    TopBar,
    LoginRegister,
    TheFooter,
    MobileTabBar
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const { isMobile } = useBreakpoint()
    const { locale } = useI18n()
    const elementPlusLocale = computed(() => getElementPlusLocale(locale.value))
    
    const isMask = computed(() => store.state.isMask)
    const isStudioPage = computed(() => route.matched.some(record => record.path === '/creation-studio'))
    const isToolPage = computed(() => ['photo-collage', 'diary-timeline', 'image-segmentation', 'lasso-crop', 'compose-illustration', 'topdf'].includes(route.name))
    const isPublicPage = computed(() => [
      'Home', 'books', 'search-books', 'bookdetails', 'illustration', 'illusdetails',
      'website-recommendations', 'blog', 'blog-post', 'connection', 'creator-program',
      'ai-picture-book-intro', 'ai-picture-book-tutorial',
    ].includes(route.name))

    // 图片编辑器自带底栏，隐藏全局 Tab，避免双底栏
    const hideMobileTabBar = computed(() => {
      const p = route.path || ''
      return (
        p.startsWith('/admin') ||
        p === '/photo-collage' ||
        p === '/editorpro' ||
        p.startsWith('/editorpro/') ||
        p.includes('/illustration/editor')
      )
    })

    
    return {
      elementPlusLocale,
      isMask,
      isPublicPage,
      isStudioPage,
      isToolPage,
      route,
      isMobile,
      hideMobileTabBar,
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
    padding-top: var(--ks-header-height);
    transition: padding-top 0.3s ease-out; /* 与导航栏滚动效果同步 */
}

#app.compact-editor-shell { --ks-header-height: 50px; }

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
