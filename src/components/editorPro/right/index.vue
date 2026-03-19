<script setup>
import { ref } from 'vue';
import align from '@/components/editorPro/editor-components/align.vue';
import centerAlign from '@/components/editorPro/editor-components/centerAlign.vue';
import flip from '@/components/editorPro/editor-components/flip.vue';

import clone from '@/components/editorPro/editor-components/clone.vue';
import hide from '@/components/editorPro/editor-components/hide.vue';
import group from '@/components/editorPro/editor-components/group.vue';
import lock from '@/components/editorPro/editor-components/lock.vue';
import dele from '@/components/editorPro/editor-components/del.vue';

import bgBar from '@/components/editorPro/editor-components/bgBar.vue';
import setSize from '@/components/editorPro/editor-components/setSize.vue';
import replaceImg from '@/components/editorPro/editor-components/replaceImg.vue';
import filters from '@/components/editorPro/editor-components/filters.vue';
import imgStroke from '@/components/editorPro/editor-components/imgStroke.vue';
import attributePostion from '@/components/editorPro/editor-components/attributePostion.vue';
import attributeShadow from '@/components/editorPro/editor-components/attributeShadow.vue';
import attributeBorder from '@/components/editorPro/editor-components/attributeBorder.vue';
import attributeRounded from '@/components/editorPro/editor-components/attributeRounded.vue';
import attributeFont from '@/components/editorPro/editor-components/attributeFont.vue';
import attributeTextFloat from '@/components/editorPro/editor-components/attributeTextFloat.vue';
import attributeTextContent from '@/components/editorPro/editor-components/attributeTextContent.vue';
import attributeColor from '@/components/editorPro/editor-components/attributeColor.vue';
import attributeBarcode from '@/components/editorPro/editor-components/attributeBarcode.vue';
import attributeQrCode from '@/components/editorPro/editor-components/attributeQrCode.vue';
import cropperImg from '@/components/editorPro/editor-components/cropperImg.vue';
import clipImage from '@/components/editorPro/editor-components/clipImage.vue';
import edit from '@/components/editorPro/editor-components/edit.vue';
import useSelect from '@/components/editorPro/hooks/select.js';

const { mixinState } = useSelect() || {};

const attrBarShow = ref(true);

// 属性面板开关
const switchAttrBar = () => {
  attrBarShow.value = !attrBarShow.value;
};
</script>

<template>
  <!-- 属性区域 380-->
  <div class="right-bar" v-show="attrBarShow">
    <div style="padding-top: 10px">
      <!-- 未选择元素时 展示背景设置 -->
      <div v-show="!mixinState.mSelectMode">
        <set-size></set-size>
        <bg-bar></bg-bar>
      </div>

      <!-- 多选时展示 -->
      <div v-show="mixinState.mSelectMode === 'multiple'">
        <!-- 分组 -->
        <group></group>
        <!-- <Divider plain></Divider> -->
        <!-- 组对齐方式 -->
        <align></align>
        <!-- 居中对齐 -->
        <center-align></center-align>
      </div>

      <div v-show="mixinState.mSelectMode === 'one'" class="attr-item-box">
        <!-- <h3>快捷操作</h3> -->
        <!-- 分组 -->
        <group></group>
        <!-- <Divider plain></Divider> -->
        <Divider plain orientation="left">
          <h4>快捷操作</h4>
        </Divider>
        <div class="bg-item" v-show="mixinState.mSelectMode">
          <lock></lock>
          <dele></dele>
          <clone></clone>
          <hide></hide>
          <edit></edit>
        </div>
        <!-- <Divider plain></Divider> -->
        <!-- 居中对齐 -->
        <center-align></center-align>
        <!-- 替换图片 -->
        <replaceImg></replaceImg>
        <!-- 裁剪 -->
        <cropperImg></cropperImg>
        <!-- 图片裁切 -->
        <clip-image></clip-image>
        <!-- 翻转 -->
        <flip></flip>
        <!-- 条形码属性 -->
        <attributeBarcode></attributeBarcode>
        <!-- 二维码 -->
        <attributeQrCode></attributeQrCode>
        <!-- 图片滤镜 -->
        <filters></filters>
        <!-- 图片描边 -->
        <imgStroke />
        <!-- 颜色 -->
        <attributeColor></attributeColor>
        <!-- 字体属性（是否显示由组件内部 useSelect 的 isOne/isMatchType 控制） -->
        <attributeFont></attributeFont>
        <!-- 字体小数点（是否显示由组件内部控制） -->
        <attributeTextFloat></attributeTextFloat>
        <!-- 文字内容（是否显示由组件内部控制） -->
        <attribute-text-content></attribute-text-content>
        <!-- 位置信息 -->
        <attributePostion></attributePostion>
        <!-- 阴影 -->
        <attributeShadow></attributeShadow>
        <!-- 边框 -->
        <attributeBorder></attributeBorder>
        <!-- 圆角 -->
        <attributeRounded></attributeRounded>
      </div>
    </div>
    <!-- <attribute v-if="state.show"></attribute> -->
  </div>
  <!-- 右侧关闭按钮 -->
  <div
    :class="`close-btn right-btn ${attrBarShow && 'right-btn-open'}`"
    @click="switchAttrBar"
  ></div>
