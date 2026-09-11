<template>
  <div class="sticker-lab-page">
    <header class="lab-hero" :class="{ 'is-editing': imageSrc }">
      <div class="hero-brand">
        <p class="hero-eyebrow">STICKER LAB</p>
        <h1>{{ $t('lassoCrop.pageTitle') }}</h1>
        <p class="hero-hint">{{ $t('stickerLab.heroHint') }}</p>
      </div>

      <div v-if="!imageSrc" class="hero-upload">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onFileChange"
          class="upload-trigger"
        >
          <button type="button" class="btn-upload">
            <span class="btn-upload-icon" aria-hidden="true">⬆</span>
            <span>{{ $t('stickerLab.uploadPhoto') }}</span>
          </button>
        </el-upload>
        <p class="upload-tip">{{ $t('lassoCrop.uploadTip') }}</p>
        <div class="upload-or">{{ $t('myIllustrationPicker.or') }}</div>
        <MyIllustrationPicker class="ill-picker" @select="onPickIllustration" />
      </div>

      <button v-else type="button" class="btn-chip" @click="resetImage">
        {{ $t('lassoCrop.changeImage') }}
      </button>
    </header>

    <main class="lab-main">
      <section v-if="imageSrc" class="editor-section">
        <div class="panel-block">
          <p class="panel-label">{{ $t('stickerLab.cropMode') }}</p>
          <div class="chip-row">
            <button
              type="button"
              class="mode-chip"
              :class="{ active: cropMode === 'lasso' }"
              @click="setCropMode('lasso')"
            >
              {{ $t('stickerLab.modeLasso') }}
            </button>
            <button
              type="button"
              class="mode-chip"
              :class="{ active: cropMode === 'matte' }"
              @click="setCropMode('matte')"
            >
              {{ $t('stickerLab.modeMatte') }}
            </button>
          </div>
        </div>

        <div class="panel-block">
          <p class="panel-label">{{ $t('stickerLab.borderStyle') }}</p>
          <div class="chip-row">
            <button
              v-for="s in styleOptions"
              :key="s.value"
              type="button"
              class="mode-chip"
              :class="{ active: stickerStyle === s.value }"
              @click="stickerStyle = s.value"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <div v-if="stickerStyle !== 'raw'" class="panel-block">
          <p class="panel-label">{{ $t('stickerLab.borderColor') }}</p>
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
        </div>

        <div class="action-row">
          <button type="button" class="btn-chip" :disabled="!resultUrl" @click="handleDownload">
            {{ $t('lassoCrop.download') }}
          </button>
          <button type="button" class="btn-chip" :disabled="!resultUrl" @click="saveToLocal">
            {{ $t('stickerLab.saveToCollection') }}
          </button>
          <button type="button" class="btn-chip" :disabled="!resultUrl" @click="showCharacterForm = true">
            {{ $t('lassoCrop.saveToMyCharacter') }}
          </button>
          <button type="button" class="btn-primary" :disabled="!resultUrl" @click="showElementForm = true">
            {{ $t('lassoCrop.saveAsElement') }}
          </button>
        </div>
      </section>

      <StickerCollection ref="collectionRef" />
    </main>

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
      this.onCropModeChange();
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
.sticker-lab-page {
  --blue: #a8c0d0;
  --cream: #f8f2e9;
  --ink: #1a1a1a;
  --yellow: #f5d76e;
  width: 100%;
  min-height: calc(100vh - 50px);
  background: var(--cream);
  color: var(--ink);
  padding-bottom: 48px;
}

.lab-hero {
  background: var(--blue);
  border-bottom: 4px solid var(--ink);
  padding: 32px 20px 28px;
  text-align: center;
}

.lab-hero.is-editing {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
}

.lab-hero.is-editing .hero-brand {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.lab-hero.is-editing .hero-eyebrow,
.lab-hero.is-editing .hero-hint {
  display: none;
}

.lab-hero.is-editing h1 {
  font-size: 18px;
  margin: 0;
}

.hero-brand {
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
}

.hero-eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
  opacity: 0.65;
}

.lab-hero h1 {
  margin: 8px 0 0;
  font-size: clamp(28px, 6vw, 36px);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.hero-hint {
  margin: 10px 0 0;
  font-size: 13px;
  opacity: 0.72;
  line-height: 1.5;
}

.hero-upload {
  position: relative;
  z-index: 1;
}

.upload-trigger :deep(.el-upload) {
  display: inline-block;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border: 4px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-size: 17px;
  font-weight: 800;
  box-shadow: 4px 4px 0 var(--ink);
  cursor: pointer;
  font-family: inherit;
}

.btn-upload:active {
  transform: translateY(1px);
  box-shadow: 2px 2px 0 var(--ink);
}

.btn-upload-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--ink);
  border-radius: 50%;
  background: var(--yellow);
  font-size: 14px;
}

.upload-tip {
  margin: 12px 0 0;
  font-size: 12px;
  opacity: 0.6;
}

.upload-or {
  margin: 18px 0 12px;
  font-size: 13px;
  opacity: 0.55;
}

.ill-picker :deep(.el-button) {
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  font-weight: 700;
  box-shadow: 2px 2px 0 var(--ink);
  padding: 10px 20px;
}

.ill-picker :deep(.el-button:hover) {
  background: var(--cream);
  color: var(--ink);
  border-color: var(--ink);
}

.btn-chip {
  flex-shrink: 0;
  padding: 8px 16px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 2px 2px 0 var(--ink);
  cursor: pointer;
  font-family: inherit;
  color: var(--ink);
}

.btn-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.lab-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 16px 0;
}

.editor-section {
  margin-bottom: 8px;
}

.panel-block {
  margin-bottom: 14px;
}

.panel-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  opacity: 0.55;
  text-transform: uppercase;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mode-chip {
  padding: 10px 14px;
  border: 3px solid var(--ink);
  border-radius: 14px;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  color: var(--ink);
  box-shadow: 2px 2px 0 rgba(26, 26, 26, 0.12);
}

.mode-chip.active {
  background: var(--yellow);
  box-shadow: 3px 3px 0 var(--ink);
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-chip {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  padding: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.color-chip.active {
  border-color: var(--ink);
  box-shadow: 0 0 0 2px var(--yellow);
}

.canvas-panel {
  margin: 18px 0;
  padding: 12px;
  border: 3px solid var(--ink);
  border-radius: 16px;
  background: #d7e3eb;
  box-shadow: 3px 3px 0 rgba(26, 26, 26, 0.15);
}

.canvas-panel :deep(.lasso-crop-canvas),
.canvas-panel :deep(.matte-brush-canvas) {
  display: block;
}

.canvas-panel :deep(.lasso-side) {
  background: var(--cream);
  border-radius: 12px;
  padding: 12px;
}

.canvas-panel :deep(.matte-tools) {
  background: var(--cream);
  border-radius: 12px;
  padding: 12px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.btn-primary {
  padding: 10px 18px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 3px 3px 0 rgba(26, 26, 26, 0.25);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 640px) {
  .lab-hero.is-editing {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .action-row .btn-chip,
  .action-row .btn-primary {
    flex: 1 1 calc(50% - 5px);
    text-align: center;
  }

  .canvas-panel :deep(.lasso-crop-canvas),
  .canvas-panel :deep(.matte-brush-canvas) {
    grid-template-columns: 1fr;
  }
}
</style>
