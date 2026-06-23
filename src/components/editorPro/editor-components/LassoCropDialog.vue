<template>
  <Modal
    v-model="visible"
    :title="$t('lassoCrop.title')"
    width="90%"
    :footer-hide="true"
    class-name="lasso-crop-modal"
    @on-visible-change="onVisibleChange"
    @on-cancel="onCancel"
  >
    <LassoCropCanvas
      v-if="visible && img"
      ref="canvasRef"
      :image-src="img"
      @cropped="onCropped"
      @reset="resultUrl = ''"
    />
    <div class="lasso-actions">
      <Button type="primary" :disabled="!resultUrl" @click="handleReplace">
        {{ $t('lassoCrop.replaceLayer') }}
      </Button>
      <Button :disabled="!resultUrl" @click="handleDownload">
        {{ $t('lassoCrop.download') }}
      </Button>
      <Button :disabled="!resultUrl" @click="showCharacterForm = true">
        {{ $t('lassoCrop.saveToMyCharacter') }}
      </Button>
      <Button @click="onCancel">{{ $t('common.cancel') }}</Button>
    </div>

    <el-dialog
      v-model="showCharacterForm"
      :title="$t('lassoCrop.saveToMyCharacter')"
      width="440px"
      append-to-body
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
  </Modal>
</template>

<script setup>
import { ref, getCurrentInstance, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Modal, Button, Message } from 'view-ui-plus';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import LassoCropCanvas from '@/components/editorPro/editor-components/LassoCropCanvas.vue';
import { downloadDataUrl } from '@/utils/lassoCrop';
import { saveCroppedCharacter, CHARACTER_CATEGORIES } from '@/utils/saveCroppedAsset';

const { t } = useI18n();
const router = useRouter();
const { proxy } = getCurrentInstance() || {};

const visible = ref(false);
const img = ref('');
const resultUrl = ref('');
const canvasRef = ref(null);
const showCharacterForm = ref(false);
const saving = ref(false);
const characterCategories = CHARACTER_CATEGORIES;

const characterForm = ref({
  name: '',
  category: '',
  desc: '',
  is_public: 1,
});

let _onReplace = null;

function onCropped({ dataUrl }) {
  resultUrl.value = dataUrl;
}

function onVisibleChange(open) {
  if (!open) return;
  nextTick(() => {
    requestAnimationFrame(() => {
      canvasRef.value?.resize?.();
      requestAnimationFrame(() => canvasRef.value?.resize?.());
    });
  });
}

function onCancel() {
  visible.value = false;
  resultUrl.value = '';
  showCharacterForm.value = false;
}

function handleReplace() {
  if (!resultUrl.value || !_onReplace) return;
  _onReplace(resultUrl.value);
  visible.value = false;
  resultUrl.value = '';
}

function handleDownload() {
  if (!resultUrl.value) return;
  downloadDataUrl(resultUrl.value, `sticker-${Date.now()}.png`);
  Message.success(t('lassoCrop.downloaded'));
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
    resultUrl.value = '';
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
    _onReplace = onReplace;
    resultUrl.value = '';
    characterForm.value = { name: '', category: '', desc: '', is_public: 1 };
    visible.value = true;
  },
});
</script>

<style scoped>
.lasso-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
</style>
