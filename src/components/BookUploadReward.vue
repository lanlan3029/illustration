<template>
  <div class="book-reward" :class="{ 'book-reward--compact': compact }">
    <span class="book-reward__icon" aria-hidden="true">✦</span>
    <div>
      <p class="book-reward__title">{{ english ? 'Approved books earn up to' : '审核通过，最高奖励' }} <strong>100</strong> {{ english ? 'points' : '积分' }}</p>
      <p v-if="!compact" class="book-reward__note">{{ english ? 'Share your story. Rewards are granted after approval, once per book.' : '分享好故事，赢取创作积分。审核通过后发放，每本仅奖励一次。' }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: { compact: Boolean },
  computed: {
    english() { return String(this.$i18n.locale).startsWith('en') },
  },
}
</script>

<style scoped>
.book-reward { display: flex; align-items: center; gap: 12px; padding: 18px 20px; margin-bottom: 28px; border: 1px solid #f4dca6; border-radius: 12px; background: linear-gradient(120deg, #fff8e6, #fff2dc); color: #8a530d; }
.book-reward__icon { flex-shrink: 0; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #ffe5a7; color: #a9650c; font-size: 24px; }
.book-reward__title { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.6; }
.book-reward__title strong { font-size: 24px; color: #b76508; }
.book-reward__note { margin: 4px 0 0; font-size: 13px; line-height: 1.7; color: #946c39; }
.book-reward--compact { margin: 18px 0 0; padding: 8px 14px; gap: 6px; border-radius: 24px; }
.book-reward--compact .book-reward__icon { width: auto; height: auto; background: none; font-size: 18px; }
.book-reward--compact .book-reward__title { font-size: 13px; }
.book-reward--compact .book-reward__title strong { font-size: 20px; }
@media (max-width: 480px) { .book-reward { padding: 14px 12px; gap: 8px; } .book-reward--compact { padding: 8px 12px; } }
</style>
