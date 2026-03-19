

<template>
  <Tooltip :content="isLock ? $t('quick.unlock') : $t('quick.lock')" v-if="isOne">
    <Button long v-if="isLock" @click="doLock(false)" icon="md-lock" type="text"></Button>
    <Button long v-else @click="doLock(true)" icon="md-unlock" type="text"></Button>
  </Tooltip>
</template>

<script setup name="Lock">
import useSelect from '@/components/editorPro/hooks/select';
import { onBeforeUnmount, onMounted } from 'vue';
import { ref } from 'vue';
const { canvasEditor, isOne } = useSelect();
const isLock = ref(false);
const doLock = (isLock) => {
  isLock ? canvasEditor.lock() : canvasEditor.unLock();
};

const handleSelected = (items) => {
  isLock.value = items[0].lockMovementX;
};

onMounted(() => {
  canvasEditor.on('selectOne', handleSelected);
});

onBeforeUnmount(() => {
  canvasEditor.off('selectOne', handleSelected);
});
</script>

<style scoped  >
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
