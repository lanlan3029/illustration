
<template>
  <div class="box attr-item-box attr-panel-section" v-if="isOne && isMatchType">
    <Divider plain orientation="left"><h4>圆角</h4></Divider>
    <Form :label-width="40" class="attr-form form-wrap">
      <FormItem :label="$t('attributes.rx_ry')">
        <div class="rounded-control">
          <Slider
            v-model="baseAttr.roundValue"
            :max="300"
            @on-input="(value) => changeCommon(value)"
          />
          <InputNumber
            v-model="baseAttr.roundValue"
            :min="0"
            :max="300"
            @on-change="(value) => changeCommon(value)"
          />
        </div>
      </FormItem>
    </Form>
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select';
import InputNumber from '@/components/editorPro/editor-components/inputNumber/inputNumber.vue';
import { getCurrentInstance, onMounted, onBeforeUnmount,reactive} from 'vue';
const update = getCurrentInstance();
const { canvasEditor, isOne, isMatchType } = useSelect(['rect']);

// 属性值
const baseAttr = reactive({
  roundValue: 0,
});

// 属性获取
const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject();
  // 不是当前obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  if (activeObject) {
    baseAttr.roundValue = activeObject.get('roundValue');
  }
};

// 通用属性改变
const changeCommon = (value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (activeObject) {
    activeObject.set('ry', value);
    activeObject.set('rx', value);
    activeObject.set('roundValue', value);
    canvasEditor.canvas.renderAll();
  }
};

const selectCancel = () => {
  update?.proxy?.$forceUpdate();
};

onMounted(() => {
  // 获取圆角数据
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
@import './attributePanel.css';

.rounded-control {
  display: grid;
  grid-template-columns: 1fr 72px;
  gap: 10px;
  align-items: center;
}

.rounded-control :deep(.ivu-input-number),
.rounded-control :deep(.custom-input-number) {
  width: 100%;
}
</style>
