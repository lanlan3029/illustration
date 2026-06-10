/**
 * 全项目视口断点判断的唯一入口。
 *
 * 用法：
 *   import { useBreakpoint } from '@/composables/useBreakpoint'
 *   const { isMobile, isTablet, isDesktop, width } = useBreakpoint()
 *
 * 约定：
 * - 断点与 src/styles/breakpoints.css 保持一致：手机 = width <= 768。
 * - 不要再在组件里裸写 window.innerWidth 做视口判断，统一走这里。
 * - 仅当「DOM 结构本质不同」（如桌面下拉 vs 手机菜单）时才用 JS 判断；
 *   纯样式差异请优先用 CSS @media。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const BP_MD = 768
const BP_LG = 1024
const SSR_DEFAULT_WIDTH = 1280

// 模块级共享状态，多个组件共用同一个监听，避免重复绑定 resize。
const width = ref(typeof window !== 'undefined' ? window.innerWidth : SSR_DEFAULT_WIDTH)

let listenerCount = 0
let onResize = null

function bind() {
  if (typeof window === 'undefined') return
  if (listenerCount === 0) {
    onResize = () => {
      width.value = window.innerWidth
    }
    window.addEventListener('resize', onResize, { passive: true })
    // 立即同步一次，覆盖 SSR 初始值或挂载前的窗口变化
    width.value = window.innerWidth
  }
  listenerCount += 1
}

function unbind() {
  if (typeof window === 'undefined') return
  listenerCount -= 1
  if (listenerCount <= 0) {
    listenerCount = 0
    if (onResize) {
      window.removeEventListener('resize', onResize)
      onResize = null
    }
  }
}

export function useBreakpoint() {
  onMounted(bind)
  onBeforeUnmount(unbind)

  return {
    width,
    isMobile: computed(() => width.value <= BP_MD),
    isTablet: computed(() => width.value > BP_MD && width.value <= BP_LG),
    isDesktop: computed(() => width.value > BP_LG),
  }
}
