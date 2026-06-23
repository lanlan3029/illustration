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
          @pointerdown.prevent="onPointerDown"
          @pointermove.prevent="onPointerMove"
          @pointerup.prevent="onPointerUp"
          @pointercancel.prevent="onPointerUp"
        />
      </div>
    </div>
    <div class="lasso-side">
      <div class="lasso-export-mode">
        <span class="lasso-export-label">{{ $t('lassoCrop.exportMode') }}</span>
        <el-radio-group v-model="exportMode" size="small" class="lasso-export-radios">
          <el-radio-button label="sticker">{{ $t('lassoCrop.modeSticker') }}</el-radio-button>
          <el-radio-button label="plain">{{ $t('lassoCrop.modePlain') }}</el-radio-button>
        </el-radio-group>
      </div>
      <p class="lasso-hint">{{ hintText }}</p>
      <div v-if="previewUrl" class="lasso-preview">
        <img :src="previewUrl" alt="preview" />
        <p class="preview-label">{{ $t('lassoCrop.preview') }}</p>
      </div>
      <el-button v-if="canFinish" size="small" type="primary" @click="completeCrop">
        {{ $t('lassoCrop.completeCrop') }}
      </el-button>
      <el-button v-if="hasPath" size="small" @click="resetDraw">{{ $t('lassoCrop.redraw') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  MIN_LASSO_POINTS,
  loadImage,
  distance,
  fitDisplaySize,
  getImageLayout,
  layoutPointsToImagePoints,
  expandPolygonOutward,
  getLassoCropOutset,
  LASSO_OVERLAY_STROKE_WIDTH,
  cropImageByLasso,
  canvasToDataUrl,
  shouldClosePath,
  canCompletePath,
} from '@/utils/lassoCrop';

const props = defineProps({
  imageSrc: { type: String, default: '' },
  naturalWidth: { type: Number, default: 0 },
  naturalHeight: { type: Number, default: 0 },
});

const emit = defineEmits(['cropped', 'reset']);

const { t } = useI18n();

const rootRef = ref(null);
const stageRef = ref(null);
const imgRef = ref(null);
const drawRef = ref(null);

let resizeObserver = null;

const displaySize = ref({ width: 0, height: 0 });
const naturalSize = ref({ width: 0, height: 0 });
const points = ref([]);
const drawing = ref(false);
const closed = ref(false);
const previewUrl = ref('');
const exportMode = ref('sticker');

const hasPath = computed(() => points.value.length > 0);
const canFinish = computed(
  () => hasPath.value && !previewUrl.value && !drawing.value && canCompletePath(points.value, displaySize.value)
);

const hintText = computed(() => {
  if (previewUrl.value) return t('lassoCrop.hintDone');
  if (drawing.value) return t('lassoCrop.hintDrawing');
  return t('lassoCrop.hintStart');
});

function getCtx() {
  return drawRef.value?.getContext('2d');
}

function getMaxDisplayBounds() {
  const stage = stageRef.value;
  const padding = 24;
  const maxH = Math.min(window.innerHeight * 0.68, 680);
  if (!stage) {
    return {
      maxW: Math.max(240, window.innerWidth * 0.72 - 200),
      maxH,
    };
  }
  return {
    maxW: Math.max(240, stage.clientWidth - padding),
    maxH: Math.max(200, Math.min(maxH, stage.clientHeight - padding || maxH)),
  };
}

/** 按原图比例 fit，避免被弹窗宽度撑成画布比例 */
function applyImageFit() {
  const img = imgRef.value;
  if (!img) return null;

  const nw = img.naturalWidth || props.naturalWidth;
  const nh = img.naturalHeight || props.naturalHeight;
  if (!nw || !nh) return null;

  const { maxW, maxH } = getMaxDisplayBounds();
  const fitted = fitDisplaySize(nw, nh, maxW, maxH);
  img.style.width = `${fitted.width}px`;
  img.style.height = `${fitted.height}px`;
  img.style.maxWidth = 'none';
  img.style.maxHeight = 'none';
  return fitted;
}

function resizeCanvas({ scalePoints = true } = {}) {
  const img = imgRef.value;
  const canvas = drawRef.value;
  if (!img || !canvas) return;

  applyImageFit();

  const layout = getImageLayout(img);
  if (!layout) return;

  const prev = displaySize.value;
  const cssW = layout.displayWidth;
  const cssH = layout.displayHeight;

  if (
    scalePoints &&
    prev.width > 0 &&
    prev.height > 0 &&
    points.value.length > 0 &&
    (Math.abs(cssW - prev.width) > 0.5 || Math.abs(cssH - prev.height) > 0.5)
  ) {
    const sx = cssW / prev.width;
    const sy = cssH / prev.height;
    points.value = points.value.map((p) => ({ x: p.x * sx, y: p.y * sy }));
  }

  displaySize.value = { width: cssW, height: cssH };
  naturalSize.value = { width: layout.naturalWidth, height: layout.naturalHeight };

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  canvas.style.left = `${layout.offsetX}px`;
  canvas.style.top = `${layout.offsetY}px`;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  redrawOverlay();
}

function redrawOverlay() {
  const ctx = getCtx();
  const canvas = drawRef.value;
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, displaySize.value.width || canvas.width, displaySize.value.height || canvas.height);
  if (points.value.length < 2) return;

  ctx.save();
  const lineWidth = LASSO_OVERLAY_STROKE_WIDTH;
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
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.setLineDash(dash);
  ctx.lineDashOffset = dash[0];
  ctx.lineWidth = lineWidth;
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

function canvasPointFromClient(clientX, clientY) {
  const canvas = drawRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return { x: 0, y: 0 };
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function canvasPointFromEvent(e) {
  return canvasPointFromClient(e.clientX, e.clientY);
}

function pushPoint(p) {
  const w = displaySize.value.width;
  const h = displaySize.value.height;
  if (w > 0 && h > 0 && (p.x < 0 || p.y < 0 || p.x > w || p.y > h)) return;

  const last = points.value[points.value.length - 1];
  if (last && distance(last, p) < 2) return;
  points.value.push(p);
  redrawOverlay();
}

async function applyCrop() {
  if (points.value.length < MIN_LASSO_POINTS) return;
  try {
    resizeCanvas({ scalePoints: false });
    const layout = getImageLayout(imgRef.value);
    if (!layout) return;

    let img = imgRef.value;
    if (!img?.complete || !img.naturalWidth) {
      img = await loadImage(props.imageSrc);
    }

    const cropOutset = getLassoCropOutset(LASSO_OVERLAY_STROKE_WIDTH);
    const expandedPoints = expandPolygonOutward(points.value, cropOutset);
    const imagePoints = layoutPointsToImagePoints(expandedPoints, {
      displayWidth: displaySize.value.width,
      displayHeight: displaySize.value.height,
      naturalWidth: layout.naturalWidth,
      naturalHeight: layout.naturalHeight,
    });
    const canvas = cropImageByLasso(img, imagePoints, {
      sticker: exportMode.value === 'sticker',
    });
    const dataUrl = canvasToDataUrl(canvas);
    previewUrl.value = dataUrl;
    emit('cropped', { dataUrl, width: canvas.width, height: canvas.height, mode: exportMode.value });
  } catch (e) {
    console.error('[lasso] crop failed:', e);
    resetDraw();
  }
}

async function finishPath() {
  if (points.value.length < MIN_LASSO_POINTS) return;
  closed.value = true;
  drawing.value = false;
  redrawOverlay();
  await applyCrop();
}

function completeCrop() {
  if (!canCompletePath(points.value, displaySize.value)) return;
  finishPath();
}

function onPointerDown(e) {
  if (closed.value || previewUrl.value) return;
  drawRef.value?.setPointerCapture?.(e.pointerId);
  drawing.value = true;
  points.value = [canvasPointFromEvent(e)];
  redrawOverlay();
}

function onPointerMove(e) {
  if (!drawing.value || closed.value) return;
  pushPoint(canvasPointFromEvent(e));
}

function onPointerUp(e) {
  if (!drawing.value || closed.value) return;
  if (drawRef.value?.hasPointerCapture?.(e.pointerId)) {
    drawRef.value.releasePointerCapture(e.pointerId);
  }
  const p = canvasPointFromEvent(e);
  pushPoint(p);
  drawing.value = false;
  if (shouldClosePath(points.value, p, displaySize.value)) {
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
  if (ctx && canvas) {
    ctx.clearRect(0, 0, displaySize.value.width || canvas.width, displaySize.value.height || canvas.height);
  }
  emit('reset');
}

function observeImageResize() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  const img = imgRef.value;
  if (!img || typeof ResizeObserver === 'undefined') return;
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  resizeObserver.observe(img);
}

function onImageLoad() {
  nextTick(() => {
    resizeCanvas();
    observeImageResize();
  });
}

watch(
  () => props.imageSrc,
  () => {
    resetDraw();
    nextTick(() => {
      resizeCanvas();
      observeImageResize();
    });
  }
);

watch(exportMode, () => {
  if (closed.value && points.value.length >= MIN_LASSO_POINTS) {
    applyCrop();
  }
});

defineExpose({
  resetDraw,
  getResult: () => previewUrl.value,
  resize: () => resizeCanvas(),
});

onMounted(() => {
  window.addEventListener('resize', resizeCanvas);
  nextTick(() => {
    if (imgRef.value?.complete) {
      resizeCanvas();
      observeImageResize();
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped>
.lasso-crop-canvas {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.lasso-stage {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  max-height: 75vh;
  padding: 12px;
  background: #ececec;
  border-radius: 8px;
}

.lasso-image {
  display: block;
  user-select: none;
  pointer-events: none;
}

.lasso-frame {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  line-height: 0;
  background: repeating-conic-gradient(#e8e8e8 0% 25%, #f5f5f5 0% 50%) 50% / 20px 20px;
  border-radius: 4px;
  overflow: hidden;
}

.lasso-draw {
  position: absolute;
  left: 0;
  top: 0;
  cursor: crosshair;
  touch-action: none;
  pointer-events: auto;
}

.lasso-side {
  width: 168px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lasso-export-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lasso-export-label {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
}

.lasso-export-radios {
  display: flex;
  flex-wrap: wrap;
}

.lasso-export-radios :deep(.el-radio-button__inner) {
  padding: 6px 10px;
  font-size: 12px;
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
