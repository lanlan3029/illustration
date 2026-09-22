<template>
  <div
    class="avatar-crowd"
    :class="{
      'avatar-crowd--focus': isExpanded,
      'avatar-crowd--hero': variant === 'hero',
    }"
  >
    <div v-if="variant === 'default'" class="avatar-crowd__head">
      <p class="avatar-crowd__label">{{ $t('childhoodMoments.crowdLabel') }}</p>
      <span class="avatar-crowd__count">{{ $t('childhoodMoments.crowdCount', { count: people.length }) }}</span>
    </div>

    <div
      ref="wrapRef"
      class="avatar-crowd__wrap"
      :class="{ 'avatar-crowd__wrap--focus': isExpanded }"
    >
      <div
        ref="stageRef"
        class="avatar-crowd__stage"
        :class="{ 'avatar-crowd__stage--focus': isExpanded }"
        :style="stageStyle"
        @click="closeAllTips"
      >
        <p
          v-if="bootError"
          class="avatar-crowd__error"
        >
          {{ bootError }}
        </p>
        <p
          v-else
          class="avatar-crowd__empty"
          :class="{ 'avatar-crowd__empty--hidden': people.length > 0 }"
        >
          {{ $t('childhoodMoments.crowdEmpty') }}
        </p>

        <div
          v-for="person in people"
          :key="person.id"
          class="avatar-crowd__person"
          :class="{
            'avatar-crowd__person--in': person.visible,
            'avatar-crowd__person--tip': person.tipOpen,
            'avatar-crowd__person--focus': person.id === focusPersonId,
            'avatar-crowd__person--dim': isExpanded && person.id !== focusPersonId,
          }"
          :style="personStyle(person)"
          role="img"
          :aria-label="person.note || $t('childhoodMoments.crowdPerson')"
          tabindex="0"
          @click.stop="toggleTip(person.id)"
          @mouseenter="openTip(person.id)"
          @mouseleave="closeTip(person.id)"
          @focusin="openTip(person.id)"
          @focusout="closeTip(person.id)"
        >
          <div class="avatar-crowd__tip">{{ person.note || $t('childhoodMoments.crowdNoNote') }}</div>
          <div class="avatar-crowd__avatar">
            <img
              v-for="layer in layersFor(person)"
              :key="layer.key"
              :class="layer.cls"
              :style="layer.style"
              :src="layer.src"
              alt=""
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>

    <p v-if="variant === 'hero' && people.length > 0" class="avatar-crowd__hero-hint">
      {{ $t('childhoodMoments.crowdHoverHint', { count: people.length }) }}
    </p>
  </div>
</template>

<script>
import avatarManifest from '@/data/avatarParts/manifest.json'
import avatarStyleTags from '@/data/avatarParts/style_tags.json'
import { CHILDHOOD_SEED_STORIES } from '@/utils/childhoodSeedStories'
import {
  LAYER_SPECS,
  PERSON_ASPECT,
  createPerson,
  createSeedPerson,
  layoutPeople,
  loadCrowdFromStorage,
  partUrl,
  saveCrowdToStorage,
} from '@/utils/avatarCrowd'

/** 提交后聚焦动画时间轴（ms） */
const FOCUS_TIMELINE = {
  expand: 0,
  enter: 80,
  pan: 480,
  spotlight: 560,
  settle: 4200,
}

