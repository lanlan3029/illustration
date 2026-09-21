<template>
  <div class="exhibit-page">
    <div class="exhibit-page__bg" aria-hidden="true" />
    <div class="exhibit-page__veil" aria-hidden="true" />

    <header class="exhibit-header">
      <router-link to="/childhood" class="exhibit-back">{{ $t('childhoodMoments.backToCreate') }}</router-link>
      <h1 class="exhibit-title">{{ $t('childhoodMoments.exhibitTitle') }}</h1>
      <p class="exhibit-subtitle">{{ $t('childhoodMoments.exhibitSubtitle', { count: totalCount }) }}</p>
    </header>

    <div v-if="loading && !allIllustrations.length" class="exhibit-loading">
      <span class="exhibit-loading__line" />
      <p>{{ $t('childhoodMoments.wallLoading') }}</p>
    </div>

    <div
      v-else
      ref="viewportRef"
      class="exhibit-viewport"
      @scroll="handleScroll"
    >
      <div v-if="!allIllustrations.length" class="exhibit-empty">
        <p>{{ $t('childhoodMoments.wallEmpty') }}</p>
        <router-link to="/childhood" class="exhibit-empty__cta">
          {{ $t('childhoodMoments.wallEmptyCta') }}
        </router-link>
      </div>

      <div v-else class="exhibit-wall">
        <button
          v-for="(item, index) in allIllustrations"
          :key="item._id || index"
          ref="wallItems"
          type="button"
          class="exhibit-piece"
          :class="[
            `exhibit-piece--${exhibitLayout(index).size}`,
            { 'exhibit-piece--visible': visibleIds.has(item._id || String(index)) },
          ]"
          :style="exhibitStyle(index)"
          @click="openPreview(item, index)"
        >
          <GalleryArtFrame
            :variant="frameVariant(index)"
            :caption="itemCaption(item)"
            :date="item.createdAt ? formatDateShort(item.createdAt) : ''"
          >
            <img
              :src="getImageUrl(item)"
              :alt="itemCaption(item)"
              loading="lazy"
            />
          </GalleryArtFrame>
        </button>
      </div>

      <p v-if="loadingMore" class="exhibit-loading-more">{{ $t('childhoodMoments.wallLoadingMore') }}</p>
    </div>

    <el-dialog
      v-model="previewVisible"
      :title="currentItem?.title || $t('childhoodMoments.previewTitle')"
      width="min(92vw, 720px)"
      class="exhibit-preview-dialog"
      @closed="closePreview"
    >
      <div v-if="currentItem" class="exhibit-preview">
        <GalleryArtFrame
          :variant="frameVariant(currentIndex)"
          :caption="itemCaption(currentItem)"
          :date="currentItem.createdAt ? formatDateShort(currentItem.createdAt) : ''"
          class="exhibit-preview__frame"
        >
          <img :src="getImageUrl(currentItem)" alt="" />
        </GalleryArtFrame>
        <div class="exhibit-preview__info">
          <p v-if="currentItem.owner">
            <strong>{{ $t('childhoodMoments.author') }}</strong>
            {{ currentItem.owner.name || $t('childhoodMoments.anonymous') }}
          </p>
          <p v-if="currentItem.createdAt">
            <strong>{{ $t('childhoodMoments.time') }}</strong>
            {{ formatDate(currentItem.createdAt) }}
          </p>
          <p v-if="currentItem.description" class="exhibit-preview__desc">
            {{ currentItem.description }}
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import GalleryArtFrame from '@/components/childhood/GalleryArtFrame.vue'
import galleryBg from '@/assets/images/newyear/gallery-bg-golden-road.jpg'
import {
  ILL_TYPES_GALLERY,
  getExhibitLayout,
  getFrameVariant,
  getIllustrationUrl,
} from '@/utils/childhoodMoments'

