<template>
  <section class="sticker-collection">
    <header class="collection-head">
      <h2 class="collection-title">{{ $t('stickerLab.collectionTitle') }}</h2>
      <span class="collection-count">{{ stickers.length }}</span>
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
      class="sticker-detail-dialog"
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
  --cream: #f8f2e9;
  --ink: #1a1a1a;
  --yellow: #f5d76e;
}

.collection-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 2px;
}

.collection-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.collection-count {
  min-width: 28px;
  height: 28px;
  padding: 0 10px;
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  background: var(--yellow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  color: var(--ink);
}

.collection-empty {
  text-align: center;
  padding: 48px 16px 32px;
  color: rgba(26, 26, 26, 0.5);
}

.collection-empty p {
  margin: 0;
  font-size: 14px;
}

.empty-sub {
  margin-top: 8px !important;
  font-size: 13px;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 14px;
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
  max-height: 132px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 6px 14px rgba(26, 26, 26, 0.14));
  transition: transform 0.18s ease, filter 0.18s ease;
}

.sticker-cell:hover .sticker-btn img {
  transform: translateY(-3px) scale(1.02);
  filter: drop-shadow(0 10px 22px rgba(26, 26, 26, 0.18));
}

.sticker-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.sticker-cell:hover .sticker-actions {
  opacity: 1;
}

.action-btn {
  width: 26px;
  height: 26px;
  border: 2px solid var(--ink);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(26, 26, 26, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.danger {
  color: #e84b4b;
}

.detail-preview {
  padding: 32px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
  background: var(--cream);
  border-radius: 12px;
}

.detail-preview img {
  max-width: 100%;
  max-height: 52vh;
  object-fit: contain;
  filter: drop-shadow(0 12px 28px rgba(26, 26, 26, 0.16));
}

@media (min-width: 640px) {
  .sticker-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 22px 18px;
  }

  .sticker-btn img {
    max-height: 148px;
  }
}

@media (min-width: 900px) {
  .sticker-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 480px) {
  .sticker-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px 10px;
  }

  .sticker-btn img {
    max-height: 108px;
  }

  .sticker-actions {
    opacity: 1;
  }
}
</style>
