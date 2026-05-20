<template>
  <div class="md-card md-recap">
    <h1 class="md-title">{{ $t('moodDiary.navRecap') }}</h1>
    <div class="seg">
      <el-radio-group v-model="period" :disabled="recapLoading">
        <el-radio-button label="week">{{ $t('moodDiary.recapWeek') }}</el-radio-button>
        <el-radio-button label="month">{{ $t('moodDiary.recapMonth') }}</el-radio-button>
      </el-radio-group>
    </div>
    <p v-if="recapLoading" class="recap-status">{{ $t('moodDiary.recapAiLoading') }}</p>
    <p v-else-if="recapAiError" class="recap-status recap-status--warn">{{ recapAiError }}</p>
    <div class="md-fill">
      <div v-if="recapLoading" class="recap-skeleton" aria-busy="true" :aria-label="$t('moodDiary.recapAiLoading')">
        <div class="recap-skeleton__shine" />
        <div class="recap-skeleton__block">
          <div class="recap-skeleton__line recap-skeleton__line--long" />
          <div class="recap-skeleton__line recap-skeleton__line--med" />
          <div class="recap-skeleton__line recap-skeleton__line--short" />
        </div>
        <div class="recap-skeleton__block recap-skeleton__block--narrow">
          <div class="recap-skeleton__line recap-skeleton__line--med" />
          <div class="recap-skeleton__line recap-skeleton__line--long" />
        </div>
      </div>
      <div v-else-if="aiRecapSections.length" class="recap-stream">
        <article
          v-for="block in aiRecapSections"
          :key="block.key"
          class="recap-article"
          :class="[
            `recap-article--${block.key}`,
            block.key === 'overview' ? 'recap-article--hero' : ''
          ]"
        >
          <header v-if="block.title" class="recap-article__head">
            <span class="recap-article__mark" aria-hidden="true" />
            <h2 class="recap-article__title">{{ block.title }}</h2>
          </header>
          <ul v-if="block.themes" class="recap-chips" role="list">
            <li v-for="(item, i) in block.themes" :key="i" class="recap-chip" role="listitem">
              {{ item }}
            </li>
          </ul>
          <p
            v-else-if="block.body"
            class="recap-article__body"
            :class="{ 'recap-article__body--lead': block.key === 'overview' }"
          >
            {{ block.body }}
          </p>
        </article>
      </div>
      <div v-else class="recap-panel recap-panel--local">
        <span v-if="showLocalFallbackBadge" class="recap-local-badge">{{ $t('moodDiary.recapLocalSummaryBadge') }}</span>
        <pre class="recap-block">{{ displayRecap }}</pre>
      </div>
    </div>
    <el-button type="primary" class="recap-footer-btn" :disabled="recapLoading" @click="openPoster">
      {{ $t('moodDiary.openSharePoster') }}
    </el-button>
  </div>
</template>

<script>
import {
  buildRecap,
  buildRecapCompletionPayload,
  recapAiResultToReadable,
  recapToReadable
} from '@/utils/moodDiary/recapEngine'
import { getRecordsSorted } from '@/utils/moodDiary/records'
import { findMoodById } from '@/utils/moodDiary/moodAssets'
import { fetchCaptionMoodRecap, getActiveMoodEndpoints } from '@/utils/moodDiary/api'

const POSTER_KEY = 'mood_diary_share_poster_payload'

