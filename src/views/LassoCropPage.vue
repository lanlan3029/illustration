<template>
  <div class="lasso-page">
    <header class="lasso-page-header">
      <h1>{{ $t('lassoCrop.pageTitle') }}</h1>
      <p>{{ $t('lassoCrop.pageDesc') }}</p>
    </header>

    <el-card class="lasso-card" shadow="never">
      <section class="work-section">
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
          <div class="upload-divider">
            <span>{{ $t('myIllustrationPicker.or') }}</span>
          </div>
          <MyIllustrationPicker class="ill-picker" @select="onPickIllustration" />
        </div>

        <template v-else>
          <div class="editor-toolbar">
            <div class="toolbar-block">
              <span class="section-label">{{ $t('stickerLab.cropMode') }}</span>
              <el-radio-group v-model="cropMode" size="small" @change="onCropModeChange">
                <el-radio-button label="lasso">{{ $t('stickerLab.modeLasso') }}</el-radio-button>
                <el-radio-button label="matte">{{ $t('stickerLab.modeMatte') }}</el-radio-button>
              </el-radio-group>
            </div>
            <div class="toolbar-block">
              <span class="section-label">{{ $t('stickerLab.borderStyle') }}</span>
              <el-radio-group v-model="stickerStyle" size="small">
                <el-radio-button label="sticker">{{ $t('stickerLab.styleSticker') }}</el-radio-button>
                <el-radio-button label="outline">{{ $t('stickerLab.styleOutline') }}</el-radio-button>
                <el-radio-button label="raw">{{ $t('stickerLab.styleRaw') }}</el-radio-button>
              </el-radio-group>
            </div>
            <div v-if="stickerStyle !== 'raw'" class="toolbar-block">
              <span class="section-label">{{ $t('stickerLab.borderColor') }}</span>
              <div class="color-row">
                <button
                  v-for="c in borderColors"
                  :key="c"
                  type="button"
                  class="color-chip"
                  :class="{ active: borderColor === c }"
                  :style="{ background: c }"
                  :aria-label="c"
                  @click="borderColor = c"
                />
              </div>
            </div>
          </div>

          <LassoCropCanvas
            v-if="cropMode === 'lasso'"
            ref="lassoRef"
            :image-src="imageSrc"
            :sticker-style="stickerStyle"
            :border-color="borderColor"
            @cropped="onCropped"
            @reset="clearResult"
          />
          <MatteBrushCanvas
            v-else
            :image-src="imageSrc"
            :sticker-style="stickerStyle"
            :border-color="borderColor"
            @cropped="onCropped"
          />

          <div class="lasso-page-actions">
            <el-button @click="resetImage">{{ $t('lassoCrop.changeImage') }}</el-button>
            <el-button :disabled="!resultUrl" @click="handleDownload">
              {{ $t('lassoCrop.download') }}
            </el-button>
            <el-button :disabled="!resultUrl" @click="saveToLocal">
              {{ $t('stickerLab.saveToCollection') }}
            </el-button>
            <el-button type="primary" :disabled="!resultUrl" @click="showElementForm = true">
              {{ $t('lassoCrop.saveAsElement') }}
            </el-button>
            <el-button :disabled="!resultUrl" @click="showCharacterForm = true">
              {{ $t('lassoCrop.saveToMyCharacter') }}
            </el-button>
          </div>
        </template>
      </section>

      <div class="section-divider" />

      <StickerCollection ref="collectionRef" embedded />
    </el-card>

    <el-dialog
      v-model="showElementForm"
      :title="$t('lassoCrop.saveAsElement')"
      width="440px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item :label="$t('lassoCrop.elementName')" required>
          <el-input v-model="elementForm.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.category')" required>
          <el-select v-model="elementForm.category" style="width: 100%">
            <el-option
              v-for="item in elementCategories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.description')">
          <el-input v-model="elementForm.desc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.isPublic')">
          <el-radio-group v-model="elementForm.is_public">
            <el-radio :label="1">{{ $t('lassoCrop.public') }}</el-radio>
            <el-radio :label="0">{{ $t('lassoCrop.private') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showElementForm = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveElement">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

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
import MatteBrushCanvas from '@/components/sticker/MatteBrushCanvas.vue';
import StickerCollection from '@/components/sticker/StickerCollection.vue';
import { readFileAsDataUrl, downloadDataUrl } from '@/utils/lassoCrop';
import {
  uploadPictureElement,
  saveCroppedCharacter,
  ELEMENT_CATEGORIES,
  CHARACTER_CATEGORIES,
} from '@/utils/saveCroppedAsset';
import { STICKER_BORDER_COLORS } from '@/utils/stickerLab/stickerStyles';
import { addLocalSticker } from '@/utils/stickerLab/stickerStorage';
import MyIllustrationPicker from '@/components/MyIllustrationPicker.vue';

export default {
  name: 'LassoCropPage',
  components: {
    LassoCropCanvas,
    MatteBrushCanvas,
    StickerCollection,
    UploadFilled,
    MyIllustrationPicker,
  },
  data() {
    return {
      imageSrc: '',
      objectUrl: '',
      resultUrl: '',
      cropMode: 'lasso',
      stickerStyle: 'sticker',
      borderColor: '#ffffff',
      borderColors: STICKER_BORDER_COLORS,
      lastCropMeta: null,
      showElementForm: false,
      showCharacterForm: false,
      saving: false,
      elementCategories: ELEMENT_CATEGORIES,
      characterCategories: CHARACTER_CATEGORIES,
      elementForm: {
        name: '',
        category: '',
        desc: '',
        is_public: 1,
      },
      characterForm: {
        name: '',
        category: '',
        desc: '',
        is_public: 1,
      },
    };
  },
  beforeUnmount() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = '';
    }
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
        this.clearResult();
      } catch (e) {
        ElMessage.error(this.$t('lassoCrop.loadFailed'));
      }
    },
    onPickIllustration({ url }) {
      if (!url) {
        ElMessage.error(this.$t('lassoCrop.loadFailed'));
        return;
      }
      this.loadRemoteIllustration(url);
    },
    async loadRemoteIllustration(url) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        if (this.objectUrl) {
          URL.revokeObjectURL(this.objectUrl);
          this.objectUrl = '';
        }
        this.objectUrl = URL.createObjectURL(blob);
        this.imageSrc = this.objectUrl;
        this.clearResult();
      } catch (e) {
        console.warn('[lasso] fetch illustration as blob failed, fallback to url', e);
        this.imageSrc = url;
        this.clearResult();
      }
    },
    onCropModeChange() {
      this.clearResult();
    },
    clearResult() {
      this.resultUrl = '';
      this.lastCropMeta = null;
    },
    async onCropped(payload) {
      this.resultUrl = payload.dataUrl;
      this.lastCropMeta = payload;
      if (payload.source !== 'generate') return;
      try {
        await addLocalSticker(payload.dataUrl, {
          style: payload.style || this.stickerStyle,
          borderColor: payload.borderColor || this.borderColor,
          mode: payload.mode || this.cropMode,
        });
        await this.$refs.collectionRef?.refresh?.();
        ElMessage.success(this.$t('stickerLab.addedToCollection'));
      } catch (e) {
        console.warn('[sticker] local save failed', e);
      }
    },
    resetImage() {
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = '';
      }
      this.imageSrc = '';
      this.clearResult();
    },
    handleDownload() {
      if (!this.resultUrl) return;
      downloadDataUrl(this.resultUrl, `sticker-${Date.now()}.png`);
      ElMessage.success(this.$t('lassoCrop.downloaded'));
    },
    async saveToLocal() {
      if (!this.resultUrl) return;
      try {
        await addLocalSticker(this.resultUrl, {
          style: this.lastCropMeta?.style || this.stickerStyle,
          borderColor: this.lastCropMeta?.borderColor || this.borderColor,
          mode: this.lastCropMeta?.mode || this.cropMode,
        });
        await this.$refs.collectionRef?.refresh?.();
        ElMessage.success(this.$t('stickerLab.savedToCollection'));
      } catch (e) {
        ElMessage.error(this.$t('stickerLab.saveFailed'));
      }
    },
    async handleSaveElement() {
      if (!this.resultUrl) return;
      if (!this.elementForm.name || !this.elementForm.category) {
        ElMessage.warning(this.$t('lassoCrop.fillNameAndCategory'));
        return;
      }
      this.saving = true;
      try {
        await uploadPictureElement(this.$http, this.resultUrl, {
          title: this.elementForm.name,
          type: this.elementForm.category,
          desc: this.elementForm.desc,
          is_public: this.elementForm.is_public,
        });
        ElMessage.success(this.$t('lassoCrop.elementSaved'));
        this.showElementForm = false;
      } catch (e) {
        ElMessage.error(e.message || this.$t('lassoCrop.saveFailed'));
      } finally {
        this.saving = false;
      }
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
  --accent: #8167a9;
  --accent-soft: #f5f0fa;
  --border: #e8e0f4;
  --text: #1c345e;
  --muted: #6b7280;
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 16px 56px;
}

