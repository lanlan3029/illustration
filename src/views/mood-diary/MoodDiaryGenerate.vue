<template>
  <div class="md-generate">
    <template v-if="posterUrl">
      <MoodDiaryPosterResult
        :poster-url="posterUrl"
        :saving="saving"
        :loading="generating"
        :show-back-to-write="false"
        @save="saveDiaryLocal"
        @download="downloadPoster"
        @regenerate="runPipeline"
      />
    </template>
    <template v-else>
      <div class="md-generate__scroll">
        <h1 class="md-title">{{ $t('moodDiary.navGenerate') }}</h1>
        <p class="muted">{{ draftHint }}</p>
        <div class="style-strip" role="list">
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
        <p v-if="stepLog" class="step-log">{{ stepLog }}</p>
      </div>
      <div class="md-generate__foot">
        <el-button type="primary" :loading="generating" @click="runPipeline">
          {{ generating ? $t('moodDiary.generating') : $t('moodDiary.startGeneratePipeline') }}
        </el-button>
      </div>
    </template>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import MoodDiaryPosterResult from '@/components/moodDiary/MoodDiaryPosterResult.vue'
import { getDraft, setDraft } from '@/utils/moodDiary/draft'
import {
  composeMoodPoster
} from '@/utils/moodDiary/canvasPoster'
import {
  createCharacterIllustration,
  dataUrlToFile,
  fetchCaptionImageDescribe,
  fetchEmotionPipeline,
  getActiveMoodEndpoints,
  imageDescribeResultToDraftPatch
} from '@/utils/moodDiary/api'
import {
  buildLocalDiaryCaptionFromVision,
  normalizeDiaryCaptionLength
} from '@/utils/moodDiary/diaryCaption'
import { downloadMoodPosterDataUrl, saveMoodPoster } from '@/utils/moodDiary/posterActions'
import { popularStyleConfigs } from '@/utils/moodDiary/moodAssets'

