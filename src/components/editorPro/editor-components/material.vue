

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
          :placeholder="$t('editorProLeft.searchMaterial')"
          @on-change="(e) => loadSearch(e?.target?.value ?? searchInput)"
        />
      </div>

      <div
        ref="scrollEl"
        class="material-scroll"
        :style="{ height: scrollHeight }"
        @scroll="onScroll"
      >
        <div class="list">
          <div
            class="card"
            v-for="item in showArr"
            :key="item._id || item.id || getImageSrc(item)"
          >
            <img
              class="img"
              :src="materialPreviewUrl(item)"
              :alt="item.title || getTypeLabel(selectType)"
              @error="handlePreviewError($event, item)"
              loading="lazy"
              decoding="async"
              @click="handlePick(item)"
              :draggable="true"
              @dragend="(e) => handleDragEnd(item, e)"
            />
          </div>
        </div>

        <div v-if="loginRequired" class="load-more-tip" role="status">{{ $t('editorProLeft.loginRequired') }}</div>
        <div v-else-if="loading" class="load-more-tip">{{ $t('common.loading') }}</div>
        <div v-else-if="state.error" class="load-more-tip" role="status">
          {{ $t('books.errorOccurred') }}
          <button type="button" @click="retryLoad">{{ $i18n.locale === 'en' ? 'Retry' : '重试' }}</button>
        </div>
        <div v-else-if="!hasMore && showArr.length > 0" class="load-more-tip">没有更多了</div>
      </div>
    </div>
  </div>
</template>

