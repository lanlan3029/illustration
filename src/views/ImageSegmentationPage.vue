<template>
  <div class="segment-page">
    <div class="segment-page-header">
      <h1>{{ $t('imageSegmentation.pageTitle') }}</h1>
      <p>{{ $t('imageSegmentation.pageDesc') }}</p>
    </div>

    <el-card class="segment-card" shadow="never">
      <section class="mode-section">
        <p class="section-title">{{ $t('imageSegmentation.modeTitle') }}</p>
        <div
          class="mode-grid"
          role="radiogroup"
          :aria-label="$t('imageSegmentation.modeTitle')"
        >
          <button
            v-for="item in modeOptions"
            :key="item.value"
            type="button"
            role="radio"
            class="mode-card"
            :class="{ active: selectedMode === item.value }"
            :aria-checked="selectedMode === item.value"
            @click="selectMode(item.value)"
          >
            <span class="mode-dot" aria-hidden="true"></span>
            <span class="mode-text">
              <span class="mode-label">{{ item.label }}</span>
              <span v-if="item.desc" class="mode-desc">{{ item.desc }}</span>
            </span>
          </button>
        </div>
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
        <div class="upload-divider">
          <span>{{ $t('myIllustrationPicker.or') }}</span>
        </div>
        <MyIllustrationPicker @select="onPickIllustration" />
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
  rembgFromImageSource,
  fetchRembgModes,
  readStoredRembgMode,
  storeRembgMode,
  formatRembgRequestError,
  DEFAULT_REMBG_MODES,
} from '@/utils/imageSegmentation';
import { suggestRembgMode } from '@/utils/imageSegmentationHint';
import { saveCroppedCharacter, CHARACTER_CATEGORIES } from '@/utils/saveCroppedAsset';
import MyIllustrationPicker from '@/components/MyIllustrationPicker.vue';

