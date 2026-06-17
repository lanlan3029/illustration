<template>
  <div class="cs-dashboard">
    <header class="cs-dash-header">
      <div class="cs-dash-header-text">
        <h1>{{ pickMode ? $t('characterStudio.pickCharacterTitle') : $t('characterStudio.dashboardTitle') }}</h1>
        <p>{{ pickMode ? $t('characterStudio.pickCharacterDesc') : $t('characterStudio.dashboardDesc') }}</p>
        <p v-if="!pickMode && characters.length" class="cs-dash-count">
          {{ $t('characterStudio.characterCount', { count: characters.length }) }}
        </p>
      </div>
      <template v-if="!pickMode">
        <el-button class="cs-create-btn" type="primary" round @click="goNew">
          <el-icon><Plus /></el-icon>
          {{ $t('characterStudio.createNew') }}
        </el-button>
      </template>
      <el-button v-else round @click="cancelPick">{{ $t('common.cancel') }}</el-button>
    </header>

    <div v-if="loading" class="cs-dash-loading">
      <div class="cs-dash-loading-dot" />
      <span>{{ $t('common.loading') }}</span>
    </div>

    <div v-else-if="characters.length === 0" class="cs-dash-empty">
      <div class="cs-empty-icon">✦</div>
      <p class="cs-empty-title">{{ $t('myHomePage.noCharacters') }}</p>
      <p class="cs-empty-desc">{{ $t('characterStudio.dashboardDesc') }}</p>
      <el-button v-if="!pickMode" class="cs-create-btn" type="primary" round @click="goNew">
        {{ $t('characterStudio.createNew') }}
      </el-button>
    </div>

    <div v-else class="cs-dash-grid">
      <button v-if="!pickMode" type="button" class="cs-card cs-card--new" @click="goNew">
        <div class="cs-card-new-icon">
          <el-icon><Plus /></el-icon>
        </div>
        <span class="cs-card-new-label">{{ $t('characterStudio.createNew') }}</span>
      </button>

      <article
        v-for="item in characters"
        :key="item.id || item._id"
        class="cs-card cs-card--character"
        @click="onCardClick(item)"
      >
        <div class="cs-card-thumb">
          <img :src="getImageUrl(item.image_url || item.character_image_url)" :alt="item.character_name" />
        </div>
        <div class="cs-card-meta">
          <h3 class="cs-card-name">{{ item.character_name || $t('characterStudio.unnamed') }}</h3>
          <div v-if="!pickMode" class="cs-card-actions" @click.stop>
            <el-button class="cs-btn-edit" size="small" text @click="openWorkbench(item)">
              {{ $t('myHomePage.edit') }}
            </el-button>
            <el-button class="cs-btn-group" size="small" round @click="goGroupImages(item)">
              {{ $t('characterStudio.createGroup') }}
            </el-button>
          </div>
          <span v-else class="cs-pick-hint">{{ $t('characterStudio.tapToSelect') }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue';
import { getImageUrl } from '@/utils/characterStudioPrompt';

export default {
  name: 'CharacterStudioDashboard',
  components: { Plus },
  data() {
    return {
      loading: false,
      characters: [],
    };
  },
  computed: {
    pickMode() {
      return this.$route.query.pickForGroup === '1';
    },
    pickReturnPath() {
      const ret = this.$route.query.return;
      if (typeof ret === 'string' && ret.startsWith('/') && !ret.startsWith('//')) {
        return ret;
      }
      return '/creation-studio/character/groups';
    },
  },
  mounted() {
    this.fetchCharacters();
  },
  methods: {
    getImageUrl,
    goNew() {
      this.$router.push({ name: 'character-studio-workbench', params: { characterId: 'new' } });
    },
    openWorkbench(item) {
      const id = item.id || item._id;
      this.$router.push({ name: 'character-studio-workbench', params: { characterId: id } });
    },
    goGroupImages(item) {
      const id = item.id || item._id;
      if (id) {
        localStorage.setItem('lastCharacterId', String(id));
      }
      const name = item.character_name || item.name || '';
      if (name) localStorage.setItem('lastCharacterName', name);
      const imageUrl = getImageUrl(item.image_url || item.character_image_url);
      if (imageUrl) {
        localStorage.setItem('characterImage', imageUrl);
        sessionStorage.setItem('createGroupImages_reference', imageUrl);
      }
      this.$router.push({ name: 'create-group-images' });
    },
    onCardClick(item) {
      if (this.pickMode) {
        this.selectForGroupImages(item);
        return;
      }
      this.openWorkbench(item);
    },
    selectForGroupImages(item) {
      const id = item.id || item._id;
      localStorage.setItem(
        'selectedCharacterForGroupImages',
        JSON.stringify({
          id,
          _id: id,
          character_name: item.character_name || item.name || '',
          name: item.character_name || item.name || '',
          image_url: item.image_url || item.character_image_url || '',
        })
      );
      if (id) localStorage.setItem('lastCharacterId', String(id));
      this.$router.push(this.pickReturnPath);
    },
    cancelPick() {
      this.$router.push(this.pickReturnPath);
    },
    async fetchCharacters() {
      const userId = localStorage.getItem('id');
      const token = localStorage.getItem('token');
      if (!userId || !token) {
        this.characters = [];
        return;
      }
      this.loading = true;
      try {
        const apiUrl = process.env.VUE_APP_API_BASE_URL
          ? `${process.env.VUE_APP_API_BASE_URL}/character`
          : '/character';
        const res = await this.$http.get(apiUrl, {
          params: { user_id: userId },
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = res?.data?.data || res?.data?.message || res?.data?.list || [];
        this.characters = Array.isArray(list) ? list : [];
      } catch (e) {
        this.characters = [];
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.cs-dashboard {
  padding: 32px 36px 56px;
  max-width: 1280px;
}

.cs-dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 36px;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(129, 103, 169, 0.1);
}

.cs-dash-header-text {
  flex: 1;
  min-width: 0;
}

.cs-dash-header h1 {
  margin: 0 0 10px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1a1a2e;
}

.cs-dash-header p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #6b7280;
  max-width: 520px;
}

.cs-dash-count {
  margin-top: 10px !important;
  font-size: 13px !important;
  color: #8167a9 !important;
  font-weight: 600;
}

.cs-create-btn {
  flex-shrink: 0;
  padding: 10px 22px;
  font-weight: 600;
  --el-button-bg-color: #8167a9;
  --el-button-border-color: #8167a9;
  --el-button-hover-bg-color: #6f5694;
  --el-button-hover-border-color: #6f5694;
}

.cs-dash-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 100px 0;
  color: #9ca3af;
  font-size: 14px;
}

.cs-dash-loading-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(129, 103, 169, 0.15);
  border-top-color: #8167a9;
  animation: cs-spin 0.8s linear infinite;
}

@keyframes cs-spin {
  to {
    transform: rotate(360deg);
  }
}

.cs-dash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 72px 24px 96px;
}

.cs-empty-icon {
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f3eef8 0%, #e8dff2 100%);
  color: #8167a9;
  font-size: 28px;
  line-height: 72px;
}

.cs-empty-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: #374151;
}

.cs-empty-desc {
  margin: 0 0 28px;
  max-width: 360px;
  font-size: 14px;
  line-height: 1.6;
  color: #9ca3af;
}

.cs-dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.cs-card {
  border: 1px solid rgba(129, 103, 169, 0.12);
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.cs-card:hover {
  border-color: rgba(129, 103, 169, 0.28);
  box-shadow: 0 12px 32px rgba(129, 103, 169, 0.12);
  transform: translateY(-3px);
}

.cs-card--new {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border-style: dashed;
  border-color: rgba(129, 103, 169, 0.35);
  background: linear-gradient(180deg, #faf8fc 0%, #f5f2f9 100%);
  color: #8167a9;
}

.cs-card--new:hover {
  background: linear-gradient(180deg, #f5f0fa 0%, #ebe3f4 100%);
  border-color: #8167a9;
}

.cs-card-new-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #8167a9;
  font-size: 28px;
  box-shadow: 0 4px 16px rgba(129, 103, 169, 0.15);
}

.cs-card-new-label {
  font-size: 15px;
  font-weight: 600;
}

.cs-card-thumb {
  aspect-ratio: 1;
  background:
    repeating-conic-gradient(rgba(129, 103, 169, 0.06) 0% 25%, transparent 0% 50%) 50% / 18px 18px,
    linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.cs-card-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.06));
  transition: transform 0.25s ease;
}

.cs-card--character:hover .cs-card-thumb img {
  transform: scale(1.03);
}

.cs-card-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 16px;
  background: #fff;
}