export default {
  name: 'ChildhoodGallery',
  components: { GalleryArtFrame },
  data() {
    return {
      galleryBg,
      allIllustrations: [],
      totalCount: 0,
      loading: true,
      loadingMore: false,
      pageByType: {},
      hasMoreByType: {},
      previewVisible: false,
      currentItem: null,
      currentIndex: 0,
      visibleIds: new Set(),
      observer: null,
    }
  },
  mounted() {
    this.$store.commit('closeMask')
    document.documentElement.style.setProperty(
      '--exhibit-bg',
      `url(${this.galleryBg})`
    )
    ILL_TYPES_GALLERY.forEach((type) => {
      this.pageByType[type] = 1
      this.hasMoreByType[type] = true
    })
    this.loadIllustrations(true)
  },
  beforeUnmount() {
    this.observer?.disconnect()
    document.documentElement.style.removeProperty('--exhibit-bg')
  },
  methods: {
    exhibitLayout(index) {
      return getExhibitLayout(index)
    },

    frameVariant(index) {
      return getFrameVariant(index)
    },

    exhibitStyle(index) {
      const layout = getExhibitLayout(index)
      return {
        gridColumn: layout.gridColumn,
        gridRow: layout.gridRow,
        '--piece-rotate': `${layout.rotate}deg`,
        '--stagger-delay': `${(index % 10) * 70}ms`,
        marginTop: layout.offsetY ? `${layout.offsetY}px` : undefined,
      }
    },

    getImageUrl(item) {
      return getIllustrationUrl(item)
    },

    itemCaption(item) {
      if (item?.title) return item.title
      if (item?.description) return item.description.slice(0, 32)
      return this.$t('childhoodMoments.polaroidCaptionDefault')
    },

    mergeItems(existing, incoming) {
      const map = new Map()
      ;[...existing, ...incoming].forEach((item) => {
        const key = item._id || `${item.createdAt}-${item.picture}`
        map.set(key, item)
      })
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    },

    async loadIllustrations(initial = false) {
      if (initial) {
        this.loading = true
      } else {
        this.loadingMore = true
      }

      try {
        const typesToLoad = ILL_TYPES_GALLERY.filter((type) => this.hasMoreByType[type])
        if (!typesToLoad.length) return

        const responses = await Promise.all(
          typesToLoad.map((type) =>
            this.$http.get('/ill/', {
              params: {
                type,
                page: this.pageByType[type],
                limit: 30,
                sort_param: 'createdAt',
                sort_num: 'desc',
              },
            })
          )
        )

        let newTotal = 0
        const batch = []

        responses.forEach((response, idx) => {
          const type = typesToLoad[idx]
          if (
            !response.data ||
            !(response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')
          ) {
            this.hasMoreByType[type] = false
            return
          }

          const message = response.data.message || {}
          const items = message.data || message || response.data.data || []
          const list = Array.isArray(items) ? items : []
          batch.push(...list)

          const typeTotal = Number(message.total || response.data.total || list.length) || 0
          newTotal += typeTotal

          if (list.length < 30) {
            this.hasMoreByType[type] = false
          } else {
            this.pageByType[type] += 1
          }
        })

        if (initial) {
          this.allIllustrations = this.mergeItems([], batch)
        } else {
          this.allIllustrations = this.mergeItems(this.allIllustrations, batch)
        }
        this.totalCount = Math.max(newTotal, this.allIllustrations.length)

        this.$nextTick(() => this.setupObserver())
      } catch {
        ElMessage.error(this.$t('childhoodMoments.wallLoadFailed'))
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },

    setupObserver() {
      if (this.observer) {
        this.observer.disconnect()
      }
      if (typeof IntersectionObserver === 'undefined') {
        this.allIllustrations.forEach((item, index) => {
          this.visibleIds.add(item._id || String(index))
        })
        return
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.dataset.id
              if (id) {
                this.visibleIds = new Set([...this.visibleIds, id])
              }
              this.observer.unobserve(entry.target)
            }
          })
        },
        { root: this.$refs.viewportRef, threshold: 0.08, rootMargin: '60px' }
      )

      const nodes = this.$refs.wallItems
      const list = Array.isArray(nodes) ? nodes : nodes ? [nodes] : []
      list.forEach((el, index) => {
        const item = this.allIllustrations[index]
        if (!el || !item) return
        el.dataset.id = item._id || String(index)
        this.observer.observe(el)
      })
    },

    handleScroll() {
      const el = this.$refs.viewportRef
      if (!el || this.loading || this.loadingMore) return
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 160
      const hasMore = ILL_TYPES_GALLERY.some((type) => this.hasMoreByType[type])
      if (nearBottom && hasMore) {
        this.loadIllustrations(false)
      }
    },

    openPreview(item, index) {
      this.currentItem = item
      this.currentIndex = index
      this.previewVisible = true
    },

    closePreview() {
      this.previewVisible = false
      this.currentItem = null
    },

    formatDate(dateString) {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },

    formatDateShort(dateString) {
      if (!dateString) return ''
      const d = new Date(dateString)
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    },
  },
}
</script>

