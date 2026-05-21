<template>
  <div class="poster-wizard">
    <template v-if="step === 'result' && posterUrl">
      <MoodDiaryPosterResult
        :poster-url="posterUrl"
        :saving="saving"
        :loading="generating"
        :show-back-to-write="false"
        @save="savePoster"
        @download="downloadPoster"
        @regenerate="backToTemplate"
      />
    </template>

    <template v-else>
      <header class="wizard-head">
        <button v-if="step !== 'mode'" type="button" class="wizard-back" @click="goBack">
          ← {{ $t('moodDiary.wizardBack') }}
        </button>
        <h1 class="wizard-title">{{ stepTitle }}</h1>
        <p v-if="stepHint" class="wizard-hint">{{ stepHint }}</p>
      </header>

      <!-- Step 1: 模式 -->
      <div v-if="step === 'mode'" class="wizard-body">
        <div v-if="hasPhoto" class="mode-cards">
          <button
            type="button"
            class="mode-card"
            :class="{ 'mode-card--active': posterMode === 'photo' }"
            @click="posterMode = 'photo'"
          >
            <span class="mode-card__title">{{ $t('moodDiary.posterModePhoto') }}</span>
            <span class="mode-card__desc">{{ $t('moodDiary.posterModePhotoDesc') }}</span>
          </button>
          <button
            type="button"
            class="mode-card"
            :class="{ 'mode-card--active': posterMode === 'illustration' }"
            @click="posterMode = 'illustration'"
          >
            <span class="mode-card__title">{{ $t('moodDiary.posterModeIllustration') }}</span>
            <span class="mode-card__desc">{{ $t('moodDiary.posterModeIllustrationDesc') }}</span>
          </button>
        </div>
        <p v-else class="wizard-note">{{ $t('moodDiary.posterModeNoPhotoHint') }}</p>
      </div>

      <!-- Step 2: 风格 -->
      <div v-else-if="step === 'style'" class="wizard-body">
        <div class="style-strip">
          <button
            v-for="style in popularStyles"
            :key="style.id"
            type="button"
            class="style-chip"
            :class="{ active: selectedStyleId === style.id }"
            @click="selectedStyleId = style.id"
          >
            <img :src="style.image" :alt="style.artStyle" />
            <span>{{ style.artStyle }}</span>
          </button>
        </div>
      </div>

      <!-- Step 3: 模版 -->
      <div v-else-if="step === 'template'" class="wizard-body wizard-body--template">
        <div v-loading="templatePreviewsBusy" class="template-grid">
          <button
            v-for="tpl in templateList"
            :key="tpl.id"
            type="button"
            class="template-card"
            :class="{ 'template-card--active': templateId === tpl.id }"
            @click="selectTemplate(tpl.id)"
          >
            <div class="template-card__preview">
              <img
                v-if="templatePreviews[tpl.id]"
                :src="templatePreviews[tpl.id]"
                :alt="$t(tpl.nameKey)"
                class="template-card__img"
              />
              <div v-else class="template-card__placeholder" aria-hidden="true" />
            </div>
            <span class="template-card__name">{{ $t(tpl.nameKey) }}</span>
          </button>
        </div>

        <div v-if="templateId === 'colorBlock'" class="placement-row">
          <span class="placement-label">{{ $t('moodDiary.posterColorBlockPlacement') }}</span>
          <el-radio-group v-model="colorBlockPlacement" size="small" @change="scheduleTemplatePreviews">
            <el-radio-button label="top">{{ $t('moodDiary.placementTop') }}</el-radio-button>
            <el-radio-button label="bottom">{{ $t('moodDiary.placementBottom') }}</el-radio-button>
            <el-radio-button label="left">{{ $t('moodDiary.placementLeft') }}</el-radio-button>
            <el-radio-button label="right">{{ $t('moodDiary.placementRight') }}</el-radio-button>
          </el-radio-group>
        </div>

        <p v-if="stepLog" class="step-log">{{ stepLog }}</p>
      </div>

      <footer class="wizard-foot">
        <el-button type="primary" :loading="generating" :disabled="!canNext" @click="onPrimary">
          {{ primaryLabel }}
        </el-button>
      </footer>
    </template>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import MoodDiaryPosterResult from '@/components/moodDiary/MoodDiaryPosterResult.vue'
