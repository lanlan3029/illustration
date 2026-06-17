<template>
  <div class="lasso-page">
    <div class="lasso-page-header">
      <h1>{{ $t('lassoCrop.pageTitle') }}</h1>
      <p>{{ $t('lassoCrop.pageDesc') }}</p>
    </div>

    <el-card class="lasso-card" shadow="hover">
      <div v-if="!imageSrc" class="upload-zone">
        <el-upload
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onFileChange"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="el-upload__text">{{ $t('lassoCrop.uploadHint') }}</div>
          <template #tip>
            <div class="el-upload__tip">{{ $t('lassoCrop.uploadTip') }}</div>
          </template>
        </el-upload>
      </div>

      <template v-else>
        <LassoCropCanvas
          ref="canvasRef"
          :image-src="imageSrc"
          @cropped="onCropped"
          @reset="resultUrl = ''"
        />
        <div class="lasso-page-actions">
          <el-button @click="resetImage">{{ $t('lassoCrop.changeImage') }}</el-button>
          <el-button :disabled="!resultUrl" @click="handleDownload">
            {{ $t('lassoCrop.download') }}
          </el-button>
          <el-button type="primary" :disabled="!resultUrl" @click="showCharacterForm = true">
            {{ $t('lassoCrop.saveToMyCharacter') }}
          </el-button>
        </div>
      </template>
    </el-card>

    <el-dialog
      v-model="showCharacterForm"
      :title="$t('lassoCrop.saveToMyCharacter')"
      width="440px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item :label="$t('lassoCrop.characterName')" required>
          <el-input v-model="characterForm.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.category')" required>
          <el-select v-model="characterForm.category" style="width: 100%">
            <el-option
              v-for="item in characterCategories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.description')">
          <el-input v-model="characterForm.desc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.isPublic')">
          <el-radio-group v-model="characterForm.is_public">
            <el-radio :label="1">{{ $t('lassoCrop.public') }}</el-radio>
            <el-radio :label="0">{{ $t('lassoCrop.private') }}</el-radio>
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
import LassoCropCanvas from '@/components/editorPro/editor-components/LassoCropCanvas.vue';
import { readFileAsDataUrl, downloadDataUrl } from '@/utils/lassoCrop';
import { saveCroppedCharacter, CHARACTER_CATEGORIES } from '@/utils/saveCroppedAsset';

export default {
  name: 'LassoCropPage',
  components: { LassoCropCanvas, UploadFilled },
  data() {
    return {
      imageSrc: '',
      resultUrl: '',
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
        ElMessage.warning(this.$t('lassoCrop.invalidImage'));
        return;
      }
      try {
        this.imageSrc = await readFileAsDataUrl(raw);
        this.resultUrl = '';
      } catch (e) {
        ElMessage.error(this.$t('lassoCrop.loadFailed'));
      }
    },
    onCropped({ dataUrl }) {
      this.resultUrl = dataUrl;
    },
    resetImage() {
      this.imageSrc = '';
      this.resultUrl = '';
    },
    handleDownload() {
      if (!this.resultUrl) return;
      downloadDataUrl(this.resultUrl, `character-sticker-${Date.now()}.png`);
      ElMessage.success(this.$t('lassoCrop.downloaded'));
    },
    async handleSaveCharacter() {
      if (!this.resultUrl) return;
      if (!this.characterForm.name || !this.characterForm.category) {
        ElMessage.warning(this.$t('lassoCrop.fillNameAndCategory'));
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
        ElMessage.success(this.$t('lassoCrop.characterSaved'));
        this.showCharacterForm = false;
        this.$router.push('/creation-studio/character');
      } catch (e) {
        ElMessage.error(e.message || this.$t('lassoCrop.saveFailed'));
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.lasso-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.lasso-page-header h1 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #1c345e;
}

.lasso-page-header p {
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
}

.lasso-card {
  border-radius: 12px;
}

.upload-zone {
  padding: 24px 0;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 8px;
}

.lasso-page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .lasso-page {
    padding: 16px 12px 32px;
  }
}
</style>