<style scoped>
.exhibit-page {
  --exhibit-bg: none;
  min-height: 100vh;
  color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
  position: relative;
}

.exhibit-page__bg {
  position: fixed;
  inset: 0;
  background: var(--exhibit-bg) center / cover no-repeat;
  z-index: 0;
}

.exhibit-page__veil {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.76);
  z-index: 0;
}

.exhibit-header {
  position: relative;
  z-index: 1;
  padding: 28px clamp(20px, 5vw, 56px) 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.exhibit-back {
  display: inline-block;
  margin-bottom: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  letter-spacing: 0.06em;
  transition: color 0.2s ease;
}

.exhibit-back:hover {
  color: #fff;
}

.exhibit-title {
  margin: 0 0 8px;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.exhibit-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.04em;
}

.exhibit-viewport {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 140px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px clamp(16px, 4vw, 48px) 64px;
}

.exhibit-wall {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: clamp(20px, 3vw, 36px);
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
}

.exhibit-piece {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transform: rotate(var(--piece-rotate, 0deg));
  opacity: 0;
  translate: 0 24px;
  transition:
    opacity 0.7s ease var(--stagger-delay, 0ms),
    translate 0.7s ease var(--stagger-delay, 0ms),
    transform 0.35s ease;
}

.exhibit-piece--visible {
  opacity: 1;
  translate: 0 0;
}

.exhibit-piece:hover {
  transform: rotate(var(--piece-rotate, 0deg)) translateY(-6px) scale(1.02);
  z-index: 2;
}

.exhibit-piece:hover :deep(.gallery-art-frame) {
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 32px rgba(255, 220, 160, 0.15));
}

.exhibit-preview__frame {
  max-width: 360px;
  margin: 0 auto;
}

.exhibit-loading,
.exhibit-empty {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
}

.exhibit-loading__line {
  width: 48px;
  height: 1px;
  background: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
  animation: exhibit-line 1.4s ease-in-out infinite;
}

.exhibit-empty__cta {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  text-decoration: none;
  font-size: 13px;
  letter-spacing: 0.08em;
  transition: background 0.2s ease;
}

.exhibit-empty__cta:hover {
  background: rgba(255, 255, 255, 0.12);
}

.exhibit-loading-more {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  padding: 24px 0;
  letter-spacing: 0.1em;
}

.exhibit-preview__info {
  padding: 16px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #ddd;
}

.exhibit-preview__info p {
  margin: 6px 0;
}

.exhibit-preview__info strong {
  color: #aaa;
  font-weight: 500;
}

.exhibit-preview__desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: #bbb;
  font-size: 13px;
}

@keyframes exhibit-line {
  0%,
  100% {
    transform: scaleX(0.35);
    opacity: 0.35;
  }
  50% {
    transform: scaleX(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .exhibit-wall {
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
  }

  .exhibit-piece {
    grid-column: auto !important;
    grid-row: auto !important;
    margin-top: 0 !important;
    transform: rotate(0deg) !important;
  }

  .exhibit-piece:hover {
    transform: translateY(-4px) scale(1.01) !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .exhibit-piece {
    opacity: 1;
    translate: none;
    transition: none;
  }

  .exhibit-loading__line {
    animation: none;
  }
}
</style>

<style>
.exhibit-preview-dialog .el-dialog {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #eee;
}

.exhibit-preview-dialog .el-dialog__title {
  color: #eee;
  font-weight: 400;
  letter-spacing: 0.04em;
}
</style>
