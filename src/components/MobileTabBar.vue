<template>
  <nav class="kid-tabbar" role="navigation" aria-label="底部导航">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="kid-tab"
      :class="{ active: isActive(tab) }"
      @click="onTap(tab)"
    >
      <span class="kid-tab-icon" v-html="tab.icon"></span>
      <span class="kid-tab-label">{{ $t(tab.label) || tab.fallback }}</span>
    </button>
  </nav>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

// 内联 SVG（stroke 用 currentColor，激活态自动变色）
const ICONS = {
  home:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  create:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18"/><path d="M5 5l1.5 1.5M19 5l-1.5 1.5M5 19l1.5-1.5M19 19l-1.5-1.5"/></svg>',
  diary:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z"/><path d="M8 7h6M8 11h6"/></svg>',
  me:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>'
}

export default {
  name: 'MobileTabBar',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    const tabs = [
      { key: 'home', to: '/', label: 'nav.home', fallback: '首页', icon: ICONS.home },
      { key: 'create', to: '/ai-picture', label: 'nav.creation', fallback: '创作', icon: ICONS.create },
      { key: 'diary', to: '/mood-diary', label: 'nav.moodDiary', fallback: '日记', icon: ICONS.diary },
      { key: 'me', to: '/user', label: 'nav.my', fallback: '我的', icon: ICONS.me }
    ]

    const isLogin = computed(() => store.state.isLogin)

    const createPaths = [
      '/ai-picture',
      '/AIbooks',
      '/create-character',
      '/create-group-images',
      '/create-layout-illustration',
      '/editorpro',
      '/lasso-crop',
      '/user/upload/compose-illustration'
    ]

    const isActive = (tab) => {
      const p = route.path
      if (tab.key === 'home') return p === '/'
      if (tab.key === 'diary') return p.startsWith('/mood-diary')
      if (tab.key === 'me') return p.startsWith('/user')
      if (tab.key === 'create') return createPaths.some((c) => p === c || p.startsWith(c))
      return false
    }

    const onTap = (tab) => {
      if (tab.key === 'me') {
        if (isLogin.value || localStorage.getItem('token')) {
          if (route.path !== '/user') router.push('/user')
        } else {
          store.commit('showMask')
        }
        return
      }
      if (route.path !== tab.to) router.push(tab.to)
    }

    return { tabs, isActive, onTap }
  }
}
</script>

<style scoped>
.kid-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9000;
  display: flex;
  align-items: stretch;
  height: calc(var(--kid-tabbar-h, 58px) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(120, 100, 180, 0.1);
  box-shadow: 0 -6px 24px -10px rgba(49, 35, 82, 0.18);
}

.kid-tab {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--kid-text-sub, #8a8aa3);
  cursor: pointer;
  transition: color 0.2s ease, transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.kid-tab:active {
  transform: scale(0.94);
}

.kid-tab-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.kid-tab-icon :deep(svg) {
  width: 24px;
  height: 24px;
  display: block;
}

.kid-tab-label {
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
}

.kid-tab.active {
  color: var(--kid-primary, #6c5ce7);
}

.kid-tab.active .kid-tab-label {
  font-weight: 700;
}
</style>