export default {
  name: 'ChildhoodAvatarCrowd',
  emits: ['layout'],
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'hero'].includes(v),
    },
  },
  data() {
    return {
      people: [],
      manifest: null,
      styleTags: null,
      ready: false,
      bootError: '',
      stageHeight: 320,
      personWidth: 132,
      positions: {},
      resizeTimer: null,
      focusSettleTimer: null,
      focusSequenceTimers: [],
      warmed: new Set(),
      isExpanded: false,
      focusPersonId: null,
      focusOrigin: { x: 50, y: 50 },
      prefersReducedMotion: false,
    }
  },
  computed: {
    stageStyle() {
      return {
        height: `${this.stageHeight}px`,
        '--focus-x': `${this.focusOrigin.x}%`,
        '--focus-y': `${this.focusOrigin.y}%`,
      }
    },
  },
  mounted() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.syncPersonWidth()
    this.boot()
    window.addEventListener('resize', this.handleResize, { passive: true })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    clearTimeout(this.resizeTimer)
    this.clearFocusSequence()
  },
  methods: {
    boot() {
      try {
        this.manifest = avatarManifest
        this.styleTags = avatarStyleTags
        this.ready = true
        this.bootError = ''
        this.loadInitialPeople()
      } catch (err) {
        this.ready = false
        this.bootError = this.$t('childhoodMoments.crowdLoadFailed')
        console.error('[ChildhoodAvatarCrowd] boot failed', err)
      }
    },

    syncPersonWidth() {
      const w = this.$refs.wrapRef?.clientWidth || 360
      if (this.variant === 'hero') {
        this.personWidth = w < 360 ? 96 : w < 520 ? 112 : w < 720 ? 124 : 136
        return
      }
      this.personWidth = w < 420 ? 108 : w < 640 ? 120 : 132
    },

    handleResize() {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        this.syncPersonWidth()
        this.relayout()
        if (this.focusPersonId) {
          this.scrollToPerson(this.focusPersonId, false)
          this.setFocusOrigin(this.focusPersonId)
        }
      }, 80)
    },

    warmImage(url) {
      if (this.warmed.has(url)) return
      this.warmed.add(url)
      const img = new Image()
      img.decoding = 'async'
      img.src = url
    },

    loadInitialPeople() {
      const seedPeople = CHILDHOOD_SEED_STORIES.map((story) =>
        createSeedPerson(story, this.manifest, this.styleTags)
      )
      const userPeople = loadCrowdFromStorage().map((p) => ({
        ...p,
        isSeed: false,
        visible: false,
        tipOpen: false,
      }))
      this.people = [...seedPeople, ...userPeople]
      this.warmPeople(this.people)
      this.$nextTick(() => {
        this.relayout()
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.people.forEach((p) => {
              p.visible = true
            })
          })
        })
      })
    },

    warmPeople(list) {
      list.forEach((person) => {
        LAYER_SPECS.forEach((spec) => {
          this.warmImage(partUrl(spec.kind, person.recipe[spec.kind]))
        })
      })
    },

    layersFor(person) {
      return LAYER_SPECS.map((spec) => ({
        key: `${person.id}-${spec.kind}`,
        cls: spec.cls,
        src: partUrl(spec.kind, person.recipe[spec.kind]),
        style: {
          left: `${spec.left * 100}%`,
          top: `${spec.top * 100}%`,
          width: `${spec.width * 100}%`,
          height: `${spec.height * 100}%`,
          zIndex: spec.zIndex,
        },
      }))
    },

    personStyle(person) {
      const pos = this.positions[person.id]
      if (!pos) {
        return {
          width: `${this.personWidth}px`,
          opacity: 0,
        }
      }
      return {
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        width: `${this.personWidth}px`,
        zIndex: person.id === this.focusPersonId ? 10000 : pos.zIndex,
        '--base-scale': String(pos.baseScale),
      }
    },

    relayout() {
      const width = this.$refs.wrapRef?.clientWidth || 360
      const parentH = this.$refs.wrapRef?.clientHeight || 0
      const { height, positions } = layoutPeople(
        this.people,
        width,
        this.personWidth,
        parentH
      )
      this.stageHeight = height
      this.positions = Object.fromEntries(positions.map((p) => [p.id, p]))
      this.$nextTick(() => this.$emit('layout'))
    },

    /** 人物群实际包围盒右侧中心（viewport 坐标），供页面连接线锚点 */
    getClusterConnectorPoint() {
      const stage = this.$refs.stageRef
      if (!stage || !this.people.length) return null

      const personH = this.personWidth * PERSON_ASPECT
      let maxRight = 0
      let sumY = 0
      let count = 0

      this.people.forEach((person) => {
        const pos = this.positions[person.id]
        if (!pos) return
        maxRight = Math.max(maxRight, pos.left + this.personWidth)
        sumY += pos.top + personH * 0.55
        count += 1
      })

      if (!count) return null

      const stageRect = stage.getBoundingClientRect()
      return {
        x: stageRect.left + maxRight + 4,
        y: stageRect.top + sumY / count,
      }
    },

    wait(ms) {
      return new Promise((resolve) => {
        const timer = setTimeout(resolve, ms)
        this.focusSequenceTimers.push(timer)
      })
    },

    nextFrame(count = 2) {
      return new Promise((resolve) => {
        let remaining = count
        const step = () => {
          remaining -= 1
          if (remaining <= 0) resolve()
          else requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
    },

    clearFocusSequence() {
      clearTimeout(this.focusSettleTimer)
      this.focusSequenceTimers.forEach(clearTimeout)
      this.focusSequenceTimers = []
    },

    setFocusOrigin(id) {
      const stage = this.$refs.stageRef
      const pos = this.positions[id]
      if (!stage || !pos) return

      const personH = this.personWidth * PERSON_ASPECT
      const stageW = stage.clientWidth || 1
      const stageH = this.stageHeight || 1

      this.focusOrigin = {
        x: ((pos.left + this.personWidth / 2) / stageW) * 100,
        y: ((pos.top + personH * 0.78) / stageH) * 100,
      }
    },

    scrollToPerson(id, smooth = true) {
      const wrap = this.$refs.wrapRef
      const pos = this.positions[id]
      if (!wrap || !pos) return

      const personH = this.personWidth * PERSON_ASPECT
      const centerX = pos.left + this.personWidth / 2
      const centerY = pos.top + personH * 0.62

      const maxScrollLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth)
      const maxScrollTop = Math.max(0, wrap.scrollHeight - wrap.clientHeight)

      wrap.scrollTo({
        left: Math.min(maxScrollLeft, Math.max(0, centerX - wrap.clientWidth / 2)),
        top: Math.min(maxScrollTop, Math.max(0, centerY - wrap.clientHeight / 2)),
        behavior: smooth && !this.prefersReducedMotion ? 'smooth' : 'auto',
      })
    },

    /**
     * 提交后动画序列：
     * 1. 区域放大 (expand)
     * 2. 新人入场 (enter)
     * 3. 视口平移至人物 (pan)
     * 4. 聚光灯 + 气泡 (spotlight)
     * 5. 收回扩展态 (settle)
     */
    async runFocusSequence(person) {
      this.clearFocusSequence()
      this.focusPersonId = person.id

      if (this.prefersReducedMotion) {
        this.isExpanded = true
        person.visible = true
        person.tipOpen = true
        this.relayout()
        this.$nextTick(() => {
          this.scrollToPerson(person.id, false)
          this.setFocusOrigin(person.id)
        })
        this.focusSettleTimer = setTimeout(() => this.releaseFocus(person), 3000)
        return
      }

      // 1. 区域放大
      this.isExpanded = true
      await this.wait(FOCUS_TIMELINE.enter)

      // 2. 新人入场
      person.visible = true
      await this.nextFrame(2)

      // 3. 平移视口到新人
      await this.wait(FOCUS_TIMELINE.pan - FOCUS_TIMELINE.enter)
      this.scrollToPerson(person.id, true)
      this.setFocusOrigin(person.id)

      // 4. 聚光灯 + 自动弹出气泡
      await this.wait(FOCUS_TIMELINE.spotlight - FOCUS_TIMELINE.pan)
      person.tipOpen = true

      // 5. 收回
      this.focusSettleTimer = setTimeout(() => {
        this.releaseFocus(person)
      }, FOCUS_TIMELINE.settle - FOCUS_TIMELINE.spotlight)
    },

    releaseFocus(person) {
      this.isExpanded = false
      this.focusPersonId = null
      if (person) person.tipOpen = false
    },

    addPerson(note) {
      if (!this.ready || !this.manifest) return null
      const person = createPerson(note, this.manifest, this.styleTags)
      this.warmPeople([person])
      this.people.push(person)
      saveCrowdToStorage(this.people.filter((p) => !p.isSeed))

      this.$nextTick(() => {
        this.relayout()
        this.runFocusSequence(person)
      })

      return person
    },

    openTip(id) {
      if (this.isExpanded && id !== this.focusPersonId) return
      this.people.forEach((p) => {
        p.tipOpen = p.id === id
      })
    },

    closeTip(id) {
      if (this.isExpanded && id === this.focusPersonId) return
      const person = this.people.find((p) => p.id === id)
      if (person) person.tipOpen = false
    },

    toggleTip(id) {
      const person = this.people.find((p) => p.id === id)
      if (!person) return
      const next = !person.tipOpen
      this.people.forEach((p) => {
        p.tipOpen = p.id === id ? next : false
      })
    },

    closeAllTips() {
      if (this.isExpanded) return
      this.people.forEach((p) => {
        p.tipOpen = false
      })
    },
  },
}
</script>

