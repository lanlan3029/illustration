

<template>
  <div class="box attr-item-box" v-if="isOne && isMatchType && isBarcode">
    <!-- <h3>字体属性</h3> -->
    <Divider plain orientation="left"><h4>条形码属性</h4></Divider>
    <div>
      <div class="flex-view">
        <div class="flex-item">
          <span class="label">代码</span>
          <div class="content">
            <Input v-model="baseAttr.value" @on-change="changeCommon" />
          </div>
        </div>
      </div>

      <div class="flex-view" v-if="baseAttr.displayValue">
        <div class="flex-item">
          <span class="label">文字</span>
          <div class="content">
            <Input v-model="baseAttr.text" @on-change="changeCommon" />
          </div>
        </div>
      </div>

      <div class="flex-view">
        <div class="flex-item">
          <span class="label">显示</span>
          <div class="content">
            <Switch v-model="baseAttr.displayValue" @on-change="changeCommon" />
          </div>
        </div>
        <div class="flex-item" v-if="baseAttr.displayValue">
          <span class="label">垂直</span>
          <div class="content">
            <Select v-model="baseAttr.textPosition" @on-change="changeCommon">
              <Option value="bottom">bottom</Option>
              <Option value="top">top</Option>
            </Select>
          </div>
        </div>
      </div>

      <div class="flex-view" v-if="baseAttr.displayValue">
        <div class="flex-item">
          <RadioGroup
            class="button-group"
            v-model="baseAttr.textAlign"
            @on-change="changeCommon"
            type="button"
          >
            <Radio v-for="(item, i) in textAlignList" :label="item" :key="item">
              <span v-html="textAlignListSvg[i]"></span>
            </Radio>
          </RadioGroup>
        </div>
      </div>

      <div class="flex-view">
        <div class="flex-item">
          <span class="label">条码</span>
          <div class="content">
            <ColorPicker v-model="baseAttr.lineColor" @on-change="changeCommon" alpha />
          </div>
        </div>
        <div class="flex-item" v-if="baseAttr.displayValue">
          <div class="content">
            <InputNumber
              v-model="baseAttr.fontSize"
              @on-change="changeCommon"
              append="字号"
              :min="1"
            ></InputNumber>
          </div>
        </div>
      </div>
      <div class="flex-view">
        <div class="flex-item">
          <span class="label">背景</span>
          <div class="content">
            <ColorPicker v-model="baseAttr.background" @on-change="changeCommon" alpha />
          </div>
        </div>
        <div class="flex-item">
          <span class="label" style="margin-left: 10px">类型</span>
          <div class="content">
            <Select v-model="baseAttr.format" @on-change="changeCommon" style="width: 90px">
              <Option v-for="item in barcodeTypeList" :value="item" :key="item">
                {{ item }}
              </Option>
            </Select>
          </div>
        </div>
      </div>
    </div>
    <!-- <Divider plain></Divider> -->
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select.js';
import InputNumber from '@/components/editorPro/editor-components/inputNumber/inputNumber.vue';
import { toRaw } from 'vue';
import { getCurrentInstance, onMounted, onBeforeUnmount,ref,computed,reactive} from 'vue';
import left from '@/assets/editorpro/icon/barcode/left.svg';
import right from '@/assets/editorpro/icon/barcode/right.svg';
import center from '@/assets/editorpro/icon/barcode/center.svg';

const update = getCurrentInstance();
const { isOne, canvasEditor, isMatchType } = useSelect(['image']);

// 文字元素
const extensionType = ref('');

const isBarcode = computed(() => extensionType.value === 'barcode');

// 属性值
const baseAttr = reactive({
  value: '',
  format: '',
  text: '12121',
  textAlign: 'left',
  textPosition: 'bottom',
  fontSize: 12,
  background: '',
  lineColor: '',
  displayValue: false,
});

// 字体对齐方式
const textAlignList = ['left', 'center', 'right'];
// 对齐图标
const textAlignListSvg = [left, center, right];

