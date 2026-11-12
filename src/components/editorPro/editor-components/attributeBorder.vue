
<template>
  <div class="box attr-item-box attr-panel-section" v-if="isOne && !isGroup">
    <Divider plain orientation="left"><h4>边框</h4></Divider>
    <Form :label-width="40" class="attr-form form-wrap">
      <FormItem :label="$t('color')">
        <Tooltip placement="top" theme="light" class="border-color-tooltip">
          <button type="button" class="border-color-button" aria-label="选择边框颜色">
            <span class="border-color-swatch" :style="{ background: baseAttr.stroke }"></span>
            <span>选择颜色</span>
          </button>
          <template #content>
            <color-picker
              v-model:value="baseAttr.stroke"
              :modes="['色卡', '渐变', '纯色']"
              :swatches="pictureBookSwatches"
              @change="changeStrokePaint"
              @native-pick="pickNativeStroke"
            />
          </template>
        </Tooltip>
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
import colorPicker from './color-picker'
import { pictureBookSwatches, paintToCss, gradientFromPicker } from './color-picker/paint'
import { debounce } from 'lodash-es'
import { getCurrentInstance, onMounted, onBeforeUnmount, reactive } from 'vue'

const update = getCurrentInstance()
const { fabric, isOne, isGroup, canvasEditor } = useSelect()

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
    baseAttr.stroke = paintToCss(activeObject.get('stroke'), activeObject)
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

const ARROW_TYPES = ['arrow', 'thinTailArrow']

const savePaint = debounce((object) => {
  canvasEditor.canvas.fire('object:modified', { target: object })
}, 300)

const changeStrokePaint = (value) => {
  const object = canvasEditor.canvas.getActiveObject()
  if (!object) return
  const paint = value.mode === '渐变'
    ? gradientFromPicker(fabric, value, object)
    : String(value.color).replace('NaN', '')
  object.set({ stroke: paint, strokeUniform: true })
  if (!object.strokeWidth) {
    object.set('strokeWidth', 2)
    baseAttr.strokeWidth = 2
  }
  if (ARROW_TYPES.includes(object.type)) object.set('fill', paint)
  canvasEditor.canvas.requestRenderAll()
  savePaint(object)
}

const pickNativeStroke = (color) => {
  if (!baseAttr.stroke.startsWith('linear-gradient')) {
    changeStrokePaint({ mode: '纯色', color })
  }
}

const changeCommon = (key, value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0]
  if (activeObject) {
    activeObject.set(key, value)
    activeObject.set('strokeUniform', true)
    if (key === 'stroke' && ARROW_TYPES.includes(activeObject.type)) {
      activeObject.set('fill', value)
    }
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
  savePaint.flush()
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
.border-color-tooltip, :deep(.border-color-tooltip .ivu-tooltip-rel) { display: block; width: 100%; }
.border-color-button {
  display: flex; align-items: center; gap: 8px; width: 100%; min-height: 32px;
  padding: 3px 8px; border: 1px solid #dce1e8; border-radius: 5px;
  background: #fff; color: #384252; cursor: pointer; text-align: left;
}
.border-color-button:hover { border-color: #8bbbf1; }
.border-color-button:focus-visible { outline: 2px solid #2d8cf0; outline-offset: 2px; }
.border-color-swatch { width: 22px; height: 22px; flex: none; border: 1px solid #dce1e8; border-radius: 3px; }
</style>
