<template>
  <div class="moment-page">
    <section class="moment-split">
      <div class="moment-split__left">
        <ChildhoodAvatarCrowd
          ref="crowdRef"
          variant="hero"
          :picture-type="pictureType"
          :use-local-crowd="false"
          :scene-aspect="1"
          :highlight-id="highlightPictureId"
          @count-change="onCrowdUpdate"
          @select-memory="selectMemory"
        />
      </div>

      <aside class="moment-split__right">
        <div class="moment-panel__inner">
          <section v-if="activeMemory" class="memory-letter" :aria-label="$t('nationalDayMoments.memoryLetter')">
            <p class="memory-letter__eyebrow">{{ $t('nationalDayMoments.memoryLetter') }}</p>
            <img :src="activeMemory.imageUrl" :alt="$t('nationalDayMoments.memoryImage')" referrerpolicy="no-referrer" />
            <blockquote>{{ activeMemory.note }}</blockquote>
            <time v-if="memoryDate">{{ memoryDate }}</time>
            <div class="memory-letter__actions">
              <button type="button" @click="postcardOpen = true">{{ $t('nationalDayMoments.makePostcard') }}</button>
              <button type="button" @click="startWriting">{{ $t('nationalDayMoments.writeMine') }}</button>
            </div>
          </section>

          <header class="moment-panel__head">
            <h1 class="moment-panel__title">{{ $t('nationalDayMoments.pageTitle') }}</h1>
            <p class="moment-panel__guide">{{ $t('nationalDayMoments.formGuide') }}</p>
          </header>

          <div class="memory-prompts" :aria-label="$t('nationalDayMoments.promptLabel')">
            <button
              v-for="prompt in writingPrompts"
              :key="prompt.label"
              type="button"
              :disabled="generating"
              @click="usePrompt(prompt.text)"
            >
              {{ prompt.label }}
            </button>
          </div>

          <div class="moment-form__card" :class="{ 'moment-form__card--busy': generating }" :aria-busy="generating">
            <textarea
              id="national-day-scene"
              v-model="subjectScene"
              class="moment-form__input"
              rows="5"
              :aria-label="$t('nationalDayMoments.formGuide')"
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
                {{ generating ? $t('nationalDayMoments.sharing') : $t('nationalDayMoments.share') }}
                <svg v-if="!generating" class="moment-btn__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </div>
            <p class="moment-form__shortcut">{{ $t('nationalDayMoments.formShortcut') }}</p>
            <p class="moment-form__privacy">{{ $t('nationalDayMoments.publicStoryHint') }}</p>
            <div v-if="generating" class="moment-form__overlay" role="status">
              <span class="moment-form__paint-dots" aria-hidden="true"><i /><i /><i /></span>
              <span>{{ $t('nationalDayMoments.sharing') }}</span>
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
                referrerpolicy="no-referrer"
              />
            </div>
            <div class="moment-panel__stats-meta">
              <span class="moment-panel__stats-live">{{ $t('nationalDayMoments.communityLive') }}</span>
              <span class="moment-panel__stats-time">{{
                $t('nationalDayMoments.communityTime', { count: sceneCount, time: communityTimeLabel })
              }}</span>
            </div>
          </footer>
        </div>
      </aside>
    </section>
    <NationalDayPostcard v-model="postcardOpen" :memory="activeMemory" :crowd-srcs="postcardCrowdUrls" />
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { mapState } from 'vuex'
import ChildhoodAvatarCrowd from '@/components/childhood/ChildhoodAvatarCrowd.vue'
import NationalDayPostcard from '@/components/national-day/NationalDayPostcard.vue'
import { formatPostcardDate } from '@/utils/childhoodSharePoster'
import {
  extractPictureId,
  extractPictureRecord,
  resolvePictureUrl,
} from '@/utils/childhoodPictureApi'
import { loadImageBlob } from '@/utils/canvasImageCompose'
import { canvasToDataUrl } from '@/utils/canvasMatting'
import { loadImage } from '@/utils/lassoCrop'
import {
  postCreateCharacter,
  isCreateCharacterResponseOk,
  resolveGenerationImageUrl,
} from '@/utils/createCharacterTask'
import { uploadPictureElement } from '@/utils/saveCroppedAsset'
import {
  NATIONAL_DAY_PICTURE_TYPE,
  STORAGE_KEY,
  MY_PICTURE_ID_KEY,
  SHARE_STORY_KEY,
  buildNationalDayPrompt,
  buildNationalDayPictureTitle,
  buildShareLink,
  buildShareTitle,
  toAbsoluteShareUrl,
} from '@/utils/nationalDayMoments'

