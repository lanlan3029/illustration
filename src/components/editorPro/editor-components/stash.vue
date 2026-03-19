<template>
  <Button style="margin-left: 10px" type="text" @click="stash">
    {{ $t('toolbar.saveDraft') || '暂存' }}
  </Button>
</template>

<script setup name="stash-bar">
import { Message } from 'view-ui-plus';
import useSelect from '@/components/editorPro/hooks/select';

const { canvasEditor } = useSelect();

const DRAFT_KEY = 'editorpro_canvas_data';

const stash = async () => {
  try {
    const json = canvasEditor.getJson();
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        content: json,
      })
    );
    Message.success('已暂存');
  } catch (e) {
    Message.error('暂存失败');
  }
};
</script>

<style scoped></style>

