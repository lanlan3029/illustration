

<template>
  <div v-if="isSelect" class="attr-item-box">
    <!-- <h3>{{ $t('attrSeting.centerAlign.name') }}</h3> -->
    <Divider plain orientation="left">
      <h4>{{ $t('attrSeting.centerAlign.name') }}</h4>
    </Divider>
    <div class="bg-item">
      <!-- 水平集中 -->
      <Tooltip :content="$t('attrSeting.centerAlign.centerX')">
        <Button long @click="position('centerH')" type="text">
          <img :src="centerX" width="14" height="14" />
        </Button>
      </Tooltip>
      <!-- 水平垂直居中 -->
      <Tooltip :content="$t('attrSeting.centerAlign.center')">
        <Button long @click="position('center')" type="text">
          <img :src="centerIcon" width="14" height="14" />
        </Button>
      </Tooltip>
      <!-- 垂直居中 -->
      <Tooltip :content="$t('attrSeting.centerAlign.centerY')">
        <Button long @click="position('centerV')" type="text">
          <img :src="centerY" width="14" height="14" />
        </Button>
      </Tooltip>
    </div>
    <!-- <Divider plain></Divider> -->
  </div>
</template>

<script setup name="CenterAlign">
import useSelect from '@/components/editorPro/hooks/select.js';
import centerIcon from '@/assets/editorpro/icon/align/centerX.svg';
import centerX from '@/assets/editorpro/icon/align/centerX.svg';
import centerY from '@/assets/editorpro/icon/align/centerY.svg';

const { isSelect, canvasEditor } = useSelect() || {};

const position = (name) => {
  canvasEditor.position(name);
};
</script>
<style scoped  >
:deep(.ivu-btn[disabled]) svg {
  opacity: 0.2;
}

svg {
  vertical-align: text-bottom;
}
</style>
