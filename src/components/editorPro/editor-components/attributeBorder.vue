
<template>
  <div class="box attr-item-box attr-panel-section" v-if="isOne && !isGroup">
    <Divider plain orientation="left"><h4>边框</h4></Divider>
    <Form :label-width="40" class="attr-form form-wrap">
      <FormItem :label="$t('color')">
        <ColorPicker
          v-model="baseAttr.stroke"
          @on-change="(value) => changeCommon('stroke', value)"
          alpha
        />
      </FormItem>
      <FormItem :label="$t('attributes.width')">
        <InputNumber
          v-model="baseAttr.strokeWidth"
          @on-change="(value) => changeCommon('strokeWidth', value)"
          :min="0"
        />
      </FormItem>
      <FormItem :label="$t('attributes.stroke')">
        <Select v-model="baseAttr.strokeDashArray" @on-change="borderSet">
          <Option
            v-for="item in strokeDashList"
            :value="item.label"
            :key="`stroke-${item.label}`"
          >
            {{ item.label }}
          </Option>
        </Select>
      </FormItem>
    </Form>
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select.js'
import InputNumber from '@/components/editorPro/editor-components/inputNumber/inputNumber.vue'
import { getCurrentInstance, onMounted, onBeforeUnmount, reactive } from 'vue'

const update = getCurrentInstance()
const { isOne, isGroup, canvasEditor } = useSelect()

const groupType = ['group']

const baseAttr = reactive({
  stroke: '#fff',
  strokeWidth: 0,
  strokeDashArray: [],
})

const strokeDashList = [
  {
    value: { strokeUniform: true, strokeDashArray: [], strokeLineCap: 'butt' },
    label: 'Stroke',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [1, 10], strokeLineCap: 'butt' },
    label: 'Dash-1',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [1, 10], strokeLineCap: 'round' },
    label: 'Dash-2',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [15, 15], strokeLineCap: 'square' },
    label: 'Dash-3',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [15, 15], strokeLineCap: 'round' },
    label: 'Dash-4',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [25, 25], strokeLineCap: 'square' },
    label: 'Dash-5',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [25, 25], strokeLineCap: 'round' },
    label: 'Dash-6',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [1, 8, 16, 8, 1, 20], strokeLineCap: 'square' },
    label: 'Dash-7',
  },
  {
    value: { strokeUniform: true, strokeDashArray: [1, 8, 16, 8, 1, 20], strokeLineCap: 'round' },
    label: 'Dash-8',
  },
]

const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject()
  if (e && e.target && e.target !== activeObject) return
  if (activeObject && !groupType.includes(activeObject.type)) {
    baseAttr.stroke = activeObject.get('stroke')
    baseAttr.strokeWidth = activeObject.get('strokeWidth')
    const strokeDashArray = JSON.stringify(activeObject.get('strokeDashArray') || [])
    const target = strokeDashList.find(
      (item) =>
        JSON.stringify(item.value.strokeDashArray) === strokeDashArray &&
        activeObject.get('strokeLineCap') === item.value.strokeLineCap
    )
    baseAttr.strokeDashArray = target ? target.label : 'Stroke'
  }
}

const changeCommon = (key, value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0]
  if (activeObject) {
    activeObject.set(key, value)
    activeObject.set('strokeUniform', true)
    canvasEditor.canvas.renderAll()
  }
}

const borderSet = (key) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0]
  if (activeObject) {
    const stroke = strokeDashList.find((item) => item.label === key)
    if (stroke) activeObject.set(stroke.value)
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

:deep(.ivu-select) {
  width: 100%;
}
</style>
