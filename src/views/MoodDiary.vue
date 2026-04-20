<template>
  <div class="mood-diary-page">
    <div class="mood-diary-card">
      <h1 class="page-title">{{ $t('moodDiary.title') }}</h1>
     

      <div class="diary-input-wrap">
        <img
          v-if="selectedMood"
          :src="selectedMood.src"
          :alt="selectedMood.label"
          class="diary-mood-bg"
        />
        <el-input
          v-model="diaryContent"
          type="textarea"
          :rows="8"
          :placeholder="$t('moodDiary.entryPlaceholder')"
          maxlength="1000"
          show-word-limit
          class="diary-entry-input"
        />
      </div>

      <div class="illustration-generator">
       
        <div class="generator-row">
          
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
        </div>
        <div class="generator-actions">
          <el-button
            type="primary"
            :loading="generating"
            :disabled="!diaryContent || !diaryContent.trim()"
            @click="generateIllustration"
          >
            {{ generating ? $t('moodDiary.generating') : $t('moodDiary.generateMood') }}
          </el-button>
          <el-button
            v-if="generatedImageUrl"
            type="success"
            :loading="savingCreation"
            @click="saveCurrentMoodIllustration"
          >
            {{ savingCreation ? $t('moodDiary.savingMood') : $t('moodDiary.saveMood') }}
          </el-button>
        </div>
        <div v-if="generatedImageUrl" ref="generatedPreview" class="generated-preview">
          <img
            :src="generatedImageUrl"
            alt=""
            class="generated-image-img"
          />
        </div>
      </div>

    </div>

    <el-dialog
      v-model="moodDialogVisible"
      width="min(680px, 80vw)"
      :close-on-click-modal="false"
      :show-close="false"
      class="mood-selector-dialog"
    >
      <template #header>
        <h3 class="dialog-title">{{ $t('moodDiary.question') }}</h3>
      </template>

      <div class="mood-grid">
        <button
          v-for="mood in moods"
          :key="mood.id"
          type="button"
          class="mood-item"
          :class="{ active: selectedMood && selectedMood.id === mood.id }"
          @click="selectMood(mood)"
        >
          <img :src="mood.src" :alt="mood.label" />
          <span>{{ mood.label }}</span>
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

const MOOD_DIARY_DRAFT_KEY = 'mood_diary_draft_v1'

// 代表性心情（精简展示）
const moodOptions = [
  { id: 'happy-grin', file: 'happy-grin.webp', zh: '开心', en: 'Happy' },
  { id: 'big-grin', file: 'big-grin.webp', zh: '大笑', en: 'Big grin' },
  { id: 'laughing-tears', file: 'laughing-tears.webp', zh: '笑哭', en: 'Laughing tears' },
  { id: 'cool', file: 'cool.webp', zh: '自信', en: 'Cool' },
  { id: 'neutral-smile', file: 'neutral-smile.webp', zh: '平静', en: 'Neutral' },
  { id: 'worried', file: 'worried.webp', zh: '担心', en: 'Worried' },
  { id: 'sad', file: 'sad.webp', zh: '难过', en: 'Sad' },
  { id: 'frustrated', file: 'frustrated.webp', zh: '烦躁', en: 'Frustrated' },
  { id: 'angry', file: 'angry.webp', zh: '生气', en: 'Angry' },
  { id: 'cold', file: 'cold.webp', zh: '疲惫', en: 'Tired' },
  { id: 'sick', file: 'sick.webp', zh: '不舒服', en: 'Unwell' },
  { id: 'surprised', file: 'surprised.webp', zh: '惊讶', en: 'Surprised' }
]

const moodImageContext = require.context('@/assets/images/mood', false, /\.webp$/)

// 来自 AI 插画页的常用风格（精简为 6 个）
const popularStyleConfigs = [
  { key: 'penLineArt', id: 1, image: require('@/assets/prompt/1.webp') },
  { key: 'colorfulOutlineRomanticism', id: 6, image: require('@/assets/prompt/6.webp') },
  { key: 'crayonNoiseHandDrawn', id: 15, image: require('@/assets/prompt/15.webp') },
  { key: 'vintageSketch', id: 17, image: require('@/assets/prompt/17.webp') },
  { key: 'pixarStyle', id: 5, image: require('@/assets/prompt/5.webp') },
  { key: 'healingWatercolor', id: 14, image: require('@/assets/prompt/14.webp') }
]

