<template>
  <section class="sticker-collection" :class="{ 'is-sidebar': variant === 'sidebar' }">
    <header class="collection-head">
      <div>
        <h2 class="collection-title">{{ $t('stickerLab.collectionTitle') }}</h2>
        <p v-if="variant === 'sidebar'" class="collection-desc">{{ $t('stickerLab.collectionSubtitle') }}</p>
      </div>
      <span class="collection-count">{{ stickers.length }}/{{ maxCount }}</span>
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
      <div v-if="active" class="detail-preview checker-bg">
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
  --accent: #8167a9;
  --accent-soft: #f5f0fa;
  --border: #e8e0f4;
  --text: #1c345e;
  --muted: #6b7280;
}

.collection-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.collection-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.collection-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
}

.collection-count {
  flex-shrink: 0;
  min-width: 44px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid #d4c6ea;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}

.collection-empty {
  text-align: center;
  padding: 32px 12px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: #fcfbfd;
  color: var(--muted);
  font-size: 13px;
}

.collection-empty p {
  margin: 0;
}

.empty-sub {
  margin-top: 6px !important;
  font-size: 12px;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 12px;
}

.is-sidebar .sticker-grid {
  grid-template-columns: repeat(2, 1fr);
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
  max-height: 100px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 4px 10px rgba(28, 52, 94, 0.12));
  transition: transform 0.15s ease;
}

.sticker-cell:hover .sticker-btn img {
  transform: translateY(-2px);
}

.sticker-actions {
  position: absolute;
  top: -4px;
  right: -4px;
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
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  color: var(--text);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(28, 52, 94, 0.1);
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

.detail-preview {
  padding: 24px 16px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  min-height: 200px;
}

.detail-preview img {
  max-width: 100%;
  max-height: 50vh;
  object-fit: contain;
}

@media (max-width: 960px) {
  .is-sidebar .sticker-grid {
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  }

  .sticker-actions {
    opacity: 1;
  }
}
</style>
