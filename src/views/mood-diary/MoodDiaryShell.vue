<template>
  <div class="mood-shell">
    <aside class="mood-sidebar" aria-label="Mood diary navigation">
      <div class="sidebar-brand">{{ $t('moodDiary.title') }}</div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          active-class="sidebar-link-active"
        >
          <span class="sidebar-link-label">{{ item.label }}</span>
        </router-link>
      </nav>
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
        { to: '/mood-diary/narrative', label: this.$t('moodDiary.navNow') },
        { to: '/mood-diary/book', label: this.$t('moodDiary.navBook') },
        { to: '/mood-diary/insights', label: this.$t('moodDiary.navInsights') },
        { to: '/mood-diary/recap', label: this.$t('moodDiary.navRecap') }
      ]
    }
  }
}
</script>

<style scoped>
.mood-shell {
  display: flex;
  min-height: calc(100vh - 90px);
  background: #f5f7fa;
  box-sizing: border-box;
}

.mood-sidebar {
  flex: 0 0 200px;
  padding: 20px 12px 24px;
  background: linear-gradient(180deg, #f8f6ff 0%, #fff 40%);
  border-right: 1px solid #ebeef5;
  box-sizing: border-box;
}

.sidebar-brand {
  font-weight: 700;
  font-size: 15px;
  color: #2a1f42;
  padding: 4px 10px 16px;
  letter-spacing: 0.02em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-link {
  display: block;
  padding: 10px 12px;
  border-radius: 10px;
  color: #5a4b7a;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-link:hover {
  background: rgba(129, 103, 169, 0.08);
  color: #2a1f42;
}

.sidebar-link-active {
  background: rgba(129, 103, 169, 0.16);
  color: #2a1f42;
  font-weight: 600;
}

.mood-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  padding: 20px 16px 32px;
  box-sizing: border-box;
}

.mood-route-outlet {
  flex: 1;
  min-height: 0;
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
    min-height: calc(100vh - 100px);
  }

  .mood-sidebar {
    flex: none;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ebeef5;
    padding: 12px 10px;
  }

  .sidebar-brand {
    padding-bottom: 8px;
  }

  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .sidebar-link {
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>
