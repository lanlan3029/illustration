<template>
  <Button style="margin-left: 10px" type="text" @click="beforeClear">
    {{ $t('save.empty') }}
  </Button>
</template>

<script setup name="clear-bar">
import { Modal } from 'view-ui-plus';
import { useI18n } from 'vue-i18n';
import useSelect from '@/components/editorPro/hooks/select';

const { t } = useI18n();
const { canvasEditor } = useSelect();

const clear = () => {
  canvasEditor.clear();
  // 历史栈由 HistoryPlugin 维护
  if (typeof canvasEditor.clearAndSaveState === 'function') {
    canvasEditor.clearAndSaveState();
  }
};

const beforeClear = () => {
  Modal.confirm({
    title: t('tip'),
    content: `<p>${t('clearTip')}</p>`,
    okText: t('ok'),
    cancelText: t('cancel'),
    onOk: () => clear(),
  });
};
</script>

<style scoped></style>

