
<template>
  <div class="tmpl-root">
    <Divider plain orientation="left">推荐模板</Divider>
   

    <div class="grid">
      <div
        v-for="item in templateOptions"
        :key="item.key"
        class="card"
        @click="applyTemplate(item)"
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import useSelect from '@/components/editorPro/hooks/select.js';

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
    byA4('A4 竖向', false),
    byA4('A4 横向', true),
  ];

  const lateKeys = new Set(['wechat-first-cover', 'a3-paper', 'a5-paper', 'id-one-inch', 'id-two-inch']);
  const earlyPlatform = platformTemplates.filter((t) => !lateKeys.has(t.key));
  const latePlatform = platformTemplates.filter((t) => lateKeys.has(t.key));

  return [...sys, ...earlyPlatform, ...base, ...latePlatform];
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

.title {
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
}

.meta {
  font-size: 12px;
  color: #666;
}
</style>