.cs-card-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.cs-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 2px;
  border-top: 1px solid rgba(129, 103, 169, 0.08);
}

.cs-btn-edit {
  padding-left: 0 !important;
  color: #6b7280 !important;
  font-weight: 500;
}

.cs-btn-edit:hover {
  color: #8167a9 !important;
}

.cs-btn-group {
  margin-left: auto;
  flex-shrink: 0;
  font-weight: 600;
  --el-button-bg-color: #8167a9;
  --el-button-border-color: #8167a9;
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: #6f5694;
  --el-button-hover-border-color: #6f5694;
  --el-button-hover-text-color: #fff;
}

.cs-pick-hint {
  font-size: 13px;
  color: #8167a9;
  font-weight: 600;
  text-align: center;
  padding: 4px 0;
}

@media (max-width: 768px) {
  .cs-dashboard {
    padding: 20px 16px 40px;
  }

  .cs-dash-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 24px;
    padding-bottom: 20px;
  }

  .cs-dash-header h1 {
    font-size: 22px;
  }

  .cs-create-btn {
    align-self: flex-start;
  }

  .cs-dash-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .cs-card--new {
    min-height: 200px;
  }

  .cs-card-meta {
    padding: 12px;
    gap: 10px;
  }

  .cs-card-name {
    font-size: 14px;
  }

  .cs-btn-group {
    padding: 5px 12px;
    font-size: 12px;
  }
}
</style>
