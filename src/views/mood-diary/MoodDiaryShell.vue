<template>
  <div class="mood-shell">
    <aside class="mood-sidebar" aria-label="Mood diary navigation">
      <div class="sidebar-brand">
        <span class="sidebar-brand-icon" aria-hidden="true">
          <i class="iconfont icon-sanwen" />
        </span>
        <span>{{ $t('moodDiary.title') }}</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          active-class="sidebar-link-active"
        >
          <span class="sidebar-link-icon" aria-hidden="true">
            <i class="iconfont" :class="item.iconClass" />
          </span>
          <span class="sidebar-link-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-promo">
        <p class="sidebar-promo-title">{{ $t('moodDiary.sidebarPromoTitle') }}</p>
        <p class="sidebar-promo-text">{{ $t('moodDiary.sidebarPromoText') }}</p>
      </div>
    </aside>
    <main class="mood-main">
      <router-view v-slot="{ Component }">
        <div class="mood-route-outlet">
          <transition name="fade-quick" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </div>
      </router-view>
    </main>
    <MoodDiaryWriteDialog ref="writeDialog" />
  </div>
</template>

<script>
import MoodDiaryWriteDialog from '@/components/moodDiary/MoodDiaryWriteDialog.vue'
import { isMoodDiaryLoggedIn } from '@/utils/moodDiary/auth'
import { onOpenWriteDialog } from '@/utils/moodDiary/writeDialogBus'
import { ElMessage } from 'element-plus'

export default {
  name: 'MoodDiaryShell',
  components: { MoodDiaryWriteDialog },
  data() {
    return {
      unregisterWriteDialog: null
    }
  },
  computed: {
    navItems() {
      return [
        { to: '/mood-diary/narrative', label: this.$t('moodDiary.navDashboard'), iconClass: 'icon-rili' },
        { to: '/mood-diary/book', label: this.$t('moodDiary.navBook'), iconClass: 'icon-wodeshujia' },
        { to: '/mood-diary/recap', label: this.$t('moodDiary.navRecap'), iconClass: 'icon-changtu' }
      ]
    }
  },
  watch: {
    '$route.query.write'(val) {
      if (val === '1') {
        this.openWriteEntry()
        this.clearWriteQuery()
      }
    }
  },
  mounted() {
    this.unregisterWriteDialog = onOpenWriteDialog(() => this.openWriteEntry())
    if (this.$route.query.write === '1') {
      this.openWriteEntry()
      this.clearWriteQuery()
    }
  },
  beforeUnmount() {
    this.unregisterWriteDialog?.()
  },
  methods: {
    openWriteEntry() {
      if (!isMoodDiaryLoggedIn()) {
        ElMessage.warning(this.$t('moodDiary.writeNeedLogin'))
        this.$store.commit('showMask')
        return
      }
      this.$refs.writeDialog?.open()
    },
    clearWriteQuery() {
      if (!this.$route.query.write) return
      const query = { ...this.$route.query }
      delete query.write
      this.$router.replace({ path: this.$route.path, query })
    }
  }
}
</script>

