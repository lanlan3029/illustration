<template>
  <div class="sticker-collection">
    <div class="collection-head">
      <h2>{{ $t('stickerLab.collectionTitle') }}</h2>
      <span class="collection-count">{{ stickers.length }}/{{ maxCount }}</span>
    </div>
    <div v-if="!stickers.length" class="collection-empty">
      <p>{{ $t('stickerLab.collectionEmpty') }}</p>
      <p class="empty-sub">{{ $t('stickerLab.collectionEmptyHint') }}</p>
    </div>
    <div v-else class="sticker-grid">
      <div
        v-for="item in stickers"
        :key="item.id"
        class="sticker-cell"
        @click="openDetail(item)"
      >
        <img :src="item.thumb || item.dataUrl" alt="" />
      </div>
    </div>

    <el-dialog v-model="detailOpen" :title="$t('stickerLab.detailTitle')" width="min(480px, 92vw)" align-center>
      <div v-if="active" class="detail-preview checker-bg">
        <img :src="active.dataUrl" alt="" />
      </div>
      <template #footer>
        <el-button @click="detailOpen = false">{{ $t('common.cancel') }}</el-button>
        <el-button @click="downloadActive">{{ $t('stickerLab.download') }}</el-button>
        <el-button type="danger" plain @click="removeActive">{{ $t('stickerLab.delete') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
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

function downloadActive() {
  if (!active.value?.dataUrl) return;
  downloadDataUrl(active.value.dataUrl, `sticker-${active.value.id}.png`);
  ElMessage.success(t('stickerLab.downloaded'));
}

async function removeActive() {
  if (!active.value?.id) return;
  await removeLocalSticker(active.value.id);
  detailOpen.value = false;
  active.value = null;
  await refresh();
  ElMessage.success(t('stickerLab.deleted'));
}

onMounted(refresh);

defineExpose({ refresh });
</script>

<style scoped>
.sticker-collection {
  margin-top: 28px;
}

.collection-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.collection-head h2 {
  margin: 0;
  font-size: 16px;
  color: #1c345e;
  font-weight: 600;
}

.collection-count {
  font-size: 13px;
  color: #909399;
}

.collection-empty {
  text-align: center;
  padding: 28px 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  background: #fafbfc;
}

.collection-empty p {
  margin: 0;
  color: #606266;
}

.empty-sub {
  margin-top: 6px !important;
  font-size: 13px;
  color: #909399 !important;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
}

.sticker-cell {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid #e8e8ec;
  background:
    linear-gradient(45deg, #ececf0 25%, transparent 25%) 0 0 / 10px 10px,
    linear-gradient(-45deg, #ececf0 25%, transparent 25%) 0 0 / 10px 10px,
    #fff;
  background-position: 0 0, 0 5px, 0 0;
  padding: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.sticker-cell:hover {
  box-shadow: 0 4px 14px rgba(28, 52, 94, 0.12);
  transform: translateY(-1px);
}

.sticker-cell img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.detail-preview {
  padding: 20px;
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

.checker-bg {
  background:
    linear-gradient(45deg, #ececf0 25%, transparent 25%) 0 0 / 12px 12px,
    linear-gradient(-45deg, #ececf0 25%, transparent 25%) 0 0 / 12px 12px,
    #fafbfc;
  background-position: 0 0, 0 6px, 0 0;
}
</style>