export default {
  name: 'MoodDiaryRecap',
  data() {
    return {
      period: 'week',
      aiRecapResult: null,
      recapLoading: false,
      recapAiError: ''
    }
  },
  computed: {
    moodLabelResolver() {
      return (id) => {
        const isZh = this.$i18n?.locale === 'zh'
        return findMoodById(id, isZh)?.label || id
      }
    },
    recapLocalText() {
      const rec = buildRecap(this.period, getRecordsSorted())
      return recapToReadable(rec, (k, params) => this.$t(k, params), this.moodLabelResolver)
    },
    showLocalFallbackBadge() {
      return !this.recapLoading && !this.aiRecapSections.length
    },
    aiRecapSections() {
      const r = this.aiRecapResult
      if (!r) return []
      const blocks = []
      if (r.overview) {
        blocks.push({
          key: 'overview',
          title: this.$t('moodDiary.recapSectionOverview'),
          body: r.overview
        })
      }
      if (r.moodTrend) {
        blocks.push({
          key: 'trend',
          title: this.$t('moodDiary.recapSectionTrend'),
          body: r.moodTrend
        })
      }
      if (r.themes?.length) {
        blocks.push({
          key: 'themes',
          title: this.$t('moodDiary.recapSectionThemes'),
          themes: r.themes
        })
      }
      if (r.highlight) {
        blocks.push({
          key: 'highlight',
          title: this.$t('moodDiary.recapSectionHighlight'),
          body: r.highlight
        })
      }
      if (r.suggestion) {
        blocks.push({
          key: 'suggestion',
          title: this.$t('moodDiary.recapSectionSuggestion'),
          body: r.suggestion
        })
      }
      if (!blocks.length && r.recapText) {
        blocks.push({
          key: 'recap_text',
          title: this.$t('moodDiary.recapSectionFull'),
          body: r.recapText
        })
      }
      return blocks
    },
    displayRecap() {
      if (this.aiRecapResult) {
        return recapAiResultToReadable(this.aiRecapResult, (k, params) => this.$t(k, params))
      }
      return this.recapLocalText
    }
  },
  watch: {
    period() {
      this.scheduleRecapFetch()
    }
  },
  mounted() {
    this.scheduleRecapFetch()
  },
  methods: {
    scheduleRecapFetch() {
      this.$nextTick(() => this.fetchAiRecap())
    },
    async fetchAiRecap() {
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
        const records = getRecordsSorted()
        const locale = this.$i18n?.locale === 'en' ? 'en' : 'zh'
        const payload = buildRecapCompletionPayload(
          this.period,
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
    openPoster() {
      const title =
        this.period === 'week'
          ? this.$t('moodDiary.weeklyRecapShareTitle')
          : this.$t('moodDiary.monthlyRecapShareTitle')
      const bodyLines = this.displayRecap.split('\n')
      try {
        sessionStorage.setItem(
          POSTER_KEY,
          JSON.stringify({
            title,
            bodyLines,
            siteLine: 'kidstory.cc · mood diary'
          })
        )
      } catch (_) {
        /* ignore */
      }
      this.$router.push({
        path: '/mood-diary/share-poster',
        query: { period: this.period }
      })
    }
  }
}
</script>

<style scoped>
.md-card.md-recap {
  --recap-purple: #6b5b95;
  --recap-purple-soft: rgba(107, 91, 149, 0.12);
  --recap-teal: #3d8b8b;
  --recap-teal-soft: rgba(61, 139, 139, 0.12);
  --recap-rose: #b56576;
  --recap-rose-soft: rgba(181, 101, 118, 0.1);
  --recap-amber: #c9a227;
  --recap-amber-soft: rgba(201, 162, 39, 0.12);
  --recap-slate: #303133;
  --recap-muted: #606266;
  --recap-border: #e8ecf1;
  --recap-page: #f4f6fa;

  width: 100%;
  max-width: 100%;
  margin: 0;
  flex: 1;
  min-height: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  padding: 22px 22px 20px;
  box-shadow: 0 8px 28px rgba(31, 35, 41, 0.07);
  box-sizing: border-box;
}

.md-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.md-title {
  margin: 0 0 14px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--recap-slate);
  flex-shrink: 0;
}

.seg {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.seg :deep(.el-radio-button__inner) {
  padding: 8px 18px;
}

.recap-status {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--recap-purple);
  flex-shrink: 0;
  line-height: 1.5;
}

.recap-status--warn {
  color: #c45656;
}

.recap-footer-btn {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 18px;
}

/* ---- loading skeleton ---- */
.recap-skeleton {
  position: relative;
  flex: 1;
  min-height: 180px;
  border-radius: 14px;
  background: var(--recap-page);
  border: 1px solid var(--recap-border);
  overflow: hidden;
  padding: 20px;
}

.recap-skeleton__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: recap-shine 1.8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes recap-shine {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.recap-skeleton__block {
  margin-bottom: 20px;
}

.recap-skeleton__block--narrow {
  max-width: 72%;
}

.recap-skeleton__line {
  height: 12px;
  border-radius: 6px;
  background: #e2e6ed;
  margin-bottom: 12px;
}

.recap-skeleton__line--long {
  width: 100%;
}

.recap-skeleton__line--med {
  width: 88%;
}

.recap-skeleton__line--short {
  width: 56%;
}

/* ---- AI structured stream ---- */
.recap-stream {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px 6px;
  scrollbar-gutter: stable;
}

.recap-article {
  position: relative;
  margin: 0;
  padding: 16px 18px 16px 20px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--recap-border);
  box-shadow: 0 2px 10px rgba(31, 35, 41, 0.04);
}

.recap-article::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--recap-purple);
  opacity: 0.85;
}

