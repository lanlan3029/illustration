<template>
  <div class="cs-workbench">
    <aside class="cs-panel">
      <button type="button" class="cs-back" @click="goDashboard">
        ← {{ $t('characterStudio.backToProjects') }}
      </button>

      <div class="cs-field-head">
        <div class="cs-field-head-row">
          <el-input
            v-model="characterName"
            class="cs-name-input"
            :placeholder="$t('characterStudio.characterName')"
          />
          <router-link
            :to="{ name: 'prompt-fill', query: { return: $route.fullPath } }"
            class="cs-guide-link"
          >{{ $t('characterStudio.promptGuide') }}</router-link>
        </div>
      </div>

      <section class="cs-section">
        <label class="cs-label">{{ $t('characterStudio.describeCharacter') }}</label>
        <el-input
          v-model="description"
          type="textarea"
          :rows="5"
          :placeholder="$t('characterStudio.describePlaceholder')"
        />
        <div class="cs-prompt-toolbar">
          <div class="cs-prompt-toolbar-left">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="onRefUpload"
            >
              <el-button size="small">{{ $t('characterStudio.uploadReference') }}</el-button>
            </el-upload>
            <el-button v-if="referencePreview" size="small" link type="danger" @click="clearReference">
              {{ $t('characterStudio.clearReference') }}
            </el-button>
          </div>
          <el-button size="small" @click="inspireMe">{{ $t('characterStudio.inspireMe') }}</el-button>
        </div>
        <div v-if="referencePreview" class="cs-ref-preview">
          <img :src="referencePreview" alt="ref" />
        </div>
      </section>

      <div class="cs-row-2">
        <section class="cs-section cs-section--half">
          <label class="cs-label">{{ $t('characterStudio.aspectRatio') }}</label>
          <el-select v-model="aspectRatio" style="width: 100%">
            <el-option
              v-for="opt in aspectOptions"
              :key="opt.value"
              :label="$t(opt.labelKey)"
              :value="opt.value"
            />
          </el-select>
        </section>
        <section class="cs-section cs-section--half">
          <label class="cs-label">{{ $t('characterStudio.style') }}</label>
          <el-popover placement="bottom" :width="280" trigger="click">
            <template #reference>
              <button type="button" class="cs-style-trigger">
                <img v-if="selectedStyleImage" :src="selectedStyleImage" alt="" class="cs-style-thumb" />
                <span>{{ selectedStyleLabel }}</span>
                <span class="cs-caret">▾</span>
              </button>
            </template>
            <div class="cs-style-popover">
              <button
                v-for="s in styles"
                :key="s.key"
                type="button"
                class="cs-style-opt"
                :class="{ active: artStyleKey === s.key }"
                @click="artStyleKey = s.key"
              >
                <img :src="s.image" :alt="s.artStyle" />
                <span>{{ s.artStyle }}</span>
              </button>
            </div>
          </el-popover>
        </section>
      </div>

      <el-button
        type="primary"
        class="cs-generate-btn"
        :loading="generatingView === 'front'"
        @click="generateView('front')"
      >
        {{ generatingView === 'front' ? $t('characterStudio.generating') : $t('characterStudio.generate') }}
      </el-button>
      <p class="cs-points-hint">{{ $t('createCharacter.pointsHint') }}</p>
    </aside>

    <main class="cs-gallery">
      <div class="cs-gallery-toolbar">
        <span class="cs-gallery-title">{{ $t('characterStudio.generations') }}</span>
      </div>

      <div v-if="generatingView" class="cs-generating">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>{{ $t('characterStudio.generatingWait') }}</p>
      </div>

      <!-- 正面 -->
      <section class="cs-view-card">
        <div class="cs-view-head">
          <span class="cs-view-label">{{ $t('characterStudio.viewFront') }}</span>
          <span v-if="views.front.collected" class="cs-view-badge">{{ $t('characterStudio.collected') }}</span>
        </div>
        <div v-if="!views.front.preview && !generatingView" class="cs-view-empty">
          {{ $t('characterStudio.noGenerations') }}
        </div>
        <div v-if="views.front.preview" class="cs-view-body">
          <img :src="views.front.preview" alt="front" class="cs-view-img" @click="previewUrl(views.front.preview)" />
          <div class="cs-view-actions">
            <el-button
              v-if="!views.front.collected"
              type="primary"
              :loading="collectingView === 'front'"
              @click="collectView('front')"
            >
              {{ $t('characterStudio.collectCharacter') }}
            </el-button>
            <template v-else>
              <el-button size="small" @click="downloadImage(views.front.preview)">{{ $t('characterStudio.download') }}</el-button>
              <el-button size="small" @click="openEditorPro(views.front.preview)">{{ $t('characterStudio.editInEditor') }}</el-button>
              <el-button size="small" @click="goGroupImages(views.front.preview)">{{ $t('characterStudio.createGroup') }}</el-button>
            </template>
          </div>
        </div>
      </section>

      <!-- 收集正面后：侧面 / 背面 -->
      <section v-if="views.front.collected" class="cs-extra-views">
        <p class="cs-extra-hint">{{ $t('characterStudio.extraViewsHint') }}</p>

        <div
          v-for="viewKey in ['side', 'back']"
          :key="viewKey"
          class="cs-view-card cs-view-card--compact"
        >
          <div class="cs-view-head">
            <span class="cs-view-label">{{ $t(`characterStudio.view${viewKey.charAt(0).toUpperCase()}${viewKey.slice(1)}`) }}</span>
            <span v-if="views[viewKey].collected" class="cs-view-badge">{{ $t('characterStudio.collected') }}</span>
          </div>
          <el-input
            v-model="views[viewKey].prompt"
            type="textarea"
            :rows="2"
            :placeholder="$t('characterStudio.viewPromptPlaceholder')"
            class="cs-view-prompt"
          />
          <div class="cs-view-actions">
            <el-button
              size="small"
              :loading="generatingView === viewKey"
              @click="generateView(viewKey)"
            >
              {{ $t(`characterStudio.generate${viewKey.charAt(0).toUpperCase()}${viewKey.slice(1)}`) }}
            </el-button>
            <el-button
              v-if="views[viewKey].preview && !views[viewKey].collected"
              type="primary"
              size="small"
              :loading="collectingView === viewKey"
              @click="collectView(viewKey)"
            >
              {{ $t('characterStudio.collectCharacter') }}
            </el-button>
          </div>
          <img
            v-if="views[viewKey].preview"
            :src="views[viewKey].preview"
            :alt="viewKey"
            class="cs-view-img cs-view-img--compact"
            @click="previewUrl(views[viewKey].preview)"
          />
        </div>
      </section>

      <el-image-viewer
        v-if="previewVisible"
        :url-list="[previewTarget]"
        teleported
        @close="previewVisible = false"
      />
    </main>
  </div>