</template>

<style scoped>
/* 右侧容器 */
.right-bar {
  width: 304px;
  height: 100%;
  padding: 10px;
  overflow-y: auto;
  background: #fff;
}

/* 属性面板样式，对所有带 .attr-item 的块生效 */
.attr-item {
  position: relative;
  margin-bottom: 12px;
  height: 40px;
  padding: 0 10px;
  background: #f6f7f9;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

/* attr-item 内部的 tooltip 居中并占满剩余空间 */
.attr-item .ivu-tooltip {
  text-align: center;
  flex: 1;
}

/* 关闭按钮基础样式 */
.close-btn {
  width: 20px;
  height: 64px;
  cursor: pointer;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAACACAMAAABOb9vcAAAAhFBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAADHx8cODg50dHTx8fF2dnZ1dXWWlpZHR0c4ODhQpkZ5AAAAIXRSTlMA9t+/upkRAnPq5NXDfDEsKQjMeGlRThkMsquljTwzIWhBHpjgAAABJElEQVRYw+3YyW7CQBCEYbxig8ELGJyQkJRJyPb+75dj3zy/lD7kMH3+ZEuzSFO1mlZwhjOE2uwhVHJYMygNVwilhz2EUvNaMigledUFoE1anKYAtA9nVRuANpviOQBt0t2ZQSnZ9QxK6Qih9LSGUHkJobYlhGp6CPW4hlAVhckLhMop1InCjEK1FBYU1hSqo/BI4YXCjMIthTWFijDCCB3g7fuO4O1t/rkvQXPz/LUIzX0oAM0tQHOfCkBzC9DcuwLQXACao9Dv1yb9lsek2xaaxMcMH1x6Ff79dY0wwgj/DGv3p2tG4cX9wd55h4rCO/hk3uEs9w6QlXPIbXrfIJ6XrmVBOtJCA1YkXqVLkh1aUgyNk1fV1BxLxzpsuNLKzrME/AWr0ywwvyj83AAAAABJRU5ErkJggg==);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 50%;
  position: absolute;
  right: -20px;
  z-index: 1;
  top: 50%;
  margin-top: -10px;
}