import { isMoodDiaryLoggedIn } from '@/utils/moodDiary/auth'
import { getDraft, setDraft, resolvePosterMode } from '@/utils/moodDiary/draft'
import { popularStyleConfigs } from '@/utils/moodDiary/moodAssets'
import { composePosterFromDraft, runPosterPipeline } from '@/utils/moodDiary/posterPipeline'
import { ensurePosterDescribe } from '@/utils/moodDiary/posterDescribe'
import { POSTER_TEMPLATE_META } from '@/utils/moodDiary/posters'
import { getPosterTemplatePref, savePosterTemplatePref } from '@/utils/moodDiary/posterTemplatePref'
import { downloadMoodPosterDataUrl, saveMoodPoster } from '@/utils/moodDiary/posterActions'

export default {
  name: 'MoodDiaryPosterWizard',
  components: { MoodDiaryPosterResult },
  emits: ['done'],
  data() {
    const pref = getPosterTemplatePref()
    const d = getDraft()
    return {
      step: 'mode',
      posterMode:
        d.posterMode === 'photo' || d.posterMode === 'illustration' ? d.posterMode : 'illustration',
      selectedStyleId: Number(d.artStyleId) || 1,
      templateId: d.posterTemplateId || pref.templateId || 'creamCard',
      colorBlockPlacement: d.colorBlockPlacement || pref.colorBlockPlacement || 'top',
      imagePlacement: d.imagePlacement || pref.imagePlacement || 'below',
      templatePreviews: {},
      templatePreviewsBusy: false,
      previewTimer: null,
      posterUrl: d.composedPosterDataUrl || '',
      diaryCaptionLine: d.diaryCaption || d.quotaSentence || '',
      generating: false,
      saving: false,
      stepLog: ''
    }
  },
  computed: {
    draft() {
      return getDraft()
    },
    hasPhoto() {
      return !!this.draft.inputImageDataUrl
    },
    hasNarrative() {
      return !!(this.draft.narrative || '').trim()
    },
    popularStyles() {
      return popularStyleConfigs.map((config) => ({
        id: config.id,
        key: config.key,
        image: config.image,
        artStyle: this.$t(`aibooks.styles.${config.key}.artStyle`),
        elementDetails: this.$t(`aibooks.styles.${config.key}.elementDetails`)
      }))
    },
    selectedStyle() {
      return this.popularStyles.find((s) => s.id === this.selectedStyleId) || this.popularStyles[0]
    },
    templateList() {
      return POSTER_TEMPLATE_META
    },
    stepTitle() {
      if (this.step === 'mode') return this.$t('moodDiary.wizardStepMode')
      if (this.step === 'style') return this.$t('moodDiary.wizardStepStyle')
      return this.$t('moodDiary.wizardStepTemplate')
    },
    stepHint() {
      if (this.step === 'mode' && this.hasPhoto) return this.$t('moodDiary.wizardStepModeHint')
      if (this.step === 'style') return this.$t('moodDiary.wizardStepStyleHint')
      if (this.step === 'template') return this.$t('moodDiary.wizardStepTemplateHint')
      return ''
    },
    primaryLabel() {
      if (this.step === 'template') {
        return this.generating ? this.$t('moodDiary.generating') : this.$t('moodDiary.startGeneratePipeline')
      }
      return this.$t('moodDiary.wizardNext')
    },
    canNext() {
      if (!this.hasNarrative) return false
      if (this.step === 'mode' && this.posterMode === 'photo' && !this.hasPhoto) return false
      return true
    },
    locale() {
      return this.$i18n?.locale === 'en' ? 'en' : 'zh'
    }
  },
  mounted() {
    if (!this.hasNarrative) {
      this.$router.replace({ path: '/mood-diary/narrative', query: { write: '1' } })
      return
    }
    if (this.posterUrl) {
      this.step = 'result'
      return
    }
    const presetMode = this.draft.posterMode
    if (presetMode === 'photo') {
      this.posterMode = 'photo'
      if (!this.hasPhoto) {
        ElMessage.warning(this.$t('moodDiary.submitNeedPhoto'))
        this.$router.replace({ path: '/mood-diary/narrative', query: { write: '1' } })
        return
      }
      this.step = 'template'
    } else if (presetMode === 'illustration') {
      this.posterMode = 'illustration'
      this.step = 'style'
    } else if (this.hasPhoto) {
      this.step = 'mode'
      this.posterMode = resolvePosterMode(this.draft)
    } else {
      this.posterMode = 'illustration'
      this.step = 'style'
    }
    this.syncDraftMeta()
    if (this.step === 'template') {
      this.scheduleTemplatePreviews()
    }
  },
  watch: {
    step(val) {
      if (val === 'template') {
        this.scheduleTemplatePreviews()
      }
    }
  },
  beforeUnmount() {
    if (this.previewTimer) clearTimeout(this.previewTimer)
  },
  methods: {
    syncDraftMeta() {
      setDraft({
        posterMode: this.posterMode,
        posterTemplateId: this.templateId,
        artStyleId: this.selectedStyleId,
        artStyle: this.selectedStyle?.artStyle || '',
        artStyleElementDetails: this.selectedStyle?.elementDetails || '',
        colorBlockPlacement: this.colorBlockPlacement,
        imagePlacement: this.imagePlacement
      })
    },
    selectTemplate(id) {
      this.templateId = id
      this.syncDraftMeta()
    },
    resolvePreviewImageSource() {
      const d = getDraft()
      if (this.posterMode === 'photo') {
        return d.inputImageDataUrl || ''
      }
      return d.rawIllustrationUrl || d.inputImageDataUrl || this.selectedStyle?.image || ''
    },
    scheduleTemplatePreviews() {
      if (this.previewTimer) clearTimeout(this.previewTimer)
      this.previewTimer = setTimeout(() => this.refreshAllTemplatePreviews(), 280)
    },
    async refreshAllTemplatePreviews() {
      const previewImage = this.resolvePreviewImageSource()
      if (!previewImage) {
        this.templatePreviews = {}
        return
      }
      this.templatePreviewsBusy = true
      try {
        const d = getDraft()
        if (d.inputImageDataUrl && this.posterMode === 'photo') {
          await ensurePosterDescribe(d, { illustrationStyle: this.selectedStyle?.artStyle })
        }
        const draft = getDraft()
        const entries = await Promise.all(
          this.templateList.map(async (tpl) => {
            try {
              const url = await composePosterFromDraft(draft, {
                posterMode: this.posterMode,
                templateId: tpl.id,
                previewImageUrl: previewImage,
                colorBlockPlacement:
                  tpl.id === 'colorBlock' ? this.colorBlockPlacement : draft.colorBlockPlacement || 'top',
                imagePlacement: this.imagePlacement,
                locale: this.locale
              })
              return [tpl.id, url]
            } catch (_) {
              return [tpl.id, '']
            }
          })
        )
        this.templatePreviews = Object.fromEntries(entries.filter(([, url]) => url))
      } finally {
        this.templatePreviewsBusy = false
      }
    },
    goBack() {
      const modeLocked = this.draft.posterMode === 'photo' || this.draft.posterMode === 'illustration'
      if (this.step === 'template') {
        if (this.posterMode === 'illustration') {
          this.step = 'style'
        } else if (modeLocked) {
          this.$router.replace({ path: '/mood-diary/narrative', query: { write: '1' } })
        } else {
          this.step = 'mode'
        }
        return
      }
      if (this.step === 'style') {
        if (modeLocked) {
          this.$router.replace({ path: '/mood-diary/narrative', query: { write: '1' } })
        } else {
          this.step = 'mode'
        }
      }
    },
    onPrimary() {
      if (this.step === 'mode') {
        this.syncDraftMeta()
        if (this.posterMode === 'illustration') {
          this.step = 'style'
        } else {
          if (!this.draft.inputImageDataUrl) {
            ElMessage.warning(this.$t('moodDiary.submitNeedPhoto'))
            return
          }
          this.step = 'template'
          this.scheduleTemplatePreviews()
        }
        return
      }
      if (this.step === 'style') {
        this.syncDraftMeta()
        this.step = 'template'
        this.scheduleTemplatePreviews()
        return
      }
      this.runGenerate()
    },
    async runGenerate() {
      if (this.posterMode === 'illustration' && !isMoodDiaryLoggedIn()) {
        ElMessage.warning(this.$t('moodDiary.writeNeedLogin'))
        this.$store.commit('showMask')
        return
      }
      const draft = getDraft()
      const posterMode = draft.posterMode || this.posterMode
      this.posterMode = posterMode
      if (posterMode === 'photo' && !draft.inputImageDataUrl) {
        ElMessage.warning(this.$t('moodDiary.submitNeedPhoto'))
        this.$router.replace({ path: '/mood-diary/narrative', query: { write: '1' } })
        return
      }
      this.generating = true
      this.stepLog = ''
      this.syncDraftMeta()
      savePosterTemplatePref({
        templateId: this.templateId,
        colorBlockPlacement: this.colorBlockPlacement,
        imagePlacement: this.imagePlacement
      })
      try {
        const draft = getDraft()
        const result = await runPosterPipeline({
          posterMode: draft.posterMode || this.posterMode,
          templateId: this.templateId,
          artStyle: this.selectedStyle?.artStyle,
          elementDetails: this.selectedStyle?.elementDetails,
          artStyleId: this.selectedStyleId,
          colorBlockPlacement: this.colorBlockPlacement,
          imagePlacement: this.imagePlacement,
          locale: this.locale,
          onStep: (key) => {
            if (key === 'describe') this.stepLog = this.$t('moodDiary.stepImageDescribe')
            if (key === 'illustrate') this.stepLog = this.$t('moodDiary.stepCreateCharacter')
            if (key === 'compose') this.stepLog = this.$t('moodDiary.stepCompose')
          }
        })
        this.posterUrl = result.posterUrl
        this.diaryCaptionLine = result.diaryCaptionLine
        this.step = 'result'
        ElMessage.success(this.$t('moodDiary.generateSuccess'))
      } catch (e) {
        const msg =
          e.message === 'photo mode requires image'
            ? this.$t('moodDiary.submitNeedPhoto')
            : e.message || this.$t('moodDiary.generateFailed')
        ElMessage.error(msg)
      } finally {
        this.generating = false
        this.stepLog = ''
      }
    },
    backToTemplate() {
      this.step = 'template'
      this.posterUrl = ''
      setDraft({ composedPosterDataUrl: null })
      this.scheduleTemplatePreviews()
    },
    downloadPoster() {
      downloadMoodPosterDataUrl(this.posterUrl)
      ElMessage.success(this.$t('moodDiary.downloadSuccess'))
    },
    async savePoster() {
      if (!this.posterUrl) return
      this.saving = true
      try {
        await saveMoodPoster(this.posterUrl, this.diaryCaptionLine, (k) => this.$t(k))
        ElMessage.success(this.$t('moodDiary.saveToMyCreationSuccess'))
        this.$emit('done')
        this.$router.replace('/mood-diary/narrative')
      } catch (e) {
        ElMessage.error(e.message || this.$t('moodDiary.saveCreationFailed'))
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.poster-wizard {
  width: 100%;
  max-width: 720px;
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 8px 4px 12px;
  box-sizing: border-box;
}

.wizard-head {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.wizard-back {
  border: none;
  background: transparent;
  color: var(--md-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 0 0 8px;
  font-family: inherit;
}

.wizard-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: var(--md-text);
}

.wizard-hint,
.wizard-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--md-muted);
}

.wizard-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.wizard-body--template {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  border: 1.5px solid var(--md-border);
  background: rgba(255, 252, 254, 0.92);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.mode-card--active {
  border-color: var(--md-accent-deep);
  box-shadow: 0 0 0 2px rgba(168, 224, 210, 0.35);
}

.mode-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--md-text);
}

.mode-card__desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--md-muted);
}

