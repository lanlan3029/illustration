<template>
  <div
    class="waiting-journal"
    :class="{ 'waiting-journal--en': locale === 'en' }"
    :style="atmosphereStyle"
  >
    <p class="waiting-journal__stage">
      <span class="waiting-journal__brush" aria-hidden="true" />
      {{ stageText }}
    </p>

    <div class="waiting-journal__desk">
      <div class="waiting-journal__book">
        <div v-if="!loading && displayQuote" class="waiting-journal__page">
          <div class="waiting-journal__paper">
            <span class="waiting-journal__date">{{ todayLabel }}</span>
            <Transition name="waiting-quote" mode="out-in">
              <div
                :key="`${displayIndex}-${displayQuote.id}`"
                class="waiting-journal__content"
              >
                <blockquote class="waiting-journal__quote">
                  <p>{{ displayQuote.text }}</p>
                </blockquote>
                <p v-if="displayQuote.author" class="waiting-journal__author">
                  —— {{ displayQuote.author }}
                </p>
              </div>
            </Transition>
          </div>
        </div>

        <div v-else class="waiting-journal__page">
          <div class="waiting-journal__paper waiting-journal__paper--loading">
            <span class="waiting-journal__date">{{ todayLabel }}</span>
            <p class="waiting-journal__loading-text">{{ $t('moodDiary.waitingQuotesLoading') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && quotes.length > 1" class="waiting-journal__dots" aria-hidden="true">
      <span
        v-for="(_, i) in quotes"
        :key="quotes[i].id || i"
        class="waiting-journal__dot"
        :class="{ 'waiting-journal__dot--active': i === displayIndex }"
      />
    </div>
  </div>
</template>

<script>
import { atmosphereCssVars } from '@/utils/moodDiary/moodTheme'
import {
  DEFAULT_QUOTE_LIMIT,
  loadWaitingQuotes,
  normalizeWaitingQuoteLocale
} from '@/utils/moodDiary/waitingQuotes'
import { getDraft } from '@/utils/moodDiary/draft'

const ROTATE_MS = 20000

export default {
  name: 'MoodDiaryWaitingJournal',
  props: {
    active: { type: Boolean, default: false },
    moodEmojiId: { type: [String, null], default: null },
    moodLabel: { type: String, default: '' },
    stageText: { type: String, default: '' },
    locale: { type: String, default: 'zh' }
  },
  data() {
    return {
      quotes: [],
      displayIndex: 0,
      loading: false,
      rotateTimer: null,
      reloadTimer: null,
      requestSeq: 0
    }
  },
  computed: {
    displayQuote() {
      return this.quotes[this.displayIndex] || null
    },
    todayLabel() {
      const d = new Date()
      if (this.locale === 'en') {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    },
    atmosphereStyle() {
      return atmosphereCssVars(this.moodEmojiId)
    },
    quoteLocale() {
      return normalizeWaitingQuoteLocale(this.locale)
    }
  },
  watch: {
    active: {
      immediate: true,
      handler(on) {
        if (on) this.scheduleSession()
        else this.stopSession()
      }
    },
    moodEmojiId() {
      if (this.active) this.scheduleSession()
    },
    moodLabel() {
      if (this.active) this.scheduleSession()
    },
    quoteLocale() {
      if (this.active) this.scheduleSession()
    }
  },
  beforeUnmount() {
    this.stopSession()
  },
  methods: {
    scheduleSession() {
      if (this.reloadTimer) clearTimeout(this.reloadTimer)
      this.reloadTimer = setTimeout(() => {
        this.reloadTimer = null
        this.startSession()
      }, 60)
    },
    async startSession() {
      this.stopRotation()
      await this.reloadQuotes()
      if (this.active) this.startRotation()
    },
    stopSession() {
      if (this.reloadTimer) {
        clearTimeout(this.reloadTimer)
        this.reloadTimer = null
      }
      this.stopRotation()
    },
    stopRotation() {
      if (this.rotateTimer) {
        clearInterval(this.rotateTimer)
        this.rotateTimer = null
      }
    },
    async reloadQuotes() {
      const seq = ++this.requestSeq
      this.loading = true
      this.quotes = []
      this.displayIndex = 0

      try {
        const draft = getDraft()
        const { quotes } = await loadWaitingQuotes({
          locale: this.quoteLocale,
          moodEmojiId: this.moodEmojiId || draft.moodEmojiId,
          moodLabel: this.moodLabel || draft.moodLabel,
          draft,
          limit: DEFAULT_QUOTE_LIMIT
        })

        if (seq !== this.requestSeq) return

        this.quotes =
          quotes.length > 0
            ? quotes
            : [
                {
                  id: 'fallback',
                  text: this.$t('moodDiary.windowSceneQuote').replace(/\n/g, ''),
                  author: ''
                }
              ]
        this.displayIndex = 0
      } catch (e) {
        if (seq !== this.requestSeq) return
        console.warn('[mood-diary] reload waiting quotes failed', e?.message || e)
        this.quotes = [
          {
            id: 'fallback',
            text: this.$t('moodDiary.windowSceneQuote').replace(/\n/g, ''),
            author: ''
          }
        ]
        this.displayIndex = 0
      } finally {
        if (seq === this.requestSeq) {
          this.loading = false
        }
      }
    },
    startRotation() {
      this.stopRotation()
      if (this.quotes.length <= 1) return
      this.rotateTimer = setInterval(() => this.nextQuote(), ROTATE_MS)
    },
    nextQuote() {
      if (this.loading || this.quotes.length <= 1) return
      this.displayIndex = (this.displayIndex + 1) % this.quotes.length
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Ma+Shan+Zheng&display=swap');

.waiting-journal {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 8px 4px 12px;
  box-sizing: border-box;
}

.waiting-journal__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--md-muted, #9d96a8);
  text-align: center;
}

.waiting-journal__brush {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--md-accent-deep, #7ecbb8);
  border-top-color: transparent;
  animation: brush-spin 0.9s linear infinite;
  flex-shrink: 0;
}

@keyframes brush-spin {
  to {
    transform: rotate(360deg);
  }
}

.waiting-journal__desk {
  position: relative;
}

.waiting-journal__book {
  position: relative;
  min-height: 60vh;
}

.waiting-journal__page {
  position: relative;
  z-index: 2;
}

.waiting-journal__paper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 60vh;
  min-height: 60vh;
  padding: 28px 24px 32px;
  border-radius: 16px;
  background-color: #faf3e8;
  background-image:
    linear-gradient(90deg, rgba(210, 180, 140, 0.12) 0, rgba(210, 180, 140, 0.12) 1px, transparent 1px),
    repeating-linear-gradient(
      transparent,
      transparent 23px,
      rgba(168, 152, 128, 0.14) 24px,
      rgba(168, 152, 128, 0.14) 25px
    ),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
  border: 1px solid rgba(196, 181, 150, 0.45);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 12px 36px rgba(196, 181, 224, 0.18),
    0 3px 8px rgba(95, 89, 112, 0.1);
  box-sizing: border-box;
}

.waiting-journal__paper--loading {
  justify-content: flex-start;
}

.waiting-journal__loading-text {
  margin: auto 0;
  font-family: 'Ma Shan Zheng', 'STXingkai', 'KaiTi', cursive;
  font-size: 18px;
  line-height: 24px;
  color: rgba(95, 89, 112, 0.45);
  text-align: center;
}

.waiting-journal__date {
  display: block;
  flex-shrink: 0;
  margin-bottom: 18px;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(95, 89, 112, 0.55);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.waiting-journal__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

.waiting-journal__quote {
  margin: 0;
  padding: 0;
  border: none;
}

.waiting-journal__quote p {
  margin: 0;
  font-family: 'Ma Shan Zheng', 'STXingkai', 'KaiTi', '华文行楷', cursive;
  font-size: clamp(17px, 2.6vw, 20px);
  line-height: 24px;
  color: #5f5970;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: center;
}

.waiting-journal--en .waiting-journal__quote p {
  font-family: 'Caveat', 'Bradley Hand', 'Segoe Script', cursive;
  font-size: clamp(18px, 2.8vw, 22px);
  line-height: 24px;
}

.waiting-journal__author {
  flex-shrink: 0;
  margin: 16px 0 0;
  text-align: right;
  font-size: 12px;
  line-height: 24px;
  color: rgba(95, 89, 112, 0.62);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.waiting-quote-enter-active,
.waiting-quote-leave-active {
  transition: opacity 0.8s ease;
}

.waiting-quote-enter-from,
.waiting-quote-leave-to {
  opacity: 0;
}

.waiting-journal__dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
}

.waiting-journal__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(157, 150, 168, 0.35);
  transition: transform 0.2s ease, background 0.2s ease;
}

.waiting-journal__dot--active {
  background: var(--md-accent-deep, #7ecbb8);
  transform: scale(1.25);
}
</style>
