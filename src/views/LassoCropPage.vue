<template>
  <div class="sticker-workshop">
    <header class="workshop-hero">
      <h1>{{ $t('lassoCrop.pageTitle') }}</h1>
      <p class="hero-desc">{{ $t('lassoCrop.pageDesc') }}</p>
    </header>

    <div class="workshop-body">
      <section class="col-work">
        <div v-if="!imageSrc" class="upload-panel">
          <el-upload
            ref="uploadRef"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            class="upload-el"
            :on-change="onFileChange"
          >
            <div class="upload-drop">
              <span class="upload-circle" aria-hidden="true">
                <el-icon><UploadFilled /></el-icon>
              </span>
              <p class="upload-title">{{ $t('lassoCrop.uploadHint') }}</p>
              <p class="upload-sub">{{ $t('stickerLab.uploadFormats') }}</p>
            </div>
          </el-upload>

          <MyIllustrationPicker class="picker-btn" @select="onPickIllustration" />
        </div>

        <div v-else class="editor-panel">
          <button type="button" class="link-back" @click="resetImage">
            ← {{ $t('lassoCrop.changeImage') }}
          </button>

          <div class="tool-block">
            <p class="tool-label">{{ $t('stickerLab.cropMode') }}</p>
            <div class="pill-row">
              <button
                type="button"
                class="tool-pill"
                :class="{ active: cropMode === 'lasso' }"
                @click="setCropMode('lasso')"
              >
                {{ $t('stickerLab.modeLasso') }}
              </button>
              <button
                type="button"
                class="tool-pill"
                :class="{ active: cropMode === 'matte' }"
                @click="setCropMode('matte')"
              >
                {{ $t('stickerLab.modeMatte') }}
              </button>
            </div>
          </div>

          <div class="tool-block">
            <p class="tool-label">{{ $t('stickerLab.borderStyle') }}</p>
            <div class="pill-row">
              <button
                v-for="s in styleOptions"
                :key="s.value"
                type="button"
                class="tool-pill"
                :class="{ active: stickerStyle === s.value }"
                @click="stickerStyle = s.value"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <div v-if="stickerStyle !== 'raw'" class="tool-block">
            <p class="tool-label">{{ $t('stickerLab.borderColor') }}</p>
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

          <div class="canvas-panel">
            <LassoCropCanvas
              v-if="cropMode === 'lasso'"
              ref="lassoRef"
              embedded
              :image-src="imageSrc"
              :sticker-style="stickerStyle"
              :border-color="borderColor"
              @cropped="onCropped"
              @reset="clearResult"
            />
            <MatteBrushCanvas
              v-else
              ref="matteRef"
              embedded
              :image-src="imageSrc"
              :sticker-style="stickerStyle"
              :border-color="borderColor"
              @cropped="onCropped"
            />
          </div>

          <div class="action-row">
            <button
              type="button"
              class="btn-preview"
              :disabled="!imageSrc"
              @click="handlePreview"
            >
              {{ $t('stickerLab.preview') }}
            </button>
            <button
              type="button"
              class="btn-generate"
              :disabled="!imageSrc"
              @click="handleGenerate"
            >
              {{ $t('stickerLab.generateSticker') }}
            </button>
          </div>

          <div v-if="resultUrl" class="extra-actions">
            <button type="button" class="text-action" @click="handleDownload">
              {{ $t('lassoCrop.download') }}
            </button>
            <button type="button" class="text-action" @click="saveToLocal">
              {{ $t('stickerLab.saveToCollection') }}
            </button>
            <button type="button" class="text-action" @click="showElementForm = true">
              {{ $t('lassoCrop.saveAsElement') }}
            </button>
            <button type="button" class="text-action" @click="showCharacterForm = true">
              {{ $t('lassoCrop.saveToMyCharacter') }}
            </button>
          </div>
        </div>
      </section>

      <aside class="col-gallery">
        <StickerCollection ref="collectionRef" variant="gallery" />
      </aside>
    </div>

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
  computed: {
    styleOptions() {
      return [
        { value: 'sticker', label: this.$t('stickerLab.styleSticker') },
        { value: 'outline', label: this.$t('stickerLab.styleOutline') },
        { value: 'raw', label: this.$t('stickerLab.styleRaw') },
      ];
    },
  },
  beforeUnmount() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = '';
    }
  },
  methods: {
    setCropMode(mode) {
      if (this.cropMode === mode) return;
      this.cropMode = mode;
      this.clearResult();
    },
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
    handlePreview() {
      if (this.cropMode === 'matte') {
        this.$refs.matteRef?.openPreview?.();
      } else {
        this.$refs.lassoRef?.openPreview?.();
      }
    },
    handleGenerate() {
      if (this.cropMode === 'matte') {
        this.$refs.matteRef?.generate?.();
      } else {
        this.$refs.lassoRef?.generate?.();
      }
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
.sticker-workshop {
  --cream: #f5efe1;
  --cream-deep: #ebe3d3;
  --ink: #3d3229;
  --muted: #8a7f72;
  --terra: #c97652;
  --terra-light: #e8966f;
  --dash: #d4c4b0;
  width: 100%;
  min-height: calc(100vh - 50px);
  background:
    radial-gradient(ellipse 120% 80% at 50% 0%, #faf6ee 0%, var(--cream) 55%, #ebe3d3 100%);
  color: var(--ink);
  text-align: left;
  padding: 28px 24px 48px;
  box-sizing: border-box;
}

.workshop-hero {
  max-width: 1080px;
  margin: 0 auto 28px;
}

.workshop-hero h1 {
  margin: 0 0 10px;
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', Georgia, serif;
  font-size: clamp(32px, 5vw, 42px);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--ink);
  line-height: 1.2;
}

.hero-desc {
  margin: 0;
  max-width: 420px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
}

.workshop-body {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
}

.col-work {
  min-width: 0;
}

.upload-panel,
.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.upload-el {
  width: 100%;
}

.upload-el :deep(.el-upload) {
  width: 100%;
}

.upload-el :deep(.el-upload-dragger) {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  height: auto;
  display: block;
  overflow: hidden;
}

.upload-drop {
  border: 1.5px dashed var(--dash);
  border-radius: 16px;
  padding: 32px 16px 28px;
  text-align: center;
  background: rgba(255, 255, 255, 0.35);
  transition: border-color 0.2s, background 0.2s;
}

.upload-el :deep(.el-upload-dragger:hover) .upload-drop,
.upload-el :deep(.el-upload-dragger.is-dragover) .upload-drop {
  border-color: var(--terra);
  background: rgba(255, 255, 255, 0.55);
}

.upload-circle {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--terra);
  color: var(--terra);
  font-size: 24px;
  margin-bottom: 16px;
}

.upload-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.upload-sub {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.picker-btn {
  width: 100%;
}

.picker-btn :deep(.my-ill-picker) {
  width: 100%;
}

.picker-btn :deep(.el-button) {
  width: 100%;
  height: auto;
  padding: 12px 20px;
  border-radius: 999px;
  border: 1.5px solid var(--dash);
  background: rgba(255, 255, 255, 0.5);
  color: var(--ink);
  font-weight: 600;
  font-size: 14px;
  box-shadow: none;
}

.picker-btn :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--terra);
  color: var(--ink);
}

