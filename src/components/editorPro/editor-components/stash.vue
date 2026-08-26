<template>
  <Button style="margin-left: 10px" type="text" @click="stash">
    {{ $t('toolbar.saveDraft') || '暂存' }}
  </Button>
</template>

<script setup name="stash-bar">
import { Message } from 'view-ui-plus';
import useSelect from '@/components/editorPro/hooks/select';
import {
  buildEditorproDraftJson,
  canvasHasUserContent,
  clearEditorproDraft,
  saveEditorproDraft,
} from '@/utils/editorPro/localDraft';

const { canvasEditor } = useSelect();

const stash = async () => {
  try {
    const canvas = canvasEditor?.canvas;
    if (canvas && !canvasHasUserContent(canvas)) {
      await clearEditorproDraft();
      Message.success('已暂存');
      return;
    }
    const json = canvas
      ? await buildEditorproDraftJson(canvas, () => canvasEditor.getJson())
      : canvasEditor.getJson();
    await saveEditorproDraft(json);
    Message.success('已暂存');
  } catch (e) {
    Message.error('暂存失败');
  }
};
</script>

<style scoped></style>
