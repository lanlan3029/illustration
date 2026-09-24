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
              :aria-label="$t('childhoodMoments.formGuide')"
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
                <svg v-if="!generating" class="moment-btn__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </div>
            <p class="moment-form__shortcut">{{ $t('childhoodMoments.formShortcut') }}</p>
            <div v-if="generating" class="moment-form__overlay" role="status">
              <span class="moment-form__paint-dots" aria-hidden="true"><i /><i /><i /></span>
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
import {
  postCreateCharacter,
  isCreateCharacterResponseOk,
  resolveGenerationImageUrl,
} from '@/utils/createCharacterTask'
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

    safeStorageSet(key, value) {
      try {
        if (typeof value === 'string' && value.length > 900000) return
        localStorage.setItem(key, value)
      } catch (err) {
        console.warn('[Childhood] localStorage set failed', key, err)
      }
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

        const imageUrl = resolveGenerationImageUrl(result, this.apiBaseUrl)

        if (imageUrl) {
          const cutoutCanvas = await matChildhoodCutoutFromUrl(imageUrl, CHILDHOOD_MATTING_BG, {
            http: this.$http,
            apiBaseUrl: this.apiBaseUrl,
          })
          const cutoutDataUrl = canvasToDataUrl(cutoutCanvas)
          this.generatedImageUrl = cutoutDataUrl
          this.safeStorageSet(STORAGE_KEY, cutoutDataUrl)

          const pictureRecord = await this.saveChildhoodPicture(cutoutDataUrl, sceneText)
          const pictureId = extractPictureId(pictureRecord)
          const uploadedUrl = resolvePictureUrl(pictureRecord)

          this.lastShareStory = sceneText
          this.lastPictureId = pictureId
          this.safeStorageSet(SHARE_STORY_KEY, sceneText)
          if (pictureId) {
            this.safeStorageSet(MY_PICTURE_ID_KEY, pictureId)
          }
          if (uploadedUrl) {
            this.generatedImageUrl = uploadedUrl
          }

          // 先展示已抠图的本地 PNG，列表与分享海报失败不应阻断 gallery。
          await this.$refs.crowdRef?.refreshScenes({
            anchorId: pictureId,
            freshRecord: pictureRecord,
            freshImageUrl: cutoutDataUrl,
          })

          try {
            const crowdList = await fetchChildhoodScenes(this.$http)
            const posterUrl = await this.buildAndUploadSharePoster(
              cutoutDataUrl,
              sceneText,
              pictureId,
              crowdList
            )
            if (posterUrl) {
              this.sharePosterUrl = posterUrl
              this.safeStorageSet(SHARE_POSTER_URL_KEY, posterUrl)
            }
          } catch (err) {
            console.warn('[Childhood] share poster failed', err)
          }

          ElMessage.success(this.$t('childhoodMoments.generateSuccess'))
          this.subjectScene = ''
          this.applyWeChatShare()
        } else {
          throw new Error('no image url')
        }
      } catch (err) {
        console.error('[Childhood] shareMoment failed', err)
        const detail = err?.message || err?.response?.data?.message
        ElMessage({
          message: detail || this.$t('childhoodMoments.generateFailed'),
          type: 'error',
          offset: 200,
        })
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
  /* App shell: 50px navigation + 40px footer on desktop. */
  --moment-stage-height: calc(100dvh - 90px);
  --moment-cream: #f8f5ef;
  --moment-panel-bg: #f0eae0;
  --moment-accent: #587784;
  --moment-accent-deep: #425e69;
  --moment-ink: #3e403b;
  --moment-muted: #75766d;
  --moment-line: #d9d5cb;
  width: 100%;
  min-height: var(--moment-stage-height);
  background: var(--moment-cream);
  color: var(--moment-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
  text-align: left;
}
.moment-split {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(360px, 1fr);
  min-height: var(--moment-stage-height);
}
.moment-split__left {
  display: flex;
  min-width: 0;
  height: var(--moment-stage-height);
  padding: clamp(24px, 3vw, 48px) clamp(16px, 2vw, 36px);
  box-sizing: border-box;
}
.moment-split__left :deep(.scene-gallery--hero) { flex: 1; min-height: 0; }
.moment-split__right {
  display: flex;
  min-width: 0;
  min-height: var(--moment-stage-height);
  background: var(--moment-panel-bg);
  border-left: 1px solid var(--moment-line);
}
.moment-panel__inner {
  width: 100%;
  max-width: 560px;
  margin: auto;
  padding: 64px clamp(28px, 3.4vw, 64px);
  box-sizing: border-box;
  animation: moment-arrive 700ms cubic-bezier(.22, 1, .36, 1) both;
}
.moment-panel__head { margin-bottom: 36px; }
.moment-panel__head::before {
  content: '';
  display: block;
  width: 56px;
  height: 4px;
  margin-bottom: 26px;
  background: #cf806a;
}
.moment-panel__title {
  margin: 0 0 18px;
  font-family: 'Songti SC', 'Noto Serif SC', 'STSong', 'SimSun', serif;
  font-size: clamp(30px, 3.1vw, 48px);
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: .025em;
  color: var(--moment-ink);
}
.moment-panel__guide { margin: 0; font-size: 14px; line-height: 1.9; color: var(--moment-muted); }
.moment-form__card { position: relative; width: 100%; }
.moment-form__input {
  display: block;
  width: 100%;
  min-height: 214px;
  padding: 22px;
  border: 1px solid #d2cfc6;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(81, 78, 75, .025);
  font: inherit;
  font-size: 16px;
  line-height: 1.85;
  color: var(--moment-ink);
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 220ms ease, box-shadow 220ms ease;
}
.moment-form__input:focus {
  border-color: var(--moment-accent);
  box-shadow: 0 0 0 3px rgba(88, 119, 132, .12), 0 8px 22px rgba(81, 78, 75, .04);
}
.moment-form__input::placeholder { color: #86867d; }
.moment-form__actions { margin-top: 22px; }
.moment-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 50px;
  padding: 12px 24px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}
.moment-btn--primary { background: var(--moment-accent); color: #fff; }
.moment-btn--primary:hover:not(:disabled) {
  background: var(--moment-accent-deep);
  box-shadow: 0 6px 16px rgba(88, 119, 132, .16);
  transform: translateY(-2px);
}
.moment-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
.moment-btn:focus-visible { outline: 2px solid var(--moment-accent); outline-offset: 4px; }
.moment-btn:disabled { background: #d2dcd9; color: #566a68; cursor: not-allowed; }
.moment-btn__arrow { transition: transform 200ms ease; }
.moment-btn:hover:not(:disabled) .moment-btn__arrow { transform: translateX(3px); }
.moment-form__shortcut { margin: 12px 0 0; color: var(--moment-muted); font-size: 12px; text-align: center; line-height: 1.7; }
.moment-form__overlay {
  position: absolute;
  inset: -10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  border-radius: 12px;
  background: rgba(248, 245, 239, .96);
  color: var(--moment-accent-deep);
  font-size: 14px;
  animation: moment-arrive 240ms ease both;
}
.moment-form__paint-dots { display: flex; gap: 9px; align-items: center; height: 24px; }
.moment-form__paint-dots i { width: 13px; height: 13px; border-radius: 50%; background: #86aaa1; animation: moment-paint 1.4s ease-in-out infinite; }
.moment-form__paint-dots i:nth-child(2) { background: #cf806a; animation-delay: 160ms; }
.moment-form__paint-dots i:nth-child(3) { background: #d5c17b; animation-delay: 320ms; }
.moment-btn__spinner { width: 14px; height: 14px; border: 2px solid #b0c0bb; border-top-color: var(--moment-accent); border-radius: 50%; animation: moment-spin 900ms linear infinite; }
.moment-panel__stats { display: flex; align-items: center; gap: 12px; margin-top: 36px; padding-top: 22px; border-top: 1px solid var(--moment-line); }
.moment-panel__stats-avatars { display: flex; flex-shrink: 0; }
.moment-panel__stats-avatar { width: 30px; height: 30px; margin-left: -8px; border: 2px solid var(--moment-panel-bg); border-radius: 50%; object-fit: cover; background: var(--moment-cream); }
.moment-panel__stats-avatar:first-child { margin-left: 0; }
.moment-panel__stats-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.moment-panel__stats-live { font-size: 12px; font-weight: 600; color: var(--moment-accent-deep); }
.moment-panel__stats-time { font-size: 11px; line-height: 1.6; color: var(--moment-muted); }
@keyframes moment-arrive { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes moment-paint { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
@keyframes moment-spin { to { transform: rotate(360deg); } }
@media (max-width: 1024px) {
  .moment-split { grid-template-columns: 1fr; }
  .moment-split__right { grid-row: 1; min-height: auto; border-left: 0; border-bottom: 1px solid var(--moment-line); }
  .moment-panel__inner { max-width: 600px; padding: 40px 28px 32px; }
  .moment-panel__head { margin-bottom: 24px; }
  .moment-panel__head::before { width: 40px; margin-bottom: 18px; }
  .moment-panel__title { font-size: 34px; }
  .moment-form__input { min-height: 160px; }
  .moment-panel__stats { margin-top: 24px; padding-top: 18px; }
  .moment-split__left { height: min(68dvh, 620px); min-height: 340px; padding: 24px 16px; }
}
@media (max-width: 380px) {
  .moment-panel__inner { padding: 32px 20px 28px; }
  .moment-panel__title { font-size: 30px; }
  .moment-form__input { padding: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
</style>
