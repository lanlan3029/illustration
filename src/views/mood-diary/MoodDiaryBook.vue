<template>
  <div class="md-book-page">
    <header class="book-toolbar">
      <h1 class="book-title">{{ $t('moodDiary.navBook') }}</h1>
      <div class="book-toolbar-actions">
        <el-tooltip :content="$t('moodDiary.exportPdfHint')" placement="bottom">
          <el-button :loading="exportingPdf" :disabled="!monthTimeline.length" @click="exportPdf">
            {{ $t('moodDiary.exportPdfLabel') }}
          </el-button>
        </el-tooltip>
        <el-button :loading="refreshing" @click="pullRefresh">{{ $t('moodDiary.pullRefresh') }}</el-button>
      </div>
    </header>

    <div v-if="tokenOk" class="cloud-bar">
      <span class="cloud-label">{{ $t('moodDiary.cloudMoodCreations') }}</span>
      <el-button link type="primary" size="small" :loading="cloudLoading" @click="loadCloudMoodIlls">
        {{ $t('moodDiary.refreshCloud') }}
      </el-button>
    </div>

    <p v-if="!monthTimeline.length" class="book-empty">{{ $t('moodDiary.bookEmpty') }}</p>

    <div v-else ref="scrollRoot" class="book-scroll" @scroll="onScroll">
      <div class="book-album">
        <section
          v-for="group in visibleMonthGroups"
          :key="group.key"
          class="month-block"
        >
          <header class="month-head">
            <h2 class="month-label">{{ group.label }}</h2>
            <span class="month-count">{{ group.records.length }}</span>
          </header>

          <div class="month-grid">
            <button
              v-for="r in group.records"
              :key="r.id"
              type="button"
              class="grid-cell"
              @click="openPreview(r)"
            >
              <img
                v-if="r.posterDataUrl"
                :src="r.posterDataUrl"
                class="grid-img"
                alt=""
                loading="lazy"
              />
              <span v-else class="grid-img grid-img--empty" />
              <span class="grid-overlay">
                <time class="grid-day">{{ formatGridDay(r.createdAt) }}</time>
                <span v-if="r.moodLabel" class="grid-mood">{{ r.moodLabel }}</span>
              </span>
            </button>
          </div>
        </section>
      </div>

      <div v-if="loadingMore" class="book-loading">{{ $t('moodDiary.loadingMore') }}</div>
      <div v-else-if="hasMore" ref="loadSentinel" class="load-sentinel" aria-hidden="true" />
      <p v-else-if="visibleMonthGroups.length" class="book-end">{{ $t('moodDiary.timelineEnd') }}</p>
    </div>

    <el-dialog
      v-model="previewOpen"
      width="min(420px, 92vw)"
      class="preview-dialog"
      :title="$t('moodDiary.previewTitle')"
    >
      <div v-if="previewRecord" class="preview-body">
        <img
          v-if="previewRecord.posterDataUrl"
          :src="previewRecord.posterDataUrl"
          class="dlg-img"
          alt=""
        />
        <div class="preview-meta">
          <time class="preview-date">{{ formatDay(previewRecord.createdAt) }}</time>
          <span v-if="previewRecord.moodLabel" class="preview-mood">{{ previewRecord.moodLabel }}</span>
        </div>
        <p v-if="previewText" class="preview-text">{{ previewText }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { groupRecordsFromList, mergeBookRecords } from '@/utils/moodDiary/recordGroups'
import { getRecordsSorted } from '@/utils/moodDiary/records'
import { fetchUserMoodIllustrations, mapIllToBookRecord } from '@/utils/moodDiary/api'
import { exportMoodDiaryPdf } from '@/utils/moodDiary/exportMoodDiaryPdf'

const MONTHS_PER_PAGE = 4

export default {
  name: 'MoodDiaryBook',
  data() {
    return {
      monthTimeline: [],
      visibleMonthCount: MONTHS_PER_PAGE,
      loadingMore: false,
      refreshing: false,
      exportingPdf: false,
      previewOpen: false,
      previewRecord: null,
      cloudMoodIlls: [],
      cloudLoading: false,
      cloudLoaded: false,
      observer: null
    }
  },
  computed: {
    tokenOk() {
      const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
      return !!(t && t !== 'undefined')
    },
    visibleMonthGroups() {
      return this.monthTimeline.slice(0, this.visibleMonthCount)
    },
    hasMore() {
      return this.visibleMonthCount < this.monthTimeline.length
    },
    previewText() {
      const t = (this.previewRecord?.caption || this.previewRecord?.narrative || '').trim()
      return t || ''
    }
  },
  mounted() {
    this.load()
  },
  beforeUnmount() {
    this.observer?.disconnect()
    this.observer = null
  },
  methods: {
    async load() {
      const locale = this.$i18n?.locale
      let cloudRecords = []
      if (this.tokenOk) {
        try {
          const list = await fetchUserMoodIllustrations(1)
          this.cloudMoodIlls = list
          cloudRecords = list.map(mapIllToBookRecord).filter(Boolean)
        } catch (e) {
          this.cloudMoodIlls = []
          console.warn('[mood-diary] load cloud mood illustrations failed', e)
        } finally {
          this.cloudLoaded = true
          this.cloudLoading = false
        }
      }
      const merged = mergeBookRecords(getRecordsSorted(), cloudRecords)
      this.monthTimeline = groupRecordsFromList(merged, locale)
      this.visibleMonthCount = Math.min(MONTHS_PER_PAGE, this.monthTimeline.length || MONTHS_PER_PAGE)
      this.$nextTick(() => this.setupInfiniteLoad())
    },
    setupInfiniteLoad() {
      this.observer?.disconnect()
      const el = this.$refs.loadSentinel
      if (!el || !this.hasMore) return
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this.loadMoreMonths()
        },
        { root: this.$refs.scrollRoot, rootMargin: '120px', threshold: 0 }
      )
      this.observer.observe(el)
    },
    loadMoreMonths() {
      if (this.loadingMore || !this.hasMore) return
      this.loadingMore = true
      setTimeout(() => {
        this.visibleMonthCount = Math.min(
          this.visibleMonthCount + MONTHS_PER_PAGE,
          this.monthTimeline.length
        )
        this.loadingMore = false
        this.$nextTick(() => this.setupInfiniteLoad())
      }, 320)
    },
    onScroll() {
      const root = this.$refs.scrollRoot
      if (!root || this.loadingMore || !this.hasMore) return
      if (root.scrollHeight - root.scrollTop - root.clientHeight < 160) {
        this.loadMoreMonths()
      }
    },
    pullRefresh() {
      this.refreshing = true
      this.cloudLoading = true
      this.load()
        .then(() => {
          ElMessage.success(this.$t('moodDiary.refreshed'))
        })
        .finally(() => {
          this.refreshing = false
        })
    },
    formatDay(ts) {
      const d = new Date(ts || Date.now())
      const locale = this.$i18n?.locale === 'zh' ? 'zh-CN' : 'en-US'
      return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    },
    formatGridDay(ts) {
      const d = new Date(ts || Date.now())
      if (this.$i18n?.locale === 'zh' || this.$i18n?.locale?.startsWith?.('zh')) {
        return `${d.getMonth() + 1}/${d.getDate()}`
      }
      return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    },
    async loadCloudMoodIlls() {
      if (!this.tokenOk) return
      this.cloudLoading = true
      try {
        await this.load()
      } catch (e) {
        ElMessage.error(e.message || this.$t('moodDiary.cloudMoodLoadFailed'))
      }
    },
    openPreview(r) {
      if (!r?.posterDataUrl) return
      this.previewRecord = r
      this.previewOpen = true
    },
    async exportPdf() {
      if (!this.monthTimeline.length || this.exportingPdf) return
      this.exportingPdf = true
      ElMessage.info(this.$t('moodDiary.exportPdfExporting'))
      const locale = this.$i18n?.locale === 'en' ? 'en' : 'zh'
      try {
        await exportMoodDiaryPdf({
          locale,
          title: this.$t('moodDiary.title'),
          exportedLabel: this.$t('moodDiary.exportPdfExportedOn', {
            date: this.formatExportDate(locale)
          }),
          emptyMessage: this.$t('moodDiary.exportPdfEmpty')
        })
        ElMessage.success(this.$t('moodDiary.exportPdfSuccess'))
      } catch (e) {
        ElMessage.error(e.message || this.$t('moodDiary.exportPdfFailed'))
      } finally {
        this.exportingPdf = false
      }
    },
    formatExportDate(locale) {
      const loc = locale === 'zh' ? 'zh-CN' : 'en-US'
      return new Date().toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' })
    }
  }
}
</script>

