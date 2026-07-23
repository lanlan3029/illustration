<template>
  <div class="segment-page">
    <div class="segment-page-header">
      <h1>{{ $t('imageSegmentation.pageTitle') }}</h1>
      <p>{{ $t('imageSegmentation.pageDesc') }}</p>
    </div>

    <el-card class="segment-card" shadow="hover">
      <section class="mode-section">
        <p class="section-title">{{ $t('imageSegmentation.modeTitle') }}</p>
        <el-radio-group v-model="selectedMode" class="mode-radio-group" @change="onModeChange">
          <label
            v-for="item in modeOptions"
            :key="item.value"
            class="mode-card"
            :class="{ active: selectedMode === item.value }"
          >
            <el-radio :label="item.value" class="mode-radio">
              <span class="mode-label">{{ item.label }}</span>
              <span v-if="item.desc" class="mode-desc">{{ item.desc }}</span>
            </el-radio>
          </label>
        </el-radio-group>
      </section>

      <el-alert
        v-if="modeHint && photoPreviewUrl && selectedMode !== modeHint.suggestMode"
        type="info"
        :closable="true"
        show-icon
        class="mode-hint-alert"
        @close="dismissModeHint"
      >
        <template #title>
          {{ $t(`imageSegmentation.hint.${modeHint.reason}`) }}
        </template>
        <el-button link type="primary" @click="applyModeHint">
          {{ $t('imageSegmentation.applyHint', { mode: modeLabelByValue(modeHint.suggestMode) }) }}
        </el-button>
      </el-alert>

      <div v-if="!photoPreviewUrl" class="upload-zone">
        <el-upload
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onFileChange"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="el-upload__text">{{ $t('imageSegmentation.uploadHint') }}</div>
          <template #tip>
            <div class="el-upload__tip">{{ $t('imageSegmentation.uploadTip') }}</div>
          </template>
        </el-upload>
      </div>

      <template v-else>
        <div class="compare-grid">
          <div class="compare-panel">
            <p class="compare-label">{{ $t('imageSegmentation.original') }}</p>
            <div class="image-frame">
              <img :src="photoPreviewUrl" :alt="$t('imageSegmentation.original')" />
            </div>
          </div>
          <div class="compare-panel">
            <p class="compare-label">
              {{ $t('imageSegmentation.result') }}
              <span v-if="resultModeLabel" class="result-mode-tag">
                {{ $t('imageSegmentation.currentMode', { mode: resultModeLabel }) }}
              </span>
            </p>
            <div class="image-frame checker-bg">
              <div v-if="segmenting" class="result-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>{{ $t('imageSegmentation.segmenting') }}</span>
              </div>
              <img
                v-else-if="resultUrl"
                :src="resultUrl"
                :alt="$t('imageSegmentation.result')"
              />
              <div v-else class="result-empty">{{ $t('imageSegmentation.resultEmpty') }}</div>
            </div>
          </div>
        </div>

        <div v-if="resultUrl && otherModes.length" class="retry-modes">
          <span class="retry-label">{{ $t('imageSegmentation.retryWithMode') }}</span>
          <el-button
            v-for="item in otherModes"
            :key="item.value"
            size="small"
            :disabled="segmenting"
            @click="retryWithMode(item.value)"
          >
            {{ item.label }}
          </el-button>
        </div>

        <div class="segment-page-actions">
          <el-button @click="resetImage">{{ $t('imageSegmentation.changeImage') }}</el-button>
          <el-button
            type="primary"
            :loading="segmenting"
            :disabled="!canSegment"
            @click="handleSegment"
          >
            {{ $t('imageSegmentation.startSegment') }}
          </el-button>
          <el-button :disabled="!resultUrl || segmenting" @click="handleDownload">
            {{ $t('imageSegmentation.download') }}
          </el-button>
          <el-button
            type="primary"
            plain
            :disabled="!resultUrl || segmenting"
            @click="showCharacterForm = true"
          >
            {{ $t('imageSegmentation.saveToMyCharacter') }}
          </el-button>
        </div>
      </template>
    </el-card>

    <el-dialog
      v-model="showCharacterForm"
      :title="$t('imageSegmentation.saveToMyCharacter')"
      width="440px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item :label="$t('imageSegmentation.characterName')" required>
          <el-input v-model="characterForm.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('imageSegmentation.category')" required>
          <el-select v-model="characterForm.category" style="width: 100%">
            <el-option
              v-for="item in characterCategories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('imageSegmentation.description')">
          <el-input v-model="characterForm.desc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('imageSegmentation.isPublic')">
          <el-radio-group v-model="characterForm.is_public">
            <el-radio :label="1">{{ $t('imageSegmentation.public') }}</el-radio>
            <el-radio :label="0">{{ $t('imageSegmentation.private') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCharacterForm = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveCharacter">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { UploadFilled, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { readFileAsDataUrl, downloadDataUrl } from '@/utils/lassoCrop';
import {
  rembgFromFile,
  fetchRembgModes,
  readStoredRembgMode,
  storeRembgMode,
  formatRembgRequestError,
  DEFAULT_REMBG_MODES,
} from '@/utils/imageSegmentation';
import { suggestRembgMode } from '@/utils/imageSegmentationHint';
import { saveCroppedCharacter, CHARACTER_CATEGORIES } from '@/utils/saveCroppedAsset';

export default {
  name: 'ImageSegmentationPage',
  components: { UploadFilled, Loading },
  data() {
    return {
      photoFile: null,
      photoPreviewUrl: '',
      resultUrl: '',
      resultModeLabel: '',
      segmenting: false,
      showCharacterForm: false,
      saving: false,
      modeOptions: DEFAULT_REMBG_MODES.slice(),
      selectedMode: readStoredRembgMode(),
      modeHint: null,
      modeHintDismissed: false,
      characterCategories: CHARACTER_CATEGORIES,
      characterForm: {
        name: '',
        category: '',
        desc: '',
        is_public: 1,
      },
    };
  },
  computed: {
    canSegment() {
      return Boolean(this.photoFile && this.selectedMode && !this.segmenting);
    },
    otherModes() {
      return this.modeOptions.filter((item) => item.value !== this.selectedMode);
    },
  },
  mounted() {
    this.loadModeOptions();
  },
  methods: {
    async loadModeOptions() {
      const modes = await fetchRembgModes(this.$http);
      this.modeOptions = modes;
      const values = modes.map((m) => m.value);
      if (!values.includes(this.selectedMode)) {
        this.selectedMode = values.includes('subject') ? 'subject' : values[0];
        storeRembgMode(this.selectedMode);
      }
    },
    modeLabelByValue(value) {
      const hit = this.modeOptions.find((m) => m.value === value);
      return hit?.label || value;
    },
    onModeChange(value) {
      storeRembgMode(value);
    },
    applyModeHint() {
      if (!this.modeHint) return;
      this.selectedMode = this.modeHint.suggestMode;
      storeRembgMode(this.selectedMode);
      this.modeHintDismissed = true;
      this.modeHint = null;
    },
    dismissModeHint() {
      this.modeHintDismissed = true;
      this.modeHint = null;
    },
    async onFileChange(file) {
      const raw = file.raw;
      if (!raw || !raw.type.startsWith('image/')) {
        ElMessage.warning(this.$t('imageSegmentation.invalidImage'));
        return;
      }
      try {
        this.photoFile = raw;
        this.photoPreviewUrl = await readFileAsDataUrl(raw);
        this.resultUrl = '';
        this.resultModeLabel = '';
        this.modeHintDismissed = false;
        if (!this.modeHintDismissed) {
          this.modeHint = await suggestRembgMode(this.photoPreviewUrl, {
            mimeType: raw.type,
            fileName: raw.name,
          });
        }
      } catch {
        ElMessage.error(this.$t('imageSegmentation.loadFailed'));
      }
    },
    resetImage() {
      this.photoFile = null;
      this.photoPreviewUrl = '';
      this.resultUrl = '';
      this.resultModeLabel = '';
      this.modeHint = null;
      this.modeHintDismissed = false;
    },
    async handleSegment() {
      if (!this.canSegment) {
        if (!this.photoFile) ElMessage.warning(this.$t('imageSegmentation.noImage'));
        else if (!this.selectedMode) ElMessage.warning(this.$t('imageSegmentation.noMode'));
        return;
      }
      this.segmenting = true;
      this.resultUrl = '';
      this.resultModeLabel = '';
      try {
        const result = await rembgFromFile(this.$http, this.photoFile, {
          mode: this.selectedMode,
        });
        this.resultUrl = result.imageURL;
        this.resultModeLabel =
          result.modeLabel || this.modeLabelByValue(result.mode || this.selectedMode);
        ElMessage.success(this.$t('imageSegmentation.segmentSuccess'));
      } catch (error) {
        ElMessage.error(formatRembgRequestError(error, this.$t('imageSegmentation.segmentFailed')));
      } finally {
        this.segmenting = false;
      }
    },
    async retryWithMode(mode) {
      if (this.segmenting || !this.photoFile) return;
      this.selectedMode = mode;
      storeRembgMode(mode);
      await this.handleSegment();
    },
    handleDownload() {
      if (!this.resultUrl) return;
      this.downloadResult(this.resultUrl);
    },
    async downloadResult(url) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        downloadDataUrl(objectUrl, `segmented-${Date.now()}.png`);
        URL.revokeObjectURL(objectUrl);
        ElMessage.success(this.$t('imageSegmentation.downloaded'));
      } catch {
        downloadDataUrl(url, `segmented-${Date.now()}.png`);
        ElMessage.success(this.$t('imageSegmentation.downloaded'));
      }
    },
    async handleSaveCharacter() {
      if (!this.resultUrl) return;
      if (!this.characterForm.name || !this.characterForm.category) {
        ElMessage.warning(this.$t('imageSegmentation.fillNameAndCategory'));
        return;
      }
      this.saving = true;
      try {
        await saveCroppedCharacter(this.$http, this.resultUrl, {
          character_name: this.characterForm.name,
          character_type: this.characterForm.category,
          description: this.characterForm.desc,
          is_public: this.characterForm.is_public,
        });
        ElMessage.success(this.$t('imageSegmentation.characterSaved'));
        this.showCharacterForm = false;
        this.$router.push('/creation-studio/character');
      } catch (e) {
        ElMessage.error(e.message || this.$t('imageSegmentation.saveFailed'));
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.segment-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.segment-page-header h1 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #1c345e;
}

.segment-page-header p {
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
}

.segment-card {
  border-radius: 12px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.mode-section {
  margin-bottom: 16px;
}

.mode-radio-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.mode-card {
  display: block;
  border: 1px solid #e8e0f4;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  background: #faf8fc;
  transition: border-color 0.15s, background 0.15s;
}

.mode-card:hover {
  border-color: #c4b3dc;
}

.mode-card.active {
  border-color: #8167a9;
  background: #f5f0fa;
}

.mode-radio {
  width: 100%;
  height: auto;
  white-space: normal;
  align-items: flex-start;
}

.mode-radio :deep(.el-radio__label) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px;
  line-height: 1.4;
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.mode-desc {
  font-size: 12px;
  color: #888;
  font-weight: 400;
}

.mode-hint-alert {
  margin-bottom: 16px;
}

.upload-zone {
  padding: 8px 0 0;
}

.upload-icon {
  font-size: 48px;
  color: #8167a9;
  margin-bottom: 8px;
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.compare-label {
  margin: 0 0 8px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.result-mode-tag {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: #8167a9;
}

.image-frame {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.image-frame img {
  max-width: 100%;
  max-height: 420px;
  display: block;
  object-fit: contain;
}

.checker-bg {
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.result-loading,
.result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #999;
  font-size: 14px;
  text-align: center;
}

.result-loading .el-icon {
  font-size: 28px;
  color: #8167a9;
}

.retry-modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.retry-label {
  font-size: 13px;
  color: #666;
}

.segment-page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .segment-page {
    padding: 16px 12px 32px;
  }

  .mode-radio-group {
    grid-template-columns: 1fr;
  }

  .compare-grid {
    grid-template-columns: 1fr;
  }
}
</style>
