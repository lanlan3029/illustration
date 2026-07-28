<template>
  <div class="save-box">
    <Dropdown style="margin-left: 10px" @on-click="saveWith">
      <Button type="primary">
        {{ $t('save.down') }}
        <Icon type="ios-arrow-down"></Icon>
      </Button>
      <template #list>
        <DropdownMenu>
          <DropdownItem name="saveMyClould">{{ $t('save.save_my_spase') }}</DropdownItem>
          <DropdownItem name="saveMyCharacter">{{ $t('save.save_to_my_character') }}</DropdownItem>
          <DropdownItem name="saveImg" divided>{{ $t('save.save_as_picture') }}</DropdownItem>
        </DropdownMenu>
      </template>
    </Dropdown>

    <el-dialog
      v-model="showCharacterForm"
      :title="$t('save.save_to_my_character')"
      width="440px"
      append-to-body
      destroy-on-close
    >
      <div v-if="previewUrl" class="character-preview">
        <img :src="previewUrl" alt="" />
      </div>
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

<script setup name="save-bar">
import { getCurrentInstance, ref } from 'vue';
import useSelect from '@/components/editorPro/hooks/select';
import { debounce } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import { Message } from 'view-ui-plus';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { saveCroppedCharacter, CHARACTER_CATEGORIES } from '@/utils/saveCroppedAsset';

const { t } = useI18n();
const { proxy } = getCurrentInstance() || {};

const { canvasEditor } = useSelect();
const router = useRouter();
const store = useStore();

const showCharacterForm = ref(false);
const saving = ref(false);
const previewUrl = ref('');
const characterCategories = CHARACTER_CATEGORIES;
const characterForm = ref({
  name: '',
  category: '',
  desc: '',
  is_public: 1,
});

const cbMap = {
  saveImg() {
    canvasEditor.saveImg();
  },
  async saveMyClould() {
    try {
      // 与 Creation.vue 上传插画一致：先导出 base64，存入 store，再跳转到上传页
      const base64 = await canvasEditor.preview();
      store.commit('uploadIllustration', base64);
      router.push('/user/upload/upload-illustration');
    } catch (error) {
      Message.error(t('save.saveFailed') || '操作失败');
    }
  },
  async saveMyCharacter() {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined') {
        ElMessage.error(t('lassoCrop.pleaseLogin') || t('books.pleaseLogin') || '请先登录');
        return;
      }
      const base64 = await canvasEditor.preview();
      if (!base64) {
        ElMessage.error(t('save.saveFailed') || '导出画布失败');
        return;
      }
      previewUrl.value = base64;
      characterForm.value = {
        name: '',
        category: '',
        desc: '',
        is_public: 1,
      };
      showCharacterForm.value = true;
    } catch (error) {
      Message.error(t('save.saveFailed') || '操作失败');
    }
  },
};

async function handleSaveCharacter() {
  if (!previewUrl.value) return;
  if (!characterForm.value.name || !characterForm.value.category) {
    ElMessage.warning(t('lassoCrop.fillNameAndCategory'));
    return;
  }
  if (!proxy?.$http) {
    ElMessage.error(t('common.error') || '请求失败');
    return;
  }
  saving.value = true;
  try {
    await saveCroppedCharacter(proxy.$http, previewUrl.value, {
      character_name: characterForm.value.name,
      character_type: characterForm.value.category,
      description: characterForm.value.desc,
      is_public: characterForm.value.is_public,
    });
    ElMessage.success(t('lassoCrop.characterSaved'));
    showCharacterForm.value = false;
    previewUrl.value = '';
    router.push('/creation-studio/character');
  } catch (error) {
    ElMessage.error(error?.message || t('save.saveFailed') || '保存失败');
  } finally {
    saving.value = false;
  }
}

const saveWith = debounce(function (type) {
  cbMap[type] && typeof cbMap[type] === 'function' && cbMap[type]();
}, 300);
</script>

<style scoped>
.save-box {
  display: inline-block;
  padding-right: 10px;
}

.character-preview {
  margin-bottom: 16px;
  text-align: center;
}

.character-preview img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}
</style>
