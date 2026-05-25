<template>
  <div class="md-dashboard" :style="dashboardAccentVars">
    <!-- 主栏：今日海报 -->
    <div class="dash-center-card">
      <section class="dash-pane dash-pane--now" :aria-label="$t('moodDiary.dashTodayTitle')">
        <MoodDiaryPosterResult
          v-if="pendingPosterUrl"
          :poster-url="pendingPosterUrl"
          :saving="posterSaving"
          @save="savePendingPoster"
          @download="downloadPendingPoster"
          @regenerate="goRegeneratePoster"
          @back-to-write="dismissPosterPreview"
        />
        <MoodDiaryNowCard
          v-else
          :latest-record="latestPosterRecord"
          :generating="posterGenerating"
          @preview="openPreview"
          @write="openWriteEntry"
        />
      </section>
    </div>

    <!-- 辅栏：日历 + 最近日记 -->
    <div class="dash-side-card">
      <div class="dash-side-inner">
        <section class="dash-pane dash-pane--calendar" :aria-label="$t('moodDiary.moodCalendar')">
          <div class="dash-block-head dash-block-head--compact dash-block-head--calendar">
            <div class="cal-head-row">
              <h2 class="dash-block-title">{{ $t('moodDiary.moodCalendar') }}</h2>
              <button
                type="button"
                class="cal-refresh-btn"
                :disabled="refreshing"
                @click="refreshData"
              >
                {{ $t('moodDiary.calRefresh') }}
              </button>
            </div>
            <div class="cal-toolbar">
              <div class="cal-nav-month">
                <button type="button" class="cal-nav-btn" :aria-label="$t('moodDiary.prevMonth')" @click="shiftMonth(-1)">‹</button>
                <span class="cal-month-label">{{ calendarMonthLabel }}</span>
                <button type="button" class="cal-nav-btn" :aria-label="$t('moodDiary.nextMonth')" @click="shiftMonth(1)">›</button>
              </div>
            </div>
          </div>
          <div class="cal-shell">
            <div class="cal-weekdays">
              <span v-for="w in weekdayLabels" :key="w">{{ w }}</span>
            </div>
            <div class="cal-grid">
              <button
                v-for="(cell, i) in calendarCells"
                :key="`c-${i}`"
                type="button"
                class="cal-day"
                :class="{
                  'cal-day--muted': !cell.day,
                  'cal-day--has': cell.day && dayMoodEmojiSrc(cell.day),
                  'cal-day--selected': cell.day && cell.day === selectedDay
                }"
                :disabled="!cell.day"
                @click="cell.day && selectDay(cell.day)"
              >
                <span v-if="cell.day" class="cal-day-num">
                  <img
                    v-if="dayMoodEmojiSrc(cell.day)"
                    :src="dayMoodEmojiSrc(cell.day)"
                    class="cal-day-mood"
                    :alt="dayMoodLabel(cell.day)"
                  />
                  <span v-else class="cal-day-date">{{ cell.day }}</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section class="dash-pane dash-pane--recent" :aria-label="$t('moodDiary.dashRecentEntries')">
          <div class="dash-block-head dash-block-head--compact">
            <h2 class="dash-block-title">
              {{ calendarDayFilterActive ? selectedDayLabel : $t('moodDiary.dashRecentEntries') }}
            </h2>
            <router-link class="section-link" to="/mood-diary/book">{{ $t('moodDiary.viewAllJournal') }}</router-link>
          </div>
          <ul v-if="recentDashboardRecords.length" class="anthology-list anthology-list--compact">
            <li v-for="r in recentDashboardRecords" :key="r.id">
              <button type="button" class="anthology-row" @click="openRecord(r)">
                <img v-if="r.posterDataUrl" :src="r.posterDataUrl" class="anthology-thumb" alt="" />
                <span v-else class="anthology-thumb anthology-thumb--empty" />
                <div class="anthology-info">
                  <span class="anthology-date">{{ formatShortDate(r.createdAt) }}</span>
                  <span class="anthology-caption">{{ excerpt(r.caption || r.narrative, 48) }}</span>
                </div>
              </button>
            </li>
          </ul>
          <div v-else class="dash-empty dash-empty--compact">
            <span class="dash-empty-icon" aria-hidden="true">
              <i class="iconfont icon-sanwen" />
            </span>
            <p class="dash-empty-text">
              {{ calendarDayFilterActive ? $t('moodDiary.dayEntriesEmpty') : $t('moodDiary.bookEmpty') }}
            </p>
          </div>
        </section>
      </div>
    </div>

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
          v-if="previewRecords.length > 1"
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
            v-if="previewRecords.length > 1"
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
            v-if="previewRecords.length > 1"
            type="button"
            class="preview-hit preview-hit--next"
            :disabled="!previewHasNext"
            :aria-label="$t('moodDiary.bookPreviewNext')"
            @click="previewNext"
          />
        </div>

        <button
          v-if="previewRecords.length > 1"
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
import MoodDiaryNowCard from '@/components/moodDiary/MoodDiaryNowCard.vue'
import MoodDiaryPosterResult from '@/components/moodDiary/MoodDiaryPosterResult.vue'
import { getDraft, setDraft } from '@/utils/moodDiary/draft'
import { downloadMoodPosterDataUrl, saveMoodPoster } from '@/utils/moodDiary/posterActions'
import { findMoodById } from '@/utils/moodDiary/moodAssets'
import { atmosphereCssVars } from '@/utils/moodDiary/moodTheme'
import { requestOpenWriteDialog } from '@/utils/moodDiary/writeDialogBus'
import {
  buildCalendarCells,
  getRecentPosters,
  getRecordsForCalendarMonth
} from '@/utils/moodDiary/recordGroups'
import { ElMessage } from 'element-plus'
import { getRecordsSorted } from '@/utils/moodDiary/records'

