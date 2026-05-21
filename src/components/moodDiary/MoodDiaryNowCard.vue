<template>
  <div class="now-card">
    <div class="now-card__body">
      <button
        v-if="latestRecord?.posterDataUrl"
        type="button"
        class="now-card__poster-btn"
        @click="$emit('preview', latestRecord.posterDataUrl)"
      >
        <div class="now-card__poster-stage">
          <div class="now-card__slot now-card__slot--poster">
            <img :src="latestRecord.posterDataUrl" class="now-card__poster-img" alt="" />
            <div v-if="generating" class="now-card__generating">
              <span>{{ $t('moodDiary.posterGeneratingHint') }}</span>
            </div>
          </div>
        </div>
        <div class="now-card__meta">
          <span class="now-card__date">{{ formatShortDate(latestRecord.createdAt) }}</span>
          <span v-if="latestRecord.moodLabel" class="now-card__mood">{{ latestRecord.moodLabel }}</span>
        </div>
        <p v-if="latestCaption" class="now-card__caption">{{ latestCaption }}</p>
      </button>

      <div v-else class="now-card__empty">
        <div class="now-card__poster-stage">
          <div class="now-card__poster-stack">
            <span class="now-card__stack-card now-card__stack-card--3" aria-hidden="true" />
            <span class="now-card__stack-card now-card__stack-card--2" aria-hidden="true" />
            <span class="now-card__stack-card now-card__stack-card--1" aria-hidden="true" />
            <div class="now-card__slot now-card__slot--empty now-card__slot--front">
              <MoodDiaryWindowScene poster />
              <div v-if="generating" class="now-card__generating">
                <span>{{ $t('moodDiary.posterGeneratingHint') }}</span>
              </div>
            </div>
          </div>
        </div>
        <p class="now-card__slot-hint">{{ $t('moodDiary.nowCardEmptyHint') }}</p>
      </div>
    </div>

    <footer class="now-card__foot">
      <button type="button" class="now-card__write-btn" @click="$emit('write')">
        {{ $t('moodDiary.actionWrite') }}
      </button>
    </footer>
  </div>
</template>

<script>
import MoodDiaryWindowScene from '@/components/moodDiary/MoodDiaryWindowScene.vue'

export default {
  name: 'MoodDiaryNowCard',
  components: { MoodDiaryWindowScene },
  props: {
    latestRecord: { type: Object, default: null },
    generating: { type: Boolean, default: false }
  },
  emits: ['preview', 'write'],
  computed: {
    latestCaption() {
      const t = (this.latestRecord?.caption || this.latestRecord?.narrative || '').trim()
      if (!t) return ''
      return t.length > 56 ? `${t.slice(0, 56)}…` : t
    }
  },
  methods: {
    formatShortDate(ts) {
      const d = new Date(ts || Date.now())
      const locale = this.$i18n?.locale === 'zh' ? 'zh-CN' : 'en-US'
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    }
  }
}
</script>

<style scoped>
.now-card {
  width: 100%;
  max-width: 480px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 0 0;
  box-sizing: border-box;
  background: transparent;
}

.now-card__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
}

.now-card__empty {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.now-card__poster-btn {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  text-align: center;
}

.now-card__poster-stage {
  display: flex;
  justify-content: center;
  padding: 12px 8px 22px;
  overflow: visible;
}

.now-card__poster-stack {
  --stack-h: min(68vh, 580px);
  --stack-w: calc(var(--stack-h) * 9 / 16);
  position: relative;
  width: calc(var(--stack-w) + 36px);
  height: calc(var(--stack-h) + 28px);
  margin: 0 auto;
  flex-shrink: 0;
}

.now-card__stack-card,
.now-card__slot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--stack-w);
  height: var(--stack-h);
  max-width: 100%;
  aspect-ratio: 9 / 16;
  border-radius: 16px;
  box-sizing: border-box;
  border: 3px solid #fff;
  transform-origin: center center;
  pointer-events: none;
}

.now-card__stack-card {
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(196, 181, 224, 0.12),
    0 8px 20px var(--md-shadow);
}

