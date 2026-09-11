<template>
  <section class="sticker-collection">
    <div class="collection-card">
      <header class="collection-header">
        <div class="header-main">
          <div class="header-icon" aria-hidden="true">✦</div>
          <div>
            <h2>{{ $t('stickerLab.collectionTitle') }}</h2>
            <p class="header-sub">{{ $t('stickerLab.collectionSubtitle') }}</p>
          </div>
        </div>
        <div class="header-meta">
          <span class="count-badge">{{ stickers.length }}/{{ maxCount }}</span>
          <div class="capacity-bar" :title="$t('stickerLab.collectionCapacity')">
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
        <div class="empty-orbit" aria-hidden="true">
          <span class="orbit-dot d1" />
          <span class="orbit-dot d2" />
          <span class="orbit-dot d3" />
        </div>
        <p class="empty-title">{{ $t('stickerLab.collectionEmpty') }}</p>
        <p class="empty-sub">{{ $t('stickerLab.collectionEmptyHint') }}</p>
      </div>

      <div v-else-if="filteredStickers.length" class="sticker-grid">
        <article
          v-for="(item, index) in filteredStickers"
          :key="item.id"
          class="sticker-card"
          :style="{ '--tilt': `${tiltFor(index)}deg` }"
        >
          <button type="button" class="sticker-card-btn" @click="openDetail(item)">
            <div class="sticker-frame checker-bg">
              <img :src="item.thumb || item.dataUrl" alt="" loading="lazy" />
            </div>
            <div class="sticker-meta">
              <span class="mode-tag">{{ modeLabel(item.mode) }}</span>
              <span class="style-tag">{{ styleLabel(item.style) }}</span>
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
    </div>

    <el-dialog
      v-model="detailOpen"
      :title="$t('stickerLab.detailTitle')"
      width="min(520px, 92vw)"
      align-center
      class="sticker-detail-dialog"
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

function tiltFor(index) {
  const tilts = [-2.5, 1.5, -1, 2, -1.5, 1, -2, 2.5];
  return tilts[index % tilts.length];
}

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
  margin-top: 32px;
}

.collection-card {
  --ink: #1c345e;
  --cream: #faf6f0;
  --accent: #8167a9;
  --accent-soft: #f0ebf8;
  --yellow: #f5d76e;
  --border: #e8e0f0;
  background: var(--cream);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 22px 22px 26px;
  box-shadow: 0 10px 32px rgba(28, 52, 94, 0.07);
}

.collection-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.header-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #a8c0d0, #8167a9);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(129, 103, 169, 0.25);
}

.collection-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.02em;
}

.header-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 88px;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--yellow);
  color: var(--ink);
  font-size: 13px;
  font-weight: 800;
  border: 2px solid rgba(28, 52, 94, 0.12);
}

.capacity-bar {
  width: 88px;
  height: 6px;
  border-radius: 999px;
  background: rgba(28, 52, 94, 0.08);
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8167a9, #a8c0d0);
  transition: width 0.35s ease;
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
  color: #606266;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip.active {
  background: var(--accent-soft);
  border-color: #d4c6ea;
  color: var(--accent);
  font-weight: 600;
}

.filter-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(129, 103, 169, 0.12);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-chip.active .filter-count {
  background: rgba(129, 103, 169, 0.2);
}

.filter-empty {
  margin: 0;
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.collection-empty {
  text-align: center;
  padding: 36px 16px 28px;
}

.empty-orbit {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border: 2px dashed #d4c6ea;
  border-radius: 50%;
}

.orbit-dot {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #a8c0d0;
}

.orbit-dot.d1 { top: 8px; left: 50%; transform: translateX(-50%); }
.orbit-dot.d2 { bottom: 12px; left: 10px; background: #f5d76e; }
.orbit-dot.d3 { bottom: 16px; right: 8px; background: #8167a9; }

.empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.empty-sub {
  margin: 8px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.55;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 16px;
}

.sticker-card {
  position: relative;
  transform: rotate(var(--tilt, 0deg));
  transition: transform 0.2s ease, z-index 0s;
}

.sticker-card:hover {
  transform: rotate(0deg) translateY(-4px);
  z-index: 2;
}

.sticker-card-btn {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.sticker-frame {
  aspect-ratio: 1;
  border-radius: 16px;
  border: 2px solid rgba(28, 52, 94, 0.1);
  padding: 10px;
  background-color: #fff;
  box-shadow: 0 4px 14px rgba(28, 52, 94, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.sticker-card:hover .sticker-frame {
  border-color: #c4b5dc;
  box-shadow: 0 8px 24px rgba(129, 103, 169, 0.18);
}

.sticker-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.sticker-meta {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.mode-tag,
.style-tag {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 600;
}

.mode-tag {
  background: var(--accent-soft);
  color: var(--accent);
}

.style-tag {
  background: rgba(28, 52, 94, 0.06);
  color: #606266;
}

.sticker-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.sticker-card:hover .sticker-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--ink);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(28, 52, 94, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #fff;
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
  padding: 24px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  min-height: 220px;
  border: 1px solid var(--border);
}

.detail-preview img {
  max-width: 100%;
  max-height: 46vh;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(28, 52, 94, 0.12));
}

.detail-meta {
  margin: 0;
  display: grid;
  gap: 10px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #f0ecf6;
}

.meta-row dt {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.meta-row dd {
  margin: 0;
  font-size: 13px;
  color: var(--ink);
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
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .collection-card {
    padding: 18px 14px 22px;
  }

  .collection-header {
    flex-direction: column;
  }

  .header-meta {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }

  .sticker-grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 12px;
  }

  .sticker-actions {
    opacity: 1;
    transform: none;
  }
}
</style>
