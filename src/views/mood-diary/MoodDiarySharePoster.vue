<template>
  <div class="md-card md-poster">
    <h1 class="md-title">{{ $t('moodDiary.sharePosterTitle') }}</h1>
    <p class="muted">{{ $t('moodDiary.sharePosterHint') }}</p>
    <div v-loading="busy" class="canvas-wrap">
      <img v-if="dataUrl" :src="dataUrl" alt="" class="poster-preview" />
    </div>
    <div class="actions">
      <el-button type="primary" :disabled="!dataUrl" @click="save">{{ $t('moodDiary.savePosterAlbum') }}</el-button>
      <router-link class="lnk" to="/mood-diary/recap">{{ $t('moodDiary.backRecap') }}</router-link>
    </div>
  </div>
</template>

<script>
import { drawSharePoster, downloadDataUrl } from '@/utils/moodDiary/sharePosterDraw'
import { ElMessage } from 'element-plus'

const POSTER_KEY = 'mood_diary_share_poster_payload'

export default {
  name: 'MoodDiarySharePoster',
  data() {
    return {
      dataUrl: '',
      busy: false
    }
  },
  mounted() {
    this.render()
  },
  methods: {
    async render() {
      this.busy = true
      try {
        let payload = {}
        try {
          const raw = sessionStorage.getItem(POSTER_KEY)
          if (raw) payload = JSON.parse(raw)
        } catch (_) {
          payload = {}
        }
        if (!payload.title && this.$route.query.period === 'month') {
          payload.title = this.$t('moodDiary.monthlyRecapShareTitle')
        }
        if (!payload.title) {
          payload.title = this.$t('moodDiary.weeklyRecapShareTitle')
        }
        if (!payload.bodyLines || !payload.bodyLines.length) {
          payload.bodyLines = [this.$t('moodDiary.sharePosterEmpty')]
        }
        this.dataUrl = await drawSharePoster(payload)
      } catch (_) {
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
.md-card {
  max-width: 640px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(31, 35, 41, 0.08);
}

.md-title {
  margin: 0 0 6px;
  font-size: 20px;
}

.muted {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
}

.canvas-wrap {
  min-height: 120px;
  margin-bottom: 14px;
}

.poster-preview {
  width: 100%;
  height: auto;
  border-radius: 10px;
  border: 1px solid #ebeef5;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lnk {
  font-size: 13px;
  color: #8167a9;
}
</style>
