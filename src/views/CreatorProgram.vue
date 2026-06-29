<template>
  <div class="creator-program">
    <!-- Hero：号召投稿 -->
    <header class="cp-hero">
      <div class="cp-hero-inner">
        <div class="cp-hero-copy">
          <p class="cp-kicker">{{ $t('creatorProgram.hero.kicker') }}</p>
          <h1>{{ $t('creatorProgram.hero.title') }}</h1>
          <p class="cp-slogan">{{ $t('creatorProgram.hero.slogan') }}</p>
          <p class="cp-lead">{{ $t('creatorProgram.hero.lead') }}</p>
          <div class="cp-hero-actions">
            <router-link to="/creation-studio/book/ai" class="cp-btn cp-btn--primary cp-btn--lg">
              {{ $t('creatorProgram.hero.ctaPrimary') }} →
            </router-link>
            <router-link to="/books/" class="cp-btn cp-btn--ghost">
              {{ $t('creatorProgram.hero.ctaSecondary') }}
            </router-link>
          </div>
          <p class="cp-hero-hint">{{ $t('creatorProgram.hero.hint') }}</p>
        </div>
        <div class="cp-hero-visual">
          <img :src="heroImage" :alt="$t('creatorProgram.hero.title')" loading="eager" />
        </div>
      </div>
    </header>

    <nav class="cp-nav" aria-label="section navigation">
      <a v-for="item in sectionNav" :key="item.id" :href="`#${item.id}`" class="cp-nav-link">
        {{ $t(item.labelKey) }}
      </a>
    </nav>

    <!-- 为什么参与 -->
    <section id="why" class="cp-section">
      <div class="cp-section-head cp-section-head--center">
        <h2>{{ $t('creatorProgram.why.title') }}</h2>
        <p>{{ $t('creatorProgram.why.subtitle') }}</p>
      </div>
      <div class="cp-why-grid">
        <article v-for="key in whyKeys" :key="key" class="cp-why-card">
          <span class="cp-why-icon">{{ $t(`creatorProgram.why.items.${key}.icon`) }}</span>
          <h3>{{ $t(`creatorProgram.why.items.${key}.title`) }}</h3>
          <p>{{ $t(`creatorProgram.why.items.${key}.desc`) }}</p>
        </article>
      </div>
      <p class="cp-audience-line">{{ $t('creatorProgram.why.audience') }}</p>
    </section>

    <!-- 怎么投稿 -->
    <section id="how" class="cp-section cp-section--alt">
      <div class="cp-section-head">
        <h2>{{ $t('creatorProgram.submit.title') }}</h2>
        <p>{{ $t('creatorProgram.submit.subtitle') }}</p>
      </div>
      <div class="cp-paths">
        <article
          v-for="(step, idx) in submitSteps"
          :key="step.id"
          class="cp-path-card"
          :class="{ 'cp-path-card--reverse': idx % 2 === 1 }"
        >
          <div class="cp-path-content">
            <span class="cp-path-index">{{ String(idx + 1).padStart(2, '0') }}</span>
            <h3>{{ $t(`creatorProgram.submit.steps.${step.id}.title`) }}</h3>
            <p>{{ $t(`creatorProgram.submit.steps.${step.id}.desc`) }}</p>
            <p v-if="step.mailto" class="cp-path-email">
              <a :href="`mailto:${step.mailto}`">{{ step.mailto }}</a>
            </p>
            <router-link v-if="step.route" :to="step.route" class="cp-path-link">
              {{ $t(step.linkKey) }}
              <span class="cp-path-link-arrow" aria-hidden="true">→</span>
            </router-link>
            <a
              v-else-if="step.mailto"
              :href="`mailto:${step.mailto}?subject=${encodeURIComponent(step.mailSubject || '')}`"
              class="cp-path-link"
            >
              {{ $t(step.linkKey) }}
              <span class="cp-path-link-arrow" aria-hidden="true">→</span>
            </a>
          </div>
          <div class="cp-path-visual">
            <div class="cp-path-glow" aria-hidden="true"></div>
            <div class="cp-path-frame">
              <img
                :src="step.image"
                :alt="$t(`creatorProgram.submit.steps.${step.id}.title`)"
                loading="lazy"
              />
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- 你能获得什么 -->
    <section id="rewards" class="cp-section">
      <div class="cp-split-reward">
        <div>
          <div class="cp-section-head">
            <h2>{{ $t('creatorProgram.rewards.title') }}</h2>
            <p>{{ $t('creatorProgram.rewards.subtitle') }}</p>
          </div>
         
          <ul class="cp-reward-list">
            <li v-for="key in monthlyRewardKeys" :key="key">
              <span class="cp-check">✓</span>
              {{ $t(`creatorProgram.rewards.monthly.items.${key}`) }}
            </li>
          </ul>
          <p class="cp-reward-note">{{ $t('creatorProgram.rewards.note') }}</p>
        </div>
        <div class="cp-perk-grid">
          <div v-for="key in perkKeys" :key="key" class="cp-perk-card">
            <strong>{{ $t(`creatorProgram.rewards.perks.${key}.title`) }}</strong>
            <span>{{ $t(`creatorProgram.rewards.perks.${key}.desc`) }}</span>
          </div>
        </div>
      </div>
      <div class="cp-visual-card">
        <img :src="galleryImage" :alt="$t('creatorProgram.rewards.title')" loading="lazy" />
        <p>{{ $t('creatorProgram.rewards.imageCaption') }}</p>
      </div>
    </section>

    <!-- 投稿须知（精简） -->
    <section class="cp-section cp-rules">
      <div class="cp-rules-box">
        <h2>{{ $t('creatorProgram.rules.title') }}</h2>
        <ul>
          <li v-for="key in ruleKeys" :key="key">{{ $t(`creatorProgram.rules.items.${key}`) }}</li>
        </ul>
      </div>
    </section>

    <!-- 底部号召 -->
    <section class="cp-cta">
      <h2>{{ $t('creatorProgram.cta.title') }}</h2>
      <p>{{ $t('creatorProgram.cta.subtitle') }}</p>
      <router-link to="/creation-studio/book/ai" class="cp-btn cp-btn--primary cp-btn--lg">
        {{ $t('creatorProgram.cta.create') }} →
      </router-link>
      <p class="cp-cta-foot">{{ $t('creatorProgram.cta.foot') }}</p>
    </section>
  </div>