export default {
  name: 'MoodDiary',
  data() {
    return {
      moodDialogVisible: true,
      selectedMood: null,
      diaryContent: '',
      selectedStyleId: 1,
      generating: false,
      generatedImageUrl: null,
      savingCreation: false,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
    }
  },
  watch: {
    diaryContent() {
      this.saveMoodDiaryDraft()
    },
    selectedStyleId() {
      this.saveMoodDiaryDraft()
    },
    selectedMood: {
      handler() {
        this.saveMoodDiaryDraft()
      },
      deep: false
    },
    generatedImageUrl() {
      this.saveMoodDiaryDraft()
    }
  },
  computed: {
    moods() {
      const isZh = this.$i18n && this.$i18n.locale === 'zh'
      return moodOptions.map((item) => {
        return {
          id: item.id,
          label: isZh ? item.zh : item.en,
          src: moodImageContext(`./${item.file}`)
        }
      })
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
    generatedPrompt() {
      const text = (this.diaryContent || '').trim()
      if (!text) return ''
      const moodText = this.selectedMood ? `${this.$t('moodDiary.selectedMood')}：${this.selectedMood.label}。` : ''
      const artStyle = this.selectedStyle ? this.selectedStyle.artStyle : ''
      const details = this.selectedStyle ? this.selectedStyle.elementDetails : ''
      return `${text}。${moodText}${artStyle}，${details}`
    }
  },
  methods: {
    saveMoodDiaryDraft() {
      try {
        const payload = {
          v: 1,
          savedAt: Date.now(),
          selectedMoodId: this.selectedMood ? this.selectedMood.id : null,
          diaryContent: this.diaryContent || '',
          selectedStyleId: this.selectedStyleId || 1,
          generatedImageUrl: this.generatedImageUrl || null
        }
        localStorage.setItem(MOOD_DIARY_DRAFT_KEY, JSON.stringify(payload))
      } catch (_) {
        // ignore storage failures
      }
    },
    loadMoodDiaryDraft() {
      try {
        const raw = localStorage.getItem(MOOD_DIARY_DRAFT_KEY)
        if (!raw) return
        const data = JSON.parse(raw)
        if (!data || typeof data !== 'object') return

        if (typeof data.diaryContent === 'string') this.diaryContent = data.diaryContent
        if (data.selectedStyleId != null) this.selectedStyleId = Number(data.selectedStyleId) || 1
        if (typeof data.generatedImageUrl === 'string' && data.generatedImageUrl.startsWith('data:')) {
          this.generatedImageUrl = data.generatedImageUrl
        }

        const moodId = data.selectedMoodId
        if (moodId) {
          const m = this.moods.find((x) => x.id === moodId)
          if (m) {
            this.selectedMood = m
            this.moodDialogVisible = false
          }
        }
      } catch (_) {
        // ignore parse errors
      }
    },
    selectMood(mood) {
      this.selectedMood = mood
      this.moodDialogVisible = false
    },
    async generateIllustration() {
      if (!this.generatedPrompt) {
        ElMessage.warning(this.$t('moodDiary.emptyPrompt'))
        return
      }
      this.generating = true
      this.generatedImageUrl = null
      try {
        const apiUrl = this.apiBaseUrl ? `${this.apiBaseUrl}/create-character` : '/create-character'
        const response = await this.$http.post(
          apiUrl,
          {
            prompt: this.generatedPrompt,
            size: '1280x960',
            response_format: 'b64_json',
            watermark: false
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
            },
            timeout: 180000
          }
        )

        const data = response && response.data ? response.data : {}
        const ok = data.code === 0 || data.code === '0' || data.desc === 'success' || data.statuscode === 'success'
        if (!ok || !data.message) throw new Error(data.message || this.$t('moodDiary.generateFailed'))

        const msg = data.message
        let imageUrl = msg.image_url || msg.character_image_url || msg.image || msg.url || ''
        if (!imageUrl && msg.image_base64) {
          imageUrl = msg.image_base64.startsWith('data:')
            ? msg.image_base64
            : `data:image/jpeg;base64,${msg.image_base64}`
        }
        if (!imageUrl && msg.character_image_base64) {
          imageUrl = msg.character_image_base64.startsWith('data:')
            ? msg.character_image_base64
            : `data:image/jpeg;base64,${msg.character_image_base64}`
        }
        if (!imageUrl && msg.full_response && msg.full_response.data && msg.full_response.data[0]) {
          const first = msg.full_response.data[0]
          if (first.b64_json) imageUrl = `data:image/jpeg;base64,${first.b64_json}`
          else imageUrl = first.url || ''
        }

        if (!imageUrl) throw new Error(this.$t('moodDiary.generateFailed'))
        const composedDataUrl = await this.composeMoodCardImage(imageUrl, this.diaryContent.trim())
        this.generatedImageUrl = composedDataUrl
        ElMessage.success(this.$t('moodDiary.generateSuccess'))
        this.$nextTick(() => {
          const el = this.$refs.generatedPreview
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'end' })
          }
        })
      } catch (error) {
        ElMessage.error(error.message || this.$t('moodDiary.generateFailed'))
      } finally {
        this.generating = false
      }
    },
    async saveCurrentMoodIllustration() {
      if (!this.generatedImageUrl) {
        ElMessage.warning(this.$t('moodDiary.generateFailed'))
        return
      }
      await this.saveComposedToCreation(this.generatedImageUrl)
    },
    async composeMoodCardImage(imageUrl, text) {
      const sourceUrl = await this.normalizeImageUrl(imageUrl)
      const image = await this.loadImage(sourceUrl)
      const canvas = document.createElement('canvas')
      const canvasWidth = 1024
      const imageHeight = 620
      const padding = 44
      const textLines = this.wrapText(text, 30)
      const lineHeight = 42
      const textHeight = Math.max(180, textLines.length * lineHeight + 60)
      canvas.width = canvasWidth
      canvas.height = imageHeight + textHeight + padding * 2

      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#f5f7fa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 卡片背景阴影（柔和模糊）
      const cardX = 36
      const cardY = 36
      const cardWidth = canvasWidth - 72
      const cardHeight = canvas.height - 72
      this.roundRectPath(ctx, cardX, cardY, cardWidth, cardHeight, 34)
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(42, 31, 66, 0.16)'
      ctx.shadowBlur = 26
      ctx.shadowOffsetY = 8
      ctx.fill()
      ctx.restore()

      // 插画区域：圆角 + 轻微边缘模糊过渡感
      const imageX = cardX + 24
      const imageY = cardY + 24
      const imageW = cardWidth - 48
      const imageH = imageHeight - 24
      ctx.save()
      this.roundRectPath(ctx, imageX, imageY, imageW, imageH, 28)
      ctx.clip()
      const drawSize = this.fitContain(image.width, image.height, imageW, imageH)
      const drawX = imageX + (imageW - drawSize.width) / 2
      const drawY = imageY + (imageH - drawSize.height) / 2
      ctx.filter = 'blur(0.3px)'
      ctx.drawImage(image, drawX, drawY, drawSize.width, drawSize.height)
      ctx.restore()
      ctx.filter = 'none'

      // 文字区
      const textY = imageY + imageH + 36
      ctx.fillStyle = '#1f2430'
      ctx.font = '600 34px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textBaseline = 'top'
      textLines.forEach((line, index) => {
        ctx.fillText(line, imageX, textY + index * lineHeight)
      })

      return canvas.toDataURL('image/jpeg', 0.92)
    },
    async saveComposedToCreation(dataUrl) {
      const token = localStorage.getItem('token') || ''
      if (!token) {
        ElMessage.warning(this.$t('moodDiary.saveNeedLogin'))
        return
      }
      this.savingCreation = true
      try {
        const response = await this.$http.post(
          '/ill/',
          {
            picture: dataUrl,
            title: this.$t('moodDiary.creationTitle'),
            description: this.diaryContent.trim(),
            type: 'others'
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + token
            }
          }
        )
        const ok = response?.data?.desc === 'success' || response?.data?.code === 0 || response?.data?.code === '0'
        if (!ok) throw new Error(response?.data?.message || this.$t('moodDiary.saveCreationFailed'))
        ElMessage.success(this.$t('moodDiary.saveCreationSuccess'))
      } catch (error) {
        ElMessage.error(error.message || this.$t('moodDiary.saveCreationFailed'))
      } finally {
        this.savingCreation = false
      }
    },
    async normalizeImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
      return `https://static.kidstory.cc/${url}`
    },
    loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(this.$t('moodDiary.generateFailed')))
        img.src = url
      })
    },
    roundRectPath(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2)
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + width, y, x + width, y + height, r)
      ctx.arcTo(x + width, y + height, x, y + height, r)
      ctx.arcTo(x, y + height, x, y, r)
      ctx.arcTo(x, y, x + width, y, r)
      ctx.closePath()
    },
    fitContain(sourceW, sourceH, maxW, maxH) {
      const ratio = Math.min(maxW / sourceW, maxH / sourceH)
      return { width: sourceW * ratio, height: sourceH * ratio }
    },
    wrapText(text, maxCharsPerLine) {
      if (!text) return ['']
      const lines = []
      let current = ''
      Array.from(text).forEach((ch) => {
        current += ch
        if (current.length >= maxCharsPerLine) {
          lines.push(current)
          current = ''
        }
      })
      if (current) lines.push(current)
      return lines.slice(0, 10)
    }
  },
  mounted() {
    this.moodDialogVisible = true
    this.loadMoodDiaryDraft()
  }
}
</script>

