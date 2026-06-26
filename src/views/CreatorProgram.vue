<template>
  <div class="creator-program">
    <!-- Hero -->
    <header class="cp-hero">
      <div class="cp-hero-inner">
        <div class="cp-hero-copy">
          <p class="cp-kicker">{{ $t('creatorProgram.hero.kicker') }}</p>
          <h1>{{ $t('creatorProgram.hero.title') }}</h1>
          <p class="cp-slogan">{{ $t('creatorProgram.hero.slogan') }}</p>
          <p class="cp-lead">{{ $t('creatorProgram.hero.lead') }}</p>
          <div class="cp-hero-actions">
            <router-link to="/creation-studio/book/ai" class="cp-btn cp-btn--primary">
              {{ $t('creatorProgram.hero.ctaCreate') }} →
            </router-link>
            <router-link to="/books/" class="cp-btn cp-btn--ghost">
              {{ $t('creatorProgram.hero.ctaBrowse') }}
            </router-link>
          </div>
          <div class="cp-ecosystem">
            <div v-for="item in ecosystemItems" :key="item.id" class="cp-eco-pill">
              <span class="cp-eco-icon">{{ item.icon }}</span>
              <span>{{ $t(`creatorProgram.ecosystem.${item.id}`) }}</span>
            </div>
          </div>
        </div>
        <div class="cp-hero-visual">
          <img :src="heroImage" :alt="$t('creatorProgram.hero.title')" loading="eager" />
        </div>
      </div>
    </header>

    <!-- Sticky nav -->
    <nav class="cp-nav" aria-label="section navigation">
      <a v-for="item in sectionNav" :key="item.id" :href="`#${item.id}`" class="cp-nav-link">
        {{ $t(item.labelKey) }}
      </a>
    </nav>

    <!-- Vision -->
    <section id="vision" class="cp-section">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.vision.tag') }}</span>
        <h2>{{ $t('creatorProgram.vision.title') }}</h2>
        <p>{{ $t('creatorProgram.vision.subtitle') }}</p>
      </div>
      <div class="cp-split">
        <div class="cp-prose">
          <h3>{{ $t('creatorProgram.background.title') }}</h3>
          <p>{{ $t('creatorProgram.background.p1') }}</p>
          <p>{{ $t('creatorProgram.background.p2') }}</p>
          <blockquote class="cp-quote">{{ $t('creatorProgram.vision.quote') }}</blockquote>
        </div>
        <div class="cp-visual-card">
          <img :src="workflowImage" :alt="$t('creatorProgram.vision.title')" loading="lazy" />
          <p>{{ $t('creatorProgram.vision.imageCaption') }}</p>
        </div>
      </div>
      <div class="cp-value-grid">
        <article v-for="key in valuePillars" :key="key" class="cp-value-card">
          <h4>{{ $t(`creatorProgram.values.${key}.title`) }}</h4>
          <p>{{ $t(`creatorProgram.values.${key}.desc`) }}</p>
        </article>
      </div>
    </section>

    <!-- Join -->
    <section id="join" class="cp-section cp-section--alt">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.join.tag') }}</span>
        <h2>{{ $t('creatorProgram.join.title') }}</h2>
        <p>{{ $t('creatorProgram.join.subtitle') }}</p>
      </div>
      <div class="cp-audience-grid">
        <div v-for="key in audienceKeys" :key="key" class="cp-audience-chip">
          {{ $t(`creatorProgram.audience.${key}`) }}
        </div>
      </div>
      <p class="cp-note">{{ $t('creatorProgram.join.note') }}</p>
    </section>

    <!-- Submit -->
    <section id="submit" class="cp-section">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.submit.tag') }}</span>
        <h2>{{ $t('creatorProgram.submit.title') }}</h2>
        <p>{{ $t('creatorProgram.submit.subtitle') }}</p>
      </div>
      <div class="cp-steps">
        <article v-for="(step, idx) in submitSteps" :key="step.id" class="cp-step-card">
          <div class="cp-step-num">{{ idx + 1 }}</div>
          <div class="cp-step-shot">
            <img :src="step.image" :alt="$t(`creatorProgram.submit.steps.${step.id}.title`)" loading="lazy" />
          </div>
          <div class="cp-step-body">
            <h3>{{ $t(`creatorProgram.submit.steps.${step.id}.title`) }}</h3>
            <p>{{ $t(`creatorProgram.submit.steps.${step.id}.desc`) }}</p>
            <router-link :to="step.route" class="cp-text-link">{{ $t(step.linkKey) }} →</router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- Rewards -->
    <section id="rewards" class="cp-section cp-section--alt">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.rewards.tag') }}</span>
        <h2>{{ $t('creatorProgram.rewards.title') }}</h2>
      </div>
      <div class="cp-reward-block">
        <h3>{{ $t('creatorProgram.rewards.monthly.title') }}</h3>
        <p class="cp-reward-intro">{{ $t('creatorProgram.rewards.monthly.intro') }}</p>
        <ul class="cp-reward-list">
          <li v-for="key in monthlyRewardKeys" :key="key">
            <span class="cp-check">✓</span>
            {{ $t(`creatorProgram.rewards.monthly.items.${key}`) }}
          </li>
        </ul>
      </div>
      <div class="cp-reward-block">
        <h3>{{ $t('creatorProgram.rewards.honors.title') }}</h3>
        <div class="cp-honor-grid">
          <span v-for="key in honorKeys" :key="key" class="cp-honor-chip">
            {{ $t(`creatorProgram.rewards.honors.${key}`) }}
          </span>
        </div>
      </div>
      <div class="cp-showcase-panel">
        <h3>{{ $t('creatorProgram.rewards.showcase.title') }}</h3>
        <p>{{ $t('creatorProgram.rewards.showcase.subtitle') }}</p>
        <div class="cp-showcase-grid">
          <div v-for="key in showcaseColumnKeys" :key="key" class="cp-showcase-item">
            {{ $t(`creatorProgram.rewards.showcase.columns.${key}`) }}
          </div>
        </div>
        <div class="cp-visual-card cp-visual-card--compact">
          <img :src="communityImage" :alt="$t('creatorProgram.rewards.showcase.title')" loading="lazy" />
        </div>
      </div>
    </section>

    <!-- Themes -->
    <section id="themes" class="cp-section">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.themes.tag') }}</span>
        <h2>{{ $t('creatorProgram.themes.title') }}</h2>
        <p>{{ $t('creatorProgram.themes.subtitle') }}</p>
      </div>
      <div class="cp-theme-grid">
        <div v-for="key in themeKeys" :key="key" class="cp-theme-card">
          <span class="cp-theme-icon">📘</span>
          <span>{{ $t(`creatorProgram.themes.items.${key}`) }}</span>
        </div>
      </div>
    </section>

    <!-- Criteria -->
    <section id="criteria" class="cp-section cp-section--alt">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.criteria.tag') }}</span>
        <h2>{{ $t('creatorProgram.criteria.title') }}</h2>
        <p>{{ $t('creatorProgram.criteria.subtitle') }}</p>
      </div>
      <div class="cp-criteria-list">
        <div v-for="item in criteria" :key="item.id" class="cp-criteria-row">
          <div class="cp-criteria-label">
            <span>{{ $t(`creatorProgram.criteria.items.${item.id}.label`) }}</span>
            <strong>{{ item.weight }}%</strong>
          </div>
          <div class="cp-criteria-bar">
            <div class="cp-criteria-fill" :style="{ width: `${item.weight}%` }" />
          </div>
          <p class="cp-criteria-desc">{{ $t(`creatorProgram.criteria.items.${item.id}.desc`) }}</p>
        </div>
      </div>
      <p class="cp-note cp-note--center">{{ $t('creatorProgram.criteria.fairness') }}</p>
    </section>

    <!-- Rights -->
    <section id="rights" class="cp-section">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.rights.tag') }}</span>
        <h2>{{ $t('creatorProgram.rights.title') }}</h2>
        <p>{{ $t('creatorProgram.rights.subtitle') }}</p>
      </div>
      <ul class="cp-rights-list">
        <li v-for="key in rightsKeys" :key="key">
          <span class="cp-rights-icon">◆</span>
          {{ $t(`creatorProgram.rights.items.${key}`) }}
        </li>
      </ul>
    </section>

    <!-- Agreement -->
    <section id="agreement" class="cp-section cp-section--dark">
      <div class="cp-section-head cp-section-head--light">
        <span class="cp-section-tag cp-section-tag--light">{{ $t('creatorProgram.agreement.tag') }}</span>
        <h2>{{ $t('creatorProgram.agreement.title') }}</h2>
        <p>{{ $t('creatorProgram.agreement.subtitle') }}</p>
      </div>
      <ol class="cp-agreement-list">
        <li v-for="key in agreementKeys" :key="key">
          {{ $t(`creatorProgram.agreement.items.${key}`) }}
        </li>
      </ol>
      <div class="cp-checklist">
        <h3>{{ $t('creatorProgram.checklist.title') }}</h3>
        <ul>
          <li v-for="n in 6" :key="n">{{ $t(`creatorProgram.checklist.items.${n}`) }}</li>
        </ul>
      </div>
    </section>

    <!-- Roadmap -->
    <section id="roadmap" class="cp-section">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.roadmap.tag') }}</span>
        <h2>{{ $t('creatorProgram.roadmap.title') }}</h2>
      </div>
      <div class="cp-timeline">
        <article v-for="phase in phases" :key="phase.id" class="cp-phase-card">
          <div class="cp-phase-icon">{{ phase.icon }}</div>
          <h3>{{ $t(`creatorProgram.roadmap.phases.${phase.id}.title`) }}</h3>
          <p class="cp-phase-goal">{{ $t(`creatorProgram.roadmap.phases.${phase.id}.goal`) }}</p>
          <ul>
            <li v-for="n in 3" :key="n">{{ $t(`creatorProgram.roadmap.phases.${phase.id}.items.${n}`) }}</li>
          </ul>
        </article>
      </div>
      <div class="cp-visual-card">
        <img :src="publishImage" :alt="$t('creatorProgram.roadmap.title')" loading="lazy" />
        <p>{{ $t('creatorProgram.roadmap.imageCaption') }}</p>
      </div>
    </section>

    <!-- Growth -->
    <section id="growth" class="cp-section cp-section--alt">
      <div class="cp-section-head">
        <span class="cp-section-tag">{{ $t('creatorProgram.growth.tag') }}</span>
        <h2>{{ $t('creatorProgram.growth.title') }}</h2>
        <p>{{ $t('creatorProgram.growth.subtitle') }}</p>
      </div>
      <div class="cp-tier-table-wrap">
        <table class="cp-tier-table">
          <thead>
            <tr>
              <th>{{ $t('creatorProgram.growth.table.level') }}</th>
              <th>{{ $t('creatorProgram.growth.table.condition') }}</th>
              <th>{{ $t('creatorProgram.growth.table.benefit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tier in growthTiers" :key="tier.id">
              <td>
                <span class="cp-tier-icon">{{ tier.icon }}</span>
                {{ $t(`creatorProgram.growth.tiers.${tier.id}.name`) }}
              </td>
              <td>{{ $t(`creatorProgram.growth.tiers.${tier.id}.condition`) }}</td>
              <td>{{ $t(`creatorProgram.growth.tiers.${tier.id}.benefit`) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CTA -->
    <section class="cp-cta">
      <h2>{{ $t('creatorProgram.cta.title') }}</h2>
      <p>{{ $t('creatorProgram.cta.subtitle') }}</p>
      <div class="cp-hero-actions">
        <router-link to="/creation-studio/book/ai" class="cp-btn cp-btn--primary cp-btn--lg">
          {{ $t('creatorProgram.cta.create') }} →
        </router-link>
        <router-link to="/connection" class="cp-btn cp-btn--ghost cp-btn--lg">
          {{ $t('creatorProgram.cta.guides') }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import {
  SECTION_NAV,
  AUDIENCE_KEYS,
  SUBMIT_STEPS,
  MONTHLY_REWARD_KEYS,
  HONOR_KEYS,
  SHOWCASE_COLUMN_KEYS,
  THEME_KEYS,
  CRITERIA,
  RIGHTS_KEYS,
  AGREEMENT_KEYS,
  PHASES,
  VALUE_PILLARS,
  GROWTH_TIERS,
  ECOSYSTEM_ITEMS,
  PROGRAM_HERO_IMAGE,
  PROGRAM_WORKFLOW_IMAGE,
  PROGRAM_COMMUNITY_IMAGE,
  PROGRAM_PUBLISH_IMAGE,
} from '@/data/creatorProgram/content'

const sectionNav = SECTION_NAV
const audienceKeys = AUDIENCE_KEYS
const submitSteps = SUBMIT_STEPS
const monthlyRewardKeys = MONTHLY_REWARD_KEYS
const honorKeys = HONOR_KEYS
const showcaseColumnKeys = SHOWCASE_COLUMN_KEYS
const themeKeys = THEME_KEYS
const criteria = CRITERIA
const rightsKeys = RIGHTS_KEYS
const agreementKeys = AGREEMENT_KEYS
const phases = PHASES
const valuePillars = VALUE_PILLARS
const growthTiers = GROWTH_TIERS
const ecosystemItems = ECOSYSTEM_ITEMS
const heroImage = PROGRAM_HERO_IMAGE
const workflowImage = PROGRAM_WORKFLOW_IMAGE
const communityImage = PROGRAM_COMMUNITY_IMAGE
const publishImage = PROGRAM_PUBLISH_IMAGE
</script>

<style scoped>
.creator-program {
  --cp-purple: #5b4b8a;
  --cp-purple-deep: #3d2f62;
  --cp-accent: #8167a9;
  --cp-warm: #f5ebe0;
  --cp-text: #2c2a38;
  --cp-muted: #6b6578;
  background: #faf9fc;
  color: var(--cp-text);
  text-align: left;
  padding-bottom: 0;
}

/* Hero */
.cp-hero {
  background:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(255, 200, 180, 0.35), transparent),
    radial-gradient(ellipse 70% 50% at 90% 20%, rgba(129, 103, 169, 0.45), transparent),
    linear-gradient(145deg, #3d2f62 0%, #5b4b8a 45%, #7a6aab 100%);
  color: #fff;
  padding: 48px 20px 56px;
}

.cp-hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}

.cp-kicker {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.85;
  margin-bottom: 10px;
}

.cp-hero h1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  line-height: 1.2;
  margin-bottom: 12px;
  font-weight: 700;
}

.cp-slogan {
  font-size: clamp(1.05rem, 2.5vw, 1.35rem);
  font-weight: 600;
  color: #ffe8c8;
  margin-bottom: 16px;
  line-height: 1.5;
}

.cp-lead {
  font-size: 15px;
  line-height: 1.7;
  opacity: 0.92;
  max-width: 520px;
  margin-bottom: 24px;
}

.cp-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 28px;
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

.cp-btn--primary {
  background: #fff;
  color: var(--cp-purple-deep);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.cp-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

.cp-btn--ghost {
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.cp-btn--lg {
  padding: 14px 28px;
  font-size: 15px;
}

.cp-ecosystem {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cp-eco-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
  backdrop-filter: blur(8px);
}

.cp-eco-icon {
  font-size: 14px;
}

.cp-hero-visual {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.cp-hero-visual img {
  width: 100%;
  display: block;
}

/* Nav */
.cp-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  scrollbar-width: none;
}

.cp-nav-link {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--cp-muted);
  text-decoration: none;
  white-space: nowrap;
}

.cp-nav-link:hover {
  background: #f0ebf8;
  color: var(--cp-accent);
}

/* Sections */
.cp-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 56px 20px;
  scroll-margin-top: 56px;
}

.cp-section--alt {
  background: #fff;
  max-width: none;
  padding-left: calc((100vw - 1100px) / 2 + 20px);
  padding-right: calc((100vw - 1100px) / 2 + 20px);
}

.cp-section--dark {
  background: linear-gradient(160deg, #2a2044, #3d2f62);
  color: #fff;
  max-width: none;
  padding-left: calc((100vw - 1100px) / 2 + 20px);
  padding-right: calc((100vw - 1100px) / 2 + 20px);
}

.cp-section-head {
  margin-bottom: 32px;
  max-width: 720px;
}

.cp-section-head--light h2,
.cp-section-head--light p {
  color: #fff;
}

.cp-section-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cp-accent);
  margin-bottom: 10px;
}

.cp-section-tag--light {
  color: #ffe8c8;
}

.cp-section-head h2 {
  font-size: clamp(1.4rem, 3vw, 1.85rem);
  margin-bottom: 10px;
  color: var(--cp-text);
}

.cp-section-head p {
  color: var(--cp-muted);
  line-height: 1.65;
  font-size: 15px;
}

.cp-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
  margin-bottom: 36px;
}

.cp-prose h3 {
  font-size: 1.1rem;
  margin-bottom: 12px;
}

.cp-prose p {
  color: var(--cp-muted);
  line-height: 1.7;
  margin-bottom: 12px;
  font-size: 15px;
}

.cp-quote {
  margin: 20px 0 0;
  padding: 16px 20px;
  border-left: 4px solid var(--cp-accent);
  background: #f5f0fa;
  border-radius: 0 12px 12px 0;
  font-style: italic;
  color: var(--cp-purple-deep);
  line-height: 1.6;
}

.cp-visual-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 40px rgba(49, 35, 82, 0.1);
  background: #fff;
}

.cp-visual-card img {
  width: 100%;
  display: block;
}

.cp-visual-card p {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--cp-muted);
  margin: 0;
}

