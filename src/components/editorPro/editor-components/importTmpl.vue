
<template>
  <div class="tmpl-root">
    <Divider plain orientation="left">{{ $t('editorProLeft.canvasSizes') }}</Divider>

    <div class="grid">
      <div
        v-for="item in templateOptions"
        :key="item.key"
        class="card"
        :class="{ 'card--picture-book': item.badge === 'picture-book' }"
        @click="applyTemplate(item)"
      >
        <span v-if="item.badge === 'picture-book'" class="card-badge">
          {{ $t('editorProLeft.canvasBadgePictureBook') }}
        </span>
        <div class="title">{{ item.label }}</div>
        <div class="meta">
          <template v-if="item.metaText">{{ item.metaText }}</template>
          <template v-else>
            {{ item.displayWidth ?? item.width }} × {{ item.displayHeight ?? item.height }}{{
              item.displayUnit || item.unit ? ` ${item.displayUnit ?? item.unit}` : ''
            }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ImportTmpl">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useSelect from '@/components/editorPro/hooks/select.js';
import {
  BOOK_EXPORT_DPI,
  BOOK_EXPORT_FORMATS,
  getFormatPixelSize,
} from '@/data/bookExportFormats.js';

const { t } = useI18n();
const { canvasEditor } = useSelect() || {};

const FIXED_HEIGHT = 1080;

const systemSizes = ref([]);

function roundInt(n) {
  return Math.max(1, Math.round(n));
}

function byRatio(label, w, h) {
  const width = roundInt((FIXED_HEIGHT * w) / h);
  return {
    key: `ratio-${w}-${h}`,
    label,
    width,
    height: FIXED_HEIGHT,
  };
}

function byA4(label, isLandscape) {
  // A4: 210mm × 297mm
  const wMm = isLandscape ? 297 : 210;
  const hMm = isLandscape ? 210 : 297;
  const width = roundInt((FIXED_HEIGHT * wMm) / hMm);
  return {
    key: isLandscape ? 'a4-landscape' : 'a4-portrait',
    label,
    width,
    height: FIXED_HEIGHT,
  };
}

function byFixedHeightTemplate({ key, label, ratioW, ratioH, displayWidth, displayHeight, displayUnit }) {
  const canvasWidth = roundInt((FIXED_HEIGHT * ratioW) / ratioH);
  return {
    key,
    label,
    width: canvasWidth,
    height: FIXED_HEIGHT,
    displayWidth,
    displayHeight,
    displayUnit,
  };
}

/** 绘本印刷 trim 尺寸：画布按 300 DPI 像素，与排版导出一致 */
function byPictureBookFormat(format) {
  const px = getFormatPixelSize(format, BOOK_EXPORT_DPI, 'digital');
  return {
    key: `picture-book-${format.id}`,
    label: t(format.nameKey),
    width: px.width,
    height: px.height,
    badge: 'picture-book',
    metaText: `${format.trimWidthIn} × ${format.trimHeightIn} in · ${px.width}×${px.height}@${BOOK_EXPORT_DPI}`,
  };
}

const platformTemplates = [
  byFixedHeightTemplate({
    key: 'a3-paper',
    label: 'A3纸',
    ratioW: 297,
    ratioH: 420,
    displayWidth: 297,
    displayHeight: 420,
    displayUnit: 'px',
  }),
  byFixedHeightTemplate({
    key: 'a5-paper',
    label: 'A5纸',
    ratioW: 148,
    ratioH: 210,
    displayWidth: 148,
    displayHeight: 210,
    displayUnit: 'px',
  }),
  byFixedHeightTemplate({
    key: 'wechat-first-cover',
    label: '公众号首图',
    ratioW: 1800,
    ratioH: 766,
    displayWidth: 1800,
    displayHeight: 766,
    displayUnit: 'px',
  }),
  byFixedHeightTemplate({
    key: 'id-one-inch',
    label: '证件照1寸',
    ratioW: 25,
    ratioH: 35,
    displayWidth: 25,
    displayHeight: 35,
    displayUnit: 'mm',
  }),
  byFixedHeightTemplate({
    key: 'id-two-inch',
    label: '证件照2寸',
    ratioW: 35,
    ratioH: 49,
    displayWidth: 35,
    displayHeight: 49,
    displayUnit: 'mm',
  }),
];

const templateOptions = computed(() => {
  const sys = (systemSizes.value || []).map((item) => ({
    key: `sys-${item.value ?? item.id ?? item.name ?? `${item.width}x${item.height}`}`,
    label: item.name || '推荐尺寸',
    width: item.width,
    height: item.height,
    unit: item.unit,
    displayWidth: item.width,
    displayHeight: item.height,
    displayUnit: item.unit,
  }));

  const pictureBooks = BOOK_EXPORT_FORMATS.map((format) => byPictureBookFormat(format));

  const base = [
    byRatio('1:1', 1, 1),
    byRatio('3:4', 3, 4),
    byRatio('4:3', 4, 3),
    byRatio('9:16', 9, 16),
    byRatio('16:9', 16, 9),
    byRatio('2:1', 2, 1),
    byA4('A4 竖向', false),
    byA4('A4 横向', true),
  ];

  const lateKeys = new Set(['wechat-first-cover', 'a3-paper', 'a5-paper', 'id-one-inch', 'id-two-inch']);
  const earlyPlatform = platformTemplates.filter((t) => !lateKeys.has(t.key));
  const latePlatform = platformTemplates.filter((t) => lateKeys.has(t.key));

  return [...sys, ...pictureBooks, ...earlyPlatform, ...base, ...latePlatform];
});

onMounted(async () => {
  // 尺寸模板走本地常量（不从后端拉 sizes）
});

onBeforeUnmount(() => {
});

const applyTemplate = (item) => {
  if (!canvasEditor || typeof canvasEditor.setSize !== 'function') return;
  canvasEditor.setSize(item.width, item.height);
};
</script>

<style scoped>
.tmpl-root {
  padding: 10px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.card {
  position: relative;
  cursor: pointer;
  padding: 12px;
  border-radius: 10px;
  background: #f6f7f9;
  border: 1px solid #eef2f8;
  user-select: none;
}

.card:hover {
  background: #edf9ff;
  border-color: #cdeeff;
}

.card--picture-book {
  padding-top: 18px;
  background: #f8f5ff;
  border-color: #e8e0f8;
}

.card--picture-book:hover {
  background: #f3edff;
  border-color: #d4c4f5;
}

.card-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  color: #6b4db8;
  background: #ebe4f8;
}

.title {
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.35;
}

.card--picture-book .title {
  padding-right: 36px;
}

.meta {
  font-size: 11px;
  color: #666;
  line-height: 1.4;
  word-break: break-word;
}
</style>
