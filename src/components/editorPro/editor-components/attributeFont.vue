

<template>
  <div class="box attr-item-box" v-if="isOne && isMatchType">
    <!-- <h3>字体属性</h3> -->
    <Divider plain orientation="left"><h4>字体属性</h4></Divider>
    <div>
      <!-- <Divider plain orientation="left">{{ $t('attributes.font') }}</Divider> -->
      <div class="flex-view">
        <div class="flex-item">
          <div class="left font-selector">
            <Select v-model="baseAttr.fontFamily" @on-change="changeFontFamily">
              <Option
                v-for="item in fontsList"
                :value="item.name"
                :label="item.name"
                :key="`font-${item.name}`"
              >
                <div
                  class="font-item"
                  :style="item.img ? `background-image:url('${item.img}');` : ''"
                >
                  <span class="font-name">{{ item.name }}</span>
                </div>
              </Option>
            </Select>
          </div>
          <div class="right">
            <InputNumber
              v-model="baseAttr.fontSize"
              @on-change="(value) => changeCommon('fontSize', value)"
              append="字号"
              :min="1"
            ></InputNumber>
          </div>
        </div>
      </div>

      <div class="flex-view">
        <div class="flex-item">
          <RadioGroup
            class="button-group"
            v-model="baseAttr.textAlign"
            @on-change="(value) => changeCommon('textAlign', value)"
            type="button"
          >
            <Radio v-for="item in textAlignList" :label="item" :key="item">
              <span class="svg-icon-18" v-html="getTextAlignSvg(item)"></span>
            </Radio>
          </RadioGroup>
        </div>
      </div>

      <div class="flex-view">
        <div class="flex-item">
          <ButtonGroup class="button-group">
            <Button @click="changeFontWeight('fontWeight', baseAttr.fontWeight)">
              <span
                class="svg-icon"
                v-html="svgFontWeight(baseAttr.fontWeight === 'bold' ? ICON_ACTIVE : ICON_INACTIVE)"
              ></span>
            </Button>
            <Button @click="changeFontStyle('fontStyle', baseAttr.fontStyle)">
              <span
                class="svg-icon"
                v-html="svgFontStyle(baseAttr.fontStyle === 'italic' ? ICON_ACTIVE : ICON_INACTIVE)"
              ></span>
            </Button>
            <Button @click="changeLineThrough('linethrough', baseAttr.linethrough)">
              <span
                class="svg-icon"
                v-html="svgLinethrough(baseAttr.linethrough ? ICON_ACTIVE : ICON_INACTIVE)"
              ></span>
            </Button>
            <Button @click="changeUnderline('underline', baseAttr.underline)">
              <span
                class="svg-icon"
                v-html="svgUnderline(baseAttr.underline ? ICON_ACTIVE : ICON_INACTIVE)"
              ></span>
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <Row :gutter="12">
        <Col flex="1">
          <InputNumber
            v-model="baseAttr.lineHeight"
            @on-change="(value) => changeCommon('lineHeight', value)"
            :step="0.1"
            :append="$t('attributes.line_height')"
          ></InputNumber>
        </Col>
        <Col flex="1">
          <InputNumber
            v-model="baseAttr.charSpacing"
            @on-change="(value) => changeCommon('charSpacing', value)"
            :append="$t('attributes.char_spacing')"
          ></InputNumber>
        </Col>
      </Row>

      <div class="flex-view">
        <div class="flex-item">
          <span class="label">{{ $t('background') }}</span>
          <div class="content">
            <ColorPicker
              v-model="baseAttr.textBackgroundColor"
              @on-change="(value) => changeCommon('textBackgroundColor', value)"
              alpha
            />
          </div>
        </div>
      </div>
    </div>
    <!-- <Divider plain></Divider> -->
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select.js';
import { Spin } from 'view-ui-plus';
import InputNumber from '@/components/editorPro/editor-components/inputNumber/inputNumber.vue';
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue';

// 文字元素
const textType = ['i-text', 'textbox', 'text'];
const { canvasEditor, isMatchType, isOne } = useSelect(textType);

// 属性值
const baseAttr = reactive({
  fontSize: 0,
  fontFamily: '',
  lineHeight: 0,
  charSpacing: 0,
  fontWeight: '',
  textBackgroundColor: '#fff',
  textAlign: '',
  fontStyle: '',
  underline: false,
  linethrough: false,
  overline: false,
});

const fontsList = ref([]);
let isDisposed = false;

