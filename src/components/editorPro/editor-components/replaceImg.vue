

<template>
  <div v-if="isOne && type === 'image'" class="attr-item-box">
    <div class="bg-item">
      <Button @click="repleace" type="text" long>{{ $t('repleaceImg') }}</Button>
    </div>
  </div>
</template>

<script setup name="ReplaceImg">
import useSelect from '@/components/editorPro/hooks/select.js';
import { getCurrentInstance, onMounted, onBeforeUnmount, ref } from 'vue';

const update = getCurrentInstance();
const { canvasEditor, isOne } = useSelect() || {};
const type = ref('');

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

// 替换图片
const repleace = async () => {
  const activeObject = canvasEditor?.canvas?.getActiveObjects()[0];
  if (activeObject && activeObject.type === 'image') {
    // 图片
    const [file] = await selectFiles({ accept: 'image/*', multiple: false });
    // 转字符串
    const fileStr = await getImgStr(file);
    // 字符串转El
    const imgEl = await insertImgFile(fileStr);
    const width = activeObject.get('width');
    const height = activeObject.get('height');
    const scaleX = activeObject.get('scaleX');
    const scaleY = activeObject.get('scaleY');
    activeObject.setSrc(imgEl.src, () => {
      activeObject.set('scaleX', (width * scaleX) / imgEl.width);
      activeObject.set('scaleY', (height * scaleY) / imgEl.height);
      activeObject.set('originSrc', imgEl.src);
      canvasEditor.canvas.renderAll();
    });
    imgEl.remove();
  }
};

const init = () => {
  const activeObject = canvasEditor?.canvas?.getActiveObjects()[0];
  if (activeObject) {
    type.value = activeObject.type;
    update?.proxy?.$forceUpdate();
  }
};

onMounted(() => {
  if (!canvasEditor || !canvasEditor.on) return;
  canvasEditor.on('selectOne', init);
});

onBeforeUnmount(() => {
  if (!canvasEditor || !canvasEditor.off) return;
  canvasEditor.off('selectOne', init);
});
</script>
<style   scoped>
.attr-item-box {
  margin-top: 8px;
}
</style>
