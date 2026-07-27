<template>
  <div class="my-ill-picker">
    <el-button type="primary" plain @click="open">
      {{ buttonText || $t('myIllustrationPicker.pickFromWorks') }}
    </el-button>

    <el-dialog
      v-model="visible"
      :title="dialogTitle || $t('myIllustrationPicker.dialogTitle')"
      width="560px"
      append-to-body
      destroy-on-close
      @open="onOpen"
    >
      <div
        class="ill-grid"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="!hasMore || loading"
        :infinite-scroll-distance="80"
      >
        <button
          v-for="item in list"
          :key="item._id"
          type="button"
          class="ill-item"
          @click="pick(item)"
        >
          <img :src="illUrl(item)" :alt="item.title || ''" loading="lazy" />
          <span v-if="item.title" class="ill-title">{{ item.title }}</span>
        </button>
        <p v-if="loading && !list.length" class="ill-tip">{{ $t('common.loading') }}</p>
        <p v-else-if="!loading && !list.length" class="ill-tip">
          {{ needLogin ? $t('myIllustrationPicker.loginRequired') : $t('myIllustrationPicker.empty') }}
        </p>
        <p v-else-if="loading" class="ill-tip">{{ $t('common.loading') }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';

function resolveIllUrl(item) {
  const c = item?.content || item?.picture || item?.image_url || item?.url || '';
  if (!c) return '';
  if (c.startsWith('http://') || c.startsWith('https://') || c.startsWith('data:')) return c;
  return `https://static.kidstory.cc/${String(c).replace(/^\/+/, '')}`;
}

export default {
  name: 'MyIllustrationPicker',
  props: {
    buttonText: { type: String, default: '' },
    dialogTitle: { type: String, default: '' },
  },
  emits: ['select'],
  data() {
    return {
      visible: false,
      list: [],
      page: 1,
      hasMore: true,
      loading: false,
      needLogin: false,
    };
  },
  methods: {
    illUrl: resolveIllUrl,
    open() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.needLogin = true;
        ElMessage.warning(this.$t('myIllustrationPicker.loginRequired'));
        return;
      }
      this.needLogin = false;
      this.visible = true;
    },
    onOpen() {
      this.resetAndFetch();
    },
    resetAndFetch() {
      this.page = 1;
      this.hasMore = true;
      this.list = [];
      this.fetchPage();
    },
    async fetchPage() {
      if (this.loading || !this.hasMore) return;
      const token = localStorage.getItem('token');
      if (!token) {
        this.needLogin = true;
        this.hasMore = false;
        return;
      }
      this.loading = true;
      try {
        const res = await this.$http.get(
          `/ill/?page=${this.page}&sort_param=createdAt&sort_num=desc`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const raw = res.data?.message || res.data?.data || [];
        const items = Array.isArray(raw) ? raw : [];
        if (!items.length) {
          this.hasMore = false;
          return;
        }
        const existing = new Set(this.list.map((i) => i._id));
        this.list.push(...items.filter((i) => i._id && !existing.has(i._id)));
        this.page += 1;
      } catch {
        this.hasMore = false;
        ElMessage.error(this.$t('myIllustrationPicker.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    loadMore() {
      this.fetchPage();
    },
    pick(item) {
      const url = resolveIllUrl(item);
      if (!url) {
        ElMessage.warning(this.$t('myIllustrationPicker.invalidItem'));
        return;
      }
      this.$emit('select', { item, url });
      this.visible = false;
    },
  },
};

export { resolveIllUrl };
</script>

<style scoped>
.my-ill-picker {
  display: inline-flex;
}

.ill-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px 2px 8px;
}

.ill-item {
  position: relative;
  border: 1px solid #e8e0f4;
  border-radius: 10px;
  padding: 0;
  overflow: hidden;
  background: #f7f5fb;
  cursor: pointer;
  aspect-ratio: 1;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.ill-item:hover {
  border-color: #8167a9;
  box-shadow: 0 4px 14px rgba(129, 103, 169, 0.18);
}

.ill-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ill-title {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 6px;
  font-size: 11px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.ill-tip {
  grid-column: 1 / -1;
  margin: 12px 0;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
