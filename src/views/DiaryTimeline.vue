<template>
  <div class="dt-page">
    <header class="dt-header">
      <h1>{{ $t('diaryTimeline.pageTitle') }}</h1>
      <p>{{ $t('diaryTimeline.pageDesc') }}</p>
    </header>

    <div class="dt-layout">
      <section class="dt-panel">
        <p class="dt-label">{{ $t('diaryTimeline.styleTitle') }}</p>
        <div class="dt-option-grid" role="radiogroup">
          <button
            v-for="item in styleOptions"
            :key="item.value"
            type="button"
            class="dt-option"
            :class="{ active: style === item.value }"
            @click="style = item.value"
          >
            <span class="dt-option-title">{{ item.label }}</span>
            <span class="dt-option-desc">{{ item.desc }}</span>
          </button>
        </div>

        <p class="dt-label">{{ $t('diaryTimeline.ratioTitle') }}</p>
        <div class="dt-chip-row" role="radiogroup">
          <button
            v-for="item in ratioOptions"
            :key="item.value"
            type="button"
            class="dt-chip"
            :class="{ active: ratio === item.value }"
            @click="ratio = item.value"
          >
            {{ item.label }}
          </button>
        </div>

        <p class="dt-label">{{ $t('diaryTimeline.diaryTitle') }}</p>
        <el-input
          v-model="diary"
          type="textarea"
          :rows="12"
          :placeholder="$t('diaryTimeline.diaryPlaceholder')"
          maxlength="4000"
          show-word-limit
        />

        <div class="dt-actions">
          <el-button :disabled="!canExpand || expanding" @click="onExpand">
            {{ expanding ? $t('diaryTimeline.expanding') : $t('diaryTimeline.expand') }}
          </el-button>
          <el-button
            type="primary"
            :disabled="!canGenerate || generating"
            :loading="generating"
            @click="onGenerate"
          >
            {{ generating ? $t('diaryTimeline.generating') : $t('diaryTimeline.generate') }}
          </el-button>
        </div>
      </section>

      <section class="dt-result">
        <div v-if="plan" class="dt-plan">
          <div class="dt-plan-head">
            <h2>{{ $t('diaryTimeline.planTitle') }}</h2>
            <p>
              {{ plan.place_en }} · Day {{ plan.day }}
              <span v-if="plan.notes" class="dt-notes"> · {{ plan.notes }}</span>
            </p>
          </div>
          <div class="dt-nodes">
            <div v-for="(node, idx) in plan.nodes" :key="idx" class="dt-node">
              <span class="dt-node-idx">{{ idx + 1 }}</span>
              <el-input v-model="node.time" size="small" class="dt-node-time" />
              <el-input v-model="node.label" size="small" maxlength="4" class="dt-node-label" />
              <el-input v-model="node.doodle" size="small" class="dt-node-doodle" />
              <span class="dt-node-side">{{ node.side }}</span>
            </div>
          </div>
        </div>

        <div v-else class="dt-empty">
          <p>{{ $t('diaryTimeline.emptyPlan') }}</p>
        </div>

        <div v-if="imageUrl" class="dt-preview">
          <p class="dt-label">{{ $t('diaryTimeline.resultTitle') }}</p>
          <img :src="imageUrl" :alt="$t('diaryTimeline.resultTitle')" />
          <div class="dt-actions">
            <el-button @click="downloadImage">{{ $t('diaryTimeline.download') }}</el-button>
          </div>
        </div>
        <div v-else-if="generating" class="dt-loading">
          <span class="dt-spinner" />
          <p>{{ $t('diaryTimeline.generatingWait') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import {
  expandDiaryTimeline,
  generateDiaryTimeline,
} from '@/utils/diaryTimeline/api'

const STYLE_OPTIONS = [
  {
    value: 'horizontalAlt',
    labelKey: 'diaryTimeline.styleAlt',
    descKey: 'diaryTimeline.styleAltDesc',
  },
  {
    value: 'horizontalAbove',
    labelKey: 'diaryTimeline.styleAbove',
    descKey: 'diaryTimeline.styleAboveDesc',
  },
  {
    value: 'ribbonCompact',
    labelKey: 'diaryTimeline.styleCompact',
    descKey: 'diaryTimeline.styleCompactDesc',
  },
  {
    value: 'thickDashedPath',
    labelKey: 'diaryTimeline.styleThickDashed',
    descKey: 'diaryTimeline.styleThickDashedDesc',
  },
]

const RATIO_OPTIONS = [
  { value: '16:9', labelKey: 'diaryTimeline.ratio169' },
  { value: '3:2', labelKey: 'diaryTimeline.ratio32' },
  { value: '2:1', labelKey: 'diaryTimeline.ratio21' },
  { value: '4:3', labelKey: 'diaryTimeline.ratio43' },
  { value: '1:1', labelKey: 'diaryTimeline.ratio11' },
]

export default {
  name: 'DiaryTimeline',
  data() {
    return {
      diary: '',
      style: 'horizontalAlt',
      ratio: '16:9',
      plan: null,
      imageUrl: '',
      expanding: false,
      generating: false,
    }
  },
  computed: {
    styleOptions() {
      return STYLE_OPTIONS.map((o) => ({
        value: o.value,
        label: this.$t(o.labelKey),
        desc: this.$t(o.descKey),
      }))
    },
    ratioOptions() {
      return RATIO_OPTIONS.map((o) => ({
        value: o.value,
        label: this.$t(o.labelKey),
      }))
    },
    canExpand() {
      return this.diary.trim().length >= 8
    },
    canGenerate() {
      return this.canExpand || (this.plan && this.plan.nodes?.length >= 4)
    },
  },
  methods: {
    async onExpand() {
      if (!this.canExpand || this.expanding) return
      this.expanding = true
      try {
        const data = await expandDiaryTimeline(this.$http, {
          diary: this.diary,
          style: this.style,
          ratio: this.ratio,
        })
        this.plan = data.plan || null
        ElMessage.success(this.$t('diaryTimeline.expandOk'))
      } catch (e) {
        ElMessage.error(e?.message || this.$t('diaryTimeline.expandFailed'))
      } finally {
        this.expanding = false
      }
    },
    async onGenerate() {
      if (!this.canGenerate || this.generating) return
      this.generating = true
      this.imageUrl = ''
      try {
        if (!this.plan) {
          const data = await expandDiaryTimeline(this.$http, {
            diary: this.diary,
            style: this.style,
            ratio: this.ratio,
          })
          this.plan = data.plan || null
        }
        const result = await generateDiaryTimeline(
          this.$http,
          {
            diary: this.diary,
            style: this.style,
            ratio: this.ratio,
            plan: this.plan,
          }
        )
        this.imageUrl = result.imageUrl
        if (result.plan) this.plan = result.plan
        ElMessage.success(this.$t('diaryTimeline.generateOk'))
      } catch (e) {
        ElMessage.error(e?.message || this.$t('diaryTimeline.generateFailed'))
      } finally {
        this.generating = false
      }
    },
    downloadImage() {
      if (!this.imageUrl) return
      const a = document.createElement('a')
      a.href = this.imageUrl
      a.download = `diary-timeline-${Date.now()}.png`
      a.target = '_blank'
      a.rel = 'noopener'
      a.click()
    },
  },
}
</script>

<style scoped>
.dt-page {
  --ink: #1f2430;
  --muted: #6b7280;
  --paper: #f7f1e6;
  --line: #e6ddd0;
  --accent: #2c2a28;
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 20px 64px;
  text-align: left;
  color: var(--ink);
}

.dt-header {
  margin-bottom: 24px;
}

.dt-header h1 {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.dt-header p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  max-width: 52rem;
}

.dt-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 20px;
  align-items: start;
}

.dt-panel,
.dt-result {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 10px 28px rgba(40, 30, 20, 0.05);
}

.dt-label {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.dt-panel .dt-label + .dt-option-grid,
.dt-panel .dt-label + .dt-chip-row {
  margin-bottom: 18px;
}

.dt-option-grid {
  display: grid;
  gap: 10px;
}

.dt-option {
  text-align: left;
  border: 1.5px solid var(--line);
  background: var(--paper);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dt-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  background: #fff;
}

.dt-option-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}

.dt-option-desc {
  display: block;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
}

.dt-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dt-chip {
  border: 1.5px solid var(--line);
  background: #fff;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.dt-chip.active {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

.dt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.dt-plan-head h2 {
  margin: 0 0 6px;
  font-size: 16px;
}

.dt-plan-head p {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--muted);
}

.dt-notes {
  color: #9a9084;
}

.dt-nodes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dt-node {
  display: grid;
  grid-template-columns: 28px 88px 88px 1fr 56px;
  gap: 8px;
  align-items: center;
}

.dt-node-idx {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--paper);
  border: 1px solid var(--line);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.dt-node-side {
  font-size: 11px;
  color: var(--muted);
  text-align: right;
}

.dt-empty,
.dt-loading {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  background:
    linear-gradient(#ece4d6 1px, transparent 1px) 0 0 / 18px 18px,
    linear-gradient(90deg, #ece4d6 1px, transparent 1px) 0 0 / 18px 18px,
    var(--paper);
  border-radius: 12px;
  border: 1px dashed #d5cbbd;
}

.dt-preview img {
  width: 100%;
  display: block;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--paper);
}

.dt-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e6ddd0;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: dt-spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes dt-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .dt-layout {
    grid-template-columns: 1fr;
  }

  .dt-node {
    grid-template-columns: 28px 1fr 1fr;
    grid-template-areas:
      'idx time side'
      'idx label label'
      'idx doodle doodle';
  }

  .dt-node-idx {
    grid-area: idx;
  }
  .dt-node-time {
    grid-area: time;
  }
  .dt-node-side {
    grid-area: side;
  }
  .dt-node-label {
    grid-area: label;
  }
  .dt-node-doodle {
    grid-area: doodle;
  }
}
</style>
