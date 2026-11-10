<template>
  <div class="about-page">
    <div class="about-inner">
      <button type="button" class="about-back" @click="goBack">
        ‹ {{ $t('aboutUs.back') }}
      </button>

      <div class="about-layout">
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
      <aside class="community" aria-labelledby="community-title">
        <img class="community-illustration" src="@/assets/images/about-storybook.png" alt="" aria-hidden="true">
        <h2 id="community-title">{{ isEnglish ? 'Find us' : '找到我们' }}</h2>
        <p class="community-intro">{{ isEnglish ? 'Stay connected with KidStory for updates and creative inspiration.' : '关注 KidStory，发现更多创作灵感与最新动态。' }}</p>
        <div class="community-grid">
          <div v-for="channel in channels" :key="channel.zh" class="community-channel">
            <div class="qr-placeholder"><span>{{ isEnglish ? 'Coming soon' : '待添加' }}</span></div>
            <h3>{{ isEnglish ? channel.en : channel.zh }}</h3>
          </div>
        </div>
      </aside>
      </div>
    </div>
  </div>
</template>

<script>
import { OPEN_SOURCE_CREDITS } from '@/data/openSourceCredits'

export default {
  name: 'AboutUsPage',
  computed: {
    isEnglish() {
      return this.$i18n?.locale === 'en'
    },
    channels() {
      return [
        { zh: '公众号', en: 'WeChat' },
        { zh: '小红书', en: 'Xiaohongshu' },
        { zh: '小程序', en: 'Mini Program' },
      ]
    },
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
  background: #fffcf8;
  box-sizing: border-box;
}

.about-inner {
  max-width: 1200px;
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

.about-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 32px;
  align-items: start;
}

.about-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 20px 28px;
  border: 1px solid #eee6e1;
  box-shadow: 0 8px 30px rgba(76, 45, 38, 0.04);
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
.community {
  position: relative;
  overflow: hidden;
  padding: 34px;
  border-radius: 24px;
  background: #f4f1e7;
  text-align: left;
}
.community-illustration { position: absolute; top: -18px; right: 0; width: 180px; height: 150px; object-fit: contain; pointer-events: none; }
.community h2 { position: relative; margin: 0; color: #302028; font-size: 28px; font-weight: 750; }
.community-intro { position: relative; max-width: 70%; margin: 12px 0 28px; color: #716477; font-size: 14px; line-height: 1.7; }
.community-grid { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.community-channel { min-width: 0; text-align: center; }
.qr-placeholder { display: grid; place-items: center; width: 100%; aspect-ratio: 1; box-sizing: border-box; border: 1px dashed #c8b4d9; border-radius: 14px; background: rgba(255, 255, 255, .65); color: #806b91; font-size: 13px; }
.community-channel h3 { margin: 14px 0 0; color: #3f3041; font-size: 14px; font-weight: 700; }
@media (max-width: 800px) {
  .about-layout { grid-template-columns: 1fr; gap: 20px; }
  .community { padding: 24px; }
}
@media (max-width: 420px) {
  .community-grid { gap: 8px; }
  .community { padding: 20px; }
  .community-illustration { width: 125px; height: 110px; }
  .community-channel h3 { font-size: 12px; }
}
</style>
