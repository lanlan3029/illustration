<template>
  <div class="moment-page">
    <MuseumSceneBackground />

    <button
      type="button"
      class="moment-museum-entry"
      :aria-label="$t('childhoodMoments.museumEnterHint')"
      @click="goToGallery"
    >
      <span class="moment-museum-entry__veil" />
      <span class="moment-museum-entry__content">
        <span class="moment-museum-entry__icon">→</span>
        <span class="moment-museum-entry__text">{{ $t('childhoodMoments.museumEnterHint') }}</span>
      </span>
    </button>

    <div class="moment-body">
      <nav class="moment-nav">
        <router-link to="/childhood/gallery" class="moment-nav__link">
          {{ $t('childhoodMoments.viewWall') }}
        </router-link>
      </nav>

      <section class="moment-hero">
        <div class="moment-hero__copy">
          <p class="moment-kicker">{{ $t('childhoodMoments.eyebrow') }}</p>
          <h1 class="moment-title">
            <span>{{ $t('childhoodMoments.titleLine1') }}</span>
            <span>{{ $t('childhoodMoments.titleLine2') }}</span>
          </h1>
          <p class="moment-lead">{{ $t('childhoodMoments.lead') }}</p>
          <p class="moment-tagline">{{ $t('childhoodMoments.tagline') }}</p>
        </div>
      </section>

    <section class="moment-workspace">
      <div class="moment-workspace__grid">
        <div class="moment-preview-col">
          <PolaroidFrame
            variant="minimal"
            :caption="polaroidCaption"
            :rotate="0"
            :revealed="!!generatedImageUrl && !generating"
            :developing="justGenerated"
          >
            <div v-if="generating" class="moment-generating">
              <span class="moment-generating__line" />
              <p>{{ $t('childhoodMoments.developing') }}</p>
            </div>
            <el-image
              v-else-if="generatedImageUrl"
              :src="generatedImageUrl"
              fit="cover"
              class="moment-result-image"
            >
              <template #error>
                <div class="moment-image-fallback">
                  <i class="el-icon-picture-outline" />
                </div>
              </template>
            </el-image>
            <div v-else class="moment-empty">
              <p>{{ $t('childhoodMoments.emptyHint') }}</p>
            </div>
          </PolaroidFrame>

          <div v-if="generatedImageUrl && !generating" class="moment-actions">
            <button type="button" class="moment-pill moment-pill--solid" :disabled="collecting" @click="collectIllustration">
              {{ collecting ? $t('childhoodMoments.saving') : $t('childhoodMoments.stickToWall') }}
            </button>
            <button type="button" class="moment-pill" :disabled="downloading" @click="downloadIllustration">
              {{ $t('childhoodMoments.download') }}
            </button>
            <button type="button" class="moment-text-btn" @click="clearGeneratedImage">
              {{ $t('childhoodMoments.clear') }}
            </button>
          </div>
        </div>

        <div class="moment-form-col">
          <label class="moment-label" for="moment-scene">
            {{ $t('childhoodMoments.sceneLabel') }}
          </label>
          <textarea
            id="moment-scene"
            v-model="subjectScene"
            class="moment-textarea"
            rows="5"
            :placeholder="$t('childhoodMoments.scenePlaceholder')"
          />
          <button
            type="button"
            class="moment-pill moment-pill--solid moment-pill--wide"
            :disabled="!subjectScene.trim() || generating"
            @click="generateIllustration"
          >
            {{ generating ? $t('childhoodMoments.generating') : $t('childhoodMoments.generate') }}
          </button>
        </div>
      </div>
    </section>

    <section v-if="recentItems.length" class="moment-recent">
      <div class="moment-recent__head">
        <h2>{{ $t('childhoodMoments.recentWall') }}</h2>
        <router-link to="/childhood/gallery">{{ $t('childhoodMoments.seeAll') }}</router-link>
      </div>
      <div class="moment-recent__grid">
        <button
          v-for="(item, index) in recentItems"
          :key="item._id || index"
          type="button"
          class="moment-recent__thumb"
          @click="previewRecent(item)"
        >
          <img :src="getImageUrl(item)" alt="" loading="lazy" />
          <span>{{ item.title || $t('childhoodMoments.polaroidCaptionDefault') }}</span>
        </button>
      </div>
    </section>

    <el-dialog
      v-model="previewVisible"
      :title="previewItem?.title || $t('childhoodMoments.previewTitle')"
      width="90%"
      class="moment-preview-dialog"
    >
      <el-image
        v-if="previewItem"
        :src="getImageUrl(previewItem)"
        fit="contain"
        class="moment-preview-image"
      />
    </el-dialog>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import PolaroidFrame from '@/components/childhood/PolaroidFrame.vue'
