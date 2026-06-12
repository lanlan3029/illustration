<template>
  <div class="lasso-crop-canvas" ref="rootRef">
    <div class="lasso-stage" ref="stageRef">
      <div class="lasso-frame">
        <img
          ref="imgRef"
          class="lasso-image"
          :src="imageSrc"
          alt=""
          draggable="false"
          @load="onImageLoad"
        />
        <canvas
          ref="drawRef"
          class="lasso-draw"
        @mousedown="onPointerDown"
        @mousemove="onPointerMove"
        @mouseup="onPointerUp"
        @mouseleave="onPointerLeave"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
        />
      </div>
    </div>
    <div class="lasso-side">
      <p class="lasso-hint">{{ hintText }}</p>
      <div v-if="previewUrl" class="lasso-preview">
        <img :src="previewUrl" alt="preview" />
        <p class="preview-label">{{ $t('lassoCrop.preview') }}</p>
      </div>
      <el-button v-if="hasPath" size="small" @click="resetDraw">{{ $t('lassoCrop.redraw') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  CLOSE_DISTANCE,
  MIN_LASSO_POINTS,
  loadImage,
  distance,
  displayPointsToImagePoints,
  cropImageByLasso,
  canvasToDataUrl,
} from '@/utils/lassoCrop';

const props = defineProps({
  imageSrc: { type: String, default: '' },
});

const emit = defineEmits(['cropped', 'reset']);

const { t } = useI18n();

const rootRef = ref(null);
const stageRef = ref(null);
const imgRef = ref(null);
const drawRef = ref(null);

const displaySize = ref({ width: 0, height: 0 });
const naturalSize = ref({ width: 0, height: 0 });
const points = ref([]);
const drawing = ref(false);
const closed = ref(false);
const previewUrl = ref('');

const hasPath = computed(() => points.value.length > 0);

const hintText = computed(() => {
  if (previewUrl.value) return t('lassoCrop.hintDone');
  if (drawing.value) return t('lassoCrop.hintDrawing');
  return t('lassoCrop.hintStart');
});

function getCtx() {
  return drawRef.value?.getContext('2d');
}

function resizeCanvas() {
  const img = imgRef.value;
  const canvas = drawRef.value;
  if (!img || !canvas) return;

  const rect = img.getBoundingClientRect();
  displaySize.value = { width: rect.width, height: rect.height };
  naturalSize.value = { width: img.naturalWidth, height: img.naturalHeight };

  canvas.width = Math.max(1, Math.floor(rect.width));
  canvas.height = Math.max(1, Math.floor(rect.height));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  redrawOverlay();
}

function redrawOverlay() {
  const ctx = getCtx();
  const canvas = drawRef.value;
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (points.value.length < 2) return;

  ctx.save();
  const lineWidth = 4;
  const dash = [12, 10];
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.value.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  if (closed.value) ctx.closePath();

  // 黑白相间虚线：先白后黑，错开相位
  ctx.setLineDash(dash);
  ctx.lineWidth = lineWidth + 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.setLineDash(dash);
  ctx.lineDashOffset = dash[0];
  ctx.lineWidth = lineWidth + 2;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  if (points.value.length > 0) {
    const start = points.value[0];
    const r = 7;
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function canvasPointFromEvent(e) {
  const canvas = drawRef.value;
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function touchPointFromEvent(e) {
  const touch = e.touches[0] || e.changedTouches[0];
  const canvas = drawRef.value;
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

function pushPoint(p) {
  const last = points.value[points.value.length - 1];
  if (last && distance(last, p) < 2) return;
  points.value.push(p);
  redrawOverlay();
}

async function finishPath() {
  if (points.value.length < MIN_LASSO_POINTS) return;
  closed.value = true;
  drawing.value = false;
  redrawOverlay();

  try {
    const img = await loadImage(props.imageSrc);
    const imagePoints = displayPointsToImagePoints(
      points.value,
      displaySize.value,
      naturalSize.value.width,
      naturalSize.value.height
    );
    const canvas = cropImageByLasso(img, imagePoints);
    const dataUrl = canvasToDataUrl(canvas);
    previewUrl.value = dataUrl;
    emit('cropped', { dataUrl, width: canvas.width, height: canvas.height });
  } catch (e) {
    console.error('[lasso] crop failed:', e);
    resetDraw();
  }
}

function tryAutoClose(p) {
  if (points.value.length < MIN_LASSO_POINTS) return false;
  if (distance(p, points.value[0]) <= CLOSE_DISTANCE) {
    finishPath();
    return true;
  }
  return false;
}

function onPointerDown(e) {
  if (closed.value || previewUrl.value) return;
  drawing.value = true;
  points.value = [canvasPointFromEvent(e)];
  redrawOverlay();
}

function onPointerMove(e) {
  if (!drawing.value || closed.value) return;
  const p = canvasPointFromEvent(e);
  if (tryAutoClose(p)) return;
  pushPoint(p);
}

function onPointerUp(e) {
  if (!drawing.value || closed.value) return;
  const p = canvasPointFromEvent(e);
  if (!tryAutoClose(p) && points.value.length >= MIN_LASSO_POINTS) {
    finishPath();
  } else if (points.value.length < MIN_LASSO_POINTS) {
    drawing.value = false;
  }
}

function onPointerLeave() {
  if (drawing.value && !closed.value && points.value.length >= MIN_LASSO_POINTS) {
    finishPath();
  }
}

function onTouchStart(e) {
  if (closed.value || previewUrl.value) return;
  drawing.value = true;
  points.value = [touchPointFromEvent(e)];
  redrawOverlay();
}

function onTouchMove(e) {
  if (!drawing.value || closed.value) return;
  const p = touchPointFromEvent(e);
  if (tryAutoClose(p)) return;
  pushPoint(p);
}

function onTouchEnd(e) {
  if (!drawing.value || closed.value) return;
  const p = touchPointFromEvent(e);
  if (!tryAutoClose(p) && points.value.length >= MIN_LASSO_POINTS) {
    finishPath();
  }
}

function resetDraw() {
  points.value = [];
  drawing.value = false;
  closed.value = false;
  previewUrl.value = '';
  const ctx = getCtx();
  const canvas = drawRef.value;
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  emit('reset');
}

function onImageLoad() {
  nextTick(() => resizeCanvas());
}

watch(
  () => props.imageSrc,
  () => {
    resetDraw();
    nextTick(() => resizeCanvas());
  }
);

defineExpose({
  resetDraw,
  getResult: () => previewUrl.value,
  resize: () => resizeCanvas(),
});

onMounted(() => {
  window.addEventListener('resize', resizeCanvas);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<style scoped>
.lasso-crop-canvas {
  display: flex;
  gap: 16px;
  min-height: 420px;
}

.lasso-stage {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#e8e8e8 0% 25%, #f5f5f5 0% 50%) 50% / 20px 20px;
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;
  padding: 12px;
}

.lasso-image {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  user-select: none;
  pointer-events: none;
}

.lasso-frame {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
}

.lasso-draw {
  position: absolute;
  left: 0;
  top: 0;
  cursor: crosshair;
  touch-action: none;
}

.lasso-side {
  width: 140px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lasso-hint {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.lasso-preview {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 8px;
  background: repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 50% / 12px 12px;
}

.lasso-preview img {
  max-width: 100%;
  display: block;
}

.preview-label {
  margin: 8px 0 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}

@media (max-width: 768px) {
  .lasso-crop-canvas {
    flex-direction: column;
  }

  .lasso-side {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
}
</style>
