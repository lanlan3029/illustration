<template>
  <div class="now-panel">
    <div class="now-panel-head">
      <h2 class="now-panel-title">{{ $t('moodDiary.navNow') }}</h2>
      <button
        v-if="narrative.trim() || moodObj"
        type="button"
        class="now-clear-btn"
        @click="clearLocal"
      >
        {{ $t('moodDiary.clearEntry') }}
      </button>
    </div>

    <section class="now-mood-zone" :aria-label="$t('moodDiary.question')">
      <p class="now-question">{{ $t('moodDiary.question') }}</p>
      <div class="now-primary-moods" role="group">
        <button
          v-for="m in quickMoods"
          :key="m.id"
          type="button"
          class="now-mood-btn"
          :class="{ active: moodObj && moodObj.id === m.id }"
          @click="selectMood(m)"
        >
          <img :src="m.src" :alt="m.label" />
          <span>{{ m.label }}</span>
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
          class="now-mood-btn now-mood-btn--sm"
          :class="{ active: moodObj && moodObj.id === m.id }"
          @click="selectMood(m)"
        >
          <img :src="m.src" :alt="m.label" />
        </button>
      </div>
    </section>

    <div class="now-input-wrap">
      <img v-if="moodObj" :src="moodObj.src" :alt="moodObj.label" class="now-mood-bg" />
      <input
        ref="refInput"
        type="file"
        accept="image/*"
        class="hidden-file"
        tabindex="-1"
        @change="onRefFile"
      />
      <el-input
        v-model="narrative"
        type="textarea"
        :rows="6"
        :placeholder="$t('moodDiary.entryPlaceholder')"
        maxlength="1000"
        show-word-limit
        class="now-entry-input"
      />
      <div class="now-input-tools">
        <button
          type="button"
          class="now-attach-btn"
          :title="$t('moodDiary.pickRefImage')"
          @mousedown.prevent
          @click="$refs.refInput.click()"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <div v-if="refPreview" class="now-ref-thumb">
          <img :src="refPreview" alt="" />
          <button type="button" class="now-ref-clear" @click.stop="clearRef">×</button>
        </div>
      </div>
    </div>

    <div class="now-panel-foot">
      <el-button type="primary" class="now-submit" :loading="describeBusy" @click="nextToGenerate">
        {{ $t('moodDiary.nextToGenerate') }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { checkTextSafe } from '@/utils/moodDiary/checkTextSafe'
import {
  dataUrlToFile,
  fetchCaptionImageDescribe,
  getActiveMoodEndpoints,
  imageDescribeResultToDraftPatch
} from '@/utils/moodDiary/api'
import { dataUrlToPathHint, getDraft, setDraft } from '@/utils/moodDiary/draft'
import { findMoodById, quickMoodIds, resolveMoodList } from '@/utils/moodDiary/moodAssets'

const HIDDEN_EXTRA_MOOD_IDS = new Set(['heart', 'thumbs-up', 'star-eyes'])

export default {
  name: 'MoodDiaryNowPanel',
  emits: ['submitted'],
  data() {
    return {
      narrative: '',
      moodObj: null,
      refPreview: null,
      refFile: null,
      refDataUrl: null,
      showExtraMoods: false,
      describeBusy: false
    }
  },
  computed: {
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
    moodObj() {
      this.persist()
    }
  },
  mounted() {
    this.hydrate()
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
      const sid = this.moodObj?.id
      if (sid && !quickMoodIds.includes(sid)) {
        this.showExtraMoods = true
      }
    },
    selectMood(m) {
      this.moodObj = m
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
      this.clearRef()
      setDraft({
        narrative: '',
        moodEmojiId: null,
        moodLabel: '',
        mood: '',
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
    async nextToGenerate() {
      const safe = checkTextSafe(this.narrative, (k) => this.$t(k))
      if (!safe.ok) {
        ElMessage.warning(safe.message)
        return
      }
      const cfg = getActiveMoodEndpoints()
      const patch = {
        narrative: this.narrative.trim(),
        moodEmojiId: this.moodObj ? this.moodObj.id : null,
        moodLabel: this.moodObj ? this.moodObj.label : '',
        mood: this.moodObj ? this.moodObj.id : ''
      }
      if (this.refDataUrl && cfg.captionImageDescribeEndpoint) {
        this.describeBusy = true
        try {
          const file =
            this.refFile ||
            (await dataUrlToFile(this.refDataUrl, getDraft().inputImageName || 'reference.jpg'))
          const describeResult = await fetchCaptionImageDescribe(
            file,
            {
              hint: this.narrative.slice(0, 500),
              extraHint: this.narrative.slice(0, 500),
              narrative: this.narrative.trim(),
              moodLabel: this.moodObj ? this.moodObj.label : '',
              targetLength: 90,
              generateDiaryCaption: true,
              filename: getDraft().inputImageName || 'reference.jpg'
            },
            cfg.captionImageDescribeEndpoint
          )
          Object.assign(patch, imageDescribeResultToDraftPatch(describeResult))
        } catch (e) {
          ElMessage.error(e.message || this.$t('moodDiary.describeFailed'))
          this.describeBusy = false
          return
        }
        this.describeBusy = false
      }
      setDraft(patch)
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
  padding: 18px 16px 20px;
  box-sizing: border-box;
}

.now-panel-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.now-panel-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.now-clear-btn {
  border: none;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  padding: 5px 11px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.now-clear-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.now-mood-zone {
  flex-shrink: 0;
  margin-bottom: 12px;
  padding: 14px 12px;
  border-radius: 16px;
  background: linear-gradient(165deg, #f8fafc 0%, #f0fdfa 100%);
  border: 1px solid rgba(32, 201, 151, 0.1);
}

.now-question {
  margin: 0 0 10px;
  font-size: 13px;
  color: #64748b;
  text-align: center;
}

.now-primary-moods {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 12px;
}

.now-mood-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px;
  font-size: 10px;
  color: #64748b;
  transition: transform 0.15s ease;
}

.now-mood-btn img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.now-mood-btn.active {
  transform: scale(1.08);
}

.now-more-btn {
  display: block;
  margin: 10px auto 0;
  border: none;
  background: #f1f5f9;
  padding: 5px 12px;
  font-size: 11px;
  color: #475569;
  border-radius: 999px;
  cursor: pointer;
}

.now-extra-moods {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.now-mood-btn--sm img {
  width: 32px;
  height: 32px;
}

.now-input-wrap {
  position: relative;
  flex: 1;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  border: none;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  box-shadow:
    inset 0 0 0 1px #e8ecf1,
    0 2px 8px rgba(15, 23, 42, 0.04);
}

.now-mood-bg {
  position: absolute;
  left: 50%;
  top: 45%;
  width: 72px;
  height: 72px;
  transform: translate(-50%, -50%);
  opacity: 0.22;
  pointer-events: none;
  z-index: 1;
}

.now-entry-input {
  flex: 1;
  min-height: 0;
  z-index: 2;
}

.now-entry-input :deep(.el-textarea) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.now-entry-input :deep(.el-textarea__inner) {
  flex: 1;
  min-height: 100px;
  height: 100% !important;
  background: transparent;
  border: none;
  box-shadow: none;
  padding-bottom: 48px;
  resize: none;
}

.now-input-tools {
  position: absolute;
  left: 10px;
  bottom: 10px;
  display: flex;
  gap: 6px;
  z-index: 3;
}

.now-attach-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.now-ref-thumb {
  position: relative;
  width: 34px;
}

.now-ref-thumb img {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 8px;
}

.now-ref-clear {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: #64748b;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.hidden-file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.now-panel-foot {
  flex-shrink: 0;
  margin-top: 14px;
}

.now-panel-foot :deep(.el-button) {
  width: 100%;
  border-radius: 12px;
  font-weight: 600;
  height: 42px;
  border: none;
  background: linear-gradient(135deg, #2dd4a8 0%, #20c997 100%);
  box-shadow: 0 4px 14px rgba(32, 201, 151, 0.28);
}
</style>