import MuseumSceneBackground from '@/components/childhood/MuseumSceneBackground.vue'
import submitImage from '@/assets/images/submit.webp'
import { postCreateCharacter, isCreateCharacterResponseOk } from '@/utils/createCharacterTask'
import {
  ILL_TYPE,
  ILL_TYPES_GALLERY,
  STORAGE_KEY,
  buildChildhoodPrompt,
  buildCollectTitle,
  SHARE,
} from '@/utils/childhoodMoments'

export default {
  name: 'Childhood',
  components: { PolaroidFrame, MuseumSceneBackground },
  data() {
    return {
      subjectScene: '',
      generating: false,
      generatedImageUrl: null,
      justGenerated: false,
      collecting: false,
      downloading: false,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
      recentItems: [],
      previewVisible: false,
      previewItem: null,
      submitImage,
    }
  },
  computed: {
    generatedPrompt() {
      return buildChildhoodPrompt(this.subjectScene)
    },
    polaroidCaption() {
      if (this.generatedImageUrl && this.subjectScene.trim()) {
        return this.subjectScene.trim().slice(0, 28)
      }
      return this.$t('childhoodMoments.polaroidCaptionDefault')
    },
  },
  mounted() {
    this.$store.commit('closeMask')

    const savedImage = localStorage.getItem(STORAGE_KEY)
    if (savedImage) {
      this.generatedImageUrl = savedImage
    }

    this.loadRecentItems()
    this.initWeChatShare()
  },
  methods: {
    goToGallery() {
      this.$router.push('/childhood/gallery')
    },

    getImageUrl(item) {
      if (!item) return ''
      let picture = item.content || item.picture || item.image_url || item.url || item.image
      if (!picture) return ''
      if (typeof picture === 'string') {
        if (picture.startsWith('http') || picture.startsWith('data:')) return picture
        return `https://static.kidstory.cc/${picture}`
      }
      if (typeof picture === 'object' && picture.url) return picture.url
      return ''
    },

    async loadRecentItems() {
      try {
        const results = await Promise.all(
          ILL_TYPES_GALLERY.map((type) =>
            this.$http.get('/ill/', {
              params: {
                type,
                page: 1,
                limit: 6,
                sort_param: 'createdAt',
                sort_num: 'desc',
              },
            })
          )
        )
        const merged = []
        results.forEach((res) => {
          if (res.data && (res.data.code === 0 || res.data.code === '0' || res.data.desc === 'success')) {
            const message = res.data.message || {}
            const items = message.data || message || res.data.data || []
            if (Array.isArray(items)) merged.push(...items)
          }
        })
        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        this.recentItems = merged.slice(0, 6)
      } catch {
        // ignore
      }
    },

    previewRecent(item) {
      this.previewItem = item
      this.previewVisible = true
    },

    async initWeChatShare() {
      if (typeof window === 'undefined') return
      if (!/MicroMessenger/i.test(window.navigator.userAgent)) return
      if (!window.wx) return

      try {
        const url = window.location.href.split('#')[0]
        const res = await fetch(
          `https://api.kidstory.cc/wechat/js-signature?url=${encodeURIComponent(url)}`
        )
        const data = await res.json()
        const { message } = data || {}
        if (!message) return

        window.wx.config({
          debug: false,
          appId: message.appId,
          timestamp: message.timestamp,
          nonceStr: message.nonceStr,
          signature: message.signature,
          jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
        })

        window.wx.ready(() => {
          const shareImg = this.generatedImageUrl || this.submitImage
          const payload = {
            title: SHARE.title,
            desc: SHARE.desc,
            link: window.location.href,
            imgUrl: shareImg,
          }
          window.wx.updateAppMessageShareData?.(payload)
          window.wx.updateTimelineShareData?.({
            title: SHARE.title,
            link: payload.link,
            imgUrl: shareImg,
          })
        })
      } catch {
        // ignore
      }
    },

    async generateIllustration() {
      if (!this.generatedPrompt) {
        ElMessage.warning(this.$t('childhoodMoments.sceneRequired'))
        return
      }

      this.generatedImageUrl = null
      this.justGenerated = false
      this.generating = true

      try {
        const responseData = await postCreateCharacter(
          this.$http,
          { prompt: this.generatedPrompt, size: '1024x1024' },
          { apiBaseUrl: this.apiBaseUrl }
        )

        if (responseData.allowed === false) {
          const errorMessage =
            responseData.type === 'create-character'
              ? this.$t('childhoodMoments.quotaExceeded')
              : responseData.message || this.$t('childhoodMoments.quotaExceeded')
          ElMessage({ message: errorMessage, type: 'error', offset: 200 })
          return
        }

        if (!isCreateCharacterResponseOk(responseData) || !responseData.message) {
          const errorMsg =
            responseData.message?.error || responseData.desc || responseData.error
          ElMessage({ message: errorMsg || this.$t('childhoodMoments.generateFailed'), type: 'error', offset: 200 })
          return
        }

        const result = responseData.message
        if (result?.points !== undefined && this.$store?.state) {
          this.$store.commit('setUserInfo', {
            ...(this.$store.state.userInfo || {}),
            points: result.points,
          })
        }

        const imageUrl =
          result.image_url || result.character_image_url || result.image || result.url

        if (imageUrl) {
          this.generatedImageUrl = imageUrl
          this.justGenerated = true
          localStorage.setItem(STORAGE_KEY, imageUrl)
          ElMessage.success(this.$t('childhoodMoments.generateSuccess'))
          await this.autoSaveIllustration(imageUrl)
          await this.loadRecentItems()
          this.initWeChatShare()
          setTimeout(() => {
            this.justGenerated = false
          }, 900)
        } else {
          throw new Error('no image url')
        }
      } catch {
        ElMessage({ message: this.$t('childhoodMoments.generateFailed'), type: 'error', offset: 200 })
      } finally {
        this.generating = false
      }
    },

    clearGeneratedImage() {
      this.generatedImageUrl = null
      this.justGenerated = false
      localStorage.removeItem(STORAGE_KEY)
    },

    async fetchNextIndex() {
      let total = 0
      try {
        const countRes = await this.$http.get('/ill/', {
          params: {
            type: ILL_TYPE,
            page: 1,
            limit: 1,
            sort_param: 'createdAt',
            sort_num: 'desc',
          },
        })
        if (
          countRes.data &&
          (countRes.data.code === 0 || countRes.data.code === '0' || countRes.data.desc === 'success')
        ) {
          const message = countRes.data.message || {}
          total = Number(message.total || countRes.data.total || 0) || 0
        }
      } catch {
        // ignore
      }
      return total + 1
    },

    normalizePictureUrl(imageUrl) {
      let pictureValue = imageUrl
      if (
        pictureValue &&
        !pictureValue.startsWith('http://') &&
        !pictureValue.startsWith('https://') &&
        !pictureValue.startsWith('data:')
      ) {
        pictureValue = `https://static.kidstory.cc/${pictureValue}`
      }
      return pictureValue
    },

    async saveIllustration(imageUrl) {
      const nextIndex = await this.fetchNextIndex()
      const dynamicTitle = buildCollectTitle(nextIndex)
      await this.$http.post(
        '/ill/',
        {
          picture: this.normalizePictureUrl(imageUrl),
          title: dynamicTitle,
          description: this.generatedPrompt,
          type: ILL_TYPE,
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
    },

    async autoSaveIllustration(imageUrl) {
      try {
        await this.saveIllustration(imageUrl)
      } catch {
        // silent
      }
    },

    async collectIllustration() {
      if (!this.generatedImageUrl) {
        ElMessage.warning(this.$t('childhoodMoments.notReady'))
        return
      }
      this.collecting = true
      try {
        await this.saveIllustration(this.generatedImageUrl)
        ElMessage.success(this.$t('childhoodMoments.collectSuccess'))
        await this.loadRecentItems()
      } catch {
        ElMessage({ message: this.$t('childhoodMoments.collectFailed'), type: 'error', offset: 200 })
      } finally {
        this.collecting = false
      }
    },

    downloadIllustration() {
      if (!this.generatedImageUrl) return
      this.downloading = true
      const link = document.createElement('a')
      link.href = this.generatedImageUrl
      link.download = 'childhood-moment.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      this.downloading = false
    },
  },
}
</script>

<style>
.el-message {
  top: 200px !important;
  z-index: 10001 !important;
}

.moment-preview-dialog .el-dialog {
  border-radius: 0;
  border: 1px solid #111;
}
</style>

<style scoped>
.moment-page {
  position: relative;
  min-height: 100vh;
  background: #fff;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
}

.moment-museum-entry {
  position: fixed;
  top: 0;
  left: 38%;
  right: 0;
  height: 100vh;
  z-index: 2;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
}

.moment-museum-entry__veil {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  transition: background 0.35s ease;
}

.moment-museum-entry:hover .moment-museum-entry__veil,
.moment-museum-entry:focus-visible .moment-museum-entry__veil {
  background: rgba(0, 0, 0, 0.28);
}

.moment-museum-entry__content {
  position: absolute;
  left: 50%;
  bottom: 18%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #fff;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

.moment-museum-entry__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  font-size: 20px;
  animation: museum-pulse 2.4s ease-in-out infinite;
}

.moment-museum-entry__text {
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.moment-museum-entry:focus-visible {
  outline: 2px solid #111;
  outline-offset: -4px;
}

@keyframes museum-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
}

.moment-body {
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.moment-body > * {
  pointer-events: auto;
}

.moment-nav {
  display: flex;
  justify-content: flex-end;
  padding: 20px clamp(16px, 4vw, 48px) 0;
}

.moment-nav__link {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: #111;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.moment-nav__link:hover {
  border-color: #111;
}

.moment-hero {
  display: flex;
  align-items: flex-end;
  min-height: 100vh;
  padding: 0 clamp(16px, 4vw, 48px) clamp(20px, 4vh, 36px);
  box-sizing: border-box;
}

.moment-hero__copy {
  position: relative;
  z-index: 3;
  max-width: min(540px, 100%);
}

.moment-kicker {
  margin: 0 0 12px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #444;
  text-shadow: 0 1px 16px rgba(255, 255, 255, 0.95);
}

.moment-title {
  margin: 0 0 20px;
  font-size: clamp(36px, 7vw, 64px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.92);
}

.moment-title span {
  display: block;
}

.moment-lead {
  margin: 0 0 10px;
  max-width: 28em;
  font-size: clamp(15px, 2.2vw, 18px);
  line-height: 1.75;
  color: #222;
  text-shadow: 0 1px 14px rgba(255, 255, 255, 0.9);
}

.moment-tagline {
  margin: 0;
  max-width: 26em;
  font-size: 14px;
  line-height: 1.8;
  color: #444;
  text-shadow: 0 1px 12px rgba(255, 255, 255, 0.88);
}

.moment-workspace {
  padding: clamp(32px, 6vw, 64px) clamp(16px, 4vw, 48px) 48px;
  background: #fff;
  border-top: 1px solid #eee;
}

.moment-workspace__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(24px, 5vw, 56px);
  max-width: 960px;
  margin: 0 auto;
  align-items: start;
}

.moment-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.moment-textarea {
  display: block;
  width: 100%;
  min-height: 140px;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid #111;
  background: transparent;
  font-size: 16px;
  line-height: 1.7;
  color: #111;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.moment-textarea::placeholder {
  color: #999;
}

.moment-textarea:focus {
  border-bottom-width: 2px;
}

.moment-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 22px;
  border: 1.5px solid #111;
  border-radius: 999px;
  background: transparent;
  color: #111;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.moment-pill:hover:not(:disabled) {
  background: #111;
  color: #fff;
}

.moment-pill:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.moment-pill--solid {
  background: #111;
  color: #fff;
}

.moment-pill--solid:hover:not(:disabled) {
  background: #333;
}

.moment-pill--wide {
  width: 100%;
  margin-top: 24px;
}

.moment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.moment-text-btn {
  border: none;
  background: none;
  padding: 10px 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.moment-generating,
.moment-empty,
.moment-image-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.moment-generating__line {
  width: 48px;
  height: 2px;
  background: #111;
  margin-bottom: 14px;
  animation: line-pulse 1.4s ease-in-out infinite;
}

.moment-recent {
  padding: 0 clamp(16px, 4vw, 48px) 64px;
  max-width: 960px;
  margin: 0 auto;
}

.moment-recent__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.moment-recent__head h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.moment-recent__head a {
  font-size: 13px;
  color: #111;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.moment-recent__head a:hover {
  border-color: #111;
}

.moment-recent__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.moment-recent__thumb {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.moment-recent__thumb img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid #111;
  transition: transform 0.25s ease;
}

.moment-recent__thumb:hover img {
  transform: translateY(-3px);
}

.moment-recent__thumb span {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.4;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.moment-preview-image {
  width: 100%;
  max-height: 60vh;
}

@keyframes line-pulse {
  0%,
  100% {
    transform: scaleX(0.4);
    opacity: 0.4;
  }
  50% {
    transform: scaleX(1);
    opacity: 1;
  }
}

@media (max-width: 860px) {
  .moment-museum-entry {
    left: 0;
  }

  .moment-museum-entry__content {
    bottom: 22%;
  }

  .moment-workspace__grid {
    grid-template-columns: 1fr;
  }

  .moment-hero {
    align-items: flex-end;
    padding-bottom: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .moment-generating__line,
  .moment-museum-entry__icon {
    animation: none;
  }
}
</style>