</template>

<script>
import { useIllustrationStyles } from '@/composables/useIllustrationStyles';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { ElImageViewer } from 'element-plus';
import { generateCharacterImage, saveCharacterView } from '@/utils/characterStudioApi';
import { setEditorproPendingImage } from '@/utils/editorproPendingImage';
import { setCreateGroupImagesReference } from '@/utils/createGroupImagesHandoff';
import { navigateTo } from '@/utils/navigate';
import {
  ASPECT_RATIO_OPTIONS,
  DEFAULT_ACTION,
  DEFAULT_VIEW_PROMPTS,
  buildCharacterStudioPrompt,
  buildViewPrompt,
  resolveStyleInfo,
  getImageUrl,
  INSPIRE_PROMPTS,
} from '@/utils/characterStudioPrompt';
import { takePromptFillPending } from '@/utils/promptFillHandoff';
import { clearLegacyCharacterDrafts } from '@/utils/legacyCharacterStorage';
function emptyViewState(prompt = '') {
  return { preview: '', collected: false, prompt };
}

export default {
  name: 'CharacterStudioWorkbench',
  components: { Loading, ElImageViewer },
  props: {
    characterId: { type: String, default: 'new' },
  },
  setup() {
    const { styles } = useIllustrationStyles();
    return { styles, aspectOptions: ASPECT_RATIO_OPTIONS };
  },
  data() {
    return {
      characterName: '',
      description: '',
      artStyleKey: 'healingWatercolor',
      aspectRatio: '1024x1024',
      referenceBase64: '',
      referencePreview: '',
      savedCharacterId: '',
      views: {
        front: emptyViewState(''),
        side: emptyViewState(DEFAULT_VIEW_PROMPTS.side),
        back: emptyViewState(DEFAULT_VIEW_PROMPTS.back),
      },
      generatingView: null,
      collectingView: null,
      previewVisible: false,
      previewTarget: '',
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
    };
  },
  computed: {
    storageKey() {
      const id = this.characterId || this.$route.params.characterId || 'new';
      return `character_studio_${id}`;
    },
    selectedStyleLabel() {
      const s = this.styles.find((x) => x.key === this.artStyleKey);
      return s?.artStyle || this.$t('characterStudio.pickStyle');
    },
    selectedStyleImage() {
      const s = this.styles.find((x) => x.key === this.artStyleKey);
      return s?.image || null;
    },
  },
  mounted() {
    clearLegacyCharacterDrafts();
    this.loadSession();
    this.applyPendingPrompt();
    if (this.characterId && this.characterId !== 'new') {
      this.loadCharacter(this.characterId);
    }
  },
  watch: {
    '$route.params.characterId'(id) {
      if (id && id !== 'new') {
        this.loadCharacter(id);
        this.$nextTick(() => this.saveSession());
      }
    },
  },
  methods: {
    applyPendingPrompt() {
      const pending = takePromptFillPending();
      if (pending) {
        this.description = pending;
        this.saveSession();
      }
    },
    goDashboard() {
      this.$router.push({ name: 'character-studio' });
    },
    loadSession() {
      try {
        const raw = sessionStorage.getItem(this.storageKey);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.characterName) this.characterName = data.characterName;
        if (data.description) this.description = data.description;
        if (data.artStyleKey) this.artStyleKey = data.artStyleKey;
        if (data.aspectRatio) this.aspectRatio = data.aspectRatio;
        if (data.savedCharacterId) this.savedCharacterId = data.savedCharacterId;
        if (data.views) {
          ['front', 'side', 'back'].forEach((key) => {
            if (data.views[key]) {
              this.views[key] = { ...this.views[key], ...data.views[key] };
            }
          });
        }
      } catch {
        /* ignore */
      }
    },
    saveSession() {
      sessionStorage.setItem(
        this.storageKey,
        JSON.stringify({
          characterName: this.characterName,
          description: this.description,
          artStyleKey: this.artStyleKey,
          aspectRatio: this.aspectRatio,
          savedCharacterId: this.savedCharacterId,
          views: this.views,
        })
      );
    },
    async loadCharacter(id) {
      try {
        const token = localStorage.getItem('token') || '';
        const apiUrl = this.apiBaseUrl ? `${this.apiBaseUrl}/character/${id}` : `/character/${id}`;
        const res = await this.$http.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const char = res?.data?.data || res?.data?.message || res?.data;
        if (!char) return;
        this.savedCharacterId = String(char.id || char._id || '');
        this.characterName = char.character_name || char.name || '';
        if (!this.description && char.description) this.description = char.description;

        const frontUrl = getImageUrl(char.image_url || char.character_image_url);
        if (frontUrl) {
          this.views.front = { ...this.views.front, preview: frontUrl, collected: true };
        }
        const sideUrl = getImageUrl(char.view_side_url);
        if (sideUrl) {
          this.views.side = { ...this.views.side, preview: sideUrl, collected: true };
        }
        const backUrl = getImageUrl(char.view_back_url);
        if (backUrl) {
          this.views.back = { ...this.views.back, preview: backUrl, collected: true };
        }
        this.saveSession();
      } catch (e) {
        console.warn('load character failed', e);
      }
    },
    async onRefUpload(uploadFile) {
      const file = uploadFile?.raw;
      if (!file?.type?.startsWith('image/')) return;
      const dataUrl = await this.fileToBase64(file);
      this.referenceBase64 = dataUrl;
      this.referencePreview = dataUrl;
    },
    inspireMe() {
      this.description = INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)];
      ElMessage.success(this.$t('characterStudio.inspireApplied'));
    },
    clearReference() {
      this.referenceBase64 = '';
      this.referencePreview = '';
    },
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    buildPromptForView(viewKey) {
      const styleInfo = resolveStyleInfo(this.styles, this.artStyleKey);
      if (viewKey === 'front') {
        return buildCharacterStudioPrompt({
          description: (this.description || '').trim(),
          action: DEFAULT_ACTION,
          styleInfo,
          withReferenceImage: Boolean(this.referenceBase64),
        });
      }
      return buildViewPrompt({
        view: viewKey,
        customPrompt: this.views[viewKey].prompt,
        styleInfo,
      });
    },
    async generateView(viewKey) {
      if (viewKey === 'front') {
        const desc = (this.description || '').trim();
        if (!desc && !this.referenceBase64) {
          ElMessage.warning(this.$t('characterStudio.needDescriptionOrRef'));
          return;
        }
      } else if (!this.views.front.collected) {
        ElMessage.warning(this.$t('characterStudio.collectFrontFirst'));
        return;
      }

      this.generatingView = viewKey;
      try {
        const { imageUrl, result } = await generateCharacterImage(this.$http, {
          apiBaseUrl: this.apiBaseUrl,
          prompt: this.buildPromptForView(viewKey),
          size: this.aspectRatio,
          referenceImage: viewKey === 'front' ? this.referenceBase64 : '',
          characterIds: viewKey !== 'front' ? [this.savedCharacterId] : [],
        });

        if (result.points !== undefined && this.$store?.state) {
          this.$store.commit('setUserInfo', {
            ...(this.$store.state.userInfo || {}),
            points: result.points,
          });
        }

        this.views[viewKey].preview = imageUrl;
        this.views[viewKey].collected = false;
        this.saveSession();
        ElMessage.success(this.$t('characterStudio.generateSuccess'));
      } catch (e) {
        ElMessage.error(e.message || this.$t('characterStudio.generateFailed'));
      } finally {
        this.generatingView = null;
      }
    },
    async collectView(viewKey) {
      const preview = this.views[viewKey]?.preview;
      if (!preview) {
        ElMessage.warning(this.$t('characterStudio.noImageToCollect'));
        return;
      }

      this.collectingView = viewKey;
      try {
        const name = (this.characterName || '').trim() || this.$t('characterStudio.unnamed');
        const saved = await saveCharacterView(this.$http, {
          apiBaseUrl: this.apiBaseUrl,
          characterId: this.savedCharacterId,
          viewType: viewKey,
          imageUrl: preview,
          characterName: name,
          description: (this.description || '').trim(),
        });

        if (!saved?.id) {
          ElMessage.error(this.$t('characterStudio.pleaseLogin'));
          return;
        }

        this.savedCharacterId = saved.id;
        this.views[viewKey].collected = true;

        if (this.characterId === 'new' && viewKey === 'front') {
          await this.$router.replace({
            name: 'character-studio-workbench',
            params: { characterId: saved.id },
          });
          await this.$nextTick();
        }

        this.saveSession();
        ElMessage.success(this.$t('characterStudio.collectSuccess'));
      } catch (e) {
        ElMessage.error(e.message || this.$t('characterStudio.collectFailed'));
      } finally {
        this.collectingView = null;
      }
    },
    previewUrl(url) {
      this.previewTarget = url;
      this.previewVisible = true;
    },
    openEditorPro(url) {
      if (!url) return;
      const imageUrl = url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')
        ? url
        : getImageUrl(url);
      setEditorproPendingImage(imageUrl, { title: this.characterName || '' });
      navigateTo(this.$router, { name: 'editorpro' }, '/editorpro');
    },
    goGroupImages(url) {
      if (!url) return;
      const imageUrl = url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')
        ? url
        : getImageUrl(url);
      setCreateGroupImagesReference(imageUrl, {
        characterId: this.savedCharacterId || undefined,
        characterName: (this.characterName || '').trim() || undefined,
      });
      navigateTo(this.$router, { name: 'create-group-images' }, '/creation-studio/character/groups');
    },
    async downloadImage(url) {
      if (!url) return;
      try {
        if (url.startsWith('data:')) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `character_${Date.now()}.png`;
          link.click();
        } else {
          const fetchUrl = url.startsWith('http') ? url : getImageUrl(url);
          const res = await fetch(fetchUrl);
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `character_${Date.now()}.jpg`;
          link.click();
          window.URL.revokeObjectURL(blobUrl);
        }
        ElMessage.success(this.$t('characterStudio.downloadSuccess'));
      } catch {
        ElMessage.error(this.$t('characterStudio.downloadFailed'));
      }
    },
  },
};
</script>

