<template>
  <div ref="pageRef" class="moment-page">
    <section class="moment-split">
      <div ref="crowdAreaRef" class="moment-split__left">
        <ChildhoodAvatarCrowd ref="crowdRef" variant="hero" @count-change="onCrowdUpdate" />
        <p v-if="sceneCount > 0" class="moment-split__foot-hint">
          {{ $t('childhoodMoments.crowdHoverHint', { count: sceneCount }) }}
        </p>
      </div>

      <aside class="moment-split__right">
        <div class="moment-panel__glow moment-panel__glow--purple" aria-hidden="true" />
        <div class="moment-panel__glow moment-panel__glow--amber" aria-hidden="true" />
        <div class="moment-panel__noise" aria-hidden="true" />

        <div class="moment-panel__inner">
          <router-link to="/childhood/gallery" class="moment-panel__link">
            {{ $t('childhoodMoments.viewWall') }}
          </router-link>

          <header class="moment-panel__head">
            <h1 class="moment-panel__title">
              <span>{{ $t('childhoodMoments.titleLine1') }}</span>
              <span>{{ $t('childhoodMoments.titleLine2') }}</span>
            </h1>
            <p class="moment-panel__guide">{{ $t('childhoodMoments.formGuide') }}</p>
          </header>

          <div v-if="sceneAvatars.length" class="moment-community">
            <div class="moment-community__avatars" aria-hidden="true">
              <img
                v-for="(url, index) in sceneAvatars"
                :key="`${url}-${index}`"
                class="moment-community__avatar"
                :src="url"
                alt=""
                decoding="async"
              />
            </div>
            <div class="moment-community__meta">
              <span class="moment-community__live">{{ $t('childhoodMoments.communityLive') }}</span>
              <span class="moment-community__time">{{
                $t('childhoodMoments.communityTime', { count: sceneCount, time: communityTimeLabel })
              }}</span>
            </div>
          </div>

          <div
            class="moment-form__card"
            :class="{ 'moment-form__card--busy': generating }"
            :aria-busy="generating"
          >
            <textarea
              id="moment-scene"
              v-model="subjectScene"
              class="moment-form__input"
              rows="5"
              :placeholder="currentPlaceholder"
              :disabled="generating"
              @keydown="onSceneKeydown"
            />
            <div class="moment-form__actions">
              <button
                type="button"
                class="moment-btn moment-btn--ghost"
                :disabled="!subjectScene.trim() || submittingText || generating"
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
                <span v-if="generating" class="moment-btn__spinner" aria-hidden="true" />
                {{ generating ? $t('childhoodMoments.generating') : $t('childhoodMoments.generate') }}
              </button>
            </div>
            <p class="moment-form__shortcut">{{ $t('childhoodMoments.formShortcut') }}</p>
            <div v-if="generating" class="moment-form__overlay" role="status">
              <span class="moment-form__overlay-spinner" aria-hidden="true" />
              <span>{{ $t('childhoodMoments.generating') }}</span>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section
      v-if="galleryLoading || galleryGridItems.length"
      ref="galleryRef"
      class="moment-user-works"
    >
      <div v-if="galleryGridItems.length" class="moment-gallery__head">
        <router-link to="/childhood/gallery" class="moment-gallery__see-all">
          {{ $t('childhoodMoments.seeAll') }}
        </router-link>
      </div>

      <div v-if="galleryLoading" class="moment-gallery__state">
        <span class="moment-gallery__line" />
        <p>{{ $t('childhoodMoments.galleryLoading') }}</p>
      </div>

      <div
        v-else
        class="moment-gallery__focus"
      >
        <ChildhoodFocusGrid
          v-if="galleryGridItems.length"
          ref="focusGrid"
          v-model="galleryFocusIndex"
          hide-empty
          :items="galleryGridItems"
          :aria-label="$t('childhoodMoments.galleryTitle')"
          @select="openGalleryPreview"
        />
        <p v-if="galleryGridItems[galleryFocusIndex]?.caption" class="moment-gallery__focus-caption">
          {{ galleryGridItems[galleryFocusIndex].caption }}
        </p>
        <p v-if="galleryGridItems.length" class="moment-gallery__focus-hint">
          {{ $t('childhoodMoments.photoGridHint') }}
        </p>
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
import { mapState } from 'vuex'
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
  getIllustrationUrl,
  hasIllustration,
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
      sceneCount: 0,
      sceneAvatars: [],
      placeholderIndex: 0,
      placeholderTimer: null,
      communityClock: Date.now(),
      clockTimer: null,
    }
  },
  computed: {
    ...mapState(['isLogin']),
    scenePlaceholderList() {
      const list = this.$tm('childhoodMoments.scenePlaceholders')
      if (Array.isArray(list) && list.length) return list
      return [this.$t('childhoodMoments.scenePlaceholder')]
    },
    currentPlaceholder() {
      if (this.subjectScene.trim()) return ''
      return this.scenePlaceholderList[this.placeholderIndex % this.scenePlaceholderList.length]
    },
    communityTimeLabel() {
      const d = new Date(this.communityClock)
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    },
    generatedPrompt() {
      return buildChildhoodPrompt(this.subjectScene)
    },
    galleryGridItems() {
      const items = this.galleryItems.map((item, index) => ({
        id: item._id || `g-${index}`,
        imageUrl: getIllustrationUrl(item),
        caption: this.itemCaption(item),
        raw: item,
      }))

      if (this.generatedImageUrl) {
        const exists = items.some((entry) => entry.imageUrl === this.generatedImageUrl)
        if (!exists) {
          items.unshift({
            id: 'local-generated',
            imageUrl: this.generatedImageUrl,
            caption: this.$t('childhoodMoments.polaroidCaptionDefault'),
            raw: { picture: this.generatedImageUrl, description: '' },
          })
        }
      }

      return items
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
    this.startPlaceholderRotation()
    this.startCommunityClock()
  },
  beforeUnmount() {
    clearInterval(this.placeholderTimer)
    clearInterval(this.clockTimer)
  },
  methods: {
    onCrowdUpdate(payload) {
      if (typeof payload === 'number') {
        this.sceneCount = payload
        return
      }
      this.sceneCount = payload?.count || 0
      this.sceneAvatars = payload?.avatars || []
    },

    startPlaceholderRotation() {
      this.placeholderTimer = setInterval(() => {
        if (this.subjectScene.trim()) return
        this.placeholderIndex = (this.placeholderIndex + 1) % this.scenePlaceholderList.length
      }, 4000)
    },

    startCommunityClock() {
      this.clockTimer = setInterval(() => {
        this.communityClock = Date.now()
      }, 60000)
    },

    getImageUrl(item) {
      return getIllustrationUrl(item)
    },

    itemCaption(item) {
      if (item?.description) return item.description.slice(0, 48)
      if (item?.title) return item.title
      return this.$t('childhoodMoments.polaroidCaptionDefault')
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
                limit: 48,
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
        this.galleryItems = merged
          .filter((item) => hasIllustration(item))
          .filter((item) => item.type === ILL_TYPE || !item.type)
          .slice(0, 48)
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

    ensureLogin() {
      if (this.isLogin && localStorage.getItem('token')) return true
      ElMessage.warning(this.$t('childhoodMoments.pleaseLogin'))
      this.$store.commit('showMask')
      return false
    },

    onSceneKeydown(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return
      e.preventDefault()
      if (this.generating || this.submittingText || !this.subjectScene.trim()) return
      this.generateIllustration()
    },

    async submitTextOnly() {
      const text = this.subjectScene.trim()
      if (!text) {
        ElMessage.warning(this.$t('childhoodMoments.sceneRequired'))
        return
      }
      if (!this.ensureLogin()) return

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
      if (!this.ensureLogin()) return

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
  --moment-cream: #faf4f2;
  --moment-panel-bg: #14101c;
  --moment-accent: #a78bcc;
  --moment-accent-deep: #8167a9;
  --moment-text-light: #f5f0fa;
  --moment-muted-dark: rgba(245, 240, 250, 0.52);
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100dvh;
  margin: 0;
  padding: 0;
  background: var(--moment-cream);
  color: var(--moment-text-light);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
}

.moment-split {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  width: 100%;
  min-height: 100dvh;
}

.moment-split__left {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100dvh;
  padding: clamp(12px, 2vw, 24px) clamp(8px, 1.5vw, 20px) clamp(20px, 3vw, 32px);
  background: var(--moment-cream);
  box-sizing: border-box;
}

.moment-split__foot-hint {
  margin-top: auto;
  padding: 16px 12px 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #9a929f;
  letter-spacing: 0.02em;
  text-align: center;
}

.moment-split__right {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  overflow: hidden;
  background-color: var(--moment-panel-bg);
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
  background-size: 28px 28px;
}

.moment-panel__glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
}

.moment-panel__glow--purple {
  top: -8%;
  right: -6%;
  width: min(420px, 55vw);
  height: min(420px, 55vw);
  background: radial-gradient(circle, rgba(129, 103, 169, 0.45) 0%, transparent 70%);
}

.moment-panel__glow--amber {
  bottom: -4%;
  right: 8%;
  width: min(320px, 45vw);
  height: min(320px, 45vw);
  background: radial-gradient(circle, rgba(232, 168, 108, 0.22) 0%, transparent 72%);
}

.moment-panel__noise {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  mix-blend-mode: overlay;
}

.moment-panel__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 40px) clamp(20px, 3.5vw, 36px) clamp(32px, 5vw, 48px);
  box-sizing: border-box;
}

