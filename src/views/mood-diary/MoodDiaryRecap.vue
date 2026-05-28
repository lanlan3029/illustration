<template>
  <div class="md-recap">
    <header class="recap-head">
      <h1 class="recap-head__title">{{ $t('moodDiary.navRecap') }}</h1>
      <el-radio-group
        v-model="rangeMode"
        size="small"
        class="recap-period"
        :disabled="recapLoading"
        @change="onRangeModeChange"
      >
        <el-radio-button label="week">{{ $t('moodDiary.recapWeek') }}</el-radio-button>
        <el-radio-button label="month">{{ $t('moodDiary.recapMonth') }}</el-radio-button>
        <el-radio-button label="custom">{{ $t('moodDiary.recapCustom') }}</el-radio-button>
      </el-radio-group>
    </header>

    <div v-if="rangeMode === 'custom'" class="recap-range">
      <span class="recap-range__label">{{ $t('moodDiary.recapStatRange') }}</span>
      <el-date-picker
        v-model="customRange"
        type="daterange"
        class="recap-range__picker"
        :disabled="recapLoading"
        :editable="false"
        :clearable="false"
        :disabled-date="disableFutureDate"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :range-separator="$t('moodDiary.recapRangeSeparator')"
        :start-placeholder="$t('moodDiary.recapRangeStart')"
        :end-placeholder="$t('moodDiary.recapRangeEnd')"
        @change="onCustomRangeChange"
      />
    </div>

    <div class="recap-stats" :aria-label="$t('moodDiary.navRecap')">
      <div class="recap-stat">
        <span class="recap-stat__value">{{ localRecap.count }}</span>
        <span class="recap-stat__label">{{ $t('moodDiary.recapStatEntries') }}</span>
      </div>
      <div class="recap-stat">
        <template v-if="topMoodInfo">
          <img v-if="topMoodInfo.src" :src="topMoodInfo.src" class="recap-stat__mood" alt="" />
          <span v-else class="recap-stat__value recap-stat__value--sm">{{ topMoodInfo.label }}</span>
          <span class="recap-stat__label">
            {{ $t('moodDiary.recapTopMood', { mood: topMoodInfo.label, n: topMoodInfo.count }) }}
          </span>
        </template>
        <template v-else>
          <span class="recap-stat__value recap-stat__value--sm">—</span>
          <span class="recap-stat__label">{{ $t('moodDiary.recapStatNoMood') }}</span>
        </template>
      </div>
      <div class="recap-stat">
        <span class="recap-stat__value recap-stat__value--sm">{{ periodLabel }}</span>
        <span class="recap-stat__label">{{ $t('moodDiary.recapStatRange') }}</span>
      </div>
    </div>

    <p v-if="rangeMode === 'custom' && rangeValidationMessage" class="recap-banner recap-banner--warn">
      {{ rangeValidationMessage }}
    </p>
    <p v-if="!hasChosenRange" class="recap-banner recap-banner--info">
      {{ $t('moodDiary.recapChooseRangeFirst') }}
    </p>
    <p v-else-if="recapLoading" class="recap-banner recap-banner--info">
      {{ $t('moodDiary.recapAiLoading') }}
    </p>
    <p v-else-if="recapAiError" class="recap-banner recap-banner--warn">{{ recapAiError }}</p>
    <p v-else-if="showLocalFallbackBadge" class="recap-banner">{{ $t('moodDiary.recapLocalSummaryBadge') }}</p>

    <div class="recap-scroll">
      <div v-if="!hasChosenRange" class="recap-guide-wrap">
        <p class="recap-empty">{{ $t('moodDiary.recapChooseRangeFirst') }}</p>
      </div>

      <div v-else-if="recapLoading" class="recap-loading" aria-busy="true">
        <div v-for="i in 4" :key="i" class="recap-loading__row" />
      </div>

      <template v-else-if="hasStructuredAi">
        <p v-if="aiRecapResult.overview" class="recap-lead">{{ aiRecapResult.overview }}</p>

        <section v-if="aiRecapResult.moodTrend" class="recap-block">
          <h2 class="recap-block__title">{{ $t('moodDiary.recapSectionTrend') }}</h2>
          <p class="recap-block__text">{{ aiRecapResult.moodTrend }}</p>
        </section>

        <section v-if="aiRecapResult.themes?.length" class="recap-block">
          <h2 class="recap-block__title">{{ $t('moodDiary.recapSectionThemes') }}</h2>
          <ul class="recap-tags">
            <li v-for="(item, i) in aiRecapResult.themes" :key="i">{{ item }}</li>
          </ul>
        </section>

        <section v-if="aiRecapResult.highlight" class="recap-block">
          <h2 class="recap-block__title">{{ $t('moodDiary.recapSectionHighlight') }}</h2>
          <p class="recap-block__text">{{ aiRecapResult.highlight }}</p>
        </section>

        <section v-if="aiRecapResult.suggestion" class="recap-block">
          <h2 class="recap-block__title">{{ $t('moodDiary.recapSectionSuggestion') }}</h2>
          <p class="recap-block__text">{{ aiRecapResult.suggestion }}</p>
        </section>
      </template>

      <template v-else-if="aiRecapResult?.recapText">
        <section class="recap-block">
          <h2 class="recap-block__title">{{ $t('moodDiary.recapSectionFull') }}</h2>
          <p class="recap-block__text">{{ aiRecapResult.recapText }}</p>
        </section>
      </template>

      <template v-else>
        <div v-if="localRecap.count === 0" class="recap-empty-wrap">
          <p class="recap-empty">{{ $t('moodDiary.recapEmptyHint') }}</p>
          <button type="button" class="recap-empty-btn" @click="openWriteEntry">
            {{ $t('moodDiary.actionWrite') }}
          </button>
        </div>
        <template v-else>
          <p class="recap-lead">{{ localToneText }}</p>
          <section v-if="topMoodInfo" class="recap-block">
            <h2 class="recap-block__title">{{ $t('moodDiary.recapSectionOverview') }}</h2>
            <p class="recap-block__text">
              {{ $t('moodDiary.recapTopMood', { mood: topMoodInfo.label, n: topMoodInfo.count }) }}
            </p>
          </section>
        </template>
      </template>
    </div>

    <footer class="recap-foot">
      <el-button type="primary" :disabled="recapLoading || !canShare" @click="openPoster">
        {{ $t('moodDiary.openSharePoster') }}
      </el-button>
    </footer>
  </div>
