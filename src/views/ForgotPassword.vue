<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <h2 class="title">{{ $t('forgotPassword.title') }}</h2>
      
      <!-- 步骤1：输入邮箱 -->
      <div v-if="step === 1" class="step-content">
        <div class="form-group">
          <label>{{ $t('forgotPassword.emailLabel') }}</label>
          <input
            v-model="email"
            type="email"
            :placeholder="$t('forgotPassword.emailPlaceholder')"
            :disabled="loading"
            class="input"
          />
        </div>
        <el-button
          @click="sendCode"
          :disabled="loading || !isEmailValid"
          :loading="loading"
          type="primary"
          class="btn btn-primary"
        >
          {{ $t('forgotPassword.sendCode') }}
        </el-button>
      </div>

      <!-- 步骤2：输入验证码 -->
      <div v-if="step === 2" class="step-content">
        <div class="info-box">
          <p>{{ $t('forgotPassword.codeSentTo') }} <strong>{{ email }}</strong></p>
          <p class="hint">{{ $t('forgotPassword.codeExpires') }}：{{ countdown }}{{ $t('forgotPassword.seconds') }}</p>
        </div>
        
        <div class="form-group">
          <label>{{ $t('forgotPassword.codeLabel') }}</label>
          <div class="code-input-wrapper">
            <input
              v-model="code"
              type="text"
              :placeholder="$t('forgotPassword.codePlaceholder')"
              maxlength="6"
              :disabled="loading"
              class="input code-input"
              @input="onCodeInput"
            />
            <el-button
              @click="resendCode"
              :disabled="countdown > 0 || loading"
              class="btn-resend"
              size="small"
            >
              {{ countdown > 0 ? `${countdown}${$t('forgotPassword.secondsAfterResend')}` : $t('forgotPassword.resendCode') }}
            </el-button>
          </div>
        </div>
        
        <el-button
          @click="verifyCode"
          :disabled="loading || code.length !== 6"
          :loading="loading"
          type="primary"
          class="btn btn-primary"
        >
          {{ $t('forgotPassword.verify') }}
        </el-button>
      </div>

      <!-- 步骤3：设置新密码 -->
      <div v-if="step === 3" class="step-content">
        <div class="form-group">
          <label>{{ $t('forgotPassword.newPasswordLabel') }}</label>
          <div class="password-input-wrapper">
            <input
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('forgotPassword.newPasswordPlaceholder')"
              :disabled="loading"
              class="input"
            />
            <span
              @click="showPassword = !showPassword"
              class="toggle-password"
            >
              {{ showPassword ? $t('forgotPassword.hide') : $t('forgotPassword.show') }}
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <label>{{ $t('forgotPassword.confirmPasswordLabel') }}</label>
          <div class="password-input-wrapper">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              :placeholder="$t('forgotPassword.confirmPasswordPlaceholder')"
              :disabled="loading"
              class="input"
            />
            <span
              @click="showConfirmPassword = !showConfirmPassword"
              class="toggle-password"
            >
              {{ showConfirmPassword ? $t('forgotPassword.hide') : $t('forgotPassword.show') }}
            </span>
          </div>
        </div>
        
        <div v-if="passwordError" class="error-message">
          {{ passwordError }}
        </div>
        
        <el-button
          @click="resetPassword"
          :disabled="loading || !isPasswordValid"
          :loading="loading"
          type="primary"
          class="btn btn-primary"
        >
          {{ $t('forgotPassword.resetPassword') }}
        </el-button>
      </div>

      <!-- 步骤4：成功提示 -->
      <div v-if="step === 4" class="step-content success-content">
        <div class="success-icon">
          <i class="el-icon-success"></i>
        </div>
        <h3>{{ $t('forgotPassword.resetSuccess') }}</h3>
        <p>{{ $t('forgotPassword.resetSuccessDesc') }}</p>
        <el-button @click="goToLogin" type="primary" class="btn btn-primary">
          {{ $t('forgotPassword.backToLogin') }}
        </el-button>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- 返回登录链接 -->
      <div class="back-to-login">
        <span @click="goToLogin" class="back-link">
          <i class="el-icon-arrow-left"></i>
          {{ $t('forgotPassword.backToLogin') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'ForgotPassword',
  setup() {
    const router = useRouter()
    const store = useStore()
    const { t } = useI18n()
    
    const step = ref(1) // 当前步骤：1-输入邮箱，2-输入验证码，3-设置密码，4-成功
    const email = ref('')
    const code = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const resetToken = ref('')
    const loading = ref(false)
    const errorMessage = ref('')
    const countdown = ref(0) // 倒计时
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    let countdownTimer = null

    const $http = axios.create({
      baseURL: 'https://api.kidstory.cc/',
      timeout: 15000
    })

    // 验证邮箱格式
    const isEmailValid = computed(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email.value)
    })

    // 验证密码
    const isPasswordValid = computed(() => {
      return (
        newPassword.value.length >= 6 &&
        newPassword.value.length <= 20 &&
        newPassword.value === confirmPassword.value
      )
    })

    // 密码错误提示
    const passwordError = computed(() => {
      if (!newPassword.value && !confirmPassword.value) {
        return ''
      }
      if (newPassword.value.length > 0 && newPassword.value.length < 6) {
        return t('forgotPassword.passwordTooShort')
      }
      if (newPassword.value.length > 20) {
        return t('forgotPassword.passwordTooLong')
      }
      if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
        return t('forgotPassword.passwordMismatch')
      }
      return ''
    })

    // 发送验证码
    const sendCode = async () => {
      if (!isEmailValid.value) {
        errorMessage.value = t('forgotPassword.invalidEmail')
        return
      }

      loading.value = true
      errorMessage.value = ''

      try {
        const response = await $http.post('/pb/auth/email/send-code', {
          email: email.value,
          type: 'reset_password'
        })

        if (response.data.code === 0 || response.data.desc === 'success') {
          // 发送成功，进入下一步
          step.value = 2
          const expiresIn = response.data.expires_in || response.data.data?.expires_in || 300
          startCountdown(expiresIn)
          ElMessage.success(response.data.message || t('forgotPassword.codeSentSuccess'))
        } else {
          errorMessage.value = response.data.message || t('forgotPassword.sendCodeFailed')
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        errorMessage.value = error.response?.data?.message || t('forgotPassword.sendCodeFailed')
        ElMessage.error(errorMessage.value)
      } finally {
        loading.value = false
      }
    }

    // 验证码输入处理（只允许数字）
    const onCodeInput = (event) => {
      const value = event.target.value.replace(/\D/g, '')
      code.value = value
      event.target.value = value
    }

    // 验证验证码
    const verifyCode = async () => {
      if (code.value.length !== 6) {
        errorMessage.value = t('forgotPassword.invalidCode')
        return
      }

      loading.value = true
      errorMessage.value = ''

      try {
        const response = await $http.post('/pb/auth/password/verify-code', {
          email: email.value,
          code: code.value
        })

        if (response.data.code === 0 || response.data.desc === 'success') {
          // 验证成功，保存重置token，进入下一步
          resetToken.value = response.data.reset_token || response.data.data?.reset_token || response.data.message?.reset_token
          if (!resetToken.value) {
            errorMessage.value = t('forgotPassword.verifyFailed')
            return
          }
          step.value = 3
          ElMessage.success(response.data.message || t('forgotPassword.verifySuccess'))
        } else {
          errorMessage.value = response.data.message || t('forgotPassword.invalidCode')
          ElMessage.error(errorMessage.value)
        }
      } catch (error) {
        console.error('验证验证码失败:', error)
        errorMessage.value = error.response?.data?.message || t('forgotPassword.verifyFailed')
        ElMessage.error(errorMessage.value)
      } finally {
        loading.value = false
      }
    }

    // 重新发送验证码
    const resendCode = async () => {
      if (countdown.value > 0) {
        return
      }
      await sendCode()
    }

    // 重置密码
    const resetPassword = async () => {
      if (!isPasswordValid.value) {
        errorMessage.value = passwordError.value || t('forgotPassword.checkPassword')
        return
      }

      loading.value = true
      errorMessage.value = ''

      try {
        const response = await $http.post('/pb/auth/password/reset', {
          email: email.value,
          reset_token: resetToken.value,
          new_password: newPassword.value
        })

        if (response.data.code === 0 || response.data.desc === 'success') {
          // 重置成功，进入成功页面
          step.value = 4
          ElMessage.success(response.data.message || t('forgotPassword.resetSuccess'))
        } else {
          errorMessage.value = response.data.message || t('forgotPassword.resetFailed')
          ElMessage.error(errorMessage.value)
        }
      } catch (error) {
        console.error('重置密码失败:', error)
        errorMessage.value = error.response?.data?.message || t('forgotPassword.resetFailed')
        ElMessage.error(errorMessage.value)
      } finally {
        loading.value = false
      }
    }

    // 开始倒计时
    const startCountdown = (seconds) => {
      countdown.value = seconds
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
      }, 1000)
    }

    // 返回登录
    const goToLogin = () => {
      router.push('/')
      // 触发显示登录弹窗
      setTimeout(() => {
        store.commit('showMask')
      }, 100)
    }

    // 组件挂载时关闭登录弹窗
    onMounted(() => {
      store.commit('closeMask')
    })

    // 清理定时器
    onBeforeUnmount(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    })

    return {
      step,
      email,
      code,
      newPassword,
      confirmPassword,
      loading,
      errorMessage,
      countdown,
      showPassword,
      showConfirmPassword,
      isEmailValid,
      isPasswordValid,
      passwordError,
      sendCode,
      onCodeInput,
      verifyCode,
      resendCode,
      resetPassword,
      goToLogin
    }
  }
}
</script>