.moment-panel__link {
  align-self: flex-end;
  margin-bottom: clamp(20px, 3vw, 32px);
  font-size: 13px;
  color: var(--moment-muted-dark);
  text-decoration: none;
  letter-spacing: 0.02em;
  transition: color 0.2s ease;
}

.moment-panel__link:hover {
  color: var(--moment-text-light);
}

.moment-panel__head {
  margin-bottom: clamp(20px, 3vw, 28px);
}

.moment-panel__title {
  display: flex;
  flex-direction: column;
  gap: 0.12em;
  margin: 0 0 14px;
  font-family: 'Songti SC', 'Noto Serif SC', 'STSong', 'SimSun', serif;
  font-size: clamp(28px, 4.2vw, 38px);
  font-weight: 300;
  line-height: 1.25;
  letter-spacing: 0.06em;
  color: var(--moment-text-light);
}

.moment-panel__guide {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--moment-muted-dark);
  letter-spacing: 0.02em;
}

.moment-community {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
}

.moment-community__avatars {
  display: flex;
  flex-shrink: 0;
  padding-left: 4px;
}

.moment-community__avatar {
  width: 28px;
  height: 28px;
  margin-left: -8px;
  border: 2px solid var(--moment-panel-bg);
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.12);
}

.moment-community__avatar:first-child {
  margin-left: 0;
}

