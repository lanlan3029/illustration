<template>
  <div class="guides-page">
    <header class="guides-hero">
      <p class="guides-kicker">{{ $t('guides.hero.kicker') }}</p>
      <h1>{{ $t('guides.hero.title') }}</h1>
      <p class="guides-lead">{{ $t('guides.hero.subtitle') }}</p>
      <nav class="guides-nav">
        <a v-for="item in navItems" :key="item.id" :href="`#${item.id}`" class="guides-nav-link">
          {{ $t(item.labelKey) }}
        </a>
      </nav>
      <div class="hero-shot">
        <img :src="overviewImage" :alt="$t('guides.features.title')" loading="lazy" />
      </div>
    </header>

    <!-- 功能模块 -->
    <section id="features" class="guides-section">
      <div class="section-head">
        <h2>{{ $t('guides.features.title') }}</h2>
        <p>{{ $t('guides.features.subtitle') }}</p>
      </div>
      <div class="feature-grid">
        <article v-for="mod in featureModules" :key="mod.id" class="feature-card">
          <div class="feature-shot">
            <img :src="mod.image" :alt="$t(`guides.features.${mod.id}.title`)" loading="lazy" />
          </div>
          <div class="feature-body">
            <h3>{{ $t(`guides.features.${mod.id}.title`) }}</h3>
            <p>{{ $t(`guides.features.${mod.id}.desc`) }}</p>
            <router-link :to="mod.route" class="feature-link">
              {{ $t('guides.features.tryIt') }} →
            </router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- Before / After -->
    <section id="cases" class="guides-section guides-section--alt">
      <div class="section-head">
        <h2>{{ $t('guides.cases.title') }}</h2>
        <p>{{ $t('guides.cases.subtitle') }}</p>
      </div>
      <div class="cases-grid">
        <article v-for="item in beforeAfterCases" :key="item.id" class="case-card">
          <h3>{{ $t(`guides.cases.${item.id}.title`) }}</h3>
          <p class="case-desc">{{ $t(`guides.cases.${item.id}.summary`) }}</p>
          <div class="compare">
            <div class="compare-col">
              <span class="compare-label">{{ $t('guides.cases.before') }}</span>
              <div class="compare-frame compare-frame--ui">
                <img :src="item.beforeImage" :alt="$t('guides.cases.before')" loading="lazy" />
              </div>
              <p>{{ $t(`guides.cases.${item.id}.beforeDesc`) }}</p>
            </div>
            <div class="compare-arrow" aria-hidden="true">→</div>
            <div class="compare-col">
              <span class="compare-label compare-label--after">{{ $t('guides.cases.after') }}</span>
              <div class="compare-frame compare-frame--ui compare-frame--after">
                <img :src="item.afterImage" :alt="$t('guides.cases.after')" loading="lazy" />
              </div>
              <p>{{ $t(`guides.cases.${item.id}.afterDesc`) }}</p>
            </div>
          </div>
          <div class="case-tools">
            <router-link
              v-for="(toolKey, idx) in item.toolKeys"
              :key="idx"
              :to="toolRoute(item.id, idx)"
              class="case-tool-link"
            >
              {{ $t(toolKey) }}
            </router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- 工作流教程 -->
    <section id="workflows" class="guides-section">
      <div class="section-head">
        <h2>{{ $t('guides.workflows.title') }}</h2>
        <p>{{ $t('guides.workflows.subtitle') }}</p>
      </div>
      <div class="workflow-grid">
        <article v-for="flow in workflowGuides" :key="flow.id" class="workflow-card">
          <div class="workflow-icon">{{ flow.icon }}</div>
          <h3>{{ $t(`guides.workflows.${flow.id}.title`) }}</h3>
          <p class="workflow-intro">{{ $t(`guides.workflows.${flow.id}.intro`) }}</p>
          <div v-if="flow.screenshots?.length" class="workflow-shots">
            <img
              v-for="(shot, idx) in flow.screenshots"
              :key="idx"
              :src="shot"
              :alt="$t(`guides.workflows.${flow.id}.title`)"
              loading="lazy"
            />
          </div>
          <ol class="workflow-steps">
            <li v-for="n in flow.stepCount" :key="n">
              {{ $t(`guides.workflows.${flow.id}.steps.${n}`) }}
            </li>
          </ol>
          <div class="workflow-links">
            <router-link v-for="link in flow.links" :key="link.to" :to="link.to" class="workflow-link">
              {{ $t(link.labelKey) }} →
            </router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- 风格库说明 -->
    <section id="styles" class="guides-section guides-section--alt">
      <div class="section-head">
        <h2>{{ $t('guides.styles.title') }}</h2>
        <p>{{ $t('guides.styles.subtitle') }}</p>
      </div>
      <div class="style-demo-shot">
        <img :src="overviewImage" :alt="$t('guides.styles.styleDemoAlt')" loading="lazy" />
        <p class="style-demo-caption">{{ $t('guides.styles.styleDemoCaption') }}</p>
      </div>

      <div class="category-grid">
        <article v-for="cat in styleCategoryGuides" :key="cat.id" class="category-card">
          <h3>{{ $t(`guides.styleCategories.${cat.id}.name`) }}</h3>
          <p>{{ $t(`guides.styleCategories.${cat.id}.summary`) }}</p>
          <p class="category-topics"><strong>{{ $t('guides.styles.topicsLabel') }}</strong>{{ $t(`guides.styleCategories.${cat.id}.topics`) }}</p>
          <p class="category-tips"><strong>{{ $t('guides.styles.editTipsLabel') }}</strong>{{ $t(`guides.styleCategories.${cat.id}.editTips`) }}</p>
          <div class="category-previews">
            <img
              v-for="preview in categoryPreviews(cat.id)"
              :key="preview.key"
              :src="preview.image"
              :alt="preview.key"
              loading="lazy"
            />
          </div>
        </article>
      </div>

      <h3 class="featured-title">{{ $t('guides.styles.featuredTitle') }}</h3>
      <div class="style-grid">
        <article v-for="style in styleGuideCards" :key="style.key" class="style-card">
          <img :src="style.image" :alt="style.artStyle" class="style-thumb" loading="lazy" />
          <div class="style-body">
            <span class="style-category">{{ style.categoryLabel }}</span>
            <h4>{{ style.artStyle }}</h4>
            <p class="style-topics"><strong>{{ $t('guides.styles.topicsLabel') }}</strong>{{ $t(`guides.featuredStyles.${style.key}.topics`) }}</p>
            <p class="style-tips"><strong>{{ $t('guides.styles.editTipsLabel') }}</strong>{{ $t(`guides.featuredStyles.${style.key}.editTips`) }}</p>
            <router-link to="/creation-studio/illustration/ai" class="style-try">
              {{ $t('guides.styles.tryStyle') }} →
            </router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- 联系我们 -->
    <section id="contact" class="guides-section guides-section--contact">
      <div class="section-head">
        <h2>{{ $t('guides.contact.title') }}</h2>
      </div>
      <div class="contact-grid">
        <div class="contact-left">
          <el-image class="contact-qr" :src="wechatQr" fit="contain" />
          <h3>{{ $t('guides.contact.wechatTitle') }}</h3>
          <p>{{ $t('guides.contact.wechatDesc') }}</p>
          <p class="contact-email">{{ $t('guides.contact.email') }}</p>
        </div>
        <div class="contact-right">
          <h3>{{ $t('guides.contact.inspirationTitle') }}</h3>
          <ul class="inspiration-list">
            <li v-for="item in inspirationLinks" :key="item.name">
              <button type="button" class="inspiration-btn" @click="openUrl(item.url)">
                <el-image :src="item.src" fit="contain" />
              </button>
            </li>
          </ul>
          <p class="legal">{{ $t('guides.contact.statement1') }}</p>
          <p class="legal">{{ $t('guides.contact.statement2') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  GUIDE_SCREENSHOTS,
  FEATURE_MODULES,
  BEFORE_AFTER_CASES,
  WORKFLOW_GUIDES,
  STYLE_CATEGORY_GUIDES,
  getStyleGuideCards,
  getCategoryStylePreviews,
  INSPIRATION_LINKS,
  WECHAT_QR,
} from '@/data/guides/guideContent'

const { t } = useI18n()

const navItems = [
  { id: 'features', labelKey: 'guides.nav.features' },
  { id: 'cases', labelKey: 'guides.nav.cases' },
  { id: 'workflows', labelKey: 'guides.nav.workflows' },
  { id: 'styles', labelKey: 'guides.nav.styles' },
  { id: 'contact', labelKey: 'guides.nav.contact' },
]

const overviewImage = GUIDE_SCREENSHOTS.homeOverview
const featureModules = FEATURE_MODULES
const beforeAfterCases = BEFORE_AFTER_CASES
const workflowGuides = WORKFLOW_GUIDES
const styleCategoryGuides = STYLE_CATEGORY_GUIDES
const inspirationLinks = INSPIRATION_LINKS
const wechatQr = WECHAT_QR

const styleGuideCards = computed(() => getStyleGuideCards(t))

function categoryPreviews(categoryId) {
  return getCategoryStylePreviews(categoryId, 4)
}

function toolRoute(caseId, idx) {
  const map = {
    aiIllustration: ['/creation-studio/illustration/ai', '/creation-studio/illustration/mine'],
    editorLayout: ['/creation-studio/illustration/mine', '/editorpro'],
    bookPrint: ['/creation-studio/book/compose', '/print-book-layout'],
  }
  return map[caseId]?.[idx] || '/editorpro'
}

function openUrl(url) {
  if (url) window.open(url, '_blank', 'noopener')
}
</script>

<style scoped>
.guides-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  text-align: left;
}

