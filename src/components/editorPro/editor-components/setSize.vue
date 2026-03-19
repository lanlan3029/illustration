

<template>
  <div v-if="!isSelect" class="attr-item-box">
    <!-- <h3>{{ $t('bgSeting.size') }}</h3> -->
    <Divider plain orientation="left">
      <h4>{{ $t('bgSeting.size') }}</h4>
    </Divider>
    <Form :label-width="40" inline class="form-wrap">
      <FormItem :label="$t('bgSeting.width')" prop="name">
        <InputNumber disabled v-model="width" readonly @on-change="setSize"></InputNumber>
      </FormItem>
      <FormItem :label="$t('bgSeting.height')" prop="name">
        <InputNumber disabled v-model="height" readonly @on-change="setSize"></InputNumber>
      </FormItem>
      <FormItem :label-width="0">
        <Button type="text" @click="showSetSize">
          <Icon type="md-create" />
        </Button>
      </FormItem>
    </Form>

    <!-- <Divider plain></Divider> -->
    <!-- 修改尺寸 -->
    <modalSzie :title="$t('setSizeTip')" ref="modalSizeRef" @set="handleConfirm"></modalSzie>
  </div>
</template>

<script setup name="CanvasSize">
import useSelect from '@/components/editorPro/hooks/select.js';
import modalSzie from '@/components/editorPro/editor-components/common/modalSzie.vue';
import { ref, onMounted } from 'vue';
const { isSelect, canvasEditor } = useSelect();

const modalSizeRef = ref(null);

const width = ref(0);
const height = ref(0);

onMounted(() => {
  if (!canvasEditor || !canvasEditor.getWorkspase) {
    // 如果编辑器未就绪，直接返回，避免报错；真正功能依赖于 Editorpro.vue 中的 canvasEditor 初始化
    return;
  }
  const size = canvasEditor.getWorkspase();
  const { width: w, height: h } = size || {};
  width.value = w || 0;
  height.value = h || 0;
  canvasEditor.on &&
    canvasEditor.on('sizeChange', (w, h) => {
      width.value = w;
      height.value = h;
    });
});

const setSize = () => {
  if (!canvasEditor || !canvasEditor.setSize) return;
  canvasEditor.setSize(width.value, height.value);
};

const showSetSize = () => {
  modalSizeRef.value.showSetSize(width.value, height.value);
};
const handleConfirm = (w, h) => {
  width.value = w;
  height.value = h;
  setSize();
};
</script>

<style scoped  >
:deep(.ivu-form-item) {
  margin-bottom: 0;
}

:deep(.ivu-input-number) {
  width: 70px;
}
.form-wrap {
  display: flex;
}
</style>
