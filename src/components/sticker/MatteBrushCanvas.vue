<template>
  <div class="matte-brush-canvas">
    <div class="matte-stage" ref="stageRef">
      <div class="matte-frame checker-bg">
        <canvas
          ref="canvasRef"
          class="matte-canvas"
          @pointerdown.prevent="onPointerDown"
          @pointermove.prevent="onPointerMove"
          @pointerup.prevent="onPointerUp"
          @pointercancel.prevent="onPointerUp"
        />
      </div>
    </div>
    <div class="matte-tools">
      <div class="tool-row">
        <el-radio-group v-model="brush" size="small">
          <el-radio-button label="erase">{{ $t('stickerLab.brushErase') }}</el-radio-button>
          <el-radio-button label="restore">{{ $t('stickerLab.brushRestore') }}</el-radio-button>
        </el-radio-group>
        <el-radio-group v-model="brushSize" size="small" class="size-group">
          <el-radio-button :label="16">{{ $t('stickerLab.brushSmall') }}</el-radio-button>
          <el-radio-button :label="28">{{ $t('stickerLab.brushMedium') }}</el-radio-button>
          <el-radio-button :label="44">{{ $t('stickerLab.brushLarge') }}</el-radio-button>
        </el-radio-group>
      </div>
      <p class="matte-hint">{{ $t('stickerLab.matteHint') }}</p>
      <el-button type="primary" size="small" :disabled="!ready" @click="generate">
        {{ $t('stickerLab.generateSticker') }}
      </el-button>
    </div>
    <el-dialog v-model="previewOpen" :title="$t('stickerLab.previewTitle')" width="min(520px, 92vw)" align-center>
      <div class="preview-frame checker-bg">
        <img v-if="previewUrl" :src="previewUrl" alt="" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { loadImage, fitDisplaySize, canvasToDataUrl } from '@/utils/lassoCrop';
import { mattingWhiteBackground } from '@/utils/canvasMatting';
import { cleanAlphaDebris, finishWithStyle } from '@/utils/stickerLab/stickerStyles';

const props = defineProps({
  imageSrc: { type: String, default: '' },
  stickerStyle: { type: String, default: 'sticker' },
  borderColor: { type: String, default: '#ffffff' },
});

const emit = defineEmits(['cropped']);

const { t } = useI18n();

const stageRef = ref(null);
const canvasRef = ref(null);
const brush = ref('erase');
const brushSize = ref(28);
const ready = ref(false);
const previewUrl = ref('');
const previewOpen = ref(false);

let sourceImage = null;
let matteCanvas = null;
let painting = false;
let lastPaint = null;
let display = { w: 0, h: 0, scale: 1 };
let resizeObserver = null;

function getCtx() {
  return canvasRef.value?.getContext('2d');
}

function drawChecker(ctx, w, h) {
  const size = 12;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#eee' : '#fff';
      ctx.fillRect(x, y, size, size);
    }
  }
}

function redrawDisplay() {
  const canvas = canvasRef.value;
  const ctx = getCtx();
  if (!canvas || !ctx || !matteCanvas) return;
  ctx.clearRect(0, 0, display.w, display.h);
  drawChecker(ctx, display.w, display.h);
  ctx.drawImage(matteCanvas, 0, 0, display.w, display.h);
}

function layoutCanvas() {
  const stage = stageRef.value;
  const canvas = canvasRef.value;
  if (!stage || !canvas || !sourceImage) return;

  const nw = matteCanvas?.width || sourceImage.naturalWidth;
  const nh = matteCanvas?.height || sourceImage.naturalHeight;
  const maxW = Math.max(240, stage.clientWidth - 16);
  const maxH = Math.min(window.innerHeight * 0.55, 520);
  const fitted = fitDisplaySize(nw, nh, maxW, maxH);
  display = { w: fitted.width, h: fitted.height, scale: fitted.width / nw };

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(fitted.width * dpr);
  canvas.height = Math.round(fitted.height * dpr);
  canvas.style.width = `${fitted.width}px`;
  canvas.style.height = `${fitted.height}px`;
  const ctx = getCtx();
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redrawDisplay();
}