export default {
  name: 'MoodDiaryNarrative',
  components: { MoodDiaryNowCard, MoodDiaryPosterResult },
  data() {
    const now = new Date()
    return {
      pendingPosterUrl: null,
      pendingDiaryCaption: '',
      posterSaving: false,
      refreshing: false,
      calYear: now.getFullYear(),
      calMonth: now.getMonth(),
      selectedDay: now.getDate(),
      recordsByDay: new Map(),
      previewOpen: false,
      previewRecords: [],
      previewIndex: 0,
      posterGenerating: false,
      posterGenTimer: null,
      activeMoodId: null
    }
  },
  computed: {
    dashboardAccentVars() {
      const vars = atmosphereCssVars(this.activeMoodId)
      return {
        '--now-mood-accent': vars['--now-mood-accent'],
        '--now-mood-soft': vars['--now-mood-soft']
      }
    },
    calendarDayFilterActive() {
      return this.selectedDayRecords.length > 0
    },
    recentDashboardRecords() {
      if (this.calendarDayFilterActive) {
        return this.selectedDayRecords.slice(0, 3)
      }
      return getRecordsSorted().slice(0, 3)
    },
    calendarCells() {
      return buildCalendarCells(this.calYear, this.calMonth)
    },
    calendarMonthLabel() {
      const locale = this.$i18n?.locale === 'zh' ? 'zh-CN' : 'en-US'
      return new Date(this.calYear, this.calMonth, 1).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long'
      })
    },
    weekdayLabels() {
      if (this.$i18n?.locale === 'zh') {
        return ['日', '一', '二', '三', '四', '五', '六']
      }
      return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    },
    selectedDayRecords() {
      return this.dayRecords(this.selectedDay)
    },
    selectedDayLabel() {
      if (!this.selectedDay) return ''
      const locale = this.$i18n?.locale === 'zh' ? 'zh-CN' : 'en-US'
      return new Date(this.calYear, this.calMonth, this.selectedDay).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric'
      })
    },
    latestPosterRecord() {
      return getRecentPosters(1)[0] || null
    },
    previewRecord() {
      return this.previewRecords[this.previewIndex] || null
    },
    previewHasPrev() {
      return this.previewIndex > 0
    },
    previewHasNext() {
      return this.previewIndex < this.previewRecords.length - 1
    }
  },
  mounted() {
    this.refreshData()
    this.syncPosterFromDraft()
    this.syncPosterGenerating()
    this.syncActiveMood()
    this.posterGenTimer = setInterval(() => this.syncPosterGenerating(), 600)
  },
  activated() {
    this.syncPosterFromDraft()
    this.refreshData()
    this.syncPosterGenerating()
    this.syncActiveMood()
  },
  beforeUnmount() {
    if (this.posterGenTimer) clearInterval(this.posterGenTimer)
    window.removeEventListener('keydown', this.onPreviewKeydown)
  },
  watch: {
    '$route.fullPath'() {
      this.syncPosterFromDraft()
    },
    previewOpen(open) {
      if (open) {
        window.addEventListener('keydown', this.onPreviewKeydown)
      } else {
        window.removeEventListener('keydown', this.onPreviewKeydown)
      }
    }
  },
  methods: {
    refreshData() {
      this.refreshing = true
      this.recordsByDay = getRecordsForCalendarMonth(this.calYear, this.calMonth)
      const today = new Date()
      if (this.calYear === today.getFullYear() && this.calMonth === today.getMonth()) {
        this.selectedDay = today.getDate()
      } else if (!this.recordsByDay.has(this.selectedDay)) {
        const first = [...this.recordsByDay.keys()].sort((a, b) => a - b)[0]
        this.selectedDay = first || 1
      }
      setTimeout(() => {
        this.refreshing = false
      }, 200)
    },
    openWriteEntry() {
      requestOpenWriteDialog()
    },
    syncActiveMood() {
      const d = getDraft()
      this.activeMoodId = d.moodEmojiId || d.mood || null
    },
    dayRecords(day) {
      return this.recordsByDay.get(day) || []
    },
    dayPosterRecords(day) {
      return this.dayRecords(day)
        .filter((r) => r.posterDataUrl)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    },
    dayMoodEmojiId(day) {
      const recs = this.dayRecords(day)
      if (recs.length) {
        let latest = null
        for (const r of recs) {
          const id = r.moodEmojiId || r.mood
          if (!id) continue
          if (!latest || (r.createdAt || 0) > (latest.createdAt || 0)) {
            latest = r
          }
        }
        if (latest) return latest.moodEmojiId || latest.mood
      }
      const today = new Date()
      if (
        this.calYear === today.getFullYear() &&
        this.calMonth === today.getMonth() &&
        day === today.getDate()
      ) {
        const d = getDraft()
        return d.moodEmojiId || d.mood || null
      }
      return null
    },
    dayMoodLabel(day) {
      const recs = this.dayRecords(day)
      if (recs.length) {
        let latest = null
        for (const r of recs) {
          const id = r.moodEmojiId || r.mood
          if (!id) continue
          if (!latest || (r.createdAt || 0) > (latest.createdAt || 0)) {
            latest = r
          }
        }
        if (latest?.moodLabel) return latest.moodLabel
      }
      const today = new Date()
      if (
        this.calYear === today.getFullYear() &&
        this.calMonth === today.getMonth() &&
        day === today.getDate()
      ) {
        const d = getDraft()
        if (d.moodLabel) return d.moodLabel
      }
      const id = this.dayMoodEmojiId(day)
      if (!id) return ''
      const mood = findMoodById(id, this.$i18n?.locale === 'zh')
      return mood?.label || ''
    },
    dayMoodEmojiSrc(day) {
      const id = this.dayMoodEmojiId(day)
      if (!id) return ''
      const mood = findMoodById(id, this.$i18n?.locale === 'zh')
      return mood?.src || ''
    },
    syncPosterGenerating() {
      const d = getDraft()
      this.posterGenerating = !!d.posterGenerating
    },
    shiftMonth(delta) {
      let m = this.calMonth + delta
      let y = this.calYear
      if (m < 0) {
        m = 11
        y -= 1
      } else if (m > 11) {
        m = 0
        y += 1
      }
      this.calMonth = m
      this.calYear = y
      this.recordsByDay = getRecordsForCalendarMonth(y, m)
      this.selectedDay = 1
    },
    selectDay(day) {
      this.selectedDay = day
      const posters = this.dayPosterRecords(day)
      if (posters.length) {
        this.openPreviewSession(posters, 0)
      }
    },
    formatShortDate(ts) {
      const d = new Date(ts || Date.now())
      const locale = this.$i18n?.locale === 'zh' ? 'zh-CN' : 'en-US'
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    },
    excerpt(s, max = 56) {
      const t = (s || '').trim()
      if (!t) return '—'
      if (t.length <= max) return t
      return t.slice(0, max) + '…'
    },
    openPreviewSession(records, startIndex = 0) {
      const list = (records || []).filter((r) => r?.posterDataUrl)
      if (!list.length) return
      this.previewRecords = list
      this.previewIndex = Math.min(Math.max(startIndex, 0), list.length - 1)
      this.previewOpen = true
    },
    openPreview(url) {
      if (!url) return
      this.openPreviewSession([{ posterDataUrl: url, id: url }], 0)
    },
    openRecord(r) {
      if (!r?.posterDataUrl) {
        this.$router.push('/mood-diary/book')
        return
      }
      if (this.calendarDayFilterActive) {
        const posters = this.dayPosterRecords(this.selectedDay)
        const idx = posters.findIndex(
          (item) =>
            (r.id && item.id === r.id) ||
            (r.cloudId && item.cloudId === r.cloudId) ||
            item.posterDataUrl === r.posterDataUrl
        )
        this.openPreviewSession(posters, idx >= 0 ? idx : 0)
        return
      }
      this.openPreviewSession([r], 0)
    },
    onPreviewClosed() {
      this.previewRecords = []
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
      if (!this.previewOpen || this.previewRecords.length <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        this.previewPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        this.previewNext()
      }
    },
    syncPosterFromDraft() {
      const d = getDraft()
      this.pendingPosterUrl = d.composedPosterDataUrl || null
      this.pendingDiaryCaption = d.diaryCaption || d.quotaSentence || ''
      if (d.composedPosterDataUrl || !d.posterGenerating) {
        this.posterGenerating = !!d.posterGenerating
      }
    },
    dismissPosterPreview() {
      setDraft({ composedPosterDataUrl: null })
      this.pendingPosterUrl = null
      this.pendingDiaryCaption = ''
      this.openWriteEntry()
    },
    downloadPendingPoster() {
      downloadMoodPosterDataUrl(this.pendingPosterUrl)
      ElMessage.success(this.$t('moodDiary.downloadSuccess'))
    },
    async savePendingPoster() {
      if (!this.pendingPosterUrl) return
      this.posterSaving = true
      try {
        await saveMoodPoster(this.pendingPosterUrl, this.pendingDiaryCaption, (k) => this.$t(k))
        setDraft({ composedPosterDataUrl: null })
        this.pendingPosterUrl = null
        this.refreshData()
        ElMessage.success(this.$t('moodDiary.saveToMyCreationSuccess'))
      } catch (e) {
        ElMessage.error(e.message || this.$t('moodDiary.saveCreationFailed'))
      } finally {
        this.posterSaving = false
      }
    },
    goRegeneratePoster() {
      this.$router.push('/mood-diary/generate')
    }
  }
}
</script>

