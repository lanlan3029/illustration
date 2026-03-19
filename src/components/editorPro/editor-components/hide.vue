

<template>
  <Tooltip :content="$t('quick.hide')" v-if="isOne">
    <Button long v-if="isHide" @click="doHide(false)" icon="md-eye-off" type="text"></Button>
    <Button long v-else @click="doHide(true)" icon="md-eye" type="text"></Button>
  </Tooltip>
</template>

<script setup name="Hide">
import useSelect from '@/components/editorPro/hooks/select';
import {onMounted, onBeforeUnmount,ref} from 'vue';

const { isOne, canvasEditor } = useSelect();
const isHide = ref(false);

const doHide = (hide) => {
  // 修改visible属性
  const activeObject = canvasEditor.canvas.getActiveObject();
  activeObject.set('visible', !hide);
  canvasEditor.canvas.requestRenderAll();
  isHide.value = hide;
};

const handleSelected = () => {
  const activeObject = canvasEditor.canvas.getActiveObject();
  isHide.value = !activeObject.visible;
};

onMounted(() => {
  canvasEditor.on('selectOne', handleSelected);
});

onBeforeUnmount(() => {
  canvasEditor.off('selectOne', handleSelected);
});
</script>
