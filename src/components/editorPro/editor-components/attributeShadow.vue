
<template>
  <div class="box attr-item-box attr-panel-section" v-if="isOne">
    <Divider plain orientation="left"><h4>阴影</h4></Divider>
    <Form :label-width="40" class="attr-form form-wrap">
      <FormItem :label="$t('color')">
        <ColorPicker v-model="baseAttr.shadow.color" @on-change="changeCommon" alpha />
      </FormItem>
      <FormItem :label="$t('attributes.blur')">
        <InputNumber
          v-model="baseAttr.shadow.blur"
          :defaultValue="0"
          @on-change="changeCommon"
          :min="0"
        />
      </FormItem>
    </Form>
    <div class="attr-field-row">
      <InputNumber
        v-model="baseAttr.shadow.offsetX"
        :defaultValue="0"
        @on-change="changeCommon"
        :append="$t('attributes.offset_x')"
      />
      <InputNumber
        v-model="baseAttr.shadow.offsetY"
        :defaultValue="0"
        @on-change="changeCommon"
        :append="$t('attributes.offset_y')"
      />
    </div>
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select.js'
import InputNumber from '@/components/editorPro/editor-components/inputNumber/inputNumber.vue'
import { getCurrentInstance, onMounted, onBeforeUnmount, reactive } from 'vue'

const update = getCurrentInstance()
const { fabric, isOne, canvasEditor } = useSelect()

const baseAttr = reactive({
  shadow: {
    color: 'rgba(0,0,0,0.3)',
    blur: 0,
    offsetX: 0,
    offsetY: 0,
  },
})

const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject()
  if (e && e.target && e.target !== activeObject) return
  if (activeObject) {
    const shadow = activeObject.get('shadow') || {}
    baseAttr.shadow = {
      color: shadow.color || 'rgba(0,0,0,0.3)',
      blur: shadow.blur || 0,
      offsetX: shadow.offsetX || 0,
      offsetY: shadow.offsetY || 0,
    }
  }
}

const changeCommon = () => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0]
  if (activeObject) {
    activeObject.set('shadow', new fabric.Shadow(baseAttr.shadow))
    canvasEditor.canvas.renderAll()
  }
}

const selectCancel = () => {
  update?.proxy?.$forceUpdate()
}

onMounted(() => {
  getObjectAttr()
  canvasEditor.on('selectCancel', selectCancel)
  canvasEditor.on('selectOne', getObjectAttr)
  canvasEditor.canvas.on('object:modified', getObjectAttr)
})

onBeforeUnmount(() => {
  canvasEditor.off('selectCancel', selectCancel)
  canvasEditor.off('selectOne', getObjectAttr)
  canvasEditor.canvas.off('object:modified', getObjectAttr)
})
</script>

<style scoped>
@import './attributePanel.css';

:deep(.ivu-color-picker) {
  display: block;
  width: 100%;
}
</style>
