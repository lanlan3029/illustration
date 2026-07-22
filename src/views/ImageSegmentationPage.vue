<template>
  <div class="segment-page">
    <div class="segment-page-header">
      <h1>{{ $t('imageSegmentation.pageTitle') }}</h1>
      <p>{{ $t('imageSegmentation.pageDesc') }}</p>
    </div>

    <el-card class="segment-card" shadow="hover">
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
            <p class="compare-label">{{ $t('imageSegmentation.result') }}</p>
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

        <div class="segment-page-actions">
          <el-button @click="resetImage">{{ $t('imageSegmentation.changeImage') }}</el-button>
          <el-button type="primary" :loading="segmenting" @click="handleSegment">
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
import { rembgFromFile } from '@/utils/imageSegmentation';
import { saveCroppedCharacter, CHARACTER_CATEGORIES } from '@/utils/saveCroppedAsset';

export default {
  name: 'ImageSegmentationPage',
  components: { UploadFilled, Loading },
  data() {
    return {
      photoFile: null,
      photoPreviewUrl: '',
      resultUrl: '',
      segmenting: false,
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
        ElMessage.warning(this.$t('imageSegmentation.invalidImage'));
        return;
      }
      try {
        this.photoFile = raw;
        this.photoPreviewUrl = await readFileAsDataUrl(raw);
        this.resultUrl = '';
      } catch {
        ElMessage.error(this.$t('imageSegmentation.loadFailed'));
      }
    },
    resetImage() {
      this.photoFile = null;
      this.photoPreviewUrl = '';
      this.resultUrl = '';
    },
    async handleSegment() {
      if (!this.photoFile) {
        ElMessage.warning(this.$t('imageSegmentation.noImage'));
        return;
      }
      this.segmenting = true;
      this.resultUrl = '';
      try {
        const result = await rembgFromFile(this.$http, this.photoFile);
        this.resultUrl = result.imageURL;
        ElMessage.success(this.$t('imageSegmentation.segmentSuccess'));
      } catch (error) {
        let message = this.$t('imageSegmentation.segmentFailed');
        if (error?.response?.data?.message) {
          message = error.response.data.message;
        } else if (error?.message) {
          message = error.message;
        }
        ElMessage.error(message);
      } finally {
        this.segmenting = false;
      }
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

.upload-zone {
  padding: 24px 0;
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

  .compare-grid {
    grid-template-columns: 1fr;
  }
}
</style>
