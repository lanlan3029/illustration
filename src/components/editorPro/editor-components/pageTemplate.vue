<template>
  <div class="page-template-panel">
    <p class="page-template-hint">{{ $t('editorProLeft.pageTemplateHint') }}</p>

    <p v-if="canvasSizeLabel" class="page-template-canvas-meta">
      {{ canvasSizeLabel }}
    </p>

    <p v-if="!hasMatchingTemplates" class="page-template-no-match">
      {{ $t('editorProLeft.pageTemplateNoMatch') }}
    </p>

    <div v-for="group in templateGroups" :key="group.id" class="template-group">
      <Divider plain orientation="left">{{ group.name }}</Divider>
      <div class="template-grid">
        <button
          v-for="item in group.templates"
          :key="item.id"
          type="button"
          class="template-card"
          :title="item.name"
          @click="applyTemplate(item)"
        >
          <img
            :src="item.preview"
            :alt="item.name"
            loading="lazy"
            :class="previewClass(item.aspectRatio)"
          />
          <span class="template-card-name">{{ item.name }}</span>
        </button>
      </div>
    </div>

    <div v-if="activePhotoSlot" class="photo-slot-fill">
      <p class="photo-slot-fill-title">{{ $t('editorProLeft.photoSlotSelected') }}</p>
      <Button type="primary" long size="small" @click="fillFromLocal">
        {{ $t('editorProLeft.fillFromLocal') }}
      </Button>
      <Button long size="small" class="photo-slot-fill-secondary" @click="showIllPicker = true">
        {{ $t('editorProLeft.fillFromWorks') }}
      </Button>
    </div>

    <Modal
      v-model="showIllPicker"
      :title="$t('editorProLeft.fillFromWorks')"
      footer-hide
      width="360"
    >
      <div class="ill-picker">
        <div v-if="loadingIll && !illArr.length" class="ill-picker-tip">{{ $t('common.loading') }}</div>
        <div v-else-if="!illArr.length" class="ill-picker-tip">{{ $t('editorProLeft.noIllustrations') }}</div>
        <div v-else class="ill-picker-grid">
          <button
            v-for="item in illArr"
            :key="item._id"
            type="button"
            class="ill-picker-item"
            @click="fillFromIll(item)"
          >
            <img :src="illThumb(item)" :alt="item.title || ''" loading="lazy" />
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup name="PageTemplate">
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Modal, Spin, Message, Divider } from 'view-ui-plus'
import useSelect from '@/components/editorPro/hooks/select'
import {
  getLocalPageTemplateGroups,
  countMatchingTemplates,
} from '@/data/editorPageTemplates'
import {
  applyPageTemplateBehavior,
  fillPhotoSlotObject,
  pickLocalImageFile,
} from '@/utils/editorPro/pageTemplate'
import { activePhotoSlot } from '@/utils/editorPro/photoSlotContext'
import {
  fitTemplateToCanvas,
  getCurrentWorkspaceSize,
  formatAspectRatio,
} from '@/utils/editorPro/fitTemplateToCanvas'

const { t } = useI18n()
const { canvasEditor } = useSelect()
const { proxy } = getCurrentInstance()

const workspaceSize = ref({ width: 0, height: 0 })

const refreshWorkspaceSize = () => {
  workspaceSize.value = getCurrentWorkspaceSize(canvasEditor)
}

const templateGroups = computed(() => getLocalPageTemplateGroups(t, workspaceSize.value))

const hasMatchingTemplates = computed(() =>
  countMatchingTemplates(workspaceSize.value) > 0
)

const canvasSizeLabel = computed(() => {
  const { width, height } = workspaceSize.value
  if (!width || !height) return ''
  const ratio = formatAspectRatio(width, height)
  return t('editorProLeft.pageTemplateCanvasSize', { width, height, ratio })
})

function previewClass(aspectRatio) {
  if (aspectRatio === '2:1') return 'preview-2-1'
  if (aspectRatio === '1:1') return 'preview-1-1'
  return 'preview-3-4'
}

const showIllPicker = ref(false)
const illArr = ref([])
const loadingIll = ref(false)