<style scoped>
.forgot-password-container {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
}

.forgot-password-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.step-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #409eff;
}

.input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.code-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.code-input {
  flex: 1;
  text-align: center;
  font-size: 20px;
  letter-spacing: 5px;
  font-weight: bold;
}

.password-input-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.toggle-password:hover {
  text-decoration: underline;
}

.btn {
  width: 100%;
  height: 48px;
  margin-top: 10px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(135deg, #9d8bb8 0%, #8167a9 100%);
  border: none;
}

.btn-resend {
  white-space: nowrap;
  height: 40px;
}

.info-box {
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-box p {
  margin: 5px 0;
  color: #303133;
  font-size: 14px;
}

.info-box strong {
  color: #409eff;
}

.hint {
  color: #909399;
  font-size: 13px;
}

.error-message {
  color: #f56c6c;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background: #fef0f0;
  border-radius: 6px;
  border: 1px solid #fde2e2;
}

.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
}

.success-content h3 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 24px;
}

.success-content p {
  color: #606266;
  margin-bottom: 30px;
  font-size: 14px;
}

.back-to-login {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.back-link {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .forgot-password-container {
    padding: 20px 10px;
  }

  .forgot-password-card {
    padding: 30px 20px;
  }

  .title {
    font-size: 24px;
  }
}
</style>

