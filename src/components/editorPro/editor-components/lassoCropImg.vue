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

  const el = activeObject._element;
  const src = activeObject.originSrc || activeObject.getSrc?.() || el?.src;
  if (!src) return;

  lassoDialogRef.value.open(
    {
      img: src,
      naturalWidth: activeObject.originWidth || el?.naturalWidth || 0,
      naturalHeight: activeObject.originHeight || el?.naturalHeight || 0,
    },
    (dataUrl) => {
      const width = activeObject.get('width');
      const height = activeObject.get('height');
      const scaleX = activeObject.get('scaleX');
      const scaleY = activeObject.get('scaleY');
      activeObject.setSrc(dataUrl, () => {
        activeObject.set('scaleX', (width * scaleX) / (activeObject.width || 1));
        activeObject.set('scaleY', (height * scaleY) / (activeObject.height || 1));
        canvasEditor.canvas.renderAll();
      });
    }
  );
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
