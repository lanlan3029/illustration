<template>
  <div
    class="moment-page"
    @mousemove="handleParallax"
    @mouseleave="resetParallax"
  >
    <canvas ref="bokehCanvas" class="moment-bokeh" aria-hidden="true" />

    <div class="moment-hero-art" :style="heroArtStyle" aria-hidden="true">
      <ChildrenCuateIllustration :playing="!prefersReducedMotion" />
    </div>

    <!-- 背景漂浮拍立得装饰 -->
    <div class="moment-deco" aria-hidden="true">
      <div
        v-for="(deco, i) in decoPolaroids"
        :key="i"
        class="moment-deco__item"
        :style="decoStyle(i)"
      >
        <PolaroidFrame :rotate="deco.rotate" :tape-hue="deco.tapeHue" :revealed="false">
          <div class="moment-deco__placeholder" :style="{ background: deco.gradient }" />
        </PolaroidFrame>
      </div>
    </div>

    <div class="moment-shell">
      <header class="moment-header">
        <p class="moment-eyebrow">{{ $t('childhoodMoments.eyebrow') }}</p>
        <h1 class="moment-title">{{ $t('childhoodMoments.title') }}</h1>
        <p class="moment-lead">{{ $t('childhoodMoments.lead') }}</p>
        <router-link to="/newyear/gallery" class="moment-gallery-link">
          {{ $t('childhoodMoments.viewWall') }}
          <span class="moment-gallery-link__arrow">→</span>
        </router-link>
      </header>

      <div class="moment-stage">
        <PolaroidFrame
          :caption="polaroidCaption"
          :rotate="-1.5"
          :tape-hue="48"
          :revealed="!!generatedImageUrl && !generating"
          :developing="justGenerated"
        >
          <div v-if="generating" class="moment-generating">
            <span class="moment-generating__dot" />
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
            <span class="moment-empty__icon">📷</span>
            <p>{{ $t('childhoodMoments.emptyHint') }}</p>
          </div>
        </PolaroidFrame>

        <div v-if="generatedImageUrl && !generating" class="moment-actions">
          <el-button type="primary" size="small" :loading="collecting" @click="collectIllustration">
            {{ $t('childhoodMoments.stickToWall') }}
          </el-button>
          <el-button size="small" :loading="downloading" @click="downloadIllustration">
            {{ $t('childhoodMoments.download') }}
          </el-button>
          <el-button size="small" text @click="clearGeneratedImage">
            {{ $t('childhoodMoments.clear') }}
          </el-button>
        </div>
      </div>

      <div class="moment-input">
        <label class="moment-input__label" for="moment-scene">
          {{ $t('childhoodMoments.sceneLabel') }}
        </label>
        <el-input
          id="moment-scene"
          v-model="subjectScene"
          type="textarea"
          :rows="3"
          :placeholder="$t('childhoodMoments.scenePlaceholder')"
          class="moment-textarea"
        />
        <el-button
          type="primary"
          class="moment-generate-btn"
          :loading="generating"
          :disabled="!subjectScene.trim() || generating"
          @click="generateIllustration"
        >
          {{ generating ? $t('childhoodMoments.generating') : $t('childhoodMoments.generate') }}
        </el-button>
      </div>

      <section v-if="recentItems.length" class="moment-recent">
        <div class="moment-recent__head">
          <h2>{{ $t('childhoodMoments.recentWall') }}</h2>
          <router-link to="/newyear/gallery">{{ $t('childhoodMoments.seeAll') }}</router-link>
        </div>
        <div class="moment-recent__scroll">
          <button
            v-for="(item, index) in recentItems"
            :key="item._id || index"
            type="button"
            class="moment-recent__item"
            :style="{ '--item-rotate': `${(index % 5 - 2) * 1.2}deg` }"
            @click="previewRecent(item)"
          >
            <PolaroidFrame
              :rotate="(index % 5 - 2) * 1.2"
              :tape-hue="38 + index * 14"
              :revealed="false"
              interactive
            >
              <img :src="getImageUrl(item)" alt="" loading="lazy" />
            </PolaroidFrame>
          </button>
        </div>
      </section>
    </div>

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
</template>

