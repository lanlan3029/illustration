

<template>
  <div class="box">
    <Switch size="large" v-model="status" @on-change="switchMode">
      <template #open>
        <span>Drag</span>
      </template>
    </Switch>
  </div>
</template>

<script setup name="Drag">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import useSelect from '@/components/editorPro/hooks/select.js';

const status = ref(false);
const { canvasEditor } = useSelect() || {};

const switchMode = (val) => {
  if (!canvasEditor) return;
  if (val) {
    canvasEditor.startDring && canvasEditor.startDring();
  } else {
    canvasEditor.endDring && canvasEditor.endDring();
  }
};

onMounted(() => {
  if (!canvasEditor || !canvasEditor.on) return;
  canvasEditor.on('startDring', () => (status.value = true));
  canvasEditor.on('endDring', () => (status.value = false));
});

onBeforeUnmount(() => {
  if (!canvasEditor || !canvasEditor.off) return;
  canvasEditor.off('startDring');
  canvasEditor.off('endDring');
});
</script>
<style scoped  >
.box {
  position: fixed;
  right: 464px;
  bottom: 14px;
  z-index: 10;
}

/* 兜底样式：当全局 view-ui-plus 样式未生效时，保证组件可见 */
.box :deep(.ivu-switch) {
  min-width: 64px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 999px;
  background: #827f7f;
  position: relative;
  box-sizing: border-box;
}
.box :deep(.ivu-switch-inner) {
  font-size: 12px;
  line-height: 1;
  color: #333;
}

/* 兜底滑块（View UI Plus 正常情况下由 .ivu-switch:after 提供） */
.box :deep(.ivu-switch)::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  transition: left 0.2s ease, transform 0.2s ease;
}
.box :deep(.ivu-switch-checked) {
  background: #2d8cf0;
  border-color: #2d8cf0;
}
.box :deep(.ivu-switch-checked) :deep(.ivu-switch-inner) {
  color: #fff;
}
.box :deep(.ivu-switch-checked)::after {
  left: calc(100% - 24px);
}
</style>