.cp-visual-card--compact {
  max-width: 480px;
  margin-top: 20px;
}

.cp-value-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.cp-value-card {
  padding: 22px;
  border-radius: 16px;
  background: linear-gradient(145deg, #fff, #f8f5fc);
  border: 1px solid #ece8f4;
}

.cp-value-card h4 {
  font-size: 15px;
  margin-bottom: 8px;
  color: var(--cp-purple-deep);
}

.cp-value-card p {
  font-size: 14px;
  color: var(--cp-muted);
  line-height: 1.6;
  margin: 0;
}

/* Audience */
.cp-audience-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.cp-audience-chip {
  padding: 10px 18px;
  border-radius: 12px;
  background: #f5f0fa;
  border: 1px solid #e8e0f4;
  font-size: 14px;
  font-weight: 500;
}

.cp-note {
  font-size: 14px;
  color: var(--cp-muted);
  margin: 0;
}

.cp-note--center {
  text-align: center;
  margin-top: 24px;
}

/* Steps */
.cp-steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cp-step-card {
  display: grid;
  grid-template-columns: auto 200px 1fr;
  gap: 20px;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ece8f4;
  box-shadow: 0 4px 20px rgba(49, 35, 82, 0.06);
}

.cp-step-num {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--cp-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.cp-step-shot {
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: #f0ebe3;
}

.cp-step-shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.cp-step-body h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.cp-step-body p {
  font-size: 14px;
  color: var(--cp-muted);
  line-height: 1.6;
  margin-bottom: 10px;
}

.cp-text-link {
  font-size: 13px;
  color: var(--cp-accent);
  text-decoration: none;
  font-weight: 600;
}

/* Rewards */
.cp-reward-block {
  margin-bottom: 36px;
}

.cp-reward-block h3 {
  font-size: 1.15rem;
  margin-bottom: 10px;
}

.cp-reward-intro {
  color: var(--cp-muted);
  margin-bottom: 16px;
  line-height: 1.6;
}

.cp-reward-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.cp-reward-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: #f8f5fc;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.cp-check {
  color: #52a86a;
  font-weight: 700;
  flex-shrink: 0;
}

.cp-honor-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cp-honor-chip {
  padding: 8px 14px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e0d8ec;
  font-size: 13px;
}

.cp-showcase-panel {
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f0fa, #fff8f0);
  border: 1px solid #ece8f4;
}

.cp-showcase-panel h3 {
  margin-bottom: 8px;
}

.cp-showcase-panel > p {
  color: var(--cp-muted);
  font-size: 14px;
  margin-bottom: 16px;
}

.cp-showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}

