<template>
  <div class="char-wrap">
    <div v-if="loading && list.length === 0" class="tip">{{ $t('common.loading') }}</div>
    <div v-else-if="list.length === 0" class="tip">{{ $t('editorProLeft.noCharacters') }}</div>
    <div v-else class="char-grid">
      <div v-for="item in list" :key="item._id || item.id" class="char-item">
        <img
          class="char-image"
          :src="getImageSrc(item)"
          :alt="item.character_name || 'character'"
          @click="handlePick(item)"
        />
        <div class="char-title">{{ item.character_name || $t('editorProLeft.unnamedCharacter') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Message } from 'view-ui-plus';
import { useI18n } from 'vue-i18n';
import useSelect from '@/components/editorPro/hooks/select';
import { insertWorkImageOrAddToCanvas } from '@/utils/editorPro/photoSlotContext';

const { t } = useI18n();

const { canvasEditor } = useSelect();
const list = ref([]);
const loading = ref(false);

function getImageSrc(item) {
  if (!item) return '';
  let content = item.content || item.image_url || item.character_image_url || '';
  if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
    return content;
  }
  return `https://static.kidstory.cc/${content || ''}`;
}

function loadImageEl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function handlePick(item) {
  const url = getImageSrc(item);
  if (!url || !canvasEditor) return;
  const result = await insertWorkImageOrAddToCanvas(url, canvasEditor, loadImageEl);
  if (result === 'filled') {
    Message.success(t('editorProLeft.photoSlotFilled'));
  } else if (result === 'failed') {
    Message.error(t('editorProLeft.photoSlotFillFailed'));
  }
}

async function fetchCharacters() {
  const userId = localStorage.getItem('id');
  const token = localStorage.getItem('token') || '';
  if (!userId || !token) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    const apiUrl = process.env.VUE_APP_API_BASE_URL
      ? `${process.env.VUE_APP_API_BASE_URL}/character`
      : '/character';
    const response = await axios.get(apiUrl, {
      params: { user_id: userId },
      headers: { Authorization: `Bearer ${token}` },
    });
    const characterList = response?.data?.data || response?.data?.message || response?.data?.list || [];
    list.value = (characterList || []).map((char) => ({
      _id: char.id || char._id,
      character_name: char.character_name || char.name,
      image_url: char.image_url || char.character_image_url,
      ...char,
    }));
  } catch (e) {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchCharacters();
});

defineExpose({ refresh: fetchCharacters });
</script>

<style scoped>
.tip {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.char-wrap {
  height: calc(100vh - 210px);
  overflow-y: auto;
  padding: 8px 2px 12px;
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.char-item {
  border: 1px solid #efefef;
  border-radius: 8px;
  overflow: hidden;
  background: repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 50% / 12px 12px;
}

.char-image {
  display: block;
  width: 100%;
  height: 100px;
  object-fit: contain;
  cursor: pointer;
}

.char-title {
  font-size: 12px;
  color: #333;
  padding: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fff;
}
</style>
