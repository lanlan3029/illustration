
<template>
  <Button type="text" @click="preview">
    {{ $t('preview') }}
  </Button>
</template>

<script setup>
import { ImagePreview } from 'view-ui-plus';
import { inject } from 'vue';

const canvasEditor = inject('canvasEditor');

const preview = () => {
  if (!canvasEditor || !canvasEditor.preview) return;
  canvasEditor.preview().then((dataUrl) => {
    ImagePreview.show({
      previewList: [dataUrl],
    });
  });
};
</script>

<style scoped></style>
