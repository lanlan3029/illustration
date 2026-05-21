<template>
  <div
    class="window-scene"
    :class="{
      'window-scene--compact': compact && !poster,
      'window-scene--poster': poster
    }"
    :aria-label="$t('moodDiary.windowSceneAria')"
  >
    <div class="window-scene__bg" aria-hidden="true">
      <span v-for="n in 3" :key="n" class="window-scene__star" :class="`window-scene__star--${n}`">✦</span>
    </div>
    <div class="window-scene__content">
      <blockquote class="window-scene__quote">
        <p>{{ $t('moodDiary.windowSceneQuote') }}</p>
      </blockquote>
      <div class="window-scene__art">
        <img :src="windowImg" class="window-scene__img" alt="" />
      </div>
    </div>
    <p class="window-scene__credit">
      <a
        href="https://www.flaticon.com/free-stickers/window"
        target="_blank"
        rel="noopener noreferrer"
        title="window stickers"
      >
        {{ $t('moodDiary.windowSceneCredit') }}
      </a>
    </p>
  </div>
</template>

<script>
import windowImg from '@/assets/images/window.png'

export default {
  name: 'MoodDiaryWindowScene',
  props: {
    compact: { type: Boolean, default: false },
    poster: { type: Boolean, default: false }
  },
  data() {
    return { windowImg }
  }
}
</script>

<style scoped>
.window-scene {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(145deg, #fff5f8 0%, #f0faf5 48%, #eef4fc 100%);
  min-height: 200px;
}

.window-scene__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.window-scene__star {
  position: absolute;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1;
  opacity: 0.9;
}

.window-scene__star--1 {
  top: 14%;
  left: 18%;
  font-size: 12px;
}

.window-scene__star--2 {
  top: 22%;
  right: 42%;
  font-size: 16px;
}

.window-scene__star--3 {
  bottom: 28%;
  left: 12%;
  font-size: 11px;
}

.window-scene__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 24px 36px;
  min-height: 200px;
  box-sizing: border-box;
}

.window-scene__quote {
  flex: 1 1 42%;
  min-width: 0;
  margin: 0;
  padding: 0 0 0 14px;
  border-left: 3px solid rgba(255, 255, 255, 0.65);
}

.window-scene__quote p {
  margin: 0;
  font-size: clamp(18px, 2.4vw, 24px);
  font-weight: 600;
  line-height: 1.55;
  letter-spacing: 0.02em;
  color: rgba(95, 89, 112, 0.82);
  white-space: pre-line;
}

.window-scene__art {
  flex: 0 1 48%;
  max-width: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.window-scene__img {
  width: 100%;
  max-width: 220px;
  height: auto;
  display: block;
  filter: drop-shadow(0 10px 20px rgba(107, 83, 68, 0.12));
}

.window-scene__credit {
  position: absolute;
  right: 10px;
  bottom: 6px;
  z-index: 2;
  margin: 0;
  font-size: 9px;
  line-height: 1.3;
  opacity: 0.45;
}

.window-scene__credit a {
  color: rgba(95, 89, 112, 0.82);
  text-decoration: none;
}

.window-scene__credit a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.window-scene--compact {
  min-height: 168px;
}

.window-scene--compact .window-scene__content {
  justify-content: center;
  gap: 20px;
  padding: 28px 24px 32px;
  min-height: 168px;
}

.window-scene--compact .window-scene__quote {
  flex: 0 1 auto;
  padding: 0;
  border-left: none;
  text-align: center;
}

.window-scene--compact .window-scene__quote p {
  font-size: clamp(15px, 1.6vw, 18px);
  font-weight: 600;
  line-height: 1.55;
}

.window-scene--compact .window-scene__art {
  flex: 0 0 auto;
  max-width: 120px;
}

.window-scene--compact .window-scene__img {
  max-width: 112px;
}

.window-scene--compact .window-scene__star {
  display: none;
}

.window-scene--poster {
  height: 100%;
  min-height: 0;
  border-radius: 0;
  background: linear-gradient(145deg, #fff7fa 0%, #f0faf5 42%, #edf4fc 100%);
}

.window-scene--poster .window-scene__content {
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 30px 22px 34px;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
}

.window-scene--poster .window-scene__quote {
  flex: 0 0 auto;
  width: 100%;
  padding: 0 6px;
  border-left: none;
  text-align: center;
}

.window-scene--poster .window-scene__quote p {
  font-size: clamp(16px, 4.5vw, 20px);
  font-weight: 600;
  line-height: 1.55;
  letter-spacing: 0.02em;
  color: rgba(95, 89, 112, 0.78);
}

.window-scene--poster .window-scene__art {
  flex: 1 1 auto;
  width: 100%;
  max-width: none;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.window-scene--poster .window-scene__star {
  color: rgba(255, 255, 255, 0.95);
  opacity: 0.65;
}

.window-scene--poster .window-scene__img {
  width: auto;
  max-width: min(80%, 188px);
  max-height: min(52%, 220px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(107, 83, 68, 0.08));
}

.window-scene--poster .window-scene__star--1 {
  top: 10%;
  left: 14%;
  font-size: 10px;
}

.window-scene--poster .window-scene__star--2 {
  top: 16%;
  right: 16%;
  font-size: 11px;
}

.window-scene--poster .window-scene__star--3 {
  bottom: 18%;
  left: 12%;
  font-size: 9px;
}

.window-scene--poster .window-scene__credit {
  right: 8px;
  bottom: 5px;
  font-size: 8px;
  opacity: 0.35;
}

.window-scene--poster .window-scene__credit a {
  color: rgba(95, 89, 112, 0.45);
}

@media (max-width: 640px) {
  .window-scene__content {
    flex-direction: column-reverse;
    text-align: center;
    padding: 24px 18px 34px;
  }

  .window-scene__quote {
    padding: 0;
    border-left: none;
    border-top: 3px solid rgba(255, 255, 255, 0.65);
    padding-top: 16px;
  }

  .window-scene__art {
    max-width: 180px;
  }
}
</style>