<style scoped>
.cs-workbench {
  display: flex;
  min-height: calc(100vh - 50px);
  background: #f5f6f8;
}

.cs-panel {
  width: 380px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #ececf0;
  padding: 20px 18px 32px;
  overflow-y: auto;
}

.cs-back {
  border: none;
  background: none;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
}

.cs-back:hover {
  color: #8167a9;
}

.cs-field-head {
  margin-bottom: 16px;
}

.cs-field-head-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-guide-link {
  font-size: 12px;
  color: #8167a9;
  text-decoration: none;
}

.cs-guide-link:hover {
  text-decoration: underline;
}

.cs-prompt-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.cs-prompt-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cs-name-input :deep(.el-input__inner) {
  font-weight: 600;
  font-size: 16px;
}

.cs-section {
  margin-bottom: 16px;
}

.cs-section--half {
  flex: 1;
  min-width: 0;
}

.cs-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.cs-ref-preview {
  margin-top: 8px;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
}

.cs-ref-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cs-row-2 {
  display: flex;
  gap: 12px;
}

.cs-style-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.cs-style-thumb {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: cover;
}

.cs-caret {
  margin-left: auto;
  color: #999;
}

.cs-style-popover {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cs-style-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}

.cs-style-opt img {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
}

.cs-style-opt.active,
.cs-style-opt:hover {
  border-color: #8167a9;
  background: #f3f0f8;
}

