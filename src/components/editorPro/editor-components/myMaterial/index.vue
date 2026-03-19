

<template>
  <div class="my-material" v-if="isLogin">
    <Tabs v-model="type">
      <TabPane label="插画" name="ill">
        <div
          v-if="type === 'ill'"
          class="ill-wrap"
          @scroll="handleIllScroll"
        >
          <div v-if="loadingIll && illArr.length === 0" class="tip">加载中...</div>
          <div v-else-if="illArr.length === 0" class="tip">暂无插画</div>
          <div v-else class="ill-grid">
            <div v-for="item in illArr" :key="item._id" class="ill-item">
              <img
                class="ill-image"
                :src="`https://static.kidstory.cc/${item.content}`"
                :alt="item.title || '插画'"
                @click="handlePickIll(item)"
              />
              <div class="ill-title">{{ item.title || '未命名插画' }}</div>
            </div>
          </div>
          <div v-if="loadingIll && illArr.length > 0" class="load-more-tip">加载中...</div>
          <div v-else-if="!hasMoreIllus && illArr.length > 0" class="load-more-tip">没有更多了</div>
        </div>
      </TabPane>
      <TabPane label="模板" name="templ">
        <myTempl v-if="type === 'templ'"></myTempl>
      </TabPane>
      <TabPane label="图片" name="img">
        <uploadMaterial v-if="type === 'img'"></uploadMaterial>
      </TabPane>
    </Tabs>
  </div>
  <div class="tip" v-else>请先登录</div>
</template>

<script setup name="ImportTmpl">
import { getFileList } from '@/components/editorPro/api/user';
import uploadMaterial from './uploadMaterial';
import myTempl from './myTempl';
import { ref, getCurrentInstance, watch } from 'vue';
import useSelect from '@/components/editorPro/hooks/select';
const type = ref('ill');
const isLogin = ref(false);
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

const getFileListHandle = () => {
  // 获取素材列表
  getFileList()
    .then(() => {
      isLogin.value = true;
      getIll();
    })
    .catch(() => {
      isLogin.value = false;
    });
};

getFileListHandle();

watch(type, (val) => {
  if (val === 'ill' && illArr.value.length === 0 && !loadingIll.value) {
    getIll();
  }
});
</script>

<style scoped  >
.tip {
  padding: 20px;
  text-align: center;
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
