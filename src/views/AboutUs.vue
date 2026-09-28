<template>
  <div class="about-page">
    <div class="about-inner">
      <button type="button" class="about-back" @click="goBack">
        ‹ {{ $t('aboutUs.back') }}
      </button>

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
              <div class="credit-row">
                <a
                  :href="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="credit-link"
                >{{ item.name }}</a>
                <span v-if="item.license" class="credit-license">{{ item.license }}</span>
              </div>
              <p class="credit-desc">{{ creditDescription(item) }}</p>
            </li>
          </ul>
        </section>

        <p class="about-footnote">{{ $t('aboutUs.footnote') }}</p>
      </div>
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
    goBack() {
      if (window.history.length > 1) {
        this.$router.back()
      } else {
        this.$router.push('/user/profile')
      }
    },
  },
}
</script>

<style scoped>
.about-page {
  min-height: calc(100vh - 120px);
  padding: 24px 16px 48px;
  background: #f5f6fa;
  box-sizing: border-box;
}

.about-inner {
  max-width: 560px;
  margin: 0 auto;
}

.about-back {
  display: inline-flex;
  align-items: center;
  margin: 0 0 12px 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  color: #909399;
  cursor: pointer;
}

.about-back:hover {
  color: #8167a9;
}

.about-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 20px 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-align: left;
}

.about-head h1 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.about-lead {
  margin: 0 0 20px;
  font-size: 12px;
  line-height: 1.65;
  color: #909399;
}

.about-section-title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #b1b3b8;
  text-transform: none;
}

.credit-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.credit-item {
  padding: 14px 0;
  border-top: 1px solid #f0f2f5;
}

.credit-item:first-child {
  border-top: none;
  padding-top: 4px;
}

.credit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 8px;
}

.credit-link {
  font-size: 12px;
  color: #606266;
  text-decoration: none;
  word-break: break-all;
}

.credit-link:hover {
  color: #8167a9;
  text-decoration: underline;
}

.credit-license {
  font-size: 10px;
  color: #c0c4cc;
  padding: 1px 6px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.credit-desc {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
}

.about-footnote {
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px dashed #ebeef5;
  font-size: 11px;
  line-height: 1.65;
  color: #c0c4cc;
}
</style>
