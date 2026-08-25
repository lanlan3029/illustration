<template>
  <div class="weblist-page">
    <header class="weblist-hero">
      <p class="weblist-kicker">{{ $t('websiteReco.kicker') }}</p>
      <h1>{{ $t('websiteReco.pageTitle') }}</h1>
      <p class="weblist-desc">{{ $t('websiteReco.pageDesc') }}</p>
    </header>

    <div v-if="loading" class="weblist-state">{{ $t('websiteReco.loading') }}</div>
    <div v-else-if="!items.length" class="weblist-state">{{ $t('websiteReco.empty') }}</div>

    <section v-else class="weblist-section">
      <div class="weblist-section-head">
        <h2>{{ $t('websiteReco.featuredTitle') }}</h2>
      </div>
      <div class="weblist-grid">
        <a
          v-for="item in items"
          :key="item.id"
          class="weblist-card"
          :href="item.linkUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="weblist-thumb">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              loading="lazy"
            />
            <div v-else class="weblist-thumb-empty" />
            <span v-if="item.isNew" class="weblist-badge">{{ $t('websiteReco.badgeNew') }}</span>
          </div>
          <div class="weblist-meta">
            <div class="weblist-meta-text">
              <h3>{{ item.name }}</h3>
              <p>{{ item.intro }}</p>
            </div>
            <span class="weblist-arrow" aria-hidden="true">→</span>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<script>
import { fetchWebsiteRecommendations } from '@/utils/websiteRecommendationsApi'

export default {
  name: 'WebsiteRecommendations',
  data() {
    return {
      loading: true,
      items: [],
    }
  },
  async created() {
    await this.loadList()
  },
  methods: {
    async loadList() {
      this.loading = true
      try {
        const list = await fetchWebsiteRecommendations(this.$http)
        this.items = Array.isArray(list) ? list : []
      } catch (e) {
        this.items = []
        this.$message?.error?.(e?.message || this.$t('websiteReco.loadFailed'))
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.weblist-page {
  --ink: #111;
  --muted: #6b7280;
  --line: #eceff3;
  --bg: #fff;
  max-width: 1180px;
  margin: 0 auto;
  padding: 36px 20px 72px;
  text-align: left;
  color: var(--ink);
  background: var(--bg);
}

.weblist-hero {
  max-width: 720px;
  margin: 0 auto 40px;
  text-align: center;
}

.weblist-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 700;
}

.weblist-hero h1 {
  margin: 0 0 12px;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 800;
}

.weblist-desc {
  margin: 0 auto;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.65;
}

.weblist-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18px;
}

.weblist-section-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.weblist-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px 18px;
}

.weblist-card {
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.18s ease;
}

.weblist-card:hover {
  transform: translateY(-2px);
}

.weblist-thumb {
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 14px;
  overflow: hidden;
  background: #f3f4f6;
  border: 1px solid var(--line);
}

.weblist-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.weblist-thumb-empty {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
}

.weblist-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #111;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
}

.weblist-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 2px 0;
}

.weblist-meta h3 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 800;
}

.weblist-meta p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.weblist-arrow {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #374151;
  margin-top: 2px;
}

.weblist-state {
  text-align: center;
  color: var(--muted);
  padding: 48px 16px;
}

@media (max-width: 1024px) {
  .weblist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .weblist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 12px;
  }
}

@media (max-width: 420px) {
  .weblist-grid {
    grid-template-columns: 1fr;
  }
}
</style>
