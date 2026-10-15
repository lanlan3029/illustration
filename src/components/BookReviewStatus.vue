<template>
  <div class="book-review-status">
    <div class="review-tags">
      <span class="status-badge" :class="statusType">{{ statusLabel }}</span>
      <span v-if="book.is_public === 0" class="status-badge">{{ en ? 'Private' : '仅自己可见' }}</span>
    </div>
    <router-link v-if="awarded > 0" class="reward-link" :to="historyLink">
      {{ en ? `Earned ${awarded} points` : `已获得 ${awarded} 积分` }} <span>→</span>
    </router-link>
    <p v-else-if="status === 0 && ['pending', 'failed'].includes(book.approval_reward_status)" class="review-note">
      {{ en ? 'Reward is being processed' : '奖励处理中，到账后可在积分明细查看' }}
    </p>
    <p v-if="status === -1 && book.reject_reason" class="reject-reason">{{ en ? 'Reason: ' : '驳回原因：' }}{{ book.reject_reason }}</p>
  </div>
</template>
<script>
export default {
  props: { book: { type: Object, required: true } },
  computed: {
    en() { return String(this.$i18n.locale).startsWith('en') },
    status() { return this.book.status == null ? 1 : Number(this.book.status) },
    awarded() { return Math.max(0, Number(this.book.approval_points_awarded) || 0) },
    statusType() { return ({ 0: 'success', 1: 'warning', '-1': 'danger' })[this.status] || 'info' },
    statusLabel() { return this.en ? ({ 0: 'Approved', 1: 'Pending review', '-1': 'Rejected' })[this.status] || 'Pending review' : ({ 0: '已通过', 1: '待审核', '-1': '已驳回' })[this.status] || '待审核' },
    historyLink() { return { path: '/member/points-history', query: { bookId: this.book._id } } },
  },
}
</script>
<style scoped>
.status-badge { display: inline-flex; padding: 2px 8px; border-radius: 5px; font-size: 12px; line-height: 1.6; white-space: nowrap; color: #656b76; background: #f0f1f4; }
.status-badge.success { color: #3b7d42; background: #edf7ee; }.status-badge.warning { color: #976414; background: #fff5df; }.status-badge.danger { color: #b94a48; background: #fff0ef; }

.book-review-status { min-width: 0; }
.review-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.reward-link { display: inline-block; color: #956010; font-size: 13px; font-weight: 600; margin-top: 8px; text-decoration: none; }
.reward-link:hover { text-decoration: underline; }
.review-note, .reject-reason { margin: 8px 0 0; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.review-note { color: #888; }.reject-reason { color: #b94a48; }
</style>
