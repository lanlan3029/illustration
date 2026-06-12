
<template>
  <div class="my-material" v-if="isLogin">
    <Tabs v-model="type">
      <TabPane :label="$t('editorProLeft.myIllustrations')" name="ill">
        <div
          v-if="type === 'ill'"
          class="ill-wrap"
          @scroll="handleIllScroll"
        >
          <div v-if="loadingIll && illArr.length === 0" class="tip">{{ $t('common.loading') }}</div>
          <div v-else-if="illArr.length === 0" class="tip">{{ $t('editorProLeft.noIllustrations') }}</div>
          <div v-else class="ill-grid">
            <div v-for="item in illArr" :key="item._id" class="ill-item">
              <img
                class="ill-image"
                :src="`https://static.kidstory.cc/${item.content}`"
                :alt="item.title || '插画'"
                @click="handlePickIll(item)"
              />
              <div class="ill-title">{{ item.title || $t('editorProLeft.unnamedIllustration') }}</div>
            </div>
          </div>
          <div v-if="loadingIll && illArr.length > 0" class="load-more-tip">{{ $t('common.loading') }}</div>
          <div v-else-if="!hasMoreIllus && illArr.length > 0" class="load-more-tip">{{ $t('editorProLeft.noMore') }}</div>
        </div>
      </TabPane>
      <TabPane :label="$t('editorProLeft.myCharacters')" name="char">
        <myCharacters v-if="type === 'char'" />
      </TabPane>
      <TabPane :label="$t('editorProLeft.myImages')" name="img">
        <uploadMaterial v-if="type === 'img'"></uploadMaterial>
      </TabPane>
      <TabPane :label="$t('editorProLeft.myTemplates')" name="templ">
        <myTempl v-if="type === 'templ'"></myTempl>
      </TabPane>
    </Tabs>
  </div>
  <div class="tip" v-else>{{ $t('editorProLeft.loginRequired') }}</div>
</template>

<script setup name="ImportTmpl">
import uploadMaterial from './uploadMaterial';
import myTempl from './myTempl';
import myCharacters from './myCharacters.vue';
import { ref, getCurrentInstance, onMounted, watch } from 'vue';
import useSelect from '@/components/editorPro/hooks/select';
const type = ref('ill');
const isLogin = ref(!!localStorage.getItem('token'));
const illArr = ref([]);
const illPage = ref(1);
const loadingIll = ref(false);
const hasMoreIllus = ref(true);
const illScrollDisabled = ref(false);
const { proxy } = getCurrentInstance();
const { canvasEditor } = useSelect();

function loadImageEl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const handlePickIll = async (item) => {
  const content = item?.content;
  if (!content || !canvasEditor) return;
  const url = `https://static.kidstory.cc/${content}`;
  try {
    const image = await loadImageEl(url);
    const imgItem = await canvasEditor.createImgByElement(image);
    canvasEditor.addBaseType(imgItem, { scale: true });
  } catch (e) {
    // ignore load error
  }
};

const getIll = async () => {
  loadingIll.value = true;
  hasMoreIllus.value = true;
  illPage.value = 1;
  try {
    const token = localStorage.getItem('token') || '';
    const res = await proxy.$http.get('/ill/?page=1&sort_param=createdAt&sort_num=desc', {
      headers: { Authorization: 'Bearer ' + token },
    });
    const list = res?.data?.message || res?.data?.data || [];
    illArr.value = Array.isArray(list) ? list : [];
    if (!Array.isArray(list) || list.length === 0) {
      hasMoreIllus.value = false;
    }
  } catch (e) {
    illArr.value = [];
    hasMoreIllus.value = false;
  } finally {
    loadingIll.value = false;
  }
};

const loadMoreIllus = async () => {
  if (loadingIll.value || illScrollDisabled.value || !hasMoreIllus.value) return;
  const nextPage = illPage.value + 1;
  illScrollDisabled.value = true;
  loadingIll.value = true;
  try {
    const token = localStorage.getItem('token') || '';
    const res = await proxy.$http.get(
      `/ill/?page=${nextPage}&sort_param=createdAt&sort_num=desc`,
      { headers: { Authorization: 'Bearer ' + token } }
    );
    const list = res?.data?.message || res?.data?.data || [];
    const incoming = Array.isArray(list) ? list : [];
    if (incoming.length === 0) {
      hasMoreIllus.value = false;
      return;
    }
    const existing = new Set(illArr.value.map((i) => i?._id).filter(Boolean));
    const merged = incoming.filter((i) => !existing.has(i?._id));
    illArr.value.push(...merged);
    illPage.value = nextPage;
  } catch (e) {
    // keep current list
  } finally {
    loadingIll.value = false;
    illScrollDisabled.value = false;
  }
};

const handleIllScroll = (e) => {
  const el = e.target;
  if (!el) return;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
  if (nearBottom) loadMoreIllus();
};

onMounted(() => {
  if (isLogin.value && type.value === 'ill' && illArr.value.length === 0 && !loadingIll.value) {
    getIll();
  }
});

watch(
  type,
  (val) => {
    if (val === 'ill' && illArr.value.length === 0 && !loadingIll.value) {
      getIll();
    }
  },
  { flush: 'post' }
);
</script>

<style scoped  >
.tip {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.ill-wrap {
  height: calc(100vh - 210px);
  overflow-y: auto;
  padding: 8px 2px 12px;
}

.ill-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.ill-item {
  border: 1px solid #efefef;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.ill-image {
  display: block;
  width: 100%;
  height: 120px;
  object-fit: cover;
  background: #f5f5f5;
  cursor: pointer;
}

.ill-title {
  font-size: 12px;
  color: #333;
  padding: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.load-more-tip {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 8px 0 4px;
}
</style>