// 属性获取
const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject();
  // 不是当前obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  extensionType.value = activeObject?.extensionType || '';
  if (activeObject && isMatchType && activeObject?.extensionType === 'barcode') {
    baseAttr.value = activeObject.get('extension').value;
    baseAttr.format = activeObject.get('extension').format;
    baseAttr.text = activeObject.get('extension').text;
    baseAttr.textAlign = activeObject.get('extension').textAlign;
    baseAttr.textPosition = activeObject.get('extension').textPosition;
    baseAttr.fontSize = activeObject.get('extension').fontSize;
    baseAttr.background = activeObject.get('extension').background;
    baseAttr.lineColor = activeObject.get('extension').lineColor;
    baseAttr.displayValue = activeObject.get('extension').displayValue;
  }
};

// 通用属性改变
const changeCommon = () => {
  canvasEditor.setBarcode(toRaw(baseAttr));
  canvasEditor.canvas.renderAll();
};

const selectCancel = () => {
  extensionType.value = '';
  update?.proxy?.$forceUpdate();
};

const barcodeTypeList = ref([]);
barcodeTypeList.value = canvasEditor.getBarcodeTypes();

onMounted(() => {
  getObjectAttr();
  canvasEditor.on('selectCancel', selectCancel);
  canvasEditor.on('selectOne', getObjectAttr);
  canvasEditor.canvas.on('object:modified', getObjectAttr);
});

onBeforeUnmount(() => {
  canvasEditor.off('selectCancel', selectCancel);
  canvasEditor.off('selectOne', getObjectAttr);
  canvasEditor.canvas.off('object:modified', getObjectAttr);
});
</script>

<style scoped>
::deep(.ivu-input-number) {
  display: block;
  width: 100%;
}

::deep(.ivu-color-picker) {
  display: block;
}

/* 原 .ivu-row {...} 嵌套展开 */
.ivu-row {
  margin-bottom: 8px;
}

.ivu-row .ivu-col {
  position: inherit;
}

.ivu-row .ivu-col__box {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border-radius: 4px;
  gap: 8px;
}

.ivu-row .label {
  padding-left: 8px;
}

.ivu-row .content {
  flex: 1;
}

.ivu-row .content :deep(.--input),
.ivu-row .content :deep(.ivu-select-selection) {
  background-color: transparent;
  border: none !important;
  box-shadow: none !important;
}

/* 原 .font-selector 嵌套展开 */
.font-selector :deep(.ivu-select-item) {
  padding: 1px 4px;
}

.font-selector .font-item {
  height: 40px;
  width: 330px;
  background-size: auto 40px;
  background-repeat: no-repeat;
}

/* flex 布局 */
.flex-view {
  width: 100%;
  margin-bottom: 5px;
  padding: 5px;
  display: inline-flex;
  justify-content: space-between;
  border-radius: 5px;
  background: #f6f7f9;
}

.flex-item {
  display: inline-flex;
  flex: 1;
}

.flex-item .label {
  width: 32px;
  height: 32px;
  line-height: 32px;
  display: inline-block;
  font-size: 14px;
  color: #333333;
}

.flex-item .content {
  flex: 1;
  align-content: center;
  width: 60px;
}

.flex-item .slider-box {
  width: calc(100% - 50px);
  margin-left: 10px;
}

.flex-item .left {
  flex: 1;
}

.flex-item .right {
  flex: 1;
  margin-left: 10px;
}

.flex-item .right :deep(.ivu-input-number) {
  display: block;
  width: 100%;
}

.flex-item :deep(.ivu-slider-wrap) {
  margin: 13px 0;
}

/* radio 按钮组 */
.flex-item :deep(.ivu-radio-group-button) {
  display: flex;
  flex: 1;
  width: 100%;
}

.flex-item :deep(.ivu-radio-group-button .ivu-radio-wrapper) {
  width: 48px;
  flex: 1;
  line-height: 40px;
  text-align: center;
}

.flex-item :deep(.ivu-radio-group-button .ivu-radio-wrapper svg) {
  vertical-align: baseline;
}

/* 按钮组 */
.flex-item :deep(.ivu-btn-group) {
  display: flex;
  flex: 1;
}

.flex-item :deep(.ivu-btn-group .ivu-btn) {
  flex: 1;
}

.flex-item :deep(.ivu-btn-group-large > .ivu-btn) {
  font-size: 24px;
  flex: 1;
}

/* 大号 radio 组字体 */
.flex-item :deep(.ivu-radio-group-button.ivu-radio-group-large .ivu-radio-wrapper) {
  font-size: 24px;
}
</style>