.cp-showcase-item {
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  font-size: 13px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Themes */
.cp-theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.cp-theme-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ece8f4;
  font-size: 14px;
  transition: border-color 0.2s, transform 0.2s;
}

.cp-theme-card:hover {
  border-color: var(--cp-accent);
  transform: translateY(-2px);
}

.cp-theme-icon {
  font-size: 18px;
}

/* Criteria */
.cp-criteria-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 640px;
}

.cp-criteria-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cp-criteria-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
}

.cp-criteria-label strong {
  color: var(--cp-accent);
}

.cp-criteria-bar {
  height: 8px;
  background: #ece8f4;
  border-radius: 999px;
  overflow: hidden;
}

.cp-criteria-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cp-accent), #b89fd4);
  border-radius: 999px;
}

.cp-criteria-desc {
  font-size: 13px;
  color: var(--cp-muted);
  margin: 0;
}

/* Rights */
.cp-rights-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.cp-rights-list li {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ece8f4;
  font-size: 14px;
  line-height: 1.55;
}

.cp-rights-icon {
  color: var(--cp-accent);
  flex-shrink: 0;
}

/* Agreement */
.cp-agreement-list {
  margin: 0 0 32px;
  padding-left: 20px;
  line-height: 1.75;
  font-size: 14px;
  opacity: 0.95;
}