<script setup name="ImportSvg">
import useSelect from '@/components/editorPro/hooks/select';
import useCalculate from '@/components/editorPro/hooks/useCalculate';
import axios from 'axios';
import { computed, onMounted, onBeforeUnmount, onDeactivated, onActivated, reactive, ref, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { markIllustrationThumbnailFailed } from '@/utils/illustrationImages';
import { createMaterialPager, materialImageUrl, materialPreviewUrl } from '@/utils/editorPro/materialLibrary';
import { useI18n } from 'vue-i18n';
import { Message } from 'view-ui-plus';

const { canvasEditor } = useSelect();

const { isOutsideCanvas } = useCalculate();
const { t } = useI18n();

const icons = [
  { type: 'background', icon: 'iconfont icon-tupian', id: 0 },
  { type: 'scene', icon: 'iconfont icon-scene', id: 1 },
  { type: 'textbox', icon: 'iconfont icon-text_box', id: 2 },
  { type: 'people', icon: 'iconfont icon-renti', id: 3 },
  { type: 'animal', icon: 'iconfont icon--panda', id: 4 },
  { type: 'plant', icon: 'iconfont icon-shu3', id: 5 },
  { type: 'food', icon: 'iconfont icon-shiwu-2', id: 6 },
  { type: 'toy', icon: 'iconfont icon-jimu2', id: 7 },
  { type: 'vehicle', icon: 'iconfont icon-qichepiao', id: 8 },
  { type: 'decoration', icon: 'iconfont icon-zhuangshipin', id: 9 },
  { type: 'furniture', icon: 'iconfont icon-shafa1', id: 10 },
  { type: 'others', icon: 'iconfont icon-other', id: 11 },
];

// 默认选择：装饰 decoration
const selectType = ref('decoration');
const selectIndex = ref(9);

const searchInput = ref('');
const store = useStore();
const loginRequired = ref(!localStorage.getItem('token'));
const state = reactive({});
const pager = createMaterialPager({
  state,
  request: async (query, page, signal) => {
    loginRequired.value = !localStorage.getItem('token');
    if (loginRequired.value) throw new Error('Login required');
    const params = { sort_param: 'heat', sort_num: 'desc', page };
    if (query.keyword) params.keyword = query.keyword;
    else params.type = query.type;
    try {
      const response = await axios.get('/picture/', { params, signal });
      return response.data;
    } catch (error) {
      if (!signal.aborted) {
        loginRequired.value = !localStorage.getItem('token') || error.response?.status === 401;
      }
      throw error;
    }
  },
});
const showArr = computed(() => state.items);
const loading = computed(() => state.loading);
const hasMore = computed(() => state.hasMore);
const scrollHeight = computed(() => 'calc(100vh - 140px)');
const scrollEl = ref(null);
let searchDebounceTimer = null;
let scrollFrame = null;
let viewRevision = 0;
let initialized = false;
let active = true;
const getTypeLabel = (type) => t(`leftMenu.${type}`);
const getImageSrc = materialImageUrl;
const currentQuery = () => ({ type: selectType.value, keyword: searchInput.value.trim() });

function handlePreviewError(event, item) {
  markIllustrationThumbnailFailed(item);
  const original = getImageSrc(item);
  if (original && event.target.src !== original) event.target.src = original;
}

async function autoLoadIfNeeded(expectedRevision, limit = 5) {
  for (let i = 0; i < limit; i++) {
    await nextTick();
    if (!active || expectedRevision !== viewRevision || state.error || state.loading || !state.hasMore) return;
    const el = scrollEl.value;
    if (!el || el.clientHeight === 0 || el.scrollHeight > el.clientHeight + 5) return;
    if (!await pager.loadMore()) return;
  }
}

async function reloadList() {
  const expectedRevision = ++viewRevision;
  if (scrollEl.value) scrollEl.value.scrollTop = 0;
  loginRequired.value = !localStorage.getItem('token');
  const success = await pager.reset(currentQuery(), { defer: loginRequired.value });
  if (success) await autoLoadIfNeeded(expectedRevision);
}

const select = async (index, type) => {
  if (selectType.value === type && !searchInput.value.trim() && !state.error) return;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = null;
  selectIndex.value = index;
  selectType.value = type;
  searchInput.value = '';
  await reloadList();
};

const loadMore = async () => {
  if (loginRequired.value) return;
  const expectedRevision = viewRevision;
  if (await pager.loadMore()) await autoLoadIfNeeded(expectedRevision);
};
const retryLoad = loadMore;

const onScroll = () => {
  if (scrollFrame !== null || state.error || searchDebounceTimer !== null) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null;
    const el = scrollEl.value;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight <= 180) loadMore();
  });
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
  try {
    const image = await loadImageEl(url);
    const imgItem = await canvasEditor.createImgByElement(image);
    canvasEditor.addBaseType(imgItem, { scale: true });
  } catch {
    Message.error(t('books.errorOccurred'));
  }
};

const handleDragEnd = async (item, e) => {
  if (isOutsideCanvas(e.clientX, e.clientY)) return;
  const url = getImageSrc(item);
  if (!url) return;
  try {
    const image = await loadImageEl(url);
    const imgItem = await canvasEditor.createImgByElement(image);
    canvasEditor.addBaseType(imgItem, { scale: true, event: e });
  } catch {
    Message.error(t('books.errorOccurred'));
  }
};

const loadSearch = (value) => {
  clearTimeout(searchDebounceTimer);
  searchInput.value = String(value ?? '');
  // Invalidate immediately, before debounce, so the old response cannot flash in new results.
  viewRevision += 1;
  pager.reset(currentQuery(), { defer: true });
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null;
    reloadList();
  }, 250);
};

watch(() => store.state.isLogin, () => {
  loginRequired.value = !localStorage.getItem('token');
  if (active) reloadList();
});

onMounted(() => { initialized = true; reloadList(); });
onActivated(() => {
  active = true;
  if (initialized && !state.loading && !state.items.length) reloadList();
});
onDeactivated(() => {
  active = false;
  viewRevision += 1;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = null;
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  scrollFrame = null;
  pager.pause();
});
onBeforeUnmount(() => {
  active = false;
  clearTimeout(searchDebounceTimer);
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  pager.dispose();
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
.material-scroll {
  overflow-y: auto;
  overflow-x: hidden;
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
