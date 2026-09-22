<template>
  <div class="wall-page">
    <header class="wall-header">
      <router-link to="/childhood" class="wall-back">{{ $t('childhoodMoments.backToCreate') }}</router-link>
      <div class="wall-header__main">
        <h1 class="wall-title">{{ $t('childhoodMoments.exhibitTitle') }}</h1>
        <p class="wall-subtitle">{{ $t('childhoodMoments.exhibitSubtitle', { count: totalCount }) }}</p>
      </div>
    </header>

    <div v-if="loading && !gridItems.length" class="wall-state">
      <span class="wall-state__line" />
      <p>{{ $t('childhoodMoments.wallLoading') }}</p>
    </div>

    <div
      v-else
      ref="viewportRef"
      class="wall-body"
      @scroll="handleScroll"
    >
      <div v-if="!gridItems.length" class="wall-state">
        <p>{{ $t('childhoodMoments.wallEmpty') }}</p>
        <router-link to="/childhood" class="wall-empty-cta">
          {{ $t('childhoodMoments.wallEmptyCta') }}
        </router-link>
      </div>

      <div v-else class="wall-focus">
        <ChildhoodFocusGrid
          ref="focusGrid"
          v-model="focusIndex"
          :items="gridItems"
          :aria-label="$t('childhoodMoments.exhibitTitle')"
          @select="openPreviewByGrid"
        />

        <div class="wall-focus__meta">
          <button
            type="button"
            class="wall-focus__nav"
            :disabled="focusIndex <= 0"
            :aria-label="$t('childhoodMoments.focusPrev')"
            @click="$refs.focusGrid?.step(-1)"
          >
            ←
          </button>

          <div class="wall-focus__copy">
            <p v-if="currentGridItem?.caption" class="wall-focus__caption">
              {{ currentGridItem.caption }}
            </p>
            <p class="wall-focus__hint">{{ $t('childhoodMoments.focusHint') }}</p>
          </div>

          <button
            type="button"
            class="wall-focus__nav"
            :disabled="focusIndex >= gridItems.length - 1"
            :aria-label="$t('childhoodMoments.focusNext')"
            @click="$refs.focusGrid?.step(1)"
          >
            →
          </button>
        </div>
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
import ChildhoodFocusGrid from '@/components/childhood/ChildhoodFocusGrid.vue'
import {
  ILL_TYPES_GALLERY,
  getIllustrationUrl,
} from '@/utils/childhoodMoments'

export default {
  name: 'ChildhoodGallery',
  components: { ChildhoodFocusGrid },
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
      focusIndex: 0,
    }
  },
  computed: {
    gridItems() {
      return this.allIllustrations
        .filter((item) => this.hasIllustration(item))
        .map((item, index) => ({
          id: item._id || `ill-${index}`,
          imageUrl: getIllustrationUrl(item),
          caption: this.itemCaption(item),
          raw: item,
        }))
    },
    currentGridItem() {
      return this.gridItems[this.focusIndex] || null
    },
  },
  mounted() {
    this.$store.commit('closeMask')
    ILL_TYPES_GALLERY.forEach((type) => {
      this.pageByType[type] = 1
      this.hasMoreByType[type] = true
    })
    this.loadIllustrations(true)
  },
  methods: {
    getImageUrl(item) {
      return getIllustrationUrl(item)
    },

    hasIllustration(item) {
      const url = getIllustrationUrl(item)
      return !!url && url.length > 8
    },

    itemCaption(item) {
      if (item?.description) return item.description.slice(0, 80)
      if (item?.title) return item.title
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
      } catch {
        ElMessage.error(this.$t('childhoodMoments.wallLoadFailed'))
      } finally {
        this.loading = false
        this.loadingMore = false
      }
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

    openPreviewByGrid(gridItem) {
      if (!gridItem?.raw) return
      this.currentItem = gridItem.raw
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
}

.wall-body {
  flex: 1;
  overflow-y: auto;
  padding: clamp(28px, 5vw, 48px) clamp(20px, 5vw, 56px) 64px;
}

.wall-focus {
  max-width: 640px;
  margin: 0 auto;
}

.wall-focus__meta {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 16px;
  margin-top: 24px;
}

.wall-focus__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.wall-focus__nav:hover:not(:disabled) {
  border-color: #8167a9;
  color: #8167a9;
}

.wall-focus__nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.wall-focus__copy {
  text-align: center;
  min-width: 0;
}

.wall-focus__caption {
  margin: 0 0 6px;
  font-size: 14px;
  line-height: 1.6;
  color: #222;
}

.wall-focus__hint {
  margin: 0;
  font-size: 12px;
  color: #999;
  letter-spacing: 0.02em;
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
  background: #8167a9;
  margin-bottom: 16px;
  animation: wall-line 1.4s ease-in-out infinite;
}

.wall-empty-cta {
  display: inline-flex;
  margin-top: 20px;
  min-height: 44px;
  padding: 0 24px;
  border: 1.5px solid #111;
  border-radius: 999px;
  color: #111;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.wall-loading-more {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 32px 0 0;
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

@media (prefers-reduced-motion: reduce) {
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
</style>