.cp-agreement-list li {
  margin-bottom: 10px;
}

.cp-checklist {
  padding: 24px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.cp-checklist h3 {
  font-size: 1rem;
  margin-bottom: 14px;
  color: #ffe8c8;
}

.cp-checklist ul {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.9;
}

/* Timeline */
.cp-timeline {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.cp-phase-card {
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ece8f4;
  box-shadow: 0 4px 20px rgba(49, 35, 82, 0.06);
}

.cp-phase-icon {
  font-size: 28px;
  margin-bottom: 12px;
}

.cp-phase-card h3 {
  font-size: 1.05rem;
  margin-bottom: 8px;
}

.cp-phase-goal {
  font-size: 13px;
  color: var(--cp-accent);
  font-weight: 600;
  margin-bottom: 12px;
}

.cp-phase-card ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--cp-muted);
  line-height: 1.65;
}

/* Growth table */
.cp-tier-table-wrap {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid #ece8f4;
  background: #fff;
  box-shadow: 0 4px 24px rgba(49, 35, 82, 0.06);
}

.cp-tier-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.cp-tier-table th {
  text-align: left;
  padding: 14px 18px;
  background: #f5f0fa;
  color: var(--cp-purple-deep);
  font-weight: 600;
  border-bottom: 1px solid #ece8f4;
}

