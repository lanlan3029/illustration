<template>
  <div class="md-card md-write">
    <div class="page-title-row">
      <router-link class="back-link" to="/mood-diary/narrative">← {{ $t('moodDiary.backDashboard') }}</router-link>
      <h1 class="md-title">{{ $t('moodDiary.question') }}</h1>
      <div class="page-title-side page-title-side--end">
        <button
          v-if="narrative.trim() || moodObj"
          type="button"
          class="clear-entry-btn"
          @click="clearLocal"
        >
          {{ $t('moodDiary.clearEntry') }}
        </button>
      </div>
    </div>

    <section class="mood-zone" :aria-label="$t('moodDiary.question')">
      <div class="primary-moods" role="group">
        <button
          v-for="m in quickMoods"
          :key="m.id"
          type="button"
          class="mood-btn mood-btn-primary"
          :class="{ active: moodObj && moodObj.id === m.id }"
          @click="selectMood(m)"
        >
          <img :src="m.src" :alt="m.label" />
          <span class="mood-btn-label mood-btn-label-primary">{{ m.label }}</span>
        </button>
      </div>

      <div class="more-moods-block">
        <button type="button" class="linkish" @click="showExtraMoods = !showExtraMoods">
          {{ showExtraMoods ? $t('moodDiary.collapseMoreMoods') : $t('moodDiary.moreMoods') }}
        </button>
        <div v-show="showExtraMoods" class="extra-moods" role="list">
          <button
            v-for="m in extraMoods"
            :key="m.id"
            type="button"
            class="mood-btn mood-btn-extra"
            :class="{ active: moodObj && moodObj.id === m.id }"
            @click="selectMood(m)"
          >
            <img :src="m.src" :alt="m.label" />
            <span class="mood-btn-label">{{ m.label }}</span>
          </button>
        </div>
      </div>
    </section>

    <div class="diary-input-wrap">
      <img v-if="moodObj" :src="moodObj.src" :alt="moodObj.label" class="diary-mood-bg" />
      <div class="diary-entry-shell">
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
          :rows="8"
          :placeholder="$t('moodDiary.entryPlaceholder')"
          maxlength="1000"
          show-word-limit
          class="diary-entry-input"
        />
        <div class="diary-entry-inner-tools">
          <button
            type="button"
            class="attach-img-btn"
            :title="$t('moodDiary.pickRefImage')"
            :aria-label="$t('moodDiary.pickRefImage')"
            @mousedown.prevent
            @click="$refs.refInput.click()"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <div v-if="refPreview" class="ref-thumb-inline">
            <img :src="refPreview" alt="" />
            <button type="button" class="ref-clear-chip" :title="$t('moodDiary.removeRefImage')" @click.stop="clearRef">×</button>
          </div>
        </div>
      </div>
    </div>

    <div class="row-actions">
      <el-button type="primary" :loading="describeBusy" @click="nextToGenerate">{{ $t('moodDiary.nextToGenerate') }}</el-button>
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
  name: 'MoodDiaryWrite',
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
      this.$router.push('/mood-diary/generate')
    }
  }
}
</script>

<style scoped>
.md-card.md-write {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  padding: 22px 22px 26px;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.08);
  box-sizing: border-box;
}

.page-title-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 10px;
  margin-bottom: 22px;
}

.back-link {
  font-size: 13px;
  color: #0d9488;
  text-decoration: none;
  padding: 4px 0;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title-side--end {
  display: flex;
  justify-content: flex-end;
}

.md-title {
  margin: 0;
  justify-self: center;
  text-align: center;
  font-size: 19px;
  font-weight: 600;
  color: #134e4a;
}

.clear-entry-btn {
  border: 1px solid #99f6e4;
  background: #f0fdfa;
  color: #0f766e;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.mood-zone {
  margin-bottom: 22px;
  padding: 18px 14px 20px;
  border-radius: 16px;
  background: linear-gradient(165deg, #f0fdfa 0%, #fff 100%);
  border: 1px solid rgba(16, 185, 129, 0.12);
}

.primary-moods {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px 24px;
  margin-bottom: 16px;
}

.mood-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s ease;
}

.mood-btn.active {
  transform: scale(1.1);
}

.mood-btn-primary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mood-btn-primary img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.more-moods-block {
  text-align: center;
}

.linkish {
  border: none;
  background: rgba(16, 185, 129, 0.1);
  padding: 6px 16px;
  font-size: 13px;
  color: #0d9488;
  cursor: pointer;
  border-radius: 999px;
}

.extra-moods {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.mood-btn-extra {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.mood-btn-extra img {
  width: 38px;
  height: 38px;
}

.mood-btn-label {
  font-size: 11px;
  color: #5c6270;
}

.diary-input-wrap {
  position: relative;
  flex: 1;
  border: 1px solid #ccfbf1;
  border-radius: 14px;
  background: #fff;
}

.diary-entry-shell {
  position: relative;
  z-index: 2;
}

.diary-entry-inner-tools {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: flex;
  gap: 8px;
  z-index: 5;
}

.attach-img-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #99f6e4;
  border-radius: 8px;
  background: #fff;
  color: #0d9488;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden-file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.ref-thumb-inline {
  position: relative;
  width: 38px;
}

.ref-thumb-inline img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 8px;
}

.ref-clear-chip {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: #606266;
  color: #fff;
  cursor: pointer;
}

.diary-mood-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%);
  opacity: 0.28;
  pointer-events: none;
  z-index: 1;
}

.diary-entry-input :deep(.el-textarea__inner) {
  background: transparent;
  padding-bottom: 56px;
  min-height: 220px;
  border: none;
  box-shadow: none;
}

.row-actions {
  margin-top: 22px;
  display: flex;
  justify-content: center;
}
</style>
