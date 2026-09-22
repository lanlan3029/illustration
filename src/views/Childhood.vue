<template>
  <div ref="pageRef" class="moment-page">
    <svg
      v-if="connectorsVisible"
      class="moment-connectors"
      :viewBox="`0 0 ${connectorSize.w} ${connectorSize.h}`"
      aria-hidden="true"
    >
      <path v-if="shareConnectorPath" :d="shareConnectorPath" class="moment-connector" />
      <path v-if="galleryConnectorPath" :d="galleryConnectorPath" class="moment-connector moment-connector--gallery" />
    </svg>

    <section class="moment-upper">
      <div class="moment-upper__bar">
        <router-link to="/childhood/gallery" class="moment-upper__link">
          {{ $t('childhoodMoments.viewWall') }}
        </router-link>
      </div>

      <div class="moment-upper__grid">
        <div ref="crowdAreaRef" class="moment-crowd">
          <ChildhoodAvatarCrowd ref="crowdRef" variant="hero" @layout="updateConnectorPaths" />
        </div>

        <div class="moment-form">
          <p class="moment-form__guide">{{ $t('childhoodMoments.formGuide') }}</p>
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
              :placeholder="$t('childhoodMoments.scenePlaceholder')"
              :disabled="generating"
              @keydown="onSceneKeydown"
            />
            <div class="moment-form__actions">
              <button
                ref="shareBtnRef"
                type="button"
                class="moment-btn moment-btn--ghost"
                :disabled="!subjectScene.trim() || submittingText || generating"
                @click="submitTextOnly"
              >
                {{ submittingText ? $t('childhoodMoments.submittingText') : $t('childhoodMoments.submitText') }}
              </button>
              <button
                ref="generateBtnRef"
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
      </div>

      <!-- 左低右高，峰值偏右（参照参考图） -->
      <svg
        class="moment-wave"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          class="moment-wave__path"
          d="M0,96 C320,94 640,72 960,42 C1120,28 1280,22 1440,30 L1440,100 L0,100 Z"
        />
      </svg>
    </section>

    <section ref="galleryRef" class="moment-gallery">
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
        :class="{ 'moment-gallery__focus--empty': !galleryGridItems.length }"
      >
        <ChildhoodFocusGrid
          ref="focusGrid"
          v-model="galleryFocusIndex"
          hide-empty
          :items="galleryGridItems"
          :aria-label="$t('childhoodMoments.galleryTitle')"
          @select="openGalleryPreview"
        />
        <p v-if="!galleryGridItems.length" class="moment-gallery__empty-note">
          {{ $t('childhoodMoments.galleryEmpty') }}
        </p>
        <p v-else-if="galleryGridItems[galleryFocusIndex]?.caption" class="moment-gallery__focus-caption">
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
      connectorSize: { w: 1, h: 1 },
      shareConnectorPath: '',
      galleryConnectorPath: '',
      connectorsVisible: false,
      connectorResizeObserver: null,
    }
  },
  computed: {
    ...mapState(['isLogin']),
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

    this.$nextTick(() => {
      this.setupConnectorTracking()
      // 人物 crowd 布局完成后再算一次
      setTimeout(() => this.updateConnectorPaths(), 320)
      setTimeout(() => this.updateConnectorPaths(), 1200)
    })
  },
  beforeUnmount() {
    this.teardownConnectorTracking()
  },
  methods: {
    setupConnectorTracking() {
      this.updateConnectorPaths()
      window.addEventListener('resize', this.updateConnectorPaths, { passive: true })

      if (typeof ResizeObserver !== 'undefined' && this.$refs.pageRef) {
        this.connectorResizeObserver = new ResizeObserver(() => {
          this.updateConnectorPaths()
        })
        this.connectorResizeObserver.observe(this.$refs.pageRef)
        if (this.$refs.crowdAreaRef) {
          this.connectorResizeObserver.observe(this.$refs.crowdAreaRef)
        }
      }
    },

    teardownConnectorTracking() {
      window.removeEventListener('resize', this.updateConnectorPaths)
      this.connectorResizeObserver?.disconnect()
      this.connectorResizeObserver = null
    },

    localPoint(el, anchor, pageRect) {
      const rect = el.getBoundingClientRect()
      const x0 = rect.left - pageRect.left
      const y0 = rect.top - pageRect.top

      if (anchor === 'right-center') {
        return { x: x0 + rect.width, y: y0 + rect.height / 2 }
      }
      if (anchor === 'left-center') {
        return { x: x0, y: y0 + rect.height / 2 }
      }
      if (anchor === 'bottom-center') {
        return { x: x0 + rect.width / 2, y: y0 + rect.height }
      }
      if (anchor === 'top-center') {
        return { x: x0 + rect.width / 2, y: y0 }
      }
      return { x: x0, y: y0 }
    },

    buildShareConnectorPath(x1, y1, x2, y2) {
      const midX = (x1 + x2) / 2
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${midX.toFixed(1)} ${y1.toFixed(1)}, ${midX.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
    },

    viewportToPagePoint(point, pageRect) {
      return {
        x: point.x - pageRect.left,
        y: point.y - pageRect.top,
      }
    },

    buildVerticalConnectorPath(x1, y1, x2, y2) {
      const midY = y1 + (y2 - y1) * 0.55
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${midY.toFixed(1)}, ${x2.toFixed(1)} ${midY.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
    },

    updateConnectorPaths() {
      const page = this.$refs.pageRef
      const crowd = this.$refs.crowdAreaRef
      const shareBtn = this.$refs.shareBtnRef
      const generateBtn = this.$refs.generateBtnRef
      const gallery = this.$refs.galleryRef

      if (!page || !crowd || !shareBtn || !generateBtn || !gallery) {
        this.connectorsVisible = false
        return
      }

      if (window.innerWidth < 900) {
        this.connectorsVisible = false
        this.shareConnectorPath = ''
        this.galleryConnectorPath = ''
        return
      }

      const pageRect = page.getBoundingClientRect()
      const w = Math.max(page.offsetWidth, 1)
      const h = Math.max(page.offsetHeight, 1)

      const clusterViewport = this.$refs.crowdRef?.getClusterConnectorPoint?.()
      const crowdPoint = clusterViewport
        ? this.viewportToPagePoint(clusterViewport, pageRect)
        : this.localPoint(crowd, 'right-center', pageRect)
      const sharePoint = this.localPoint(shareBtn, 'left-center', pageRect)
      const generatePoint = this.localPoint(generateBtn, 'bottom-center', pageRect)
      const galleryPoint = this.localPoint(gallery, 'top-center', pageRect)

      // 分享按钮 → 人物群右侧（水平 S 曲线）
      if (sharePoint.x <= crowdPoint.x + 12) {
        this.shareConnectorPath = ''
      } else {
        this.shareConnectorPath = this.buildShareConnectorPath(
          sharePoint.x,
          sharePoint.y,
          crowdPoint.x,
          crowdPoint.y
        )
      }

      this.galleryConnectorPath = this.buildVerticalConnectorPath(
        generatePoint.x,
        generatePoint.y + 6,
        galleryPoint.x,
        galleryPoint.y + 4
      )

      this.connectorSize = { w, h }
      this.connectorsVisible = !!(this.shareConnectorPath || this.galleryConnectorPath)
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
        this.$nextTick(() => this.updateConnectorPaths())
      }
    },

    scrollToGallery() {
      this.galleryFocusIndex = 0
      this.$nextTick(() => {
        this.$refs.galleryRef?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => this.updateConnectorPaths(), 400)
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
  position: relative;
  --moment-upper-bg: #ffffff;
  /* 波浪与 gallery 共用同一紫色，避免双色分层 */
  --moment-lower-bg: #3f3878;
  --wave-h: clamp(72px, 11vw, 108px);
  --upper-min-h: max(480px, 52dvh);
  width: 100%;
  min-height: 200vh;
  min-height: 200dvh;
  margin: 0;
  padding: 0;
  background: var(--moment-lower-bg);
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
}

.moment-connectors {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
  overflow: visible;
}

.moment-connector {
  fill: none;
  stroke: rgba(129, 103, 169, 0.62);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 8 6;
  animation: moment-connector-march 1.1s linear infinite;
}

.moment-connector--gallery {
  stroke: rgba(63, 56, 120, 0.48);
  stroke-dasharray: 9 7;
  animation-duration: 1.35s;
}

@keyframes moment-connector-march {
  to {
    stroke-dashoffset: -26;
  }
}

.moment-upper {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: auto;
  background: var(--moment-upper-bg);
  padding-bottom: var(--wave-h);
  box-sizing: border-box;
}

.moment-wave {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: var(--wave-h);
  display: block;
  pointer-events: none;
  z-index: 1;
}

.moment-wave__path {
  fill: var(--moment-lower-bg);
}

.moment-upper__bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  padding: 16px clamp(16px, 3vw, 28px) 8px;
  box-sizing: border-box;
}

.moment-upper__link {
  font-size: 13px;
  color: #666;
  text-decoration: none;
  letter-spacing: 0.02em;
}

.moment-upper__link:hover {
  color: #111;
}

.moment-upper__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(16px, 3vw, 32px);
  flex: 1;
  width: 100%;
  min-height: var(--upper-min-h);
  align-items: center;
  overflow: visible;
}

.moment-crowd {
  position: relative;
  z-index: 4;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 8px 0 clamp(16px, 3vw, 28px);
  overflow: visible;
}

.moment-form {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: clamp(16px, 3vw, 32px) clamp(16px, 3vw, 28px);
  box-sizing: border-box;
}

.moment-form__guide {
  width: 100%;
  max-width: 420px;
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.55;
  color: #8a8498;
  letter-spacing: 0.02em;
}

.moment-form__card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: clamp(24px, 4vw, 32px);
  border: 1px solid rgba(63, 56, 120, 0.12);
  border-radius: 20px;
  background: #fff;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 12px 40px rgba(63, 56, 120, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.moment-form__card:focus-within:not(.moment-form__card--busy) {
  border-color: rgba(63, 56, 120, 0.32);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 0 0 3px rgba(63, 56, 120, 0.1),
    0 16px 48px rgba(63, 56, 120, 0.12);
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
  background: rgba(255, 255, 255, 0.82);
  color: #3f3878;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(2px);
}

