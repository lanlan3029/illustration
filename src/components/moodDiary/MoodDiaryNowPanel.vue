<template>
  <div class="now-panel" :class="[`now-panel--${atmosphere.key}`, { 'now-panel--has-mood': moodObj, 'now-panel--dialog': inDialog }]" :style="atmosphereStyle">
    <nav class="now-diary-tabs" role="tablist" :aria-label="$t('moodDiary.writeDialogTitle')">
      <button
        type="button"
        role="tab"
        class="now-diary-tab"
        :class="{ 'now-diary-tab--active': diaryTab === 'photo' }"
        :aria-selected="diaryTab === 'photo' ? 'true' : 'false'"
        @click="selectDiaryTab('photo')"
      >
        {{ $t('moodDiary.tabPhotoDiary') }}
      </button>
      <button
        type="button"
        role="tab"
        class="now-diary-tab"
        :class="{ 'now-diary-tab--active': diaryTab === 'illustration' }"
        :aria-selected="diaryTab === 'illustration' ? 'true' : 'false'"
        @click="selectDiaryTab('illustration')"
      >
        {{ $t('moodDiary.tabIllustrationDiary') }}
      </button>
    </nav>

    <header v-if="narrative.trim() || moodObj" class="now-hero now-hero--toolbar">
      <button
        type="button"
        class="now-clear-btn"
        @click="clearLocal"
      >
        {{ $t('moodDiary.clearEntry') }}
      </button>
    </header>

    <section class="now-mood-hero" :aria-label="$t('moodDiary.question')">
      <template v-if="moodObj && !showMoodPicker">
        <button type="button" class="now-mood-featured" @click="showMoodPicker = true">
          <img :src="moodObj.src" :alt="moodObj.label" class="now-mood-featured-img" />
          <span class="now-mood-featured-label">{{ moodObj.label }}</span>
          <span class="now-mood-featured-change">{{ $t('moodDiary.changeMood') }}</span>
        </button>
      </template>
      <template v-else>
        <div class="now-primary-moods" role="group">
          <button
            v-for="m in quickMoods"
            :key="m.id"
            type="button"
            class="now-mood-btn"
            :class="{ 'now-mood-btn--picked': moodObj && moodObj.id === m.id }"
            @click="selectMood(m)"
          >
            <span class="now-mood-btn-ring">
              <img :src="m.src" :alt="m.label" />
            </span>
            <span class="now-mood-btn-label">{{ m.label }}</span>
          </button>
        </div>
        <button type="button" class="now-more-btn" @click="showExtraMoods = !showExtraMoods">
          {{ showExtraMoods ? $t('moodDiary.collapseMoreMoods') : $t('moodDiary.moreMoods') }}
        </button>
        <div v-show="showExtraMoods" class="now-extra-moods">
          <button
            v-for="m in extraMoods"
            :key="m.id"
            type="button"
            class="now-mood-btn"
            :class="{ 'now-mood-btn--picked': moodObj && moodObj.id === m.id }"
            @click="selectMood(m)"
          >
            <span class="now-mood-btn-ring">
              <img :src="m.src" :alt="m.label" />
            </span>
            <span class="now-mood-btn-label">{{ m.label }}</span>
          </button>
        </div>
      </template>
    </section>

    <div class="now-compose-grid">
      <div class="now-compose-main">
        <section
          class="now-memory-zone"
          :class="{
            'now-memory-zone--accent': moodObj,
            'now-memory-zone--drag': refDragOver,
            'now-memory-zone--filled': !!refPreview,
            'now-memory-zone--required-missing': isPhotoTab && !refPreview
          }"
          :aria-label="refImageLabel"
          @dragover.prevent="onRefDragOver"
          @dragleave.prevent="onRefDragLeave"
          @drop.prevent="onRefDrop"
        >
          <input
            ref="refInput"
            type="file"
            accept="image/*"
            class="hidden-file"
            tabindex="-1"
            @change="onRefFile"
          />
          <p class="now-memory-label">{{ refImageLabel }}</p>

          <div v-if="refPreview" class="now-ref-preview">
            <div class="now-ref-preview-media">
              <img :src="refPreview" class="now-ref-preview-img" alt="" />
            </div>
            <div class="now-ref-preview-bar">
              <button type="button" class="now-ref-preview-btn" @click="$refs.refInput.click()">
                {{ $t('moodDiary.replaceRefImage') }}
              </button>
              <button
                type="button"
                class="now-ref-preview-btn now-ref-preview-btn--ghost"
                @click="clearRef"
              >
                {{ $t('moodDiary.removeRefImage') }}
              </button>
            </div>
          </div>

          <button
            v-else
            type="button"
            class="now-memory-entry"
            @click="$refs.refInput.click()"
          >
            <span class="now-memory-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
                <path d="M21 16l-5.5-5.5a2 2 0 0 0-2.8 0L3 18" />
              </svg>
            </span>
            <span class="now-memory-title">{{ $t('moodDiary.pickRefImage') }}</span>
            <span class="now-memory-hint">{{ $t('moodDiary.refUploadDragHint') }}</span>
          </button>
        </section>

        <div class="now-input-wrap" :class="{ 'now-input-wrap--accent': moodObj }">
          <el-input
            v-model="narrative"
            type="textarea"
            :rows="inDialog ? 6 : 5"
            :placeholder="entryPlaceholder"
            maxlength="240"
            show-word-limit
            class="now-entry-input"
          />
        </div>

        <div class="now-panel-foot">
          <el-tooltip :content="submitTooltip" :disabled="canSubmit" placement="top">
            <span class="now-submit-wrap">
              <el-button
                type="primary"
                class="now-submit"
                :class="`now-submit--${atmosphere.key}`"
                :disabled="!canSubmit"
                @click="startPosterFlow"
              >
                {{ $t('moodDiary.nextToGenerate') }}
              </el-button>
            </span>
          </el-tooltip>
          <p v-if="isIllustrationTab" class="now-submit-points-hint">
            {{ $t('moodDiary.illustrationDiaryPointsHint') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { checkTextSafe } from '@/utils/moodDiary/checkTextSafe'
import { dataUrlToPathHint, getDraft, setDraft } from '@/utils/moodDiary/draft'
import { findMoodById, quickMoodIds, resolveMoodList } from '@/utils/moodDiary/moodAssets'
import {
  atmosphereCssVars,
  getMoodAtmosphere
} from '@/utils/moodDiary/moodTheme'

const HIDDEN_EXTRA_MOOD_IDS = new Set(['heart', 'thumbs-up', 'star-eyes'])

export default {
  name: 'MoodDiaryNowPanel',
  props: {
    inDialog: { type: Boolean, default: false }
  },
  emits: ['submitted', 'mood-change'],
  data() {
    return {
      narrative: '',
      moodObj: null,
      refPreview: null,
      refFile: null,
      refDataUrl: null,
      showExtraMoods: false,
      showMoodPicker: false,
      refDragOver: false,
      diaryTab: 'photo'
    }
  },
  computed: {
    isPhotoTab() {
      return this.diaryTab === 'photo'
    },
    isIllustrationTab() {
      return this.diaryTab === 'illustration'
    },
    refImageLabel() {
      return this.isPhotoTab
        ? this.$t('moodDiary.refImageRequired')
        : this.$t('moodDiary.refImageOptional')
    },
    hasNarrative() {
      return !!(this.narrative || '').trim()
    },
    canSubmit() {
      if (!this.hasNarrative) return false
      if (this.refFile && !this.refDataUrl) return false
      if (this.isPhotoTab) return !!this.resolveRefImageDataUrl()
      return true
    },
    submitTooltip() {
      if (!this.hasNarrative) return this.$t('moodDiary.submitNeedNarrative')
      if (this.refFile && !this.refDataUrl) return this.$t('moodDiary.refImageLoading')
      if (this.isPhotoTab && !this.resolveRefImageDataUrl()) return this.$t('moodDiary.submitNeedPhoto')
      return ''
    },
    atmosphere() {
      return getMoodAtmosphere(this.moodObj?.id)
    },
    atmosphereStyle() {
      return atmosphereCssVars(this.moodObj?.id)
    },
    entryPlaceholder() {
      return this.$t(this.atmosphere.placeholderKey)
    },
    moods() {
      const isZh = this.$i18n?.locale === 'zh'
      return resolveMoodList(isZh)
    },
    quickMoods() {
      const map = new Map(this.moods.map((m) => [m.id, m]))
      return quickMoodIds.map((id) => map.get(id)).filter(Boolean)
    },
    extraMoods() {
      const quick = new Set(quickMoodIds)
      return this.moods.filter((m) => !quick.has(m.id) && !HIDDEN_EXTRA_MOOD_IDS.has(m.id))
    }
  },
  watch: {
    narrative() {
      this.persist()
    },
    moodObj(val) {
      this.persist()
      this.$emit('mood-change', val ? val.id : null)
    }
  },
  mounted() {
    this.hydrate()
    this.$emit('mood-change', this.moodObj ? this.moodObj.id : null)
  },
  methods: {
    hydrate() {
      const d = getDraft()
      this.narrative = typeof d.narrative === 'string' ? d.narrative : ''
      const isZh = this.$i18n?.locale === 'zh'
      this.moodObj = findMoodById(d.moodEmojiId || d.mood, isZh)
      if (d.inputImageDataUrl) {
        this.refPreview = d.inputImageDataUrl
        this.refDataUrl = d.inputImageDataUrl
      }
      if (d.posterMode === 'photo' || d.posterMode === 'illustration') {
        this.diaryTab = d.posterMode
      }
      const sid = this.moodObj?.id
      if (sid && !quickMoodIds.includes(sid)) {
        this.showExtraMoods = true
      }
    },
    selectMood(m) {
      this.moodObj = m
      this.showExtraMoods = false
      this.showMoodPicker = false
    },
    selectDiaryTab(tab) {
      if (this.diaryTab === tab) return
      this.diaryTab = tab
      setDraft({ posterMode: tab })
    },
    resolveRefImageDataUrl() {
      return this.refDataUrl || this.refPreview || getDraft().inputImageDataUrl || ''
    },
    buildRefImageDraftFields(imageDataUrl) {
      if (!imageDataUrl) return {}
      return {
        inputImageDataUrl: imageDataUrl,
        inputImageName: this.refFile?.name || getDraft().inputImageName || 'image.jpg',
        inputImagePath: dataUrlToPathHint(this.refFile?.name || getDraft().inputImageName || 'image.jpg')
      }
    },
    applyRefFile(file) {
      if (!file || !file.type.startsWith('image/')) return
      if (file.size > 6 * 1024 * 1024) {
        ElMessage.warning(this.$t('moodDiary.refTooLarge'))
        return
      }
      this.refFile = file
      const reader = new FileReader()
      reader.onload = () => {
        this.refPreview = reader.result
        this.refDataUrl = reader.result
        setDraft({
          inputImageDataUrl: reader.result,
          inputImagePath: dataUrlToPathHint(file.name),
          inputImageName: file.name || 'image.jpg',
          imageVisionCache: null
        })
      }
      reader.readAsDataURL(file)
    },
    onRefDragOver() {
      this.refDragOver = true
    },
    onRefDragLeave() {
      this.refDragOver = false
    },
    onRefDrop(ev) {
      this.refDragOver = false
      const file = ev.dataTransfer?.files?.[0]
      if (file) this.applyRefFile(file)
    },
    persist() {
      setDraft({
        narrative: this.narrative,
        moodEmojiId: this.moodObj ? this.moodObj.id : null,
        moodLabel: this.moodObj ? this.moodObj.label : '',
        mood: this.moodObj ? this.moodObj.id : ''
      })
    },
    clearLocal() {
      this.narrative = ''
      this.moodObj = null
      this.showMoodPicker = false
      this.diaryTab = 'photo'
      this.clearRef()
      setDraft({
        narrative: '',
        moodEmojiId: null,
        moodLabel: '',
        mood: '',
        posterMode: '',
        rawIllustrationUrl: null,
        composedPosterDataUrl: null,
        posterGenerating: false,
        imageVisionCache: null,
        sceneDescription: '',
        diaryCaption: '',
        quotaSentence: ''
      })
    },
    clearRef() {
      this.refPreview = null
      this.refFile = null
      this.refDataUrl = null
      setDraft({
        inputImageDataUrl: null,
        inputImagePath: null,
        inputImageName: '',
        imageVisionCache: null,
        sceneDescription: '',
        diaryCaption: '',
        quotaSentence: ''
      })
    },
    onRefFile(ev) {
      const file = ev.target.files && ev.target.files[0]
      ev.target.value = ''
      if (file) this.applyRefFile(file)
    },
    async startPosterFlow() {
      if (!this.hasNarrative) {
        ElMessage.info(this.$t('moodDiary.submitNeedNarrative'))
        return
      }
      const mode = this.diaryTab
      const imageDataUrl = this.resolveRefImageDataUrl()
      if (mode === 'photo' && !imageDataUrl) {
        ElMessage.info(this.$t('moodDiary.submitNeedPhoto'))
        return
      }
      const safe = checkTextSafe(this.narrative, (k) => this.$t(k))
      if (!safe.ok) {
        ElMessage.warning(safe.message)
        return
      }
      if (this.refFile && !this.refDataUrl) {
        ElMessage.info(this.$t('moodDiary.refImageLoading'))
        return
      }
      setDraft({
        narrative: this.narrative.trim(),
        moodEmojiId: this.moodObj ? this.moodObj.id : null,
        moodLabel: this.moodObj ? this.moodObj.label : '',
        mood: this.moodObj ? this.moodObj.id : '',
        ...(imageDataUrl
          ? this.buildRefImageDraftFields(imageDataUrl)
          : mode === 'illustration'
            ? {
                inputImageDataUrl: null,
                inputImagePath: null,
                inputImageName: '',
                imageVisionCache: null
              }
            : {}),
        composedPosterDataUrl: null,
        rawIllustrationUrl: null,
        posterGenerating: false,
        posterMode: mode
      })
      const saved = getDraft()
      if (mode === 'photo' && !saved.inputImageDataUrl) {
        ElMessage.warning(this.$t('moodDiary.refImageSaveFailed'))
        return
      }
      this.$emit('submitted')
      this.$router.push('/mood-diary/generate')
    }
  }
}
</script>

<style scoped>
.now-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 20px 24px;
  box-sizing: border-box;
  background: var(--md-atm-hero, #fff);
  transition: background 0.6s ease;
  overflow-y: auto;
}

.now-diary-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 16px;
  padding: 4px;
  border-radius: 999px;
  background: var(--md-sky-soft, #edf6fc);
  border: 1px solid rgba(184, 223, 240, 0.45);
  box-shadow: inset 0 1px 2px rgba(184, 223, 240, 0.12);
}

.now-diary-tab {
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--md-muted);
  cursor: pointer;
  transition:
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;
}

.now-diary-tab:hover:not(.now-diary-tab--active) {
  color: var(--md-text);
  background: rgba(255, 255, 255, 0.55);
}

.now-diary-tab--active {
  background: var(--md-sky, #b8dff0);
  color: #fff;
  box-shadow:
    0 2px 10px rgba(142, 184, 212, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.now-diary-tab--active:hover {
  color: #fff;
  filter: brightness(0.97);
}

.now-hero {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.now-hero--toolbar {
  display: flex;
  justify-content: flex-end;
}

.now-clear-btn {
  border: none;
  background: transparent;
  color: var(--md-muted);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
}

.now-clear-btn:hover {
  color: var(--md-text);
  background: rgba(255, 255, 255, 0.5);
}

.now-mood-hero {
  flex-shrink: 0;
  margin-bottom: 18px;
  padding: 18px 14px 16px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 8px 24px rgba(0, 0, 0, 0.04);
}

.now-primary-moods {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: clamp(4px, 1.2vw, 10px);
}

.now-mood-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1 1 0;
  min-width: 0;
  padding: 4px 2px;
  transition: transform 0.2s ease;
}

.now-mood-btn:hover {
  transform: translateY(-3px) scale(1.03);
}

.now-mood-btn-ring {
  width: clamp(52px, 11vw, 64px);
  height: clamp(52px, 11vw, 64px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 6px 16px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.25s ease, background 0.25s ease;
}

.now-mood-btn--picked .now-mood-btn-ring,
.now-panel--has-mood .now-mood-btn:hover .now-mood-btn-ring {
  box-shadow:
    0 0 0 3px var(--now-mood-soft, rgba(255, 255, 255, 0.5)),
    0 0 0 5px var(--now-mood-accent, var(--md-accent));
}

.now-mood-btn img {
  width: clamp(38px, 8vw, 46px);
  height: clamp(38px, 8vw, 46px);
  object-fit: contain;
}

.now-mood-btn-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--md-text);
  max-width: 100%;
  text-align: center;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.now-mood-featured {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.now-mood-featured-img {
  width: 88px;
  height: 88px;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.08));
}

.now-mood-featured-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--md-text);
}

.now-mood-featured-change {
  font-size: 12px;
  color: var(--md-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.now-more-btn {
  display: block;
  margin: 14px auto 0;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  padding: 6px 14px;
  font-size: 11px;
  color: var(--md-muted);
  border-radius: 999px;
  cursor: pointer;
}

.now-extra-moods {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px 8px;
  margin-top: 12px;
}

.now-extra-moods .now-mood-btn {
  flex: none;
  width: 100%;
}

.now-compose-grid {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.now-panel--dialog {
  height: auto;
  min-height: min(68vh, 700px);
  overflow: visible;
}

.now-panel--dialog .now-diary-tabs {
  margin-top: 0;
  border-radius: 999px;
}

.now-panel--dialog .now-diary-tab {
  font-size: 12px;
  padding: 10px 8px;
  line-height: 1.35;
}

.now-panel--dialog .now-compose-main {
  gap: 14px;
}

.now-compose-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.now-memory-zone {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.now-memory-zone--accent .now-memory-entry {
  border-color: var(--now-mood-soft, rgba(94, 184, 232, 0.35));
  background: var(--now-mood-soft, rgba(248, 250, 252, 0.9));
}

.now-memory-zone--drag .now-memory-entry {
  border-color: var(--now-mood-accent, var(--md-accent));
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px var(--now-mood-soft, rgba(94, 184, 232, 0.2));
}

.now-memory-zone--required-missing .now-memory-entry {
  border-color: rgba(239, 68, 68, 0.45);
  background: rgba(254, 242, 242, 0.65);
}

.now-memory-zone--required-missing .now-memory-label {
  color: #dc2626;
}

.now-memory-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--md-muted);
  letter-spacing: 0.02em;
}

.now-memory-entry {
  width: 100%;
  min-height: 112px;
  border: 1.5px dashed var(--md-border);
  border-radius: 16px;
  background: var(--md-surface, #f8fafc);
  padding: 20px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.now-memory-entry:hover {
  border-color: var(--now-mood-accent, var(--md-accent));
  background: #fff;
}

.now-memory-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #fff;
  color: var(--now-mood-accent, var(--md-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.now-memory-icon svg {
  width: 22px;
  height: 22px;
}

.now-memory-title {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text);
}

.now-memory-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--md-muted);
  text-align: center;
}

.now-ref-preview {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--md-border);
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.now-ref-preview-media {
  height: 140px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
  background: var(--md-surface, #f8fafc);
  overflow: hidden;
}

.now-ref-preview-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
}

.now-ref-preview-bar {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: var(--md-surface, #f8fafc);
  border-top: 1px solid var(--md-border);
}

.now-ref-preview-btn {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: var(--now-mood-accent, var(--md-accent));
  color: #fff;
  transition: filter 0.2s ease;
}

.now-ref-preview-btn:hover {
  filter: brightness(1.05);
}

.now-ref-preview-btn--ghost {
  flex: 0 0 auto;
  background: transparent;
  color: var(--md-muted);
  border: 1px solid var(--md-border);
}

.now-ref-preview-btn--ghost:hover {
  color: var(--md-text);
  background: #fff;
  filter: none;
}

.now-panel--dialog .now-memory-zone {
  margin: 0;
}

.now-panel--dialog .now-memory-entry {
  min-height: 128px;
  border-radius: 20px;
}

.now-panel--dialog .now-ref-preview {
  border-radius: 20px;
}

.now-panel--dialog .now-input-wrap {
  border-radius: 20px;
  min-height: 132px;
}

.now-panel--dialog .now-mood-hero {
  margin-bottom: 4px;
  padding: 14px 12px 12px;
  border-radius: 22px;
  background: var(--md-surface, #f8fafc);
  border: 1px solid var(--md-border);
  box-shadow: none;
}

.now-panel--dialog .now-entry-input :deep(.el-textarea__inner) {
  min-height: 108px;
}

.now-panel--dialog .now-mood-featured-img {
  width: 72px;
  height: 72px;
}

.now-input-wrap {
  flex: 1;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--md-border);
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.now-input-wrap--accent {
  border-color: var(--now-mood-accent, var(--md-border));
  box-shadow:
    0 0 0 1px var(--now-mood-soft, transparent),
    0 8px 28px rgba(0, 0, 0, 0.06);
}

.now-entry-input :deep(.el-textarea__inner) {
  min-height: 88px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 8px 14px 12px;
  resize: none;
  font-size: 14px;
  line-height: 1.65;
}

.now-panel-foot :deep(.el-button) {
  width: 100%;
  border-radius: 999px;
  font-weight: 600;
  height: 46px;
  border: none;
  background: var(--now-mood-accent, var(--md-accent));
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: transform 0.35s ease, box-shadow 0.35s ease, opacity 0.35s ease;
}

.now-submit-points-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 11px;
  color: var(--md-muted);
  line-height: 1.3;
}

.now-panel--sad .now-panel-foot :deep(.el-button:not(.is-disabled)),
.now-panel--lonely .now-panel-foot :deep(.el-button:not(.is-disabled)) {
  animation: none;
}

.now-panel-foot :deep(.el-button:not(.is-disabled):hover) {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.now-panel-foot :deep(.el-button.is-disabled) {
  background: rgba(0, 0, 0, 0.08);
  color: var(--md-muted);
}

.now-submit-wrap {
  display: block;
  width: 100%;
}

.hidden-file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}
</style>
