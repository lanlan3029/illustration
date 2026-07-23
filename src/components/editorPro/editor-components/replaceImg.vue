
<template>
  <div v-if="isOne && type === 'image'" class="attr-item-box">
    <div class="bg-item">
      <Button @click="repleace" type="text" long>{{ $t('repleaceImg') }}</Button>
    </div>
    <p v-if="isPhotoSlot" class="replace-slot-hint">{{ $t('editorProLeft.photoSlotDragHint') }}</p>
  </div>
</template>

<script setup name="ReplaceImg">
import useSelect from '@/components/editorPro/hooks/select.js';
import { getCurrentInstance, onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from 'view-ui-plus';
import {
  fillPhotoSlotObject,
  isPhotoSlotObject,
  preparePhotoSlotForFill,
} from '@/utils/editorPro/pageTemplate';
import { syncActivePhotoSlotFromCanvas } from '@/utils/editorPro/photoSlotContext';

const { t } = useI18n();
const update = getCurrentInstance();
const { canvasEditor, isOne } = useSelect() || {};
const type = ref('');
const activeObject = ref(null);

const isPhotoSlot = computed(() => isPhotoSlotObject(activeObject.value));

function selectFiles({ accept, multiple = false } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    if (accept) input.accept = accept;
    input.onchange = () => resolve(Array.from(input.files || []));
    input.click();
  });
}

function getImgStr(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function insertImgFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = file;
  });
}

const repleace = async () => {
  const target = canvasEditor?.canvas?.getActiveObjects()[0];
  if (!target || target.type !== 'image') return;

  const [file] = await selectFiles({ accept: 'image/*', multiple: false });
  if (!file) return;

  try {
    const fileStr = await getImgStr(file);

    if (isPhotoSlotObject(target)) {
      preparePhotoSlotForFill(target);
      await fillPhotoSlotObject(target, fileStr, canvasEditor.canvas);
      syncActivePhotoSlotFromCanvas(canvasEditor.canvas);
      Message.success(t('editorProLeft.photoSlotFilled'));
      return;
    }

    const imgEl = await insertImgFile(fileStr);
    const width = target.get('width');
    const height = target.get('height');
    const scaleX = target.get('scaleX');
    const scaleY = target.get('scaleY');
    target.setSrc(imgEl.src, () => {
      target.set('scaleX', (width * scaleX) / imgEl.width);
      target.set('scaleY', (height * scaleY) / imgEl.height);
      target.set('originSrc', imgEl.src);
      canvasEditor.canvas.renderAll();
    });
    imgEl.remove();
  } catch {
    Message.error(t('editorProLeft.photoSlotFillFailed'));
  }
};

const init = () => {
  activeObject.value = canvasEditor?.canvas?.getActiveObjects()[0] || null;
  if (activeObject.value) {
    type.value = activeObject.value.type;
    update?.proxy?.$forceUpdate();
  }
};

onMounted(() => {
  if (!canvasEditor || !canvasEditor.on) return;
  canvasEditor.on('selectOne', init);
  canvasEditor.on('selectCancel', init);
});

onBeforeUnmount(() => {
  if (!canvasEditor || !canvasEditor.off) return;
  canvasEditor.off('selectOne', init);
  canvasEditor.off('selectCancel', init);
});
</script>
<style scoped>
.attr-item-box {
  margin-top: 8px;
}

.replace-slot-hint {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.4;
  color: #8167a9;
}
</style>