export default {
  name: 'MoodDiaryGenerate',
  components: { MoodDiaryPosterResult },
  data() {
    return {
      selectedStyleId: 1,
      generating: false,
      saving: false,
      posterUrl: null,
      stepLog: '',
      diaryCaptionLine: ''
    }
  },
  computed: {
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
    draftHint() {
      const d = getDraft()
      if (!(d.narrative || '').trim()) return this.$t('moodDiary.generateNeedNarrative')
      return this.$t('moodDiary.generateReadyHint')
    }
  },
  watch: {
    selectedStyleId(v) {
      setDraft({ artStyleId: v, artStyle: this.selectedStyle?.artStyle || '' })
    }
  },
  mounted() {
    const d = getDraft()
    if (d.artStyleId) this.selectedStyleId = Number(d.artStyleId) || 1
    if (d.composedPosterDataUrl) this.posterUrl = d.composedPosterDataUrl
    if (d.diaryCaption || d.quotaSentence) {
      this.diaryCaptionLine = d.diaryCaption || d.quotaSentence
    }
    setDraft({
      artStyleId: this.selectedStyleId,
      artStyle: this.selectedStyle.artStyle
    })
  },
  methods: {
    localCompositePrompt(d) {
      const text = (d.narrative || '').trim()
      const moodTxt = d.moodLabel ? `${this.$t('moodDiary.selectedMood')}：${d.moodLabel}。` : ''
      const st = this.selectedStyle
      return `${text}。${moodTxt}${st.artStyle}，${st.elementDetails}`
    },
    mergeVision(base, vision) {
      if (!vision) return base
      return `${base} [参考图：${vision}]`
    },
    async runPipeline() {
      const d0 = getDraft()
      if (!(d0.narrative || '').trim()) {
        ElMessage.warning(this.$t('moodDiary.emptyPrompt'))
        this.$router.push('/mood-diary/write')
        return
      }

      this.generating = true
      this.posterUrl = null
      this.stepLog = ''
      try {
        const cfg = getActiveMoodEndpoints()
        let draft = getDraft()

        const userMood = draft.moodLabel || draft.mood || ''
        const illustrationStyle = this.selectedStyle.artStyle
        const localPrompt = this.localCompositePrompt(draft)
        let pickSeedPrompt = (draft.generateIllustrationPrompt || '').trim() || localPrompt
        let captionApiGavePrompt = false

        if (draft.inputImageDataUrl && !cfg.captionImageDescribeEndpoint) {
          console.warn(
            '[mood-diary] 未配置 caption/image-describe，海报将无 AI 日记配文（请设置 VUE_APP_MOOD_IMAGE_DESCRIBE）'
          )
        }

        if (draft.inputImageDataUrl && cfg.captionImageDescribeEndpoint) {
          this.stepLog = this.$t('moodDiary.stepImageDescribe')
          const narrativeHint = (draft.narrative || '').slice(0, 500)
          const refFile = await dataUrlToFile(
            draft.inputImageDataUrl,
            draft.inputImageName || 'ref.jpg'
          )
          const describeResult = await fetchCaptionImageDescribe(
            refFile,
            {
              hint: narrativeHint,
              extraHint: narrativeHint,
              narrative: (draft.narrative || '').trim(),
              moodLabel: draft.moodLabel || userMood,
              illustrationStyle,
              targetLength: 90,
              generateDiaryCaption: true,
              filename: draft.inputImageName || 'ref.jpg'
            },
            cfg.captionImageDescribeEndpoint
          )
          setDraft(imageDescribeResultToDraftPatch(describeResult))
          draft = getDraft()
          const illFromDescribe = (draft.generateIllustrationPrompt || describeResult.illustrationPrompt || '').trim()
          if (illFromDescribe) {
            pickSeedPrompt = illFromDescribe
            captionApiGavePrompt = true
          }
        }

        let imagePrompt = captionApiGavePrompt ? pickSeedPrompt : ''

        if (!captionApiGavePrompt && cfg.emotionPipelineEndpoint) {
          this.stepLog = this.$t('moodDiary.stepEmotionPipeline')
          const ep = await fetchEmotionPipeline(
            draft.narrative,
            !!draft.inputImageDataUrl,
            cfg.emotionPipelineEndpoint
          )
          if (ep) imagePrompt = ep
        }

        if (!imagePrompt.trim()) imagePrompt = localPrompt

        const sceneForPrompt =
          (draft.sceneDescription || draft.imageVisionCache || '').trim()
        imagePrompt = this.mergeVision(imagePrompt, sceneForPrompt)

        this.stepLog = this.$t('moodDiary.stepCreateCharacter')
        const createPayload = {
          prompt: imagePrompt,
          character_name: 'mood_diary',
          character_type: 'illustration',
          size: '1024x1024',
          quality: 'standard',
          response_format: 'b64_json',
          watermark: false
        }
        if (draft.inputImageDataUrl) {
          createPayload.image = draft.inputImageDataUrl
        }
        const { imageUrl } = await createCharacterIllustration(createPayload)
        setDraft({ rawIllustrationUrl: imageUrl })

        draft = getDraft()
        let diaryCaptionLine = normalizeDiaryCaptionLength(
          draft.diaryCaption || draft.quotaSentence || ''
        )
        if (!diaryCaptionLine && draft.inputImageDataUrl) {
          console.warn(
            '[mood-diary] 有参考图但未拿到 diary_caption，请检查 Network 中 POST /caption/image-describe 响应'
          )
        }
        if (!diaryCaptionLine) {
          const sceneDescription = (
            draft.sceneDescription ||
            draft.imageVisionCache ||
            ''
          ).trim()
          if (sceneDescription) {
            diaryCaptionLine = buildLocalDiaryCaptionFromVision(sceneDescription, {
              moodLabel: draft.moodLabel,
              narrative: draft.narrative
            })
          } else if (draft.captionPicked) {
            diaryCaptionLine = normalizeDiaryCaptionLength(draft.captionPicked)
          }
        }

        this.stepLog = this.$t('moodDiary.stepCompose')
        const userNarrative = (draft.narrative || '').trim()
        const posterMain = diaryCaptionLine || userNarrative
        const posterSub =
          diaryCaptionLine && userNarrative && diaryCaptionLine !== userNarrative
            ? userNarrative
            : ''

        let poster = ''
        try {
          poster = await composeMoodPoster(imageUrl, posterMain, {
            captionLine: posterSub,
            userNarrative: posterSub
          })
        } catch (composeErr) {
          console.warn('[mood-diary] compose poster failed, fallback to illustration', composeErr)
          poster = imageUrl
        }

        this.posterUrl = poster
        this.diaryCaptionLine = diaryCaptionLine
        setDraft({
          composedPosterDataUrl: poster,
          diaryCaption: diaryCaptionLine,
          quotaSentence: diaryCaptionLine,
          generateIllustrationPrompt: imagePrompt,
          artStyleId: this.selectedStyleId,
          artStyle: illustrationStyle
        })

        ElMessage.success(this.$t('moodDiary.generateSuccess'))
        this.$router.replace('/mood-diary/narrative')
      } catch (e) {
        ElMessage.error(e.message || this.$t('moodDiary.generateFailed'))
      } finally {
        this.generating = false
        this.stepLog = ''
      }
    },
    downloadPoster() {
      downloadMoodPosterDataUrl(this.posterUrl)
      ElMessage.success(this.$t('moodDiary.downloadSuccess'))
    },
    async saveDiaryLocal() {
      if (!this.posterUrl) return
      this.saving = true
      try {
        await saveMoodPoster(this.posterUrl, this.diaryCaptionLine, (k) => this.$t(k))
        ElMessage.success(this.$t('moodDiary.saveToMyCreationSuccess'))
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
.md-generate {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 8px 28px rgba(31, 35, 41, 0.07);
  box-sizing: border-box;
  overflow: hidden;
}

.md-generate__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 20px 8px;
}

.md-generate__foot {
  flex-shrink: 0;
  padding: 12px 20px 20px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.md-generate__foot :deep(.el-button) {
  width: 100%;
}

.md-title {
  margin: 0 0 6px;
  font-size: 22px;
}

.muted {
  margin: 0 0 14px;
  color: #909399;
  font-size: 13px;
}

.style-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr));
  gap: 10px;
  margin-bottom: 8px;
}

.style-chip {
  width: 100%;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.style-chip.active {
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.12);
}

.style-chip img {
  width: 100%;
  max-width: 120px;
  aspect-ratio: 1 / 1;
  height: auto;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

.style-chip span {
  font-size: 11px;
  color: #606266;
  text-align: center;
  line-height: 1.25;
}

.step-log {
  font-size: 12px;
  color: #8167a9;
  margin: 8px 0 0;
}
</style>