// 字体对齐方式
const textAlignList = ['left', 'center', 'right', 'justify'];

const ICON_ACTIVE = '#305ef4';
const ICON_INACTIVE = '#666';

const svgTextAlignLeft = (fill) =>
  `<svg viewBox="0 0 1024 1024" width="18" height="18" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M198.4 198.4h341.333333c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533334 19.2v57.6c0 8.533333-2.133333 14.933333-8.533334 19.2-6.4 6.4-12.8 8.533333-19.2 8.533334h-341.333333c-8.533333 0-14.933333-2.133333-19.2-8.533334-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 12.8-8.533333 19.2-8.533333z m0 170.666667h569.6c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533333h-569.6c-8.533333 0-14.933333-2.133333-19.2-8.533333-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 12.8-8.533333 19.2-8.533333z m0 170.666666h454.4c8.533333 0 14.933333 2.133333 19.2 8.533334 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533333h-454.4c-8.533333 0-14.933333-2.133333-19.2-8.533333-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 12.8-8.533333 19.2-8.533334z m0 170.666667h625.066667c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533334h-625.066667c-8.533333 0-14.933333-2.133333-19.2-8.533334-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 12.8-8.533333 19.2-8.533333z"/></svg>`;
const svgTextAlignCenter = (fill) =>
  `<svg viewBox="0 0 1024 1024" width="18" height="18" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M313.6 198.4h398.933333c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533334 19.2v57.6c0 8.533333-2.133333 14.933333-8.533334 19.2-6.4 6.4-12.8 8.533333-19.2 8.533334h-398.933333c-8.533333 0-14.933333-2.133333-19.2-8.533334-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 10.666667-8.533333 19.2-8.533333z m-115.2 170.666667h625.066667c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533333h-625.066667c-8.533333 0-14.933333-2.133333-19.2-8.533333-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 12.8-8.533333 19.2-8.533333z m115.2 170.666666h398.933333c8.533333 0 14.933333 2.133333 19.2 8.533334 6.4 6.4 8.533333 12.8 8.533334 19.2v57.6c0 8.533333-2.133333 14.933333-8.533334 19.2-6.4 6.4-12.8 8.533333-19.2 8.533333h-398.933333c-8.533333 0-14.933333-2.133333-19.2-8.533333-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 10.666667-8.533333 19.2-8.533334z m-115.2 170.666667h625.066667c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533334h-625.066667c-8.533333 0-14.933333-2.133333-19.2-8.533334-6.4-6.4-8.533333-12.8-8.533333-19.2v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 4.266667-4.266667 12.8-8.533333 19.2-8.533333z"/></svg>`;
const svgTextAlignRight = (fill) =>
  `<svg viewBox="0 0 1024 1024" width="18" height="18" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M454.4 283.733333v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 6.4-6.4 12.8-8.533333 19.2-8.533333h341.333334c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533334h-341.333334c-8.533333 0-14.933333-2.133333-19.2-8.533334-4.266667-4.266667-8.533333-10.666667-8.533333-19.2z m-226.133333 170.666667v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 6.4-6.4 12.8-8.533333 19.2-8.533333h569.6c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533333H256c-8.533333 0-14.933333-2.133333-19.2-8.533333-6.4-4.266667-8.533333-10.666667-8.533333-19.2z m113.066666 170.666667v-57.6c0-8.533333 2.133333-14.933333 8.533334-19.2 6.4-6.4 12.8-8.533333 19.2-8.533334h454.4c8.533333 0 14.933333 2.133333 19.2 8.533334 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533333h-454.4c-8.533333 0-14.933333-2.133333-19.2-8.533333-6.4-4.266667-8.533333-10.666667-8.533334-19.2z m-170.666666 170.666666v-57.6c0-8.533333 2.133333-14.933333 8.533333-19.2 6.4-6.4 12.8-8.533333 19.2-8.533333h625.066667c8.533333 0 14.933333 2.133333 19.2 8.533333 6.4 6.4 8.533333 12.8 8.533333 19.2v57.6c0 8.533333-2.133333 14.933333-8.533333 19.2-6.4 6.4-12.8 8.533333-19.2 8.533334h-625.066667c-8.533333 0-14.933333-2.133333-19.2-8.533334-6.4-4.266667-8.533333-10.666667-8.533333-19.2z"/></svg>`;