.moment-form__overlay-spinner,
.moment-btn__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(63, 56, 120, 0.2);
  border-top-color: #3f3878;
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
  color: #b0a8c0;
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
  color: #2a2340;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.moment-form__input::placeholder {
  color: #b0a8c0;
}

.moment-form__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(63, 56, 120, 0.08);
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
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.moment-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.moment-btn--ghost {
  border: 1.5px solid rgba(63, 56, 120, 0.2);
  background: #faf9fc;
  color: #4a4268;
}

.moment-btn--ghost:hover:not(:disabled) {
  border-color: #8167a9;
  background: #fff;
  color: #8167a9;
}

.moment-btn--primary {
  border: 1.5px solid #3f3878;
  background: #3f3878;
  color: #fff;
}

.moment-btn--primary:hover:not(:disabled) {
  background: #4a4298;
  border-color: #4a4298;
}

.moment-gallery {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: max(100dvh, calc(200dvh - var(--upper-min-h)));
  margin: 0;
  padding: clamp(12px, 2vw, 24px) 0 64px;
  box-sizing: border-box;
  background: var(--moment-lower-bg);
}

.moment-gallery__head {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
  padding: 0 clamp(16px, 3vw, 28px);
  box-sizing: border-box;
}

.moment-gallery__see-all {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
}

