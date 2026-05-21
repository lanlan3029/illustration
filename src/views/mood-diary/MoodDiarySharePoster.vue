<template>
  <div class="md-share">
    <header class="share-head">
      <router-link class="share-back" to="/mood-diary/recap">
        <span aria-hidden="true">←</span>
        {{ $t('moodDiary.backRecap') }}
      </router-link>
      <h1 class="share-title">{{ $t('moodDiary.sharePosterTitle') }}</h1>
      <p class="share-sub">{{ $t('moodDiary.sharePosterHint') }}</p>
    </header>

    <section class="share-preview-card" :aria-label="$t('moodDiary.sharePosterPreview')">
      <div class="share-preview-card__label">{{ $t('moodDiary.sharePosterPreview') }}</div>
      <div v-loading="busy" class="share-preview-stage">
        <img v-if="dataUrl" :src="dataUrl" class="share-preview-img" alt="" />
        <div v-else-if="!busy" class="share-preview-empty">
          <span class="share-preview-empty__icon" aria-hidden="true">
            <i class="iconfont icon-changtu" />
          </span>
          <p>{{ $t('moodDiary.sharePosterEmpty') }}</p>
          <router-link class="share-preview-empty__link" to="/mood-diary/recap">
            {{ $t('moodDiary.backRecap') }}
          </router-link>
        </div>
      </div>
    </section>

    <footer class="share-foot">
      <el-button
        type="primary"
        class="share-btn share-btn--primary"
        :disabled="!dataUrl || busy"
        @click="save"
      >
        {{ $t('moodDiary.savePosterAlbum') }}
      </el-button>
      <el-button class="share-btn" :disabled="!hasContent || busy" @click="render">
        {{ $t('moodDiary.sharePosterRegenerate') }}
      </el-button>
    </footer>
  </div>
</template>

<script>
import {
  drawSharePoster,
  downloadDataUrl,
  hasSharePosterContent
} from '@/utils/moodDiary/sharePosterDraw'
import { ElMessage } from 'element-plus'

const POSTER_KEY = 'mood_diary_share_poster_payload'

export default {
  name: 'MoodDiarySharePoster',
  data() {
    return {
      dataUrl: '',
      busy: false,
      hasContent: false,
      payload: null
    }
  },
  mounted() {
    this.render()
  },
  methods: {
    readPayload() {
      try {
        const raw = sessionStorage.getItem(POSTER_KEY)
        if (!raw) return null
        return JSON.parse(raw)
      } catch (_) {
        return null
      }
    },
    async render() {
      this.busy = true
      this.dataUrl = ''
      this.payload = this.readPayload()
      this.hasContent = hasSharePosterContent(this.payload)

      if (!this.hasContent) {
        this.busy = false
        return
      }

      try {
        this.dataUrl = await drawSharePoster(this.payload)
      } catch (_) {
        this.hasContent = false
        this.dataUrl = ''
        ElMessage.error(this.$t('moodDiary.sharePosterFail'))
      } finally {
        this.busy = false
      }
    },
    save() {
      if (!this.dataUrl) return
      downloadDataUrl(`mood-recap-${Date.now()}.jpg`, this.dataUrl)
      ElMessage.success(this.$t('moodDiary.downloadSuccess'))
    }
  }
}
</script>

<style scoped>
.md-share {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px 16px;
  box-sizing: border-box;
}

.share-head {
  flex-shrink: 0;
}

.share-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-muted);
  text-decoration: none;
}

.share-back:hover {
  color: var(--md-accent-deep);
}

.share-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--md-text);
}

.share-sub {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--md-muted);
}

.share-preview-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 252, 254, 0.84);
  backdrop-filter: blur(16px) saturate(1.06);
  -webkit-backdrop-filter: blur(16px) saturate(1.06);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 8px 28px rgba(196, 181, 224, 0.12);
}

.share-preview-card__label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--md-muted);
}

.share-preview-stage {
  flex: 1;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 16px;
  background: var(--md-surface);
  border: 1px dashed var(--md-border);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.share-preview-img {
  width: min(100%, 360px);
  height: auto;
  border-radius: 12px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.85),
    0 10px 28px rgba(196, 181, 224, 0.18);
}

.share-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  text-align: center;
}

.share-preview-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--md-poster-slot);
  color: var(--md-accent-deep);
}

.share-preview-empty__icon .iconfont {
  font-size: 28px;
  line-height: 1;
}

.share-preview-empty p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--md-muted);
}

.share-preview-empty__link {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-accent-deep);
  text-decoration: none;
}

.share-preview-empty__link:hover {
  text-decoration: underline;
}

.share-foot {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-btn {
  width: 100%;
  margin: 0 !important;
  border-radius: 10px;
  font-weight: 600;
}

.share-btn--primary :deep(.el-button--primary) {
  --el-button-bg-color: var(--md-accent);
  --el-button-border-color: var(--md-accent);
  --el-button-hover-bg-color: var(--md-accent-deep);
  --el-button-hover-border-color: var(--md-accent-deep);
}

.share-foot :deep(.el-button--primary) {
  --el-button-bg-color: var(--md-accent);
  --el-button-border-color: var(--md-accent);
  --el-button-hover-bg-color: var(--md-accent-deep);
  --el-button-hover-border-color: var(--md-accent-deep);
}

.share-foot :deep(.el-button--default) {
  --el-button-text-color: var(--md-text);
  --el-button-border-color: var(--md-border);
  --el-button-bg-color: rgba(255, 252, 254, 0.88);
  --el-button-hover-text-color: var(--md-accent-deep);
  --el-button-hover-bg-color: var(--md-surface);
  --el-button-hover-border-color: var(--md-border);
}

@media (max-width: 900px) {
  .md-share {
    max-width: none;
    padding: 4px 0 12px;
  }

  .share-preview-stage {
    min-height: 240px;
  }
}
</style>
