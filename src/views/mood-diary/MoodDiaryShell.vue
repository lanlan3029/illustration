<template>
  <div class="mood-shell">
    <aside class="mood-sidebar" aria-label="Mood diary navigation">
      <div class="sidebar-brand">
        <span class="sidebar-brand-icon" aria-hidden="true">📔</span>
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
          <span class="sidebar-link-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="sidebar-link-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-promo">
        <p class="sidebar-promo-title">{{ $t('moodDiary.sidebarPromoTitle') }}</p>
        <p class="sidebar-promo-text">{{ $t('moodDiary.sidebarPromoText') }}</p>
        <router-link class="sidebar-promo-btn" to="/mood-diary/write">{{ $t('moodDiary.actionWrite') }}</router-link>
      </div>
    </aside>
    <main class="mood-main">
      <router-view v-slot="{ Component }">
        <div class="mood-route-outlet">
          <transition name="fade-quick" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </div>
      </router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'MoodDiaryShell',
  computed: {
    navItems() {
      return [
        { to: '/mood-diary/narrative', label: this.$t('moodDiary.navDashboard'), icon: '▣' },
        { to: '/mood-diary/book', label: this.$t('moodDiary.navBook'), icon: '📖' },
        { to: '/mood-diary/recap', label: this.$t('moodDiary.navRecap'), icon: '✨' }
      ]
    }
  }
}
</script>

<style scoped>
.mood-shell {
  display: flex;
  min-height: calc(100vh - 90px);
  height: calc(100vh - 90px);
  background: #eef2f6;
  box-sizing: border-box;
  padding: 16px 20px 20px;
  gap: 16px;
  align-items: stretch;
}

.mood-sidebar {
  flex: 0 0 220px;
  padding: 22px 16px 24px;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  color: #1e293b;
  padding: 4px 8px 20px;
  letter-spacing: 0.02em;
}

.sidebar-brand-icon {
  font-size: 22px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 12px;
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-link:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.sidebar-link-active {
  background: #20c997;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(32, 201, 151, 0.28);
}

.sidebar-link-active .sidebar-link-icon {
  opacity: 1;
}

.sidebar-link-icon {
  width: 20px;
  text-align: center;
  font-size: 15px;
  opacity: 0.85;
}

.sidebar-promo {
  margin-top: 16px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e8ecf1;
}

.sidebar-promo-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.sidebar-promo-text {
  margin: 0 0 10px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.sidebar-promo-btn {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 10px;
  background: #20c997;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.sidebar-promo-btn:hover {
  background: #17b386;
}

.mood-main {
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
    padding: 8px 12px;
    font-size: 13px;
  }

  .sidebar-promo {
    display: none;
  }
}
</style>