<style scoped>
.avatar-crowd {
  --crowd-purple: #8167a9;
  --crowd-purple-soft: rgba(129, 103, 169, 0.07);
  --person-w: 132px;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}

.avatar-crowd--hero {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: visible;
}

.avatar-crowd--hero .avatar-crowd__wrap {
  flex: 1;
  min-height: clamp(280px, 38vh, 480px);
  height: auto;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.avatar-crowd--hero .avatar-crowd__wrap--focus {
  min-height: clamp(480px, 68vh, 720px);
  box-shadow: none;
  border: none;
  overflow: auto;
  padding-top: clamp(56px, 8vh, 80px);
  box-sizing: border-box;
}

.avatar-crowd--hero .avatar-crowd__stage--focus {
  transform: scale(1.04);
}

.avatar-crowd--hero .avatar-crowd__empty {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.35);
  padding: 16px;
}

.avatar-crowd--hero .avatar-crowd__tip {
  max-width: min(220px, 72vw);
  box-shadow:
    0 4px 14px rgba(129, 103, 169, 0.1),
    0 0 0 1.5px var(--crowd-purple-soft);
  z-index: 10001;
}

.avatar-crowd__hero-hint {
  margin: 10px clamp(16px, 3vw, 28px) 0;
  padding: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #8a8498;
  letter-spacing: 0.02em;
}