<style scoped>
.mood-shell {
  /* Macaron palette — fresh & soft */
  --md-bg: #f5f2f8;
  --md-card: #fffcfe;
  --md-border: #e6deef;
  --md-text: #5f5970;
  --md-muted: #9d96a8;
  --md-accent: #a8e0d2;
  --md-accent-deep: #7ecbb8;
  --md-accent-soft: #edf8f4;
  --md-mint: #b8ebd8;
  --md-mint-deep: #8fd4bf;
  --md-mint-soft: #eef9f4;
  --md-cream: #faf6f2;
  --md-cream-soft: #fffdfb;
  --md-peach: #ffc8d8;
  --md-peach-soft: #fff0f4;
  --md-surface: #f3eef8;
  --md-poster-slot: #faf7fc;
  --md-poster-placeholder: #f0eaf5;
  --md-lilac: #c4b5e0;
  --md-lilac-soft: #f0ebfa;
  --md-sky: #b8dff0;
  --md-sky-soft: #edf6fc;
  --md-lemon: #f7efb8;
  --md-shadow: rgba(196, 181, 224, 0.14);
  --md-radius: 14px;
  --md-bg-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");

  position: relative;
  isolation: isolate;
  display: flex;
  min-height: calc(100vh - 90px);
  height: calc(100vh - 90px);
  background:
    radial-gradient(ellipse 85% 65% at 8% 6%, rgba(184, 223, 240, 0.42) 0%, transparent 58%),
    radial-gradient(ellipse 72% 58% at 94% 10%, rgba(255, 200, 216, 0.34) 0%, transparent 54%),
    radial-gradient(ellipse 68% 62% at 80% 96%, rgba(168, 224, 210, 0.32) 0%, transparent 56%),
    radial-gradient(ellipse 58% 52% at 4% 90%, rgba(196, 181, 224, 0.28) 0%, transparent 52%),
    radial-gradient(ellipse 45% 40% at 50% 42%, rgba(255, 253, 251, 0.55) 0%, transparent 70%),
    linear-gradient(168deg, #f0ebf6 0%, var(--md-cream) 44%, #edf6fb 100%);
  box-sizing: border-box;
  padding: 12px 16px 16px;
  gap: 12px;
  align-items: stretch;
}

.mood-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.04;
  mix-blend-mode: multiply;
  background-image: var(--md-bg-noise);
  background-size: 160px 160px;
}

.mood-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.22;
  background-image: radial-gradient(circle at center, rgba(196, 181, 224, 0.08) 0.6px, transparent 0.7px);
  background-size: 20px 20px;
}

.mood-sidebar {
  position: relative;
  z-index: 1;
  flex: 0 0 260px;
  width: 260px;
  padding: 18px 14px 20px;
  background: rgba(255, 252, 254, 0.88);
  backdrop-filter: blur(14px) saturate(1.06);
  -webkit-backdrop-filter: blur(14px) saturate(1.06);
  border-radius: var(--md-radius);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.85) inset,
    0 8px 24px rgba(196, 181, 224, 0.1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 18px;
  color: var(--md-text);
  padding: 6px 10px 22px;
  letter-spacing: 0.02em;
}

.sidebar-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--md-accent-deep);
}

.sidebar-brand-icon .iconfont {
  font-size: 26px;
  line-height: 1;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-radius: 12px;
  color: var(--md-muted);
  text-decoration: none;
  font-size: 15px;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-link:hover {
  background: var(--md-lilac-soft);
  color: var(--md-text);
}

.sidebar-link-active {
  background: var(--md-accent-soft);
  color: var(--md-accent-deep);
  font-weight: 500;
}

.sidebar-link-active .sidebar-link-icon {
  opacity: 1;
}

.sidebar-link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
  opacity: 0.85;
}

.sidebar-link-icon .iconfont {
  font-size: 21px;
  line-height: 1;
  color: inherit;
}

.sidebar-promo {
  margin-top: 18px;
  padding: 14px;
  border-radius: 10px;
  background: var(--md-lilac-soft);
  border: 1px solid var(--md-border);
}

.sidebar-promo-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text);
}

.sidebar-promo-text {
  margin: 0;
  font-size: 13px;
  color: var(--md-muted);
  line-height: 1.45;
}

.sidebar-promo-btn {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 8px;
  background: var(--md-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.sidebar-promo-btn:hover {
  background: var(--md-accent-deep);
}

.mood-main {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  min-height: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0;
}

.mood-route-outlet {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fade-quick-enter-active,
.fade-quick-leave-active {
  transition: opacity 0.12s ease;
}

.fade-quick-enter-from,
.fade-quick-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .mood-shell {
    flex-direction: column;
    padding: 12px;
    height: auto;
    min-height: calc(100vh - 100px);
    overflow: visible;
  }

  .mood-main {
    flex: none;
    width: 100%;
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .mood-route-outlet {
    flex: none;
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .mood-sidebar {
    flex: none;
    width: 100%;
    padding: 14px 12px;
  }

  .sidebar-brand {
    padding-bottom: 10px;
  }

  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
    flex: none;
  }

  .sidebar-link {
    padding: 10px 14px;
    font-size: 14px;
  }

  .sidebar-link-icon .iconfont {
    font-size: 19px;
  }

  .sidebar-promo {
    display: none;
  }
}
</style>