.cp-tier-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f0ecf6;
  vertical-align: top;
  line-height: 1.55;
}

.cp-tier-table tr:last-child td {
  border-bottom: none;
}

.cp-tier-icon {
  margin-right: 6px;
}

/* CTA */
.cp-cta {
  text-align: center;
  padding: 64px 20px 80px;
  background:
    radial-gradient(ellipse 60% 80% at 50% 100%, rgba(129, 103, 169, 0.2), transparent),
    linear-gradient(180deg, #faf9fc, #f0ebf8);
}

.cp-cta h2 {
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  margin-bottom: 12px;
  color: var(--cp-purple-deep);
}

.cp-cta p {
  color: var(--cp-muted);
  max-width: 560px;
  margin: 0 auto 28px;
  line-height: 1.65;
}

.cp-cta .cp-btn--primary {
  background: var(--cp-accent);
  color: #fff;
}

.cp-cta .cp-btn--ghost {
  border-color: var(--cp-accent);
  color: var(--cp-accent);
  background: #fff;
}

@media (max-width: 900px) {
  .cp-hero-inner,
  .cp-split,
  .cp-value-grid,
  .cp-timeline {
    grid-template-columns: 1fr;
  }

  .cp-step-card {
    grid-template-columns: 1fr;
  }

  .cp-step-num {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .cp-section--alt,
  .cp-section--dark {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 640px) {
  .cp-hero {
    padding: 32px 16px 40px;
  }

  .cp-section {
    padding: 40px 16px;
  }

  .cp-value-grid {
    grid-template-columns: 1fr;
  }
}
</style>