.lasso-page-header {
  text-align: center;
  margin-bottom: 24px;
}

.lasso-page-header h1 {
  margin: 0 0 10px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.lasso-page-header p {
  margin: 0 auto;
  max-width: 640px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
}

.lasso-card {
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 28px rgba(28, 52, 94, 0.06);
}

.lasso-card :deep(.el-card__body) {
  padding: 28px;
}

.work-section {
  min-height: 0;
}

.upload-zone {
  max-width: 520px;
  margin: 0 auto;
  padding: 8px 0 4px;
}

.upload-zone :deep(.el-upload) {
  width: 100%;
}

.upload-zone :deep(.el-upload-dragger) {
  width: 100%;
  border: 1.5px dashed var(--border);
  border-radius: 12px;
  background: var(--accent-soft);
  padding: 36px 20px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.upload-zone :deep(.el-upload-dragger:hover) {
  border-color: #c4b5dc;
  background: #f0ebf8;
}

.upload-zone :deep(.el-upload__text) {
  color: var(--text);
  font-size: 14px;
}

.upload-zone :deep(.el-upload__tip) {
  color: var(--muted);
  font-size: 12px;
  margin-top: 6px;
}

.upload-icon {
  font-size: 44px;
  color: var(--accent);
  margin-bottom: 10px;
}

.upload-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
  color: var(--muted);
  font-size: 13px;
}

.upload-divider::before,
.upload-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #f0ecf6;
}