</template>

<script>
import {
  buildRecap,
  buildRecapCompletionPayload,
  formatRecapRangeLabel,
  MOOD_RECAP_MAX_RANGE_DAYS,
  normalizeRecapRange,
  recapAiResultToReadable,
  recapToReadable
} from '@/utils/moodDiary/recapEngine'
import { getRecordsSorted } from '@/utils/moodDiary/records'
import { findMoodById } from '@/utils/moodDiary/moodAssets'
import {
  fetchCaptionMoodRecap,
  fetchUserMoodIllustrations,
  getActiveMoodEndpoints,
  mapIllToBookRecord
} from '@/utils/moodDiary/api'
import { mergeBookRecords } from '@/utils/moodDiary/recordGroups'
import { requestOpenWriteDialog } from '@/utils/moodDiary/writeDialogBus'

const POSTER_KEY = 'mood_diary_share_poster_payload'

export default {
  name: 'MoodDiaryRecap',
  data() {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    return {
      rangeMode: 'week',
      customRange: [formatIsoDate(start), formatIsoDate(end)],
      savedRecords: getRecordsSorted(),
      aiRecapResult: null,
      recapLoading: false,
      recapAiError: '',
      hasChosenRange: false
    }
  },
  computed: {
    moodLabelResolver() {
      return (id) => {
        const isZh = this.$i18n?.locale === 'zh'
        return findMoodById(id, isZh)?.label || id
      }
    },
    recapRange() {
      if (this.rangeMode === 'custom') {
        if (!this.customRange || this.customRange.length !== 2) return { mode: 'custom', invalid: true }
        return {
          mode: 'custom',
          start: this.customRange[0],
          end: this.customRange[1]
        }
      }
      return this.rangeMode
    },
    rangeValidationMessage() {
      if (this.rangeMode !== 'custom') return ''
      const normalized = normalizeRecapRange(this.recapRange)
      if (normalized.invalid) return this.$t('moodDiary.recapCustomRangeInvalid')
      if (normalized.tooLong) {
        return this.$t('moodDiary.recapRangeTooLong', { n: MOOD_RECAP_MAX_RANGE_DAYS })
      }
      return ''
    },
    rangeReady() {
      if (this.rangeMode !== 'custom') return true
      const normalized = normalizeRecapRange(this.recapRange)
      return !normalized.invalid && !normalized.tooLong
    },
    localRecap() {
      return buildRecap(this.recapRange, this.savedRecords)
    },
    periodLabel() {
      const locale = this.$i18n?.locale === 'en' ? 'en' : 'zh'
      if (this.rangeMode === 'custom') {
        const label = formatRecapRangeLabel(this.recapRange, locale)
        return label || this.$t('moodDiary.recapCustom')
      }
      return this.rangeMode === 'week'
        ? this.$t('moodDiary.recapPeriodWeek')
        : this.$t('moodDiary.recapPeriodMonth')
    },
    topMoodInfo() {
      const id = this.localRecap.topMoodId
      if (!id || id === 'unknown') return null
      const isZh = this.$i18n?.locale === 'zh'
      const mood = findMoodById(id, isZh)
      return {
        label: mood?.label || this.moodLabelResolver(id),
        count: this.localRecap.stats.sortedMoods[0]?.[1] || 0,
        src: mood?.src || ''
      }
    },
    hasStructuredAi() {
      const r = this.aiRecapResult
      if (!r) return false
      return !!(r.overview || r.moodTrend || r.themes?.length || r.highlight || r.suggestion)
    },
    showLocalFallbackBadge() {
      return !this.recapLoading && !this.hasStructuredAi && !this.aiRecapResult?.recapText
    },
    localToneText() {
      const rec = this.localRecap
      if (rec.count === 0) return ''
      if (rec.tone === 'up') return this.$t('moodDiary.recapToneUp')
      if (rec.tone === 'reflective') return this.$t('moodDiary.recapToneCare')
      return this.$t('moodDiary.recapToneMixed')
    },
    displayRecap() {
      if (this.aiRecapResult) {
        return recapAiResultToReadable(this.aiRecapResult, (k, params) => this.$t(k, params))
      }
      return recapToReadable(this.localRecap, (k, params) => this.$t(k, params), this.moodLabelResolver)
    },
    canShare() {
      if (this.localRecap.count === 0) return false
      return !!this.displayRecap.trim()
    }
  },
  mounted() {
    this.loadSavedRecords()
  },
  methods: {
    async loadSavedRecords() {
      let cloudRecords = []
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
      const canCloud = !!(token && token !== 'undefined')
      if (canCloud) {
        try {
          const list = await fetchUserMoodIllustrations(1)
          cloudRecords = list.map(mapIllToBookRecord).filter(Boolean)
        } catch (e) {
          console.warn('[mood-diary] recap load cloud records failed', e)
        }
      }
      this.savedRecords = mergeBookRecords(getRecordsSorted(), cloudRecords)
    },
    onRangeModeChange(mode) {
      if (mode === 'custom' && (!this.customRange || this.customRange.length !== 2)) {
        this.customRange = defaultCustomRange(6)
      }
      this.hasChosenRange = true
      this.scheduleRecapFetch()
    },
    onCustomRangeChange() {
      this.hasChosenRange = true
      this.scheduleRecapFetch()
    },
    disableFutureDate(time) {
      return time.getTime() > endOfToday()
    },
    scheduleRecapFetch() {
      this.$nextTick(() => this.fetchAiRecap())
    },
    async fetchAiRecap() {
      if (!this.hasChosenRange) {
        this.aiRecapResult = null
        this.recapAiError = ''
        return
      }
      if (!this.rangeReady) {
        this.aiRecapResult = null
        this.recapAiError = ''
        return
      }
      const cfg = getActiveMoodEndpoints()
      if (!cfg.recapCompletionEndpoint) {
        this.aiRecapResult = null
        this.recapAiError = ''
        return
      }
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
      if (!token || token === 'undefined') {
        this.aiRecapResult = null
        this.recapAiError = this.$t('moodDiary.recapAiNeedLogin')
        return
      }

      this.recapLoading = true
      this.recapAiError = ''
      this.aiRecapResult = null
      try {
        const records = this.savedRecords
        const locale = this.$i18n?.locale === 'en' ? 'en' : 'zh'
        const payload = buildRecapCompletionPayload(
          this.recapRange,
          records,
          this.moodLabelResolver,
          locale
        )
        this.aiRecapResult = await fetchCaptionMoodRecap(
          payload,
          cfg.recapCompletionEndpoint
        )
      } catch (e) {
        this.recapAiError = e.message || this.$t('moodDiary.recapAiFailed')
        this.aiRecapResult = null
      } finally {
        this.recapLoading = false
      }
    },
    openWriteEntry() {
      requestOpenWriteDialog()
    },
    openPoster() {
      let title
      if (this.rangeMode === 'month') {
        title = this.$t('moodDiary.monthlyRecapShareTitle')
      } else if (this.rangeMode === 'week') {
        title = this.$t('moodDiary.weeklyRecapShareTitle')
      } else {
        title = this.$t('moodDiary.customRecapShareTitle')
      }
      const bodyLines = this.displayRecap.split('\n')
      try {
        sessionStorage.setItem(
          POSTER_KEY,
          JSON.stringify({
            title,
            bodyLines: bodyLines.filter((line) => String(line || '').trim())
          })
        )
      } catch (_) {
        /* ignore */
      }
      this.$router.push({
        path: '/mood-diary/share-poster',
        query: { period: this.rangeMode }
      })
    }
  }
}

function formatIsoDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

function defaultCustomRange(daysBack) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - daysBack)
  return [formatIsoDate(start), formatIsoDate(end)]
}
</script>

<style scoped>
.md-recap {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px 12px;
  box-sizing: border-box;
}

.recap-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.recap-head__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--md-text);
}

.recap-period :deep(.el-radio-button__inner) {
  padding: 6px 14px;
  border-color: var(--md-border) !important;
  color: var(--md-muted);
  background: rgba(255, 252, 254, 0.88);
  box-shadow: none !important;
}

.recap-period :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--md-accent-soft) !important;
  border-color: var(--md-accent) !important;
  color: var(--md-accent-deep) !important;
}

.recap-range {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 252, 254, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 2px 10px rgba(196, 181, 224, 0.08);
}

.recap-range__label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--md-muted);
}

.recap-range__picker {
  flex: 1;
  min-width: 240px;
}

.recap-range__picker :deep(.el-range-editor) {
  width: 100%;
}

.recap-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  flex-shrink: 0;
}

.recap-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 84px;
  padding: 12px 10px;
  border-radius: 16px;
  background: rgba(255, 252, 254, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 2px 10px rgba(196, 181, 224, 0.08);
  text-align: center;
}

.recap-stat__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--md-text);
}

.recap-stat__value--sm {
  font-size: 15px;
  font-weight: 600;
}

