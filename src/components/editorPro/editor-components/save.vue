

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
          <DropdownItem name="saveImg" divided>{{ $t('save.save_as_picture') }}</DropdownItem>
        </DropdownMenu>
      </template>
    </Dropdown>
  </div>
</template>

<script setup name="save-bar">
import useSelect from '@/components/editorPro/hooks/select';
import { debounce } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import { Message } from 'view-ui-plus';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const { t } = useI18n();

const { canvasEditor } = useSelect();
const router = useRouter();
const store = useStore();
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
};

const saveWith = debounce(function (type) {
  cbMap[type] && typeof cbMap[type] === 'function' && cbMap[type]();
}, 300);
</script>

<style scoped  >
.save-box {
  display: inline-block;
  padding-right: 10px;
}
</style>
