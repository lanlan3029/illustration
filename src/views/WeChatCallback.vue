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
      console.log('=== WeChatCallback 组件已挂载 ===')
      console.log('当前完整URL:', window.location.href)
      console.log('window.location.pathname:', window.location.pathname)
      console.log('window.location.search:', window.location.search)
      console.log('window.location.hash:', window.location.hash)
      console.log('route.path:', route.path)
      console.log('route.query:', route.query)
      
      try {
        // 获取 URL 参数 - 优先从 window.location.search 获取（因为可能路由还没完全匹配）
        const urlParams = new URLSearchParams(window.location.search)
        let code = urlParams.get('code') || route.query.code
        let state = urlParams.get('state') || route.query.state
        
        console.log('提取的参数 - code:', code, 'state:', state)
        
        const savedState = localStorage.getItem('wechat_state')
        console.log('localStorage 中的 wechat_state:', savedState)

        // 验证 state 参数（防止 CSRF 攻击）
        if (!state || state !== savedState) {
          console.error('State 验证失败:', { state, savedState })
          ElMessage.error(t('wechatCallback.invalidState'))
          setTimeout(() => {
            router.push('/')
          }, 2000)
          return
        }
        console.log('State 验证通过')

        // 清除 state
        localStorage.removeItem('wechat_state')

        // 检查用户是否取消授权（微信可能返回 error 参数）
        if (route.query.error) {
          ElMessage.warning(t('wechatCallback.userCancel') || '用户取消了授权')
          const redirect = localStorage.getItem('wechat_redirect') || '/'
          localStorage.removeItem('wechat_redirect')
          setTimeout(() => {
            router.push(decodeURIComponent(redirect))
          }, 2000)
          return
        }

        if (!code) {
          console.error('未找到 code 参数')
          ElMessage.error(t('wechatCallback.noCode'))
          setTimeout(() => {
            router.push('/')
          }, 2000)
          return
        }

        console.log('开始调用后端接口 POST /pb/auth/wechat/callback')
        console.log('请求参数:', { code, state })
        
        // 调用后端接口，通过 code 换取 access_token 并登录
        const response = await $http.post('/pb/auth/wechat/callback', {
          code: code,
          state: state
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('后端接口响应:', response.data)

        // 支持多种响应格式：{code: 1000, ...} 或 {desc: 'success', ...}
        const isSuccess = response.data.code === 1000 || response.data.desc === 'success'

        if (isSuccess) {
          // 登录成功 - 提取 token 和 user_id
          let token = null
          let userId = null

          // 优先处理格式1: {code: 1000, data: {token, user_id}}
          if (response.data.code === 1000 && response.data.data) {
            token = response.data.data.token
            userId = response.data.data.user_id || response.data.data.userId
          } 
          // 处理格式2: {desc: 'success', message: {token, ...}, user_id: ...}
          else if (response.data.message?.token) {
            token = response.data.message.token
            userId = response.data.user_id || response.data.message?.user_id
          } 
          // 处理格式3: {desc: 'success', message: "token", user_id: ...}
          else if (typeof response.data.message === 'string') {
            token = response.data.message
            userId = response.data.user_id
          }

          if (!token) {
            console.error('未找到token，响应数据:', response.data)
            ElMessage.error('登录失败：未获取到token')
            router.push('/')
            return
          }

          // 保存 token 和 user_id
          localStorage.setItem('token', token)
          localStorage.setItem('id', userId || response.data.user_id)
          store.commit('hasLogin', true)
          
          ElMessage.success(t('wechatCallback.loginSuccess'))
          
          // 获取用户信息
          if (userId || response.data.user_id) {
            try {
              const userRes = await $http.get(`/user/${userId || response.data.user_id}`, {
                timeout: 10000,
                headers: {
                  'Authorization': 'Bearer ' + token
                }
              })
              if (userRes.data && userRes.data.message) {
                store.commit('setUserInfo', userRes.data.message)
              }
            } catch (err) {
              console.error('获取用户信息失败:', err)
              // 即使获取用户信息失败，也不影响登录流程
            }
          }
          
          // 跳转到首页或之前的页面（优先使用 localStorage 中保存的 redirect）
          const redirect = localStorage.getItem('wechat_redirect') || route.query.redirect || '/'
          localStorage.removeItem('wechat_redirect')
          router.push(decodeURIComponent(redirect))
        } else {
          const errorMsg = response.data.message || response.data.errmsg || t('wechatCallback.loginFailed')
          ElMessage.error(errorMsg)
          router.push('/')
        }
      } catch (error) {
        console.error('微信登录回调处理失败:', error)
        let errorMsg = t('wechatCallback.loginFailed')
        
        if (error.response) {
          const errorData = error.response.data
          if (errorData?.message) {
            errorMsg = errorData.message
          } else if (errorData?.errmsg) {
            errorMsg = errorData.errmsg
          } else if (error.response.status === 400) {
            errorMsg = t('wechatCallback.invalidCode') || '授权码无效'
          } else if (error.response.status === 500) {
            errorMsg = t('wechatCallback.serverError') || '服务器错误'
          }
        } else if (error.code === 'ECONNABORTED') {
          errorMsg = t('wechatCallback.timeout') || '请求超时'
        } else if (error.code === 'ERR_NETWORK') {
          errorMsg = t('wechatCallback.networkError') || '网络错误'
        }
        
        ElMessage.error(errorMsg)
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