async function initMatte() {
  if (!props.imageSrc) return;
  ready.value = false;
  previewUrl.value = '';
  try {
    sourceImage = await loadImage(props.imageSrc);
    const result = mattingWhiteBackground(sourceImage, { sticker: false, floodFromEdges: true });
    matteCanvas = cleanAlphaDebris(result);
    ready.value = true;
    await nextTick();
    layoutCanvas();
  } catch (e) {
    console.error(e);
    ElMessage.error(t('stickerLab.matteFailed'));
  }
}

function canvasPoint(e) {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * display.w,
    y: ((e.clientY - rect.top) / rect.height) * display.h,
  };
}

function imagePoint(p) {
  const s = display.scale || 1;
  return { x: p.x / s, y: p.y / s };
}

function brushRadiusImage() {
  return Math.max(4, brushSize.value / (display.scale || 1));
}

function paintAt(imgX, imgY) {
  if (!matteCanvas || !sourceImage) return;
  const ctx = matteCanvas.getContext('2d');
  const r = brushRadiusImage();
  ctx.save();
  if (brush.value === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createRadialGradient(imgX, imgY, r * 0.15, imgX, imgY, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(imgX, imgY, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(imgX, imgY, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(sourceImage, 0, 0);
  }
  ctx.restore();
}

function paintStroke(from, to) {
  if (!from) {
    paintAt(to.x, to.y);
    return;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const step = Math.max(2, brushRadiusImage() * 0.35);
  const n = Math.max(1, Math.ceil(dist / step));
  for (let i = 0; i <= n; i += 1) {
    const tVal = i / n;
    paintAt(from.x + dx * tVal, from.y + dy * tVal);
  }
}

function onPointerDown(e) {
  if (!ready.value) return;
  canvasRef.value?.setPointerCapture?.(e.pointerId);
  painting = true;
  lastPaint = imagePoint(canvasPoint(e));
  paintAt(lastPaint.x, lastPaint.y);
  redrawDisplay();
}

function onPointerMove(e) {
  if (!painting) return;
  const ip = imagePoint(canvasPoint(e));
  paintStroke(lastPaint, ip);
  lastPaint = ip;
  redrawDisplay();
}

function onPointerUp() {
  if (!painting) return;
  painting = false;
  lastPaint = null;
  if (matteCanvas) matteCanvas = cleanAlphaDebris(matteCanvas);
  redrawDisplay();
}

function generate() {
  if (!matteCanvas) return;
  const styled = finishWithStyle(matteCanvas, props.stickerStyle, props.borderColor);
  const dataUrl = canvasToDataUrl(styled);
  previewUrl.value = dataUrl;
  previewOpen.value = true;
  emit('cropped', {
    dataUrl,
    width: styled.width,
    height: styled.height,
    style: props.stickerStyle,
    borderColor: props.borderColor,
    mode: 'matte',
    source: 'generate',
  });
}

watch(() => props.imageSrc, () => {
  initMatte();
}, { immediate: true });

onMounted(() => {
  if (stageRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => layoutCanvas());
    resizeObserver.observe(stageRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.matte-brush-canvas {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
  align-items: start;
}

.matte-stage {
  min-width: 0;
}

.matte-frame {
  border-radius: 12px;
  border: 1px solid #e8e8ec;
  padding: 12px;
  display: flex;
  justify-content: center;
  min-height: 280px;
}

.matte-canvas {
  touch-action: none;
  cursor: crosshair;
  border-radius: 8px;
}

.matte-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.size-group {
  flex-wrap: wrap;
}

.matte-hint {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.checker-bg {
  background:
    linear-gradient(45deg, #ececf0 25%, transparent 25%) 0 0 / 12px 12px,
    linear-gradient(-45deg, #ececf0 25%, transparent 25%) 0 0 / 12px 12px,
    linear-gradient(45deg, transparent 75%, #ececf0 75%) 0 0 / 12px 12px,
    linear-gradient(-45deg, transparent 75%, #ececf0 75%) 0 0 / 12px 12px,
    #fafbfc;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
}

.preview-frame {
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  min-height: 200px;
}

.preview-frame img {
  max-width: 100%;
  max-height: 50vh;
  object-fit: contain;
}

@media (max-width: 900px) {
  .matte-brush-canvas {
    grid-template-columns: 1fr;
  }
}
</style>