.style-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.template-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
  border: 1.5px solid var(--md-border);
  background: var(--md-card);
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.template-card--active {
  border-color: var(--md-accent-deep);
  box-shadow: 0 0 0 2px rgba(168, 224, 210, 0.35);
}

.template-card__preview {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  border-radius: 8px;
  overflow: hidden;
  background: var(--md-surface);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.template-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.template-card__placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%);
}

.template-card__name {
  font-size: 11px;
  line-height: 1.35;
  color: var(--md-text);
  padding: 0 2px 2px;
}

.template-card--active .template-card__name {
  color: var(--md-accent-deep);
  font-weight: 600;
}

.style-chip {
  width: 108px;
  border: 1px solid var(--md-border);
  border-radius: 10px;
  background: var(--md-card);
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.style-chip.active {
  border-color: var(--md-accent-deep);
  box-shadow: 0 0 0 2px rgba(168, 224, 210, 0.3);
}

.style-chip img {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}

.style-chip span {
  font-size: 11px;
  color: var(--md-text);
  text-align: center;
}

.placement-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.placement-label {
  font-size: 12px;
  color: var(--md-muted);
}

.step-log {
  margin: 0;
  font-size: 12px;
  color: var(--md-accent-deep);
}

.wizard-foot {
  flex-shrink: 0;
  padding-top: 12px;
}

.wizard-foot :deep(.el-button) {
  width: 100%;
  border-radius: 10px;
  font-weight: 600;
}

.wizard-foot :deep(.el-button--primary) {
  --el-button-bg-color: var(--md-accent);
  --el-button-border-color: var(--md-accent);
  --el-button-hover-bg-color: var(--md-accent-deep);
  --el-button-hover-border-color: var(--md-accent-deep);
}

@media (max-width: 900px) {
  .mode-cards {
    grid-template-columns: 1fr;
  }

  .template-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