.recap-article--overview::before {
  background: linear-gradient(180deg, #7c6bae, var(--recap-purple));
}

.recap-article--trend::before {
  background: linear-gradient(180deg, #5c7cfa, #4b6cb7);
}

.recap-article--themes::before {
  background: linear-gradient(180deg, #3d9a9a, var(--recap-teal));
}

.recap-article--highlight::before {
  background: linear-gradient(180deg, #c97b88, var(--recap-rose));
}

.recap-article--suggestion::before {
  background: linear-gradient(180deg, #d4b84a, var(--recap-amber));
}

.recap-article--recap_text::before {
  background: linear-gradient(180deg, #909399, #606266);
}

.recap-article--hero {
  background: linear-gradient(135deg, #faf9ff 0%, #fff 55%);
  border-color: #e8e4f2;
}

.recap-article__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
}

.recap-article__mark {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--recap-purple);
  opacity: 0.55;
}

.recap-article--trend .recap-article__mark {
  background: #4b6cb7;
}

.recap-article--themes .recap-article__mark {
  background: var(--recap-teal);
}

.recap-article--highlight .recap-article__mark {
  background: var(--recap-rose);
}

.recap-article--suggestion .recap-article__mark {
  background: var(--recap-amber);
}

.recap-article--recap_text .recap-article__mark {
  background: #909399;
}

.recap-article__title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--recap-purple);
}

.recap-article--trend .recap-article__title {
  color: #4b6cb7;
}

.recap-article--themes .recap-article__title {
  color: var(--recap-teal);
}

.recap-article--highlight .recap-article__title {
  color: var(--recap-rose);
}

.recap-article--suggestion .recap-article__title {
  color: #9a7b1a;
}

.recap-article--recap_text .recap-article__title {
  color: var(--recap-muted);
}

.recap-article__body {
  margin: 0;
  font-size: 15px;
  line-height: 1.72;
  color: var(--recap-slate);
  white-space: pre-wrap;
}

.recap-article__body--lead {
  font-size: 16px;
  line-height: 1.75;
  font-weight: 500;
  color: #252830;
}

.recap-article--highlight {
  background: var(--recap-rose-soft);
  border-color: rgba(181, 101, 118, 0.18);
}

.recap-article--highlight .recap-article__body {
  padding-left: 2px;
  border-left: 2px solid rgba(181, 101, 118, 0.35);
  margin-left: 2px;
  padding-left: 14px;
}

.recap-article--suggestion {
  background: var(--recap-amber-soft);
  border-color: rgba(201, 162, 39, 0.25);
}

.recap-article--suggestion .recap-article__body {
  color: #4a4428;
}

/* nested hero fix — overview block should not duplicate outer article */
.recap-article--overview.recap-article--hero {
  padding-bottom: 18px;
}

/* theme chips */
.recap-chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recap-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  line-height: 1.4;
  color: #2a5c5c;
  background: var(--recap-teal-soft);
  border: 1px solid rgba(61, 139, 139, 0.22);
}

/* ---- local fallback ---- */
.recap-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.recap-panel--local {
  position: relative;
}

.recap-local-badge {
  align-self: flex-start;
  margin-bottom: 10px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--recap-muted);
  background: #eef1f5;
  border-radius: 6px;
}

.recap-block {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.72;
  color: var(--recap-slate);
  background: var(--recap-page);
  border-radius: 14px;
  padding: 16px 18px;
  margin: 0;
  border: 1px solid var(--recap-border);
}
</style>
