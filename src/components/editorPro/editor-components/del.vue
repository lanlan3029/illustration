

<template>
  <Tooltip v-if="isSelect" :content="$t('quick.del')">
    <Button long @click="del" icon="ios-trash" type="text"></Button>
  </Tooltip>
</template>

<script setup name="Del">
import useSelect from '@/components/editorPro/hooks/select';
import { debounce } from 'lodash-es';

const { isSelect, canvasEditor } = useSelect();

const del = debounce(function () {
  canvasEditor.del();
}, 300);
</script>
