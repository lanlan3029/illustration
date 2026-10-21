<template>
  <Modal
    :z-index="11000"
    v-model="visible"
    @on-ok="onOk"
    @on-cancel="onCancel"
    title="图片裁剪"
    width="80%"
    class-name="image-tool-modal"
  >
    <div class="main">
      <Spin size="large" fix :show="loading">图片加载中...</Spin>
      <div class="options">
        <label>裁剪比例</label>
        <div class="flex mt-2 ratio-item-wrapper">
          <button type="button" class="ratio-item" :class="{ active: !fixed }" :aria-pressed="!fixed" @click="changeRatio()">自由</button>
          <button type="button"
            class="ratio-item"
            :class="{ active: fixed && fixedRatio[0] === 1 && fixedRatio[1] === 1 }"
            :aria-pressed="fixed && fixedRatio[0] === 1 && fixedRatio[1] === 1"
            @click="changeRatio([1, 1])"
          >
            <span class="ratio-item-content" style="height: 70px; width: 70px">1:1</span>
          </button>
          <button type="button"
            class="ratio-item"
            :class="{ active: fixed && fixedRatio[0] === 2 && fixedRatio[1] === 3 }"
            :aria-pressed="fixed && fixedRatio[0] === 2 && fixedRatio[1] === 3"
            @click="changeRatio([2, 3])"
          >
            <span class="ratio-item-content" style="height: 70px; width: calc(70px * 2 / 3)">
              2:3
            </span>
          </button>
          <button type="button"
            class="ratio-item"
            :class="{ active: fixed && fixedRatio[0] === 3 && fixedRatio[1] === 2 }"
            :aria-pressed="fixed && fixedRatio[0] === 3 && fixedRatio[1] === 2"
            @click="changeRatio([3, 2])"
          >
            <span class="ratio-item-content" style="height: calc(70px * 2 / 3); width: 70px">
              3:2
            </span>
          </button>
          <button type="button"
            class="ratio-item"
            :class="{ active: fixed && fixedRatio[0] === 4 && fixedRatio[1] === 3 }"
            :aria-pressed="fixed && fixedRatio[0] === 4 && fixedRatio[1] === 3"
            @click="changeRatio([4, 3])"
          >
            <span class="ratio-item-content" style="height: calc(70px * 3 / 4); width: 70px">
              4:3
            </span>
          </button>
          <button type="button"
            class="ratio-item"
            :class="{ active: fixed && fixedRatio[0] === 3 && fixedRatio[1] === 4 }"
            :aria-pressed="fixed && fixedRatio[0] === 3 && fixedRatio[1] === 4"
            @click="changeRatio([3, 4])"
          >
            <span class="ratio-item-content" style="width: calc(70px * 3 / 4); height: 70px">
              3:4
            </span>
          </button>
          <button type="button"
            class="ratio-item"
            :class="{ active: fixed && fixedRatio[0] === 16 && fixedRatio[1] === 9 }"
            :aria-pressed="fixed && fixedRatio[0] === 16 && fixedRatio[1] === 9"
            @click="changeRatio([16, 9])"
          >
            <span class="ratio-item-content" style="height: calc(70px * 9 / 16); width: 70px">
              16:9
            </span>
          </button>
          <button type="button"
            class="ratio-item"
            :class="{ active: fixed && fixedRatio[0] === 9 && fixedRatio[1] === 16 }"
            :aria-pressed="fixed && fixedRatio[0] === 9 && fixedRatio[1] === 16"
            @click="changeRatio([9, 16])"
          >
            <span class="ratio-item-content" style="width: calc(70px * 9 / 16); height: 70px">
              9:16
            </span>
          </button>
        </div>
        <label>当前尺寸</label>
        <div class="flex mt-2">
          <Input
            v-model="cropperWidth"
            aria-label="裁剪宽度"
            type="number"
            @change="changeCropperSize('width', Number($event.target.value))"
          />
          <span class="mx-2">X</span>
          <Input
            v-model="cropperHeight"
            aria-label="裁剪高度"
            type="number"
            @change="changeCropperSize('height', Number($event.target.value))"
          />
        </div>
      </div>
      <div class="cropper-wrapper">
        <VueCropper
          ref="cropperRef"
          :img="img"
          :outputSize="1"
          outputType="png"
          autoCrop
          :fixed="fixed"
          :fixedNumber="fixedRatio"
          centerBox
          :fixedBox="false"
          full
          @realTime="onPreview"
        />
      </div>
      <div class="preview-wrapper">
        <div
          class="crop-preview"
          :style="previewStyle"
        >
          <div :style="previews.div" v-if="previews">
            <img :src="previews.url" :style="{ ...previews.img, maxWidth: previews.img.width }" />
          </div>
        </div>

        <div class="title">预览</div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';
