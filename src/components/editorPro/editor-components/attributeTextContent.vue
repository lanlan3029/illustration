<script setup name="AttrBute">
import { getCurrentInstance, reactive, onMounted, onBeforeUnmount } from 'vue';
import useSelect from '@/components/editorPro/hooks/select.js';
import InputNumber from '@/components/editorPro/editor-components/inputNumber/inputNumber.vue';

const update = getCurrentInstance();
const { canvasEditor, isOne, isMatchType } = useSelect(['i-text']);

const baseAttr = reactive({
  text: '',
  strokeWidth: 1,
  stroke: '',
  showPathAttr: false,
});

const getObjectAttr = (e) => {
  const activeObject = canvasEditor?.canvas?.getActiveObject();
  // 不是当前 obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  if (activeObject) {
    baseAttr.text = activeObject.get('text');
    const path = activeObject.get('path');
    if (path) {
      baseAttr.strokeWidth = path.strokeWidth;
      baseAttr.stroke = path.stroke;
      baseAttr.showPathAttr = true;
    } else {
      baseAttr.showPathAttr = false;
    }
  }
};

const changeCommon = (key, value) => {
  const activeObject = canvasEditor?.canvas?.getActiveObjects()[0];
  if (!activeObject) return;
  baseAttr[key] = value;
  if (key === 'text') {
    activeObject.set(key, value);
  } else {
    const path = activeObject.get('path');
    if (path) {
      path.set(key, value);
    }
  }
  canvasEditor.canvas.requestRenderAll();
};

const selectCancel = () => {
  update?.proxy?.$forceUpdate();
};

onMounted(() => {
  getObjectAttr();
  if (!canvasEditor) return;
  canvasEditor.on('selectCancel', selectCancel);
  canvasEditor.on('selectOne', getObjectAttr);
  canvasEditor.canvas.on('object:modified', getObjectAttr);
});

onBeforeUnmount(() => {
  if (!canvasEditor) return;
  canvasEditor.off('selectCancel', selectCancel);
  canvasEditor.off('selectOne', getObjectAttr);
  canvasEditor.canvas.off('object:modified', getObjectAttr);
});
</script>

<template>
  <div class="box attr-item-box" v-if="isOne && isMatchType">
    <!-- <h3>数据</h3> -->
    <Divider plain orientation="left"><h4>文本内容</h4></Divider>

    <Form :label-width="40" class="form-wrap">
      <FormItem :label="$t('attributes.id')">
        <Input
          v-model="baseAttr.text"
          @on-change="changeCommon('text', baseAttr.text)"
          size="small"
        ></Input>
      </FormItem>
    </Form>

    <template v-if="baseAttr.showPathAttr">
      <!-- <h3>数据</h3> -->
      <Divider plain orientation="left"><h4>文本路径</h4></Divider>
      <div>
        <Row :gutter="12">
          <Col flex="1">
            <div class="ivu-col__box">
              <span class="label">{{ $t('color') }}</span>
              <div class="content">
                <ColorPicker
                  v-model="baseAttr.stroke"
                  @on-change="(value) => changeCommon('stroke', value)"
                  alpha
                />
              </div>
            </div>
          </Col>
          <Col flex="1">
            <InputNumber
              v-model="baseAttr.strokeWidth"
              @on-change="(value) => changeCommon('strokeWidth', value)"
              :append="$t('width')"
              :min="0"
            ></InputNumber>
          </Col>
        </Row>
      </div>
    </template>

    <!-- <Divider plain></Divider> -->
  </div>
</template>

<style scoped>
.color-bar {
  /* width: 30px; */
  height: 30px;
  cursor: pointer;
  border: 2px solid #f6f7f9;
}

::deep(.ivu-input-number) {
  display: block;
  width: 100%;
}

::deep(.ivu-color-picker) {
  display: block;
}

/* 行布局 */
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
</style>
