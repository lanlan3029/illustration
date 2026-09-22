<template>
  <div class="moment-page">
    <section class="moment-upper">
      <div class="moment-upper__bar">
        <p class="moment-upper__brand">KidStory</p>
        <router-link to="/childhood/gallery" class="moment-upper__link">
          {{ $t('childhoodMoments.viewWall') }}
        </router-link>
      </div>

      <div class="moment-upper__grid">
        <div class="moment-crowd">
          <h1 class="moment-crowd__title">{{ $t('childhoodMoments.coverTitle') }}</h1>
          <ChildhoodAvatarCrowd ref="crowdRef" variant="hero" />
        </div>

        <div class="moment-form">
          <textarea
            id="moment-scene"
            v-model="subjectScene"
            class="moment-form__input"
            rows="6"
            :placeholder="$t('childhoodMoments.scenePlaceholder')"
          />
          <div class="moment-form__actions">
            <button
              type="button"
              class="moment-btn moment-btn--ghost"
              :disabled="!subjectScene.trim() || submittingText"
              @click="submitTextOnly"
            >
              {{ submittingText ? $t('childhoodMoments.submittingText') : $t('childhoodMoments.submitText') }}
            </button>
            <button
              type="button"
              class="moment-btn moment-btn--primary"
              :disabled="!subjectScene.trim() || generating"
              @click="generateIllustration"
            >
              {{ generating ? $t('childhoodMoments.generating') : $t('childhoodMoments.generate') }}
            </button>
          </div>
        </div>
      </div>

      <svg
        class="moment-wave"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,52 C320,96 520,12 720,48 C920,84 1120,20 1440,56 L1440,100 L0,100 Z"
          fill="var(--moment-lower-bg)"
        />
      </svg>
    </section>

    <section ref="galleryRef" class="moment-gallery">
      <div class="moment-gallery__head">
        <h2>{{ $t('childhoodMoments.galleryTitle') }}</h2>
        <router-link v-if="galleryItems.length" to="/childhood/gallery">
          {{ $t('childhoodMoments.seeAll') }}
        </router-link>
      </div>

      <div v-if="galleryLoading" class="moment-gallery__state">
        <span class="moment-gallery__line" />
        <p>{{ $t('childhoodMoments.galleryLoading') }}</p>
      </div>

      <p v-else-if="!galleryItems.length" class="moment-gallery__state moment-gallery__state--empty">
        {{ $t('childhoodMoments.galleryEmpty') }}
      </p>

      <div v-else class="moment-gallery__focus">
        <ChildhoodFocusGrid
          ref="focusGrid"
          v-model="galleryFocusIndex"
          :items="galleryGridItems"
          :aria-label="$t('childhoodMoments.galleryTitle')"
          @select="openGalleryPreview"
        />
        <p v-if="galleryGridItems[galleryFocusIndex]?.caption" class="moment-gallery__focus-caption">
          {{ galleryGridItems[galleryFocusIndex].caption }}
        </p>
        <p class="moment-gallery__focus-hint">{{ $t('childhoodMoments.focusHint') }}</p>
      </div>
    </section>

    <el-dialog
      v-model="previewVisible"
      :title="previewItem?.title || $t('childhoodMoments.previewTitle')"
      width="min(92vw, 640px)"
      class="moment-preview-dialog"
      @closed="previewItem = null"
    >
      <el-image
        v-if="previewItem"
        :src="getImageUrl(previewItem)"
        fit="contain"
        class="moment-preview-image"
      />
      <p v-if="previewItem?.description" class="moment-preview-desc">
        {{ previewItem.description }}
      </p>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import ChildhoodAvatarCrowd from '@/components/childhood/ChildhoodAvatarCrowd.vue'
