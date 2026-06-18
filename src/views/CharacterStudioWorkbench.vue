<template>
  <div class="cs-workbench">
    <!-- 左侧配置区 -->
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
          <div class="cs-guide-links">
            <router-link
              :to="{ name: 'prompt-fill', query: { return: $route.fullPath } }"
              class="cs-guide-link"
            >{{ $t('characterStudio.promptGuide') }}</router-link>
          </div>
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
        :loading="generating"
        @click="handleGenerate"
      >
        {{ generating ? $t('characterStudio.generating') : $t('characterStudio.generate') }}
      </el-button>
      <p class="cs-points-hint">{{ $t('createCharacter.pointsHint') }}</p>
    </aside>

    <!-- 右侧结果区 -->
    <main class="cs-gallery">
      <div class="cs-gallery-toolbar">
        <span class="cs-gallery-title">{{ $t('characterStudio.generations') }}</span>
        <div class="cs-view-toggle">
          <button
            type="button"
            class="cs-view-btn"
            :class="{ active: galleryView === 'grid' }"
            :title="$t('characterStudio.viewGrid')"
            @click="galleryView = 'grid'"
          >
            ▦
          </button>
          <button
            type="button"
            class="cs-view-btn"
            :class="{ active: galleryView === 'list' }"
            :title="$t('characterStudio.viewList')"
            @click="galleryView = 'list'"
          >
            ☰
          </button>
        </div>
      </div>

      <div v-if="generations.length === 0 && !generating" class="cs-empty">
        <div class="cs-empty-art">
          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <rect x="20" y="30" width="80" height="60" rx="8" fill="#f3f0f8" stroke="#8167a9" stroke-width="2"/>
            <circle cx="45" cy="52" r="6" fill="#8167a9" opacity="0.6"/>
            <circle cx="75" cy="52" r="6" fill="#8167a9" opacity="0.6"/>
            <path d="M42 68 Q60 78 78 68" stroke="#8167a9" stroke-width="2" fill="none" opacity="0.6"/>
          </svg>
        </div>
        <p>{{ $t('characterStudio.noGenerations') }}</p>
      </div>

      <div v-if="generating" class="cs-generating">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>{{ $t('characterStudio.generatingWait') }}</p>
      </div>

      <div v-if="generations.length" class="cs-gen-grid" :class="{ 'cs-gen-grid--list': galleryView === 'list' }">
        <div
          v-for="(gen, idx) in generations"
          :key="gen.id"
          class="cs-gen-card"
          :class="{ 'is-saved': isGenSaved(gen) }"
        >
          <img :src="gen.url" alt="generation" @click="previewImage(idx)" />
          <div class="cs-gen-actions" @click.stop>
            <span v-if="isGenSaved(gen)" class="cs-saved-badge">
              {{ $t('characterStudio.savedToMyCharacters') }}
            </span>
            <el-button
              v-else
              size="small"
              type="primary"
              :loading="savingGenId === gen.id"
              @click="saveToMyCharacters(gen)"
            >
              {{ savedCharacterId ? $t('characterStudio.setAsCharacter') : $t('characterStudio.saveCharacter') }}
            </el-button>
            <el-button size="small" @click="downloadImage(gen.url)">{{ $t('characterStudio.download') }}</el-button>
            <el-button size="small" @click="openEditorPro(gen.url)">{{ $t('characterStudio.editInEditor') }}</el-button>
            <el-button size="small" @click="goGroupImages(gen.url)">{{ $t('characterStudio.createGroup') }}</el-button>
          </div>
        </div>
      </div>

      <el-image-viewer
        v-if="previewVisible"
        :url-list="previewUrls"
        :initial-index="previewIndex"
        teleported
        @close="previewVisible = false"
      />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { ElImageViewer } from 'element-plus';
import { ILLUSTRATION_STYLE_CONFIGS } from '@/data/illustrationStyleConfigs';
import {
  postCreateCharacter,
  isCreateCharacterResponseOk,
  resolveGenerationImageUrl,
} from '@/utils/createCharacterTask';
import { setEditorproPendingImage } from '@/utils/editorproPendingImage';
import { setCreateGroupImagesReference } from '@/utils/createGroupImagesHandoff';
import { navigateTo } from '@/utils/navigate';
import {
  ASPECT_RATIO_OPTIONS,
  DEFAULT_ACTION,
  buildCharacterStudioPrompt,
  resolveStyleInfo,
  getImageUrl,
  INSPIRE_PROMPTS,
} from '@/utils/characterStudioPrompt';
import { takePromptFillPending } from '@/utils/promptFillHandoff';
import { matCharacterImageUrl } from '@/utils/canvasMatting';

