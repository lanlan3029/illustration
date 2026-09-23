<template>
  <div ref="pageRef" class="moment-page">
    <section class="moment-split">
      <div ref="crowdAreaRef" class="moment-split__left">
        <ChildhoodAvatarCrowd
          ref="crowdRef"
          variant="hero"
          :highlight-id="highlightPictureId"
          @count-change="onCrowdUpdate"
        />
      </div>

      <aside class="moment-split__right">
        <div class="moment-panel__glow moment-panel__glow--purple" aria-hidden="true" />
        <div class="moment-panel__glow moment-panel__glow--amber" aria-hidden="true" />
        <div class="moment-panel__noise" aria-hidden="true" />

        <div class="moment-panel__inner">
          <header class="moment-panel__head">
            <h1 class="moment-panel__title">{{ $t('childhoodMoments.pageTitle') }}</h1>
            <p class="moment-panel__guide">{{ $t('childhoodMoments.formGuide') }}</p>
          </header>

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
                class="moment-btn moment-btn--primary"
                :disabled="!subjectScene.trim() || generating"
                @click="shareMoment"
              >
                <span v-if="generating" class="moment-btn__spinner" aria-hidden="true" />
                {{ generating ? $t('childhoodMoments.sharing') : $t('childhoodMoments.share') }}
              </button>
            </div>
            <p class="moment-form__shortcut">{{ $t('childhoodMoments.formShortcut') }}</p>
            <div v-if="generating" class="moment-form__overlay" role="status">
              <span class="moment-form__overlay-spinner" aria-hidden="true" />
              <span>{{ $t('childhoodMoments.sharing') }}</span>
            </div>
          </div>

          <footer v-if="sceneCount > 0" class="moment-panel__stats">
            <div v-if="sceneAvatars.length" class="moment-panel__stats-avatars" aria-hidden="true">
              <img
                v-for="(url, index) in sceneAvatars"
                :key="`${url}-${index}`"
                class="moment-panel__stats-avatar"
                :src="url"
                alt=""
                decoding="async"
              />
            </div>
            <div class="moment-panel__stats-meta">
              <span class="moment-panel__stats-live">{{ $t('childhoodMoments.communityLive') }}</span>
              <span class="moment-panel__stats-time">{{
                $t('childhoodMoments.communityTime', { count: sceneCount, time: communityTimeLabel })
              }}</span>
            </div>
          </footer>
        </div>
      </aside>
    </section>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { mapState } from 'vuex'
import ChildhoodAvatarCrowd from '@/components/childhood/ChildhoodAvatarCrowd.vue'
import submitImage from '@/assets/images/submit.webp'
import { postCreateCharacter, isCreateCharacterResponseOk } from '@/utils/createCharacterTask'
import { canvasToDataUrl, matChildhoodCutoutFromUrl } from '@/utils/canvasMatting'
import { uploadPictureElement } from '@/utils/saveCroppedAsset'
import {
  CHILDHOOD_PICTURE_TYPE,
  CHILDHOOD_SHARE_POSTER_TYPE,
  extractPictureId,
  extractPictureRecord,
  fetchChildhoodScenes,
  pickCrowdImageUrls,
  resolvePictureUrl,
} from '@/utils/childhoodPictureApi'
import { hashSeed } from '@/utils/avatarCrowd'
import { drawChildhoodSharePoster } from '@/utils/childhoodSharePoster'
import {
  STORAGE_KEY,
  MY_PICTURE_ID_KEY,
  SHARE_STORY_KEY,
  SHARE_POSTER_URL_KEY,
  CHILDHOOD_MATTING_BG,
  buildChildhoodPrompt,
  buildChildhoodPictureTitle,
  buildShareTitle,
  buildShareDesc,
  buildShareLink,
  toAbsoluteShareUrl,
} from '@/utils/childhoodMoments'