</template>

<script setup>
import {
  SECTION_NAV,
  WHY_KEYS,
  SUBMIT_STEPS,
  MONTHLY_REWARD_KEYS,
  PERK_KEYS,
  RULE_KEYS,
  PROGRAM_HERO_IMAGE,
  PROGRAM_GALLERY_IMAGE,
} from '@/data/creatorProgram/content'

const sectionNav = SECTION_NAV
const whyKeys = WHY_KEYS
const submitSteps = SUBMIT_STEPS
const monthlyRewardKeys = MONTHLY_REWARD_KEYS
const perkKeys = PERK_KEYS
const ruleKeys = RULE_KEYS
const heroImage = PROGRAM_HERO_IMAGE
const galleryImage = PROGRAM_GALLERY_IMAGE
</script>

<style scoped>
.creator-program {
  --cp-purple-deep: #3d2f62;
  --cp-accent: #8167a9;
  --cp-text: #2c2a38;
  --cp-muted: #6b6578;
  background: #faf9fc;
  color: var(--cp-text);
  text-align: left;
}

.cp-hero {
  background:
    radial-gradient(ellipse 80% 60% at 15% 0%, rgba(255, 200, 180, 0.35), transparent),
    linear-gradient(145deg, #3d2f62 0%, #5b4b8a 50%, #7a6aab 100%);
  color: #fff;
  padding: 48px 20px 52px;
}

.cp-hero-inner {
  max-width: 1060px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 36px;
  align-items: center;
}

.cp-kicker {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.88;
  margin-bottom: 10px;
}

.cp-hero h1 {
  font-size: clamp(1.7rem, 4vw, 2.35rem);
  line-height: 1.2;
  margin-bottom: 10px;
}

.cp-slogan {
  font-size: clamp(1.05rem, 2.5vw, 1.3rem);
  font-weight: 600;
  color: #ffe8c8;
  margin-bottom: 14px;
}

.cp-lead {
  font-size: 15px;
  line-height: 1.7;
  opacity: 0.93;
  max-width: 480px;
  margin-bottom: 24px;
}

.cp-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.cp-hero-hint {
  font-size: 13px;
  opacity: 0.78;
  margin: 0;
}

.cp-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cp-btn--lg {
  padding: 14px 28px;
  font-size: 15px;
}

.cp-btn--primary {
  background: #fff;
  color: var(--cp-purple-deep);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.cp-btn--primary:hover {
  transform: translateY(-2px);
}

.cp-btn--ghost {
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.cp-hero-visual {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.cp-hero-visual img {
  width: 100%;
  display: block;
}

.cp-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.cp-nav-link {
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--cp-muted);
  text-decoration: none;
}

.cp-nav-link:hover {
  background: #f0ebf8;
  color: var(--cp-accent);
}

.cp-section {
  max-width: 1060px;
  margin: 0 auto;
  padding: 52px 20px;
  scroll-margin-top: 52px;
}

.cp-section--alt {
  background: linear-gradient(180deg, #f7f4fb 0%, #fff 100%);
  max-width: none;
  padding-left: max(20px, calc((100vw - 1060px) / 2));
  padding-right: max(20px, calc((100vw - 1060px) / 2));
}

.cp-section-head {
  margin-bottom: 28px;
  max-width: 640px;
}

.cp-section-head--center {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.cp-section-head h2 {
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  margin-bottom: 8px;
}

.cp-section-head p {
  color: var(--cp-muted);
  line-height: 1.65;
  font-size: 15px;
  margin: 0;
}

.cp-why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 20px;
}

.cp-why-card {
  padding: 24px 20px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #ece8f4;
  text-align: center;
  box-shadow: 0 4px 20px rgba(49, 35, 82, 0.05);
}

.cp-why-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}

.cp-why-card h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.cp-why-card p {
  font-size: 14px;
  color: var(--cp-muted);
  line-height: 1.6;
  margin: 0;
}

.cp-audience-line {
  text-align: center;
  font-size: 14px;
  color: var(--cp-muted);
  margin: 0;
}

.cp-paths {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 980px;
  margin: 0 auto;
}

.cp-path-card {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 28px;
  align-items: center;
  padding: 28px 30px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid rgba(129, 103, 169, 0.1);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 18px 48px -28px rgba(61, 47, 98, 0.22);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.cp-path-card:hover {
  transform: translateY(-3px);
  border-color: rgba(129, 103, 169, 0.2);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 28px 56px -24px rgba(61, 47, 98, 0.18);
}

.cp-path-card--reverse {
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
}

.cp-path-card--reverse .cp-path-content {
  order: 2;
}

.cp-path-card--reverse .cp-path-visual {
  order: 1;
}

.cp-path-content {
  padding: 4px 6px;
}

.cp-path-index {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 0.16em;
  font-weight: 700;
  color: var(--cp-accent);
  opacity: 0.85;
  margin-bottom: 14px;
}

.cp-path-content h3 {
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  line-height: 1.35;
  margin: 0 0 10px;
  color: var(--cp-purple-deep);
}

.cp-path-content p {
  font-size: 14px;
  color: var(--cp-muted);
  line-height: 1.7;
  margin: 0 0 18px;
  max-width: 34ch;
}

.cp-path-email {
  margin: -8px 0 16px !important;
}

.cp-path-email a {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: #f5f0fa;
  color: var(--cp-accent);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.cp-path-email a:hover {
  background: #ebe3f6;
}

.cp-path-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--cp-accent);
  text-decoration: none;
  transition: gap 0.2s ease, color 0.2s ease;
}

.cp-path-link:hover {
  gap: 12px;
  color: var(--cp-purple-deep);
}

.cp-path-link-arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.cp-path-link:hover .cp-path-link-arrow {
  transform: translateX(3px);
}

.cp-path-visual {
  position: relative;
  min-height: 180px;
}

.cp-path-glow {
  position: absolute;
  inset: 12% 8% 8% 12%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(129, 103, 169, 0.16), transparent 68%);
  filter: blur(8px);
  pointer-events: none;
}

.cp-path-frame {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: linear-gradient(145deg, #f3eef9, #ebe4f4);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 24px 48px -20px rgba(61, 47, 98, 0.35),
    0 0 0 1px rgba(129, 103, 169, 0.08);
  transform: perspective(900px) rotateY(-4deg) rotateX(2deg);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.cp-path-card--reverse .cp-path-frame {
  transform: perspective(900px) rotateY(4deg) rotateX(2deg);
}

.cp-path-card:hover .cp-path-frame {
  transform: perspective(900px) rotateY(0deg) rotateX(0deg);
  box-shadow:
    0 28px 56px -18px rgba(61, 47, 98, 0.32),
    0 0 0 1px rgba(129, 103, 169, 0.12);
}

.cp-path-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

.cp-split-reward {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
  margin-bottom: 24px;
}

.cp-monthly-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f5f0fa;
  color: var(--cp-accent);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.cp-reward-list {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
}

.cp-reward-list li {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0ecf6;
  font-size: 14px;
  line-height: 1.5;
}

.cp-check {
  color: #52a86a;
  font-weight: 700;
}

.cp-reward-note {
  font-size: 13px;
  color: var(--cp-muted);
  margin: 0;
  line-height: 1.55;
}

.cp-perk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.cp-perk-card {
  padding: 16px;
  border-radius: 12px;
  background: #f8f5fc;
  border: 1px solid #ece8f4;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cp-perk-card strong {
  font-size: 14px;
  color: var(--cp-purple-deep);
}

.cp-perk-card span {
  font-size: 12px;
  color: var(--cp-muted);
  line-height: 1.45;
}

.cp-visual-card {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #ece8f4;
  background: #fff;
}

.cp-visual-card img {
  width: 100%;
  display: block;
}

.cp-visual-card p {
  padding: 10px 14px;
  margin: 0;
  font-size: 13px;
  color: var(--cp-muted);
}

.cp-rules {
  padding-top: 24px;
  padding-bottom: 24px;
}

.cp-rules-box {
  padding: 24px 28px;
  border-radius: 14px;
  background: #f5f0fa;
  border: 1px solid #e8e0f4;
}

.cp-rules-box h2 {
  font-size: 1.05rem;
  margin-bottom: 14px;
}

.cp-rules-box ul {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  color: var(--cp-muted);
  line-height: 1.75;
}

.cp-cta {
  text-align: center;
  padding: 56px 20px 72px;
  background: linear-gradient(180deg, #f0ebf8, #faf9fc);
}

.cp-cta h2 {
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  color: var(--cp-purple-deep);
  margin-bottom: 10px;
}

.cp-cta p {
  color: var(--cp-muted);
  max-width: 480px;
  margin: 0 auto 24px;
  line-height: 1.65;
}

.cp-cta .cp-btn--primary {
  background: var(--cp-accent);
  color: #fff;
}

.cp-cta-foot {
  margin-top: 16px !important;
  margin-bottom: 0 !important;
  font-size: 13px !important;
}

@media (max-width: 860px) {
  .cp-hero-inner,
  .cp-why-grid,
  .cp-split-reward {
    grid-template-columns: 1fr;
  }

  .cp-path-card,
  .cp-path-card--reverse {
    grid-template-columns: 1fr;
    padding: 22px 20px;
  }

  .cp-path-card--reverse .cp-path-content,
  .cp-path-card--reverse .cp-path-visual {
    order: unset;
  }

  .cp-path-visual {
    min-height: 0;
  }

  .cp-path-frame,
  .cp-path-card--reverse .cp-path-frame,
  .cp-path-card:hover .cp-path-frame {
    transform: none;
  }

  .cp-hero-visual {
    order: -1;
  }
}

@media (max-width: 640px) {
  .cp-perk-grid {
    grid-template-columns: 1fr;
  }
}
</style>