export default {
  name: 'NationalDay',
  components: { ChildhoodAvatarCrowd, NationalDayPostcard },
  data() {
    return {
      subjectScene: '',
      selectedMemory: null,
      memories: [],
      postcardOpen: false,
      pictureType: NATIONAL_DAY_PICTURE_TYPE,
      generating: false,
      placeholderIndex: 0,
      placeholderTimer: null,
      sceneCount: 0,
      sceneAvatars: [],
      communityClock: Date.now(),
      clockTimer: null,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
      wxShareReady: false,
    }
  },
  computed: {
    ...mapState(['isLogin']),
    writingPrompts() {
      const list = this.$tm('nationalDayMoments.writingPrompts')
      return Array.isArray(list) ? list : []
    },
    activeMemory() {
      if (this.selectedMemory) return this.selectedMemory
      const sharedId = String(this.$route.query.mine || '')
      if (sharedId) return this.memories.find((memory) => memory.id === sharedId) || null
      return null
    },
    scenePlaceholderList() {
      const list = this.$tm('nationalDayMoments.scenePlaceholders')
      if (Array.isArray(list) && list.length) return list
      return [this.$t('nationalDayMoments.scenePlaceholder')]
    },
    currentPlaceholder() {
      if (this.subjectScene.trim()) return ''
      return this.scenePlaceholderList[this.placeholderIndex % this.scenePlaceholderList.length]
    },
    generatedPrompt() {
      return buildNationalDayPrompt(this.subjectScene)
    },
    postcardCrowdUrls() {
      return this.memories
        .filter((memory) => memory.id !== this.activeMemory?.id)
        .slice(0, 4)
        .map((memory) => memory.imageUrl)
    },
    memoryDate() {
      return this.activeMemory?.createdAt ? formatPostcardDate(this.activeMemory.createdAt) : ''
    },
    highlightPictureId() {
      return this.$route.query.mine || localStorage.getItem(MY_PICTURE_ID_KEY) || ''
    },
    communityTimeLabel() {
      const d = new Date(this.communityClock)
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    },
  },
  watch: {
    '$route.query.mine'() {
      this.selectedMemory = null
    },
    activeMemory() {
      if (this.wxShareReady) this.applyWeChatShare()
    },
  },
  mounted() {
    this.$store.commit('closeMask')
    this.initWeChatShare()
    this.clockTimer = setInterval(() => {
      this.communityClock = Date.now()
    }, 60000)
    this.placeholderTimer = setInterval(() => {
      if (this.subjectScene.trim()) return
      this.placeholderIndex = (this.placeholderIndex + 1) % this.scenePlaceholderList.length
    }, 4000)
  },
  beforeUnmount() {
    clearInterval(this.placeholderTimer)
    clearInterval(this.clockTimer)
  },
  methods: {
    selectMemory(memory) {
      this.selectedMemory = memory
    },
    onCrowdUpdate(payload) {
      this.sceneCount = payload?.count || 0
      this.sceneAvatars = payload?.avatars || []
      this.memories = payload?.memories || []
    },
    startWriting() {
      this.$nextTick(() => {
        const input = this.$el.querySelector('#national-day-scene')
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        input?.focus({ preventScroll: true })
      })
    },
    usePrompt(text) {
      if (!this.subjectScene.trim()) this.subjectScene = text
      this.startWriting()
    },
    onSceneKeydown(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return
      e.preventDefault()
      if (this.generating || !this.subjectScene.trim()) return
      this.shareMoment()
    },
    ensureLogin() {
      if (this.isLogin && localStorage.getItem('token')) return true
      ElMessage.warning(this.$t('nationalDayMoments.pleaseLogin'))
      this.$store.commit('showMask')
      return false
    },
    async imageUrlToDataUrl(url) {
      const blob = await loadImageBlob(url, { http: this.$http, apiBaseUrl: this.apiBaseUrl })
      const objectUrl = URL.createObjectURL(blob)
      try {
        const image = await loadImage(objectUrl)
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth || image.width
        canvas.height = image.naturalHeight || image.height
        canvas.getContext('2d').drawImage(image, 0, 0)
        return canvasToDataUrl(canvas)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    },
    async shareMoment() {
      if (!this.generatedPrompt) {
        ElMessage.warning(this.$t('nationalDayMoments.sceneRequired'))
        return
      }
      if (!this.ensureLogin()) return

      const sceneText = this.subjectScene.trim()
      this.generating = true
      try {
        const responseData = await postCreateCharacter(
          this.$http,
          { prompt: this.generatedPrompt, size: '1024x1024' },
          { apiBaseUrl: this.apiBaseUrl }
        )
        if (responseData.allowed === false) {
          ElMessage({
            message: responseData.message || this.$t('nationalDayMoments.quotaExceeded'),
            type: 'error',
            offset: 200,
          })
          return
        }
        if (!isCreateCharacterResponseOk(responseData) || !responseData.message) {
          const errorMsg = responseData.message?.error || responseData.desc || responseData.error
          ElMessage({
            message: errorMsg || this.$t('nationalDayMoments.generateFailed'),
            type: 'error',
            offset: 200,
          })
          return
        }
        const result = responseData.message
        const imageUrl = resolveGenerationImageUrl(result, this.apiBaseUrl)
        if (!imageUrl) throw new Error('no image url')

        const previewId = `nd-${Date.now()}`
        const title = buildNationalDayPictureTitle(sceneText)
        const createdAt = new Date().toISOString()
        const previewRecord = {
          _id: previewId,
          title,
          description: sceneText,
          createdAt,
          content: /^https?:\/\//i.test(imageUrl) ? imageUrl : '',
        }
        this.selectedMemory = {
          id: previewId,
          title,
          note: sceneText,
          imageUrl,
          isSeed: false,
          createdAt,
        }
        await this.$refs.crowdRef?.refreshScenes({
          anchorId: previewId,
          freshRecord: previewRecord,
          freshImageUrl: imageUrl,
        })

        let pictureId = ''
        let storedUrl = /^https?:\/\//i.test(imageUrl) ? imageUrl : ''
        try {
          const dataUrl = await this.imageUrlToDataUrl(imageUrl)
          const response = await uploadPictureElement(this.$http, dataUrl, {
            title,
            type: NATIONAL_DAY_PICTURE_TYPE,
            desc: sceneText,
            is_public: 1,
          })
          const record = extractPictureRecord(response) || {}
          if (!record.description) record.description = sceneText
          pictureId = extractPictureId(record)
          const uploadedUrl = resolvePictureUrl(record)
          if (uploadedUrl && !uploadedUrl.startsWith('data:')) storedUrl = uploadedUrl
          if (pictureId) {
            this.selectedMemory = {
              ...this.selectedMemory,
              id: pictureId,
              createdAt: record.createdAt || createdAt,
            }
            await this.$refs.crowdRef?.refreshScenes({
              anchorId: pictureId,
              replaceId: previewId,
              freshRecord: record,
              freshImageUrl: imageUrl,
            })
          }
        } catch (persistErr) {
          console.warn('[NationalDay] picture persist failed, gallery keeps generated image', persistErr)
        }

        this.subjectScene = ''
        try {
          localStorage.setItem(STORAGE_KEY, storedUrl)
          localStorage.setItem(SHARE_STORY_KEY, sceneText)
          if (pictureId) localStorage.setItem(MY_PICTURE_ID_KEY, pictureId)
        } catch {
          // ignore quota
        }
        ElMessage.success(this.$t('nationalDayMoments.generateSuccess'))
        this.postcardOpen = true
        this.applyWeChatShare()
      } catch (err) {
        console.error('[NationalDay] shareMoment failed', err)
        ElMessage({
          message: err?.message || this.$t('nationalDayMoments.generateFailed'),
          type: 'error',
          offset: 200,
        })
      } finally {
        this.generating = false
      }
    },
    buildSharePayload() {
      const memory = this.activeMemory
      const story = memory?.note || localStorage.getItem(SHARE_STORY_KEY) || ''
      const pictureId = memory && !memory.isSeed ? memory.id : ''
      return {
        title: buildShareTitle(story),
        desc: this.$t('nationalDayMoments.invitationText'),
        link: buildShareLink(pictureId),
        imgUrl: toAbsoluteShareUrl(memory?.imageUrl || ''),
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
      if (this.wxShareReady) apply()
      else window.wx.ready(() => { this.wxShareReady = true; apply() })
    },
    async initWeChatShare() {
      if (typeof window === 'undefined') return
      if (!/MicroMessenger/i.test(window.navigator.userAgent) || !window.wx) return
      try {
        const url = window.location.href.split('#')[0]
        const res = await fetch(`https://api.kidstory.cc/wechat/js-signature?url=${encodeURIComponent(url)}`)
        const data = await res.json()
        const message = data?.message
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
  },
}
</script>

<style scoped>
.moment-page {
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
  --moment-accent: #c23b32;
  --moment-accent-deep: #9b2c26;
  --moment-ink: #4a2c28;
  --moment-muted: #8a675f;
  --moment-line: #f0d2c4;
  display: flex;
  min-width: 0;
  min-height: var(--moment-stage-height);
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(232, 184, 74, 0.28), transparent 46%),
    linear-gradient(180deg, #fff6ef 0%, #fde8dc 100%);
  border-left: 1px solid #f0c8b4;
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
  background: linear-gradient(90deg, #c23b32, #e8b84a);
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
  border: 1px solid #f0cfc0;
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
  box-shadow: 0 0 0 3px rgba(194, 59, 50, .14), 0 8px 22px rgba(155, 44, 38, .06);
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
  box-shadow: 0 6px 16px rgba(194, 59, 50, .22);
  transform: translateY(-2px);
}
.moment-btn:disabled { background: #f0cfc4; color: #a87870; cursor: not-allowed; }
.moment-btn__arrow { transition: transform 200ms ease; }
.moment-btn:hover:not(:disabled) .moment-btn__arrow { transform: translateX(3px); }
.moment-form__shortcut { margin: 12px 0 0; color: var(--moment-muted); font-size: 12px; text-align: center; line-height: 1.7; }
.moment-form__privacy { margin: 10px 0 0; color: #75766d; font-size: 11px; line-height: 1.6; text-align: center; }
.moment-form__overlay {
  position: absolute;
  inset: -10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  border-radius: 12px;
  background: rgba(255, 246, 239, .96);
  color: var(--moment-accent-deep);
  font-size: 14px;
}
.moment-form__paint-dots { display: flex; gap: 9px; align-items: center; height: 24px; }
.moment-form__paint-dots i { width: 13px; height: 13px; border-radius: 50%; background: #c23b32; animation: moment-paint 1.4s ease-in-out infinite; }
.moment-form__paint-dots i:nth-child(2) { background: #e8b84a; animation-delay: 160ms; }
.moment-form__paint-dots i:nth-child(3) { background: #e07a5f; animation-delay: 320ms; }
.moment-btn__spinner { width: 14px; height: 14px; border: 2px solid #f3c2b8; border-top-color: #fff; border-radius: 50%; animation: moment-spin 900ms linear infinite; }
.moment-panel__stats { display: flex; align-items: center; gap: 12px; margin-top: 36px; padding-top: 22px; border-top: 1px solid var(--moment-line); }
.moment-panel__stats-avatars { display: flex; flex-shrink: 0; }
.moment-panel__stats-avatar { width: 30px; height: 30px; margin-left: -8px; border: 2px solid var(--moment-panel-bg); border-radius: 50%; object-fit: cover; background: var(--moment-cream); }
.moment-panel__stats-avatar:first-child { margin-left: 0; }
.moment-panel__stats-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.moment-panel__stats-live { font-size: 12px; font-weight: 600; color: var(--moment-accent-deep); }
.moment-panel__stats-time { font-size: 11px; line-height: 1.6; color: var(--moment-muted); }
.memory-letter { padding: 22px; margin: 0 0 30px; background: #fffdf8; border: 1px solid #f0c4a8; box-shadow: 0 8px 20px rgba(194, 59, 50, 0.08); }
.memory-letter__eyebrow { color: #c23b32; font-size: 11px; letter-spacing: 3px; margin: 0; }
.memory-letter > img { display: block; width: min(100%, 220px); aspect-ratio: 1; height: auto; object-fit: cover; margin: 16px auto; border-radius: 18px; background: #f6f1e6; }
.memory-letter blockquote { margin: 12px 0; color: #51483e; font-family: 'Songti SC', 'SimSun', serif; font-size: 18px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 240px; overflow-y: auto; }
.memory-letter time { display: block; font: 12px Georgia, serif; color: #81796b; margin-top: 14px; }
.memory-letter__actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
.memory-letter__actions button { border: 1px solid #efc2b0; border-radius: 5px; background: transparent; color: #9b2c26; padding: 9px 12px; font: inherit; font-size: 12px; cursor: pointer; }
.memory-letter__actions button:first-child { background: #c23b32; color: white; border-color: #c23b32; }
.memory-prompts { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 18px; }
.memory-prompts button { border: 1px solid #efd0a2; border-radius: 20px; color: #8a4030; background: #fff8ec; padding: 8px 12px; font: inherit; font-size: 12px; cursor: pointer; }
.memory-prompts button:hover { background: #ffe8c2; border-color: #e8b84a; }
.memory-prompts button:disabled { opacity: .5; cursor: wait; }
@keyframes moment-arrive { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes moment-paint { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
@keyframes moment-spin { to { transform: rotate(360deg); } }
@media (max-width: 1024px) {
  .moment-split { grid-template-columns: 1fr; }
  .moment-split__right { grid-row: 1; min-height: auto; border-left: 0; border-bottom: 1px solid var(--moment-line); }
  .moment-panel__inner { max-width: 600px; padding: 40px 28px 32px; }
  .moment-panel__title { font-size: 34px; }
  .moment-form__input { min-height: 160px; }
  .moment-split__left { height: min(68dvh, 620px); min-height: 340px; padding: 24px 16px; }
}

@media (max-width: 768px) {
  .moment-page {
    background: #f6efe8;
  }
  .moment-split {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .moment-split__left {
    order: 0;
    height: 40dvh;
    min-height: 260px;
    padding: 6px 10px 0;
  }
  .moment-split__right {
    order: 1;
    margin-top: -22px;
    border: 0;
    border-radius: 28px 28px 0 0;
    box-shadow: 0 -18px 40px rgba(155, 44, 38, 0.08);
    min-height: 0;
  }
  .moment-panel__inner {
    max-width: none;
    padding: 26px 20px 8px;
  }
  .moment-panel__head {
    margin-bottom: 16px;
  }
  .moment-panel__head::before {
    width: 36px;
    height: 3px;
    margin-bottom: 14px;
  }
  .moment-panel__title {
    font-size: 30px;
    margin-bottom: 8px;
  }
  .moment-panel__guide {
    font-size: 15px;
    line-height: 1.7;
  }
  .memory-prompts {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin: 0 -20px 14px;
    padding: 0 20px 6px;
    scrollbar-width: none;
  }
  .memory-prompts::-webkit-scrollbar { display: none; }
  .memory-prompts button {
    flex-shrink: 0;
    padding: 8px 14px;
  }
  .moment-form__input {
    min-height: 128px;
    padding: 16px;
    border-radius: 16px;
    font-size: 16px;
  }
  .moment-form__actions { margin-top: 14px; }
  .moment-btn {
    min-height: 52px;
    border-radius: 14px;
  }
  .moment-form__shortcut { display: none; }
  .memory-letter {
    padding: 14px;
    margin-bottom: 18px;
    border-radius: 18px;
  }
  .memory-letter blockquote {
    font-size: 16px;
    max-height: 140px;
  }
  .memory-letter__actions button {
    min-height: 36px;
    border-radius: 999px;
    padding: 8px 14px;
  }
  .moment-panel__stats {
    margin-top: 18px;
    padding-top: 14px;
  }
}
</style>
