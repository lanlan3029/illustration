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
        // 根据微信官方文档：用户允许授权后，将会重定向到redirect_uri的网址上，并且带上code和state参数
        // 参考：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
        const code = route.query.code
        const state = route.query.state
        const savedState = localStorage.getItem('wechat_state')

        // 验证 state 参数（防止 CSRF 攻击）
        // 官方文档说明：state参数用于保持请求和回调的状态，授权请求后原样带回给第三方
        // 该参数可用于防止csrf攻击（跨站请求伪造攻击）
        if (!state || state !== savedState) {
          ElMessage.error(t('wechatCallback.invalidState'))
          setTimeout(() => {
            router.push('/')
          }, 2000)
          return
        }

        // 清除 state（验证后立即清除，防止重复使用）
        localStorage.removeItem('wechat_state')

        // 根据官方文档：若用户禁止授权，则不会发生重定向
        // 如果没有code参数，可能是用户取消了授权
        if (!code) {
          // 检查是否是用户取消授权
          if (route.query.error) {
            ElMessage.warning(t('wechatCallback.userCancel'))
          } else {
            ElMessage.error(t('wechatCallback.noCode'))
          }
          setTimeout(() => {
            router.push('/')
          }, 2000)
          return
        }

        // 调用后端接口，通过 code 换取 access_token 并登录
        // 根据官方文档：
        // 1. code的超时时间为10分钟
        // 2. 一个code只能成功换取一次access_token即失效
        // 3. 通过code参数加上AppID和AppSecret，通过API换取access_token
        // 注意：AppSecret必须存储在服务器端，不能暴露给客户端
        console.log('开始调用后端接口，code:', code, 'state:', state)
        
        const response = await $http.post('/pb/auth/wechat/callback', {
          code: code,
          state: state
        }, {
          timeout: 30000, // 30秒超时
          headers: {
            'Content-Type': 'application/json'
          }
        })

        console.log('后端接口响应:', response.data)

        // 支持两种响应格式：
        // 格式1: {code: 1000, desc: "success", message: {token: "..."}, user_id: "..."}
        // 格式2: {desc: "success", message: {token: "..."} 或 message: "token", user_id: "..."}
        const isSuccess = response.data.code === 1000 || response.data.desc === 'success'
        
        if (isSuccess) {
          // 登录成功
          let token = null
          if (response.data.message?.token) {
            token = response.data.message.token
          } else if (typeof response.data.message === 'string') {
            token = response.data.message
          }
          
          if (token) {
            localStorage.setItem('token', token)
            console.log('Token已保存到localStorage')
          } else {
            console.warn('未找到token，响应数据:', response.data)
          }
          
          const userId = response.data.user_id || response.data.message?.user_id
          if (userId) {
            localStorage.setItem('id', userId)
            store.commit('hasLogin', true)
            
            // 获取用户信息
            try {
              const userRes = await $http.get(`/user/${userId}`, {
                timeout: 10000
              })
              if (userRes.data.message) {
                store.commit('setUserInfo', userRes.data.message)
              }
            } catch (err) {
              console.error('获取用户信息失败:', err)
              // 即使获取用户信息失败，也不影响登录流程
            }
          }
          
          ElMessage.success(t('wechatCallback.loginSuccess'))
          
          // 跳转到首页或之前的页面
          const redirect = localStorage.getItem('wechat_redirect') || route.query.redirect || '/'
          localStorage.removeItem('wechat_redirect')
          
          setTimeout(() => {
            router.push(decodeURIComponent(redirect))
          }, 500)
        } else {
          const errorMsg = response.data.message || response.data.errmsg || t('wechatCallback.loginFailed')
          console.error('登录失败:', errorMsg, response.data)
          ElMessage.error(errorMsg)
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } catch (error) {
        console.error('微信登录回调处理失败:', error)
        
        let errorMsg = t('wechatCallback.loginFailed')
        
        if (error.response) {
          // 服务器返回了错误响应
          const errorData = error.response.data
          if (errorData?.message) {
            errorMsg = errorData.message
          } else if (errorData?.errmsg) {
            errorMsg = errorData.errmsg
          } else if (error.response.status === 400) {
            errorMsg = t('wechatCallback.invalidCode')
          } else if (error.response.status === 500) {
            errorMsg = t('wechatCallback.serverError')
          }
        } else if (error.code === 'ECONNABORTED') {
          errorMsg = t('wechatCallback.timeout')
        } else if (error.code === 'ERR_NETWORK') {
          errorMsg = t('wechatCallback.networkError')
        }
        
        ElMessage.error(errorMsg)
        setTimeout(() => {
          router.push('/')
        }, 2000)
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

