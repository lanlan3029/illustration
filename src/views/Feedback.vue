<template>
  <div class="feedback-page">
    <div class="feedback-card">
      <header class="feedback-head">
        <h1>{{ $t('feedback.title') }}</h1>
        <p>{{ $t('feedback.subtitle') }}</p>
      </header>

      <el-input
        v-model="content"
        type="textarea"
        :rows="10"
        :maxlength="maxLen"
        show-word-limit
        :placeholder="$t('feedback.placeholder')"
        class="feedback-input"
        :disabled="submitting"
      />

      <p class="feedback-hint">{{ $t('feedback.hint') }}</p>

      <div class="feedback-actions">
        <el-button
          type="primary"
          size="large"
          class="feedback-submit"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ $t('feedback.submit') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import { mapState } from 'vuex';
import { submitUserFeedback } from '@/utils/feedbackApi';

const MIN_LEN = 5;
const MAX_LEN = 2000;

export default {
  name: 'FeedbackPage',
  data() {
    return {
      content: '',
      submitting: false,
      maxLen: MAX_LEN,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
    };
  },
  computed: {
    ...mapState(['isLogin']),
    canSubmit() {
      const len = (this.content || '').trim().length;
      return len >= MIN_LEN && len <= MAX_LEN && !this.submitting;
    },
  },
  methods: {
    ensureLogin() {
      if (this.isLogin && localStorage.getItem('token')) return true;
      ElMessage.warning(this.$t('feedback.loginRequired'));
      this.$store.commit('showMask');
      return false;
    },
    async submit() {
      if (!this.ensureLogin()) return;
      const text = (this.content || '').trim();
      if (text.length < MIN_LEN) {
        ElMessage.warning(this.$t('feedback.tooShort', { min: MIN_LEN }));
        return;
      }
      this.submitting = true;
      try {
        await submitUserFeedback(this.$http, {
          content: text,
          locale: this.$i18n?.locale === 'en' ? 'en' : 'zh',
          apiBaseUrl: this.apiBaseUrl,
        });
        this.content = '';
        ElMessage.success(this.$t('feedback.success'));
      } catch (e) {
        ElMessage.error(e?.message || this.$t('feedback.failed'));
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.feedback-page {
  min-height: calc(100vh - 72px - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 64px;
  background: linear-gradient(180deg, #f7f8fb 0%, #fff 40%);
  box-sizing: border-box;
}

.feedback-card {
  width: min(640px, 100%);
  padding: 36px 32px 28px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #ececf0;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.06);
}

.feedback-head {
  text-align: center;
  margin-bottom: 24px;
}

.feedback-head h1 {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 700;
  color: #1f1f1f;
}

.feedback-head p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.feedback-input :deep(.el-textarea__inner) {
  min-height: 220px;
  padding: 16px 18px;
  font-size: 15px;
  line-height: 1.65;
  border-radius: 14px;
  border-color: #e4e7ed;
  background: #fafbfc;
  resize: none;
}

.feedback-input :deep(.el-textarea__inner:focus) {
  border-color: #8167a9;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(129, 103, 169, 0.12);
}

.feedback-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  text-align: center;
}

.feedback-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.feedback-submit {
  min-width: 160px;
  border-radius: 999px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .feedback-page {
    align-items: flex-start;
    padding-top: 32px;
  }

  .feedback-card {
    padding: 28px 20px 24px;
    border-radius: 16px;
  }

  .feedback-head h1 {
    font-size: 20px;
  }
}
</style>