.recap-stat__mood {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.recap-stat__label {
  font-size: 12px;
  line-height: 1.4;
  color: var(--md-muted);
}

.recap-banner {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--md-muted);
  background: var(--md-surface);
  border: 1px solid var(--md-border);
  flex-shrink: 0;
}

.recap-banner--info {
  color: var(--md-accent-deep);
  background: var(--md-accent-soft);
  border-color: rgba(168, 224, 210, 0.45);
}

.recap-banner--warn {
  color: #9a6b6b;
  background: var(--md-peach-soft);
  border-color: rgba(255, 200, 216, 0.55);
}

.recap-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 2px 8px;
  -webkit-overflow-scrolling: touch;
}

.recap-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.recap-loading__row {
  height: 14px;
  border-radius: 7px;
  background: var(--md-surface);
  animation: recap-pulse 1.4s ease-in-out infinite;
}

.recap-loading__row:nth-child(1) {
  width: 92%;
}

.recap-loading__row:nth-child(2) {
  width: 78%;
}

.recap-loading__row:nth-child(3) {
  width: 64%;
}

.recap-loading__row:nth-child(4) {
  width: 48%;
}

@keyframes recap-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

.recap-lead {
  margin: 0;
  font-size: 17px;
  line-height: 1.75;
  font-weight: 500;
  color: var(--md-text);
}

.recap-block {
  margin: 0;
}

.recap-block__title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--md-muted);
  letter-spacing: 0.02em;
}

.recap-block__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.75;
  color: var(--md-text);
  white-space: pre-wrap;
}

.recap-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recap-tags li {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--md-text);
  background: var(--md-surface);
  border: 1px solid var(--md-border);
}

.recap-empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  padding: 0 12px;
}

.recap-empty {
  margin: 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  color: var(--md-muted);
}

.recap-guide-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 0 12px;
}

.recap-empty-btn {
  min-width: 160px;
  min-height: 44px;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  background: var(--md-accent-deep);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.02em;
  box-shadow: 0 8px 22px rgba(126, 203, 184, 0.34);
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.recap-empty-btn:hover {
  background: var(--md-mint-deep);
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(126, 203, 184, 0.4);
}

.recap-foot {
  flex-shrink: 0;
  padding-top: 4px;
}

.recap-foot :deep(.el-button--primary) {
  --el-button-bg-color: var(--md-accent);
  --el-button-border-color: var(--md-accent);
  --el-button-hover-bg-color: var(--md-accent-deep);
  --el-button-hover-border-color: var(--md-accent-deep);
  border-radius: 10px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .md-recap {
    max-width: none;
    padding: 4px 0 8px;
  }

  .recap-range {
    flex-direction: column;
    align-items: stretch;
  }

  .recap-range__picker {
    min-width: 0;
  }

  .recap-stats {
    grid-template-columns: 1fr;
  }

  .recap-stat {
    min-height: 0;
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    gap: 10px;
  }

  .recap-stat__label {
    flex: 1;
  }
}
</style>
