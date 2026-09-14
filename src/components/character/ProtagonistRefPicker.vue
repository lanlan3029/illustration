<template>
  <div class="protagonist-ref-picker">
    <p v-if="showTitle" class="section-title">{{ titleText }}</p>
    <p v-if="showHint" class="section-hint">{{ hintText }}</p>
    <div
      v-for="slot in [1, 2]"
      :key="slot"
      class="ref-row"
    >
      <span class="ref-label">{{ slotLabel(slot) }}</span>
      <el-select
        :model-value="modelValue[slot]?.characterId"
        clearable
        filterable
        size="small"
        class="ref-select"
        :placeholder="pickPlaceholder"
        :loading="loadingMyCharacters"
        @update:model-value="(id) => onProtagonistChange(slot, id)"
      >
        <el-option
          v-for="c in myCharacters"
          :key="c.id || c._id"
          :label="c.character_name || $t('characterStudio.unnamed')"
          :value="String(c.id || c._id)"
          :disabled="isCharacterDisabledForSlot(c, slot)"
        />
      </el-select>
    </div>
    <div v-if="hasProtagonistReference(modelValue)" class="ref-previews">
      <div
        v-for="slot in [1, 2]"
        :key="'preview-' + slot"
        v-show="modelValue[slot]?.preview"
        class="ref-preview-item"
      >
        <div class="ref-preview-thumb">
          <img :src="modelValue[slot].preview" :alt="slotLabel(slot)" />
        </div>
        <span class="ref-preview-caption">{{ slotLabel(slot) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { getImageUrl } from '@/utils/characterStudioPrompt';
import {
  emptyProtagonistRefs,
  hasProtagonistReference,
  clearProtagonistSlot,
} from '@/utils/protagonistRefs';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => emptyProtagonistRefs(),
  },
  /** { 1: '朵朵', 2: '跳跳' } 显示在主角标签上 */
  slotNames: {
    type: Object,
    default: () => ({}),
  },
  apiBaseUrl: { type: String, default: '' },
  showTitle: { type: Boolean, default: true },
  showHint: { type: Boolean, default: true },
  titleKey: { type: String, default: 'multiCharacterScene.refTitle' },
  hintKey: { type: String, default: 'multiCharacterScene.refHint' },
  protagonist1Key: { type: String, default: 'aibooks.protagonist1' },
  protagonist2Key: { type: String, default: 'aibooks.protagonist2' },
  pickPlaceholderKey: { type: String, default: 'aibooks.protagonistPickPlaceholder' },
});

const emit = defineEmits(['update:modelValue', 'change']);

const { t } = useI18n();
const { proxy } = getCurrentInstance() || {};
const http = proxy?.$http || axios;

const myCharacters = ref([]);
const loadingMyCharacters = ref(false);

const titleText = computed(() => t(props.titleKey));
const hintText = computed(() => t(props.hintKey));
const pickPlaceholder = computed(() => t(props.pickPlaceholderKey));

function slotLabel(slot) {
  const name = String(props.slotNames?.[slot] || '').trim();
  const base = t(slot === 1 ? props.protagonist1Key : props.protagonist2Key);
  return name ? `${base}（${name}）` : base;
}

function isCharacterDisabledForSlot(character, slot) {
  const id = String(character?.id || character?._id || '');
  if (!id) return false;
  const otherSlot = slot === 1 ? 2 : 1;
  return String(props.modelValue?.[otherSlot]?.characterId) === id;
}

function emitRefs(next) {
  emit('update:modelValue', next);
  emit('change', next);
}

async function fetchMyCharacters() {
  const userId = localStorage.getItem('id');
  const token = localStorage.getItem('token');
  if (!userId || !token) {
    myCharacters.value = [];
    return;
  }
  loadingMyCharacters.value = true;
  try {
    const apiUrl = props.apiBaseUrl ? `${props.apiBaseUrl}/character` : '/character';
    const res = await http.get(apiUrl, {
      params: { user_id: userId },
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = res?.data?.data || res?.data?.message || res?.data?.list || [];
    myCharacters.value = Array.isArray(list) ? list : [];
    await reloadProtagonistRefsFromIds();
  } catch {
    myCharacters.value = [];
  } finally {
    loadingMyCharacters.value = false;
  }
}

async function onProtagonistChange(slot, characterId, { silent = false } = {}) {
  const next = {
    1: { ...props.modelValue[1] },
    2: { ...props.modelValue[2] },
  };
  if (!characterId) {
    clearProtagonistSlot(next, slot);
    emitRefs(next);
    return;
  }
  const item = myCharacters.value.find((c) => String(c.id || c._id) === String(characterId));
  if (!item) return;
  const imageUrl = getImageUrl(item.image_url || item.character_image_url);
  if (!imageUrl) {
    if (!silent) ElMessage.warning(t('aibooks.myCharacterNoImage'));
    clearProtagonistSlot(next, slot);
    emitRefs(next);
    return;
  }
  next[slot] = {
    characterId: String(characterId),
    base64: '',
    preview: imageUrl,
  };
  emitRefs(next);
  if (!silent) {
    ElMessage.success(t('aibooks.protagonistSelected', { label: slotLabel(slot) }));
  }
}

async function reloadProtagonistRefsFromIds() {
  if (!myCharacters.value.length) return;
  for (const slot of [1, 2]) {
    const id = props.modelValue?.[slot]?.characterId;
    if (!id || props.modelValue[slot]?.preview) continue;
    await onProtagonistChange(slot, id, { silent: true });
  }
}

onMounted(() => {
  fetchMyCharacters();
});

defineExpose({ fetchMyCharacters, hasReference: () => hasProtagonistReference(props.modelValue) });
</script>

<style scoped>
.section-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.section-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.45;
}

.ref-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.ref-label {
  font-size: 13px;
  color: #606266;
  min-width: 88px;
}

.ref-select {
  flex: 1;
  min-width: 0;
}

.ref-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.ref-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ref-preview-thumb {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  background: #fff;
}

.ref-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ref-preview-caption {
  font-size: 11px;
  color: #606266;
  text-align: center;
  max-width: 88px;
  line-height: 1.3;
}
</style>