.moment-gallery__see-all:hover {
  color: #fff;
  text-decoration: underline;
}

.moment-gallery__state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
}

.moment-gallery__line {
  width: 40px;
  height: 2px;
  background: #c4b0ff;
  margin-bottom: 14px;
  animation: line-pulse 1.4s ease-in-out infinite;
}

.moment-gallery__focus {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  min-height: min(68vh, 640px);
  margin: 0;
  padding: clamp(4px, 1vw, 12px) 0 0;
  box-sizing: border-box;
}

.moment-gallery__focus--empty {
  min-height: min(42vh, 480px);
}

.moment-gallery__empty-note {
  margin: 16px clamp(16px, 3vw, 28px) 0;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.58);
  text-align: center;
}

.moment-gallery__focus :deep(.focus-grid) {
  max-width: min(760px, 92vw);
}

.moment-gallery__focus-caption {
  margin: 20px clamp(16px, 3vw, 28px) 6px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
}

.moment-gallery__focus-hint {
  margin: 0 clamp(16px, 3vw, 28px);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
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
    align-items: stretch;
  }

  .moment-form {
    padding-top: 0;
  }

  .moment-form__guide {
    text-align: center;
  }

  .moment-form__actions {
    flex-direction: column;
    align-items: center;
  }

  .moment-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .moment-gallery__line {
    animation: none;
  }

  .moment-connector {
    animation: none;
  }
}
</style>
