

<template>
  <div class="material-wrap">
    <div class="menu">
      <div
        class="menu-item"
        v-for="item in icons"
        :key="item.id"
        :class="{ active: item.id === selectIndex }"
        @click="select(item.id, item.type)"
      >
        <Tooltip :content="getTypeLabel(item.type)" placement="right">
          <i :class="item.icon"></i>
        </Tooltip>
      </div>
    </div>

    <div class="content">
      <div class="search">
        <Input
          v-model="searchInput"
          clearable
          placeholder="搜索素材"
          @on-change="(e) => loadSearch(e?.target?.value ?? searchInput)"
        />
      </div>

      <Scroll
        key="material-scroll"
        :on-reach-bottom="loadMore"
        :height="scrollHeight"
        :distance-to-edge="[-1, -1]"
      >
        <div class="list">
          <div
            class="card"
            v-for="(item, index) in showArr"
            :key="`${isSearching ? 'search' : selectType}-${item._id || item.id || item.content || index}-${index}`"
          >
            <img
              class="img"
              :src="getImageSrc(item)"
              loading="lazy"
              decoding="async"
              @click="handlePick(item)"
              :draggable="true"
              @dragend="(e) => handleDragEnd(item, e)"
            />
          </div>
        </div>

        <div v-if="loading && showArr.length > 0" class="load-more-tip">加载中...</div>
        <div v-else-if="!hasMore && showArr.length > 0" class="load-more-tip">没有更多了</div>
      </Scroll>
    </div>
  </div>
</template>

<script setup name="ImportSvg">
import useSelect from '@/components/editorPro/hooks/select';
import useCalculate from '@/components/editorPro/hooks/useCalculate';
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { canvasEditor } = useSelect();

const { isOutsideCanvas } = useCalculate();
const { t } = useI18n();

const icons = [
  { type: 'charcter', icon: 'iconfont icon-ren1', id: 0 },
  { type: 'scene', icon: 'iconfont icon-tupian', id: 1 },
  { type: 'people', icon: 'iconfont icon-renti', id: 2 },
  { type: 'animal', icon: 'iconfont icon--panda', id: 3 },
  { type: 'plant', icon: 'iconfont icon-shu3', id: 4 },
  { type: 'food', icon: 'iconfont icon-shiwu-2', id: 5 },
  { type: 'toy', icon: 'iconfont icon-jimu2', id: 6 },
  { type: 'vehicle', icon: 'iconfont icon-qichepiao', id: 7 },
  { type: 'decoration', icon: 'iconfont icon-zhuangshipin', id: 8 },
  { type: 'furniture', icon: 'iconfont icon-shafa1', id: 9 },
  { type: 'others', icon: 'iconfont icon-other', id: 10 },
];

// 默认选择：装饰 decoration
const selectType = ref('decoration');
const selectIndex = ref(8);

const pictureArr = ref([]);
const searchArr = ref([]);
const searchInput = ref('');
const page = ref(1);
const searchPage = ref(1);
const hasMore = ref(true);
const loading = ref(false);
let searchDebounceTimer = null;

const isSearching = computed(() => String(searchInput.value || '').trim() !== '');
const showArr = computed(() => (isSearching.value ? searchArr.value : pictureArr.value));

const scrollHeight = computed(() => 'calc(100vh - 140px)');

const getTypeLabel = (type) => t(`leftMenu.${type}`);

// 与 LeftMenu.vue 保持一致：content 不是完整 url 时拼接 static 域名
const getImageSrc = (item) => {
  if (!item) return '';
  let content = item.content || item.image_url || item.character_image_url || '';
  if (Array.isArray(content)) content = content[0];
  if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
    return content;
  }
  return `https://static.kidstory.cc/${content || ''}`;
};

