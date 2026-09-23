<template>
  <div
    class="scene-gallery"
    :class="{
      'scene-gallery--focus': isExpanded,
      'scene-gallery--hero': variant === 'hero',
    }"
  >
    <div v-if="variant === 'default'" class="scene-gallery__head">
      <p class="scene-gallery__label">{{ $t('childhoodMoments.crowdLabel') }}</p>
      <span class="scene-gallery__count">{{ $t('childhoodMoments.crowdCount', { count: people.length }) }}</span>
    </div>

    <div
      ref="wrapRef"
      class="scene-gallery__wrap"
      :class="{ 'scene-gallery__wrap--focus': isExpanded }"
    >
      <div
        ref="stageRef"
        class="scene-gallery__canvas"
        :style="{ height: `${stageHeight}px` }"
        @click="closeAllTips"
      >
        <p v-if="bootError" class="scene-gallery__error">{{ bootError }}</p>
        <p
          v-else
          class="scene-gallery__empty"
          :class="{ 'scene-gallery__empty--hidden': people.length > 0 }"
        >
          {{ $t('childhoodMoments.crowdEmpty') }}
        </p>

        <button
          v-for="person in people"
          :key="person.id"
          type="button"
          class="scene-gallery__item"
          :class="{
            'scene-gallery__item--in': person.visible,
            'scene-gallery__item--tip': person.tipOpen,
            'scene-gallery__item--focus': person.id === focusPersonId,
            'scene-gallery__item--dim': isExpanded && person.id !== focusPersonId,
            'scene-gallery__item--text': !person.imageUrl,
          }"
          :style="itemStyle(person)"
          :aria-label="person.note || $t('childhoodMoments.crowdPerson')"
          @click.stop="toggleTip(person.id)"
          @mouseenter="openTip(person.id)"
          @mouseleave="closeTip(person.id)"
          @focusin="openTip(person.id)"
          @focusout="closeTip(person.id)"
        >
          <div class="scene-gallery__tip">{{ person.note || $t('childhoodMoments.crowdNoNote') }}</div>
          <img
            v-if="person.imageUrl"
            class="scene-gallery__img"
            :src="person.imageUrl"
            alt=""
            decoding="async"
          />
          <div v-else class="scene-gallery__text-chip">
            {{ person.note ? person.note.slice(0, 2) : '…' }}
          </div>
        </button>
      </div>
    </div>

    <p v-if="variant === 'hero' && people.length > 0" class="scene-gallery__hint">
      {{ $t('childhoodMoments.crowdHoverHint', { count: people.length }) }}
    </p>
  </div>
</template>

<script>
import { fetchChildhoodScenes } from '@/utils/childhoodPictureApi'
import {
  createPerson,
  createPersonFromPicture,
  loadCrowdFromStorage,
  saveCrowdToStorage,
} from '@/utils/avatarCrowd'
import { layoutGalleryScenes } from '@/utils/childhoodSceneLayout'

const FOCUS_TIMELINE = {
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
      ready: false,
      bootError: '',
      stageHeight: 420,
      positions: {},
      resizeTimer: null,
      focusSettleTimer: null,
      focusSequenceTimers: [],
      warmed: new Set(),
      isExpanded: false,
      focusPersonId: null,
      prefersReducedMotion: false,
    }
  },
  mounted() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.boot()
    window.addEventListener('resize', this.handleResize, { passive: true })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    clearTimeout(this.resizeTimer)
    this.clearFocusSequence()
  },
  methods: {
    async boot() {
      try {
        this.ready = true
        this.bootError = ''
        await this.loadInitialPeople()
      } catch (err) {
        this.ready = false
        this.bootError = this.$t('childhoodMoments.crowdLoadFailed')
        console.error('[ChildhoodAvatarCrowd] boot failed', err)
      }
    },

    handleResize() {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        this.relayout()
        if (this.focusPersonId) {
          this.scrollToPerson(this.focusPersonId, false)
        }
      }, 80)
    },

    warmImage(url) {
      if (!url || this.warmed.has(url)) return
      this.warmed.add(url)
      const img = new Image()
      img.decoding = 'async'
      img.src = url
    },

    async loadInitialPeople() {
      let seedPeople = []
      try {
        const list = await fetchChildhoodScenes(this.$http)
        seedPeople = list
          .map((item, index) => createPersonFromPicture(item, index))
          .filter((person) => person.imageUrl)
      } catch (err) {
        console.error('[ChildhoodAvatarCrowd] fetch childhood pictures failed', err)
        this.bootError = this.$t('childhoodMoments.crowdLoadFailed')
      }

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
        this.warmImage(person.imageUrl)
      })
    },

    itemStyle(person) {
      const pos = this.positions[person.id]
      if (!pos) {
        return { opacity: 0, width: '96px' }
      }
      const rotate = pos.rotate || 0
      return {
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        width: `${pos.width}px`,
        zIndex: person.id === this.focusPersonId ? 10000 : 10 + Math.round(pos.top),
        '--base-scale': String(pos.baseScale || 1),
        '--item-rotate': `${rotate}deg`,
      }
    },

    relayout() {
      const width = this.$refs.wrapRef?.clientWidth || 360
      const { height, positions } = layoutGalleryScenes(this.people, width)
      this.stageHeight = height
      this.positions = Object.fromEntries(positions.map((p) => [p.id, p]))
      this.$nextTick(() => this.$emit('layout'))
    },

    wait(ms) {
      return new Promise((resolve) => {
        const timer = setTimeout(resolve, ms)
        this.focusSequenceTimers.push(timer)
      })
    },

    clearFocusSequence() {
      clearTimeout(this.focusSettleTimer)
      this.focusSequenceTimers.forEach(clearTimeout)
      this.focusSequenceTimers = []
    },

    scrollToPerson(id, smooth = true) {
      const wrap = this.$refs.wrapRef
      const pos = this.positions[id]
      if (!wrap || !pos) return
      const itemH = pos.height || pos.width * 0.82
      const centerY = pos.top + itemH * 0.5
      wrap.scrollTo({
        top: Math.max(0, centerY - wrap.clientHeight / 2),
        behavior: smooth && !this.prefersReducedMotion ? 'smooth' : 'auto',
      })
    },

    async runFocusSequence(person) {
      this.clearFocusSequence()
      this.focusPersonId = person.id

      if (this.prefersReducedMotion) {
        this.isExpanded = true
        person.visible = true
        person.tipOpen = true
        this.relayout()
        this.$nextTick(() => this.scrollToPerson(person.id, false))
        this.focusSettleTimer = setTimeout(() => this.releaseFocus(person), 3000)
        return
      }

      this.isExpanded = true
      await this.wait(FOCUS_TIMELINE.enter)
      person.visible = true
      await this.wait(FOCUS_TIMELINE.pan - FOCUS_TIMELINE.enter)
      this.scrollToPerson(person.id, true)
      await this.wait(FOCUS_TIMELINE.spotlight - FOCUS_TIMELINE.pan)
      person.tipOpen = true
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
      if (!this.ready) return null
      const person = createPerson(note)
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
.scene-gallery {
  --gallery-accent: #8167a9;
  --gallery-accent-soft: rgba(129, 103, 169, 0.12);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  width: 100%;
}

.scene-gallery--hero {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.scene-gallery__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.scene-gallery__label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b6478;
}

.scene-gallery__count {
  font-size: 12px;
  color: var(--gallery-accent);
}

.scene-gallery__wrap {
  position: relative;
  width: 100%;
  overflow: visible;
}

.scene-gallery--hero .scene-gallery__wrap {
  flex: 1;
  min-height: clamp(360px, 52vh, 640px);
}

.scene-gallery__wrap--focus {
  overflow: auto;
  max-height: clamp(480px, 72vh, 760px);
  scroll-behavior: smooth;
}

.scene-gallery__canvas {
  position: relative;
  width: 100%;
  min-height: 320px;
}

.scene-gallery__empty,
.scene-gallery__error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  text-align: center;
  font-size: 14px;
  line-height: 1.65;
  color: #9a929f;
  pointer-events: none;
}

