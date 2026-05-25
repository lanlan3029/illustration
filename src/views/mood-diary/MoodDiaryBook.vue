<template>
  <div class="md-book-page">
    <header class="book-toolbar">
      <h1 class="book-title">{{ $t('moodDiary.navBook') }}</h1>
      <div class="book-toolbar-actions">
        <el-radio-group v-model="viewMode" size="small" class="book-view-toggle" @change="persistViewMode">
          <el-radio-button label="grid">{{ $t('moodDiary.bookViewGrid') }}</el-radio-button>
          <el-radio-button label="list">{{ $t('moodDiary.bookViewList') }}</el-radio-button>
        </el-radio-group>
        <el-tooltip :content="$t('moodDiary.exportPdfHint')" placement="bottom">
          <el-button :disabled="!monthTimeline.length" @click="openExportDialog">
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

          <div v-if="viewMode === 'grid'" class="month-grid">
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

          <ul v-else class="month-list">
            <li v-for="r in group.records" :key="r.id">
              <button type="button" class="list-row" @click="openPreview(r)">
                <div class="list-thumb-wrap">
                  <img
                    v-if="r.posterDataUrl"
                    :src="r.posterDataUrl"
                    class="list-thumb"
                    alt=""
                    loading="lazy"
                  />
                  <span v-else class="list-thumb list-thumb--empty" />
                </div>
                <div class="list-info">
                  <div class="list-meta">
                    <time class="list-date">{{ formatDay(r.createdAt) }}</time>
                    <span v-if="r.moodLabel" class="list-mood">{{ r.moodLabel }}</span>
                  </div>
                  <p class="list-text">{{ excerpt(r.caption || r.narrative, 56) }}</p>
                </div>
              </button>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="loadingMore" class="book-loading">{{ $t('moodDiary.loadingMore') }}</div>
      <div v-else-if="hasMore" ref="loadSentinel" class="load-sentinel" aria-hidden="true" />
      <p v-else-if="visibleMonthGroups.length" class="book-end">{{ $t('moodDiary.timelineEnd') }}</p>
    </div>

    <el-dialog
      v-model="exportDialogOpen"
      width="min(480px, 92vw)"
      class="export-dialog"
      :title="$t('moodDiary.exportPdfDialogTitle')"
      @closed="onExportDialogClosed"
    >
      <el-radio-group v-model="exportScope" class="export-scope">
        <el-radio label="all">{{ $t('moodDiary.exportPdfScopeAll') }}</el-radio>
        <el-radio label="month">{{ $t('moodDiary.exportPdfScopeMonth') }}</el-radio>
        <el-radio label="pick">{{ $t('moodDiary.exportPdfScopePick') }}</el-radio>
      </el-radio-group>

      <div v-if="exportScope === 'month'" class="export-panel">
        <p class="export-panel-label">{{ $t('moodDiary.exportPdfSelectMonths') }}</p>
        <el-checkbox-group v-model="exportMonthKeys" class="export-month-group">
          <el-checkbox
            v-for="g in monthTimeline"
            :key="g.key"
            :label="g.key"
            class="export-month-item"
          >
            {{ g.label }}
            <span class="export-item-count">({{ g.records.length }})</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <div v-else-if="exportScope === 'pick'" class="export-panel export-panel--pick">
        <div class="export-pick-toolbar">
          <span class="export-panel-label">{{ $t('moodDiary.exportPdfSelectEntries') }}</span>
          <div class="export-pick-actions">
            <el-button link type="primary" size="small" @click="selectAllForExport">
              {{ $t('moodDiary.exportPdfSelectAll') }}
            </el-button>
            <el-button link size="small" @click="clearExportPick">
              {{ $t('moodDiary.exportPdfClearSelection') }}
            </el-button>
          </div>
        </div>
        <el-checkbox-group v-model="exportPickIds" class="export-pick-group">
          <section v-for="g in monthTimeline" :key="g.key" class="export-pick-month">
            <h3 class="export-pick-month-label">{{ g.label }}</h3>
            <el-checkbox
              v-for="r in g.records"
              :key="recordExportId(r)"
              :label="recordExportId(r)"
              class="export-pick-item"
            >
              <span class="export-pick-row">
                <img
                  v-if="r.posterDataUrl"
                  :src="r.posterDataUrl"
                  class="export-pick-thumb"
                  alt=""
                />
                <span v-else class="export-pick-thumb export-pick-thumb--empty" />
                <span class="export-pick-info">
                  <span class="export-pick-date">{{ formatDay(r.createdAt) }}</span>
                  <span class="export-pick-text">{{ excerpt(r.caption || r.narrative, 40) }}</span>
                </span>
              </span>
            </el-checkbox>
          </section>
        </el-checkbox-group>
      </div>

      <p v-else class="export-panel-hint">{{ $t('moodDiary.exportPdfScopeAllHint') }}</p>

      <template #footer>
        <el-button @click="exportDialogOpen = false">{{ $t('moodDiary.exportPdfCancel') }}</el-button>
        <el-button type="primary" :loading="exportingPdf" @click="confirmExportPdf">
          {{ $t('moodDiary.exportPdfConfirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewOpen"
      width="min(420px, 92vw)"
      class="preview-dialog"
      :show-header="false"
      align-center
      destroy-on-close
      @closed="onPreviewClosed"
    >
      <div v-if="previewRecord" class="preview-stage">
        <button
          type="button"
          class="preview-nav preview-nav--prev"
          :disabled="!previewHasPrev"
          :aria-label="$t('moodDiary.bookPreviewPrev')"
          @click="previewPrev"
        >
          ‹
        </button>

        <div class="preview-image-wrap">
          <button
            type="button"
            class="preview-hit preview-hit--prev"
            :disabled="!previewHasPrev"
            :aria-label="$t('moodDiary.bookPreviewPrev')"
            @click="previewPrev"
          />
          <img
            :src="previewRecord.posterDataUrl"
            class="preview-img"
            alt=""
            @click.stop
          />
          <button
            type="button"
            class="preview-hit preview-hit--next"
            :disabled="!previewHasNext"
            :aria-label="$t('moodDiary.bookPreviewNext')"
            @click="previewNext"
          />
        </div>

        <button
          type="button"
          class="preview-nav preview-nav--next"
          :disabled="!previewHasNext"
          :aria-label="$t('moodDiary.bookPreviewNext')"
          @click="previewNext"
        >
          ›
        </button>
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
const BOOK_VIEW_KEY = 'mood_diary_book_view_v1'

function readBookViewMode() {
  try {
    const v = localStorage.getItem(BOOK_VIEW_KEY)
    return v === 'list' ? 'list' : 'grid'
  } catch (_) {
    return 'grid'
  }
}

export default {
  name: 'MoodDiaryBook',
  data() {
    return {
      viewMode: readBookViewMode(),
      monthTimeline: [],
      visibleMonthCount: MONTHS_PER_PAGE,
      loadingMore: false,
      refreshing: false,
      exportingPdf: false,
      exportDialogOpen: false,
      exportScope: 'all',
      exportMonthKeys: [],
      exportPickIds: [],
      previewOpen: false,
      previewIndex: 0,
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
    allBookRecords() {
      return this.monthTimeline.flatMap((g) => g.records)
    },
    previewableRecords() {
      return this.allBookRecords.filter((r) => r.posterDataUrl)
    },
    previewRecord() {
      return this.previewableRecords[this.previewIndex] || null
    },
    previewHasPrev() {
      return this.previewIndex > 0
    },
    previewHasNext() {
      return this.previewIndex < this.previewableRecords.length - 1
    }
  },
  watch: {
    previewOpen(open) {
      if (open) {
        window.addEventListener('keydown', this.onPreviewKeydown)
      } else {
        window.removeEventListener('keydown', this.onPreviewKeydown)
      }
    }
  },
  mounted() {
    this.load()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onPreviewKeydown)
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
    excerpt(s, max = 100) {
      const t = (s || '').trim()
      if (t.length <= max) return t || '—'
      return t.slice(0, max) + '…'
    },
    persistViewMode(mode) {
      try {
        localStorage.setItem(BOOK_VIEW_KEY, mode === 'list' ? 'list' : 'grid')
      } catch (_) {
        /* ignore */
      }
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
      const id = this.recordExportId(r)
      const idx = this.previewableRecords.findIndex((item) => this.recordExportId(item) === id)
      this.previewIndex = idx >= 0 ? idx : 0
      this.previewOpen = true
    },
    onPreviewClosed() {
      this.previewIndex = 0
    },
    previewPrev() {
      if (!this.previewHasPrev) return
      this.previewIndex -= 1
    },
    previewNext() {
      if (!this.previewHasNext) return
      this.previewIndex += 1
    },
    onPreviewKeydown(e) {
      if (!this.previewOpen) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        this.previewPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        this.previewNext()
      }
    },
    recordExportId(r) {
      return String(r.cloudId || r.id || r.posterDataUrl || '')
    },
    openExportDialog() {
      if (!this.monthTimeline.length) return
      this.exportScope = 'all'
      this.exportMonthKeys = this.monthTimeline[0] ? [this.monthTimeline[0].key] : []
      this.exportPickIds = []
      this.exportDialogOpen = true
    },
    onExportDialogClosed() {
      if (this.exportingPdf) return
      this.exportScope = 'all'
      this.exportMonthKeys = []
      this.exportPickIds = []
    },
    selectAllForExport() {
      this.exportPickIds = this.allBookRecords.map((r) => this.recordExportId(r)).filter(Boolean)
    },
    clearExportPick() {
      this.exportPickIds = []
    },
    resolveExportRecords() {
      if (this.exportScope === 'all') {
        return { records: this.allBookRecords, filenameSuffix: '' }
      }
      if (this.exportScope === 'month') {
        if (!this.exportMonthKeys.length) {
          throw new Error(this.$t('moodDiary.exportPdfNoMonthSelected'))
        }
        const keySet = new Set(this.exportMonthKeys)
        const records = this.monthTimeline
          .filter((g) => keySet.has(g.key))
          .flatMap((g) => g.records)
        const suffix =
          this.exportMonthKeys.length === 1 ? this.exportMonthKeys[0] : `${this.exportMonthKeys.length}-months`
        return { records, filenameSuffix: suffix }
      }
      if (!this.exportPickIds.length) {
        throw new Error(this.$t('moodDiary.exportPdfNoEntrySelected'))
      }
      const idSet = new Set(this.exportPickIds)
      const records = this.allBookRecords.filter((r) => idSet.has(this.recordExportId(r)))
      return { records, filenameSuffix: 'selected' }
    },
    async confirmExportPdf() {
      if (!this.monthTimeline.length || this.exportingPdf) return
      this.exportingPdf = true
      ElMessage.info(this.$t('moodDiary.exportPdfExporting'))
      const locale = this.$i18n?.locale === 'en' ? 'en' : 'zh'
      try {
        const { records, filenameSuffix } = this.resolveExportRecords()
        if (!records.length) {
          throw new Error(this.$t('moodDiary.exportPdfEmpty'))
        }
        await exportMoodDiaryPdf({
          locale,
          records,
          filenameSuffix,
          title: this.$t('moodDiary.title'),
          exportedLabel: this.$t('moodDiary.exportPdfExportedOn', {
            date: this.formatExportDate(locale)
          }),
          emptyMessage: this.$t('moodDiary.exportPdfEmpty')
        })
        ElMessage.success(this.$t('moodDiary.exportPdfSuccess'))
        this.exportDialogOpen = false
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
  padding: 20px 16px 12px;
}

.book-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.book-view-toggle {
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
  padding: 0 16px 12px;
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
  padding: 4px 16px 28px;
  -webkit-overflow-scrolling: touch;
}

.book-album {
  width: 100%;
  margin: 0;
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
  grid-template-columns: repeat(auto-fill, 100px);
  justify-content: start;
  gap: 8px;
}

@media (min-width: 640px) {
  .month-grid {
    grid-template-columns: repeat(auto-fill, 112px);
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

.month-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.month-list > li {
  margin: 0;
  padding: 0;
}

.list-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.list-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.list-thumb-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 74px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
}

.list-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.list-thumb--empty {
  background: #e2e8f0;
}

.list-info {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.list-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.list-date {
  color: #64748b;
  font-weight: 500;
}

.list-mood {
  color: #0d9488;
  background: rgba(32, 201, 151, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  flex-shrink: 0;
}

.list-text {
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

.preview-dialog :deep(.el-dialog__body) {
  padding: 12px 8px 16px;
}

.preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 200px;
}

.preview-image-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: min(360px, 78vw);
}

.preview-img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
  user-select: none;
  pointer-events: none;
}

.preview-hit {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 38%;
  border: none;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}

.preview-hit:disabled {
  cursor: default;
  pointer-events: none;
}

.preview-hit--prev {
  left: 0;
}

.preview-hit--next {
  right: 0;
}

.preview-hit:not(:disabled):hover {
  background: rgba(15, 23, 42, 0.06);
}

.preview-nav {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.08);
  color: #334155;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 2px;
  transition: background 0.15s ease, color 0.15s ease;
}

.preview-nav:hover:not(:disabled) {
  background: rgba(32, 201, 151, 0.18);
  color: #0d9488;
}

.preview-nav:disabled {
  opacity: 0.28;
  cursor: not-allowed;
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

.export-scope {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
}

.export-panel {
  margin-top: 4px;
}

.export-panel--pick {
  max-height: min(52vh, 420px);
  overflow-y: auto;
}

.export-panel-label {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.export-panel-hint {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.export-month-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.export-item-count {
  color: #94a3b8;
  font-weight: 400;
}

.export-pick-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.export-pick-actions {
  display: flex;
  gap: 4px;
}

.export-pick-month {
  margin-bottom: 14px;
}

.export-pick-month-label {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.export-pick-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}

.export-pick-item {
  display: flex;
  width: 100%;
  margin-right: 0;
  margin-bottom: 8px;
  height: auto;
  align-items: flex-start;
}

.export-pick-item :deep(.el-checkbox__label) {
  flex: 1;
  min-width: 0;
  padding-left: 8px;
  line-height: 1.4;
}

.export-pick-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.export-pick-thumb {
  width: 40px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f1f5f9;
}

.export-pick-thumb--empty {
  display: inline-block;
  background: #e2e8f0;
}

.export-pick-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.export-pick-date {
  font-size: 12px;
  color: #64748b;
}

.export-pick-text {
  font-size: 13px;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
