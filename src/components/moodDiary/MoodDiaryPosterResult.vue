<template>
  <div class="poster-result">
    <header class="poster-result__head">
      <h2 class="poster-result__title">{{ $t('moodDiary.navNow') }}</h2>
      <button v-if="showBackToWrite" type="button" class="poster-result__back" @click="$emit('back-to-write')">
        {{ $t('moodDiary.backToWrite') }}
      </button>
    </header>
    <div class="poster-result__frame">
      <img :src="posterUrl" class="poster-result__img" alt="" />
    </div>
    <div class="poster-result__actions">
      <el-button
        type="primary"
        class="poster-result__btn"
        :loading="saving"
        :disabled="saving || loading"
        @click="$emit('save')"
      >
        {{ saving ? $t('moodDiary.savingMood') : $t('moodDiary.saveToMyCreation') }}
      </el-button>
      <el-button class="poster-result__btn" :disabled="loading" @click="$emit('download')">
        {{ $t('moodDiary.downloadMood') }}
      </el-button>
      <el-button class="poster-result__btn" :loading="loading" :disabled="saving" @click="$emit('regenerate')">
        {{ $t('moodDiary.regeneratePoster') }}
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MoodDiaryPosterResult',
  props: {
    posterUrl: { type: String, required: true },
    saving: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    showBackToWrite: { type: Boolean, default: true }
  },
  emits: ['save', 'download', 'regenerate', 'back-to-write']
}
</script>

<style scoped>
.poster-result {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 14px 14px;
  box-sizing: border-box;
}

.poster-result__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.poster-result__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.poster-result__back {
  border: none;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.poster-result__back:hover {
  background: #e2e8f0;
  color: #334155;
}

.poster-result__frame {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 14px;
  background: #f1f5f9;
  border: 1px solid #e8ecf1;
  overflow: hidden;
}

.poster-result__img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
  display: block;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.poster-result__actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 4px;
}

.poster-result__btn {
  width: 100%;
  margin: 0 !important;
  border-radius: 10px;
  font-weight: 600;
}

.poster-result__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
