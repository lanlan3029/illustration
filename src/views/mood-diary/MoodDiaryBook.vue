<template>
  <div class="md-card md-book">
    <div class="toolbar">
      <h1 class="md-title">{{ $t('moodDiary.navBook') }}</h1>
      <el-button :loading="refreshing" @click="pullRefresh">{{ $t('moodDiary.pullRefresh') }}</el-button>
    </div>

    <div v-if="tokenOk" class="cloud-head">
      <span class="cloud-label">{{ $t('moodDiary.cloudMoodCreations') }}</span>
      <el-button
        link
        type="primary"
        size="small"
        :loading="cloudLoading"
        @click="loadCloudMoodIlls"
      >
        {{ $t('moodDiary.refreshCloud') }}
      </el-button>
    </div>
    <p v-if="tokenOk" class="cloud-hint">{{ $t('moodDiary.cloudMoodCreationsHint') }}</p>
    <div v-if="tokenOk && cloudMoodIlls.length" class="cloud-strip-wrap">
      <div class="cloud-strip">
        <button
          v-for="item in cloudMoodIlls"
          :key="item._id"
          type="button"
          class="cloud-thumb"
          @click="openCloudPreview(item)"
        >
          <img :src="illCover(item)" alt="" />
        </button>
      </div>
    </div>
    <p v-else-if="tokenOk && cloudLoaded && !cloudLoading && !cloudMoodIlls.length" class="cloud-empty">
      {{ $t('moodDiary.cloudMoodCreationsEmpty') }}
    </p>

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
import { fetchUserMoodIllustrations, resolveIllustrationContentUrl } from '@/utils/moodDiary/api'

export default {
  name: 'MoodDiaryBook',
  data() {
    return {
      records: [],
      refreshing: false,
      previewOpen: false,
      previewPoster: '',
      cloudMoodIlls: [],
      cloudLoading: false,
      cloudLoaded: false
    }
  },
  computed: {
    tokenOk() {
      const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
      return !!(t && t !== 'undefined')
    }
  },
  mounted() {
    this.load()
    if (this.tokenOk) this.loadCloudMoodIlls()
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
      setTimeout(async () => {
        this.load()
        if (this.tokenOk) await this.loadCloudMoodIlls()
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
    illCover(item) {
      return resolveIllustrationContentUrl(item?.content || item?.picture || '')
    },
    async loadCloudMoodIlls() {
      if (!this.tokenOk) return
      this.cloudLoading = true
      try {
        this.cloudMoodIlls = await fetchUserMoodIllustrations(1)
      } catch (e) {
        this.cloudMoodIlls = []
        ElMessage.error(e.message || this.$t('moodDiary.cloudMoodLoadFailed'))
      } finally {
        this.cloudLoaded = true
        this.cloudLoading = false
      }
    },
    openCloudPreview(item) {
      const url = this.illCover(item)
      this.previewPoster = url || ''
      this.previewOpen = !!this.previewPoster
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

.cloud-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.cloud-label {
  font-size: 14px;
  font-weight: 600;
  color: #2b2640;
}

.cloud-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.45;
}

.cloud-strip-wrap {
  flex-shrink: 0;
  margin-bottom: 14px;
  max-width: 100%;
}

.cloud-strip {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.cloud-thumb {
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  padding: 0;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f7fa;
}

.cloud-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cloud-empty {
  flex-shrink: 0;
  margin: 0 0 14px;
  font-size: 12px;
  color: #a8abb2;
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