const svgTextAlignJustify = (fill) =>
  `<svg viewBox="0 0 18 18" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M3.48 3.48L14.48 3.48C14.63 3.48 14.75 3.52 14.82 3.63C14.93 3.75 14.97 3.86 14.97 3.97L14.97 4.98C14.97 5.13 14.93 5.25 14.82 5.32C14.71 5.43 14.6 5.47 14.48 5.47L3.48 5.47C3.33 5.47 3.22 5.43 3.15 5.32C3.03 5.21 3 5.1 3 4.98L3 3.97C3 3.82 3.03 3.71 3.15 3.63C3.22 3.56 3.37 3.48 3.48 3.48ZM3.48 6.48L14.5 6.48C14.65 6.48 14.76 6.52 14.83 6.63C14.95 6.75 14.98 6.86 14.98 6.97L14.98 7.98C14.98 8.13 14.95 8.25 14.83 8.32C14.72 8.43 14.61 8.47 14.5 8.47L3.48 8.47C3.33 8.47 3.22 8.43 3.15 8.32C3.03 8.21 3 8.1 3 7.98L3 6.97C3 6.82 3.03 6.71 3.15 6.63C3.22 6.56 3.37 6.48 3.48 6.48ZM3.48 9.48L14.47 9.48C14.62 9.48 14.73 9.52 14.81 9.63C14.92 9.75 14.96 9.86 14.96 9.97L14.96 10.98C14.96 11.13 14.92 11.25 14.81 11.32C14.7 11.43 14.58 11.47 14.47 11.47L3.48 11.47C3.33 11.47 3.22 11.43 3.15 11.32C3.03 11.21 3 11.1 3 10.98L3 9.97C3 9.82 3.03 9.71 3.15 9.63C3.22 9.56 3.37 9.48 3.48 9.48ZM3.48 12.48L14.47 12.48C14.62 12.48 14.73 12.52 14.81 12.63C14.92 12.75 14.96 12.86 14.96 12.97L14.96 13.98C14.96 14.13 14.92 14.25 14.81 14.32C14.7 14.43 14.58 14.47 14.47 14.47L3.48 14.47C3.33 14.47 3.22 14.43 3.15 14.32C3.03 14.21 3 14.1 3 13.98L3 12.97C3 12.82 3.03 12.71 3.15 12.63C3.22 12.56 3.37 12.48 3.48 12.48Z" fill="${fill}" fill-rule="nonzero"/></svg>`;

function getTextAlignSvg(type) {
  const fill = baseAttr.textAlign === type ? ICON_ACTIVE : ICON_INACTIVE;
  if (type === 'left') return svgTextAlignLeft(fill);
  if (type === 'center') return svgTextAlignCenter(fill);
  if (type === 'right') return svgTextAlignRight(fill);
  return svgTextAlignJustify(fill);
}

const svgFontWeight = (fill) =>
  `<svg viewBox="0 0 1024 1024" width="14" height="14" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M793.99865 476a244 244 0 0 0 54-130.42C862.75865 192.98 743.01865 64 593.85865 64H195.01865a32 32 0 0 0-32 32v96a32 32 0 0 0 32 32h63.74v576H195.01865a32 32 0 0 0-32 32v96a32 32 0 0 0 32 32h418.64c141.6 0 268.28-103.5 282-244.8 9.48-96.9-32.78-184.12-101.66-239.2zM418.33865 224h175.52a96 96 0 0 1 0 192h-175.52z m175.52 576h-175.52V576h175.52a112 112 0 0 1 0 224z"/></svg>`;
const svgFontStyle = (fill) =>
  `<svg viewBox="0 0 1024 1024" width="14" height="14" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M832 96v64a32 32 0 0 1-32 32h-125.52l-160 640H608a32 32 0 0 1 32 32v64a32 32 0 0 1-32 32H224a32 32 0 0 1-32-32v-64a32 32 0 0 1 32-32h125.52l160-640H416a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32h384a32 32 0 0 1 32 32z"/></svg>`;
const svgLinethrough = (fill) =>
  `<svg viewBox="0 0 1024 1024" width="14" height="14" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M893.088 501.792H125.344a32 32 0 0 0 0 64h767.744a32 32 0 0 0 0-64zM448 448h112V208h288V96H160v112h288zM448 640h112v288H448z"/></svg>`;