.scene-gallery__error {
  color: #b44;
}

.scene-gallery__empty--hidden {
  opacity: 0;
}

.scene-gallery__item {
  position: absolute;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  aspect-ratio: 1 / 0.82;
  transform-origin: 50% 88%;
  opacity: 0;
  transform: translate3d(0, 12px, 0) rotate(var(--item-rotate, 0deg))
    scale(calc(var(--base-scale, 1) * 0.92));
  transition:
    transform 0.38s var(--ease-out),
    opacity 0.3s ease,
    filter 0.3s ease;
  filter: drop-shadow(0 6px 14px rgba(80, 60, 100, 0.08));
}

.scene-gallery__item--in {
  opacity: 1;
  transform: translate3d(0, 0, 0) rotate(var(--item-rotate, 0deg)) scale(var(--base-scale, 1));
}

.scene-gallery__item--dim {
  opacity: 0.45;
  filter: saturate(0.75);
}

.scene-gallery__item--focus {
  transform: translate3d(0, -8px, 0) rotate(0deg) scale(calc(var(--base-scale, 1) * 1.08)) !important;
  opacity: 1 !important;
  filter: drop-shadow(0 16px 28px rgba(80, 60, 100, 0.16)) !important;
  z-index: 10000 !important;
}

.scene-gallery__item:hover,
.scene-gallery__item:focus-visible,
.scene-gallery__item--tip {
  transform: translate3d(0, -6px, 0) rotate(0deg) scale(calc(var(--base-scale, 1) * 1.04));
  outline: none;
  filter: drop-shadow(0 12px 22px rgba(80, 60, 100, 0.14));
  z-index: 9999 !important;
}

.scene-gallery__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  pointer-events: none;
  user-select: none;
}

.scene-gallery__text-chip {
  width: 56%;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1.5px solid rgba(129, 103, 169, 0.28);
  color: #5c4a82;
  font-size: 14px;
  font-weight: 600;
}

.scene-gallery__tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 4px);
  width: max-content;
  max-width: min(260px, 78vw);
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  color: #3d2f62;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1.5px solid var(--gallery-accent);
  box-shadow: 0 8px 24px rgba(129, 103, 169, 0.12);
  pointer-events: none;
  z-index: 5;
  transform: translate3d(-50%, 8px, 0) scale(0.92);
  opacity: 0;
  transition:
    opacity 0.22s var(--ease-out),
    transform 0.28s var(--ease-out);
}

.scene-gallery__tip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: var(--gallery-accent);
}

.scene-gallery__item:hover .scene-gallery__tip,
.scene-gallery__item:focus-visible .scene-gallery__tip,
.scene-gallery__item--tip .scene-gallery__tip {
  opacity: 1;
  transform: translate3d(-50%, 0, 0) scale(1);
}

.scene-gallery__hint {
  margin: 12px 0 0;
  padding: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #9a929f;
  letter-spacing: 0.02em;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .scene-gallery__item,
  .scene-gallery__tip {
    transition: none;
  }
}
</style>
