<template>
  <div class="mj-panel">
    <header class="mj-head">
      <h1 class="mj-title">{{ $t('moodDiary.memoryJournal.title') }}</h1>
      <p class="mj-lead">{{ $t('moodDiary.memoryJournal.lead') }}</p>
    </header>

    <div v-if="!resultUrl" class="mj-body">
      <label class="mj-label" for="mj-diary">{{ $t('moodDiary.memoryJournal.diaryLabel') }}</label>
      <textarea
        id="mj-diary"
        v-model="diary"
        class="mj-diary"
        rows="8"
        :maxlength="diaryMax"
        :disabled="generating"
        :placeholder="$t('moodDiary.memoryJournal.diaryPlaceholder')"
      />
      <p class="mj-count">{{ diary.length }} / {{ diaryMax }}</p>

      <div class="mj-photos-head">
        <span class="mj-label">{{ $t('moodDiary.memoryJournal.photosLabel') }}</span>
        <span class="mj-hint">{{ $t('moodDiary.memoryJournal.photosHint', { min: 1, max: photoMax }) }}</span>
      </div>
      <div class="mj-photos">
        <div v-for="(url, idx) in photos" :key="`${idx}-${url.slice(0, 24)}`" class="mj-photo">
          <img :src="url" alt="" />
          <button
            type="button"
            class="mj-photo-remove"
            :disabled="generating"
            :aria-label="$t('moodDiary.removeRefImage')"
            @click="removePhoto(idx)"
          >
            ×
          </button>
        </div>
        <button
          v-if="photos.length < photoMax"
          type="button"
          class="mj-photo-add"
          :disabled="generating"
          @click="triggerPick"
        >
          <span>+</span>
          <small>{{ $t('moodDiary.memoryJournal.addPhoto') }}</small>
        </button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="mj-file"
        @change="onFilesPicked"
      />

      <p v-if="progressLabel" class="mj-progress">{{ progressLabel }}</p>

      <div class="mj-actions-spacer" aria-hidden="true" />
      <div class="mj-actions">
        <el-button
          type="primary"
          class="mj-generate-btn"
          size="large"
          :loading="generating"
          :disabled="!canGenerate"
          @click="runGenerate"
        >
          {{ generating ? $t('moodDiary.generating') : $t('moodDiary.memoryJournal.generate') }}
        </el-button>
      </div>
    </div>

    <div v-else class="mj-result-wrap">
      <MoodDiaryPosterResult
        :poster-url="resultUrl"
        :saving="saving"
        :loading="generating"
        :hint="resultHint"
        @save="saveResult"
        @download="downloadResult"
        @regenerate="resetForRegen"
        @back-to-write="resetForRegen"
      />
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import MoodDiaryPosterResult from '@/components/moodDiary/MoodDiaryPosterResult.vue'
import { isMoodDiaryLoggedIn } from '@/utils/moodDiary/auth'
import { setDraft } from '@/utils/moodDiary/draft'
import { generateMemoryJournalPoster } from '@/utils/moodDiary/memoryJournalApi'
import { saveMoodPoster } from '@/utils/moodDiary/posterActions'
import { downloadDataUrl } from '@/utils/moodDiary/sharePosterDraw'

