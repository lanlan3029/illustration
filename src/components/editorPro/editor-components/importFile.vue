

<template>
  <div style="display: inline-block">
    <a href="javascript:void(0)" @click="insertImg">
      {{ $t('insertFile.insert_picture') }}
    </a>
  </div>
</template>

<script name="ImportFile" setup>
import useSelect from '@/components/editorPro/hooks/select.js';

const { canvasEditor } = useSelect() || {};

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
const insertImg = () => {
  if (!canvasEditor) return;
  selectFiles({ accept: 'image/*', multiple: true }).then((fileList) => {
    Array.from(fileList).forEach((item) => {
      getImgStr(item).then((file) => {
        insertImgFile(file);
      });
    });
  });
};
// 插入图片文件
function insertImgFile(file) {
  if (!file) throw new Error('file is undefined');
  const imgEl = document.createElement('img');
  imgEl.src = file;
  // 插入页面
  document.body.appendChild(imgEl);
  imgEl.onload = async () => {
    const imgItem = await canvasEditor.createImgByElement(imgEl);
    canvasEditor.addBaseType(imgItem, {
      scale: true,
    });
    imgEl.remove();
  };
}
</script>

<style scoped  >
:deep(.ivu-select-dropdown) {
  z-index: 999;
}
</style>
