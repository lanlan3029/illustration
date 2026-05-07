<template>
  <div class="md-card md-narrative">
    <div class="page-title-row">
      <div class="page-title-side" aria-hidden="true" />
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
          <div class="diary-entry-inner-tools" aria-hidden="false">
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
              <button type="button" class="ref-clear-chip" :title="$t('moodDiary.removeRefImage')" tabindex="0" @click.stop="clearRef">
                ×
              </button>
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
import { dataUrlToFile, fetchImageDescribe, getActiveMoodEndpoints } from '@/utils/moodDiary/api'
import { dataUrlToPathHint, getDraft, setDraft } from '@/utils/moodDiary/draft'
import { findMoodById, quickMoodIds, resolveMoodList } from '@/utils/moodDiary/moodAssets'

export default {
  name: 'MoodDiaryNarrative',
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
      return this.moods.filter((m) => !quick.has(m.id))
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
        imageVisionCache: null
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
        imageVisionCache: null
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

      let vision = null
      if (this.refDataUrl && cfg.captionImageDescribeEndpoint) {
        this.describeBusy = true
        try {
          const file =
            this.refFile ||
            (await dataUrlToFile(this.refDataUrl, this.refImageBasename()))
          vision = await fetchImageDescribe(file, this.narrative.slice(0, 500), cfg.captionImageDescribeEndpoint)
        } catch (e) {
          ElMessage.error(e.message || this.$t('moodDiary.describeFailed'))
          this.describeBusy = false
          return
        }
        this.describeBusy = false
      }

      const patch = {
        narrative: this.narrative.trim(),
        moodEmojiId: this.moodObj ? this.moodObj.id : null,
        moodLabel: this.moodObj ? this.moodObj.label : '',
        mood: this.moodObj ? this.moodObj.id : ''
      }
      if (vision) patch.imageVisionCache = vision

      setDraft(patch)
      this.$router.push('/mood-diary/generate')
    },
    refImageBasename() {
      return getDraft().inputImageName || 'reference.jpg'
    }
  }
}
</script>

<style scoped>
.md-card.md-narrative {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
  align-self: center;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 14px;
  padding: 22px 22px 26px;
  box-shadow: 0 8px 28px rgba(42, 31, 66, 0.07);
  box-sizing: border-box;
}

.page-title-row {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(44px, 1fr) minmax(0, auto) minmax(44px, 1fr);
  align-items: start;
  gap: 10px;
  margin-bottom: 22px;
}

.page-title-side {
  min-height: 30px;
}

.page-title-side--end {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.md-title {
  margin: 0;
  justify-self: center;
  grid-column: 2;
  text-align: center;
  font-size: 19px;
  font-weight: 600;
  color: #2b2640;
  line-height: 1.4;
  letter-spacing: 0.02em;
}

.clear-entry-btn {
  flex-shrink: 0;
  border: 1px solid #dcd7e8;
  background: #faf9fc;
  color: #6b6578;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.clear-entry-btn:hover {
  border-color: #b9a9d6;
  color: #574a73;
  background: #fff;
}

.mood-zone {
  flex-shrink: 0;
  margin-bottom: 22px;
  padding: 18px 14px 20px;
  border-radius: 12px;
  background: linear-gradient(165deg, #f9f8ff 0%, #fafbfd 52%, #fff 100%);
  border: 1px solid rgba(129, 103, 169, 0.12);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

.primary-moods {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 18px 24px;
  margin-bottom: 16px;
}

.mood-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s ease, filter 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.mood-btn:hover {
  transform: scale(1.06);
}

.mood-btn:focus-visible {
  outline: 2px solid #8167a9;
  outline-offset: 4px;
  border-radius: 8px;
}

.mood-btn.active {
  transform: scale(1.12);
  filter: drop-shadow(0 2px 8px rgba(129, 103, 169, 0.35));
}

.mood-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.mood-btn-primary img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  display: block;
}

.more-moods-block {
  flex-shrink: 0;
  margin-bottom: 0;
  padding-top: 2px;
  text-align: center;
}

.more-moods-block::before {
  content: '';
  display: block;
  width: 44px;
  height: 1px;
  margin: 0 auto 14px;
  background: linear-gradient(90deg, transparent, rgba(129, 103, 169, 0.22), transparent);
}

.linkish {
  border: none;
  background: rgba(129, 103, 169, 0.08);
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #684f9e;
  cursor: pointer;
  border-radius: 999px;
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease;
}

.linkish:hover {
  background: rgba(129, 103, 169, 0.14);
  color: #4f3a78;
}

.linkish:active {
  transform: scale(0.98);
}

.extra-moods {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 14px 12px;
  margin-top: 18px;
  padding: 4px 0 0;
  justify-items: center;
}

.mood-btn-extra {
  min-height: 0;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}

.mood-btn-extra img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  display: block;
}

.mood-btn-label {
  font-size: 11px;
  line-height: 1.2;
  color: #5c6270;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
}

.diary-input-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.diary-input-wrap:focus-within {
  border-color: rgba(129, 103, 169, 0.4);
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.1);
}

.diary-entry-shell {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.diary-entry-inner-tools {
  position: absolute;
  left: 13px;
  bottom: 32px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  z-index: 5;
  pointer-events: none;
}

.diary-entry-inner-tools .attach-img-btn,
.diary-entry-inner-tools .ref-thumb-inline {
  pointer-events: auto;
}

.attach-img-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid rgba(144, 147, 153, 0.45);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  color: #909399;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(31, 35, 41, 0.06);
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.attach-img-btn:hover {
  border-color: #8167a9;
  color: #8167a9;
  background: rgba(255, 255, 255, 0.98);
}

.attach-img-btn:focus-visible {
  outline: 2px solid #8167a9;
  outline-offset: 2px;
}

.hidden-file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.ref-thumb-inline {
  position: relative;
  width: 38px;
  flex-shrink: 0;
}

.ref-thumb-inline img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(235, 238, 245, 0.95);
  display: block;
  box-shadow: 0 1px 4px rgba(31, 35, 41, 0.06);
}

.ref-clear-chip {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #606266;
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ref-clear-chip:hover {
  background: #e14a4a;
}

.diary-mood-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%);
  object-fit: contain;
  opacity: 0.28;
  pointer-events: none;
  z-index: 1;
  filter: saturate(0.92);
}

.diary-entry-input {
  width: 100%;
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.diary-entry-input :deep(.el-textarea),
.diary-entry-input :deep(.el-input__wrapper) {
  flex: 1;
  min-height: 0;
}

.diary-entry-input :deep(.el-textarea) {
  display: flex;
  flex-direction: column;
}

.diary-entry-input :deep(.el-textarea__inner) {
  background: transparent;
  padding-bottom: 52px;
  flex: 1;
  min-height: 220px;
  resize: vertical;
  border: none;
  border-radius: 12px;
  box-shadow: none;
}

.diary-entry-input :deep(.el-textarea__inner:focus),
.diary-entry-input :deep(.el-textarea__inner:focus-visible) {
  outline: none;
}

@media (max-width: 767px) {
  .diary-entry-inner-tools {
    left: 10px;
    bottom: 34px;
  }

  .diary-entry-input :deep(.el-textarea__inner) {
    padding-bottom: 54px;
    min-height: 200px;
  }
}

.row-actions {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 22px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 12px 14px;
}
</style>
