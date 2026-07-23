
<template>
  <div class="box attr-item-box attr-panel-section" v-if="isOne">
    <Divider plain orientation="left"><h4>位置信息</h4></Divider>
    <div v-show="isMatchType">
      <div class="attr-field-row">
        <InputNumber
          v-model="baseAttr.left"
          @on-change="(value) => changeCommon('left', value)"
          :append="$t('attributes.left')"
        />
        <InputNumber
          v-model="baseAttr.top"
          @on-change="(value) => changeCommon('top', value)"
          :append="$t('attributes.top')"
        />
      </div>
      <Form :label-width="40" class="attr-form form-wrap">
        <FormItem :label="$t('attributes.scale')">
          <Slider
            v-model="baseAttr.scale"
            :min="10"
            :max="300"
            @on-input="(value) => changeCommon('scale', value)"
          />
        </FormItem>
        <FormItem :label="$t('attributes.angle')">
          <Slider
            v-model="baseAttr.angle"
            :max="360"
            @on-input="(value) => changeCommon('angle', value)"
          />
        </FormItem>
        <FormItem :label="$t('attributes.opacity')">
          <Slider
            v-model="baseAttr.opacity"
            @on-input="(value) => changeCommon('opacity', value)"
          />
        </FormItem>
      </Form>
    </div>
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select.js'
import InputNumber from '@/components/editorPro/editor-components/inputNumber/inputNumber.vue'
import { getCurrentInstance, onMounted, onBeforeUnmount, reactive } from 'vue'
import { clampPhotoSlotPan, isFilledPhotoSlot } from '@/utils/editorPro/pageTemplate'

const update = getCurrentInstance()

const baseType = [
  'text',
  'i-text',
  'textbox',
  'rect',
  'circle',
  'triangle',
  'polygon',
  'image',
  'group',
  'line',
  'arrow',
  'thinTailArrow',
]
const { isMatchType, canvasEditor, isOne } = useSelect(baseType)

const baseAttr = reactive({
  opacity: 0,
  angle: 0,
  scale: 100,
  left: 0,
  top: 0,
})

function readDisplayScale(activeObject) {
  const sx = activeObject?.scaleX || 1
  const sy = activeObject?.scaleY || 1
  return Math.round(((sx + sy) / 2) * 100)
}

const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject()
  if (e && e.target && e.target !== activeObject) return
  if (activeObject && isMatchType.value) {
    baseAttr.opacity = activeObject.get('opacity') * 100
    baseAttr.left = activeObject.get('left')
    baseAttr.top = activeObject.get('top')
    baseAttr.angle = activeObject.get('angle') || 0
    baseAttr.scale = readDisplayScale(activeObject)
  }
}

const changeCommon = (key, value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0]
  if (!activeObject) return

  if (key === 'opacity') {
    activeObject.set('opacity', value / 100)
    canvasEditor.canvas.renderAll()
    return
  }

  if (key === 'angle') {
    activeObject.rotate(value)
    canvasEditor.canvas.renderAll()
    return
  }

  if (key === 'scale') {
    const ratio = value / 100
    activeObject.set({ scaleX: ratio, scaleY: ratio })
    if (isFilledPhotoSlot(activeObject)) {
      clampPhotoSlotPan(activeObject)
    }
    activeObject.setCoords?.()
    canvasEditor.canvas.renderAll()
    return
  }

  activeObject.set(key, value)
  canvasEditor.canvas.renderAll()
}

const selectCancel = () => {
  update?.proxy?.$forceUpdate()
}

onMounted(() => {
  getObjectAttr()
  canvasEditor.on('selectCancel', selectCancel)
  canvasEditor.on('selectOne', getObjectAttr)
  canvasEditor.canvas.on('object:modified', getObjectAttr)
  canvasEditor.canvas.on('object:scaling', getObjectAttr)
})

onBeforeUnmount(() => {
  canvasEditor.off('selectCancel', selectCancel)
  canvasEditor.off('selectOne', getObjectAttr)
  canvasEditor.canvas.off('object:modified', getObjectAttr)
  canvasEditor.canvas.off('object:scaling', getObjectAttr)
})
</script>

<style scoped>
@import './attributePanel.css';
</style>
