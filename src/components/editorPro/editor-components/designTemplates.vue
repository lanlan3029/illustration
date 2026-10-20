<template>
  <section class="design-templates" aria-label="设计拼图模板">
    <h4>设计拼图模板 <span>{{ templates.length }}</span></h4>
    <p>选择模板将使用对应画布尺寸。照片为占位符，选中后可从本地或作品中填入。</p>
    <label class="design-search">搜索模板<input v-model="search" placeholder="名称、主题或编号" aria-label="搜索设计拼图模板" /></label>
    <label class="design-filter">画布比例<select v-model="aspect" aria-label="设计拼图模板比例"><option value="">全部比例</option><option value="1:1">方形 1:1</option><option value="4:3">横版 4:3</option><option value="9:16">竖版 9:16</option></select></label>
    <p role="status">共 {{ filtered.length }} 套 · 已显示 {{ visibleTemplates.length }} 套</p>
    <div class="design-template-grid">
      <div v-for="(column, index) in columns" :key="index" class="design-template-column">
        <button v-for="item in column" :key="item.id" type="button" :disabled="loading"
          :aria-label="`应用设计模板：${item.name}`" @pointerenter="prefetchTemplate(item)" @focus="prefetchTemplate(item)" @click="confirmTemplate(item)">
          <img :src="assetUrl(item.preview, item)" :alt="item.name" :width="item.width" :height="item.height"
            :loading="eagerIds.has(item.id) ? 'eager' : 'lazy'" decoding="async" />
          <span>{{ item.name }}</span><small>{{ item.aspectRatio }} · {{ item.photoCount }} 张</small>
        </button>
      </div>
    </div>
    <div ref="loadMoreTarget" class="design-load-more" role="status">
      {{ !filtered.length ? '没有匹配的模板' : hasMore ? '向下滚动，自动加载更多模板…' : '已显示全部模板' }}
    </div>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>

<script setup>
import { ref, nextTick, computed, watch, onMounted, onActivated, onDeactivated, onBeforeUnmount } from 'vue'
import { Modal } from 'view-ui-plus'
import { fabric } from 'fabric'
import useSelect from '@/components/editorPro/hooks/select'
import templates from '@/data/editorPageTemplates/designTemplates.json'
import { applyPageTemplateBehavior } from '@/utils/editorPro/pageTemplate'
import { activePhotoSlot } from '@/utils/editorPro/photoSlotContext'
import { useEditorMobilePanel } from '@/composables/editorMobilePanel'

const { canvasEditor } = useSelect()
const assetUrl = (url, item) => `${url}?v=${item.revision || '1'}`
const loading = ref(false)
const message = ref('')
const BATCH_SIZE = 12
const search = ref(''), aspect = ref(''), visibleCount = ref(BATCH_SIZE)
const loadMoreTarget = ref(null)
const searchIndex = new Map(templates.map(item => [item.id,
  `${item.name} ${item.sourceTemplateId} ${item.tags || ''}`.toLowerCase()]))
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return templates.filter(item => (!aspect.value || item.aspectRatio === aspect.value) &&
    (!query || searchIndex.get(item.id).includes(query)))
})
const visibleTemplates = computed(() => filtered.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filtered.value.length)
const eagerIds = computed(() => new Set(visibleTemplates.value.slice(0, 4).map(item => item.id)))
// Stable shortest-column assignment keeps existing cards in place on append.
const columns = computed(() => {
  const result = [[], []], heights = [0, 0]
  for (const item of visibleTemplates.value) {
    const column = heights[0] <= heights[1] ? 0 : 1
    result[column].push(item)
    heights[column] += 140 * item.height / item.width + 64
  }
  return result
})
let observer
let panelActive = true
function stopObserving() { observer?.disconnect(); observer = null }
async function observeMore() {
  await nextTick()
  stopObserving()
  const target = loadMoreTarget.value
  if (!panelActive || !target || !hasMore.value) return
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && hasMore.value) {
      visibleCount.value = Math.min(visibleCount.value + BATCH_SIZE, filtered.value.length)
    }
  }, { root: target.closest('.editor-sheet__body, .content'), rootMargin: '0px 0px 500px 0px' })
  observer.observe(target)
}
watch([search, aspect], async () => {
  visibleCount.value = BATCH_SIZE
  await nextTick()
  const root = loadMoreTarget.value?.closest('.editor-sheet__body, .content')
  if (root) root.scrollTop = 0
  observeMore()
})
watch(visibleCount, observeMore)
onMounted(observeMore)
onActivated(() => { panelActive = true; observeMore() })
onDeactivated(() => { panelActive = false; stopObserving() })
onBeforeUnmount(stopObserving)