async function fetchPage(p) {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    // “我的角色”
    if (selectType.value === 'charcter') {
      const userId = localStorage.getItem('id');
      if (!userId) {
        pictureArr.value = [];
        hasMore.value = false;
        return;
      }
      const apiUrl = process.env.VUE_APP_API_BASE_URL
        ? `${process.env.VUE_APP_API_BASE_URL}/character`
        : '/character';
      const response = await axios.get(apiUrl, {
        params: { user_id: userId },
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      const characterList = response?.data?.data || response?.data?.message || response?.data?.list || [];
      const formatted = (characterList || []).map((char) => {
        const imageUrl = char.image_url || char.character_image_url || '';
        return { _id: char.id || char._id, content: imageUrl, ...char };
      });
      pictureArr.value = p === 1 ? formatted : pictureArr.value.concat(formatted);
      hasMore.value = false;
      return;
    }

    const res = await axios.get(
      `/picture/?sort_param=heat&sort_num=desc&type=${selectType.value}&page=${p}`
    );
    const data = res.data || {};
    const list = data.message || data.data || data.list || data.items || [];
    const items = Array.isArray(list) ? list : [];
    pictureArr.value = p === 1 ? items : pictureArr.value.concat(items);
    hasMore.value = items.length > 0;
  } finally {
    loading.value = false;
  }
}

async function fetchSearchPage(p) {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const keyword = encodeURIComponent(String(searchInput.value || '').trim());
    const res = await axios.get(`/picture/?sort_param=heat&sort_num=desc&keyword=${keyword}&page=${p}`);
    const data = res.data || {};
    const list = data.message || data.data || data.list || data.items || [];
    const items = Array.isArray(list) ? list : [];
    searchArr.value = p === 1 ? items : searchArr.value.concat(items);
    hasMore.value = items.length > 0;
  } finally {
    loading.value = false;
  }
}

const select = async (index, type) => {
  selectIndex.value = index;
  selectType.value = type;
  page.value = 1;
  pictureArr.value = [];
  hasMore.value = true;
  // 切换分类时如果正在搜索，清空搜索回到分类列表
  searchInput.value = '';
  searchArr.value = [];
  await fetchPage(1);
  page.value = 2;
};

const loadMore = async () => {
  if (isSearching.value) {
    await fetchSearchPage(searchPage.value);
    if (hasMore.value) searchPage.value += 1;
    return;
  }
  await fetchPage(page.value);
  if (hasMore.value) page.value += 1;
};

function loadImageEl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const handlePick = async (item) => {
  const url = getImageSrc(item);
  if (!url) return;
  const image = await loadImageEl(url);
  const imgItem = await canvasEditor.createImgByElement(image);
  canvasEditor.addBaseType(imgItem, { scale: true });
};

const handleDragEnd = async (item, e) => {
  if (isOutsideCanvas(e.clientX, e.clientY)) return;
  const url = getImageSrc(item);
  if (!url) return;
  const image = await loadImageEl(url);
  const imgItem = await canvasEditor.createImgByElement(image);
  canvasEditor.addBaseType(imgItem, { scale: true, event: e });
};

const loadSearch = (value) => {
  const v = String(value ?? '').trim();
  // debounce，避免输入时疯狂请求
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    searchInput.value = v;
    searchArr.value = [];
    hasMore.value = true;
    searchPage.value = 1;
    if (!v) {
      // 回到分类列表
      hasMore.value = true;
      page.value = 1;
      pictureArr.value = [];
      await fetchPage(1);
      page.value = 2;
      return;
    }
    await fetchSearchPage(1);
    searchPage.value = 2;
  }, 250);
};

onMounted(() => {
  // 初次加载默认 decoration
  fetchPage(1).then(() => {
    page.value = 2;
  });
});
</script>

<style scoped>
.material-wrap {
  display: flex;
  height: calc(100vh - 64px);
}
.menu {
  width: 56px;
  padding: 6px 0;
  border-right: 1px solid #eef2f8;
}
.menu-item {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
}
.menu-item.active {
  color: #2d8cf0;
  background: #edf9ff;
}
.content {
  flex: 1;
  padding: 8px;
  min-width: 0;
}
.search {
  margin-bottom: 8px;
}
.list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.card {
  width: calc(50% - 4px);
  background: #f6f7f9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}
.img {
  width: 100%;
  height: 90px;
  object-fit: contain;
  display: block;
}
.load-more-tip {
  padding: 10px 0;
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>
