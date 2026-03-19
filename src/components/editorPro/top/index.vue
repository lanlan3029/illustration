<template>
  <Header>
    <!-- 与 .right 同一行：否则块级各占一行，在固定 45px 的 header 里 .right 会被裁掉 -->
    <div class="top-inner">
      <div class="left">
        <!-- 导入 -->
        <import-file></import-file>

        <Divider type="vertical" />

        <!-- 标尺开关 -->
        <span class="grid-label">{{ $t('grid') }}</span>
        <Tooltip :content="$t('grid')">
          <iSwitch v-model="toggleModel" size="small" class="switch"></iSwitch>
        </Tooltip>
        <Divider type="vertical" />
        <history></history>
      </div>

      <div class="right">
       
        <stash />
        <clearBtn />
         <!-- 预览 -->
        <previewCurrent />
        <waterMark />
       
        <styleTransferBtn />
        <save></save>
      </div>
    </div>
  </Header>
</template>

<script name="Top" setup>
import { computed } from 'vue';
// 导入元素
import importFile from '@/components/editorPro/editor-components/importFile.vue';

// 顶部组件
import previewCurrent from '@/components/editorPro/editor-components/previewCurrent.vue';
import save from '@/components/editorPro/editor-components/save.vue';
import waterMark from '@/components/editorPro/editor-components/waterMark.vue';
import history from '@/components/editorPro/editor-components/history.vue';
import stash from '@/components/editorPro/editor-components/stash.vue';
import styleTransferBtn from '@/components/editorPro/editor-components/styleTransferBtn.vue';
import clearBtn from '@/components/editorPro/editor-components/clear.vue';

const props = defineProps(['ruler']);
const emit = defineEmits(['update:ruler']);

const toggleModel = computed({
  get() {
    return props.ruler;
  },
  set(value) {
    emit('update:ruler', value);
  },
});
</script>

<style scoped>
.top-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 45px;
  gap: 8px;
  box-sizing: border-box;
}

.left {
  margin-left: 80px;
  flex: 1;
  min-width: 200px;
}

.right {
  flex-shrink: 0;
}

.left,
.right {
  display: flex;
  align-items: center;
}

.left img,
.right img {
  display: block;
  margin-right: 10px;
}

.grid-label {
  font-size: 12px;
  color: #333;
  margin-right: 6px;
  user-select: none;
}
</style>