.avatar-crowd__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  transition: opacity 0.3s ease;
}

.avatar-crowd--focus .avatar-crowd__head {
  opacity: 0.72;
}

.avatar-crowd__label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #444;
}

.avatar-crowd__count {
  font-size: 12px;
  color: var(--crowd-purple);
  letter-spacing: 0.04em;
}

.avatar-crowd__wrap {
  position: relative;
  min-height: clamp(360px, 52vh, 560px);
  border-radius: 16px;
  background:
    radial-gradient(ellipse at 50% 0%, #fff 0%, transparent 58%),
    linear-gradient(180deg, #faf9fc 0%, #f5f0fa 100%);
  border: 1px solid #ece8f4;
  overflow: hidden;
  transition:
    min-height 0.55s var(--ease-out),
    border-color 0.4s ease,
    box-shadow 0.4s ease;
}

.avatar-crowd__wrap--focus {
  min-height: clamp(480px, 68vh, 720px);
  border-color: var(--crowd-purple);
  box-shadow:
    0 0 0 4px var(--crowd-purple-soft),
    0 20px 48px rgba(129, 103, 169, 0.14);
  overflow: auto;
  scroll-behavior: smooth;
}

.avatar-crowd__stage {
  position: relative;
  width: 100%;
  min-height: 320px;
  transform: scale(1);
  transform-origin: var(--focus-x, 50%) var(--focus-y, 50%);
  transition:
    height 0.45s var(--ease-out),
    transform 0.65s var(--ease-out);
}

.avatar-crowd__stage--focus {
  transform: scale(1.06);
}

.avatar-crowd__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  text-align: center;
  font-size: 14px;
  line-height: 1.65;
  color: #888;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.avatar-crowd__empty--hidden {
  opacity: 0;
}

.avatar-crowd__error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  text-align: center;
  font-size: 14px;
  line-height: 1.65;
  color: #b44;
}

