<template>
  <div class="md-dashboard">
    <!-- 左：此刻卡片 30vw × 100% -->
    <aside class="dash-now-card" :aria-label="$t('moodDiary.navNow')">
      <MoodDiaryNowPanel />
    </aside>

    <!-- 右：大卡片 — 海报在上；日历 | 文集 左右排列 -->
    <div class="dash-main-card">
      <section class="dash-block dash-block--posters" :aria-label="$t('moodDiary.moodPostersTitle')">
        <div class="dash-block-head">
          <div>
            <h2 class="dash-block-title">{{ $t('moodDiary.moodPostersTitle') }}</h2>
            <p class="dash-block-sub">{{ $t('moodDiary.moodPostersSubtitle') }}</p>
          </div>
          <router-link class="section-link section-link--pill" to="/mood-diary/book">{{ $t('moodDiary.viewAllJournal') }}</router-link>
        </div>
        <div class="poster-showcase">
          <button
            v-for="(slot, idx) in recentSlots"
            :key="slot.id || `empty-${idx}`"
            type="button"
            class="poster-card"
            :class="{ 'poster-card--empty': !slot.posterDataUrl }"
            :disabled="!slot.posterDataUrl"
            @click="onPosterClick(slot)"
          >
            <img v-if="slot.posterDataUrl" :src="slot.posterDataUrl" class="poster-card-img" alt="" />
            <span v-else class="poster-card-placeholder" :aria-label="$t('moodDiary.posterSlotEmpty')" />
            <div v-if="slot.posterDataUrl" class="poster-card-meta">
              <span class="poster-card-date">{{ formatShortDate(slot.createdAt) }}</span>
              <span v-if="slot.moodLabel" class="poster-card-mood">{{ slot.moodLabel }}</span>
            </div>
          </button>
        </div>
      </section>

      <div class="dash-split-row">
      <section class="dash-block dash-block--calendar" :aria-label="$t('moodDiary.moodCalendar')">
        <div class="dash-block-head">
          <h2 class="dash-block-title">{{ $t('moodDiary.moodCalendar') }}</h2>
          <div class="cal-nav">
            <button type="button" class="cal-nav-btn" :aria-label="$t('moodDiary.prevMonth')" @click="shiftMonth(-1)">‹</button>
            <span class="cal-month-label">{{ calendarMonthLabel }}</span>
            <button type="button" class="cal-nav-btn" :aria-label="$t('moodDiary.nextMonth')" @click="shiftMonth(1)">›</button>
            <button
              type="button"
              class="dash-icon-btn"
              :title="$t('moodDiary.pullRefresh')"
              :disabled="refreshing"
              @click="refreshData"
            >
              <span class="dash-bell" aria-hidden="true" />
            </button>
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
              'cal-day--has': cell.day && dayRecords(cell.day).length,
              'cal-day--selected': cell.day && cell.day === selectedDay
            }"
            :disabled="!cell.day"
            @click="cell.day && selectDay(cell.day)"
          >
            <span v-if="cell.day" class="cal-day-num">{{ cell.day }}</span>
          </button>
        </div>
        </div>
        <div v-if="selectedDayRecords.length" class="cal-day-detail">
          <p class="cal-day-detail-title">{{ selectedDayLabel }}</p>
          <button
            v-for="r in selectedDayRecords"
            :key="r.id"
            type="button"
            class="cal-day-entry"
            @click="openRecord(r)"
          >
            <img v-if="r.posterDataUrl" :src="r.posterDataUrl" alt="" />
            <span>{{ excerpt(r.caption || r.narrative, 40) }}</span>
          </button>
        </div>
      </section>

      <section class="dash-block dash-block--anthology" :aria-label="$t('moodDiary.monthlyAnthology')">
        <div class="dash-block-head">
          <h2 class="dash-block-title">{{ $t('moodDiary.monthlyAnthology') }}</h2>
          <div class="dash-block-tools">
            <label class="dash-search-wrap">
              <span class="sr-only">{{ $t('moodDiary.dashboardSearchPlaceholder') }}</span>
              <input
                v-model="searchQuery"
                type="search"
                class="dash-search-input"
                :placeholder="$t('moodDiary.dashboardSearchPlaceholder')"
                autocomplete="off"
              />
            </label>
            <span class="section-count">{{ $t('moodDiary.recapRecords', { n: totalRecords }) }}</span>
            <button type="button" class="btn-filters" @click="clearSearch">{{ $t('moodDiary.filtersBtn') }}</button>
          </div>
        </div>

        <div v-if="!filteredMonthGroups.length" class="dash-empty">
          <span class="dash-empty-icon" aria-hidden="true">📔</span>
          <p class="dash-empty-text">{{ $t('moodDiary.bookEmpty') }}</p>
          <router-link class="dash-empty-cta" to="/mood-diary/write">{{ $t('moodDiary.exploreCardCta') }}</router-link>
        </div>

        <div v-for="group in filteredMonthGroups" :key="group.key" class="month-block">
          <h3 class="month-label">{{ group.label }}</h3>
          <ul class="anthology-list">
            <li v-for="r in group.records" :key="r.id">
              <button type="button" class="anthology-row" @click="openRecord(r)">
                <img v-if="r.posterDataUrl" :src="r.posterDataUrl" class="anthology-thumb" alt="" />
                <span v-else class="anthology-thumb anthology-thumb--empty" />
                <div class="anthology-info">
                  <span class="anthology-date">{{ formatShortDate(r.createdAt) }}</span>
                  <span class="anthology-caption">{{ excerpt(r.caption || r.narrative) }}</span>
                </div>
                <span v-if="r.moodLabel" class="anthology-mood">{{ r.moodLabel }}</span>
              </button>
            </li>
          </ul>
        </div>
      </section>
      </div>
    </div>

    <el-dialog v-model="previewOpen" width="min(520px, 92vw)" :title="$t('moodDiary.previewTitle')">
      <img v-if="previewPoster" :src="previewPoster" class="dlg-img" alt="" />
    </el-dialog>
  </div>