export default {
  name: 'ImageSegmentationPage',
  components: { UploadFilled, Loading, MyIllustrationPicker },
  data() {
    return {
      photoFile: null,
      photoSourceUrl: '',
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
      return Boolean(
        (this.photoFile || this.photoSourceUrl || this.photoPreviewUrl)
          && this.selectedMode
          && !this.segmenting
      );
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
    selectMode(value) {
      if (!value) return;
      this.selectedMode = value;
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
    async applyImageSource({ file = null, url = '', previewUrl = '', mimeType = '', fileName = '' }) {
      this.photoFile = file;
      this.photoSourceUrl = url;
      this.photoPreviewUrl = previewUrl || url;
      this.resultUrl = '';
      this.resultModeLabel = '';
      this.modeHintDismissed = false;
      this.modeHint = await suggestRembgMode(this.photoPreviewUrl, {
        mimeType: mimeType || file?.type || '',
        fileName: fileName || file?.name || '',
      });
    },
    async onFileChange(file) {
      const raw = file.raw;
      if (!raw || !raw.type.startsWith('image/')) {
        ElMessage.warning(this.$t('imageSegmentation.invalidImage'));
        return;
      }
      try {
        const previewUrl = await readFileAsDataUrl(raw);
        await this.applyImageSource({ file: raw, previewUrl, mimeType: raw.type, fileName: raw.name });
      } catch {
        ElMessage.error(this.$t('imageSegmentation.loadFailed'));
      }
    },
    async onPickIllustration({ url, item }) {
      if (!url) return;
      try {
        // 优先拉成 File，便于 rembg multipart；失败则退回 image_url
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const ext = (blob.type || 'image/png').includes('jpeg') ? 'jpg' : 'png';
        const file = new File(
          [blob],
          `${(item?.title || 'illustration').slice(0, 24)}.${ext}`,
          { type: blob.type || 'image/png' }
        );
        await this.applyImageSource({
          file,
          url,
          previewUrl: url,
          mimeType: file.type,
          fileName: file.name,
        });
      } catch {
        await this.applyImageSource({ url, previewUrl: url });
      }
    },
    resetImage() {
      this.photoFile = null;
      this.photoSourceUrl = '';
      this.photoPreviewUrl = '';
      this.resultUrl = '';
      this.resultModeLabel = '';
      this.modeHint = null;
      this.modeHintDismissed = false;
    },
    async handleSegment() {
      const source = this.photoFile || this.photoSourceUrl || this.photoPreviewUrl;
      if (!this.canSegment) {
        if (!source) ElMessage.warning(this.$t('imageSegmentation.noImage'));
        else if (!this.selectedMode) ElMessage.warning(this.$t('imageSegmentation.noMode'));
        return;
      }
      this.segmenting = true;
      this.resultUrl = '';
      this.resultModeLabel = '';
      try {
        const result = await rembgFromImageSource(this.$http, source, {
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
      if (this.segmenting || !(this.photoFile || this.photoSourceUrl || this.photoPreviewUrl)) return;
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
  --accent: #8167a9;
  --accent-soft: #f5f0fa;
  --border: #e8e0f4;
  --text: #1c345e;
  --muted: #6b7280;
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 16px 56px;
}

.segment-page-header {
  text-align: center;
  margin-bottom: 24px;
}

.segment-page-header h1 {
  margin: 0 0 10px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.segment-page-header p {
  margin: 0 auto;
  max-width: 640px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
}

.segment-card {
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 28px rgba(28, 52, 94, 0.06);
}

.segment-card :deep(.el-card__body) {
  padding: 28px 28px 32px;
}

.section-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
}

.mode-section {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0ecf6;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  align-items: stretch;
}

.mode-card {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  min-height: 104px;
  height: 100%;
  margin: 0;
  padding: 16px 14px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: #faf8fc;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.mode-card:hover {
  border-color: #c4b3dc;
  background: #fff;
}

.mode-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.mode-card.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: 0 0 0 1px rgba(129, 103, 169, 0.12);
}

.mode-dot {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 50%;
  border: 1.5px solid #c5bdd4;
  background: #fff;
  position: relative;
}

.mode-card.active .mode-dot {
  border-color: var(--accent);
}

.mode-card.active .mode-dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--accent);
}

.mode-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.mode-label {
  font-size: 15px;
  font-weight: 600;
  color: #2a2a3a;
  line-height: 1.3;
}

.mode-desc {
  font-size: 12px;
  color: #8a8499;
  font-weight: 400;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mode-hint-alert {
  margin-bottom: 20px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding-top: 4px;
}

.upload-zone :deep(.el-upload) {
  width: 100%;
}

.upload-zone :deep(.el-upload-dragger) {
  width: 100%;
  padding: 40px 20px;
  border-radius: 12px;
  border-color: #d9d0e6;
  background: #fcfbfd;
  transition: border-color 0.15s, background 0.15s;
}

.upload-zone :deep(.el-upload-dragger:hover) {
  border-color: var(--accent);
  background: #faf7fd;
}

.upload-zone :deep(.el-upload__tip) {
  margin-top: 10px;
  text-align: center;
  color: #9ca3af;
  line-height: 1.5;
}

.upload-icon {
  font-size: 44px;
  color: var(--accent);
  margin-bottom: 10px;
}

.upload-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 320px;
  margin: 22px 0 16px;
  color: #a0a0b0;
  font-size: 13px;
}

.upload-divider::before,
.upload-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ebe6f2;
}

.upload-zone :deep(.my-ill-picker .el-button) {
  min-width: 180px;
  height: 40px;
  border-radius: 10px;
  border-color: #c4b3dc;
  color: var(--accent);
  font-weight: 500;
  background: #fff;
}

.upload-zone :deep(.my-ill-picker .el-button:hover) {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.compare-label {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.result-mode-tag {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--accent);
}

.image-frame {
  border: 1px solid #eee;
  border-radius: 10px;
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
  color: var(--accent);
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
  color: var(--muted);
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
    padding: 16px 12px 40px;
  }

  .segment-page-header h1 {
    font-size: 22px;
  }

  .segment-card :deep(.el-card__body) {
    padding: 20px 16px 24px;
  }

  .mode-grid {
    grid-template-columns: 1fr;
  }

  .mode-card {
    min-height: 0;
  }

  .compare-grid {
    grid-template-columns: 1fr;
  }
}
</style>
