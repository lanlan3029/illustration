<template>
  <div class="dt-page">
    <header class="dt-header">
      <h1>{{ $t('diaryTimeline.pageTitle') }}</h1>
      <p>{{ $t('diaryTimeline.pageDesc') }}</p>
    </header>

    <div class="dt-layout">
      <section class="dt-panel">
        <p class="dt-label">{{ $t('diaryTimeline.styleTitle') }}</p>
        <div class="dt-option-grid" role="radiogroup" :aria-label="$t('diaryTimeline.styleTitle')">
          <button
            v-for="item in styleOptions"
            :key="item.value"
            type="button"
            class="dt-option"
            :class="{ active: style === item.value }"
            :aria-label="item.aria"
            :aria-pressed="style === item.value"
            @click="style = item.value"
          >
            <svg
              class="dt-diagram"
              :class="{ 'dt-diagram--portrait': isPortrait }"
              viewBox="0 0 120 80"
              aria-hidden="true"
            >
              <!-- paper -->
              <rect
                class="dt-diagram-paper"
                :x="isPortrait ? 38 : 10"
                :y="isPortrait ? 6 : 14"
                :width="isPortrait ? 44 : 100"
                :height="isPortrait ? 68 : 52"
                rx="4"
              />
              <!-- thin spine -->
              <template v-if="item.value === 'horizontalAlt'">
                <line
                  v-if="!isPortrait"
                  class="dt-diagram-spine"
                  x1="18"
                  y1="40"
                  x2="102"
                  y2="40"
                />
                <line
                  v-else
                  class="dt-diagram-spine"
                  x1="60"
                  y1="14"
                  x2="60"
                  y2="66"
                />
              </template>
              <!-- thick + dashed spine -->
              <template v-else>
                <template v-if="!isPortrait">
                  <rect
                    class="dt-diagram-thick"
                    x="18"
                    y="34"
                    width="84"
                    height="12"
                    rx="6"
                  />
                  <line
                    class="dt-diagram-dash"
                    x1="22"
                    y1="40"
                    x2="98"
                    y2="40"
                  />
                </template>
                <template v-else>
                  <rect
                    class="dt-diagram-thick"
                    x="54"
                    y="14"
                    width="12"
                    height="52"
                    rx="6"
                  />
                  <line
                    class="dt-diagram-dash"
                    x1="60"
                    y1="18"
                    x2="60"
                    y2="62"
                  />
                </template>
              </template>
              <!-- nodes -->
              <g v-for="(n, i) in diagramNodes" :key="i">
                <circle class="dt-diagram-dot" :cx="n.cx" :cy="n.cy" r="3.2" />
                <rect
                  class="dt-diagram-card"
                  :x="n.bx"
                  :y="n.by"
                  width="14"
                  height="10"
                  rx="2"
                />
              </g>
            </svg>
          </button>
        </div>

        <p class="dt-label">{{ $t('diaryTimeline.ratioTitle') }}</p>
        <div class="dt-chip-row" role="radiogroup" :aria-label="$t('diaryTimeline.ratioTitle')">
          <button
            v-for="item in ratioOptions"
            :key="item.value"
            type="button"
            class="dt-ratio"
            :class="{ active: ratio === item.value }"
            :aria-label="item.aria"
            :aria-pressed="ratio === item.value"
            @click="onRatioChange(item.value)"
          >
            <span
              class="dt-ratio-frame"
              :style="{
                width: item.frameW + 'px',
                height: item.frameH + 'px',
              }"
            />
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
  { value: 'horizontalAlt', ariaKey: 'diaryTimeline.styleAltAria' },
  { value: 'thickDashedPath', ariaKey: 'diaryTimeline.styleThickDashedAria' },
]

/** value + frame size for ratio chip icon */
const RATIO_OPTIONS = [
  { value: '16:9', w: 16, h: 9 },
  { value: '3:2', w: 3, h: 2 },
  { value: '2:1', w: 2, h: 1 },
  { value: '4:3', w: 4, h: 3 },
  { value: '1:1', w: 1, h: 1 },
  { value: '3:4', w: 3, h: 4 },
  { value: '2:3', w: 2, h: 3 },
  { value: '9:16', w: 9, h: 16 },
]