.cs-generate-btn {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
  --el-button-bg-color: #8167a9;
  --el-button-border-color: #8167a9;
  --el-button-hover-bg-color: #6d5694;
  --el-button-hover-border-color: #6d5694;
}

.cs-points-hint {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin: 8px 0 0;
}

.cs-gallery {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.cs-gallery-toolbar {
  margin-bottom: 16px;
}

.cs-gallery-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
}

.cs-generating {
  text-align: center;
  padding: 24px;
  color: #666;
}

.cs-view-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.cs-view-card--compact {
  margin-bottom: 12px;
}

.cs-view-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.cs-view-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.cs-view-badge {
  font-size: 12px;
  color: #529b2e;
  background: #f0f9eb;
  padding: 2px 8px;
  border-radius: 999px;
}

.cs-view-empty {
  color: #909399;
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
}

.cs-view-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-view-img {
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1;
  object-fit: contain;
  background: repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 16px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.cs-view-img--compact {
  max-width: 240px;
  margin-top: 12px;
}

.cs-view-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cs-view-prompt {
  margin-bottom: 8px;
}

.cs-extra-views {
  margin-top: 8px;
}

.cs-extra-hint {
  font-size: 13px;
  color: #606266;
  margin: 0 0 12px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .cs-workbench {
    flex-direction: column;
  }
  .cs-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ececf0;
  }
}
</style>
