<template>
  <div class="md-book-page">
    <header class="book-toolbar">
      <h1 class="book-title">{{ $t('moodDiary.navBook') }}</h1>
      <el-button :loading="refreshing" @click="pullRefresh">{{ $t('moodDiary.pullRefresh') }}</el-button>
    </header>

    <div v-if="tokenOk" class="cloud-bar">
      <span class="cloud-label">{{ $t('moodDiary.cloudMoodCreations') }}</span>
      <el-button link type="primary" size="small" :loading="cloudLoading" @click="loadCloudMoodIlls">
        {{ $t('moodDiary.refreshCloud') }}
      </el-button>
    </div>

    <p v-if="!monthTimeline.length" class="book-empty">{{ $t('moodDiary.bookEmpty') }}</p>

    <div v-else ref="scrollRoot" class="book-scroll" @scroll="onScroll">
      <section
        v-for="group in visibleMonthGroups"
        :key="group.key"
        class="month-section"
      >
        <div class="month-axis">
          <span class="month-dot" aria-hidden="true" />
          <h2 class="month-label">{{ group.label }}</h2>
          <span class="month-count">{{ group.records.length }}</span>
        </div>

        <div class="month-stream masonry-lane">
          <article
            v-for="(r, idx) in group.records"
            :key="`m-${r.id}`"
            class="entry-card entry-card--stream"
            :class="{ 'entry-card--right': idx % 2 === 1 }"
            @click="openPreview(r)"
          >
            <img
              v-if="r.posterDataUrl"
              :src="r.posterDataUrl"
              class="entry-img"
              alt=""
              loading="lazy"
            />
            <div v-else class="entry-img entry-img--empty" />
            <div class="entry-body">
              <div class="entry-meta">
                <time class="entry-date">{{ formatDay(r.createdAt) }}</time>
                <span v-if="r.moodLabel" class="entry-mood">{{ r.moodLabel }}</span>
              </div>
              <p class="entry-text">{{ excerpt(r.caption || r.narrative) }}</p>
            </div>
          </article>
        </div>

        <div class="month-lanes">
          <div class="lane lane--left masonry-lane">
            <article
              v-for="r in laneRecords(group, 'left')"
              :key="r.id"
              class="entry-card"
              @click="openPreview(r)"
            >
              <img
                v-if="r.posterDataUrl"
                :src="r.posterDataUrl"
                class="entry-img"
                alt=""
                loading="lazy"
              />
              <div v-else class="entry-img entry-img--empty" />
              <div class="entry-body">
                <div class="entry-meta">
                  <time class="entry-date">{{ formatDay(r.createdAt) }}</time>
                  <span v-if="r.moodLabel" class="entry-mood">{{ r.moodLabel }}</span>
                </div>
                <p class="entry-text">{{ excerpt(r.caption || r.narrative) }}</p>
              </div>
            </article>
          </div>

          <div class="lane-spine" aria-hidden="true" />

          <div class="lane lane--right masonry-lane">
            <article
              v-for="r in laneRecords(group, 'right')"
              :key="r.id"
              class="entry-card"
              @click="openPreview(r)"
            >
              <img
                v-if="r.posterDataUrl"
                :src="r.posterDataUrl"
                class="entry-img"
                alt=""
                loading="lazy"
              />
              <div v-else class="entry-img entry-img--empty" />
              <div class="entry-body">
                <div class="entry-meta">
                  <time class="entry-date">{{ formatDay(r.createdAt) }}</time>
                  <span v-if="r.moodLabel" class="entry-mood">{{ r.moodLabel }}</span>
                </div>
                <p class="entry-text">{{ excerpt(r.caption || r.narrative) }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

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
import { groupRecordsByMonth } from '@/utils/moodDiary/recordGroups'
import { fetchUserMoodIllustrations, resolveIllustrationContentUrl } from '@/utils/moodDiary/api'

const MONTHS_PER_PAGE = 2

export default {
  name: 'MoodDiaryBook',
  data() {
    return {
      monthTimeline: [],
      visibleMonthCount: MONTHS_PER_PAGE,
      loadingMore: false,
      refreshing: false,
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
    if (this.tokenOk) this.loadCloudMoodIlls()
    this.$nextTick(() => this.setupInfiniteLoad())
  },
  beforeUnmount() {
    this.observer?.disconnect()
    this.observer = null
  },
  methods: {
    load() {
      this.monthTimeline = groupRecordsByMonth(this.$i18n?.locale).map((g) => ({
        ...g,
        records: g.records.map((r, i) => ({ ...r, _laneIndex: i }))
      }))
      this.visibleMonthCount = Math.min(MONTHS_PER_PAGE, this.monthTimeline.length || MONTHS_PER_PAGE)
      this.$nextTick(() => this.setupInfiniteLoad())
    },
    laneRecords(group, side) {
      return group.records.filter((r) => {
        const onLeft = r._laneIndex % 2 === 0
        return side === 'left' ? onLeft : !onLeft
      })
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
      setTimeout(async () => {
        this.load()
        if (this.tokenOk) await this.loadCloudMoodIlls()
        this.refreshing = false
        ElMessage.success(this.$t('moodDiary.refreshed'))
      }, 280)
    },
    formatDay(ts) {
      const d = new Date(ts || Date.now())
      const locale = this.$i18n?.locale === 'zh' ? 'zh-CN' : 'en-US'
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    },
    excerpt(s) {
      const t = (s || '').trim()
      if (t.length <= 100) return t || '—'
      return t.slice(0, 100) + '…'
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
    openPreview(r) {
      this.previewPoster = r.posterDataUrl || ''
      this.previewOpen = !!this.previewPoster
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
  padding: 8px 20px 28px;
  -webkit-overflow-scrolling: touch;
}

.month-section {
  width: 100%;
  margin-bottom: 28px;
}

.month-axis {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
  position: relative;
}

.month-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #20c997;
  box-shadow: 0 0 0 4px rgba(32, 201, 151, 0.2);
  flex-shrink: 0;
}

.month-label {
  margin: 0;
  font-size: 17px;
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

.month-stream {
  display: none;
}

.month-lanes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2px minmax(0, 1fr);
  gap: 0 16px;
  align-items: start;
  position: relative;
}

.lane-spine {
  width: 2px;
  background: linear-gradient(180deg, #20c997 0%, #e2e8f0 100%);
  border-radius: 2px;
  min-height: 100%;
  align-self: stretch;
}

/* 瀑布流：每侧多列 masonry */
.masonry-lane {
  column-gap: 14px;
}

.lane--left {
  column-count: 2;
}

.lane--right {
  column-count: 2;
}

@media (max-width: 900px) {
  .lane--left,
  .lane--right {
    column-count: 1;
  }
}

.entry-card {
  width: 100%;
  break-inside: avoid;
  margin-bottom: 14px;
  border: 1px solid #e8ecf1;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
  display: inline-block;
  box-sizing: border-box;
}

.entry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}

.entry-img {
  width: 100%;
  height: auto;
  display: block;
  vertical-align: top;
}

.entry-img--empty {
  min-height: 140px;
  background: #e2e8f0;
}

.entry-body {
  padding: 12px 14px 14px;
}

.entry-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}

.entry-date {
  color: #64748b;
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
  line-height: 1.5;
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

.entry-card--stream {
  max-width: 88%;
}

.entry-card--stream.entry-card--right {
  margin-left: auto;
}

@media (max-width: 768px) {
  .month-stream {
    display: block;
    column-count: 1;
  }

  .month-lanes {
    display: none;
  }
}
</style>
