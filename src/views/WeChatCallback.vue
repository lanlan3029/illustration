<template>
  <div class="wechat-callback">
    <div class="loading-container">
      <el-icon class="is-loading" :size="40">
        <Loading />
      </el-icon>
      <p>{{ $t('wechatCallback.processing') }}</p>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'WeChatCallback',
  components: {
    Loading
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const { t } = useI18n()
    
    const $http = axios.create({
      baseURL: 'https://api.kidstory.cc/',
      timeout: 30000
    })

    onMounted(async () => {
      try {
        // 获取 URL 参数
        const code = route.query.code
        const state = route.query.state
        const savedState = localStorage.getItem('wechat_state')

        // 验证 state 参数（防止 CSRF 攻击）
        if (!state || state !== savedState) {
          ElMessage.error(t('wechatCallback.invalidState'))
          router.push('/')
          return
        }

        // 清除 state
        localStorage.removeItem('wechat_state')

        if (!code) {
          ElMessage.error(t('wechatCallback.noCode'))
          router.push('/')
          return
        }

        // 调用后端接口，通过 code 换取 access_token 并登录
        const response = await $http.post('/auth/wechat/callback', {
          code: code,
          state: state
        })

        if (response.data.desc === 'success') {
          // 登录成功
          localStorage.setItem('token', response.data.message.token || response.data.message)
          localStorage.setItem('id', response.data.user_id)
          store.commit('hasLogin', true)
          
          ElMessage.success(t('wechatCallback.loginSuccess'))
          
          // 获取用户信息
          if (response.data.user_id) {
            try {
              const userRes = await $http.get(`/user/${response.data.user_id}`)
              if (userRes.data.message) {
                store.commit('setUserInfo', userRes.data.message)
              }
            } catch (err) {
              console.error('获取用户信息失败:', err)
            }
          }
          
          // 跳转到首页或之前的页面
          const redirect = route.query.redirect || '/'
          router.push(redirect)
        } else {
          ElMessage.error(response.data.message || t('wechatCallback.loginFailed'))
          router.push('/')
        }
      } catch (error) {
        console.error('微信登录回调处理失败:', error)
        ElMessage.error(error.response?.data?.message || t('wechatCallback.loginFailed'))
        router.push('/')
      }
    })

    return {}
  }
}
</script>

<style scoped>
.wechat-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.loading-container {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading-container p {
  margin-top: 20px;
  color: #606266;
  font-size: 16px;
}

.is-loading {
  color: #07c160;
}
</style>