<script>
import { ElMessage } from 'element-plus'
import PolaroidFrame from '@/components/childhood/PolaroidFrame.vue'
import ChildrenCuateIllustration from '@/components/childhood/ChildrenCuateIllustration.vue'
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

const DECO_GRADIENTS = [
  'linear-gradient(145deg, #ffd4a8 0%, #ffb5c2 100%)',
  'linear-gradient(145deg, #b8e6d0 0%, #d4c5f9 100%)',
  'linear-gradient(145deg, #ffe8c8 0%, #ffc9de 100%)',
]

export default {
  name: 'NewYear',
  components: { PolaroidFrame, ChildrenCuateIllustration },
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
      bokehAnimationId: null,
      bokehParticles: [],
      resizeHandler: null,
      parallax: { x: 0, y: 0 },
      prefersReducedMotion: false,
      submitImage,
      decoPolaroids: [
        { rotate: -6, tapeHue: 42, gradient: DECO_GRADIENTS[0] },
        { rotate: 4, tapeHue: 120, gradient: DECO_GRADIENTS[1] },
        { rotate: -3, tapeHue: 320, gradient: DECO_GRADIENTS[2] },
      ],
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
    heroArtStyle() {
      return {
        transform: `translate(${this.parallax.x * 1.4}px, ${this.parallax.y}px)`,
      }
    },
  },
  mounted() {
    this.$store.commit('closeMask')
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const savedImage = localStorage.getItem(STORAGE_KEY)
    if (savedImage) {
      this.generatedImageUrl = savedImage
    }

    this.loadRecentItems()
    if (!this.prefersReducedMotion) {
      this.initBokeh()
    }
    this.initWeChatShare()
  },
  beforeUnmount() {
    if (this.bokehAnimationId) {
      cancelAnimationFrame(this.bokehAnimationId)
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  },
  methods: {
    decoStyle(index) {
      const offsets = [
        { top: '8%', left: '4%' },
        { top: '14%', right: '6%' },
        { bottom: '18%', left: '8%' },
      ]
      const base = offsets[index] || offsets[0]
      const px = this.parallax.x * (index + 1) * 0.6
      const py = this.parallax.y * (index + 1) * 0.6
      return {
        ...base,
        transform: `translate(${px}px, ${py}px)`,
      }
    },
    handleParallax(e) {
      if (this.prefersReducedMotion) return
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      this.parallax = {
        x: (e.clientX - cx) / cx * 6,
        y: (e.clientY - cy) / cy * 4,
      }
    },
    resetParallax() {
      this.parallax = { x: 0, y: 0 }
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
        this.recentItems = merged.slice(0, 8)
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

    initBokeh() {
      this.$nextTick(() => {
        const canvas = this.$refs.bokehCanvas
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const resize = () => {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
        }
        resize()

        const colors = [
          'rgba(255, 212, 168, 0.35)',
          'rgba(255, 181, 194, 0.3)',
          'rgba(184, 230, 208, 0.28)',
          'rgba(212, 197, 249, 0.25)',
        ]

        this.bokehParticles = Array.from({ length: 22 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 28 + 12,
          dx: (Math.random() - 0.5) * 0.15,
          dy: (Math.random() - 0.5) * 0.12,
          color: colors[Math.floor(Math.random() * colors.length)],
          phase: Math.random() * Math.PI * 2,
        }))

        const animate = (t) => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          this.bokehParticles.forEach((p) => {
            p.x += p.dx
            p.y += p.dy
            if (p.x < -p.r) p.x = canvas.width + p.r
            if (p.x > canvas.width + p.r) p.x = -p.r
            if (p.y < -p.r) p.y = canvas.height + p.r
            if (p.y > canvas.height + p.r) p.y = -p.r

            const pulse = 0.85 + Math.sin(t * 0.001 + p.phase) * 0.15
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * pulse)
            gradient.addColorStop(0, p.color)
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2)
            ctx.fill()
          })
          this.bokehAnimationId = requestAnimationFrame(animate)
        }

        animate(0)
        this.resizeHandler = resize
        window.addEventListener('resize', this.resizeHandler)
      })
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
  min-height: 100vh;
  padding: 20px 16px 40px;
  box-sizing: border-box;
  background-color: #faf6f0;
  background-image:
    radial-gradient(circle at 12% 18%, rgba(255, 212, 168, 0.35) 0%, transparent 42%),
    radial-gradient(circle at 88% 12%, rgba(255, 181, 194, 0.28) 0%, transparent 38%),
    radial-gradient(circle at 70% 88%, rgba(184, 230, 208, 0.22) 0%, transparent 40%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  position: relative;
  overflow: hidden;
}

