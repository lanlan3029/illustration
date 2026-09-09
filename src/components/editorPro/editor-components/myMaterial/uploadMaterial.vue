
<template>
  <div class="my-material">
    <Button icon="md-cloud-upload" @click="uploadImgHandule" long type="primary">
      {{ $t('myMaterial.uploadBtn') }}
    </Button>
    <div v-if="loading && fileList.length === 0" class="tip">{{ $t('common.loading') }}</div>
    <div class="img-group" v-else-if="fileList.length">
      <Tooltip
        :content="info.name"
        v-for="(info, i) in fileList"
        :key="`${info.id}-${i}`"
        placement="top"
      >
        <div class="tmpl-img-box">
          <Icon
            type="ios-trash"
            class="del-btn"
            color="red"
            @click="removeMaterialHandle(info.id)"
          />
          <Image
            lazy
            :src="info.imgUrl"
            fit="contain"
            height="100%"
            :alt="info.name"
            @click="addImgByElement"
          />
        </div>
      </Tooltip>
    </div>
    <div class="tip" v-else>{{ $t('editorProLeft.noElements') }}</div>
  </div>
</template>

<script setup name="ImportTmpl">
import { uploadPictureElement } from '@/utils/saveCroppedAsset';
import { readFileAsDataUrl } from '@/utils/lassoCrop';
import { inject, ref, onMounted, getCurrentInstance } from 'vue';
import { Message } from 'view-ui-plus';
import { useI18n } from 'vue-i18n';
import { tryFillActivePhotoSlot } from '@/utils/editorPro/photoSlotContext';

const { t } = useI18n();
const { proxy } = getCurrentInstance();

function selectFiles({ accept, multiple = false } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    if (accept) input.accept = accept;
    input.onchange = () => resolve(Array.from(input.files || []));
    input.click();
  });
}

const canvasEditor = inject('canvasEditor');

const fileList = ref([]);
const loading = ref(false);

function resolvePictureUrl(item) {
  if (!item) return '';
  let content = item.content;
  if (Array.isArray(content)) content = content[0];
  if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
    return content;
  }
  return `https://static.kidstory.cc/${content || ''}`;
}

async function fetchMyElements() {
  const userId = localStorage.getItem('id');
  const token = localStorage.getItem('token') || '';
  if (!userId || !token) {
    fileList.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await proxy.$http.get('/picture/', {
      params: {
        ownerid: userId,
        sort_param: 'createdAt',
        sort_num: 'desc',
        page: 1,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = res?.data?.message || res?.data?.data || res?.data?.list || [];
    fileList.value = (Array.isArray(list) ? list : []).map((item) => ({
      id: item._id || item.id,
      name: item.title || t('editorProLeft.unnamedElement'),
      imgUrl: resolvePictureUrl(item),
    }));
  } catch (e) {
    console.error('[uploadMaterial] load picture elements failed', e);
    fileList.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchMyElements);

const uploadImgHandule = () => {
  selectFiles({ accept: 'image/*' }).then(async (files) => {
    const [file] = files || [];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const baseName = (file.name || 'element').replace(/\.[^.]+$/, '') || 'element';
      await uploadPictureElement(proxy.$http, dataUrl, {
        title: baseName,
        type: 'others',
        desc: '',
        is_public: 1,
      });
      Message.success(t('editorProLeft.elementUploaded'));
      await fetchMyElements();
    } catch (err) {
      console.error(err);
      Message.error(err?.message || t('editorProLeft.elementUploadFailed'));
    }
  });
};

const addImgByElement = async (e) => {
  const src = e?.target?.src || e?.target?.currentSrc;
  if (src && (await tryFillActivePhotoSlot(src, canvasEditor))) {
    Message.success(t('editorProLeft.photoSlotFilled'));
    return;
  }
  const imgItem = await canvasEditor.createImgByElement(e.target);
  canvasEditor.addBaseType(imgItem, {
    scale: true,
  });
};

const removeMaterialHandle = async (id) => {
  if (!id) return;
  const token = localStorage.getItem('token') || '';
  try {
    await proxy.$http.delete(`/picture/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    Message.success(t('editorProLeft.elementDeleted'));
    await fetchMyElements();
  } catch (err) {
    console.error(err);
    Message.error(t('editorProLeft.elementDeleteFailed'));
  }
};
</script>

<style scoped  >
.img-group {
  background: #eeeeeea1;
  border-radius: 10px;
  padding: 10px;
  margin-top: 10px;
}
.tmpl-img-box {
  width: 134px;
  height: 180px;
  padding: 5px;
  cursor: pointer;
  border-radius: 10px;
  text-align: center;

  &:hover {
    background: #e3e3e3;
    .del-btn {
      opacity: 1;
      right: 5px;
    }
  }
}

.del-btn {
  z-index: 1;
  position: absolute;
  top: 5px;
  right: 1000000px;
}

.tip {
  text-align: center;
  padding: 10px;
}
</style>
