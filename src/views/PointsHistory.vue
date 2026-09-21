<template>
  <div class="points-history-page">
    <header class="ph-header">
      <div>
        <h1>{{ $t('pointsHistory.title') }}</h1>
        <p class="ph-balance">
          {{ $t('pointsHistory.currentBalance') }}
          <strong>{{ userPoints }}</strong>
          <img src="@/assets/logo/count.png" alt="" class="ph-coin" />
        </p>
      </div>
      <div class="ph-header-links">
        <router-link to="/member/generation-history" class="ph-recharge-link">
          {{ $t('generationHistory.viewHistory') }} →
        </router-link>
        <router-link to="/member/recharge" class="ph-recharge-link">
          {{ $t('pointsHistory.goRecharge') }} →
        </router-link>
      </div>
    </header>

    <div class="ph-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="ph-tab"
        :class="{ active: activeKind === tab.key }"
        @click="switchKind(tab.key)"
      >
        {{ $t(tab.label) }}
      </button>
    </div>

    <div v-loading="loading" class="ph-list-wrap">
      <ul v-if="list.length" class="ph-list">
        <li v-for="item in list" :key="item.id" class="ph-item">
          <div class="ph-item-main">
            <span class="ph-item-title">{{ item.title || fallbackTitle(item) }}</span>
            <span class="ph-item-time">{{ formatTime(item.created_at) }}</span>
          </div>
          <span
            class="ph-item-delta"
            :class="item.delta >= 0 ? 'is-earn' : 'is-consume'"
          >
            {{ item.delta >= 0 ? '+' : '' }}{{ item.delta }}
          </span>
        </li>
      </ul>
      <el-empty v-else-if="!loading" :description="$t('pointsHistory.empty')" />

      <div v-if="total > pageSize" class="ph-pagination">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          @current-change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { fetchPointsHistory } from '@/utils/pointsHistoryApi';

export default {
  name: 'PointsHistory',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      activeKind: 'all',
      tabs: [
        { key: 'all', label: 'pointsHistory.tabAll' },
        { key: 'earn', label: 'pointsHistory.tabEarn' },
        { key: 'consume', label: 'pointsHistory.tabConsume' },
      ],
    };
  },
  computed: {
    ...mapState(['userInfo']),
    userPoints() {
      return (this.userInfo && (this.userInfo.points ?? this.userInfo.credits)) || 0;
    },
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    fallbackTitle(item) {
      const map = {
        consume_image: this.$t('pointsHistory.typeConsumeImage'),
        consume_image_edit: this.$t('pointsHistory.typeConsumeEdit'),
        earn_purchase: this.$t('pointsHistory.typeEarnPurchase'),
        earn_book_approval: this.$t('pointsHistory.typeEarnBook'),
        earn_welcome: this.$t('pointsHistory.typeEarnWelcome'),
        refund: this.$t('pointsHistory.typeRefund'),
      };
      return map[item.type] || this.$t('pointsHistory.typeOther');
    },
    formatTime(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return iso;
      }
    },
    async loadHistory() {
      this.loading = true;
      try {
        const data = await fetchPointsHistory(this.$http, {
          page: this.page,
          pageSize: this.pageSize,
          kind: this.activeKind,
        });
        this.list = data.list || [];
        this.total = data.total || 0;
      } catch (e) {
        this.$message?.error?.(e?.message || this.$t('pointsHistory.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    switchKind(kind) {
      if (this.activeKind === kind) return;
      this.activeKind = kind;
      this.page = 1;
      this.loadHistory();
    },
    onPageChange(p) {
      this.page = p;
      this.loadHistory();
    },
  },
};
</script>

<style scoped>
.points-history-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px calc(32px + var(--kid-tabbar-h, 0px));
}

.ph-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.ph-header h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  color: #2c3e50;
}

.ph-balance {
  margin: 0;
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ph-balance strong {
  font-size: 20px;
  color: #6c5ce7;
}

.ph-coin {
  width: 18px;
  height: 18px;
}

.ph-header-links {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.ph-recharge-link {
  font-size: 14px;
  color: #6c5ce7;
  text-decoration: none;
}

.ph-recharge-link:hover {
  text-decoration: underline;
}

.ph-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.ph-tab {
  flex: 1;
  border: 1px solid #e4e7ed;
  background: #fff;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.ph-tab.active {
  background: #6c5ce7;
  border-color: #6c5ce7;
  color: #fff;
  font-weight: 600;
}

.ph-list-wrap {
  min-height: 200px;
}

.ph-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.ph-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f5;
}

.ph-item:last-child {
  border-bottom: none;
}

.ph-item-main {
  min-width: 0;
  flex: 1;
}

.ph-item-title {
  display: block;
  font-size: 15px;
  color: #303133;
  font-weight: 500;
  line-height: 1.4;
}

.ph-item-time {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.ph-item-delta {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ph-item-delta.is-earn {
  color: #67c23a;
}

.ph-item-delta.is-consume {
  color: #f56c6c;
}

.ph-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .points-history-page {
    padding-top: 16px;
  }

  .ph-header {
    flex-direction: column;
  }
}
</style>
