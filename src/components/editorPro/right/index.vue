<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
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
import lassoCropImg from '@/components/editorPro/editor-components/lassoCropImg.vue';
import clipImage from '@/components/editorPro/editor-components/clipImage.vue';
import edit from '@/components/editorPro/editor-components/edit.vue';
import EditorSheet from '@/components/editorPro/mobile/EditorSheet.vue';
import useSelect from '@/components/editorPro/hooks/select.js';
import { useEditorMobile } from '@/composables/useEditorMobile';
import { useEditorMobilePanel } from '@/composables/editorMobilePanel';

const { t } = useI18n();
const { mixinState } = useSelect() || {};
const { isMobileEditor } = useEditorMobile();
const { isRightOpen, openRight, close } = useEditorMobilePanel();

const attrBarShow = ref(true);
const sheetTitle = computed(() => t('creation.attributes'));

const switchAttrBar = () => {
  if (isMobileEditor.value) {
    openRight();
    return;
  }
  attrBarShow.value = !attrBarShow.value;
};

watch(isMobileEditor, (mobile) => {
  if (mobile) {
    attrBarShow.value = false;
    close();
  } else {
    attrBarShow.value = true;
  }
});

if (isMobileEditor.value) {
  attrBarShow.value = false;
}
</script>

<template>
  <div class="attr-panels">
    <!-- 桌面属性栏 -->
    <div v-if="!isMobileEditor" class="right-bar" v-show="attrBarShow">
      <div style="padding-top: 10px">
        <div v-show="!mixinState.mSelectMode">
          <set-size></set-size>
          <bg-bar></bg-bar>
        </div>

        <div v-show="mixinState.mSelectMode === 'multiple'">
          <group></group>
          <align></align>
          <center-align></center-align>
        </div>

        <div v-show="mixinState.mSelectMode === 'one'" class="attr-item-box">
          <group></group>
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
          <center-align></center-align>
          <replaceImg></replaceImg>
          <cropperImg></cropperImg>
          <lasso-crop-img></lasso-crop-img>
          <clip-image></clip-image>
          <flip></flip>
          <attributeBarcode></attributeBarcode>
          <attributeQrCode></attributeQrCode>
          <filters></filters>
          <imgStroke />
          <attributeColor></attributeColor>
          <attributeFont></attributeFont>
          <attributeTextFloat></attributeTextFloat>
          <attribute-text-content></attribute-text-content>
          <attributePostion></attributePostion>
          <attributeShadow></attributeShadow>
          <attributeBorder></attributeBorder>
          <attributeRounded></attributeRounded>
        </div>
      </div>
    </div>
    <div
      v-if="!isMobileEditor"
      :class="`close-btn right-btn ${attrBarShow && 'right-btn-open'}`"
      @click="switchAttrBar"
    ></div>

    <!-- 手机属性抽屉 -->
    <EditorSheet
      v-else
      :model-value="isRightOpen"
      :title="sheetTitle"
      @update:model-value="(v) => !v && close()"
      @close="close"
    >
      <div class="right-bar right-bar--sheet">
        <div v-show="!mixinState.mSelectMode">
          <set-size></set-size>
          <bg-bar></bg-bar>
        </div>
        <div v-show="mixinState.mSelectMode === 'multiple'">
          <group></group>
          <align></align>
          <center-align></center-align>
        </div>
        <div v-show="mixinState.mSelectMode === 'one'" class="attr-item-box">
          <group></group>
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
          <center-align></center-align>
          <replaceImg></replaceImg>
          <cropperImg></cropperImg>
          <lasso-crop-img></lasso-crop-img>
          <clip-image></clip-image>
          <flip></flip>
          <attributeBarcode></attributeBarcode>
          <attributeQrCode></attributeQrCode>
          <filters></filters>
          <imgStroke />
          <attributeColor></attributeColor>
          <attributeFont></attributeFont>
          <attributeTextFloat></attributeTextFloat>
          <attribute-text-content></attribute-text-content>
          <attributePostion></attributePostion>
          <attributeShadow></attributeShadow>
          <attributeBorder></attributeBorder>
          <attributeRounded></attributeRounded>
        </div>
      </div>
    </EditorSheet>
  </div>
</template>

<style scoped>
.attr-panels {
  display: contents;
}

/* 右侧容器 */
.right-bar {
  width: 304px;
  height: 100%;
  padding: 10px;
  overflow-y: auto;
  background: #fff;
}

.right-bar--sheet {
  width: 100%;
  height: auto;
  max-height: none;
  padding: 0;
  overflow: visible;
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