export default {
  name: 'CharacterStudioWorkbench',
  components: { Loading, ElImageViewer },
  props: {
    characterId: { type: String, default: 'new' },
  },
  setup() {
    const { t } = useI18n();
    const styles = computed(() =>
      ILLUSTRATION_STYLE_CONFIGS.map((config) => ({
        key: config.key,
        artStyle: t(`aibooks.styles.${config.key}.artStyle`),
        elementDetails: t(`aibooks.styles.${config.key}.elementDetails`),
        image: config.image,
      }))
    );
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
      anchorUrl: '',
      anchorBase64: '',
      loadedCharacter: null,
      generating: false,
      generations: [],
      galleryView: 'grid',
      previewVisible: false,
      previewIndex: 0,
      savedCharacterId: '',
      savedImageUrl: '',
      savingGenId: null,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
    };
  },
  computed: {
    previewUrls() {
      return this.generations.map((g) => g.url);
    },
    selectedStyleLabel() {
      const s = this.styles.find((x) => x.key === this.artStyleKey);
      return s?.artStyle || this.$t('characterStudio.pickStyle');
    },
    selectedStyleImage() {
      const s = this.styles.find((x) => x.key === this.artStyleKey);
      return s?.image || null;
    },
    storageKey() {
      const id = this.characterId || this.$route.params.characterId || 'new';
      return `character_studio_${id}`;
    },
  },
  mounted() {
    this.loadSession();
    this.applyPendingPrompt();
    if (this.characterId && this.characterId !== 'new') {
      this.loadCharacter(this.characterId);
    }
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
        if (data.anchorUrl) this.anchorUrl = data.anchorUrl;
        if (Array.isArray(data.generations)) this.generations = data.generations;
        if (data.savedCharacterId) this.savedCharacterId = data.savedCharacterId;
        if (data.savedImageUrl) this.savedImageUrl = data.savedImageUrl;
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
          anchorUrl: this.anchorUrl,
          generations: this.generations,
          savedCharacterId: this.savedCharacterId,
          savedImageUrl: this.savedImageUrl,
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
        this.loadedCharacter = char;
        this.savedCharacterId = String(char.id || char._id || '');
        this.characterName = char.character_name || char.name || '';
        const url = getImageUrl(char.image_url || char.character_image_url);
        if (url) {
          this.savedImageUrl = url;
        }
        if (url && !this.anchorUrl) {
          this.anchorUrl = url;
          try {
            this.anchorBase64 = await this.urlToBase64(url);
          } catch {
            this.anchorBase64 = '';
          }
        }
        if (!this.description && char.description) {
          this.description = char.description;
        }
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
      const pool = INSPIRE_PROMPTS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.description = pick;
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
    async urlToBase64(url) {
      if (url.startsWith('data:')) return url;
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },
    resolveImageFromResult(result) {
      let imageUrl = resolveGenerationImageUrl(result, this.apiBaseUrl);
      if (!imageUrl && result?.character_image_url) imageUrl = result.character_image_url;
      if (!imageUrl && result?.image_base64) {
        let b = result.image_base64.trim();
        if (!b.startsWith('data:')) b = `data:image/jpeg;base64,${b.replace(/\s/g, '')}`;
        imageUrl = b;
      }
      return imageUrl || '';
    },
    async handleGenerate() {
      const desc = (this.description || '').trim();
      if (!desc && !this.referenceBase64 && !this.anchorBase64) {
        ElMessage.warning(this.$t('characterStudio.needDescriptionOrRef'));
        return;
      }

      this.generating = true;
      try {
        const styleInfo = resolveStyleInfo(this.styles, this.artStyleKey);
        const refImage = this.referenceBase64 || this.anchorBase64 || '';
        const prompt = buildCharacterStudioPrompt({
          description: desc,
          action: DEFAULT_ACTION,
          styleInfo,
          withReferenceImage: Boolean(refImage),
        });

        const requestData = {
          prompt,
          size: this.aspectRatio,
          watermark: false,
        };
        if (refImage) requestData.image = refImage;

        const responseData = await postCreateCharacter(this.$http, requestData, {
          apiBaseUrl: this.apiBaseUrl,
        });

        if (!isCreateCharacterResponseOk(responseData) || !responseData.message) {
          throw new Error(responseData?.desc || this.$t('characterStudio.generateFailed'));
        }

        const result = responseData.message;
        let imageUrl = this.resolveImageFromResult(result);
        if (!imageUrl) throw new Error(this.$t('characterStudio.noImageUrl'));

        try {
          imageUrl = await matCharacterImageUrl(imageUrl);
        } catch (matErr) {
          console.warn('前端抠图失败，使用原图:', matErr);
        }

        if (result.points !== undefined && this.$store?.state) {
          this.$store.commit('setUserInfo', {
            ...(this.$store.state.userInfo || {}),
            points: result.points,
          });
        }

        const gen = { id: `${Date.now()}`, url: imageUrl, prompt };
        this.generations.unshift(gen);
        if (!this.anchorUrl) {
          await this.setAnchor(gen, { silent: true });
        }
        const saved = await this.saveToMyCharacters(gen, { silent: true });
        this.saveSession();
        ElMessage.success(
          saved
            ? this.$t('characterStudio.generateAndSaveSuccess')
            : this.$t('characterStudio.generateSuccess')
        );
      } catch (e) {
        ElMessage.error(e.message || this.$t('characterStudio.generateFailed'));
      } finally {
        this.generating = false;
      }
    },
    async setAnchor(gen, { silent = false } = {}) {
      this.anchorUrl = gen.url;
      try {
        this.anchorBase64 = gen.url.startsWith('data:') ? gen.url : await this.urlToBase64(gen.url);
      } catch {
        this.anchorBase64 = '';
      }
      this.saveSession();
      if (!silent) {
        ElMessage.success(this.$t('characterStudio.anchorUpdated'));
      }
    },
    isGenSaved(gen) {
      if (!gen?.url || !this.savedCharacterId || !this.savedImageUrl) return false;
      return gen.url === this.savedImageUrl;
    },
    async saveToMyCharacters(gen, { silent = false } = {}) {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!silent) ElMessage.error(this.$t('characterStudio.pleaseLogin'));
        return false;
      }
      const name = (this.characterName || '').trim() || this.$t('characterStudio.unnamed');
      const apiUrl = this.apiBaseUrl ? `${this.apiBaseUrl}/character` : '/character';
      this.savingGenId = gen.id;
      try {
        let imageUrl = gen.url;
        if (imageUrl.startsWith('data:')) {
          imageUrl = gen.url;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = getImageUrl(imageUrl);
        }
        const payload = {
          character_name: name,
          image_url: imageUrl,
          description: (this.description || '').trim() || undefined,
          is_public: 1,
        };
        if (this.savedCharacterId) {
          payload.character_id = this.savedCharacterId;
        }
        Object.keys(payload).forEach((k) => {
          if (payload[k] === undefined) delete payload[k];
        });
        const res = await this.$http.post(apiUrl, payload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (res.data?.code === 0 || res.data?.code === '0') {
          const saved = res.data.data || res.data.message || res.data;
          const id = saved?.id || saved?._id;
          if (id) {
            this.savedCharacterId = String(id);
            if (this.characterId === 'new') {
              this.$router.replace({ name: 'character-studio-workbench', params: { characterId: id } });
            }
          }
          this.savedImageUrl = gen.url;
          this.saveSession();
          if (!silent) {
            ElMessage.success(
              this.savedCharacterId && payload.character_id
                ? this.$t('characterStudio.updateSuccess')
                : this.$t('characterStudio.saveSuccess')
            );
          }
          return true;
        }
        throw new Error(res.data?.message || 'save failed');
      } catch (e) {
        if (!silent) ElMessage.error(e.message || this.$t('characterStudio.saveFailed'));
        return false;
      } finally {
        this.savingGenId = null;
      }
    },
    openEditorPro(url) {
      if (!url) return;
      const imageUrl = url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')
        ? url
        : getImageUrl(url);
      setEditorproPendingImage(imageUrl, { title: this.characterName || '' });
      navigateTo(this.$router, { name: 'editorpro' }, '#/editorpro');
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
      navigateTo(this.$router, { name: 'create-group-images' }, '#/creation-studio/character/groups');
    },
    previewImage(index) {
      this.previewIndex = index;
      this.previewVisible = true;
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

.cs-guide-links {
  display: flex;
  gap: 12px;
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
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.cs-view-toggle {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.cs-view-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.cs-view-btn.active {
  border-color: #8167a9;
  background: #ede8f5;
  color: #8167a9;
}

.cs-gen-grid--list {
  grid-template-columns: 1fr;
}

.cs-gen-grid--list .cs-gen-card {
  display: flex;
  flex-direction: row;
}

.cs-gen-grid--list .cs-gen-card img {
  width: 200px;
  flex-shrink: 0;
  aspect-ratio: auto;
  min-height: 160px;
}

.cs-gen-grid--list .cs-gen-actions {
  flex: 1;
  align-content: center;
}

.cs-gallery-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
}

.cs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: #909399;
}

.cs-empty-art {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.cs-generating {
  text-align: center;
  padding: 48px;
  color: #666;
}

.cs-gen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.cs-gen-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.cs-gen-card.is-saved {
  border-color: #67c23a;
}

.cs-saved-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #529b2e;
  background: #f0f9eb;
  white-space: nowrap;
}

.cs-gen-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  background: repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 16px 16px;
  cursor: pointer;
}

.cs-gen-actions {
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
