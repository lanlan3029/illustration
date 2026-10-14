<template>
  <section class="collage-panel" :aria-label="text('照片拼图', 'Photo collage')">
    <h3>{{ text('照片拼图', 'Photo collage') }}</h3>
    <p>{{ text('选择布局，应用后点击照片框填图。拖动照片可调整取景。', 'Choose a layout, then select a frame to add a photo. Drag photos to adjust the crop.') }}</p>
    <div class="collage-grid">
      <button v-for="layout in COLLAGE_LAYOUTS" :key="layout.id" type="button"
        :class="{ selected: selected === layout.id }" :aria-pressed="selected === layout.id"
        @click="selected = layout.id">
        <svg viewBox="0 0 100 80" aria-hidden="true">
          <rect width="100" height="80" :fill="background" />
          <rect v-for="(frame, i) in collageFrames(layout.id, 100, 80, spacing)" :key="i"
            :x="frame.left" :y="frame.top" :width="frame.width" :height="frame.height" fill="#bba5d5" />
        </svg>
        <span>{{ text(...layout.label) }}</span>
      </button>
    </div>
    <label class="collage-setting">{{ text('间距', 'Spacing') }} <output>{{ spacing }}%</output>
      <input v-model.number="spacing" type="range" min="0" max="8" step="0.5" :aria-label="text('拼图间距', 'Collage spacing')" />
    </label>
    <label class="collage-setting color-setting">{{ text('背景色', 'Background') }}
      <input v-model="background" type="color" :aria-label="text('拼图背景色', 'Collage background')" />
    </label>
    <Button type="primary" long :disabled="busy || filling" @click="apply">{{ text('应用拼图布局', 'Apply collage layout') }}</Button>
    <p class="collage-note">{{ text('应用布局会替换当前画布内容，画布尺寸保持不变。间距和背景色在应用时生效。', 'Applying replaces the current canvas content and keeps its dimensions. Spacing and background take effect when applied.') }}</p>
    <Button long :loading="filling" :disabled="busy || filling" @click="fileInput.click()">{{ text('批量填入照片框', 'Fill frames from photos') }}</Button>
    <input ref="fileInput" class="file-input" type="file" accept="image/*" multiple @change="fillFiles" />
    <p class="collage-note">{{ text('按照片框顺序填入空框；已填照片保留。单张替换可使用下方照片框操作。', 'Fill empty frames in order, keeping existing photos. Select a frame below to replace one photo.') }}</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Message } from 'view-ui-plus'
import useSelect from '@/components/editorPro/hooks/select'
import { COLLAGE_LAYOUTS, collageFrames, buildCollageTemplate } from '@/data/editorPageTemplates/collageTemplates'
import { getCurrentWorkspaceSize } from '@/utils/editorPro/fitTemplateToCanvas'
import { isPhotoSlotObject, isFilledPhotoSlot, fillPhotoSlotObject } from '@/utils/editorPro/pageTemplate'

const props = defineProps({ busy: Boolean })
const emit = defineEmits(['apply', 'filling'])
const { locale } = useI18n()
const { canvasEditor } = useSelect()
const text = (zh, en) => locale.value.startsWith('zh') ? zh : en
const selected = ref('four')
const spacing = ref(2)
const background = ref('#ffffff')
const fileInput = ref(null)
const filling = ref(false)

function apply() {
  if (props.busy || filling.value) return
  const { width, height } = getCurrentWorkspaceSize(canvasEditor)
  if (!width || !height) return Message.warning(text('请先创建画布', 'Create a canvas first'))
  emit('apply', { json: buildCollageTemplate(selected.value, width, height, { spacing: spacing.value, background: background.value }), allowAnySize: true })
}

async function fillFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length || filling.value || props.busy) return
  const canvas = canvasEditor.canvas
  const slots = canvas.getObjects().filter((obj) => isPhotoSlotObject(obj) && !isFilledPhotoSlot(obj))
  if (!slots.length) return Message.info(text('请先应用布局，或选择照片框替换照片', 'Apply a layout first, or select a frame to replace a photo'))
  filling.value = true
  emit('filling', true)
  let success = 0
  let failed = 0
  try {
    for (const [index, file] of files.slice(0, slots.length).entries()) {
      try {
        // Persist photos in drafts without depending on temporary object URLs.
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        await fillPhotoSlotObject(slots[index], data, canvas)
        success++
      } catch { failed++ }
    }
    if (success) canvas.fire('object:modified')
    if (failed) Message.warning(text(`已填入 ${success} 张，${failed} 张无法读取`, `Added ${success} photos; ${failed} could not be read`))
    else Message.success(text(`已填入 ${success} 张照片`, `Added ${success} photos`))
    if (files.length > slots.length) Message.info(text('多余照片未添加：照片框已满', 'Extra photos were not added: all frames are full'))
  } finally { filling.value = false; emit('filling', false) }
}
</script>

<style scoped>
.collage-panel { padding: 12px; margin-bottom: 18px; background: #faf8fc; border: 1px solid #e8e0f4; border-radius: 10px; }
h3 { margin: 0 0 8px; font-size: 15px; color: #473459; }
p { font-size: 12px; line-height: 1.6; color: #666; margin: 8px 0; }
.collage-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.collage-grid button { border: 2px solid transparent; background: #fff; padding: 5px; border-radius: 6px; cursor: pointer; font-size: 11px; color: #574468; }
.collage-grid button.selected { border-color: #8167a9; }
.collage-grid button:focus-visible { outline: 2px solid #473459; outline-offset: 2px; }
svg { width: 100%; display: block; margin-bottom: 4px; }
.collage-setting { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-size: 12px; margin: 12px 0; }
input[type=range] { width: 100%; accent-color: #8167a9; }
input[type=color] { width: 40px; height: 28px; border: 0; background: none; cursor: pointer; }
.collage-note { font-size: 11px; color: #777; }
.file-input { display: none; }
</style>
