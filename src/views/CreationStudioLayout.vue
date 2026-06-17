<template>
  <div class="cw-layout">
    <!-- 第一栏：上图标下文字，窄轨 -->
    <nav class="cw-rail" aria-label="creation domains">
      <router-link :to="{ name: 'Home' }" class="cw-rail-home" :title="$t('nav.home')">
        <span class="cw-rail-icon" v-html="homeIcon" />
        <span class="cw-rail-label">{{ $t('nav.home') }}</span>
      </router-link>

      <button
        v-for="domain in domains"
        :key="domain.key"
        type="button"
        class="cw-rail-item"
        :class="{ active: activeDomain === domain.key }"
        @click="switchDomain(domain)"
      >
        <span class="cw-rail-icon cw-rail-icon--domain">
          <img :src="domain.iconSrc" :alt="$t(domain.labelKey)" />
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
.cw-layout {
  display: flex;
  min-height: calc(100vh - 50px);
  background: #f5f6f8;
}

/* 第一栏 icon rail */
.cw-rail {
  width: 80px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #ececf0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 16px;
  gap: 6px;
}

.cw-rail-home,
.cw-rail-item {
  width: 72px;
  padding: 6px 4px 8px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #606266;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: background 0.15s, color 0.15s;
}

.cw-rail-home:hover,
.cw-rail-item:hover {
  background: #f3f0f8;
  color: #8167a9;
}

.cw-rail-item.active {
  background: #ede8f5;
  color: #8167a9;
}

.cw-rail-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cw-rail-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.cw-rail-icon--domain {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #ece8f4;
  box-shadow: 0 2px 8px rgba(129, 103, 169, 0.08);
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.cw-rail-icon--domain img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cw-rail-item:hover .cw-rail-icon--domain {
  border-color: #c4b3dc;
  box-shadow: 0 4px 12px rgba(129, 103, 169, 0.18);
  transform: translateY(-1px);
}

.cw-rail-item.active .cw-rail-icon--domain {
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.22), 0 4px 14px rgba(129, 103, 169, 0.16);
}

.cw-rail-label {
  font-size: 11px;
  line-height: 1.25;
  font-weight: 600;
  text-align: center;
  max-width: 68px;
  word-break: keep-all;
}

.cw-rail-home {
  margin-bottom: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 0;
  width: 100%;
}

.cw-rail-home:hover {
  border-radius: 10px;
}

/* 第二栏 sub nav */
.cw-subnav {
  width: 188px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #ececf0;
  padding: 18px 12px 24px;
  display: flex;
  flex-direction: column;
}

.cw-subnav-head {
  padding: 0 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.cw-subnav-head h2 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: #8167a9;
}

.cw-subnav-head p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.cw-subnav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cw-subnav-item {
  display: block;
  padding: 9px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.cw-subnav-item:hover {
  background: #f3f0f8;
  color: #8167a9;
}

.cw-subnav-item.active {
  background: #ede8f5;
  color: #8167a9;
  font-weight: 600;
}

.cw-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.cw-main :deep(> *) {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .cw-layout {
    flex-direction: column;
  }

  .cw-rail {
    width: 100%;
    flex-direction: row;
    justify-content: space-around;
    padding: 8px 6px;
    border-right: none;
    border-bottom: 1px solid #ececf0;
  }

  .cw-rail-home {
    margin-bottom: 0;
    padding-bottom: 8px;
    border-bottom: none;
    width: auto;
  }

  .cw-subnav {
    width: 100%;
    padding: 12px;
    border-right: none;
    border-bottom: 1px solid #ececf0;
  }

  .cw-subnav-head {
    display: none;
  }

  .cw-subnav-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cw-subnav-item {
    font-size: 12px;
    padding: 6px 10px;
    background: #f5f6f8;
  }
}
</style>