.moment-bokeh {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.moment-hero-art {
  position: fixed;
  right: max(-8px, calc((100vw - 520px) / 2 - 280px));
  bottom: 6%;
  z-index: 1;
  opacity: 0.92;
  transition: transform 0.25s ease-out;
}

.moment-hero-art :deep(.children-cuate) {
  --cuate-size: clamp(150px, 32vw, 260px);
}

@media (max-width: 640px) {
  .moment-hero-art {
    right: -20px;
    bottom: 2%;
    opacity: 0.5;
  }

  .moment-hero-art :deep(.children-cuate) {
    --cuate-size: clamp(120px, 38vw, 170px);
  }
}

.moment-deco {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.moment-deco__item {
  position: absolute;
  width: min(120px, 22vw);
  opacity: 0.55;
  animation: deco-float 7s ease-in-out infinite;
  transition: transform 0.2s ease-out;
}

.moment-deco__item:nth-child(2) {
  animation-delay: -2.3s;
  width: min(100px, 18vw);
}

.moment-deco__item:nth-child(3) {
  animation-delay: -4.1s;
  width: min(90px, 16vw);
}

.moment-deco__placeholder {
  width: 100%;
  height: 100%;
}

.moment-shell {
  position: relative;
  z-index: 2;
  max-width: 520px;
  margin: 0 auto;
}

.moment-header {
  text-align: center;
  margin-bottom: 20px;
}

.moment-eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #a0897a;
}

.moment-title {
  margin: 0 0 8px;
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  font-size: clamp(26px, 6vw, 34px);
  font-weight: 700;
  color: #5c4a3a;
  line-height: 1.25;
}

.moment-lead {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.6;
  color: #7d6a5c;
}

.moment-gallery-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #6b5344;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(100, 80, 60, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.moment-gallery-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(100, 80, 60, 0.12);
}

.moment-gallery-link__arrow {
  transition: transform 0.2s ease;
}

.moment-gallery-link:hover .moment-gallery-link__arrow {
  transform: translateX(3px);
}

.moment-stage {
  margin-bottom: 18px;
}

.moment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
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
  color: #8a7568;
  font-size: 13px;
  text-align: center;
  padding: 16px;
  box-sizing: border-box;
}

.moment-generating__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffb5c2;
  margin-bottom: 10px;
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.moment-empty__icon {
  font-size: 28px;
  margin-bottom: 8px;
  opacity: 0.7;
}

.moment-input__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #6b5344;
}

.moment-textarea :deep(.el-textarea__inner) {
  border-radius: 12px;
  border-color: rgba(160, 137, 122, 0.25);
  background: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.55;
}

.moment-textarea :deep(.el-textarea__inner:focus) {
  border-color: #ffb5c2;
  box-shadow: 0 0 0 2px rgba(255, 181, 194, 0.2);
}

.moment-generate-btn {
  width: 100%;
  margin-top: 10px;
  height: 44px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffb5c2 0%, #ffd4a8 100%);
  color: #5c4030;
}

.moment-generate-btn:hover,
.moment-generate-btn:focus {
  background: linear-gradient(135deg, #ffa8b8 0%, #ffc995 100%);
  color: #5c4030;
}

.moment-recent {
  margin-top: 28px;
}

.moment-recent__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.moment-recent__head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #6b5344;
}

.moment-recent__head a {
  font-size: 12px;
  color: #a0897a;
  text-decoration: none;
}

.moment-recent__scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.moment-recent__item {
  flex: 0 0 120px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  scroll-snap-align: start;
}

.moment-preview-image {
  width: 100%;
  max-height: 60vh;
}

@keyframes deco-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.35);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .moment-page {
    padding: 12px 12px 32px;
  }

  .moment-deco__item {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .moment-deco__item {
    animation: none;
  }
}
</style>
