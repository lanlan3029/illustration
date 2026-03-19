

<template>
  <div v-if="isOne && isMatchType" class="attr-item-box">
    <div class="flex-view">
      <div class="flex-item">
        <span class="label">{{ $t('textFloat') }}</span>
        <div class="content">
          <Select
            v-model="baseAttr.verticalAlign"
            @on-change="(value) => changeCommon('verticalAlign', value)"
          >
            <Option value="null">无</Option>
            <Option value="bottom">下标</Option>
            <Option value="top">上标</Option>
          </Select>
        </div>
      </div>
    </div>
  </div>
</template>

<script name="Price" setup>
import useSelect from '@/components/editorPro/hooks/select';
import { getCurrentInstance, onMounted, onBeforeUnmount,reactive} from 'vue';
const baseAttr = reactive({
  verticalAlign: 'null',
});

const matchType = ['i-text', 'textbox', 'text'];
const { isMatchType, canvasEditor, isOne } = useSelect(matchType);

const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject();
  // 不是当前obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  if (activeObject && isMatchType.value && activeObject?.text?.includes('.')) {
    baseAttr.verticalAlign = activeObject.get('verticalAlign');
  }
};

const changeCommon = (key, value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (activeObject && activeObject.text.includes('.')) {
    const [init] = activeObject.text.split('.');
    const startIndex = init.length + 1;
    const endIndex = activeObject.text.length;
    activeObject.styles = [];
    // 上标
    if (value === 'top') {
      activeObject.setSuperscript(startIndex, endIndex);
    } else if (value === 'bottom') {
      // 下标
      activeObject.setSelectionStyles(
        {
          fontSize: activeObject.superscript.size * activeObject.fontSize,
        },
        startIndex,
        endIndex
      );
    }
    activeObject.set(key, value);
    canvasEditor.canvas.renderAll();
  }
};

const update = getCurrentInstance();
const selectCancel = () => {
  update?.proxy?.$forceUpdate();
};

onMounted(() => {
  // 获取字体数据
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

<style scoped  >
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
  /* color: #333333; */
}

.flex-item .content {
  flex: 1;
  /* width: 60px; */
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
  /* width: 48px; */
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
</style>
