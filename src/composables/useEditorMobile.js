/**
 * Editorpro 窄屏布局判断。
 * 断点与 useBreakpoint / breakpoints.css 一致：<= 768 为手机编辑器模式。
 */
import { useBreakpoint } from '@/composables/useBreakpoint'

export function useEditorMobile() {
  const { isMobile, width } = useBreakpoint()
  return {
    width,
    isMobileEditor: isMobile,
  }
}
