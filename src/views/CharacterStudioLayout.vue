<template>
  <div class="cs-layout">
    <aside class="cs-sidebar">
      <div class="cs-sidebar-brand">
        <router-link :to="{ name: 'character-studio' }" class="cs-brand-link">
          {{ $t('characterStudio.layoutTitle') }}
        </router-link>
      </div>

      <nav class="cs-nav">
        <p class="cs-nav-label">{{ $t('characterStudio.navCreate') }}</p>
        <router-link
          :to="{ name: 'character-studio' }"
          class="cs-nav-item"
          :class="{ active: isDashboard }"
        >
          {{ $t('characterStudio.navProjects') }}
        </router-link>
        <router-link
          :to="{ name: 'character-studio-workbench', params: { characterId: 'new' } }"
          class="cs-nav-item"
          :class="{ active: isWorkbench }"
        >
          {{ $t('characterStudio.stepTurbo') }}
        </router-link>
        <router-link to="/create-group-images" class="cs-nav-item">
          {{ $t('nav.createGroupImages') }}
        </router-link>
        <router-link to="/editorpro" class="cs-nav-item">
          {{ $t('nav.createIllustration') }}
        </router-link>
        <router-link to="/create-layout-illustration" class="cs-nav-item">
          {{ $t('nav.createLayoutIllustration') }}
        </router-link>
      </nav>

      <nav class="cs-nav cs-nav--muted">
        <p class="cs-nav-label">{{ $t('characterStudio.navMore') }}</p>
        <router-link to="/create-character" class="cs-nav-item">
          {{ $t('nav.createCharacterLegacy') }}
        </router-link>
        <router-link to="/prompt-fill" class="cs-nav-item">
          {{ $t('nav.promptFill') }}
        </router-link>
      </nav>
    </aside>

    <div class="cs-main">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CharacterStudioLayout',
  computed: {
    isDashboard() {
      return this.$route.name === 'character-studio';
    },
    isWorkbench() {
      return this.$route.name === 'character-studio-workbench';
    },
  },
};
</script>

<style scoped>
.cs-layout {
  display: flex;
  min-height: calc(100vh - 50px);
  background: #f5f6f8;
}

.cs-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #ececf0;
  padding: 20px 14px 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-sidebar-brand {
  padding: 0 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.cs-brand-link {
  font-size: 15px;
  font-weight: 700;
  color: #e86b3a;
  text-decoration: none;
}

.cs-brand-link:hover {
  color: #d45a2a;
}

.cs-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cs-nav--muted {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.cs-nav-label {
  margin: 0 0 8px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #909399;
}

.cs-nav-item {
  display: block;
  padding: 9px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.cs-nav-item:hover {
  background: #fff8f5;
  color: #e86b3a;
}

.cs-nav-item.active {
  background: #fff3ed;
  color: #e86b3a;
  font-weight: 600;
}

.cs-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

@media (max-width: 900px) {
  .cs-layout {
    flex-direction: column;
  }

  .cs-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 12px 14px;
    border-right: none;
    border-bottom: 1px solid #ececf0;
  }

  .cs-sidebar-brand {
    width: 100%;
    padding-bottom: 8px;
    margin-bottom: 0;
    border-bottom: none;
  }

  .cs-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cs-nav--muted {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  .cs-nav-label {
    display: none;
  }

  .cs-nav-item {
    padding: 6px 10px;
    font-size: 12px;
    background: #f5f6f8;
  }
}
</style>
