<template>
  <div class="poster-result">
    <header v-if="showBackToWrite" class="poster-result__head">
      <button type="button" class="poster-result__back" @click="$emit('back-to-write')">
        {{ $t('moodDiary.backToWrite') }}
      </button>
    </header>
    <div class="poster-result__stage">
      <div class="poster-result__slot">
        <img :src="posterUrl" class="poster-result__img" alt="" />
      </div>
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
  width: 100%;
  max-width: 480px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 0 0;
  box-sizing: border-box;
}

.poster-result__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.poster-result__back {
  border: none;
  background: var(--md-surface);
  color: var(--md-text);
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.poster-result__back:hover {
  background: var(--md-surface);
  color: var(--md-text);
  opacity: 0.85;
}

.poster-result__stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 6px 18px;
  overflow: visible;
}

.poster-result__slot {
  position: relative;
  height: min(68vh, 580px);
  width: auto;
  max-width: 100%;
  aspect-ratio: 9 / 16;
  border-radius: 16px;
  overflow: hidden;
  transform: rotate(-2.5deg);
  transform-origin: center center;
  border: 3px solid #fff;
  box-shadow:
    0 0 0 1px rgba(107, 83, 68, 0.14),
    0 14px 32px rgba(79, 86, 104, 0.16),
    0 5px 12px rgba(79, 86, 104, 0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  background: var(--md-poster-slot);
}

.poster-result:hover .poster-result__slot {
  transform: rotate(-1.5deg) translateY(-3px);
  box-shadow:
    0 0 0 1px rgba(107, 83, 68, 0.16),
    0 18px 36px rgba(79, 86, 104, 0.18),
    0 8px 16px rgba(79, 86, 104, 0.1);
}

.poster-result__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.poster-result__actions :deep(.el-button--primary) {
  --el-button-bg-color: var(--md-accent);
  --el-button-border-color: var(--md-accent);
  --el-button-hover-bg-color: var(--md-accent-deep);
  --el-button-hover-border-color: var(--md-accent-deep);
  --el-button-active-bg-color: var(--md-accent-deep);
  --el-button-active-border-color: var(--md-accent-deep);
}

.poster-result__actions :deep(.el-button--default) {
  --el-button-text-color: var(--md-text);
  --el-button-border-color: var(--md-border);
  --el-button-bg-color: var(--md-card);
  --el-button-hover-text-color: var(--md-accent-deep);
  --el-button-hover-bg-color: var(--md-surface);
  --el-button-hover-border-color: var(--md-border);
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

@media (max-width: 900px) {
  .poster-result {
    height: auto;
    min-height: 0;
    max-width: 100%;
  }

  .poster-result__stage {
    flex: none;
    min-height: 0;
  }

  .poster-result__slot {
    height: min(52vh, 440px);
  }
}
</style>
