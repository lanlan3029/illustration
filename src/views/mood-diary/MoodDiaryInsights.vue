<template>
  <div class="md-card md-insights">
    <div class="hdr">
      <h1 class="md-title">{{ $t('moodDiary.monthlyReportTitle') }}</h1>
      <div class="month-nav">
        <el-button size="small" @click="shiftMonth(-1)">‹</el-button>
        <span class="month-label">{{ monthLabel }}</span>
        <el-button size="small" @click="shiftMonth(1)">›</el-button>
      </div>
    </div>
    <div class="md-fill">
      <p class="share-hint">{{ $t('moodDiary.monthlyShareHint') }}</p>

      <div class="cal">
        <div class="cal-weekdays">
          <span v-for="w in weekdayLabels" :key="w">{{ w }}</span>
        </div>
        <div class="cal-cells">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="cell"
            :class="{ muted: !cell.inMonth, today: cell.isToday }"
          >
            <span class="d-num">{{ cell.day }}</span>
            <img v-if="cell.moodId" :src="moodSrc(cell.moodId)" class="m-ico" alt="" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { findMoodById } from '@/utils/moodDiary/moodAssets'
import { getRecordsSorted } from '@/utils/moodDiary/records'

export default {
  name: 'MoodDiaryInsights',
  data() {
    return {
      cursor: new Date(),
      prevTitle: ''
    }
  },
  computed: {
    monthLabel() {
      const y = this.cursor.getFullYear()
      const m = this.cursor.getMonth() + 1
      return `${y} / ${String(m).padStart(2, '0')}`
    },
    weekdayLabels() {
      return this.$i18n?.locale === 'zh'
        ? ['一', '二', '三', '四', '五', '六', '日']
        : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    },
    /** day -> mood id (last record wins) */
    dayMoodMap() {
      const y = this.cursor.getFullYear()
      const m = this.cursor.getMonth()
      const map = {}
      for (const r of getRecordsSorted()) {
        const d = new Date(r.createdAt)
        if (d.getFullYear() !== y || d.getMonth() !== m) continue
        const day = d.getDate()
        if (r.moodEmojiId) map[day] = r.moodEmojiId
      }
      return map
    },
    cells() {
      const y = this.cursor.getFullYear()
      const m = this.cursor.getMonth()
      const first = new Date(y, m, 1)
      const pad = ((first.getDay() + 6) % 7)
      const start = new Date(y, m, 1 - pad)
      const cells = []
      const today = new Date()
      for (let i = 0; i < 42; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const inMonth = d.getMonth() === m
        const day = d.getDate()
        const moodId =
          inMonth && this.dayMoodMap[day] ? this.dayMoodMap[day] : ''
        cells.push({
          key: `${d.getFullYear()}-${d.getMonth()}-${day}-${i}`,
          day,
          inMonth,
          isToday:
            today.getFullYear() === d.getFullYear() &&
            today.getMonth() === d.getMonth() &&
            today.getDate() === day,
          moodId
        })
      }
      return cells
    }
  },
  mounted() {
    this.prevTitle = typeof document !== 'undefined' ? document.title : ''
    document.title = this.$t('moodDiary.monthlyRecapShareTitle')
  },
  unmounted() {
    if (this.prevTitle) document.title = this.prevTitle
  },
  methods: {
    shiftMonth(delta) {
      const x = new Date(this.cursor)
      x.setMonth(x.getMonth() + delta)
      this.cursor = x
    },
    moodSrc(id) {
      const isZh = this.$i18n?.locale === 'zh'
      const m = findMoodById(id, isZh)
      return m ? m.src : ''
    }
  }
}
</script>

<style scoped>
.md-card.md-insights {
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

.hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.md-title {
  margin: 0;
  font-size: 20px;
}

.month-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.month-label {
  min-width: 96px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.share-hint {
  flex-shrink: 0;
  margin: 0 0 16px;
  font-size: 12px;
  color: #909399;
}

.cal {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #a0a4ad;
  text-align: center;
}

.cal-cells {
  flex: 1;
  align-content: start;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.cell {
  min-height: 64px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 4px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: #fcfcff;
}

.cell.muted {
  opacity: 0.35;
}

.cell.today {
  border-color: #8167a9;
}

.d-num {
  font-size: 12px;
  color: #606266;
}

.m-ico {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
</style>
