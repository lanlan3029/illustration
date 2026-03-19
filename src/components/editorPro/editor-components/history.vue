

<template>
  <div style="display: inline-block">
    <!-- 后退 -->
    <Tooltip :content="$t('history.revocation') + `(${canUndo})`">
      <Button @click="undo" type="text" size="small" :disabled="!canUndo">
        <Icon type="ios-undo" size="20" />
      </Button>
    </Tooltip>

    <!-- 重做 -->
    <Tooltip :content="$t('history.redo') + `(${canRedo})`">
      <Button @click="redo" type="text" size="small" :disabled="!canRedo">
        <Icon type="ios-redo" size="20" />
      </Button>
    </Tooltip>
    <!-- <span class="time" v-if="history.length">
      {{ useDateFormat(history[0].timestamp, 'HH:mm:ss').value }}
    </span> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { defineOptions } from 'vue'; // <script setup> 里可直接用 defineOptions（如果已有全局宏可不导）

defineOptions({
  name: 'ToolBar',
});

import useSelect from '@/components/editorPro/hooks/select.js';

const { canvasEditor } = useSelect() || {};
const canUndo = ref(0);
const canRedo = ref(0);

const undo = () => {
  canvasEditor && canvasEditor.undo && canvasEditor.undo();
};

const redo = () => {
  canvasEditor && canvasEditor.redo && canvasEditor.redo();
};

onMounted(() => {
  if (!canvasEditor || !canvasEditor.on) return;
  canvasEditor.on('historyUpdate', (canUndoParam, canRedoParam) => {
    canUndo.value = canUndoParam;
    canRedo.value = canRedoParam;
  });
});
</script>

<style scoped>
span.active svg.icon {
  fill: #2d8cf0;
}

.time {
  color: #c1c1c1;
}
</style>