export default {
  name: 'Childhood',
  components: { ChildhoodAvatarCrowd },
  data() {
    return {
      subjectScene: '',
      generating: false,
      generatedImageUrl: null,
      sharePosterUrl: '',
      lastShareStory: '',
      lastPictureId: '',
      wxShareReady: false,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
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
    highlightPictureId() {
      return this.$route.query.mine || this.lastPictureId || localStorage.getItem(MY_PICTURE_ID_KEY) || ''
    },
  },
  mounted() {
    this.$store.commit('closeMask')

    const savedImage = localStorage.getItem(STORAGE_KEY)
    if (savedImage) {
      this.generatedImageUrl = savedImage
    }
    this.sharePosterUrl = localStorage.getItem(SHARE_POSTER_URL_KEY) || ''
    this.lastShareStory = localStorage.getItem(SHARE_STORY_KEY) || ''
    this.lastPictureId = localStorage.getItem(MY_PICTURE_ID_KEY) || ''

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
      if (this.wxShareReady && (this.lastShareStory || localStorage.getItem(SHARE_STORY_KEY))) {
        this.applyWeChatShare()
      }
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

    buildSharePayload() {
      const story = this.lastShareStory || localStorage.getItem(SHARE_STORY_KEY) || ''
      const pictureId = this.lastPictureId || localStorage.getItem(MY_PICTURE_ID_KEY) || ''
      const posterUrl = this.sharePosterUrl || localStorage.getItem(SHARE_POSTER_URL_KEY) || ''
      const imgUrl = toAbsoluteShareUrl(
        posterUrl || this.generatedImageUrl || this.submitImage
      )

      return {
        title: buildShareTitle(story),
        desc: buildShareDesc(this.sceneCount),
        link: buildShareLink(pictureId || this.highlightPictureId),
        imgUrl,
      }
    },

    applyWeChatShare() {
      if (typeof window === 'undefined' || !window.wx) return
      const payload = this.buildSharePayload()
      const apply = () => {
        window.wx.updateAppMessageShareData?.(payload)
        window.wx.updateTimelineShareData?.({
          title: payload.title,
          link: payload.link,
          imgUrl: payload.imgUrl,
        })
      }
      if (this.wxShareReady) {
        apply()
      } else {
        window.wx.ready(() => {
          this.wxShareReady = true
          apply()
        })
      }
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
          this.wxShareReady = true
          this.applyWeChatShare()
        })
      } catch {
        // ignore
      }
    },

    async saveChildhoodPicture(cutoutDataUrl, description) {
      const response = await uploadPictureElement(this.$http, cutoutDataUrl, {
        title: buildChildhoodPictureTitle(description),
        type: CHILDHOOD_PICTURE_TYPE,
        desc: description,
        is_public: 1,
      })
      return extractPictureRecord(response)
    },

    async buildAndUploadSharePoster(cutoutDataUrl, sceneText, pictureId, crowdList) {
      const crowdUrls = pickCrowdImageUrls(crowdList, {
        excludeId: pictureId,
        limit: 10,
        seed: hashSeed(pictureId || sceneText),
      })

      const posterDataUrl = await drawChildhoodSharePoster({
        heroSrc: cutoutDataUrl,
        crowdSrcs: crowdUrls,
        seed: hashSeed(`${pictureId}-${sceneText}`),
      })

      const response = await uploadPictureElement(this.$http, posterDataUrl, {
        title: `${buildChildhoodPictureTitle(sceneText)} · 分享`,
        type: CHILDHOOD_SHARE_POSTER_TYPE,
        desc: sceneText,
        is_public: 0,
      })

      const record = extractPictureRecord(response)
      return resolvePictureUrl(record)
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
      if (this.generating || !this.subjectScene.trim()) return
      this.shareMoment()
    },

    async shareMoment() {
      if (!this.generatedPrompt) {
        ElMessage.warning(this.$t('childhoodMoments.sceneRequired'))
        return
      }
      if (!this.ensureLogin()) return

      const sceneText = this.subjectScene.trim()

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
          const cutoutCanvas = await matChildhoodCutoutFromUrl(imageUrl, CHILDHOOD_MATTING_BG)
          const cutoutDataUrl = canvasToDataUrl(cutoutCanvas)
          this.generatedImageUrl = cutoutDataUrl
          localStorage.setItem(STORAGE_KEY, cutoutDataUrl)

          const pictureRecord = await this.saveChildhoodPicture(cutoutDataUrl, sceneText)
          const pictureId = extractPictureId(pictureRecord)
          const crowdList = await fetchChildhoodScenes(this.$http)

          this.lastShareStory = sceneText
          this.lastPictureId = pictureId
          localStorage.setItem(SHARE_STORY_KEY, sceneText)
          if (pictureId) {
            localStorage.setItem(MY_PICTURE_ID_KEY, pictureId)
          }

          try {
            const posterUrl = await this.buildAndUploadSharePoster(
              cutoutDataUrl,
              sceneText,
              pictureId,
              crowdList
            )
            if (posterUrl) {
              this.sharePosterUrl = posterUrl
              localStorage.setItem(SHARE_POSTER_URL_KEY, posterUrl)
            }
          } catch (err) {
            console.warn('[Childhood] share poster failed', err)
          }

          await this.$refs.crowdRef?.refreshScenes({
            anchorId: pictureId,
            freshRecord: pictureRecord,
            freshImageUrl: cutoutDataUrl,
          })

          ElMessage.success(this.$t('childhoodMoments.generateSuccess'))
          this.subjectScene = ''
          this.applyWeChatShare()
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
  padding: clamp(12px, 2vw, 24px) clamp(10px, 1.5vw, 16px) clamp(20px, 3vw, 32px);
  background: var(--moment-cream);
  box-sizing: border-box;
}

.moment-split__left :deep(.scene-gallery--hero) {
  flex: 1;
  min-height: 0;
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
  min-height: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 40px) clamp(20px, 3.5vw, 36px) clamp(32px, 5vw, 48px);
  box-sizing: border-box;
}

.moment-panel__head {
  margin-bottom: clamp(20px, 3vw, 28px);
}

.moment-panel__title {
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

.moment-panel__stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: clamp(24px, 4vw, 36px);
}

.moment-panel__stats-avatars {
  display: flex;
  flex-shrink: 0;
  padding-left: 4px;
}

.moment-panel__stats-avatar {
  width: 28px;
  height: 28px;
  margin-left: -8px;
  border: 2px solid var(--moment-panel-bg);
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.12);
}

.moment-panel__stats-avatar:first-child {
  margin-left: 0;
}

.moment-panel__stats-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.moment-panel__stats-live {
  font-size: 12px;
  font-weight: 600;
  color: var(--moment-accent);
  letter-spacing: 0.04em;
}

.moment-panel__stats-time {
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
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.moment-form__actions .moment-btn {
  width: 100%;
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
}
</style>
