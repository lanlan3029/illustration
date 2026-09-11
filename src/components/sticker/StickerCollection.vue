<template>
  <section class="sticker-collection" :class="[`variant-${variant}`]">
    <header class="collection-head">
      <h2 class="collection-title">
        {{ $t('stickerLab.collectionTitle') }}
        <span class="collection-count">{{ stickers.length }}/{{ maxCount }}</span>
      </h2>
      <p class="collection-desc">{{ $t('stickerLab.collectionSubtitle') }}</p>
    </header>

    <div v-if="!stickers.length" class="collection-empty">
      <p>{{ $t('stickerLab.collectionEmpty') }}</p>
      <p class="empty-sub">{{ $t('stickerLab.collectionEmptyHint') }}</p>
    </div>

    <div v-else class="sticker-grid">
      <div v-for="item in stickers" :key="item.id" class="sticker-cell">
        <button type="button" class="sticker-btn" @click="openDetail(item)">
          <img :src="item.thumb || item.dataUrl" alt="" loading="lazy" />
        </button>
        <div class="sticker-actions">
          <button type="button" class="action-btn" :title="$t('stickerLab.download')" @click.stop="downloadItem(item)">
            ↓
          </button>
          <button type="button" class="action-btn danger" :title="$t('stickerLab.delete')" @click.stop="confirmDelete(item)">
            ×
          </button>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="detailOpen"
      :title="$t('stickerLab.detailTitle')"
      width="min(480px, 92vw)"
      align-center
    >
      <div v-if="active" class="detail-preview">
        <img :src="active.dataUrl" alt="" />
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
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { loadLocalStickers, removeLocalSticker } from '@/utils/stickerLab/stickerStorage';
import { downloadDataUrl } from '@/utils/lassoCrop';

defineProps({
  variant: { type: String, default: 'default' },
});

const maxCount = 24;

const stickers = ref([]);
const detailOpen = ref(false);
const active = ref(null);

const { t } = useI18n();

async function refresh() {
  stickers.value = await loadLocalStickers();
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

defineExpose({ refresh, maxCount });
</script>

<style scoped>
.sticker-collection {
  --ink: #3d3229;
  --muted: #8a7f72;
  --dash: #d4c4b0;
  --cream: #f5efe1;
}

.collection-head {
  margin-bottom: 16px;
}

.collection-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.collection-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.collection-count {
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid var(--dash);
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
}

.collection-empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}

.collection-empty p {
  margin: 0;
}

.empty-sub {
  margin-top: 8px !important;
  font-size: 12px;
  opacity: 0.85;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 16px;
}

.variant-sidebar .sticker-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 12px;
}

.sticker-cell {
  position: relative;
}

.sticker-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.sticker-btn img {
  width: 100%;
  height: auto;
  max-height: 88px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 5px 12px rgba(61, 50, 41, 0.12));
  transition: transform 0.18s ease;
}

.variant-gallery .sticker-btn img {
  max-height: 96px;
}

.sticker-cell:hover .sticker-btn img {
  transform: translateY(-3px) scale(1.03);
}

.sticker-actions {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.sticker-cell:hover .sticker-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--dash);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--ink);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.danger {
  color: #c97652;
}

.detail-preview {
  padding: 28px 16px;
  display: flex;
  justify-content: center;
  min-height: 220px;
  background: var(--cream);
  border-radius: 12px;
}

.detail-preview img {
  max-width: 100%;
  max-height: 50vh;
  object-fit: contain;
  filter: drop-shadow(0 10px 24px rgba(61, 50, 41, 0.15));
}

@media (max-width: 860px) {
  .variant-gallery .sticker-grid {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 16px 12px;
  }

  .sticker-actions {
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .variant-gallery .sticker-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
