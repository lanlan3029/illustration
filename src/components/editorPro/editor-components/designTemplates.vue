<template>
  <section class="design-templates" aria-label="设计拼图模板">
    <h4>设计拼图模板 <span>{{ templates.length }}</span></h4>
    <p>选择模板将使用对应画布尺寸。照片为占位符，选中后可从本地或作品中填入。</p>
    <label class="design-search">搜索模板<input v-model="search" placeholder="名称、主题或编号" aria-label="搜索设计拼图模板" /></label>
    <label class="design-filter">画布比例<select v-model="aspect" aria-label="设计拼图模板比例"><option value="">全部比例</option><option value="1:1">方形 1:1</option><option value="4:3">横版 4:3</option><option value="9:16">竖版 9:16</option></select></label>
    <p role="status">共 {{ filtered.length }} 套 · 第 {{ page }} / {{ totalPages }} 页</p>
    <div class="design-template-grid">
      <button v-for="item in visibleTemplates" :key="item.id" type="button" :disabled="loading"
        :aria-label="`应用设计模板：${item.name}`" @click="confirmTemplate(item)">
        <img :src="assetUrl(item.preview, item)" :alt="item.name" loading="lazy" />
        <span>{{ item.name }}</span><small>{{ item.aspectRatio }} · {{ item.photoCount }} 张</small>
      </button>
    </div>
    <div class="design-pagination"><button type="button" :disabled="page <= 1" @click="page--">上一页</button><button type="button" :disabled="page >= totalPages" @click="page++">下一页</button></div>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>

<script setup>
import { ref, nextTick, computed, watch } from 'vue'
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
const search = ref(''), aspect = ref(''), page = ref(1)
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return templates.filter(item => (!aspect.value || item.aspectRatio === aspect.value) &&
    (!query || `${item.name} ${item.sourceTemplateId} ${item.tags || ''}`.toLowerCase().includes(query)))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 12)))
const visibleTemplates = computed(() => filtered.value.slice((page.value - 1) * 12, page.value * 12))
watch([search, aspect], () => { page.value = 1 })
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
    const response = await fetch(assetUrl(item.jsonUrl, item), { cache: 'no-cache' })
    if (!response.ok) throw new Error('模板加载失败，请重试。')
    const json = await response.json()
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
.design-template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.design-template-grid button { padding: 6px; border: 1px solid #e9e4ee; border-radius: 8px; background: white; cursor: pointer; min-width: 0; }
.design-template-grid button:hover { border-color: #7952ac; }
.design-template-grid button:focus-visible { outline: 2px solid #7952ac; }
.design-template-grid button:disabled { opacity: .6; cursor: wait; }
.design-template-grid img { width: 100%; aspect-ratio: 4 / 3; object-fit: contain; display: block; background: #f5f2f8; }
.design-template-grid span, .design-template-grid small { display: block; margin-top: 5px; font-size: 11px; }
.design-template-grid small { color: #85758f; }
.design-search, .design-filter { display: flex; gap: 8px; align-items: center; margin: 10px 0; font-size: 12px; }
.design-search input, .design-filter select { min-width: 0; flex: 1; width: 100%; border: 1px solid #dfd3ed; padding: 7px; border-radius: 6px; background: white; }
.design-pagination { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
.design-pagination button { background: white; border: 1px solid #dfd3ed; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
.design-pagination button:disabled { opacity: .45; cursor: default; }
</style>
