<template>
  <div class="about-page">
    <div class="about-card">
      <header class="about-head">
        <h1>{{ $t('aboutUs.title') }}</h1>
        <p class="about-lead">{{ $t('aboutUs.lead') }}</p>
      </header>

      <section class="about-section" aria-labelledby="about-credits-heading">
        <h2 id="about-credits-heading" class="about-section-title">
          {{ $t('aboutUs.creditsHeading') }}
        </h2>
        <ul class="credit-list">
          <li v-for="item in credits" :key="item.id" class="credit-item">
            <a
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="credit-link"
            >{{ item.name }}</a>
            <span v-if="item.license" class="credit-license">{{ item.license }}</span>
            <p class="credit-desc">{{ creditDescription(item) }}</p>
          </li>
        </ul>
      </section>

      <p class="about-footnote">{{ $t('aboutUs.footnote') }}</p>
    </div>
  </div>
</template>

<script>
import { OPEN_SOURCE_CREDITS } from '@/data/openSourceCredits'

export default {
  name: 'AboutUsPage',
  computed: {
    credits() {
      return OPEN_SOURCE_CREDITS
    },
  },
  methods: {
    creditDescription(item) {
      const loc = this.$i18n?.locale === 'en' ? 'en' : 'zh'
      return loc === 'en' ? (item.descriptionEn || item.descriptionZh) : item.descriptionZh
    },
  },
}
</script>

<style scoped>
.about-page {
  min-height: 70vh;
  padding: 32px 16px 48px;
  background: #f5f6fa;
  box-sizing: border-box;
}

.about-card {
  max-width: 640px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 28px 22px 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.about-head h1 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.about-lead {
  margin: 0 0 24px;
  font-size: 13px;
  line-height: 1.6;
  color: #909399;
}

.about-section-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: #909399;
}

.credit-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.credit-item {
  padding: 12px 0;
  border-top: 1px solid #f0f2f5;
}

.credit-item:first-child {
  border-top: none;
  padding-top: 0;
}

.credit-link {
  font-size: 13px;
  color: #606266;
  text-decoration: none;
}

.credit-link:hover {
  color: #8167a9;
  text-decoration: underline;
}

.credit-license {
  margin-left: 8px;
  font-size: 11px;
  color: #c0c4cc;
}

.credit-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: #909399;
}

.about-footnote {
  margin: 24px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: #c0c4cc;
}
</style>
