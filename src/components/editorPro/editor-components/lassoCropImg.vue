<template>
  <div v-if="isOne && type === 'image'" class="attr-item-box">
    <div class="bg-item">
      <Button @click="openLassoCrop" type="text" long>{{ $t('lassoCrop.title') }}</Button>
    </div>
  </div>
  <LassoCropDialog ref="lassoDialogRef" />
</template>

<script setup name="LassoCropImg">
import useSelect from '@/components/editorPro/hooks/select.js';
import { getCurrentInstance, onMounted, onBeforeUnmount, ref } from 'vue';
import LassoCropDialog from '@/components/editorPro/editor-components/LassoCropDialog.vue';

const update = getCurrentInstance();
const { canvasEditor, isOne } = useSelect() || {};
const type = ref('');
const lassoDialogRef = ref();

function openLassoCrop() {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (!activeObject || activeObject.type !== 'image') return;

  const src = activeObject._element?.src || activeObject.getSrc?.();
  if (!src) return;

  lassoDialogRef.value.open({ img: src }, (dataUrl) => {
    activeObject.setSrc(dataUrl, () => {
      canvasEditor.canvas.renderAll();
    });
  });
}

function init() {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (activeObject) {
    type.value = activeObject.type;
    update?.proxy?.$forceUpdate();
  }
}

onMounted(() => {
  canvasEditor.on('selectOne', init);
});

onBeforeUnmount(() => {
  canvasEditor.off('selectOne', init);
});
</script>

<style scoped>
.attr-item-box {
  margin-top: 8px;
}
</style>
