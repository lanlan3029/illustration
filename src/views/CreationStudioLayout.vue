<template>
  <div class="cw-layout story-controls">
    <!-- 第一栏：上图标下文字，窄轨 -->
    <nav class="cw-rail" aria-label="creation domains">
      <router-link :to="{ name: 'Home' }" class="cw-rail-home" :title="$t('nav.home')">
        <span class="cw-rail-icon" aria-hidden="true" v-html="homeIcon" />
        <span class="cw-rail-label">{{ $t('nav.home') }}</span>
      </router-link>

      <button
        v-for="domain in domains"
        :key="domain.key"
        type="button"
        class="cw-rail-item"
        :class="{ active: activeDomain === domain.key }"
        :aria-pressed="activeDomain === domain.key"
        @click="switchDomain(domain)"
      >
        <span class="cw-rail-icon cw-rail-icon--domain">
          <img :src="domain.iconSrc" alt="" />
        </span>
        <span class="cw-rail-label">{{ $t(domain.labelKey) }}</span>
      </button>
    </nav>

    <!-- 第二栏：当前域下的子导航 -->
    <aside class="cw-subnav">
      <div class="cw-subnav-head">
        <h2>{{ $t('creationStudio.layoutTitle') }}</h2>
        <p>{{ $t(activeDomainTitleKey) }}</p>
      </div>

      <nav class="cw-subnav-list">
        <router-link
          v-for="item in subNavItems"
          :key="item.routeName"
          :to="subNavTo(item)"
          class="cw-subnav-item"
          :class="{ active: isSubNavActive(item) }"
          :aria-current="isSubNavActive(item) ? 'page' : undefined"
        >
          {{ $t(item.labelKey) }}
        </router-link>
      </nav>
    </aside>

    <div class="cw-main">
      <router-view />
    </div>
  </div>
</template>

<script>
import {
  CREATION_DOMAINS,
  CREATION_SUB_NAV,
  resolveCreationDomain,
  isSubNavActive as matchSubNav,
} from '@/data/creationStudioNav';
import '@/styles/creationStudioTheme.css';

const HOME_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>';

export default {
  name: 'CreationStudioLayout',
  data() {
    return {
      domains: CREATION_DOMAINS,
      homeIcon: HOME_ICON,
    };
  },
  computed: {
    activeDomain() {
      return resolveCreationDomain(this.$route);
    },
    subNavItems() {
      return CREATION_SUB_NAV[this.activeDomain] || [];
    },
    activeDomainTitleKey() {
      const d = CREATION_DOMAINS.find((x) => x.key === this.activeDomain);
      return d?.labelKey || 'creationStudio.domainCharacter';
    },
  },
  methods: {
    subNavTo(item) {
      if (item.external) {
        return { path: item.externalPath || '/editorpro' };
      }
      if (item.routeParams) {
        return { name: item.routeName, params: item.routeParams };
      }
      return { name: item.routeName };
    },
    isSubNavActive(item) {
      if (item.external) return false;
      return matchSubNav(this.$route, item);
    },
    switchDomain(domain) {
      if (this.activeDomain === domain.key) return;
      this.$router.push({ name: domain.defaultRoute });
    },
  },
};
</script>

<style scoped>
.cw-layout { display: flex; min-height: calc(100dvh - var(--ks-header-height) - 40px); background: var(--ks-paper); color: var(--ks-ink); text-align: left; }
.cw-rail { width: 88px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 8px; border-right: var(--ks-line); background: var(--ks-surface); }
.cw-rail-home, .cw-rail-item { width: 72px; min-height: 44px; padding: 8px 4px; border: 0; border-radius: var(--ks-radius-sm); background: transparent; color: var(--ks-muted); display: flex; flex-direction: column; align-items: center; gap: 10px; text-decoration: none; cursor: pointer; transition: background-color var(--ks-motion), color var(--ks-motion); }
.cw-rail-home:hover, .cw-rail-item:hover { background: var(--ks-panel); color: var(--ks-ink); }
.cw-rail-item.active { color: var(--ks-ink); }
.cw-rail-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.cw-rail-icon :deep(svg) { width: 24px; height: 24px; }
.cw-rail-icon--domain { width: 46px; height: 46px; border: 2px solid transparent; border-radius: var(--ks-radius-md); }
.cw-rail-icon--domain img { width: 26px; height: 26px; object-fit: contain; }
.cw-rail-item.active .cw-rail-icon--domain { border: var(--ks-line); background: var(--ks-pink); box-shadow: var(--ks-shadow-sm); }
.cw-rail-label { max-width: 68px; font-size: 13px; line-height: 1.5; font-weight: 600; text-align: center; overflow-wrap: anywhere; }
.cw-subnav { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; padding: 28px 16px; border-right: var(--ks-line); background: var(--ks-panel); }
.cw-subnav-head { padding: 0 8px 24px; }
.cw-subnav-head h2 { margin: 0; font-size: 24px; line-height: 1.5; font-weight: 600; }
.cw-subnav-head p { margin-top: 8px; font-size: 14px; color: var(--ks-primary-hover); font-weight: 600; }
.cw-subnav-list { display: flex; flex-direction: column; gap: 12px; }
.cw-subnav-item { display: flex; align-items: center; min-height: 44px; padding: 12px 16px; border: 2px solid transparent; border-radius: var(--ks-radius-md); color: var(--ks-muted); font-size: 14px; line-height: 1.5; font-weight: 600; text-decoration: none; transition: background-color var(--ks-motion), color var(--ks-motion); }
.cw-subnav-item:hover { background: var(--ks-yellow); color: var(--ks-ink); }
.cw-subnav-item.active { border: var(--ks-line); background: var(--ks-primary); color: white; box-shadow: var(--ks-shadow-sm); }
.cw-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; background: radial-gradient(circle, #faeab5 1.5px, transparent 2px) 0 0 / 32px 32px var(--ks-paper); }
.cw-main :deep(> *) { flex: 1 1 auto; min-width: 0; width: 100%; max-width: 100%; box-sizing: border-box; }
@media (min-width: 769px) and (max-width: 1024px) {
  .cw-subnav { width: 184px; padding-inline: 12px; }
}
@media (max-width: 768px) {
  .cw-layout { flex-direction: column; }
  .cw-rail { width: 100%; flex-direction: row; justify-content: space-around; padding: 12px 8px; gap: 4px; border-right: 0; border-bottom: var(--ks-line); }
  .cw-rail-home, .cw-rail-item { width: auto; flex: 1; padding: 4px; }
  .cw-subnav { width: 100%; padding: 12px; border-right: 0; border-bottom: var(--ks-line); }
  .cw-subnav-head { display: none; }
  .cw-subnav-list { flex-direction: row; gap: 8px; overflow-x: auto; padding: 4px 4px 8px; }
  .cw-subnav-item { flex-shrink: 0; padding: 10px 12px; font-size: 13px; white-space: nowrap; }
}
</style>