<style scoped>
.md-dashboard {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 16px;
  box-sizing: border-box;
  background: transparent;
}

.dash-center-card {
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  box-sizing: border-box;
}

.dash-side-card {
  flex: 0 0 480px;
  width: 480px;
  height: 100%;
  min-height: 0;
  background: rgba(255, 252, 254, 0.84);
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  border-radius: 28px;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  box-shadow:
    0 2px 8px var(--md-shadow),
    0 14px 36px rgba(184, 223, 240, 0.16);
}

.dash-side-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.dash-pane {
  min-width: 0;
  min-height: 0;
  padding: 16px 18px 18px;
  box-sizing: border-box;
}

.dash-pane--now {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  padding: 0 10px;
  overflow-y: auto;
}

.dash-pane--now :deep(.now-card),
.dash-pane--now :deep(.poster-result) {
  flex: 1;
  min-height: 0;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.dash-pane--calendar {
  flex-shrink: 0;
}

.dash-pane--recent {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.dash-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.dash-block-head--compact {
  margin-bottom: 10px;
}

.dash-block-head--compact .dash-block-title {
  font-size: 13px;
}

.dash-block-head--calendar {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.dash-block-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--md-text);
  letter-spacing: -0.01em;
}

.dash-side-card .dash-block-head--compact .dash-block-title {
  font-size: 17px;
  font-weight: 700;
}

.dash-side-card .dash-block-head--calendar .dash-block-title {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.section-link {
  font-size: 13px;
  color: var(--md-muted);
  text-decoration: none;
  white-space: nowrap;
}

.dash-side-card .section-link {
  font-size: 14px;
  font-weight: 500;
}

.cal-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.cal-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 32px;
}

.cal-nav-month {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cal-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  background: var(--md-card);
  color: var(--md-muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  border: 1px solid var(--md-border);
  box-sizing: border-box;
}

.cal-nav-btn:hover {
  background: var(--md-surface);
  color: var(--md-text);
}

.cal-month-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  min-width: 88px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: var(--md-text);
  text-align: center;
}

.dash-side-card .cal-month-label {
  font-size: 14px;
  font-weight: 700;
}

.dash-side-card .cal-nav-btn {
  font-size: 18px;
}

.cal-refresh-btn {
  padding: 5px 11px;
  border-radius: 8px;
  border: 1px solid var(--md-border);
  background: var(--md-card);
  font-size: 14px;
  font-weight: 600;
  color: var(--md-muted);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.cal-refresh-btn:hover:not(:disabled) {
  color: var(--md-accent-deep);
  background: var(--md-accent-soft);
  border-color: rgba(168, 224, 210, 0.55);
}

.cal-refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cal-shell {
  padding: 12px;
  border-radius: 8px;
  background: var(--md-card);
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--md-muted);
  text-align: center;
}

.dash-side-card .cal-weekdays {
  font-size: 13px;
  font-weight: 600;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
}

.cal-day {
  aspect-ratio: 1;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-day--muted {
  pointer-events: none;
}

.cal-day:not(:disabled):not(.cal-day--muted) {
  cursor: pointer;
}

.cal-day-num {
  min-width: 34px;
  min-height: 34px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  font-size: 12px;
  color: var(--md-muted);
  padding: 2px 4px;
  box-sizing: border-box;
}

.dash-side-card .cal-day-num {
  font-size: 14px;
  font-weight: 500;
}

.cal-day--has .cal-day-num {
  background: var(--md-mint-soft);
  color: var(--md-text);
  font-weight: 500;
}

.dash-side-card .cal-day--has .cal-day-num {
  font-weight: 600;
}

.cal-day--selected .cal-day-num {
  background: var(--md-accent-soft);
  color: var(--md-accent-deep);
  box-shadow: inset 0 0 0 1.5px var(--md-accent);
  font-weight: 600;
}

.dash-side-card .cal-day--selected .cal-day-num {
  font-weight: 700;
}

.cal-day:not(:disabled):not(.cal-day--muted):hover .cal-day-num {
  background: var(--md-lilac-soft);
  color: var(--md-text);
}

.cal-day--selected:hover .cal-day-num {
  background: var(--md-accent-soft);
  color: var(--md-accent-deep);
}

.cal-day-date {
  line-height: 1;
}

.cal-day-mood {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.dash-side-card .cal-day-mood {
  width: 24px;
  height: 24px;
}

.cal-day--has .cal-day-mood {
  width: 26px;
  height: 26px;
}

.dash-side-card .cal-day--has .cal-day-mood {
  width: 28px;
  height: 28px;
}

.anthology-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anthology-list--compact .anthology-row {
  padding: 8px 10px;
}

.anthology-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--md-border);
  border-radius: 8px;
  background: var(--md-card);
  cursor: pointer;
  text-align: left;
}

.anthology-row:hover {
  background: var(--md-surface);
}

.anthology-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.anthology-thumb--empty {
  background: var(--md-poster-slot);
}

.anthology-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.anthology-date {
  font-size: 11px;
  color: var(--md-muted);
}

.dash-side-card .anthology-date {
  font-size: 13px;
  font-weight: 500;
}

.anthology-caption {
  font-size: 13px;
  color: var(--md-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-side-card .anthology-caption {
  font-size: 15px;
  font-weight: 500;
}

.dash-empty {
  margin: 8px 0 0;
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: var(--md-card);
  border-radius: var(--md-radius);
  border: 1px dashed var(--md-border);
}

.dash-empty--compact {
  padding: 16px;
  margin: 0;
}

.dash-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--md-poster-slot);
  color: var(--md-accent-deep);
}

.dash-empty-icon .iconfont {
  font-size: 28px;
  line-height: 1;
}

.dash-empty-text {
  margin: 0;
  max-width: 280px;
  font-size: 13px;
  color: var(--md-muted);
  line-height: 1.55;
}

.dash-side-card .dash-empty-text {
  font-size: 14px;
  font-weight: 500;
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
  opacity: 0.35;
  cursor: default;
}

@media (max-width: 900px) {
  .md-dashboard {
    flex-direction: column;
    min-height: auto;
    height: auto;
    overflow: visible;
    gap: 12px;
  }

  .dash-center-card {
    width: 100%;
    flex: none;
    max-width: none;
    height: auto;
    overflow: visible;
    justify-content: flex-start;
    padding: 8px 0 4px;
  }

  .dash-side-card {
    width: 100%;
    flex: none;
    height: auto;
    overflow: visible;
  }

  .dash-pane--now {
    max-width: none;
    flex: none;
    height: auto;
    overflow: visible;
    padding: 0 4px;
  }

  .dash-pane--now :deep(.now-card),
  .dash-pane--now :deep(.poster-result) {
    flex: none;
    height: auto;
  }

  .dash-side-inner,
  .dash-pane--calendar,
  .dash-pane--recent {
    min-height: auto;
    overflow: visible;
  }
}
</style>
