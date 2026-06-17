<template>
  <div class="matting-page">
    <div class="matting-page-header">
      <h1>{{ $t('canvasMatting.pageTitle') }}</h1>
      <p>{{ $t('canvasMatting.pageDesc') }}</p>
    </div>

    <el-card class="matting-card" shadow="hover">
      <div v-if="!imageSrc" class="upload-zone">
        <el-upload
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onFileChange"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="el-upload__text">{{ $t('canvasMatting.uploadHint') }}</div>
          <template #tip>
            <div class="el-upload__tip">{{ $t('canvasMatting.uploadTip') }}</div>
          </template>
        </el-upload>
      </div>

      <template v-else>
        <div class="matting-controls">
          <div class="control-row">
            <label>{{ $t('canvasMatting.threshold') }}</label>
            <el-slider v-model="threshold" :min="200" :max="255" show-input @change="runMatting" />
          </div>
          <div class="control-row">
            <label>{{ $t('canvasMatting.tolerance') }}</label>
            <el-slider v-model="tolerance" :min="0" :max="60" show-input @change="runMatting" />
          </div>
          <div class="control-row control-row--inline">
            <el-checkbox v-model="floodFromEdges" @change="runMatting">
              {{ $t('canvasMatting.floodFromEdges') }}
            </el-checkbox>
            <el-checkbox v-model="stickerStyle" @change="runMatting">
              {{ $t('canvasMatting.stickerStyle') }}
            </el-checkbox>
          </div>
          <el-button type="primary" :loading="processing" @click="runMatting">
            {{ $t('canvasMatting.apply') }}
          </el-button>
        </div>

        <div class="matting-preview">
          <div class="preview-pane">
            <p class="preview-label">{{ $t('canvasMatting.original') }}</p>
            <div class="preview-box checkerboard">
              <img :src="imageSrc" alt="original" />
            </div>
          </div>
          <div class="preview-pane">
            <p class="preview-label">{{ $t('canvasMatting.result') }}</p>
            <div class="preview-box checkerboard">
              <img v-if="resultUrl" :src="resultUrl" alt="result" />
              <span v-else class="preview-empty">{{ $t('canvasMatting.noResult') }}</span>
            </div>
          </div>
        </div>

        <div class="matting-actions">
          <el-button @click="resetImage">{{ $t('canvasMatting.changeImage') }}</el-button>
          <el-button :disabled="!resultUrl" @click="openEditorPro">
            {{ $t('canvasMatting.openEditor') }}
          </el-button>
          <el-button :disabled="!resultUrl" @click="handleDownload">
            {{ $t('canvasMatting.download') }}
          </el-button>
          <el-button type="primary" :disabled="!resultUrl" @click="showCharacterForm = true">
            {{ $t('canvasMatting.saveToMyCharacter') }}
          </el-button>
        </div>
      </template>
    </el-card>

    <el-dialog
      v-model="showCharacterForm"
      :title="$t('canvasMatting.saveToMyCharacter')"
      width="440px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item :label="$t('canvasMatting.characterName')" required>
          <el-input v-model="characterForm.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('canvasMatting.category')" required>
          <el-select v-model="characterForm.category" style="width: 100%">
            <el-option
              v-for="item in characterCategories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('canvasMatting.description')">
          <el-input v-model="characterForm.desc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('canvasMatting.isPublic')">
          <el-radio-group v-model="characterForm.is_public">
            <el-radio :label="1">{{ $t('canvasMatting.public') }}</el-radio>
            <el-radio :label="0">{{ $t('canvasMatting.private') }}</el-radio>
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
import { UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  readFileAsDataUrl,
  downloadDataUrl,
  mattingFromDataUrl,
  canvasToDataUrl,
} from '@/utils/canvasMatting';
import { saveCroppedCharacter, CHARACTER_CATEGORIES } from '@/utils/saveCroppedAsset';
import { setEditorproPendingImage } from '@/utils/editorproPendingImage';

export default {
  name: 'CanvasMattingPage',
  components: { UploadFilled },
  data() {
    return {
      imageSrc: '',
      resultUrl: '',
      processing: false,
      threshold: 240,
      tolerance: 28,
      floodFromEdges: true,
      stickerStyle: true,
      showCharacterForm: false,
      saving: false,
      characterCategories: CHARACTER_CATEGORIES,
      characterForm: {
        name: '',
        category: '',
        desc: '',
        is_public: 1,
      },
    };
  },
  methods: {
    async onFileChange(file) {
      const raw = file.raw;
      if (!raw || !raw.type.startsWith('image/')) {
        ElMessage.warning(this.$t('canvasMatting.invalidImage'));
        return;
      }
      try {
        this.imageSrc = await readFileAsDataUrl(raw);
        this.resultUrl = '';
        await this.runMatting();
      } catch {
        ElMessage.error(this.$t('canvasMatting.loadFailed'));
      }
    },
    async runMatting() {
      if (!this.imageSrc) return;
      this.processing = true;
      try {
        const canvas = await mattingFromDataUrl(this.imageSrc, {
          threshold: this.threshold,
          tolerance: this.tolerance,
          floodFromEdges: this.floodFromEdges,
          sticker: this.stickerStyle,
          feather: 1,
        });
        this.resultUrl = canvasToDataUrl(canvas);
      } catch (e) {
        ElMessage.error(e.message || this.$t('canvasMatting.processFailed'));
      } finally {
        this.processing = false;
      }
    },
    resetImage() {
      this.imageSrc = '';
      this.resultUrl = '';
    },
    handleDownload() {
      if (!this.resultUrl) return;
      downloadDataUrl(this.resultUrl, `matting-${Date.now()}.png`);
      ElMessage.success(this.$t('canvasMatting.downloaded'));
    },
    openEditorPro() {
      if (!this.resultUrl) return;
      setEditorproPendingImage(this.resultUrl, { title: this.characterForm.name || '' });
      this.$router.push('/editorpro');
    },
    async handleSaveCharacter() {
      if (!this.resultUrl) return;
      if (!this.characterForm.name || !this.characterForm.category) {
        ElMessage.warning(this.$t('canvasMatting.fillNameAndCategory'));
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
        ElMessage.success(this.$t('canvasMatting.characterSaved'));
        this.showCharacterForm = false;
        this.$router.push('/creation-studio/character');
      } catch (e) {
        ElMessage.error(e.message || this.$t('canvasMatting.saveFailed'));
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.matting-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.matting-page-header h1 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #1c345e;
}

.matting-page-header p {
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
}

.matting-card {
  border-radius: 12px;
}

.upload-zone {
  padding: 24px 0;
}

.upload-icon {
  font-size: 48px;
  color: #8167a9;
  margin-bottom: 8px;
}

.matting-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.control-row label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.control-row--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.matting-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-label {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.preview-box {
  min-height: 280px;
  border-radius: 10px;
  border: 1px solid #ececf0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 12px;
}

.checkerboard {
  background: repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 50% / 16px 16px;
}

.preview-box img {
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
}

.preview-empty {
  color: #909399;
  font-size: 14px;
}

.matting-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .matting-page {
    padding: 16px 12px 32px;
  }

  .matting-preview {
    grid-template-columns: 1fr;
  }
}
</style>
