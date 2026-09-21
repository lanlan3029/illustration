<template>
  <div class="wall-page">
    <header class="wall-header">
      <router-link to="/newyear" class="wall-back">{{ $t('childhoodMoments.backToCreate') }}</router-link>
      <h1 class="wall-title">{{ $t('childhoodMoments.wallTitle') }}</h1>
      <p class="wall-subtitle">{{ $t('childhoodMoments.wallSubtitle', { count: totalCount }) }}</p>
    </header>

    <div v-if="loading && !allIllustrations.length" class="wall-loading">
      <span class="wall-loading__dot" />
      <p>{{ $t('childhoodMoments.wallLoading') }}</p>
    </div>

    <div
      v-else
      ref="viewportRef"
      class="wall-viewport"
      @scroll="handleScroll"
    >
      <div v-if="!allIllustrations.length" class="wall-empty">
        <p>{{ $t('childhoodMoments.wallEmpty') }}</p>
        <router-link to="/newyear" class="wall-empty__cta">
          {{ $t('childhoodMoments.wallEmptyCta') }}
        </router-link>
      </div>

      <div v-else class="wall-masonry">
        <button
          v-for="(item, index) in allIllustrations"
          :key="item._id || index"
          ref="wallItems"
          type="button"
          class="wall-item"
          :class="{ 'wall-item--visible': visibleIds.has(item._id || String(index)) }"
          :style="itemStyle(index)"
          @click="openPreview(item, index)"
        >
          <PolaroidFrame
            :rotate="rotationForIndex(index)"
            :tape-hue="38 + (index % 6) * 18"
            :caption="itemCaption(item)"
            :revealed="false"
            interactive
          >
            <el-image :src="getImageUrl(item)" fit="cover" lazy>
              <template #error>
                <div class="wall-image-fallback">
                  <i class="el-icon-picture-outline" />
                </div>
              </template>
              <template #placeholder>
                <div class="wall-image-fallback">
                  <i class="el-icon-loading" />
                </div>
              </template>
            </el-image>
          </PolaroidFrame>
        </button>
      </div>

      <p v-if="loadingMore" class="wall-loading-more">{{ $t('childhoodMoments.wallLoadingMore') }}</p>
    </div>

    <el-dialog
      v-model="previewVisible"
      :title="currentItem?.title || $t('childhoodMoments.previewTitle')"
      width="92%"
      class="wall-preview-dialog"
      @closed="closePreview"
    >
      <div v-if="currentItem" class="wall-preview">
        <PolaroidFrame
          :rotate="0"
          :tape-hue="48"
          :caption="itemCaption(currentItem)"
          :revealed="false"
        >
          <el-image :src="getImageUrl(currentItem)" fit="cover" class="wall-preview-image" />
        </PolaroidFrame>
        <div class="wall-preview-info">
          <p v-if="currentItem.owner">
            <strong>{{ $t('childhoodMoments.author') }}</strong>
            {{ currentItem.owner.name || $t('childhoodMoments.anonymous') }}
          </p>
          <p v-if="currentItem.createdAt">
            <strong>{{ $t('childhoodMoments.time') }}</strong>
            {{ formatDate(currentItem.createdAt) }}
          </p>
          <p v-if="currentItem.description" class="wall-preview-desc">
            {{ currentItem.description }}
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import PolaroidFrame from '@/components/childhood/PolaroidFrame.vue'
import { ILL_TYPES_GALLERY } from '@/utils/childhoodMoments'

export default {
  name: 'NewYearGallery',
  components: { PolaroidFrame },
  data() {
    return {
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
    ILL_TYPES_GALLERY.forEach((type) => {
      this.pageByType[type] = 1
      this.hasMoreByType[type] = true
    })
    this.loadIllustrations(true)
  },
  beforeUnmount() {
    this.observer?.disconnect()
  },
  methods: {
    rotationForIndex(index) {
      const pattern = [-2.5, 1.8, -1.2, 2.2, -0.8, 1.5, -2, 0.6]
      return pattern[index % pattern.length]
    },

    itemStyle(index) {
      return {
        '--stagger-delay': `${(index % 12) * 60}ms`,
      }
    },

    itemCaption(item) {
      if (item?.title) return item.title
      if (item?.description) return item.description.slice(0, 24)
      return this.$t('childhoodMoments.polaroidCaptionDefault')
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
        { root: this.$refs.viewportRef, threshold: 0.12, rootMargin: '40px' }
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
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 120
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
  },
}
</script>

<style scoped>
.wall-page {
  min-height: 100vh;
  background-color: #faf6f0;
  background-image:
    radial-gradient(circle at 15% 10%, rgba(255, 212, 168, 0.3) 0%, transparent 40%),
    radial-gradient(circle at 85% 20%, rgba(212, 197, 249, 0.22) 0%, transparent 38%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
}

.wall-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 16px 16px 12px;
  background: linear-gradient(180deg, rgba(250, 246, 240, 0.98) 0%, rgba(250, 246, 240, 0.88) 80%, transparent 100%);
  backdrop-filter: blur(8px);
  text-align: center;
}

.wall-back {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #a0897a;
  text-decoration: none;
}

.wall-title {
  margin: 0 0 4px;
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  font-size: clamp(22px, 5vw, 30px);
  color: #5c4a3a;
}

.wall-subtitle {
  margin: 0;
  font-size: 13px;
  color: #8a7568;
}

.wall-viewport {
  height: calc(100vh - 110px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 12px 32px;
}

.wall-masonry {
  column-count: 2;
  column-gap: 14px;
  max-width: 960px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .wall-masonry {
    column-count: 3;
    column-gap: 18px;
  }
}

@media (min-width: 960px) {
  .wall-masonry {
    column-count: 4;
  }
}

.wall-item {
  display: block;
  width: 100%;
  margin: 0 0 14px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  break-inside: avoid;
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 0.55s ease var(--stagger-delay, 0ms),
    transform 0.55s ease var(--stagger-delay, 0ms);
}

.wall-item--visible {
  opacity: 1;
  transform: translateY(0);
}

.wall-image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #b9a89a;
  font-size: 24px;
}

.wall-loading,
.wall-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #8a7568;
  text-align: center;
  padding: 24px;
}

.wall-loading__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #b8e6d0;
  margin-bottom: 12px;
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.wall-empty__cta {
  display: inline-block;
  margin-top: 12px;
  padding: 10px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffb5c2 0%, #ffd4a8 100%);
  color: #5c4030;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.wall-loading-more {
  text-align: center;
  font-size: 13px;
  color: #a0897a;
  padding: 16px 0;
}

.wall-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.wall-preview-image {
  width: 100%;
}

.wall-preview-info {
  width: 100%;
  max-width: 420px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.6;
  color: #5c4a3a;
}

.wall-preview-info p {
  margin: 6px 0;
}

.wall-preview-info strong {
  color: #8a7568;
  font-weight: 600;
}

.wall-preview-desc {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(160, 137, 122, 0.25);
  font-size: 13px;
  color: #7d6a5c;
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

@media (prefers-reduced-motion: reduce) {
  .wall-item {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
