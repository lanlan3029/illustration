<template>
  <section class="sticker-collection" :class="{ embedded }">
    <header class="collection-header">
      <div class="header-text">
        <h3 class="section-title">{{ $t('stickerLab.collectionTitle') }}</h3>
        <p class="section-desc">{{ $t('stickerLab.collectionSubtitle') }}</p>
      </div>
      <div class="header-count">
        <span class="count-num">{{ stickers.length }}/{{ maxCount }}</span>
        <div class="capacity-bar">
          <div class="capacity-fill" :style="{ width: `${capacityPercent}%` }" />
        </div>
      </div>
    </header>

    <div v-if="stickers.length" class="filter-row">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        type="button"
        class="filter-chip"
        :class="{ active: activeFilter === tab.value }"
        @click="activeFilter = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="filter-count">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="!stickers.length" class="collection-empty">
      <p>{{ $t('stickerLab.collectionEmpty') }}</p>
      <p class="empty-sub">{{ $t('stickerLab.collectionEmptyHint') }}</p>
    </div>

    <div v-else-if="filteredStickers.length" class="sticker-grid">
      <article v-for="item in filteredStickers" :key="item.id" class="sticker-card">
        <button type="button" class="sticker-card-btn" @click="openDetail(item)">
          <div class="sticker-frame checker-bg">
            <img :src="item.thumb || item.dataUrl" alt="" loading="lazy" />
          </div>
        </button>
        <div class="sticker-actions">
          <button type="button" class="action-btn" :title="$t('stickerLab.download')" @click.stop="downloadItem(item)">
            ↓
          </button>
          <button type="button" class="action-btn danger" :title="$t('stickerLab.delete')" @click.stop="confirmDelete(item)">
            ×
          </button>
        </div>
      </article>
    </div>

    <p v-else class="filter-empty">{{ $t('stickerLab.filterEmpty') }}</p>

    <el-dialog
      v-model="detailOpen"
      :title="$t('stickerLab.detailTitle')"
      width="min(520px, 92vw)"
      align-center
    >
      <div v-if="active" class="detail-body">
        <div class="detail-preview checker-bg">
          <img :src="active.dataUrl" alt="" />
        </div>
        <dl class="detail-meta">
          <div class="meta-row">
            <dt>{{ $t('stickerLab.detailMode') }}</dt>
            <dd>{{ modeLabel(active.mode) }}</dd>
          </div>
          <div class="meta-row">
            <dt>{{ $t('stickerLab.detailStyle') }}</dt>
            <dd>
              {{ styleLabel(active.style) }}
              <span
                v-if="active.style !== 'raw' && active.borderColor"
                class="color-dot"
                :style="{ background: active.borderColor }"
              />
            </dd>
          </div>
          <div class="meta-row">
            <dt>{{ $t('stickerLab.detailCreated') }}</dt>
            <dd>{{ formatCreatedAt(active.createdAt) }}</dd>
          </div>
        </dl>
      </div>
      <template #footer>
        <el-button @click="detailOpen = false">{{ $t('common.cancel') }}</el-button>
        <el-button @click="downloadActive">{{ $t('stickerLab.download') }}</el-button>
        <el-button type="danger" plain @click="removeActive">{{ $t('stickerLab.delete') }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { loadLocalStickers, removeLocalSticker } from '@/utils/stickerLab/stickerStorage';
import { downloadDataUrl } from '@/utils/lassoCrop';

defineProps({
  embedded: { type: Boolean, default: false },
});

const maxCount = 24;

const stickers = ref([]);
const detailOpen = ref(false);
const active = ref(null);
const activeFilter = ref('all');

const { t, locale } = useI18n();

const capacityPercent = computed(() => Math.min(100, (stickers.value.length / maxCount) * 100));

const filterTabs = computed(() => {
  const all = stickers.value.length;
  const lasso = stickers.value.filter((s) => s.mode === 'lasso').length;
  const matte = stickers.value.filter((s) => s.mode === 'matte').length;
  return [
    { value: 'all', label: t('stickerLab.filterAll'), count: all },
    { value: 'lasso', label: t('stickerLab.filterLasso'), count: lasso },
    { value: 'matte', label: t('stickerLab.filterMatte'), count: matte },
  ];
});

const filteredStickers = computed(() => {
  if (activeFilter.value === 'all') return stickers.value;
  return stickers.value.filter((s) => s.mode === activeFilter.value);
});

function modeLabel(mode) {
  if (mode === 'matte') return t('stickerLab.modeMatteShort');
  return t('stickerLab.modeLassoShort');
}

function styleLabel(style) {
  if (style === 'outline') return t('stickerLab.styleOutline');
  if (style === 'raw') return t('stickerLab.styleRaw');
  return t('stickerLab.styleSticker');
}

function formatCreatedAt(ts) {
  if (!ts) return '—';
  try {
    return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

async function refresh() {
  stickers.value = await loadLocalStickers();
  if (activeFilter.value !== 'all' && !filteredStickers.value.length) {
    activeFilter.value = 'all';
  }
}

function openDetail(item) {
  active.value = item;
  detailOpen.value = true;
}

function downloadItem(item) {
  if (!item?.dataUrl) return;
  downloadDataUrl(item.dataUrl, `sticker-${item.id}.png`);
  ElMessage.success(t('stickerLab.downloaded'));
}

function downloadActive() {
  if (!active.value) return;
  downloadItem(active.value);
}

async function confirmDelete(item) {
  try {
    await ElMessageBox.confirm(
      t('stickerLab.deleteConfirm'),
      t('stickerLab.delete'),
      { type: 'warning', confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel') }
    );
    await removeLocalSticker(item.id);
    if (active.value?.id === item.id) {
      detailOpen.value = false;
      active.value = null;
    }
    await refresh();
    ElMessage.success(t('stickerLab.deleted'));
  } catch {
    /* cancelled */
  }
}

async function removeActive() {
  if (!active.value?.id) return;
  await confirmDelete(active.value);
}

onMounted(refresh);

defineExpose({ refresh });
</script>

<style scoped>
.sticker-collection {
  --accent: #8167a9;
  --accent-soft: #f5f0fa;
  --border: #e8e0f4;
  --text: #1c345e;
  --muted: #6b7280;
}

.sticker-collection:not(.embedded) {
  margin-top: 24px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
}

.collection-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.section-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}

.header-count {
  flex-shrink: 0;
  text-align: right;
  min-width: 72px;
}

.count-num {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.capacity-bar {
  width: 72px;
  height: 4px;
  margin-top: 6px;
  margin-left: auto;
  border-radius: 999px;
  background: #f0ecf6;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 0.3s ease;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip.active {
  background: var(--accent-soft);
  border-color: #c4b5dc;
  color: var(--accent);
  font-weight: 600;
}

.filter-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(129, 103, 169, 0.1);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-chip.active .filter-count {
  background: rgba(129, 103, 169, 0.18);
}

.collection-empty,
.filter-empty {
  margin: 0;
  padding: 28px 16px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--muted);
  font-size: 13px;
}

.collection-empty p {
  margin: 0;
}

.empty-sub {
  margin-top: 6px !important;
  font-size: 12px;
  opacity: 0.85;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.sticker-card {
  position: relative;
}

.sticker-card-btn {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.sticker-frame {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.sticker-card:hover .sticker-frame {
  border-color: #c4b5dc;
  box-shadow: 0 4px 16px rgba(129, 103, 169, 0.12);
}

.sticker-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.sticker-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.sticker-card:hover .sticker-actions {
  opacity: 1;
}

.action-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--text);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.danger {
  color: #e84b4b;
}

.checker-bg {
  background:
    linear-gradient(45deg, #ececf0 25%, transparent 25%) 0 0 / 10px 10px,
    linear-gradient(-45deg, #ececf0 25%, transparent 25%) 0 0 / 10px 10px,
    #fafbfc;
  background-position: 0 0, 0 5px, 0 0;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-preview {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  display: flex;
  justify-content: center;
  min-height: 200px;
}

.detail-preview img {
  max-width: 100%;
  max-height: 46vh;
  object-fit: contain;
}

.detail-meta {
  margin: 0;
  display: grid;
  gap: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--accent-soft);
  border: 1px solid #f0ecf6;
}

.meta-row dt {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.meta-row dd {
  margin: 0;
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .collection-header {
    flex-direction: column;
    gap: 10px;
  }

  .header-count {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    text-align: left;
  }

  .capacity-bar {
    flex: 1;
    margin: 0;
  }

  .sticker-grid {
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  }

  .sticker-actions {
    opacity: 1;
  }
}
</style>