.now-card__stack-card--3 {
  z-index: 0;
  background: linear-gradient(155deg, #edf4fc 0%, #e8eef8 100%);
  transform: translate(calc(-50% - 14px), calc(-50% + 12px)) rotate(-7deg);
}

.now-card__stack-card--2 {
  z-index: 1;
  background: linear-gradient(145deg, #ffeef3 0%, #fce8f0 100%);
  transform: translate(calc(-50% + 11px), calc(-50% + 7px)) rotate(5.5deg);
}

.now-card__stack-card--1 {
  z-index: 2;
  background: linear-gradient(150deg, #eef9f4 0%, #e8f6ef 55%, #edf4fc 100%);
  transform: translate(calc(-50% - 5px), calc(-50% - 4px)) rotate(-3.5deg);
}

.now-card__slot {
  overflow: hidden;
  flex-shrink: 0;
  box-shadow:
    0 0 0 1px rgba(196, 181, 224, 0.16),
    0 14px 32px var(--md-shadow),
    0 5px 12px rgba(184, 223, 240, 0.1);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.now-card__slot--front {
  z-index: 3;
  pointer-events: auto;
  transform: translate(-50%, -50%) rotate(-2.5deg);
}

.now-card__poster-btn .now-card__slot {
  position: relative;
  left: auto;
  top: auto;
  width: auto;
  height: min(68vh, 580px);
  margin: 0 auto;
  transform: rotate(-2.5deg);
}

.now-card__poster-btn:hover .now-card__slot {
  transform: rotate(-1.5deg) translateY(-3px);
  box-shadow:
    0 0 0 1px rgba(196, 181, 224, 0.2),
    0 18px 36px rgba(196, 181, 224, 0.18),
    0 8px 16px rgba(184, 223, 240, 0.12);
}

.now-card__empty:hover .now-card__slot--front {
  transform: translate(-50%, calc(-50% - 3px)) rotate(-1.5deg);
  box-shadow:
    0 0 0 1px rgba(196, 181, 224, 0.2),
    0 18px 36px rgba(196, 181, 224, 0.18),
    0 8px 16px rgba(184, 223, 240, 0.12);
}

.now-card__empty:hover .now-card__stack-card--1 {
  transform: translate(calc(-50% - 4px), calc(-50% - 6px)) rotate(-2.5deg);
}

.now-card__empty:hover .now-card__stack-card--2 {
  transform: translate(calc(-50% + 12px), calc(-50% + 5px)) rotate(4.5deg);
}

.now-card__empty:hover .now-card__stack-card--3 {
  transform: translate(calc(-50% - 13px), calc(-50% + 10px)) rotate(-6deg);
}

.now-card__slot--poster {
  background: var(--md-poster-slot, #f8fafc);
}

.now-card__slot--empty {
  background: transparent;
  padding: 0;
  display: block;
}

.now-card__slot-hint {
  margin: 0;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--md-muted);
}

.now-card__poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.now-card__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--md-muted);
}

.now-card__mood {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--md-surface);
  color: var(--md-text);
}

.now-card__caption {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--md-text);
  opacity: 0.85;
}

.now-card__generating {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(4px);
  font-size: 12px;
  line-height: 1.45;
  color: var(--md-text);
  text-align: center;
}

.now-card__foot {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 20px;
  width: 100%;
}

.now-card__write-btn {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: 10px;
  padding: 14px 18px;
  background: var(--md-accent-deep);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.02em;
  box-shadow: 0 8px 22px rgba(126, 203, 184, 0.34);
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.now-card__write-btn:hover {
  background: var(--md-mint-deep);
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(126, 203, 184, 0.4);
}

@media (max-width: 900px) {
  .now-card {
    height: auto;
    min-height: 0;
    max-width: 100%;
  }

  .now-card__body {
    flex: none;
    min-height: 0;
    justify-content: flex-start;
  }

  .now-card__foot {
    padding-top: 16px;
    padding-bottom: 4px;
  }

  .now-card__poster-stack {
    --stack-h: min(52vh, 440px);
  }

  .now-card__poster-btn .now-card__slot {
    height: min(52vh, 440px);
  }
}
</style>