.avatar-crowd__person {
  position: absolute;
  aspect-ratio: 1136 / 1533;
  transform-origin: 50% 88%;
  cursor: pointer;
  --lift: 0px;
  --base-scale: 1;
  --scale: var(--base-scale);
  --enter: 0.88;
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(calc(var(--scale) * var(--enter)));
  transition:
    transform 0.42s var(--ease-out),
    opacity 0.34s ease,
    filter 0.34s ease,
    left 0.48s var(--ease-out),
    top 0.48s var(--ease-out);
  will-change: transform, left, top;
  filter: drop-shadow(0 6px 10px rgba(61, 47, 98, 0.08));
}

.avatar-crowd__person--in {
  opacity: 1;
  --enter: 1;
  transform: translate3d(0, var(--lift), 0) scale(var(--scale));
}

.avatar-crowd__person--dim {
  opacity: 0.55;
  filter: saturate(0.82) drop-shadow(0 4px 8px rgba(61, 47, 98, 0.05));
}

.avatar-crowd__person--focus {
  --lift: -18px;
  --scale: calc(var(--base-scale) * 1.14);
  opacity: 1 !important;
  filter: drop-shadow(0 22px 32px rgba(129, 103, 169, 0.28)) !important;
  z-index: 10000 !important;
}

.avatar-crowd__person--focus::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 4%;
  width: 72%;
  height: 10%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(129, 103, 169, 0.28) 0%, transparent 72%);
  animation: crowd-spotlight 1.8s var(--ease-out) infinite;
  pointer-events: none;
  z-index: -1;
}

.avatar-crowd__person:hover,
.avatar-crowd__person:focus-visible,
.avatar-crowd__person--tip {
  --lift: -12px;
  --scale: calc(var(--base-scale) * 1.08);
  outline: none;
  filter: drop-shadow(0 16px 22px rgba(61, 47, 98, 0.16));
  z-index: 9999 !important;
}

.avatar-crowd__person--focus:hover,
.avatar-crowd__person--focus.avatar-crowd__person--tip {
  --lift: -18px;
  --scale: calc(var(--base-scale) * 1.14);
}

.avatar-crowd__avatar {
  position: relative;
  width: 100%;
  height: 100%;
}

.avatar-crowd__layer {
  position: absolute;
  display: block;
  pointer-events: none;
  user-select: none;
}

.avatar-crowd__tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% - 6%);
  width: max-content;
  max-width: min(220px, 72vw);
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  color: #3d2f62;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1.5px solid var(--crowd-purple);
  box-shadow:
    0 6px 18px rgba(129, 103, 169, 0.12),
    0 0 0 1.5px var(--crowd-purple-soft);
  pointer-events: none;
  z-index: 5;
  transform: translate3d(-50%, 10px, 0) scale(0.9);
  opacity: 0;
  transition:
    opacity 0.24s var(--ease-out),
    transform 0.3s var(--ease-out);
}

.avatar-crowd__tip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: var(--crowd-purple);
}

.avatar-crowd__person:hover .avatar-crowd__tip,
.avatar-crowd__person:focus-visible .avatar-crowd__tip,
.avatar-crowd__person--tip .avatar-crowd__tip {
  opacity: 1;
  transform: translate3d(-50%, 0, 0) scale(1);
}

@keyframes crowd-spotlight {
  0%,
  100% {
    opacity: 0.55;
    transform: translateX(-50%) scale(0.92);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.08);
  }
}

@media (max-width: 560px) {
  .avatar-crowd__person {
    --person-w: 108px;
  }

  .avatar-crowd__wrap--focus {
    min-height: clamp(420px, 62vh, 640px);
  }

  .avatar-crowd__stage--focus {
    transform: scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .avatar-crowd__wrap,
  .avatar-crowd__stage,
  .avatar-crowd__person,
  .avatar-crowd__tip {
    transition: none;
  }

  .avatar-crowd__person--focus::before {
    animation: none;
  }

  .avatar-crowd__stage--focus {
    transform: none;
  }
}
</style>