import ChildhoodFocusGrid from '@/components/childhood/ChildhoodFocusGrid.vue'
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
  components: { ChildhoodAvatarCrowd, ChildhoodFocusGrid },
  data() {
    return {
      subjectScene: '',
      generating: false,
      submittingText: false,
      generatedImageUrl: null,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
      galleryItems: [],
      galleryFocusIndex: 0,
      galleryLoading: true,
      previewVisible: false,
      previewItem: null,
      submitImage,
    }
  },
  computed: {
    generatedPrompt() {
      return buildChildhoodPrompt(this.subjectScene)
    },
    galleryGridItems() {
      return this.galleryItems.map((item, index) => ({
        id: item._id || `g-${index}`,
        imageUrl: this.getImageUrl(item),
        caption: this.itemCaption(item),
        raw: item,
      }))
    },
    currentGalleryGridItem() {
      return this.galleryGridItems[this.galleryFocusIndex] || null
    },
  },
  mounted() {
    this.$store.commit('closeMask')

    const savedImage = localStorage.getItem(STORAGE_KEY)
    if (savedImage) {
      this.generatedImageUrl = savedImage
    }

    this.loadGalleryItems()
    this.initWeChatShare()
  },
  methods: {
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

    itemCaption(item) {
      if (item?.description) return item.description.slice(0, 48)
      if (item?.title) return item.title
      return this.$t('childhoodMoments.polaroidCaptionDefault')
    },

    hasIllustration(item) {
      const url = this.getImageUrl(item)
      return !!url && !url.endsWith('/') && url.length > 8
    },

    async loadGalleryItems() {
      this.galleryLoading = true
      try {
        const results = await Promise.all(
          ILL_TYPES_GALLERY.map((type) =>
            this.$http.get('/ill/', {
              params: {
                type,
                page: 1,
                limit: 24,
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
        this.galleryItems = merged.filter((item) => this.hasIllustration(item)).slice(0, 12)
      } catch {
        // ignore
      } finally {
        this.galleryLoading = false
      }
    },

    scrollToGallery() {
      this.galleryFocusIndex = 0
      this.$nextTick(() => {
        this.$refs.galleryRef?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },

    openGalleryPreview(gridItem) {
      if (!gridItem?.raw) return
      this.previewItem = gridItem.raw
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

    async saveTextStory(text) {
      const nextIndex = await this.fetchNextIndex()
      await this.$http.post(
        '/ill/',
        {
          picture: '',
          title: buildCollectTitle(nextIndex),
          description: text,
          type: ILL_TYPE,
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
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

    async saveIllustration(imageUrl, description) {
      const nextIndex = await this.fetchNextIndex()
      await this.$http.post(
        '/ill/',
        {
          picture: this.normalizePictureUrl(imageUrl),
          title: buildCollectTitle(nextIndex),
          description: description || this.generatedPrompt,
          type: ILL_TYPE,
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
    },

    async submitTextOnly() {
      const text = this.subjectScene.trim()
      if (!text) {
        ElMessage.warning(this.$t('childhoodMoments.sceneRequired'))
        return
      }

      this.submittingText = true
      this.$refs.crowdRef?.addPerson(text)

      try {
        await this.saveTextStory(text)
        ElMessage.success(this.$t('childhoodMoments.submitTextSuccess'))
        this.subjectScene = ''
      } catch {
        ElMessage.error(this.$t('childhoodMoments.submitTextFailed'))
      } finally {
        this.submittingText = false
      }
    },

    async generateIllustration() {
      if (!this.generatedPrompt) {
        ElMessage.warning(this.$t('childhoodMoments.sceneRequired'))
        return
      }

      const sceneText = this.subjectScene.trim()
      this.$refs.crowdRef?.addPerson(sceneText)

      this.generatedImageUrl = null
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
          localStorage.setItem(STORAGE_KEY, imageUrl)
          ElMessage.success(this.$t('childhoodMoments.generateSuccess'))

          try {
            await this.saveIllustration(imageUrl, sceneText)
          } catch {
            // silent
          }

          this.subjectScene = ''
          await this.loadGalleryItems()
          this.initWeChatShare()
          this.scrollToGallery()
        } else {
          throw new Error('no image url')
        }
      } catch {
        ElMessage({ message: this.$t('childhoodMoments.generateFailed'), type: 'error', offset: 200 })
      } finally {
        this.generating = false
      }
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
  border-radius: 8px;
  border: none;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12);
}
</style>

<style scoped>
.moment-page {
  --moment-upper-bg: #ebe4f4;
  --moment-lower-bg: #f5e8b8;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background: var(--moment-lower-bg);
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
}

.moment-upper {
  position: relative;
  width: 100%;
  background: var(--moment-upper-bg);
  padding-bottom: 0;
}

.moment-upper__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px clamp(16px, 3vw, 28px) 8px;
  box-sizing: border-box;
}

.moment-upper__brand {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8167a9;
}

.moment-upper__link {
  font-size: 13px;
  color: #444;
  text-decoration: none;
  letter-spacing: 0.02em;
}

.moment-upper__link:hover {
  color: #111;
}

.moment-upper__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 0;
  width: 100%;
  min-height: min(78vh, 680px);
  align-items: stretch;
}

.moment-crowd {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  padding: 8px 0 24px;
}

.moment-crowd__title {
  margin: 0 0 8px;
  padding: 0 clamp(16px, 3vw, 28px);
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: #2a2340;
}

.moment-wave {
  display: block;
  width: 100%;
  height: clamp(48px, 8vw, 80px);
  margin-bottom: -1px;
}

.moment-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 320px;
  padding: clamp(24px, 5vw, 48px) clamp(16px, 3vw, 28px) clamp(32px, 6vw, 56px);
  box-sizing: border-box;
}

.moment-form__input {
  display: block;
  width: 100%;
  min-height: 160px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: clamp(17px, 2.5vw, 20px);
  line-height: 1.75;
  color: #111;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.moment-form__input::placeholder {
  color: #aaa;
}

.moment-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.moment-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.moment-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.moment-btn--ghost {
  border: 1.5px solid rgba(42, 35, 64, 0.25);
  background: rgba(255, 255, 255, 0.45);
  color: #333;
}

.moment-btn--ghost:hover:not(:disabled) {
  border-color: #8167a9;
  background: #fff;
  color: #8167a9;
}

.moment-btn--primary {
  border: 1.5px solid #8167a9;
  background: #8167a9;
  color: #fff;
}

.moment-btn--primary:hover:not(:disabled) {
  background: #6f5896;
  border-color: #6f5896;
}

.moment-gallery {
  width: 100%;
  margin: 0;
  padding: clamp(32px, 6vw, 56px) 0 64px;
  box-sizing: border-box;
}

.moment-gallery__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 28px;
  padding: 0 clamp(16px, 3vw, 28px);
  box-sizing: border-box;
}

.moment-gallery__head h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #444;
}

.moment-gallery__head a {
  font-size: 13px;
  color: #8167a9;
  text-decoration: none;
}

.moment-gallery__head a:hover {
  text-decoration: underline;
}

.moment-gallery__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px;
  color: #666;
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
}

.moment-gallery__state--empty {
  padding: 32px 0 16px;
}

.moment-gallery__line {
  width: 40px;
  height: 2px;
  background: #8167a9;
  margin-bottom: 14px;
  animation: line-pulse 1.4s ease-in-out infinite;
}

.moment-gallery__focus {
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.moment-gallery__focus-caption {
  margin: 20px clamp(16px, 3vw, 28px) 6px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  text-align: center;
}

.moment-gallery__focus-hint {
  margin: 0 clamp(16px, 3vw, 28px);
  font-size: 12px;
  color: #777;
  text-align: center;
}

.moment-preview-image {
  width: 100%;
  max-height: 65vh;
}

.moment-preview-desc {
  margin: 16px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #555;
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

@media (max-width: 768px) {
  .moment-upper__grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .moment-crowd {
    min-height: 360px;
    padding-bottom: 8px;
  }

  .moment-form {
    min-height: auto;
    padding-top: 0;
  }

  .moment-form__actions {
    flex-direction: column;
  }

  .moment-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .moment-gallery__line {
    animation: none;
  }
}
</style>