.ill-picker {
  display: flex;
  justify-content: center;
}

.ill-picker :deep(.el-button) {
  border-color: var(--border);
  color: var(--accent);
  background: #fff;
  border-radius: 10px;
  font-weight: 500;
}

.ill-picker :deep(.el-button:hover) {
  border-color: #c4b5dc;
  background: var(--accent-soft);
  color: var(--accent);
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 28px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0ecf6;
}

.toolbar-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-toolbar :deep(.el-radio-button__inner) {
  border-color: var(--border);
  color: var(--muted);
  background: #fff;
}

.editor-toolbar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--accent-soft);
  border-color: #c4b5dc;
  color: var(--accent);
  box-shadow: none;
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-chip {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.color-chip.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.25);
}

.section-divider {
  height: 1px;
  background: #f0ecf6;
  margin: 28px 0;
}

.lasso-page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0ecf6;
}

.lasso-page-actions :deep(.el-button--primary) {
  --el-button-bg-color: var(--accent);
  --el-button-border-color: var(--accent);
  --el-button-hover-bg-color: #705592;
  --el-button-hover-border-color: #705592;
}

@media (max-width: 768px) {
  .lasso-page {
    padding: 16px 12px 40px;
  }

  .lasso-card :deep(.el-card__body) {
    padding: 20px 16px;
  }

  .editor-toolbar {
    flex-direction: column;
    gap: 16px;
  }

  .lasso-page-actions {
    justify-content: stretch;
  }

  .lasso-page-actions :deep(.el-button) {
    flex: 1 1 calc(50% - 5px);
    margin: 0;
  }
}
</style>
