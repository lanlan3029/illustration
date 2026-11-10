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
        <svg class="community-doodle" viewBox="0 0 90 70" fill="none" aria-hidden="true">
          <path d="M19 52c9-18 26-22 43-20M49 32c-4-8-3-14 3-19 6 6 7 12 2 19M38 39c-8 0-13-3-15-9 8-3 14-1 18 6M60 32c2-7 7-11 14-10 0 7-4 12-12 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 18v8m-4-4h8M76 48v6m-3-3h6" stroke="#d8ae57" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h2 id="community-title">{{ isEnglish ? 'Find us' : '找到我们' }}</h2>
        <p class="community-intro">{{ isEnglish ? 'Stay connected with KidStory for updates and creative inspiration.' : '关注 KidStory，发现更多创作灵感与最新动态。' }}</p>
        <div class="community-grid">
          <div v-for="channel in channels" :key="channel.zh" class="community-channel">
            <div class="qr-placeholder">
              <span class="qr-corners" aria-hidden="true"></span>
              <span>{{ isEnglish ? 'Coming soon' : '待添加' }}</span>
            </div>
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
.about-page { min-height: calc(100vh - 120px); box-sizing: border-box; padding: 42px 24px 80px; background: #fdfaf7; color: #382c30; }
.about-inner { max-width: 1180px; margin: 0 auto; text-align: left; }
.about-back { display: inline-flex; align-items: center; min-height: 36px; margin: 0 0 28px; padding: 0; border: 0; background: transparent; color: #756488; font-size: 14px; cursor: pointer; }
.about-back:hover { color: #513c68; }
.about-back:focus-visible, .credit-link:focus-visible { outline: 2px solid #8566a5; outline-offset: 4px; }
.about-layout { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: clamp(36px, 6vw, 88px); align-items: start; }
.about-card { padding: 16px 0 0; min-width: 0; }
.about-head h1 { margin: 0 0 18px; color: #37272b; font-size: clamp(30px, 3vw, 42px); line-height: 1.2; letter-spacing: -.03em; }
.about-lead { max-width: 440px; margin: 0; color: #746a6d; font-size: 15px; line-height: 1.8; }
.about-section { margin-top: 45px; }
.about-section-title { display: flex; align-items: center; gap: 14px; margin: 0 0 10px; color: #5b4b60; font-size: 14px; font-weight: 700; }
.about-section-title::after { content: ''; height: 1px; flex: 1; background: #e6dce9; }
.credit-list { list-style: none; margin: 0; padding: 0; }
.credit-item { padding: 20px 0; border-bottom: 1px solid #eee6e8; }
.credit-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.credit-link { color: #483652; font-size: 15px; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
.credit-link::after { content: ' ↗'; color: #a38ab3; }
.credit-link:hover { color: #79569b; text-decoration: underline; }
.credit-license { padding: 2px 7px; border-radius: 4px; background: #f1ebf4; color: #796681; font-size: 11px; }
.credit-desc { margin: 9px 0 0; color: #7a7073; font-size: 13px; line-height: 1.7; }
.about-footnote { margin: 24px 0 0; color: #91868b; font-size: 12px; line-height: 1.7; }
.community { position: relative; overflow: hidden; min-width: 0; padding: 38px; border-radius: 28px; background: #f1eaf4; }
.community-doodle { position: absolute; top: 25px; right: 32px; width: 85px; height: 66px; color: #9482a1; }
.community h2 { margin: 0 110px 12px 0; color: #382a32; font-size: 28px; line-height: 1.3; }
.community-intro { max-width: 390px; margin: 0 85px 30px 0; color: #75687a; font-size: 14px; line-height: 1.75; }
.community-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 24px; border-radius: 20px; background: rgba(255, 255, 255, .62); }
.community-channel { min-width: 0; text-align: center; }
.qr-placeholder { display: flex; position: relative; flex-direction: column; justify-content: center; align-items: center; gap: 12px; box-sizing: border-box; width: 100%; aspect-ratio: 1; border: 1px dashed #cdbdd6; border-radius: 10px; background: #fbf9fb; color: #8c7997; font-size: 12px; }
.qr-corners { display: block; width: 24px; height: 24px; opacity: .7; background: linear-gradient(#a18daf, #a18daf) left top / 7px 2px no-repeat, linear-gradient(#a18daf, #a18daf) left top / 2px 7px no-repeat, linear-gradient(#a18daf, #a18daf) right top / 7px 2px no-repeat, linear-gradient(#a18daf, #a18daf) right top / 2px 7px no-repeat, linear-gradient(#a18daf, #a18daf) left bottom / 7px 2px no-repeat, linear-gradient(#a18daf, #a18daf) left bottom / 2px 7px no-repeat, linear-gradient(#a18daf, #a18daf) right bottom / 7px 2px no-repeat, linear-gradient(#a18daf, #a18daf) right bottom / 2px 7px no-repeat; }
.community-channel h3 { margin: 15px 0 0; color: #59485e; font-size: 13px; line-height: 1.4; font-weight: 700; overflow-wrap: anywhere; }
@media (max-width: 800px) { .about-page { padding: 24px 20px 56px; } .about-back { margin-bottom: 16px; } .about-layout { grid-template-columns: 1fr; gap: 32px; } .about-card { padding-top: 0; } .about-section { margin-top: 28px; } }
@media (max-width: 480px) { .community { padding: 26px 20px; border-radius: 20px; } .community-doodle { top: 19px; right: 18px; width: 64px; } .community h2 { margin-right: 70px; font-size: 24px; } .community-intro { margin-right: 55px; } .community-grid { gap: 8px; padding: 14px; } .qr-placeholder { gap: 6px; font-size: 11px; } .community-channel h3 { font-size: 12px; } }
</style>
