<script setup>
import useSelect from '@/components/editorPro/hooks/select.js';
import { Message } from 'view-ui-plus';

const { isMatchType, canvasEditor } = useSelect(['polygon']) || {};

const onEditPolygon = () => {
  const obj = canvasEditor?.fabricCanvas?.getActiveObject();
  if (obj && obj.type === 'polygon') {
    canvasEditor.activeEdit && canvasEditor.activeEdit();
  } else {
    Message.warning('请检查选择polygon');
  }
};
</script>

<template>
  <Tooltip :content="$t('quick.editPoly')" v-if="isMatchType">
    <Button long @click="onEditPolygon" icon="md-brush" type="text"></Button>
  </Tooltip>
</template>

<style scoped></style>