<style scoped>
.md-book-page {
  width: 100%;
  max-width: 100%;
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
  overflow: hidden;
}

.book-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 12px;
}

.book-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.book-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.cloud-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 12px;
  font-size: 13px;
}

.cloud-label {
  font-weight: 600;
  color: #334155;
}

.book-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 48px 24px;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
}

.book-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 20px 28px;
  -webkit-overflow-scrolling: touch;
}

.book-album {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
}

.month-block {
  margin-bottom: 22px;
}

.month-block:last-child {
  margin-bottom: 6px;
}

.month-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
  padding: 4px 0;
  position: sticky;
  top: 0;
  z-index: 2;
  background: linear-gradient(180deg, #fff 75%, rgba(255, 255, 255, 0));
}

.month-label {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.month-count {
  font-size: 12px;
  color: #94a3b8;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

@media (min-width: 640px) {
  .month-grid {
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 10px;
  }
}

.grid-cell {
  position: relative;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 9 / 16;
  background: #f1f5f9;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.grid-cell:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
}

.grid-cell:focus-visible {
  outline: 2px solid #20c997;
  outline-offset: 2px;
}

.grid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.grid-img--empty {
  background: #e2e8f0;
}

.grid-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 6px 6px 5px;
  background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.55));
  pointer-events: none;
}

.grid-day {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.grid-mood {
  font-size: 10px;
  color: #fff;
  background: rgba(32, 201, 151, 0.85);
  padding: 2px 5px;
  border-radius: 4px;
  max-width: 52%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.preview-date {
  color: #64748b;
}

.preview-mood {
  color: #0d9488;
  background: rgba(32, 201, 151, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.preview-text {
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.55;
  word-break: break-word;
}

.book-loading,
.book-end {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  padding: 16px 0 8px;
}

.load-sentinel {
  height: 1px;
}

.dlg-img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>
