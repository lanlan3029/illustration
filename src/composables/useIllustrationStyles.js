import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadIllustrationStyles } from '@/utils/illustrationStyles'

/**
 * @param {{ category?: string, immediate?: boolean }} [options]
 */
export function useIllustrationStyles(options = {}) {
  const { t, locale } = useI18n()
  const styles = ref([])
  const loading = ref(false)
  const fromApi = ref(false)

  async function refresh(force = false) {
    loading.value = true
    try {
      const loc = locale.value === 'en' ? 'en' : 'zh'
      const items = await loadIllustrationStyles({
        locale: loc,
        category: options.category || '',
        t,
        force,
      })
      styles.value = items
      fromApi.value = items.some((s) => /^https?:\/\//.test(s.imageUrl || s.image || ''))
    } finally {
      loading.value = false
    }
  }

  if (options.immediate !== false) {
    onMounted(() => refresh())
    watch(locale, () => refresh(true))
  }

  return {
    styles,
    loading,
    fromApi,
    refresh,
  }
}
