<template>
  <div class="multi-char-scene">
    <div class="mcs-layout">
      <aside class="mcs-panel">
        <header class="mcs-header">
          <h1 class="mcs-title">{{ $t('multiCharacterScene.title') }}</h1>
          <p class="mcs-desc">{{ $t('multiCharacterScene.desc') }}</p>
        </header>

        <ProtagonistRefPicker
          v-model="protagonistRefs"
          :slot-names="slotRoleNames"
          :api-base-url="apiBaseUrl"
        />

        <div class="slot-role-names">
          <div v-for="slot in [1, 2]" :key="'role-' + slot" class="slot-role-row">
            <span class="slot-role-label">{{ $t('multiCharacterScene.roleName', { slot }) }}</span>
            <el-input
              v-model="slotRoleNames[slot]"
              size="small"
              :placeholder="$t('multiCharacterScene.roleNamePlaceholder')"
              clearable
            />
          </div>
        </div>

        <div class="form-block">
          <label class="form-label">{{ $t('multiCharacterScene.scenePrompt') }}</label>
          <el-input
            v-model="scenePrompt"
            type="textarea"
            :rows="4"
            :placeholder="$t('multiCharacterScene.scenePromptPlaceholder')"
          />
        </div>

        <div class="form-block">
          <label class="form-label">{{ $t('aibooks.style') }}</label>
          <div class="style-picker-grid">
            <button
              v-for="style in styles"
              :key="style.key"
              type="button"
              class="style-picker-item"
              :class="{ selected: artStyle === style.key }"
              @click="artStyle = style.key"
            >
              <div class="style-picker-thumb">
                <img
                  v-if="style.image"
                  :src="style.image"
                  :alt="style.artStyle"
                  class="style-picker-img"
                  loading="lazy"
                />
                <div v-else class="style-picker-fallback" aria-hidden="true" />
              </div>
              <span class="style-picker-label">{{ style.artStyle }}</span>
            </button>
          </div>
        </div>

        <div class="mcs-actions">
          <el-button
            type="primary"
            size="large"
            class="generate-btn"
            :loading="generating"
            @click="generate"
          >
            {{ generating ? $t('multiCharacterScene.generating') : $t('multiCharacterScene.generate') }}
          </el-button>
          <p class="points-hint">{{ $t('aibooks.pointsHint') }}</p>
        </div>
      </aside>

      <main class="mcs-preview">
        <div v-if="!resultUrl && !generating" class="mcs-empty">
          <el-empty :description="$t('multiCharacterScene.previewEmpty')" />
        </div>
        <div v-else-if="generating" class="mcs-loading">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <p>{{ $t('multiCharacterScene.generating') }}</p>
        </div>
        <div v-else class="mcs-result">
          <el-image
            :src="resultUrl"
            fit="contain"
            class="result-image"
            :preview-src-list="[resultUrl]"
            preview-teleported
          />
          <div class="result-actions">
            <el-button type="primary" @click="collectIllustration">
              {{ $t('aibooks.collectIllustration') }}
            </el-button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { getCurrentInstance } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import ProtagonistRefPicker from '@/components/character/ProtagonistRefPicker.vue';
import { useIllustrationStyles } from '@/composables/useIllustrationStyles';
import { getStyleInfoText } from '@/utils/aibooksPrompts';
import {
  postCreateCharacter,
  isCreateCharacterResponseOk,
  resolveGenerationImageUrl,
} from '@/utils/createCharacterTask';
import {
  emptyProtagonistRefs,
  hasProtagonistReference,
  getCharacterIdsForApi,
} from '@/utils/protagonistRefs';
import {
  extractApiErrorMessage,
  markInsufficientPointsError,
  handleInsufficientPointsError,
} from '@/utils/insufficientPoints';

const STORAGE_KEY = 'multi_character_scene_draft';

