

<template>
  <div v-if="isMultiple || isGroup" class="attr-item-box">
    <div class="bg-item">
      <!-- 组合按钮 多选时不可用 -->
      <Button v-if="isMultiple" long :disabled="!isMultiple" @click="group" type="text">
        <groupIcon width="14" height="14"></groupIcon>
        {{ $t('attrSeting.group') }}
      </Button>
      <!-- 拆分组合按钮，为单选且组元素时可用 -->
      <Button v-if="isGroup" long :disabled="!isGroup" @click="unGroup" type="text">
        <unGroupIcon width="14" height="14"></unGroupIcon>
        {{ $t('attrSeting.unGroup') }}
      </Button>
    </div>

    <!-- <Divider plain v-if="isGroup"></Divider> -->
  </div>
</template>

<script setup name="Group">
import useSelect from '@/components/editorPro/hooks/select';
import groupIcon from '@/assets/editorpro/icon/group/group.svg';
import unGroupIcon from '@/assets/editorpro/icon/group/unGroup.svg';

const { isGroup, isMultiple, canvasEditor } = useSelect();

// 拆分组
const unGroup = () => {
  canvasEditor.unGroup();
};
const group = () => {
  canvasEditor.group();
};
</script>
<style scoped  >
:deep(.ivu-btn[disabled]) svg {
  opacity: 0.2;
}
</style>
