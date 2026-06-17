<template>
  <div class="cs-dashboard">
    <header class="cs-dash-header">
      <div>
        <h1>{{ $t('characterStudio.dashboardTitle') }}</h1>
        <p>{{ $t('characterStudio.dashboardDesc') }}</p>
      </div>
      <el-button type="primary" @click="goNew">
        <el-icon><Plus /></el-icon>
        {{ $t('characterStudio.createNew') }}
      </el-button>
    </header>

    <div v-if="loading" class="cs-dash-loading">{{ $t('common.loading') }}</div>

    <div v-else class="cs-dash-grid">
      <button type="button" class="cs-card cs-card--new" @click="goNew">
        <div class="cs-card-new-icon">+</div>
        <span>{{ $t('characterStudio.createNew') }}</span>
      </button>

      <div
        v-for="item in characters"
        :key="item.id || item._id"
        class="cs-card cs-card--character"
        @click="openWorkbench(item)"
      >
        <div class="cs-card-thumb">
          <img :src="getImageUrl(item.image_url || item.character_image_url)" :alt="item.character_name" />
        </div>
        <div class="cs-card-meta">
          <span class="cs-card-name">{{ item.character_name || $t('characterStudio.unnamed') }}</span>
          <el-button link type="primary" @click.stop="openWorkbench(item)">
            <el-icon><EditPen /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Plus, EditPen } from '@element-plus/icons-vue';
import { getImageUrl } from '@/utils/characterStudioPrompt';

export default {
  name: 'CharacterStudioDashboard',
  components: { Plus, EditPen },
  data() {
    return {
      loading: false,
      characters: [],
    };
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
  padding: 24px 20px 48px;
}

.cs-dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.cs-dash-header h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #1f1f1f;
}

.cs-dash-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.cs-dash-loading {
  text-align: center;
  padding: 80px 0;
  color: #999;
}

.cs-dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.cs-card {
  border: 1px solid #ececf0;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.cs-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.cs-card--new {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-style: dashed;
  border-color: #d6d9df;
  background: #fafbfc;
  color: #606266;
  font-size: 15px;
  font-weight: 500;
}

.cs-card-new-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%);
  color: #e86b3a;
  font-size: 32px;
  line-height: 56px;
  text-align: center;
}

.cs-card-thumb {
  aspect-ratio: 1;
  background: repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 16px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.cs-card-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.cs-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-top: 1px solid #f0f0f0;
}

.cs-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
