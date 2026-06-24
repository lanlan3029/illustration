
<template>
  <div class="tmpl-root">
    <Divider plain orientation="left">{{ $t('pictureBookTemplates.sectionTitle') }}</Divider>
    <p class="tmpl-hint">{{ $t('pictureBookTemplates.sectionHint') }}</p>

    <div v-for="styleSet in styleSets" :key="styleSet.id" class="style-set">
      <div class="style-head" :class="`style-head--${styleSet.id}`">
        <span class="style-name">{{ $t(styleSet.nameKey) }}</span>
        <span class="style-count">{{ styleSet.pages.length }} {{ $t('pictureBookTemplates.pagesUnit') }}</span>
      </div>
      <div class="grid pb-grid">
        <div
          v-for="page in styleSet.pages"
          :key="page.id"
          class="card pb-card"
          :class="`pb-card--${styleSet.id}`"
          @click="applyPictureBookPage(page)"
        >
          <div class="title">{{ $t(page.nameKey) }}</div>
          <div class="meta">
            <span class="kind-tag">{{ $t(page.kindLabelKey) }}</span>
            <span>{{ pageSizeText(page) }}</span>
          </div>
        </div>
      </div>
    </div>

    <Divider plain orientation="left">{{ $t('editorProLeft.canvasSizes') }}</Divider>

    <div class="grid">
      <div
        v-for="item in templateOptions"
        :key="item.key"
        class="card"
        @click="applySizeTemplate(item)"
      >
        <div class="title">{{ item.label }}</div>
        <div class="meta">
          {{ item.displayWidth ?? item.width }} × {{ item.displayHeight ?? item.height }}{{
            item.displayUnit || item.unit ? ` ${item.displayUnit ?? item.unit}` : ''
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ImportTmpl">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useSelect from '@/components/editorPro/hooks/select.js';
import { getPictureBookStyleSets } from '@/data/editorPro/templates/pictureBookStyleSets';
import { pageSizeLabel } from '@/data/editorPro/templates/buildFabricObject';
import { applyPictureBookTemplate } from '@/utils/editorPro/applyPictureBookTemplate';

const { t } = useI18n();
const { canvasEditor } = useSelect() || {};

const styleSets = ref(getPictureBookStyleSets());

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
  const earlyPlatform = platformTemplates.filter((item) => !lateKeys.has(item.key));
  const latePlatform = platformTemplates.filter((item) => lateKeys.has(item.key));

  return [...sys, ...earlyPlatform, ...base, ...latePlatform];
});

function pageSizeText(page) {
  return pageSizeLabel(page.width, page.height);
}

const applySizeTemplate = (item) => {
  if (!canvasEditor || typeof canvasEditor.setSize !== 'function') return;
  canvasEditor.setSize(item.width, item.height);
};

const applyPictureBookPage = (page) => {
  applyPictureBookTemplate(canvasEditor, page, {
    t,
    tip: t('tip'),
    replaceTip: t('pictureBookTemplates.replaceConfirm'),
    ok: t('ok'),
    cancel: t('cancel'),
  });
};
</script>

<style scoped>
.tmpl-root {
  padding: 10px 0;
}

.tmpl-hint {
  font-size: 12px;
  color: #888;
  text-align: left;
  margin: 0 0 12px;
  line-height: 1.5;
}

.style-set {
  margin-bottom: 18px;
}

.style-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.style-name {
  font-weight: 700;
  font-size: 13px;
}

.style-count {
  font-size: 11px;
  opacity: 0.75;
}

.style-head--ink-wash {
  background: linear-gradient(90deg, #e8f2f8, #d4e4ef);
  color: #2a4555;
}

.style-head--warm-diary {
  background: linear-gradient(90deg, #fff5e6, #ffe8c8);
  color: #6b4020;
}

.style-head--crayon-forest {
  background: linear-gradient(90deg, #eefae8, #d8f0cc);
  color: #2d5020;
}

.style-head--starry-lullaby {
  background: linear-gradient(90deg, #2a3558, #3d4a78);
  color: #e8eeff;
}

.style-head--soft-pencil {
  background: linear-gradient(90deg, #faf5fc, #efe4f4);
  color: #5a4868;
}

.style-head--coral-sunset {
  background: linear-gradient(90deg, #fff0e8, #ffd8c8);
  color: #7a3018;
}

.style-head--ocean-breeze {
  background: linear-gradient(90deg, #e8f8ff, #cceef8);
  color: #1a5068;
}

.style-head--snow-fairy {
  background: linear-gradient(90deg, #ffffff, #e8f2ff);
  color: #486080;
  border: 1px solid #e0eaf5;
}

.style-head--candy-pop {
  background: linear-gradient(135deg, #ffe8f4, #e8f0ff, #fff8d8);
  color: #6a2858;
}

.style-head--vintage-print {
  background: linear-gradient(90deg, #f5ead8, #e8d8b8);
  color: #4a2810;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pb-grid {
  gap: 8px;
}

.card {
  cursor: pointer;
  padding: 12px;
  border-radius: 10px;
  background: #f6f7f9;
  border: 1px solid #eef2f8;
  user-select: none;
  text-align: left;
}

.card:hover {
  background: #edf9ff;
  border-color: #cdeeff;
}

.pb-card {
  padding: 10px;
}

.pb-card--ink-wash {
  border-left: 3px solid #5a8499;
}

.pb-card--warm-diary {
  border-left: 3px solid #c89050;
}

.pb-card--crayon-forest {
  border-left: 3px solid #6cb850;
}

.pb-card--starry-lullaby {
  border-left: 3px solid #8090c8;
  background: #f4f6fc;
}

.pb-card--soft-pencil {
  border-left: 3px solid #b898c8;
}

.pb-card--coral-sunset {
  border-left: 3px solid #e87048;
}

.pb-card--ocean-breeze {
  border-left: 3px solid #48a8c8;
}

.pb-card--snow-fairy {
  border-left: 3px solid #a8c0e0;
  background: #fafcff;
}

.pb-card--candy-pop {
  border-left: 3px solid #ff60a0;
}

.pb-card--vintage-print {
  border-left: 3px solid #8b4028;
}

.title {
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.35;
}

.meta {
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.kind-tag {
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>
