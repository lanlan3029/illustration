<template>
  <div class="md-card md-insights">
    <div class="hdr">
      <h1 class="md-title">{{ $t('moodDiary.monthlyReportTitle') }}</h1>
    </div>
    <div class="month-nav">
      <el-button size="small" @click="shiftMonth(-1)">‹</el-button>
      <span class="month-label">{{ monthLabel }}</span>
      <el-button size="small" @click="shiftMonth(1)">›</el-button>
    </div>
    <div class="md-fill">
      <div class="cal">
        <div class="cal-weekdays">
          <span v-for="w in weekdayLabels" :key="w">{{ w }}</span>
        </div>
        <div class="cal-cells">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="cell"
            :class="{ muted: !cell.inMonth, today: cell.isToday, 'has-mood': !!cell.moodId }"
          >
            <span v-if="cell.inMonth && !cell.moodId" class="d-num">{{ cell.day }}</span>
            <img v-if="cell.inMonth && cell.moodId" :src="moodSrc(cell.moodId)" class="m-ico" alt="" />
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
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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
      const pad = first.getDay()
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
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.md-title {
  margin: 0 auto 0 0;
  font-size: 18px;
  color: #5c6068;
  font-weight: 600;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  margin: 0 auto 48px;
  flex-shrink: 0;
}

.month-nav :deep(.el-button) {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 50%;
}

.month-label {
  min-width: 120px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  color: #4a4f57;
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
  gap: 6px;
  margin-bottom: 14px;
  font-size: 13px;
  color: #7b8088;
  text-align: center;
}

.cal-cells {
  flex: 1;
  align-content: start;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px 8px;
}

.cell {
  position: relative;
  min-height: 84px;
  border-radius: 14px;
  padding: 6px 2px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  background: transparent;
}

.cell.muted {
  opacity: 0.18;
}

.cell.today {
  outline: none;
}

.cell.today:not(.has-mood)::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -10px;
  width: 82px;
  height: 74px;
  transform: translateX(-50%);
  border: 1px dashed rgba(120, 126, 136, 0.38);
  border-radius: 14px;
  pointer-events: none;
}

.d-num {
  margin-top: 4px;
  font-size: 30px;
  line-height: 1;
  color: #666b73;
  font-weight: 500;
}

.m-ico {
  width: 64px;
  height: 64px;
  object-fit: contain;
  margin-top: 2px;
}

.cell.has-mood .d-num {
  display: none;
}
</style>
