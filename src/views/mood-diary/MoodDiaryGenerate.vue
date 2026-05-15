<template>
  <div class="md-card md-generate">
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

    <div class="toolbar">
      <el-button type="primary" :loading="generating" @click="runPipeline">
        {{ generating ? $t('moodDiary.generating') : $t('moodDiary.startGeneratePipeline') }}
      </el-button>
      <el-button v-if="posterUrl" @click="downloadPoster">{{ $t('moodDiary.downloadMood') }}</el-button>
    </div>

    <p v-if="stepLog" class="step-log">{{ stepLog }}</p>

    <div v-if="posterUrl" class="preview">
      <img :src="posterUrl" class="poster-img" alt="" />
      <div class="save-row">
        <button
          type="button"
          class="save-mood-btn"
          :class="{ 'is-loading': saving }"
          :disabled="saving"
          @click="saveDiaryLocal"
        >
          {{ saving ? $t('moodDiary.savingMood') : $t('moodDiary.saveToDiary') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { getDraft, setDraft } from '@/utils/moodDiary/draft'
import { addRecord } from '@/utils/moodDiary/records'
import {
  composeMoodPoster
} from '@/utils/moodDiary/canvasPoster'
import {
  createCharacterIllustration,
  dataUrlToFile,
  fetchCaptionPick,
  fetchEmotionAlign,
  fetchEmotionPipeline,
  fetchImageDescribe,
  fetchQuotaSentence,
  saveIllLegacyCreation,
  saveIllMood,
  getActiveMoodEndpoints
} from '@/utils/moodDiary/api'
import { MOOD_ILLUSTRATION_TYPE } from '@/utils/moodDiary/constants'
import { popularStyleConfigs } from '@/utils/moodDiary/moodAssets'

export default {
  name: 'MoodDiaryGenerate',
  data() {
    return {
      selectedStyleId: 1,
      generating: false,
      saving: false,
      posterUrl: null,
      stepLog: '',
      quotaLine: ''
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
    if (d.quotaSentence) this.quotaLine = d.quotaSentence
    setDraft({
      artStyleId: this.selectedStyleId,
      artStyle: this.selectedStyle.artStyle
    })
  },
  methods: {
    absorbCaptionPickResponse(data) {
      const inner = data?.message ?? data?.data ?? data
      const cands =
        inner?.candidates ||
        inner?.caption_candidates ||
        (Array.isArray(inner) ? inner : [])
      const pickStr = (o, keys) => {
        const base = o && typeof o === 'object' ? o : {}
        for (const k of keys) {
          if (typeof base[k] === 'string' && base[k].trim()) return base[k].trim()
        }
        return ''
      }
      const illustrationPrompt =
        pickStr(inner, [
          'generate_illustration_prompt',
          'illustration_prompt',
          'image_prompt',
          'prompt'
        ]) || ''

      let captionPick = pickStr(inner, ['caption', 'quote', 'text'])

      const out = {}
      if (Array.isArray(cands) && cands.length) {
        out.captionCandidates = cands
      }
      if (illustrationPrompt) {
        out.generateIllustrationPrompt = illustrationPrompt
      }
      if (captionPick) {
        out.captionPicked = captionPick
      } else if (typeof cands[0] === 'string') {
        out.captionPicked = cands[0]
        captionPick = cands[0]
      } else if (cands[0] && typeof cands[0] === 'object') {
        const t = pickStr(cands[0], ['text', 'caption', 'content'])
        if (t) {
          out.captionPicked = t
          captionPick = t
        }
      }
      return out
    },
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
        this.$router.push('/mood-diary/narrative')
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
        /** Body field for caption-pick matches mini program naming */
        let pickSeedPrompt = (draft.generateIllustrationPrompt || '').trim() || localPrompt
        /** True only when caption-pick returned an illustration / image prompt */
        let captionApiGavePrompt = false

        if (cfg.captionPickEndpoint) {
          this.stepLog = this.$t('moodDiary.stepCaptionPick')
          const pickBody = {
            userMood,
            generate_illustration_prompt: pickSeedPrompt,
            illustration_style: illustrationStyle,
            candidates: draft.captionCandidates || []
          }
          const pickRaw = await fetchCaptionPick(pickBody, cfg.captionPickEndpoint)
          const absorbed = this.absorbCaptionPickResponse(pickRaw)
          setDraft(absorbed)
          draft = getDraft()
          if (
            absorbed.generateIllustrationPrompt &&
            typeof absorbed.generateIllustrationPrompt === 'string'
          ) {
            pickSeedPrompt = absorbed.generateIllustrationPrompt.trim()
            captionApiGavePrompt = true
          }
        }

        let vision = draft.imageVisionCache
        if (draft.inputImageDataUrl && cfg.captionImageDescribeEndpoint) {
          this.stepLog = this.$t('moodDiary.stepImageDescribe')
          if (!vision) {
            const file = await dataUrlToFile(
              draft.inputImageDataUrl,
              draft.inputImageName || 'ref.jpg'
            )
            vision = await fetchImageDescribe(
              file,
              (draft.narrative || '').slice(0, 500),
              cfg.captionImageDescribeEndpoint
            )
            setDraft({ imageVisionCache: vision })
            draft = getDraft()
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

        imagePrompt = this.mergeVision(imagePrompt, draft.imageVisionCache)

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

        let matching = draft.matching
        let quotaLine = draft.quotaSentence || ''

        if (cfg.quotaSentenceEndpoint) {
          this.stepLog = this.$t('moodDiary.stepQuotaSentence')
          if (cfg.emotionAlignEndpoint && matching) {
            try {
              matching = await fetchEmotionAlign(matching, cfg.emotionAlignEndpoint)
              setDraft({ matching })
            } catch (_) {
              /* optional */
            }
          }
          const qsBody = {
            text: draft.narrative,
            narrative: draft.narrative,
            matching: matching || {
              coords: [],
              emoji: draft.moodEmojiId,
              tags: [],
              emotion_flow: draft.emotionFlow || []
            },
            userMood,
            generate_illustration_prompt: imagePrompt,
            illustration_style: illustrationStyle,
            candidates: draft.captionCandidates || []
          }
          const qs = await fetchQuotaSentence(qsBody, cfg.quotaSentenceEndpoint)
          quotaLine = qs.sentence || quotaLine
          if (qs.matching) setDraft({ matching: qs.matching })
        }

        if (!quotaLine && draft.captionPicked) {
          quotaLine = draft.captionPicked
        }

        this.stepLog = this.$t('moodDiary.stepCompose')
        const poster = await composeMoodPoster(imageUrl, draft.narrative.trim(), {
          captionLine: quotaLine
        })

        this.posterUrl = poster
        this.quotaLine = quotaLine
        setDraft({
          composedPosterDataUrl: poster,
          quotaSentence: quotaLine,
          generateIllustrationPrompt: imagePrompt,
          artStyleId: this.selectedStyleId,
          artStyle: illustrationStyle
        })

        ElMessage.success(this.$t('moodDiary.generateSuccess'))
      } catch (e) {
        ElMessage.error(e.message || this.$t('moodDiary.generateFailed'))
      } finally {
        this.generating = false
        this.stepLog = ''
      }
    },
    downloadPoster() {
      if (!this.posterUrl) return
      const ts = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const filename = `mood-diary-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}.jpg`
      const link = document.createElement('a')
      link.href = this.posterUrl
      link.download = filename
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    async saveDiaryLocal() {
      if (!this.posterUrl) return
      const d = getDraft()
      this.saving = true
      try {
        addRecord({
          moodEmojiId: d.moodEmojiId,
          moodLabel: d.moodLabel,
          narrative: d.narrative,
          posterDataUrl: this.posterUrl,
          caption: this.quotaLine || d.captionPicked || '',
          emotionFlow: d.emotionFlow,
          artStyle: d.artStyle
        })
        const cfg = getActiveMoodEndpoints()
        if (cfg.illSaveEndpoint) {
          await saveIllMood(
            {
              prompt: d.generateIllustrationPrompt,
              caption: this.quotaLine || d.captionPicked,
              image_url: this.posterUrl,
              emotionFlow: d.emotionFlow
            },
            cfg.illSaveEndpoint
          )
        } else {
          const token = localStorage.getItem('token') || ''
          if (token) {
            await saveIllLegacyCreation(
              this.posterUrl,
              this.$t('moodDiary.creationTitle'),
              d.narrative.trim(),
              MOOD_ILLUSTRATION_TYPE
            )
          }
        }
        ElMessage.success(this.$t('moodDiary.saveDiaryOk'))
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
.md-card.md-generate {
  width: 100%;
  max-width: min(100%, 720px);
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(31, 35, 41, 0.08);
  box-sizing: border-box;
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
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 176px), 1fr));
  gap: 10px;
  margin-bottom: 14px;
  /* 风格区单独滚动，避免把「开始生成」顶到整页最底下 */
  max-height: min(calc(100vh - 240px), 680px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 767px) {
  .style-strip {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 720px), 1fr));
  }
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
  max-width: 160px;
  height: 72px;
  border-radius: 6px;
  object-fit: cover;
}

.style-chip span {
  font-size: 11px;
  color: #606266;
  text-align: center;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  max-height: 4.2em;
}

@media (max-width: 767px) {
  .style-chip img {
    max-width: none;
    height: 64px;
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  /* 长风格列表滚动时，生成按钮始终贴在视口底部可见 */
  position: sticky;
  bottom: 0;
  z-index: 8;
  padding: 14px 0 16px;
  margin-top: 8px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -10px 28px rgba(31, 35, 41, 0.06);
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

.step-log {
  font-size: 12px;
  color: #8167a9;
  margin: 0 0 8px;
}

.preview {
  margin-top: 12px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 10px;
  background: #f8f8fb;
}

.poster-img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
}

.save-row {
  margin-top: 12px;
}

.save-mood-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  height: 36px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: linear-gradient(135deg, #ff9a8b 0%, #ff6a88 45%, #8167a9 100%);
}

.save-mood-btn:disabled,
.save-mood-btn.is-loading {
  opacity: 0.75;
  cursor: wait;
}
</style>