.guides-hero {
  text-align: center;
  padding: 32px 12px 24px;
}

.guides-kicker {
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8167a9;
  margin-bottom: 8px;
}

.guides-hero h1 {
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  color: #2c3e50;
  margin-bottom: 12px;
}

.guides-lead {
  color: #5a6578;
  max-width: 680px;
  margin: 0 auto 24px;
  line-height: 1.65;
}

.guides-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 28px;
}

.guides-nav-link {
  padding: 8px 16px;
  border-radius: 999px;
  background: #f0f4fa;
  color: #374957;
  text-decoration: none;
  font-size: 14px;
}

.guides-nav-link:hover {
  background: #e3edf9;
  color: #2d8cf0;
}

.hero-shot {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e8eef5;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

.hero-shot img {
  width: 100%;
  display: block;
}

.guides-section {
  margin-bottom: 48px;
  scroll-margin-top: 72px;
}

.guides-section--alt {
  background: #f8fafc;
  margin-left: -16px;
  margin-right: -16px;
  padding: 32px 16px;
  border-radius: 16px;
}

.section-head {
  margin-bottom: 24px;
}

.section-head h2 {
  font-size: 1.45rem;
  color: #2c3e50;
  margin-bottom: 8px;
}

.section-head p {
  color: #667;
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card {
  background: #fff;
  border: 1px solid #eef2f8;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.feature-shot {
  background: #f5f6fa;
  border-bottom: 1px solid #eef2f8;
}

.feature-shot img {
  width: 100%;
  display: block;
}

.feature-body {
  padding: 18px 20px 20px;
}

.feature-body h3 {
  font-size: 1.05rem;
  color: #2c3e50;
  margin-bottom: 8px;
}

.feature-body p {
  font-size: 14px;
  color: #667;
  line-height: 1.55;
  margin-bottom: 12px;
}

.feature-link {
  font-size: 13px;
  color: #2d8cf0;
  text-decoration: none;
}

.cases-grid {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.case-card {
  background: #fff;
  border: 1px solid #eef2f8;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.case-card h3 {
  font-size: 1.15rem;
  margin-bottom: 8px;
  color: #2c3e50;
}

.case-desc {
  color: #667;
  margin-bottom: 20px;
  line-height: 1.55;
}

.compare {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: start;
}

.compare-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
}

.compare-label--after {
  color: #8167a9;
}

.compare-frame {
  border-radius: 12px;
  overflow: hidden;
  background: #f5f6fa;
  border: 1px solid #e8eef5;
}

.compare-frame--ui {
  aspect-ratio: 16 / 10;
}

.compare-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

.compare-frame--after {
  border-color: rgba(129, 103, 169, 0.35);
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.08);
}

.compare-col p {
  font-size: 13px;
  color: #666;
  margin-top: 10px;
  line-height: 1.5;
}

.compare-arrow {
  align-self: center;
  font-size: 24px;
  color: #8167a9;
  padding-top: 40px;
}

.case-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.case-tool-link {
  padding: 6px 14px;
  border-radius: 8px;
  background: #f0f4fa;
  color: #2d8cf0;
  text-decoration: none;
  font-size: 13px;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.workflow-card {
  background: #fff;
  border-radius: 14px;
  padding: 22px;
  border: 1px solid #e8eef5;
}

.workflow-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.workflow-card h3 {
  font-size: 1.05rem;
  margin-bottom: 8px;
  color: #2c3e50;
}

.workflow-intro {
  font-size: 14px;
  color: #667;
  margin-bottom: 14px;
  line-height: 1.55;
}

.workflow-shots {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.workflow-shots img {
  height: 72px;
  width: auto;
  border-radius: 8px;
  border: 1px solid #e8eef5;
  flex-shrink: 0;
}

.workflow-steps {
  margin: 0 0 16px;
  padding-left: 20px;
  font-size: 14px;
  color: #444;
  line-height: 1.65;
}

.workflow-steps li {
  margin-bottom: 6px;
}

.workflow-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.workflow-link {
  font-size: 13px;
  color: #2d8cf0;
  text-decoration: none;
}

.style-demo-shot {
  margin-bottom: 28px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e8eef5;
}

.style-demo-shot img {
  width: 100%;
  display: block;
}

.style-demo-caption {
  padding: 12px 16px;
  font-size: 13px;
  color: #667;
  background: #fff;
  margin: 0;
  line-height: 1.55;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  margin-bottom: 36px;
}

.category-card {
  background: #fafbfc;
  border: 1px solid #eef2f8;
  border-radius: 14px;
  padding: 20px;
}

.category-card h3 {
  margin-bottom: 8px;
  color: #2c3e50;
}

.category-card p {
  font-size: 14px;
  color: #555;
  line-height: 1.55;
  margin-bottom: 10px;
}

.category-topics,
.category-tips {
  font-size: 13px;
}

.category-previews {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.category-previews img {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
}

.featured-title {
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: #374957;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

.style-card {
  display: flex;
  gap: 14px;
  background: #fff;
  border: 1px solid #eef2f8;
  border-radius: 14px;
  padding: 14px;
}

.style-thumb {
  width: 88px;
  height: 88px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.style-category {
  font-size: 11px;
  color: #8167a9;
  background: #f3eef8;
  padding: 2px 8px;
  border-radius: 4px;
}

.style-body h4 {
  font-size: 15px;
  margin: 6px 0;
  color: #2c3e50;
}

.style-topics,
.style-tips {
  font-size: 12px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 6px;
}

.style-try {
  font-size: 12px;
  color: #2d8cf0;
  text-decoration: none;
}

.guides-section--contact {
  background: #f5f6fa;
  margin-left: -16px;
  margin-right: -16px;
  padding: 32px 16px;
  border-radius: 16px;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.contact-left {
  text-align: center;
}

.contact-qr {
  width: 220px;
  height: 220px;
  margin: 0 auto 16px;
}

.contact-left h3,
.contact-right h3 {
  color: #374957;
  margin-bottom: 8px;
}

.contact-left p {
  color: #667;
  font-size: 14px;
}

.contact-email {
  margin-top: 12px;
  font-size: 13px;
  color: #8167a9;
}

.inspiration-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.inspiration-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.inspiration-btn :deep(.el-image) {
  width: 120px;
  height: 48px;
}

.legal {
  font-size: 12px;
  color: #888;
  line-height: 1.6;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .compare {
    grid-template-columns: 1fr;
  }

  .compare-arrow {
    display: none;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .style-card {
    flex-direction: column;
  }

  .style-thumb {
    width: 100%;
    height: 140px;
  }
}
</style>