export default {
  name: 'MultiCharacterScene',
  components: { ProtagonistRefPicker, Loading },
  setup() {
    const { proxy } = getCurrentInstance();
    const { styles } = useIllustrationStyles();
    return { $http: proxy?.$http || axios, styles };
  },
  data() {
    return {
      protagonistRefs: emptyProtagonistRefs(),
      slotRoleNames: { 1: '', 2: '' },
      scenePrompt: '',
      artStyle: 'healingWatercolor',
      generating: false,
      resultUrl: '',
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
      saveTimer: null,
    };
  },
  mounted() {
    this.loadDraft();
    this.$watch('scenePrompt', () => this.debounceSave());
    this.$watch('artStyle', () => this.debounceSave());
    this.$watch('slotRoleNames', () => this.debounceSave(), { deep: true });
    this.$watch('protagonistRefs', () => this.debounceSave(), { deep: true });
  },
  beforeUnmount() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
  },
  methods: {
    debounceSave() {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.saveDraft(), 800);
    },

    saveDraft() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            scenePrompt: this.scenePrompt,
            artStyle: this.artStyle,
            slotRoleNames: this.slotRoleNames,
            protagonistRefs: {
              1: {
                characterId: this.protagonistRefs[1]?.characterId || '',
                preview: this.protagonistRefs[1]?.preview || '',
              },
              2: {
                characterId: this.protagonistRefs[2]?.characterId || '',
                preview: this.protagonistRefs[2]?.preview || '',
              },
            },
            resultUrl: this.resultUrl,
            timestamp: Date.now(),
          })
        );
      } catch {
        /* ignore quota */
      }
    },

    loadDraft() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (Date.now() - (data.timestamp || 0) > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        this.scenePrompt = data.scenePrompt || '';
        this.artStyle = data.artStyle || this.artStyle;
        this.slotRoleNames = { 1: '', 2: '', ...data.slotRoleNames };
        this.resultUrl = data.resultUrl || '';
        if (data.protagonistRefs) {
          this.protagonistRefs = {
            ...emptyProtagonistRefs(),
            1: { ...emptyProtagonistRefs()[1], ...data.protagonistRefs[1] },
            2: { ...emptyProtagonistRefs()[2], ...data.protagonistRefs[2] },
          };
        }
      } catch {
        /* ignore */
      }
    },

    buildImagePrompt() {
      const scene = String(this.scenePrompt || '').trim();
      const styleInfo = getStyleInfoText(this.styles, this.artStyle, { forGenerate: true });
      const roleParts = [1, 2]
        .map((slot) => {
          const label = String(this.slotRoleNames[slot] || '').trim();
          return label ? `${slot === 1 ? '主角1' : '主角2'}：${label}` : '';
        })
        .filter(Boolean);
      const roleBlock = roleParts.length
        ? `【出场角色】\n${roleParts.join('\n')}\n请保持各角色外貌与参考图一致。\n`
        : '';
      const refHint = hasProtagonistReference(this.protagonistRefs)
        ? '参考附图中的角色形象，保持面部、发型、服装与体型一致。\n'
        : '';
      return `${roleBlock}${refHint}${scene}\n\n${styleInfo}`.trim();
    },

    resolveImageUrl(result) {
      let url = resolveGenerationImageUrl(result, this.apiBaseUrl);
      if (!url && result?.character_image_url) url = result.character_image_url;
      if (!url && result?.character_image_base64) {
        const b64 = String(result.character_image_base64).trim();
        url = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64.replace(/\s/g, '')}`;
      }
      return url || '';
    },

    async generate() {
      if (!String(this.scenePrompt || '').trim()) {
        ElMessage.warning(this.$t('multiCharacterScene.promptRequired'));
        return;
      }
      this.generating = true;
      this.resultUrl = '';
      try {
        const characterIds = getCharacterIdsForApi(this.protagonistRefs);
        const requestData = {
          prompt: this.buildImagePrompt(),
          size: '1280x960',
          watermark: false,
        };
        if (characterIds.length) requestData.character_ids = characterIds;

        const responseData = await postCreateCharacter(this.$http, requestData, {
          apiBaseUrl: this.apiBaseUrl,
        });

        if (!isCreateCharacterResponseOk(responseData) || !responseData.message) {
          const errorMsg = extractApiErrorMessage(responseData) || '生成失败';
          throw markInsufficientPointsError(new Error(errorMsg), errorMsg);
        }

        const result = responseData.message;
        if (result?.points != null && this.$store?.state) {
          this.$store.commit('setUserInfo', {
            ...(this.$store.state.userInfo || {}),
            points: result.points,
          });
        }

        const imageUrl = this.resolveImageUrl(result);
        if (!imageUrl) throw new Error(this.$t('multiCharacterScene.noImageUrl'));

        this.resultUrl = imageUrl;
        this.saveDraft();
        ElMessage.success(this.$t('multiCharacterScene.generateSuccess'));
      } catch (error) {
        const handled = await handleInsufficientPointsError(error, {
          router: this.$router,
          t: this.$t.bind(this),
        });
        if (!handled) {
          ElMessage.error(error?.message || this.$t('multiCharacterScene.generateFailed'));
        }
      } finally {
        this.generating = false;
      }
    },

    async collectIllustration() {
      if (!this.resultUrl) return;
      try {
        let pictureValue = this.resultUrl;
        if (
          pictureValue
          && !pictureValue.startsWith('http')
          && !pictureValue.startsWith('data:')
        ) {
          pictureValue = `https://static.kidstory.cc/${pictureValue}`;
        }
        const token = localStorage.getItem('token') || '';
        if (!token) {
          ElMessage.error(this.$t('common.login') || '请先登录');
          return;
        }
        const res = await this.$http.post(
          '/ill/',
          {
            picture: pictureValue,
            title: this.$t('multiCharacterScene.collectTitle'),
            description: String(this.scenePrompt || '').slice(0, 200),
            type: 'others',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res?.data?.desc === 'success' || res?.data?.code === 0 || res?.data?.code === '0') {
          ElMessage.success(this.$t('multiCharacterScene.collectSuccess'));
        } else {
          throw new Error(res?.data?.message || '保存失败');
        }
      } catch (e) {
        ElMessage.error(e?.message || this.$t('multiCharacterScene.collectFailed'));
      }
    },
  },
};
</script>

