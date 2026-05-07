<template>
  <div class="md-card md-recap">
    <h1 class="md-title">{{ $t('moodDiary.navRecap') }}</h1>
    <div class="seg">
      <el-radio-group v-model="period">
        <el-radio-button label="week">{{ $t('moodDiary.recapWeek') }}</el-radio-button>
        <el-radio-button label="month">{{ $t('moodDiary.recapMonth') }}</el-radio-button>
      </el-radio-group>
    </div>
    <div class="md-fill">
      <pre class="recap-block">{{ recapText }}</pre>
    </div>
    <el-button type="primary" class="recap-footer-btn" @click="openPoster">{{ $t('moodDiary.openSharePoster') }}</el-button>
  </div>
</template>

<script>
import { buildRecap, recapToReadable } from '@/utils/moodDiary/recapEngine'
import { getRecordsSorted } from '@/utils/moodDiary/records'
import { findMoodById } from '@/utils/moodDiary/moodAssets'

const POSTER_KEY = 'mood_diary_share_poster_payload'

export default {
  name: 'MoodDiaryRecap',
  data() {
    return {
      period: 'week'
    }
  },
  computed: {
    recapText() {
      const rec = buildRecap(this.period, getRecordsSorted())
      return recapToReadable(rec, (k, params) => this.$t(k, params), (id) => {
        const isZh = this.$i18n?.locale === 'zh'
        return findMoodById(id, isZh)?.label || id
      })
    }
  },
  methods: {
    openPoster() {
      const title =
        this.period === 'week'
          ? this.$t('moodDiary.weeklyRecapShareTitle')
          : this.$t('moodDiary.monthlyRecapShareTitle')
      const bodyLines = this.recapText.split('\n')
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
