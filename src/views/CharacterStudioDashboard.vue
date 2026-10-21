<template>
  <div class="cs-dashboard">
    <header class="cs-dash-header">
      <div>
        <h1>{{ pickMode ? $t('characterStudio.pickCharacterTitle') : $t('characterStudio.dashboardTitle') }}</h1>
        <p>{{ pickMode ? $t('characterStudio.pickCharacterDesc') : $t('characterStudio.dashboardDesc') }}</p>
      </div>
      <template v-if="!pickMode">
        <el-button type="primary" @click="goNew">
          <el-icon><Plus /></el-icon>
          {{ $t('characterStudio.createNew') }}
        </el-button>
      </template>
      <el-button v-else @click="cancelPick">{{ $t('common.cancel') }}</el-button>
    </header>

    <div v-if="loading" class="cs-dash-loading">{{ $t('common.loading') }}</div>

    <div v-else-if="characters.length === 0" class="cs-dash-empty">
      <p>{{ $t('myHomePage.noCharacters') }}</p>
      <el-button v-if="!pickMode" type="primary" @click="goNew">{{ $t('characterStudio.createNew') }}</el-button>
    </div>

    <div v-else class="cs-dash-grid">
      <button v-if="!pickMode" type="button" class="cs-card cs-card--new" @click="goNew">
        <div class="cs-card-new-icon">+</div>
        <span>{{ $t('characterStudio.createNew') }}</span>
      </button>

      <div
        v-for="item in characters"
        :key="item.id || item._id"
        class="cs-card cs-card--character"
        role="group"
        :aria-label="item.character_name || $t('characterStudio.unnamed')"
        @click="onCardClick(item)"
      >
        <button type="button" class="cs-card-thumb" :aria-label="(pickMode ? $t('characterStudio.tapToSelect') : $t('myHomePage.edit')) + ' · ' + (item.character_name || $t('characterStudio.unnamed'))" @click.stop="onCardClick(item)">
          <img v-lazy-image="getImageUrl(item.image_url || item.character_image_url)" decoding="async" :alt="item.character_name" />
        </button>
        <div class="cs-card-meta">
          <span class="cs-card-name">{{ item.character_name || $t('characterStudio.unnamed') }}</span>
          <div v-if="!pickMode" class="cs-card-actions" @click.stop>
            <el-button size="small" type="primary" class="cs-action-btn" @click="openWorkbench(item)">
              {{ $t('myHomePage.edit') }}
            </el-button>
            <el-button size="small" class="cs-action-btn" @click="openEditorPro(item)">
              {{ $t('characterStudio.editInEditor') }}
            </el-button>
            <el-button size="small" class="cs-action-btn cs-action-btn--full" @click="goGroupImages(item)">
              {{ $t('characterStudio.createGroup') }}
            </el-button>
          </div>
          <span v-else class="cs-pick-hint">{{ $t('characterStudio.tapToSelect') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue';
import { getImageUrl } from '@/utils/characterStudioPrompt';
import { setCreateGroupImagesReference } from '@/utils/createGroupImagesHandoff';
import { setEditorproPendingImage } from '@/utils/editorproPendingImage';
import { navigateTo } from '@/utils/navigate';

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
    openEditorPro(item) {
      const imageUrl = getImageUrl(item.image_url || item.character_image_url);
      if (!imageUrl) return;
      setEditorproPendingImage(imageUrl, {
        title: item.character_name || item.name || '',
      });
      navigateTo(this.$router, { name: 'editorpro' }, '/editorpro');
    },
    goGroupImages(item) {
      const id = item.id || item._id;
      const name = item.character_name || item.name || '';
      const imageUrl = getImageUrl(item.image_url || item.character_image_url);
      if (!imageUrl) return;
      setCreateGroupImagesReference(imageUrl, {
        characterId: id,
        characterName: name || undefined,
      });
      navigateTo(this.$router, { name: 'create-group-images' }, '/creation-studio/character/groups');
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
.cs-dashboard { padding: 40px clamp(24px, 4vw, 56px) 64px; }
.cs-dash-header { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; padding-bottom: 28px; border-bottom: var(--ks-line); }
.cs-dash-header h1 { margin: 0 0 8px; color: var(--ks-ink); font-size: clamp(28px, 3vw, 40px); font-weight: 600; line-height: 1.4; }
.cs-dash-header p { max-width: 620px; margin: 0; color: var(--ks-muted); font-size: 14px; line-height: 1.8; }
.cs-dash-header > .el-button { flex-shrink: 0; min-height: 44px; padding: 10px 20px; border: var(--ks-line); border-radius: var(--ks-radius-md); background: var(--ks-pink); color: var(--ks-ink); box-shadow: var(--ks-shadow-sm); font-size: 14px; font-weight: 600; }
.cs-dash-loading, .cs-dash-empty { padding: 64px 24px; color: var(--ks-muted); text-align: center; }
.cs-dash-empty { border: 2px dashed var(--ks-border); border-radius: var(--ks-radius-lg); background: var(--ks-panel); }
.cs-dash-empty .el-button { margin-top: 16px; min-height: 44px; }
.cs-dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 245px), 1fr)); gap: 24px; }
.cs-card { overflow: hidden; border: var(--ks-line); border-radius: var(--ks-radius-lg); background: var(--ks-surface); box-shadow: 4px 4px 0 var(--ks-blue); cursor: pointer; transition: box-shadow var(--ks-motion), transform var(--ks-motion); }
.cs-card:nth-child(odd) { box-shadow: 4px 4px 0 var(--ks-yellow); }
.cs-card:hover { transform: translateY(-2px); box-shadow: var(--ks-shadow); }
.cs-card.cs-card--new { min-height: 340px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; border-style: dashed; background: var(--ks-paper); color: var(--ks-ink); box-shadow: none; font-size: 22px; font-weight: 500; }
.cs-card-new-icon { display: grid; place-items: center; width: 56px; height: 56px; border: var(--ks-line); border-radius: 50%; background: var(--ks-yellow); box-shadow: var(--ks-shadow-sm); color: var(--ks-ink); font: 32px/1 var(--ks-font); }
.cs-card-thumb { display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 3/2; padding: 20px; border: 0; border-radius: 0; background: var(--ks-panel); cursor: pointer; }
.cs-card-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
.cs-card-meta { display: flex; flex-direction: column; gap: 16px; padding: 20px 16px; border-top: var(--ks-line); }
.cs-card-name { overflow: hidden; color: var(--ks-ink); font-size: 20px; line-height: 1.5; font-weight: 600; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
.cs-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.cs-card-actions :deep(.el-button) { width: 100%; min-height: 36px; height: auto; margin: 0; padding: 8px 4px; border: var(--ks-line); border-radius: var(--ks-radius-sm); background: var(--ks-surface); color: var(--ks-ink); font-size: 13px; line-height: 1.5; white-space: normal; }
.cs-card-actions :deep(.el-button:hover) { background: var(--ks-primary-soft); border-color: var(--ks-primary); color: var(--ks-primary-hover); }
.cs-card-actions :deep(.cs-action-btn--full) { grid-column: 1 / -1; background: var(--ks-ink); color: white; }
.cs-pick-hint { color: var(--ks-primary-hover); font-size: 13px; font-weight: 600; }
@media (max-width: 1024px) { .cs-dash-header { flex-wrap: wrap; } }
@media (max-width: 768px) {
  .cs-dashboard { padding: 24px 16px 40px; }
  .cs-dash-header { align-items: flex-start; flex-direction: column; gap: 16px; padding-bottom: 24px; }
  .cs-card.cs-card--new { min-height: 180px; }
  .cs-card-actions :deep(.el-button) { min-height: 44px; }
}
</style>
