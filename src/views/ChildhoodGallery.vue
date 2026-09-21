<template>
  <div class="wall-page">
    <header class="wall-header">
      <router-link to="/childhood" class="wall-back">{{ $t('childhoodMoments.backToCreate') }}</router-link>
      <div class="wall-header__main">
        <h1 class="wall-title">{{ $t('childhoodMoments.exhibitTitle') }}</h1>
        <p class="wall-subtitle">{{ $t('childhoodMoments.exhibitSubtitle', { count: totalCount }) }}</p>
      </div>
    </header>

    <div v-if="loading && !allIllustrations.length" class="wall-state">
      <span class="wall-state__line" />
      <p>{{ $t('childhoodMoments.wallLoading') }}</p>
    </div>

    <div
      v-else
      ref="viewportRef"
      class="wall-body"
      @scroll="handleScroll"
    >
      <div v-if="!allIllustrations.length" class="wall-state">
        <p>{{ $t('childhoodMoments.wallEmpty') }}</p>
        <router-link to="/childhood" class="wall-empty-cta">
          {{ $t('childhoodMoments.wallEmptyCta') }}
        </router-link>
      </div>

      <div v-else class="wall-grid">
        <button
          v-for="(item, index) in allIllustrations"
          :key="item._id || index"
          ref="wallItems"
          type="button"
          class="wall-card"
          :class="{ 'wall-card--visible': visibleIds.has(item._id || String(index)) }"
          :style="{ '--stagger-delay': `${(index % 12) * 50}ms` }"
          @click="openPreview(item)"
        >
          <div class="wall-card__media">
            <img
              :src="getImageUrl(item)"
              :alt="itemCaption(item)"
              loading="lazy"
            />
          </div>
          <div class="wall-card__meta">
            <span class="wall-card__caption">{{ itemCaption(item) }}</span>
            <span v-if="item.createdAt" class="wall-card__date">
              {{ formatDateShort(item.createdAt) }}
            </span>
          </div>
        </button>
      </div>

      <p v-if="loadingMore" class="wall-loading-more">{{ $t('childhoodMoments.wallLoadingMore') }}</p>
    </div>

    <el-dialog
      v-model="previewVisible"
      :title="currentItem?.title || $t('childhoodMoments.previewTitle')"
      width="min(92vw, 640px)"
      class="wall-preview-dialog"
      @closed="closePreview"
    >
      <div v-if="currentItem" class="wall-preview">
        <img
          class="wall-preview__img"
          :src="getImageUrl(currentItem)"
          alt=""
        />
        <div class="wall-preview__info">
          <p v-if="currentItem.owner">
            <strong>{{ $t('childhoodMoments.author') }}</strong>
            {{ currentItem.owner.name || $t('childhoodMoments.anonymous') }}
          </p>
          <p v-if="currentItem.createdAt">
            <strong>{{ $t('childhoodMoments.time') }}</strong>
            {{ formatDate(currentItem.createdAt) }}
          </p>
          <p v-if="currentItem.description" class="wall-preview__desc">
            {{ currentItem.description }}
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import {
  ILL_TYPES_GALLERY,
  getIllustrationUrl,
} from '@/utils/childhoodMoments'

export default {
  name: 'ChildhoodGallery',
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
        { root: this.$refs.viewportRef, threshold: 0.06, rootMargin: '40px' }
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

    openPreview(item) {
      this.currentItem = item
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
.wall-page {
  min-height: 100vh;
  background: #fff;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
  display: flex;
  flex-direction: column;
}

.wall-header {
  flex-shrink: 0;
  padding: 24px clamp(20px, 5vw, 56px) 20px;
  border-bottom: 1px solid #eee;
}

.wall-back {
  display: inline-block;
  margin-bottom: 24px;
  font-size: 13px;
  color: #666;
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: color 0.2s ease;
}

.wall-back:hover {
  color: #111;
}

.wall-header__main {
  max-width: 960px;
}

.wall-title {
  margin: 0 0 8px;
  font-size: clamp(32px, 6vw, 52px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.wall-subtitle {
  margin: 0;
  font-size: 14px;
  color: #666;
  letter-spacing: 0.02em;
}

.wall-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: clamp(28px, 5vw, 48px) clamp(20px, 5vw, 56px) 64px;
}

.wall-grid {
  column-count: 3;
  column-gap: clamp(20px, 3vw, 32px);
  max-width: 1200px;
  margin: 0 auto;
}

.wall-card {
  display: block;
  width: 100%;
  margin: 0 0 clamp(20px, 3vw, 32px);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  break-inside: avoid;
  opacity: 0;
  translate: 0 16px;
  transition:
    opacity 0.55s ease var(--stagger-delay, 0ms),
    translate 0.55s ease var(--stagger-delay, 0ms);
}

.wall-card--visible {
  opacity: 1;
  translate: 0 0;
}

.wall-card__media {
  overflow: hidden;
  background: #f5f5f5;
  line-height: 0;
}

.wall-card__media img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.45s ease, opacity 0.45s ease;
}

.wall-card:hover .wall-card__media img {
  transform: scale(1.03);
}

.wall-card__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 2px 0;
}

.wall-card__caption {
  font-size: 13px;
  line-height: 1.4;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wall-card__date {
  flex-shrink: 0;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: #999;
}

.wall-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #888;
  text-align: center;
}

.wall-state__line {
  width: 48px;
  height: 2px;
  background: #111;
  margin-bottom: 16px;
  animation: wall-line 1.4s ease-in-out infinite;
}

.wall-empty-cta {
  display: inline-flex;
  align-items: center;
  margin-top: 20px;
  min-height: 44px;
  padding: 0 24px;
  border: 1.5px solid #111;
  border-radius: 999px;
  color: #111;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;
}

.wall-empty-cta:hover {
  background: #111;
  color: #fff;
}

.wall-loading-more {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 32px 0 0;
  letter-spacing: 0.08em;
}

.wall-preview__img {
  display: block;
  width: 100%;
  max-height: 65vh;
  object-fit: contain;
  background: #f5f5f5;
}

.wall-preview__info {
  padding: 16px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #444;
}

.wall-preview__info p {
  margin: 6px 0;
}

.wall-preview__info strong {
  color: #888;
  font-weight: 500;
}

.wall-preview__desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  color: #666;
  font-size: 13px;
}

@keyframes wall-line {
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

@media (max-width: 960px) {
  .wall-grid {
    column-count: 2;
  }
}

@media (max-width: 560px) {
  .wall-grid {
    column-count: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wall-card {
    opacity: 1;
    translate: none;
    transition: none;
  }

  .wall-card__media img {
    transition: none;
  }

  .wall-state__line {
    animation: none;
  }
}
</style>

<style>
.wall-preview-dialog .el-dialog {
  background: #fff;
  border: none;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12);
}

.wall-preview-dialog .el-dialog__title {
  color: #111;
  font-weight: 600;
  letter-spacing: -0.01em;
}
</style>
