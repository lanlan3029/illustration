<template>
  <div class="md-card md-book">
    <div class="toolbar">
      <h1 class="md-title">{{ $t('moodDiary.navBook') }}</h1>
      <el-button :loading="refreshing" @click="pullRefresh">{{ $t('moodDiary.pullRefresh') }}</el-button>
    </div>
    <div class="md-fill">
      <p v-if="!records.length" class="empty">{{ $t('moodDiary.bookEmpty') }}</p>
      <div v-else class="timeline">
        <article
          v-for="r in records"
          :key="r.id"
          class="tl-card"
          @click="openPreview(r)"
        >
          <div class="tl-meta">
            <span class="tl-date">{{ formatDate(r.createdAt) }}</span>
            <span v-if="r.moodLabel" class="tl-mood">{{ r.moodLabel }}</span>
          </div>
          <p class="tl-text">{{ excerpt(r.narrative) }}</p>
          <img v-if="r.thumbUrl || r.posterDataUrl" :src="r.thumbUrl || r.posterDataUrl" class="tl-thumb" alt="" />
        </article>
      </div>
    </div>

    <div class="footer-links">
      <router-link class="lnk" to="/mood-diary/recap">{{ $t('moodDiary.goRecap') }}</router-link>
      <router-link class="lnk" to="/mood-diary/narrative">{{ $t('moodDiary.goToNow') }}</router-link>
    </div>

    <el-dialog v-model="previewOpen" width="min(520px, 92vw)" :title="$t('moodDiary.previewTitle')">
      <img v-if="previewPoster" :src="previewPoster" class="dlg-img" alt="" />
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { getRecordsSorted } from '@/utils/moodDiary/records'

export default {
  name: 'MoodDiaryBook',
  data() {
    return {
      records: [],
      refreshing: false,
      previewOpen: false,
      previewPoster: ''
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    load() {
      this.records = getRecordsSorted().map((r) => ({
        ...r,
        thumbUrl: r.posterDataUrl
      }))
    },
    pullRefresh() {
      this.refreshing = true
      setTimeout(() => {
        this.load()
        this.refreshing = false
        ElMessage.success(this.$t('moodDiary.refreshed'))
      }, 280)
    },
    formatDate(ts) {
      const d = new Date(ts || Date.now())
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    excerpt(s) {
      const t = (s || '').trim()
      if (t.length <= 80) return t || '—'
      return t.slice(0, 80) + '…'
    },
    openPreview(r) {
      this.previewPoster = r.posterDataUrl || ''
      this.previewOpen = !!this.previewPoster
    }
  }
}
</script>

<style scoped>
.md-card.md-book {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
  align-self: center;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(31, 35, 41, 0.08);
  box-sizing: border-box;
}

.md-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.md-title {
  margin: 0;
  font-size: 20px;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: #909399;
  font-size: 14px;
  text-align: center;
  min-height: 120px;
}

.timeline {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tl-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.tl-card:hover {
  box-shadow: 0 4px 14px rgba(31, 35, 41, 0.08);
}

.tl-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.tl-mood {
  color: #8167a9;
}

.tl-text {
  margin: 0 0 8px;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

.tl-thumb {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.footer-links {
  flex-shrink: 0;
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.lnk {
  font-size: 13px;
  color: #8167a9;
}

.dlg-img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>