</template>

<script>
import MoodDiaryNowPanel from '@/components/moodDiary/MoodDiaryNowPanel.vue'
import {
  buildCalendarCells,
  getRecentPosters,
  getRecordsForCalendarMonth,
  groupRecordsByMonth
} from '@/utils/moodDiary/recordGroups'
import { getRecordsSorted } from '@/utils/moodDiary/records'

const PLACEHOLDER_COUNT = 4

export default {
  name: 'MoodDiaryNarrative',
  components: { MoodDiaryNowPanel },
  data() {
    const now = new Date()
    return {
      refreshing: false,
      searchQuery: '',
      recentPosters: [],
      monthGroups: [],
      totalRecords: 0,
      calYear: now.getFullYear(),
      calMonth: now.getMonth(),
      selectedDay: now.getDate(),
      recordsByDay: new Map(),
      previewOpen: false,
      previewPoster: ''
    }
  },
  computed: {
    filteredMonthGroups() {
      const q = (this.searchQuery || '').trim().toLowerCase()
      if (!q) return this.monthGroups
      return this.monthGroups
        .map((g) => ({
          ...g,
          records: g.records.filter((r) => {
            const blob = `${r.caption || ''} ${r.narrative || ''} ${r.moodLabel || ''}`.toLowerCase()
            return blob.includes(q)
          })
        }))
        .filter((g) => g.records.length > 0)
    },
    recentSlots() {
      const filled = this.recentPosters
      const slots = [...filled]
      while (slots.length < PLACEHOLDER_COUNT) {
        slots.push({ id: null, posterDataUrl: null })
      }
      return slots.slice(0, PLACEHOLDER_COUNT)
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
    }
  },
  mounted() {
    this.refreshData()
  },
  activated() {
    this.refreshData()
  },
  methods: {
    refreshData() {
      this.refreshing = true
      const sorted = getRecordsSorted()
      this.totalRecords = sorted.length
      this.recentPosters = getRecentPosters(4)
      this.monthGroups = groupRecordsByMonth(this.$i18n?.locale)
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
    dayRecords(day) {
      return this.recordsByDay.get(day) || []
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
    openPreview(url) {
      this.previewPoster = url || ''
      this.previewOpen = !!this.previewPoster
    },
    openRecord(r) {
      if (r.posterDataUrl) {
        this.openPreview(r.posterDataUrl)
        return
      }
      this.$router.push('/mood-diary/book')
    },
    onPosterClick(slot) {
      if (slot.posterDataUrl) {
        this.openPreview(slot.posterDataUrl)
      }
    },
    clearSearch() {
      this.searchQuery = ''
    }
  }
}
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.md-dashboard {
  --md-accent: #20c997;
  --md-accent-soft: rgba(32, 201, 151, 0.12);
  --md-surface: #f8fafc;
  --md-border: #e8ecf1;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 140px);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 18px;
  box-sizing: border-box;
}

.dash-now-card {
  width: 30vw;
  flex: 0 0 30vw;
  height: 100%;
  min-height: 0;
  background: #fff;
  border-radius: 24px;
  border: 1px solid var(--md-border);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 12px 36px rgba(15, 23, 42, 0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dash-main-card {
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 12%);
  border-radius: 24px;
  border: 1px solid var(--md-border);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 12px 36px rgba(15, 23, 42, 0.07);
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.dash-block {
  flex-shrink: 0;
  padding: 22px 24px;
  box-sizing: border-box;
}

.dash-block--posters {
  padding-bottom: 20px;
}

.dash-split-row {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 14px;
  padding: 0 16px 16px;
}

.dash-split-row .dash-block--calendar,
.dash-split-row .dash-block--anthology {
  border-bottom: none;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  padding: 18px 20px;
  background: var(--md-surface);
  border-radius: 16px;
  box-sizing: border-box;
}

.dash-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.dash-block-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dash-block-title::before {
  content: '';
  width: 4px;
  height: 16px;
  border-radius: 4px;
  background: var(--md-accent);
  flex-shrink: 0;
}

.dash-block-sub {
  margin: 6px 0 0 12px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.dash-block-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-link {
  font-size: 13px;
  color: var(--md-accent);
  text-decoration: none;
  white-space: nowrap;
}

.section-link--pill {
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--md-accent-soft);
  font-weight: 600;
  font-size: 12px;
  transition: background 0.15s ease, color 0.15s ease;
}

.section-link--pill:hover {
  background: var(--md-accent);
  color: #fff;
  text-decoration: none;
}

.section-count {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.dash-search-wrap {
  min-width: 140px;
  max-width: 220px;
  flex: 1;
}

.dash-search-input {
  width: 100%;
  padding: 9px 14px 9px 36px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 13px;
  color: #334155;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Ccircle cx='7' cy='7' r='5'/%3E%3Cpath d='M11 11l3 3'/%3E%3C/svg%3E")
    12px center no-repeat;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.dash-search-input:focus {
  outline: none;
  border-color: rgba(32, 201, 151, 0.35);
  box-shadow: 0 0 0 3px var(--md-accent-soft);
}

.btn-filters {
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.btn-filters:hover {
  color: var(--md-accent);
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cal-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  border: none;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transition: background 0.15s ease, color 0.15s ease;
}

.cal-nav-btn:hover {
  background: var(--md-accent-soft);
  color: #0f766e;
}

.cal-month-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  min-width: 96px;
  text-align: center;
}

.cal-shell {
  padding: 14px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
}

.dash-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.dash-icon-btn:disabled {
  opacity: 0.55;
}

.dash-bell {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 8px 8px 0 0;
  border: 2px solid #64748b;
  border-bottom: none;
  position: relative;
}

.dash-bell::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #64748b;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
  max-width: 100%;
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

.cal-day--has .cal-day-num {
  background: var(--md-accent-soft);
  color: #0d9488;
  font-weight: 600;
}

.cal-day--selected .cal-day-num {
  background: linear-gradient(135deg, #2dd4a8 0%, var(--md-accent) 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(32, 201, 151, 0.35);
}

.cal-day:not(:disabled):not(.cal-day--muted):hover .cal-day-num {
  background: #f1f5f9;
}

.cal-day--selected:hover .cal-day-num {
  background: linear-gradient(135deg, #2dd4a8 0%, var(--md-accent) 100%);
}

.cal-day-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #475569;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.cal-day-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.cal-day-detail-title {
  margin: 0 0 8px;
  font-size: 12px;
  color: #64748b;
}

.cal-day-entry {
  width: 100%;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border: none;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  font-size: 12px;
  color: #334155;
  text-align: left;
}

.cal-day-entry img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.poster-showcase {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.poster-card {
  position: relative;
  border: none;
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  max-height: 240px;
  background: #e2e8f0;
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.06),
    0 8px 24px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.poster-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.08),
    0 16px 32px rgba(32, 201, 151, 0.12);
}

.poster-card--empty {
  background: #e2e8f0;
  box-shadow: none;
  cursor: default;
}

.poster-card--empty:hover {
  transform: none;
  background: #e2e8f0;
  box-shadow: none;
}

.poster-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-card-placeholder {
  display: block;
  width: 100%;
  height: 100%;
  background: #e2e8f0;
}

.poster-card-meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 32px 14px 14px;
  background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.75) 100%);
  color: #fff;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.poster-card-mood {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 10px;
}

.month-block {
  margin-bottom: 16px;
}

.month-label {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.anthology-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anthology-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.anthology-row:hover {
  transform: translateX(2px);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.anthology-thumb {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.anthology-thumb--empty {
  background: linear-gradient(135deg, #e2e8f0, #f1f5f9);
}

.anthology-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.anthology-date {
  font-size: 12px;
  color: #64748b;
}

.anthology-caption {
  font-size: 13px;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.anthology-mood {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  color: #0d9488;
  background: var(--md-accent-soft);
  padding: 5px 10px;
  border-radius: 999px;
}

.dash-empty {
  margin: 8px 0 0;
  padding: 36px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
}

.dash-empty-icon {
  font-size: 40px;
  line-height: 1;
  opacity: 0.85;
}

.dash-empty-text {
  margin: 0;
  max-width: 280px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
}

.dash-empty-cta {
  margin-top: 4px;
  padding: 10px 20px;
  border-radius: 999px;
  background: var(--md-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(32, 201, 151, 0.3);
  transition: filter 0.15s ease, transform 0.15s ease;
}

.dash-empty-cta:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.dlg-img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

/* 手机端：此刻卡片 100% 宽，上下堆叠 */
@media (max-width: 768px) {
  .md-dashboard {
    flex-direction: column;
    min-height: auto;
    height: auto;
  }

  .dash-now-card {
    width: 100%;
    flex: none;
    height: auto;
    min-height: min(72vh, 640px);
    max-height: none;
  }

  .dash-main-card {
    width: 100%;
    flex: none;
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .dash-split-row {
    grid-template-columns: 1fr;
  }

  .dash-split-row .dash-block--calendar,
  .dash-split-row .dash-block--anthology {
    padding: 18px 16px;
  }

  .poster-showcase {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .poster-showcase {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dash-block-tools {
    width: 100%;
  }

  .dash-search-wrap {
    max-width: none;
    width: 100%;
  }
}
</style>