const DIARY_MAX = 4000
const PHOTO_MAX = 9

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default {
  name: 'MoodDiaryMemoryJournalPanel',
  components: { MoodDiaryPosterResult },
  data() {
    return {
      diary: '',
      photos: [],
      generating: false,
      saving: false,
      progressLabel: '',
      resultUrl: '',
      analysis: null
    }
  },
  computed: {
    diaryMax() {
      return DIARY_MAX
    },
    photoMax() {
      return PHOTO_MAX
    },
    canGenerate() {
      return (
        !this.generating
        && this.diary.trim().length > 0
        && this.photos.length >= 1
      )
    },
    resultHint() {
      const title = this.analysis?.title
      const caption = this.analysis?.caption
      if (title && caption) return `${title} · ${caption}`
      return title || caption || ''
    },
    userName() {
      return this.$store?.state?.userInfo?.name || ''
    }
  },
  methods: {
    triggerPick() {
      this.$refs.fileInput?.click()
    },
    async onFilesPicked(e) {
      const files = Array.from(e.target?.files || [])
      e.target.value = ''
      if (!files.length) return
      const room = this.photoMax - this.photos.length
      const picked = files.slice(0, room)
      try {
        const urls = await Promise.all(picked.map((f) => readFileAsDataUrl(f)))
        this.photos = [...this.photos, ...urls.filter(Boolean)]
      } catch {
        ElMessage.error(this.$t('moodDiary.refImageSaveFailed'))
      }
      if (files.length > room) {
        ElMessage.warning(this.$t('moodDiary.memoryJournal.photosTruncated', { max: this.photoMax }))
      }
    },
    removePhoto(idx) {
      this.photos.splice(idx, 1)
    },
    todayDate() {
      const d = new Date()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${d.getFullYear()}-${m}-${day}`
    },
    async runGenerate() {
      if (!isMoodDiaryLoggedIn()) {
        ElMessage.warning(this.$t('moodDiary.writeNeedLogin'))
        this.$store.commit('showMask')
        return
      }
      if (!this.canGenerate) {
        if (!this.diary.trim()) {
          ElMessage.warning(this.$t('moodDiary.emptyPrompt'))
        } else if (!this.photos.length) {
          ElMessage.warning(this.$t('moodDiary.submitNeedPhoto'))
        }
        return
      }

      this.generating = true
      this.progressLabel = this.$t('moodDiary.memoryJournal.stagePrepare')
      this.resultUrl = ''
      this.analysis = null

      try {
        const { imageUrl, analysis } = await generateMemoryJournalPoster({
          http: this.$http,
          diary: this.diary.trim(),
          photos: this.photos,
          date: this.todayDate(),
          name: this.userName,
          onStage: (s) => {
            this.progressLabel = s?.label || s?.key || this.progressLabel
          }
        })

        this.analysis = analysis || null
        this.resultUrl = imageUrl
        setDraft({
          narrative: this.diary.trim(),
          diaryCaption: analysis?.caption || '',
          rawIllustrationUrl: imageUrl,
          hasRawIllustration: true,
          composedPosterDataUrl: imageUrl,
          hasComposedPoster: true,
          posterMode: 'photo',
          inputMode: 'memory_journal'
        })
        ElMessage.success(this.$t('moodDiary.memoryJournal.generateSuccess'))
      } catch (err) {
        console.warn('[memory-journal] generate failed', err)
        const msg = err?.response?.data?.message || err?.message || this.$t('moodDiary.generateFailed')
        ElMessage.error(msg)
      } finally {
        this.generating = false
        this.progressLabel = ''
      }
    },
    async saveResult() {
      if (!this.resultUrl) return
      this.saving = true
      try {
        const caption = this.analysis?.caption || this.diary.trim().slice(0, 80)
        const res = await saveMoodPoster(this.resultUrl, caption, this.$t.bind(this))
        if (res.cloudOk) {
          ElMessage.success(this.$t('moodDiary.saveToMyCreationSuccess'))
        } else if (res.localOk) {
          ElMessage.success(this.$t('moodDiary.generateSuccess'))
        }
        this.$emit('done')
      } catch (err) {
        ElMessage.error(err?.message || this.$t('moodDiary.saveCreationFailed'))
      } finally {
        this.saving = false
      }
    },
    downloadResult() {
      if (!this.resultUrl) return
      const stamp = this.todayDate().replace(/-/g, '')
      downloadDataUrl(`memory-journal-${stamp}.png`, this.resultUrl)
      ElMessage.success(this.$t('moodDiary.downloadSuccess'))
    },
    resetForRegen() {
      this.resultUrl = ''
      this.analysis = null
      this.progressLabel = ''
    }
  }
}
</script>

<style scoped>
.mj-panel {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 8px 4px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.mj-head {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.mj-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--md-text, #5f5970);
  letter-spacing: 0.02em;
}

.mj-lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--md-muted, #9d96a8);
}

.mj-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.mj-result-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
}

.mj-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-text, #5f5970);
}

.mj-diary {
  width: 100%;
  resize: vertical;
  min-height: 160px;
  padding: 12px 14px;
  border: 1px solid var(--md-border, #e6deef);
  border-radius: 12px;
  background: var(--md-card, #fffcfe);
  color: var(--md-text, #5f5970);
  font-size: 16px;
  line-height: 1.65;
  box-sizing: border-box;
  font-family: inherit;
  -webkit-overflow-scrolling: touch;
}

.mj-diary:focus {
  outline: none;
  border-color: var(--md-accent-deep, #7ecbb8);
  box-shadow: 0 0 0 3px var(--md-accent-soft, #edf8f4);
}

.mj-count {
  margin: 0;
  text-align: right;
  font-size: 11px;
  color: var(--md-muted, #9d96a8);
}

.mj-photos-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.mj-hint {
  font-size: 11px;
  color: var(--md-muted, #9d96a8);
  flex-shrink: 0;
}

.mj-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
}

.mj-photo {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: #f3f0f6;
  border: 1px solid var(--md-border, #e6deef);
}

.mj-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mj-photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.55);
  color: #fff;
  cursor: pointer;
  line-height: 1;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.mj-photo-add {
  aspect-ratio: 1;
  border: 1px dashed var(--md-border, #e6deef);
  border-radius: 10px;
  background: var(--md-accent-soft, #edf8f4);
  color: var(--md-muted, #9d96a8);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 22px;
  line-height: 1;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.mj-photo-add small {
  font-size: 11px;
}

.mj-photo-add:disabled,
.mj-photo-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mj-file {
  display: none;
}

.mj-progress {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--md-accent-deep, #7ecbb8);
  text-align: center;
}

.mj-actions-spacer {
  display: none;
}

.mj-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.mj-generate-btn {
  width: 100%;
  margin: 0 !important;
  border-radius: 12px;
  font-weight: 600;
}

.mj-actions :deep(.el-button--primary) {
  --el-button-bg-color: var(--md-accent, #a8e0d2);
  --el-button-border-color: var(--md-accent, #a8e0d2);
  --el-button-hover-bg-color: var(--md-accent-deep, #7ecbb8);
  --el-button-hover-border-color: var(--md-accent-deep, #7ecbb8);
}

@media (max-width: 768px) {
  .mj-panel {
    max-width: 100%;
    height: auto;
    min-height: 0;
    /* 底部固定按钮 + 站点 TabBar + 安全区 */
    padding: 4px 0 calc(76px + var(--kid-tabbar-h, 58px) + env(safe-area-inset-bottom, 0px));
  }

  .mj-head {
    margin-bottom: 12px;
  }

  .mj-title {
    font-size: 20px;
  }

  .mj-lead {
    font-size: 12px;
  }

  .mj-diary {
    min-height: 140px;
    font-size: 16px; /* 避免 iOS 聚焦自动放大 */
    border-radius: 14px;
  }

  .mj-photos-head {
    flex-wrap: wrap;
    align-items: center;
  }

  .mj-photos {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .mj-photo,
  .mj-photo-add {
    border-radius: 12px;
  }

  .mj-photo-remove {
    top: 6px;
    right: 6px;
    width: 30px;
    height: 30px;
  }

  .mj-actions-spacer {
    display: block;
    height: 8px;
  }

  .mj-actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(var(--kid-tabbar-h, 58px) + env(safe-area-inset-bottom, 0px));
    z-index: 40;
    margin: 0;
    padding: 10px 14px;
    background: linear-gradient(
      180deg,
      rgba(245, 242, 248, 0) 0%,
      rgba(245, 242, 248, 0.92) 28%,
      rgba(245, 242, 248, 0.98) 100%
    );
    backdrop-filter: blur(10px);
    box-sizing: border-box;
  }

  .mj-generate-btn {
    min-height: 48px;
    font-size: 16px;
    border-radius: 14px;
  }

  .mj-result-wrap {
    width: 100%;
    padding-bottom: calc(16px + var(--kid-tabbar-h, 58px) + env(safe-area-inset-bottom, 0px));
  }

  .mj-result-wrap :deep(.poster-result) {
    max-width: 100%;
  }

  .mj-result-wrap :deep(.poster-result__slot) {
    height: min(48vh, 380px);
    transform: rotate(-1.5deg);
  }

  .mj-result-wrap :deep(.poster-result__btn) {
    min-height: 44px;
    border-radius: 12px;
    font-size: 15px;
  }
}

@media (max-width: 380px) {
  .mj-photos {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .mj-photo-add small {
    font-size: 10px;
  }
}
</style>