const svgUnderline = (fill) =>
  `<svg viewBox="0 0 1024 1024" width="14" height="14" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M703.232 67.008h127.488v413.248c0 158.016-142.656 286.016-318.72 286.016-176 0-318.72-128-318.72-286.016V67.008h127.488v413.248c0 39.872 18.176 78.144 51.136 107.776 36.8 32.96 86.528 51.072 140.096 51.072s103.36-18.112 140.032-51.136c33.024-29.632 51.2-67.968 51.2-107.776V67.008zM193.28 871.616h637.44v85.376H193.28v-85.376z"/></svg>`;

// 属性获取
const getObjectAttr = (e) => {
  if (!canvasEditor || !canvasEditor.canvas) return;
  const activeObject = canvasEditor.canvas.getActiveObject();
  // 不是当前obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  if (activeObject && isMatchType.value) {
    baseAttr.fontSize = activeObject.get('fontSize');
    baseAttr.fontFamily = activeObject.get('fontFamily');
    baseAttr.lineHeight = activeObject.get('lineHeight');
    baseAttr.textAlign = activeObject.get('textAlign');
    baseAttr.underline = activeObject.get('underline');
    baseAttr.linethrough = activeObject.get('linethrough');
    baseAttr.charSpacing = activeObject.get('charSpacing');
    baseAttr.overline = activeObject.get('overline');
    baseAttr.fontStyle = activeObject.get('fontStyle');
    baseAttr.textBackgroundColor = activeObject.get('textBackgroundColor');
    baseAttr.fontWeight = activeObject.get('fontWeight');
  }
};

// 通用属性改变
const changeCommon = (key, value) => {
  if (!canvasEditor || !canvasEditor.canvas) return;
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (activeObject) {
    activeObject && activeObject.set(key, value);
    canvasEditor.canvas.renderAll();
  }
};

const changeFontFamily = async (fontName) => {
  if (!fontName) return;
  Spin.show();
  canvasEditor.loadFont(fontName).finally(() => Spin.hide());
};
const changeFontWeight = (key, value) => {
  const nValue = value === 'normal' ? 'bold' : 'normal';
  baseAttr.fontWeight = nValue;
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  activeObject && activeObject.set(key, nValue);
  canvasEditor.canvas.renderAll();
};

// 斜体
const changeFontStyle = (key, value) => {
  const nValue = value === 'normal' ? 'italic' : 'normal';
  baseAttr.fontStyle = nValue;
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  activeObject && activeObject.set(key, nValue);
  canvasEditor.canvas.renderAll();
};

// 中划
const changeLineThrough = (key, value) => {
  const nValue = value === false;
  baseAttr.linethrough = nValue;
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  activeObject && activeObject.set(key, nValue);
  canvasEditor.canvas.renderAll();
};

// 下划
const changeUnderline = (key, value) => {
  const nValue = value === false;
  baseAttr.underline = nValue;
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  activeObject && activeObject.set(key, nValue);
  canvasEditor.canvas.renderAll();
};

onMounted(() => {
  if (!canvasEditor) return;

  // 字体列表（异步回填需避免组件卸载后写入）
  if (typeof canvasEditor.getFontList === 'function') {
    canvasEditor.getFontList().then((list) => {
      if (isDisposed) return;
      fontsList.value = list || [];
    });
  }

  // 获取当前选中对象属性
  getObjectAttr();

  // 监听选择/修改事件
  canvasEditor.on && canvasEditor.on('selectOne', getObjectAttr);
  canvasEditor.canvas && canvasEditor.canvas.on('object:modified', getObjectAttr);
});

onBeforeUnmount(() => {
  isDisposed = true;
  if (!canvasEditor) return;
  canvasEditor.off && canvasEditor.off('selectOne', getObjectAttr);
  canvasEditor.canvas && canvasEditor.canvas.off('object:modified', getObjectAttr);
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

/* 行内通用布局 */
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

/* 字体下拉列表 */
.font-selector :deep(.ivu-select-item) {
  padding: 1px 4px;
}

.font-selector .font-item {
  height: 40px;
  width: 280px;
  background-size: auto 28px;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  padding-left: 6px;
}

.font-selector .font-name {
  font-size: 13px;
  color: #111;
}

/* 通用 flex 卡片 */
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

/* Radio 按钮组 */
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

/* 大号 Radio 字体 */
.flex-item :deep(.ivu-radio-group-button.ivu-radio-group-large .ivu-radio-wrapper) {
  font-size: 24px;
}

/* 内联 svg icon */
.svg-icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  align-items: center;
  justify-content: center;
}
.svg-icon :deep(svg) {
  display: block;
}

.svg-icon-18 {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
}
.svg-icon-18 :deep(svg) {
  display: block;
}

</style>
