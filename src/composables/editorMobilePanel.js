import { reactive, computed } from 'vue'

/** Editorpro 手机端底部抽屉共享状态（Left / Right / Dock 共用） */
export const editorMobilePanel = reactive({
  /** null | 'left' | 'right' */
  sheet: null,
  menuActive: 'importTmpl',
})

export function useEditorMobilePanel() {
  const isLeftOpen = computed(() => editorMobilePanel.sheet === 'left')
  const isRightOpen = computed(() => editorMobilePanel.sheet === 'right')
  const isOpen = computed(() => editorMobilePanel.sheet != null)

  function openLeft(key) {
    if (
      editorMobilePanel.sheet === 'left' &&
      editorMobilePanel.menuActive === key
    ) {
      editorMobilePanel.sheet = null
      bumpResize()
      return
    }
    if (key) editorMobilePanel.menuActive = key
    editorMobilePanel.sheet = 'left'
  }

  function openRight() {
    if (editorMobilePanel.sheet === 'right') {
      editorMobilePanel.sheet = null
      bumpResize()
      return
    }
    editorMobilePanel.sheet = 'right'
  }

  function close() {
    if (editorMobilePanel.sheet == null) return
    editorMobilePanel.sheet = null
    bumpResize()
  }

  function bumpResize() {
    if (typeof window === 'undefined') return
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }

  return {
    panel: editorMobilePanel,
    isOpen,
    isLeftOpen,
    isRightOpen,
    openLeft,
    openRight,
    close,
  }
}