.moment-community__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.moment-community__live {
  font-size: 12px;
  font-weight: 600;
  color: var(--moment-accent);
  letter-spacing: 0.04em;
}

.moment-community__time {
  font-size: 11px;
  color: var(--moment-muted-dark);
  letter-spacing: 0.02em;
}

.moment-form__card {
  position: relative;
  width: 100%;
  padding: clamp(20px, 3vw, 28px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(16px);
  box-sizing: border-box;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.moment-form__card:focus-within:not(.moment-form__card--busy) {
  border-color: rgba(167, 139, 204, 0.45);
  box-shadow:
    0 0 0 1px rgba(167, 139, 204, 0.2),
    0 0 28px rgba(129, 103, 169, 0.35),
    0 12px 40px rgba(0, 0, 0, 0.3);
}

.moment-form__card--busy {
  pointer-events: none;
}

.moment-form__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 20px;
  background: rgba(20, 16, 28, 0.82);
  color: var(--moment-accent);
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.moment-form__overlay-spinner,
.moment-btn__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(167, 139, 204, 0.25);
  border-top-color: var(--moment-accent);
  border-radius: 50%;
  animation: moment-spin 0.7s linear infinite;
}

.moment-btn__spinner {
  width: 14px;
  height: 14px;
  margin-right: 8px;
}

.moment-form__shortcut {
  margin: 12px 0 0;
  font-size: 11px;
  color: rgba(245, 240, 250, 0.35);
  text-align: right;
  letter-spacing: 0.02em;
}

@keyframes moment-spin {
  to {
    transform: rotate(360deg);
  }
}

.moment-form__input {
  display: block;
  width: 100%;
  min-height: 140px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: clamp(16px, 2.2vw, 18px);
  line-height: 1.75;
  color: var(--moment-text-light);
  resize: none;
  outline: none;
  box-sizing: border-box;
  transition: color 0.2s ease;
}

.moment-form__input::placeholder {
  color: rgba(245, 240, 250, 0.38);
  transition: opacity 0.35s ease;
}

.moment-form__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.moment-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-height: 44px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.moment-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.moment-btn--ghost {
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(245, 240, 250, 0.85);
}

.moment-btn--ghost:hover:not(:disabled) {
  border-color: rgba(167, 139, 204, 0.5);
  background: rgba(255, 255, 255, 0.1);
  color: var(--moment-text-light);
}

.moment-btn--primary {
  border: none;
  background: linear-gradient(135deg, #9278b8 0%, #8167a9 48%, #6b5490 100%);
  color: #fff;
  box-shadow:
    0 4px 14px rgba(129, 103, 169, 0.45),
    0 1px 0 rgba(255, 255, 255, 0.12) inset;
}

.moment-btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #a088c4 0%, #9278b8 48%, #8167a9 100%);
  box-shadow:
    0 6px 20px rgba(129, 103, 169, 0.55),
    0 1px 0 rgba(255, 255, 255, 0.15) inset;
  transform: translateY(-1px);
}

.moment-user-works {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: clamp(24px, 4vw, 40px) 0 64px;
  box-sizing: border-box;
  background: var(--moment-cream);
  border-top: 1px solid rgba(129, 103, 169, 0.1);
  color: #2a2340;
}

.moment-gallery__head {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  padding: 0 clamp(16px, 3vw, 28px);
  box-sizing: border-box;
}

.moment-gallery__see-all {
  font-size: 13px;
  color: #9a929f;
  text-decoration: none;
}

.moment-gallery__see-all:hover {
  color: #2a2340;
  text-decoration: underline;
}

.moment-gallery__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #9a929f;
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
}