function isPortraitRatio(ratio) {
  const [w, h] = String(ratio || '').split(':').map(Number)
  return Number.isFinite(w) && Number.isFinite(h) && h > w
}

function sideForIndex(i, ratio) {
  if (isPortraitRatio(ratio)) return i % 2 === 0 ? 'Left' : 'Right'
  return i % 2 === 0 ? 'Above' : 'Below'
}

function buildDiagramNodes(portrait) {
  // 4 nodes alternating along spine
  if (portrait) {
    const ys = [22, 34, 46, 58]
    return ys.map((cy, i) => {
      const left = i % 2 === 0
      return {
        cx: 60,
        cy,
        bx: left ? 34 : 72,
        by: cy - 5,
      }
    })
  }
  const xs = [30, 50, 70, 90]
  return xs.map((cx, i) => {
    const above = i % 2 === 0
    return {
      cx,
      cy: 40,
      bx: cx - 7,
      by: above ? 18 : 48,
    }
  })
}

function ratioFrameSize(w, h) {
  const max = 28
  const scale = max / Math.max(w, h)
  return {
    frameW: Math.max(8, Math.round(w * scale)),
    frameH: Math.max(8, Math.round(h * scale)),
  }
}

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
    isPortrait() {
      return isPortraitRatio(this.ratio)
    },
    diagramNodes() {
      return buildDiagramNodes(this.isPortrait)
    },
    styleOptions() {
      return STYLE_OPTIONS.map((o) => ({
        value: o.value,
        aria: this.$t(o.ariaKey),
      }))
    },
    ratioOptions() {
      return RATIO_OPTIONS.map((o) => {
        const frame = ratioFrameSize(o.w, o.h)
        return {
          value: o.value,
          aria: o.value,
          ...frame,
        }
      })
    },
    canExpand() {
      return this.diary.trim().length >= 8
    },
    canGenerate() {
      return this.canExpand || (this.plan && this.plan.nodes?.length >= 4)
    },
  },
  methods: {
    onRatioChange(value) {
      this.ratio = value
      if (this.plan?.nodes?.length) {
        this.plan = {
          ...this.plan,
          ratio: value,
          nodes: this.plan.nodes.map((n, i) => ({
            ...n,
            side: sideForIndex(i, value),
          })),
        }
      }
    },
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
        } else {
          this.plan = {
            ...this.plan,
            style: this.style,
            ratio: this.ratio,
            nodes: (this.plan.nodes || []).map((n, i) => ({
              ...n,
              side: sideForIndex(i, this.ratio),
            })),
          }
        }
        const result = await generateDiaryTimeline(this.$http, {
          diary: this.diary,
          style: this.style,
          ratio: this.ratio,
          plan: this.plan,
        })
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
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.dt-option {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--line);
  background: var(--paper);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.dt-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  background: #fff;
}

.dt-diagram {
  width: 100%;
  max-width: 160px;
  height: auto;
  display: block;
}

.dt-diagram-paper {
  fill: #fffdf8;
  stroke: #d7cec0;
  stroke-width: 1.5;
}

.dt-diagram-spine {
  stroke: #2c2a28;
  stroke-width: 2;
  stroke-linecap: round;
}

.dt-diagram-thick {
  fill: #d9cfc0;
  stroke: none;
}

.dt-diagram-dash {
  stroke: #2c2a28;
  stroke-width: 1.4;
  stroke-dasharray: 3 2.5;
  stroke-linecap: round;
}

.dt-diagram-dot {
  fill: #2c2a28;
}

.dt-diagram-card {
  fill: #fff;
  stroke: #2c2a28;
  stroke-width: 1.2;
}

.dt-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dt-ratio {
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--line);
  background: #fff;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dt-ratio.active {
  border-color: var(--accent);
  background: #f3efe8;
  box-shadow: 0 0 0 1px var(--accent);
}

.dt-ratio-frame {
  display: block;
  border: 1.5px solid #2c2a28;
  border-radius: 2px;
  background: #f7f1e6;
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