/* 右侧按钮基础状态（收起时） */
.close-btn.right-btn {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAACACAYAAAB5sSvuAAAAAXNSR0IArs4c6QAAAFBlWElmTU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAKKADAAQAAAABAAAAgAAAAAAobJzlAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoZXuEHAAADf0lEQVR4Ae2cvYsTQRjGE7FQkICFB1pZRyzEJkUKmzOpBEHwX9DCQkmChf4JahewsLpWFOQUzwMRPEgEy0PLpPADvEISDrVyfZ6cK0tIZrI7u7MPMi+8mb35uPnlmXczyeXmrURRdKyibAB8Dz8pywg42if4OUnIGd7Bww8Ut+GHpEATgPEll/y8DGRMtaB8hrryl30B2HzVW1Rcgx8vQ9UqaVac+Cf67cC34C+q1erHFcc5dUsDOD/RGBWv4M/hrwG8jzJ3cwFMwlDdd/BN+BZgd5ONLtd5Ac4zfEYFld0ALMMisxUFmAQa44dHdMB+TTasdM2bxJNxI7gDP7ISWNzJE1xymhF+uBzPbyvL2NZOA+oJIO/BrfP7iEGTSNtovIrY/L6sU9mA5PoAby6DtEq87JnlWF/H7+K+v/DmUQDkc23CNxbFpAogIa/Ab/IiaQoxmOThlnkG8TiKK5UUJNNR+MMYjqUaIJnWEYuXeEFTBCTXv1hUi0HCxXYWsbirqiAhb/BBWcE9KLimDEgB68pLTMAL6oBNdcBT6oBr6oAn1O9i2a2Od/DM1Jc4KBivVOYyLHFm6f4ODAoGBV0VcB0fYjAo6KqA6/gQg0FBVwVcx4cYDAq6KuA6/v+Mwel0Wmm325XhcOgqkH08/h6cyiaTSdRoNPhvBFGtVosGg0Gq8Wk7V9IO6Pf7MzgC+oBMDcgn1Ov1vEFmAvQJmRmQkN1ut3AlnQB9QDoDErLT6RSmZC6ARULmBlgUpPxWl5uCRcVhLoBFwTFsnAGLfi10AiwazklBX/txJgV9wWVSUP7tlvwbVspOyFarVfi7ac4Vvquzfyoy95DfiwOgeQHtrUFBu0bmHkFBsz721qCgXSNzj6CgWR97a1DQrpG5R1DQrI+9NSho18jcIyho1sfauqeuoDzgN3UFv6gD7qh/cK8rA84OGygv8VO+CCkrKH3g5Q1P41BB1SV+QDia4hJvQ72LB3h6gPIH/+5CvVGsntoSPwYQzxr/VgRkJoF1wP1KwvFa4SaRPgDNI+RLT2dTwTJfB+9j/jaWden5dgIe5oNnG2O+WwCb7bXWuflliSfLlAjCh4JULHMqjaIAc0tGkhdgnM6FyXI2EV+5pXNxAeTSMSHOSzg3+H2UuVsaQKq0A/eaUmiVb9yZlOk6vJSkTCZA2bRWsonBpFOrySan+wNoJmOM0LyBGwAAAABJRU5ErkJggg==);
  transform: rotateY(180deg);
  right: 0;
}

/* 右侧面板展开时（.right-btn-open） */
.close-btn.right-btn-open {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAACACAMAAABOb9vcAAAAhFBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAADHx8cODg50dHTx8fF2dnZ1dXWWlpZHR0c4ODhQpkZ5AAAAIXRSTlMA9t+/upkRAnPq5NXDfDEsKQjMeGlRThkMsquljTwzIWhBHpjgAAABJElEQVRYw+3YyW7CQBCEYbxig8ELGJyQkJRJyPb+75dj3zy/lD7kMH3+ZEuzSFO1mlZwhjOE2uwhVHJYMygNVwilhz2EUvNaMigledUFoE1anKYAtA9nVRuANpviOQBt0t2ZQSnZ9QxK6Qih9LSGUHkJobYlhGp6CPW4hlAVhckLhMop1InCjEK1FBYU1hSqo/BI4YXCjMIthTWFijDCCB3g7fuO4O1t/rkvQXPz/LUIzX0oAM0tQHOfCkBzC9DcuwLQXACao9Dv1yb9lsek2xaaxMcMH1x6Ff79dY0wwgj/DGv3p2tG4cX9wd55h4rCO/hk3uEs9w6QlXPIbXrfIJ6XrmVBOtJCA1YkXqVLkh1aUgyNk1fV1BxLxzpsuNLKzrME/AWr0ywwvyj83AAAAABJRU5ErkJggg==);
  right: 304px;
}
</style>