const applyTemplate = async (item) => {
  if (!item?.json || !canvasEditor) return
  if (!hasMatchingTemplates.value) {
    Message.warning(t('editorProLeft.pageTemplateNoMatch'))
    return
  }

  Modal.confirm({
    title: t('tip'),
    content: `<p>${t('replaceTip')}</p>`,
    okText: t('ok'),
    cancelText: t('cancel'),
    onOk: async () => {
      Spin.show({ render: (h) => h('div', t('alert.loading_data')) })
      try {
        refreshWorkspaceSize()
        const { width, height } = workspaceSize.value
        const fittedJson = fitTemplateToCanvas(item.json, width, height)
        await canvasEditor.downFontByJSON(JSON.stringify(fittedJson))
        await new Promise((resolve) => {
          canvasEditor.loadJSON(JSON.stringify(fittedJson), () => {
            applyPageTemplateBehavior(canvasEditor.canvas)
            activePhotoSlot.value = null
            resolve()
          })
        })
        Message.success(t('editorProLeft.pageTemplateApplied'))
      } catch (e) {
        Message.error(e?.message || t('editorProLeft.pageTemplateFailed'))
      } finally {
        Spin.hide()
      }
    },
  })
}

const fillActiveSlot = async (imageSrc) => {
  if (!activePhotoSlot.value || !imageSrc) return
  try {
    await fillPhotoSlotObject(activePhotoSlot.value, imageSrc, canvasEditor.canvas)
    Message.success(t('editorProLeft.photoSlotFilled'))
    showIllPicker.value = false
  } catch {
    Message.error(t('editorProLeft.photoSlotFillFailed'))
  }
}

const fillFromLocal = async () => {
  const dataUrl = await pickLocalImageFile()
  if (dataUrl) await fillActiveSlot(dataUrl)
}

const illThumb = (item) => {
  const c = item?.content
  if (!c) return ''
  if (c.startsWith('http')) return c
  return `https://static.kidstory.cc/${c}`
}

const loadIllustrations = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  loadingIll.value = true
  try {
    const res = await proxy.$http.get('/ill/?page=1&sort_param=createdAt&sort_num=desc', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const list = res?.data?.message || res?.data?.data || []
    illArr.value = Array.isArray(list) ? list.slice(0, 24) : []
  } catch {
    illArr.value = []
  } finally {
    loadingIll.value = false
  }
}

const fillFromIll = async (item) => {
  const url = illThumb(item)
  if (url) await fillActiveSlot(url)
}

onMounted(() => {
  refreshWorkspaceSize()
  if (canvasEditor?.on) {
    canvasEditor.on('sizeChange', refreshWorkspaceSize)
  }
  loadIllustrations()
})

onBeforeUnmount(() => {
  if (canvasEditor?.off) {
    canvasEditor.off('sizeChange', refreshWorkspaceSize)
  }
})
</script>

<style scoped>
.page-template-panel {
  padding-bottom: 12px;
}

.page-template-hint {
  font-size: 12px;
  line-height: 1.55;
  color: #666;
  margin: 0 0 10px;
  padding: 8px 10px;
  background: #f5f0fa;
  border-radius: 8px;
}

.page-template-canvas-meta {
  margin: 0 0 10px;
  font-size: 12px;
  color: #8167a9;
  font-weight: 500;
}

.page-template-no-match {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  color: #ad6800;
  font-size: 12px;
  line-height: 1.5;
}

.template-group {
  margin-bottom: 4px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.template-card {
  border: none;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  background: #f1f2f4;
  text-align: center;
  transition: background 0.15s;
}

.template-card:hover {
  background: #e0dce8;
}

.template-card img.preview-3-4 {
  aspect-ratio: 3 / 4;
}

.template-card img.preview-1-1 {
  aspect-ratio: 1 / 1;
}

.template-card img.preview-2-1 {
  aspect-ratio: 2 / 1;
}

.template-card img {
  width: 100%;
  object-fit: contain;
  display: block;
  border-radius: 4px;
  background: #fff;
}

.template-card img:not(.preview-2-1):not(.preview-3-4):not(.preview-1-1) {
  aspect-ratio: 3 / 4;
}

.template-card-name {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #555;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-slot-fill {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #e8e0f4;
  border-radius: 10px;
  background: #faf8fc;
}

.photo-slot-fill-title {
  font-size: 12px;
  color: #555;
  margin: 0 0 10px;
}

.photo-slot-fill-secondary {
  margin-top: 8px;
}

.ill-picker {
  max-height: 360px;
  overflow-y: auto;
}

.ill-picker-tip {
  text-align: center;
  color: #999;
  padding: 24px 0;
  font-size: 13px;
}

.ill-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.ill-picker-item {
  border: none;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #f3f3f3;
  aspect-ratio: 1;
}

.ill-picker-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