// import { blobToFile } from '../../views/creation/createShortVideo/components/framesContent/utils'

const visible = ref(false);

const cropperRef = ref();

const img = ref();

const previewStyle = ref({
  width: '100px',
  height: '100px',
  overflow: 'hidden',
  margin: '0',
});

const loading = ref(false);

const previews = ref();

const cropperWidth = ref(0);
const cropperHeight = ref(0);

function changeCropperSize(type, value) {
  if (fixed.value) {
    if (type === 'width') {
      cropperHeight.value = (value * fixedRatio.value[1]) / fixedRatio.value[0];
    } else {
      cropperWidth.value = (value * fixedRatio.value[0]) / fixedRatio.value[1];
    }
  }
  nextTick(() => {
    cropperRef.value.goAutoCrop(Number(cropperWidth.value), Number(cropperHeight.value));
  });
}

function onPreview(_previews) {
  if (_previews.w === 0 && _previews.h === 0) {
    loading.value = true;
  } else {
    loading.value = false;
  }
  console.log('🚀 ~ onPreview ~ _previews:', _previews);
  cropperWidth.value = _previews.w;
  cropperHeight.value = _previews.h;
  previewStyle.value = {
    width: _previews.w + 'px',
    height: _previews.h + 'px',
    overflow: 'hidden',
    margin: '0',
    zoom: 100 / _previews.w,
  };

  previews.value = _previews;
}

function onCancel() {
  visible.value = false;
}
const fixedRatio = ref([1, 1]);
const fixed = ref(false);
function changeRatio(ratio) {
  if (ratio) {
    fixed.value = true;
    fixedRatio.value = ratio;
    // 宽度不变，按照比例修改高度
    // cropperHeight.value = (cropperWidth.value * ratio[1]) / ratio[0];
  } else {
    fixed.value = false;
  }
  nextTick(() => {
    cropperRef.value.goAutoCrop(9999, 9999);
  });
}

let _callback = null;
function onOk() {
  cropperRef.value.getCropData((data) => {
    _callback && _callback(data);
    visible.value = false;
  });
}

defineExpose({
  open(data, callback) {
    img.value = data.img;
    _callback = callback;
    visible.value = true;
  },
});
</script>

<style scoped>
.main { display: grid; grid-template-columns: 220px minmax(0, 1fr) 112px; align-items: start; gap: 20px; position: relative; padding-bottom: 20px; }
.options { min-width: 0; }
.options label { display: block; color: var(--ks-muted); font-size: 13px; font-weight: 600; }
.options .mt-2 { margin-top: 8px; }
.options .flex { display: flex; align-items: center; }
.options .mx-2 { margin: 0 8px; }
.cropper-wrapper { height: min(56dvh, 560px); min-height: 280px; overflow: hidden; border: 1px solid var(--ks-border); border-radius: var(--ks-radius-sm); }
.title { margin-top: 12px; color: var(--ks-muted); font-size: 13px; text-align: center; }
.ratio-item-wrapper { flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.ratio-item { display: flex; align-items: center; justify-content: center; width: 64px; height: 80px; padding: 8px; border: 1px solid var(--ks-border); border-radius: var(--ks-radius-sm); background: var(--ks-surface); color: var(--ks-ink); font-size: 13px; cursor: pointer; }
.ratio-item:hover { border-color: var(--ks-primary); }
.ratio-item.active { border: var(--ks-line); background: var(--ks-primary-soft); color: var(--ks-primary-hover); box-shadow: 2px 2px 0 var(--ks-primary-light-5); }
.ratio-item-content { display: flex; align-items: center; justify-content: center; max-width: 100%; border: 1px solid var(--ks-divider); border-radius: 4px; background: var(--ks-panel); }
.crop-preview { border: 1px solid var(--ks-border); background: var(--ks-panel); }
@media (max-width: 768px) {
  .main { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .cropper-wrapper { grid-row: 1; height: 36dvh; }
  .preview-wrapper { display: flex; align-items: center; gap: 16px; }
  .ratio-item-wrapper { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ratio-item { width: 100%; height: 80px; }
}
</style>