.moment-gallery__line {
  width: 40px;
  height: 2px;
  background: rgba(129, 103, 169, 0.35);
  margin-bottom: 14px;
  animation: line-pulse 1.4s ease-in-out infinite;
}

.moment-gallery__focus {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  min-height: min(36vh, 420px);
  margin: 0;
  padding: clamp(4px, 1vw, 12px) 0 0;
  box-sizing: border-box;
}

.moment-gallery__focus :deep(.focus-grid) {
  max-width: min(760px, 92vw);
}

.moment-gallery__focus-caption {
  margin: 20px clamp(16px, 3vw, 28px) 6px;
  font-size: 14px;
  line-height: 1.6;
  color: #2a2340;
  text-align: center;
}

.moment-gallery__focus-hint {
  margin: 0 clamp(16px, 3vw, 28px);
  font-size: 12px;
  color: #9a929f;
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

@media (max-width: 900px) {
  .moment-split {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .moment-split__left {
    min-height: min(52dvh, 480px);
  }

  .moment-split__right {
    min-height: auto;
  }

  .moment-panel__inner {
    max-width: none;
  }

  .moment-panel__title {
    text-align: center;
  }

  .moment-panel__guide {
    text-align: center;
  }

  .moment-panel__link {
    align-self: center;
  }

  .moment-form__actions {
    flex-direction: column;
    align-items: stretch;
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
