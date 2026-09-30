<template>
  <div class="moment-page">
    <section class="moment-split">
      <div class="moment-split__left">
        <div class="nd-gallery" :aria-label="$t('nationalDayMoments.galleryLabel')">
          <header class="nd-gallery__head">
            <p>{{ $t('nationalDayMoments.galleryLabel') }}</p>
            <span>{{ $t('nationalDayMoments.galleryCount', { count: memories.length }) }}</span>
          </header>
          <div class="nd-gallery__grid">
            <button
              v-for="memory in memories"
              :key="memory.id"
              type="button"
              class="nd-card"
              :class="{ 'nd-card--active': activeMemory && activeMemory.id === memory.id }"
              @click="selectMemory(memory)"
            >
              <img :src="memory.imageUrl" :alt="memory.title || memory.note" />
              <span>{{ memory.title || excerpt(memory.note) }}</span>
            </button>
          </div>
        </div>
      </div>

      <aside class="moment-split__right">
        <div class="moment-panel__inner">
          <section v-if="activeMemory" class="memory-letter" :aria-label="$t('nationalDayMoments.memoryLetter')">
            <p class="memory-letter__eyebrow">{{ $t('nationalDayMoments.memoryLetter') }}</p>
            <img :src="activeMemory.imageUrl" :alt="$t('nationalDayMoments.memoryImage')" />
            <blockquote>{{ activeMemory.note }}</blockquote>
            <div class="memory-letter__actions">
              <button type="button" @click="copyShareLink">{{ $t('nationalDayMoments.copyLink') }}</button>
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
              </button>
            </div>
            <p class="moment-form__shortcut">{{ $t('nationalDayMoments.formShortcut') }}</p>
            <p class="moment-form__privacy">{{ $t('nationalDayMoments.publicStoryHint') }}</p>
            <div v-if="generating" class="moment-form__overlay" role="status">
              <span class="moment-form__paint-dots" aria-hidden="true"><i /><i /><i /></span>
              <span>{{ $t('nationalDayMoments.sharing') }}</span>
            </div>
          </div>

          <footer class="moment-panel__stats">
            <div class="moment-panel__stats-meta">
              <span class="moment-panel__stats-live">{{ $t('nationalDayMoments.communityLive') }}</span>
              <span class="moment-panel__stats-time">{{
                $t('nationalDayMoments.communityTime', { count: memories.length })
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
import { createPersonFromPicture } from '@/utils/avatarCrowd'
import {
  extractPictureId,
  extractPictureRecord,
  fetchPictureScenes,
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
  normalizeFeeling,
  seedMemories,
  toAbsoluteShareUrl,
} from '@/utils/nationalDayMoments'

export default {
  name: 'NationalDay',
  data() {
    return {
      subjectScene: '',
      selectedMemory: null,
      memories: seedMemories(),
      generating: false,
      placeholderIndex: 0,
      placeholderTimer: null,
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
    this.loadSharedFeelings()
    this.initWeChatShare()
    this.placeholderTimer = setInterval(() => {
      if (this.subjectScene.trim()) return
      this.placeholderIndex = (this.placeholderIndex + 1) % this.scenePlaceholderList.length
    }, 4000)
  },
  beforeUnmount() {
    clearInterval(this.placeholderTimer)
  },
  methods: {
    excerpt(text) {
      const value = String(text || '').trim()
      return value.length > 18 ? `${value.slice(0, 18)}…` : value
    },
    selectMemory(memory) {
      this.selectedMemory = memory
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
    async loadSharedFeelings() {
      try {
        const list = await fetchPictureScenes(this.$http, NATIONAL_DAY_PICTURE_TYPE)
        const seeds = seedMemories()
        const known = new Set(seeds.map((item) => normalizeFeeling(item.note)))
        const extra = list
          .map((item, index) => createPersonFromPicture(item, index))
          .filter((person) => person.imageUrl && !known.has(normalizeFeeling(person.note)))
        this.memories = [...seeds, ...extra]
      } catch (err) {
        console.error('[NationalDay] load feelings failed', err)
      }
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

        const dataUrl = await this.imageUrlToDataUrl(imageUrl)
        const response = await uploadPictureElement(this.$http, dataUrl, {
          title: buildNationalDayPictureTitle(sceneText),
          type: NATIONAL_DAY_PICTURE_TYPE,
          desc: sceneText,
          is_public: 1,
        })
        const record = extractPictureRecord(response)
        const pictureId = extractPictureId(record)
        const uploadedUrl = resolvePictureUrl(record) || dataUrl
        const memory = {
          id: pictureId || `nd-${Date.now()}`,
          title: buildNationalDayPictureTitle(sceneText),
          note: sceneText,
          imageUrl: uploadedUrl,
          isSeed: false,
          createdAt: record?.createdAt || new Date().toISOString(),
        }
        const known = new Set(this.memories.map((item) => item.id))
        if (!known.has(memory.id)) this.memories = [...this.memories, memory]
        this.selectedMemory = memory
        this.subjectScene = ''
        try {
          localStorage.setItem(STORAGE_KEY, uploadedUrl.startsWith('data:') ? '' : uploadedUrl)
          localStorage.setItem(SHARE_STORY_KEY, sceneText)
          if (pictureId) localStorage.setItem(MY_PICTURE_ID_KEY, pictureId)
        } catch {
          // ignore quota
        }
        ElMessage.success(this.$t('nationalDayMoments.generateSuccess'))
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
    async copyShareLink() {
      const memory = this.activeMemory
      if (!memory) return
      const url = memory.isSeed ? buildShareLink('') : buildShareLink(memory.id)
      const text = `${buildShareTitle(memory.note)}\n\n${this.$t('nationalDayMoments.invitationText')}\n${url}`
      try {
        await navigator.clipboard.writeText(text)
        ElMessage.success(this.$t('nationalDayMoments.linkCopied'))
      } catch {
        ElMessage.warning(this.$t('nationalDayMoments.copyManually'))
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
  --moment-cream: #f7f3ea;
  --moment-panel-bg: #f3ebe3;
  --moment-accent: #b85c4a;
  --moment-accent-deep: #8d4336;
  --moment-ink: #3e3834;
  --moment-muted: #7a736c;
  --moment-line: #e2d8ce;
  width: 100%;
  min-height: var(--moment-stage-height);
  background: var(--moment-cream);
  color: var(--moment-ink);
  text-align: left;
}
.moment-split {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(340px, 1fr);
  min-height: var(--moment-stage-height);
}
.moment-split__left {
  min-width: 0;
  height: var(--moment-stage-height);
  overflow: auto;
  padding: 28px 24px 40px;
  box-sizing: border-box;
}
.moment-split__right {
  min-height: var(--moment-stage-height);
  background: var(--moment-panel-bg);
  border-left: 1px solid var(--moment-line);
}
.moment-panel__inner {
  width: 100%;
  max-width: 560px;
  margin: auto;
  padding: 48px clamp(24px, 3vw, 56px);
  box-sizing: border-box;
}
.nd-gallery__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.nd-gallery__head p {
  margin: 0;
  font-family: 'Songti SC', 'Noto Serif SC', serif;
  font-size: 18px;
}
.nd-gallery__head span { color: var(--moment-muted); font-size: 13px; }
.nd-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.nd-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(62, 56, 52, 0.08);
  border-radius: 16px;
  background: #fffdf8;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;
}
.nd-card img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 10px;
  background: #f6f1e6;
  display: block;
}
.nd-card span {
  font-size: 13px;
  line-height: 1.45;
  padding: 0 4px 4px;
}
.nd-card--active,
.nd-card:hover {
  border-color: #e7c7be;
  box-shadow: 0 10px 24px -16px rgba(141, 67, 54, 0.45);
}
.moment-panel__head { margin-bottom: 28px; }
.moment-panel__head::before {
  content: '';
  display: block;
  width: 56px;
  height: 4px;
  margin-bottom: 22px;
  background: var(--moment-accent);
}
.moment-panel__title {
  margin: 0 0 14px;
  font-family: 'Songti SC', 'Noto Serif SC', serif;
  font-size: clamp(30px, 3vw, 44px);
  font-weight: 600;
  line-height: 1.3;
}
.moment-panel__guide { margin: 0; font-size: 14px; line-height: 1.85; color: var(--moment-muted); }
.moment-form__card { position: relative; }
.moment-form__input {
  display: block;
  width: 100%;
  min-height: 180px;
  padding: 18px;
  border: 1px solid #d8cfc6;
  border-radius: 10px;
  background: #fff;
  font: inherit;
  font-size: 16px;
  line-height: 1.8;
  color: var(--moment-ink);
  resize: vertical;
  box-sizing: border-box;
}
.moment-form__input:focus { outline: 2px solid rgba(184, 92, 74, 0.35); border-color: var(--moment-accent); }
.moment-form__actions { margin-top: 16px; }
.moment-btn {
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  background: var(--moment-accent);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.moment-btn:disabled { background: #e4cfc8; color: #8a6a62; cursor: not-allowed; }
.moment-form__shortcut,
.moment-form__privacy { margin: 10px 0 0; color: var(--moment-muted); font-size: 12px; text-align: center; }
.moment-form__overlay {
  position: absolute;
  inset: -8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 12px;
  background: rgba(247, 243, 234, 0.94);
}
.moment-form__paint-dots { display: flex; gap: 8px; }
.moment-form__paint-dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--moment-accent);
  animation: nd-bounce 1.2s ease-in-out infinite;
}
.moment-form__paint-dots i:nth-child(2) { animation-delay: 120ms; }
.moment-form__paint-dots i:nth-child(3) { animation-delay: 240ms; }
.moment-btn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: nd-spin 0.8s linear infinite;
}
.moment-panel__stats { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--moment-line); }
.moment-panel__stats-live { display: block; font-size: 13px; font-weight: 600; color: var(--moment-accent-deep); }
.moment-panel__stats-time { display: block; margin-top: 4px; font-size: 12px; color: var(--moment-muted); }
.memory-letter {
  margin: 0 0 28px;
  padding: 16px;
  background: #fffaf4;
  border: 1px solid #eadfd4;
  border-radius: 12px;
}
.memory-letter__eyebrow { margin: 0; font-size: 11px; letter-spacing: 0.18em; color: var(--moment-accent-deep); }
.memory-letter img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  margin: 12px 0;
  border-radius: 8px;
  background: #f6f1e6;
}
.memory-letter blockquote {
  margin: 0;
  max-height: 180px;
  overflow: auto;
  font-family: 'Songti SC', 'Noto Serif SC', serif;
  font-size: 16px;
  line-height: 1.8;
}
.memory-letter__actions { display: flex; gap: 8px; margin-top: 14px; }
.memory-letter__actions button {
  border: 1px solid #e2cfc6;
  border-radius: 6px;
  background: transparent;
  padding: 8px 12px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.memory-letter__actions button:first-child { background: var(--moment-accent); color: #fff; border-color: var(--moment-accent); }
.memory-prompts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.memory-prompts button {
  border: 1px solid #e4d8cc;
  border-radius: 999px;
  background: #fffaf4;
  padding: 7px 12px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
@keyframes nd-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes nd-spin { to { transform: rotate(360deg); } }
@media (max-width: 1024px) {
  .moment-split { grid-template-columns: 1fr; }
  .moment-split__right { grid-row: 1; min-height: auto; border-left: 0; border-bottom: 1px solid var(--moment-line); }
  .moment-split__left { height: auto; max-height: none; }
  .moment-panel__inner { padding: 32px 20px; }
}
</style>
