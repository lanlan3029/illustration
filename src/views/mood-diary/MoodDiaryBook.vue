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
      <div class="timeline">
        <section
          v-for="group in visibleMonthGroups"
          :key="group.key"
          class="month-section"
        >
          <div class="month-head">
            <span class="month-dot" aria-hidden="true" />
            <h2 class="month-label">{{ group.label }}</h2>
            <span class="month-count">{{ group.records.length }}</span>
          </div>

          <ul class="month-entries">
            <li v-for="r in group.records" :key="r.id">
              <article class="entry-row" @click="openPreview(r)">
                <div class="entry-thumb-wrap">
                  <img
                    v-if="r.posterDataUrl"
                    :src="r.posterDataUrl"
                    class="entry-thumb"
                    alt=""
                    loading="lazy"
                  />
                  <div v-else class="entry-thumb entry-thumb--empty" />
                </div>
                <div class="entry-info">
                  <div class="entry-meta">
                    <time class="entry-date">{{ formatDay(r.createdAt) }}</time>
                    <span v-if="r.moodLabel" class="entry-mood">{{ r.moodLabel }}</span>
                  </div>
                  <p class="entry-text">{{ excerpt(r.caption || r.narrative, 48) }}</p>
                </div>
              </article>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="loadingMore" class="book-loading">{{ $t('moodDiary.loadingMore') }}</div>
      <div v-else-if="hasMore" ref="loadSentinel" class="load-sentinel" aria-hidden="true" />
      <p v-else-if="visibleMonthGroups.length" class="book-end">{{ $t('moodDiary.timelineEnd') }}</p>
    </div>

    <el-dialog v-model="previewOpen" width="min(520px, 92vw)" :title="$t('moodDiary.previewTitle')">
      <img v-if="previewPoster" :src="previewPoster" class="dlg-img" alt="" />
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { groupRecordsFromList, mergeBookRecords } from '@/utils/moodDiary/recordGroups'
import { getRecordsSorted } from '@/utils/moodDiary/records'
import { fetchUserMoodIllustrations, mapIllToBookRecord } from '@/utils/moodDiary/api'
import { exportMoodDiaryPdf } from '@/utils/moodDiary/exportMoodDiaryPdf'

const MONTHS_PER_PAGE = 2

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
      previewPoster: '',
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
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    },
    excerpt(s, max = 100) {
      const t = (s || '').trim()
      if (t.length <= max) return t || '—'
      return t.slice(0, max) + '…'
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
      this.previewPoster = r.posterDataUrl || ''
      this.previewOpen = !!this.previewPoster
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
  padding: 8px 24px 28px;
  -webkit-overflow-scrolling: touch;
}

.timeline {
  max-width: 560px;
  margin: 0 auto;
  position: relative;
  padding-left: 28px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(180deg, #20c997 0%, #e2e8f0 85%);
  border-radius: 2px;
}

.month-section {
  position: relative;
  margin-bottom: 24px;
}

.month-section:last-child {
  margin-bottom: 8px;
}

.month-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  position: relative;
}

.month-dot {
  position: absolute;
  left: -28px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #20c997;
  box-shadow: 0 0 0 4px rgba(32, 201, 151, 0.2);
  flex-shrink: 0;
}

.month-label {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.month-count {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 999px;
}

.month-entries {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.month-entries > li {
  margin: 0;
  padding: 0;
}

.entry-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.entry-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.entry-thumb-wrap {
  flex-shrink: 0;
  width: 56px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
}

.entry-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.entry-thumb--empty {
  width: 100%;
  height: 100%;
  background: #e2e8f0;
}

.entry-info {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.entry-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.entry-date {
  color: #64748b;
  font-weight: 500;
}

.entry-mood {
  color: #0d9488;
  background: rgba(32, 201, 151, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  flex-shrink: 0;
}

.entry-text {
  margin: 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.45;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
