<template>
  <div class="md-card md-recap">
    <h1 class="md-title">{{ $t('moodDiary.navRecap') }}</h1>
    <div class="seg">
      <el-radio-group v-model="period">
        <el-radio-button label="week">{{ $t('moodDiary.recapWeek') }}</el-radio-button>
        <el-radio-button label="month">{{ $t('moodDiary.recapMonth') }}</el-radio-button>
      </el-radio-group>
    </div>
    <p v-if="recapLoading" class="recap-status">{{ $t('moodDiary.recapAiLoading') }}</p>
    <p v-else-if="recapAiError" class="recap-status recap-status--warn">{{ recapAiError }}</p>
    <div class="md-fill">
      <pre class="recap-block">{{ displayRecap }}</pre>
    </div>
    <el-button type="primary" class="recap-footer-btn" :disabled="recapLoading" @click="openPoster">
      {{ $t('moodDiary.openSharePoster') }}
    </el-button>
  </div>
</template>

<script>
import { buildRecap, buildRecapCompletionPayload, recapToReadable } from '@/utils/moodDiary/recapEngine'
import { getRecordsSorted } from '@/utils/moodDiary/records'
import { findMoodById } from '@/utils/moodDiary/moodAssets'
import { fetchRecapChatCompletion, getActiveMoodEndpoints } from '@/utils/moodDiary/api'

const POSTER_KEY = 'mood_diary_share_poster_payload'

export default {
  name: 'MoodDiaryRecap',
  data() {
    return {
      period: 'week',
      aiRecapText: '',
      recapLoading: false,
      recapAiError: ''
    }
  },
  computed: {
    recapLocalText() {
      const rec = buildRecap(this.period, getRecordsSorted())
      return recapToReadable(rec, (k, params) => this.$t(k, params), (id) => {
        const isZh = this.$i18n?.locale === 'zh'
        return findMoodById(id, isZh)?.label || id
      })
    },
    displayRecap() {
      const ai = (this.aiRecapText || '').trim()
      if (ai) return ai
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
        this.aiRecapText = ''
        this.recapAiError = ''
        return
      }
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || '' : ''
      if (!token || token === 'undefined') {
        this.aiRecapText = ''
        this.recapAiError = this.$t('moodDiary.recapAiNeedLogin')
        return
      }

      this.recapLoading = true
      this.recapAiError = ''
      this.aiRecapText = ''
      try {
        const records = getRecordsSorted()
        const payload = buildRecapCompletionPayload(
          this.period,
          records,
          (id) => {
            const isZh = this.$i18n?.locale === 'zh'
            return findMoodById(id, isZh)?.label || id
          },
          this.$i18n?.locale === 'en' ? 'en' : 'zh'
        )
        const text = await fetchRecapChatCompletion(payload, cfg.recapCompletionEndpoint)
        this.aiRecapText = text
      } catch (e) {
        this.recapAiError = e.message || this.$t('moodDiary.recapAiFailed')
        this.aiRecapText = ''
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

.md-title {
  margin: 0 0 12px;
  font-size: 20px;
  flex-shrink: 0;
}

.seg {
  flex-shrink: 0;
  margin-bottom: 14px;
}

.recap-status {
  margin: 0 0 10px;
  font-size: 13px;
  color: #8167a9;
  flex-shrink: 0;
}

.recap-status--warn {
  color: #c45656;
}

.recap-footer-btn {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 16px;
}

.recap-block {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.65;
  color: #303133;
  background: #f8f8fb;
  border-radius: 10px;
  padding: 14px 16px;
  margin: 0;
  border: 1px solid #ebeef5;
}
</style>