<style scoped>
.mood-diary-page {
  min-height: calc(100vh - 138px);
  padding:  24px;
  background: #f5f7fa;
  box-sizing: border-box;
}

.mood-diary-card {
  width: min(880px, 100%);
  min-height: calc(100vh - 138px);
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(31, 35, 41, 0.08);
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.page-subtitle {
  margin: 8px 0 16px;
  color: #606266;
  font-size: 14px;
}

.diary-input-wrap {
  position: relative;
  margin-bottom: 4px;
}

.diary-mood-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 160px;
  height: 160px;
  transform: translate(-50%, -50%);
  object-fit: contain;
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}

.diary-entry-input {
  position: relative;
  z-index: 2;
}

.diary-entry-input :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.8);
}

.actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.illustration-generator {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fcfcff;
}

.section-title {
  margin: 0 0 10px;
  font-size: 15px;
  color: #303133;
}

.generator-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
}

.style-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.style-chip {
  width: 100%;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.style-chip img {
  width: 72px;
  height: 48px;
  border-radius: 6px;
  border: 1px dashed #dcdfe6;
  background: #f5f7fa;
  object-fit: cover;
  display: block;
}

.style-chip span {
  font-size: 10px;
  line-height: 1.2;
  color: #606266;
  text-align: center;
  word-break: break-word;
}

.style-chip:hover,
.style-chip.active {
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.12);
}

.generator-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.generated-preview {
  margin-top: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #f8f8fb;
  padding: 8px;
}

.generated-image-img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.dialog-title {
  margin: 0;
  color: #303133;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 10px;
  max-height: 56vh;
  overflow-y: auto;
  padding-right: 2px;
}

.mood-item {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fff;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mood-item img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.mood-item span {
  font-size: 11px;
  color: #606266;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
}

.mood-item:hover,
.mood-item.active {
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.12);
}

@media (max-width: 767px) {
  .mood-diary-page {
    padding: 62px 10px 14px;
  }

  .mood-diary-card {
    padding: 12px;
    border-radius: 10px;
  }

  .page-title {
    font-size: 20px;
  }

  .mood-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    max-height: 62vh;
  }

  .style-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .style-chip {
    width: 100%;
    min-width: 0;
  }

  .style-chip img {
    width: 66px;
    height: 44px;
  }
}
</style>