<style scoped>
.multi-char-scene {
  min-height: 100%;
  background: #f5f7fa;
}

.mcs-layout {
  display: flex;
  gap: 16px;
  padding: 20px;
  min-height: calc(100vh - 50px);
  box-sizing: border-box;
}

.mcs-panel {
  width: 38%;
  min-width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
}

.mcs-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.mcs-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.mcs-desc {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.slot-role-names {
  margin: 12px 0 16px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.slot-role-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.slot-role-row:last-child {
  margin-bottom: 0;
}

.slot-role-label {
  font-size: 12px;
  color: #909399;
  min-width: 52px;
  flex-shrink: 0;
}

.form-block {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.mcs-actions {
  margin-top: 8px;
}

.generate-btn {
  width: 100%;
}

.points-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.mcs-preview {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mcs-empty,
.mcs-loading {
  width: 100%;
  text-align: center;
  color: #909399;
}

.mcs-loading p {
  margin-top: 12px;
}

.mcs-result {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.result-image {
  width: 100%;
  max-height: min(70vh, 640px);
  border-radius: 8px;
}

.style-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.style-picker-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid #ececf0;
  background: #fff;
  cursor: pointer;
  text-align: center;
}

.style-picker-item.selected {
  border-color: #5b5bd6;
  box-shadow: 0 0 0 2px rgba(91, 91, 214, 0.35);
  background: #f7f7ff;
}

.style-picker-thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f1f3;
}

.style-picker-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.style-picker-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8eaf0, #f5f6f8);
}

.style-picker-label {
  font-size: 11px;
  line-height: 1.3;
  color: #303133;
}

@media (max-width: 900px) {
  .mcs-layout {
    flex-direction: column;
  }

  .mcs-panel {
    width: 100%;
    min-width: 0;
  }
}
</style>
