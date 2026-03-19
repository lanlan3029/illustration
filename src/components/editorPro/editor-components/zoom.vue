
<template>
  <div class="box">
    <ButtonGroup>
      <Button @click="big">
        <img :src="bigIcon" width="14" height="14" alt="" />
      </Button>
      <Button @click="small">
        <img :src="smallIcon" width="14" height="14" alt="" />
      </Button>
      <Button @click="rSet" icon="ios-expand"></Button>
      <Button @click="setViewport" icon="md-contract"></Button>
    </ButtonGroup>
  </div>
</template>

<script setup name="Zoom">
import useSelect from '@/components/editorPro/hooks/select';
import bigIcon from '@/components/editorPro/icon/zoom/big.svg';
import smallIcon from '@/components/editorPro/icon/zoom/small.svg';

const { canvasEditor } = useSelect();

const rSet = () => {
  canvasEditor.one();
};
const big = () => {
  canvasEditor.big();
};
const small = () => {
  canvasEditor.small();
};
const setViewport = () => {
  canvasEditor.auto();
};
</script>
<style scoped  >
.box {
  position: fixed;
  right: 310px;
  bottom: 10px;
  z-index: 10;
}

/* 原来的 :deep(.ivu-btn:hover) { svg { ... } } */
.box :deep(.ivu-btn:hover) svg {
  fill: #57a3f3;
}

/* 兜底样式：当全局 view-ui-plus 样式未生效时，保证按钮可见 */
.box :deep(.ivu-btn-group) {
  display: inline-flex;
  gap: 0;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.box :deep(.ivu-btn) {
  width: 34px;
  height: 34px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
}
.box :deep(.ivu-btn:hover) {
  background: #f6f7f9;
}
</style>
