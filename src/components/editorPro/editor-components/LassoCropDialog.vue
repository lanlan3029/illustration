<template>
  <Modal
    :z-index="11000"
    v-model="visible"
    :title="$t('lassoCrop.title')"
    width="90%"
    :footer-hide="true"
    class-name="lasso-crop-modal image-tool-modal"
    @on-visible-change="onVisibleChange"
    @on-cancel="onCancel"
  >
    <div v-if="visible && img" class="lasso-dialog-body">
      <div class="workflow-guide" role="status">
        <strong>{{ $t(resultUrl ? 'stickerLab.stepApply' : 'stickerLab.stepRefine') }}</strong>
        <span>{{ $t(resultUrl ? 'stickerLab.applyHelp' : (cropMode === 'matte' ? 'stickerLab.refineHelp' : 'stickerLab.lassoHelp')) }}</span>
      </div>
      <div class="editor-toolbar">
        <div class="toolbar-block">
          <span class="toolbar-label">{{ $t('stickerLab.cropMode') }}</span>
          <el-radio-group v-model="cropMode" size="small" @change="onCropModeChange">
            <el-radio-button label="lasso">{{ $t('stickerLab.modeLasso') }}</el-radio-button>
            <el-radio-button label="matte">{{ $t('stickerLab.modeMatte') }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-block">
          <span class="toolbar-label">{{ $t('stickerLab.borderStyle') }}</span>
          <el-radio-group v-model="stickerStyle" size="small">
            <el-radio-button label="sticker">{{ $t('stickerLab.styleSticker') }}</el-radio-button>
            <el-radio-button label="outline">{{ $t('stickerLab.styleOutline') }}</el-radio-button>
            <el-radio-button label="raw">{{ $t('stickerLab.styleRaw') }}</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="stickerStyle !== 'raw'" class="toolbar-block">
          <span class="toolbar-label">{{ $t('stickerLab.borderColor') }}</span>
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
        :image-src="img"
        :natural-width="naturalWidth"
        :natural-height="naturalHeight"
        :sticker-style="stickerStyle"
        :border-color="borderColor"
        @cropped="onCropped"
        @reset="resultUrl = ''"
      />
      <MatteBrushCanvas
        v-else
        ref="matteRef"
        :image-src="img"
        :sticker-style="stickerStyle"
        :border-color="borderColor"
        @cropped="onCropped"
        @reset="resultUrl = ''"
      />
    </div>

    <div class="lasso-actions" :class="{ 'is-pending': !resultUrl }">
      <Button v-if="cropMode === 'matte' && !resultUrl" class="mobile-generate" type="primary" :disabled="!matteRef?.ready || matteRef?.segmenting" @click="matteRef?.generate()">
        {{ $t('stickerLab.finishRefining') }}
      </Button>
      <Button type="primary" :disabled="!resultUrl" @click="handleReplace">
        {{ $t('lassoCrop.replaceLayer') }}
      </Button>
      <Button :disabled="!resultUrl" @click="handleDownload">
        {{ $t('lassoCrop.download') }}
      </Button>
      <Button :disabled="!resultUrl" @click="showElementForm = true">
        {{ $t('lassoCrop.saveAsElement') }}
      </Button>
      <Button :disabled="!resultUrl" @click="showCharacterForm = true">
        {{ $t('lassoCrop.saveToMyCharacter') }}
      </Button>
      <Button @click="onCancel">{{ $t('common.cancel') }}</Button>
    </div>

    <el-dialog
      :z-index="12000"
      v-model="showElementForm"
      :title="$t('lassoCrop.saveAsElement')"
      width="440px"
      class="image-tool-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item :label="$t('lassoCrop.elementName')" required>
          <el-input v-model="elementForm.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.category')" required>
          <el-select popper-class="story-controls" v-model="elementForm.category" style="width: 100%">
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
      :z-index="12000"
      v-model="showCharacterForm"
      :title="$t('lassoCrop.saveToMyCharacter')"
      width="440px"
      class="image-tool-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item :label="$t('lassoCrop.characterName')" required>
          <el-input v-model="characterForm.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('lassoCrop.category')" required>
          <el-select popper-class="story-controls" v-model="characterForm.category" style="width: 100%">
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
  </Modal>
</template>

<script setup>
import { ref, getCurrentInstance, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Modal, Button, Message } from 'view-ui-plus';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import LassoCropCanvas from '@/components/editorPro/editor-components/LassoCropCanvas.vue';
import MatteBrushCanvas from '@/components/sticker/MatteBrushCanvas.vue';
import { downloadDataUrl } from '@/utils/lassoCrop';
import {
  uploadPictureElement,
  saveCroppedCharacter,
  ELEMENT_CATEGORIES,
  CHARACTER_CATEGORIES,
} from '@/utils/saveCroppedAsset';
import { STICKER_BORDER_COLORS } from '@/utils/stickerLab/stickerStyles';

const { t } = useI18n();
const router = useRouter();
const { proxy } = getCurrentInstance() || {};

const visible = ref(false);
const img = ref('');
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const resultUrl = ref('');
const cropMode = ref('lasso');
const stickerStyle = ref('sticker');
const borderColor = ref('#ffffff');
const borderColors = STICKER_BORDER_COLORS;
const lassoRef = ref(null);
const matteRef = ref(null);
const showElementForm = ref(false);
const showCharacterForm = ref(false);
const saving = ref(false);
const elementCategories = ELEMENT_CATEGORIES;
const characterCategories = CHARACTER_CATEGORIES;

const elementForm = ref({
  name: '',
  category: '',
  desc: '',
  is_public: 1,
});

const characterForm = ref({
  name: '',
  category: '',
  desc: '',
  is_public: 1,
});

let _onReplace = null;

function resetEditorState() {
  cropMode.value = 'lasso';
  stickerStyle.value = 'sticker';
  borderColor.value = '#ffffff';
  resultUrl.value = '';
  showElementForm.value = false;
  showCharacterForm.value = false;
  elementForm.value = { name: '', category: '', desc: '', is_public: 1 };
  characterForm.value = { name: '', category: '', desc: '', is_public: 1 };
}

function onCropped({ dataUrl }) {
  resultUrl.value = dataUrl;
}

function onCropModeChange() {
  resultUrl.value = '';
}

function onVisibleChange(open) {
  if (!open) {
    resetEditorState();
    return;
  }
  nextTick(() => {
    requestAnimationFrame(() => {
      lassoRef.value?.resize?.();
      requestAnimationFrame(() => lassoRef.value?.resize?.());
    });
  });
}

function onCancel() {
  visible.value = false;
  resetEditorState();
}

function handleReplace() {
  if (!resultUrl.value || !_onReplace) return;
  _onReplace(resultUrl.value);
  visible.value = false;
  resetEditorState();
}

function handleDownload() {
  if (!resultUrl.value) return;
  downloadDataUrl(resultUrl.value, `sticker-${Date.now()}.png`);
  Message.success(t('lassoCrop.downloaded'));
}

async function handleSaveElement() {
  if (!resultUrl.value) return;
  if (!elementForm.value.name || !elementForm.value.category) {
    ElMessage.warning(t('lassoCrop.fillNameAndCategory'));
    return;
  }
  if (!proxy?.$http) {
    ElMessage.error(t('common.error'));
    return;
  }
  saving.value = true;
  try {
    await uploadPictureElement(proxy.$http, resultUrl.value, {
      title: elementForm.value.name,
      type: elementForm.value.category,
      desc: elementForm.value.desc,
      is_public: elementForm.value.is_public,
    });
    ElMessage.success(t('lassoCrop.elementSaved'));
    showElementForm.value = false;
  } catch (e) {
    ElMessage.error(e.message || t('lassoCrop.saveFailed'));
  } finally {
    saving.value = false;
  }
}

async function handleSaveCharacter() {
  if (!resultUrl.value) return;
  if (!characterForm.value.name || !characterForm.value.category) {
    ElMessage.warning(t('lassoCrop.fillNameAndCategory'));
    return;
  }
  if (!proxy?.$http) {
    ElMessage.error(t('common.error'));
    return;
  }
  saving.value = true;
  try {
    await saveCroppedCharacter(proxy.$http, resultUrl.value, {
      character_name: characterForm.value.name,
      character_type: characterForm.value.category,
      description: characterForm.value.desc,
      is_public: characterForm.value.is_public,
    });
    ElMessage.success(t('lassoCrop.characterSaved'));
    showCharacterForm.value = false;
    visible.value = false;
    resetEditorState();
    router.push('/creation-studio/character');
  } catch (e) {
    ElMessage.error(e.message || t('lassoCrop.saveFailed'));
  } finally {
    saving.value = false;
  }
}

defineExpose({
  open(data, onReplace) {
    img.value = data.img;
    naturalWidth.value = data.naturalWidth || 0;
    naturalHeight.value = data.naturalHeight || 0;
    _onReplace = onReplace;
    resetEditorState();
    visible.value = true;
  },
});
</script>

<style scoped>
.workflow-guide { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 12px 16px; margin-bottom: 16px; border: 1px solid var(--ks-primary-light-5); border-radius: 8px; background: var(--ks-primary-soft); color: var(--ks-primary-hover); font-size: 14px; line-height: 1.6; }
.workflow-guide strong { color: var(--ks-primary-hover); }
.lasso-dialog-body {
  min-height: 0;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ks-divider);
}

.toolbar-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ks-muted);
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
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.color-chip.active {
  border-color: var(--ks-primary);
  outline: 2px solid var(--ks-primary-light-5);
  outline-offset: 2px;
}

.mobile-generate { display: none; }

.lasso-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin-top: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--ks-divider);
  background: var(--ks-paper);
}

@media (max-width: 768px) {
  .editor-toolbar {
    gap: 16px;
  }
  .lasso-actions { justify-content: flex-start; }
  .lasso-actions.is-pending > .ivu-btn:disabled:not(.mobile-generate) { display: none; }
  .lasso-actions .mobile-generate { display: inline-block; flex: 2 1 180px; }
  .lasso-actions.is-pending > .ivu-btn:last-child { flex: 1 1 80px; }
  .lasso-actions > .ivu-btn { flex: 1 1 140px; }
}
</style>