// Revisioned URLs allow the browser to reuse layouts; hover/focus warms only
// likely selections, and a small promise cache avoids duplicate requests.
const layoutCache = new Map()
function loadTemplate(item) {
  const url = assetUrl(item.jsonUrl, item)
  if (layoutCache.has(url)) return layoutCache.get(url)
  const request = fetch(url, { cache: 'force-cache' }).then(response => {
    if (!response.ok) throw new Error('模板加载失败，请重试。')
    return response.json()
  }).catch(error => { layoutCache.delete(url); throw error })
  layoutCache.set(url, request)
  if (layoutCache.size > 8) layoutCache.delete(layoutCache.keys().next().value)
  return request
}
function prefetchTemplate(item) { loadTemplate(item).catch(() => {}) }
const { close: closeMobilePanel } = useEditorMobilePanel()

async function confirmTemplate(item) {
  if (loading.value) return
  // The mobile sheet has a higher stacking layer than Modal.confirm's mask.
  closeMobilePanel()
  await nextTick()
  Modal.confirm({
    title: '应用设计拼图模板',
    content: `将替换当前画布内容，并使用 ${item.width} × ${item.height} 像素的模板尺寸。`,
    okText: '应用模板', cancelText: '取消',
    onOk: () => applyTemplate(item),
  })
}

async function applyTemplate(item) {
  loading.value = true
  message.value = '正在加载模板…'
  try {
    const json = JSON.parse(JSON.stringify(await loadTemplate(item)))
    // Font substitution can make a formerly single-line title wrap. Measure the
    // installed system font and fit its longest line within the original box.
    for (const object of json.objects) {
      if (object.type !== 'textbox' || !object.text || !object.width) continue
      const measured = new fabric.Text(object.text, {
        fontFamily: object.fontFamily, fontSize: object.fontSize,
        fontWeight: object.fontWeight, fontStyle: object.fontStyle,
        charSpacing: object.charSpacing || 0,
      })
      if (measured.width > object.width) {
        object.fontSize *= object.width / measured.width * .98
      }
    }
    await new Promise((resolve, reject) => {
      Promise.resolve(canvasEditor.loadJSON(json, resolve)).catch(reject)
    })
    applyPageTemplateBehavior(canvasEditor.canvas)
    activePhotoSlot.value = null
    canvasEditor.saveState()
    message.value = '已应用模板，选中照片占位符即可填入图片。'
  } catch (error) {
    message.value = error.message || '模板加载失败，请重试。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.design-templates { margin: 14px 0 20px; text-align: left; }
.design-templates h4 { font-size: 14px; }
.design-templates h4 span { color: #7952ac; font-size: 11px; margin-left: 6px; }
.design-templates p { font-size: 11px; color: #74667d; line-height: 1.7; }
.design-template-grid { display: flex; gap: 8px; align-items: flex-start; }
.design-template-column { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.design-template-grid button { padding: 6px; border: 1px solid #e9e4ee; border-radius: 8px; background: white; cursor: pointer; min-width: 0; width: 100%; }
.design-template-grid button:hover { border-color: #7952ac; }
.design-template-grid button:focus-visible { outline: 2px solid #7952ac; }
.design-template-grid button:disabled { opacity: .6; cursor: wait; }
.design-template-grid img { width: 100%; height: auto; object-fit: contain; display: block; background: #f5f2f8; }
.design-template-grid span, .design-template-grid small { display: block; margin-top: 5px; font-size: 11px; }
.design-template-grid small { color: #85758f; }
.design-search, .design-filter { display: flex; gap: 8px; align-items: center; margin: 10px 0; font-size: 12px; }
.design-search input, .design-filter select { min-width: 0; flex: 1; width: 100%; border: 1px solid #dfd3ed; padding: 7px; border-radius: 6px; background: white; }
.design-load-more { padding: 16px 0; text-align: center; color: #85758f; font-size: 11px; min-height: 48px; }
</style>