.action-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.btn-preview {
  width: 100%;
  padding: 14px 20px;
  box-sizing: border-box;
  border-radius: 999px;
  border: 1.5px solid var(--dash);
  background: rgba(255, 255, 255, 0.55);
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, opacity 0.15s;
}

.btn-preview:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.85);
  border-color: var(--terra);
  color: var(--terra);
}

.btn-preview:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-generate {
  width: 100%;
  padding: 14px 24px;
  box-sizing: border-box;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--terra-light) 0%, var(--terra) 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(201, 118, 82, 0.28);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(201, 118, 82, 0.34);
}

.btn-generate:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.link-back {
  margin-bottom: 16px;
  padding: 0;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}

.link-back:hover {
  color: var(--terra);
}

.tool-block {
  margin-bottom: 14px;
}

.tool-label {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-pill {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--dash);
  background: rgba(255, 255, 255, 0.45);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.tool-pill.active {
  background: rgba(255, 255, 255, 0.9);
  border-color: var(--terra);
  color: var(--terra);
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-chip {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.color-chip.active {
  border-color: var(--terra);
}

.canvas-panel {
  margin: 8px 0 16px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(212, 196, 176, 0.5);
}

.canvas-panel :deep(.lasso-crop-canvas),
.canvas-panel :deep(.matte-brush-canvas) {
  display: block;
}

.canvas-panel :deep(.lasso-crop-canvas) {
  flex-direction: column;
}

.canvas-panel :deep(.lasso-side),
.canvas-panel :deep(.matte-tools) {
  width: 100%;
}

.canvas-panel :deep(.matte-brush-canvas) {
  grid-template-columns: 1fr;
}

.extra-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 14px;
  justify-content: center;
}

.text-action {
  padding: 0;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.text-action:hover:not(:disabled) {
  color: var(--terra);
}

.text-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.col-gallery {
  min-width: 0;
  position: sticky;
  top: 62px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

@media (max-width: 860px) {
  .workshop-body {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .col-gallery {
    position: static;
    max-height: none;
    overflow: visible;
  }

  .sticker-workshop {
    padding: 20px 16px 40px;
  }
}
</style>
