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
      console.log('WeChatCallback 组件已挂载')
      console.log('当前URL:', window.location.href)
      console.log('完整URL:', window.location.href)
      console.log('URL查询字符串:', window.location.search)
      
      try {
        // 根据微信官方文档：用户允许授权后，将会重定向到redirect_uri的网址上，并且带上code和state参数
        // 参考：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
        
        // 重要：由于使用 hash 路由模式，需要直接从 window.location.search 获取参数
        // 而不是依赖 route.query（因为路由可能无法正确匹配）
        const urlParams = new URLSearchParams(window.location.search)
        let code = urlParams.get('code')
        let state = urlParams.get('state')
        
        // 如果从 search 中没找到，尝试从 hash 中获取（hash 路由模式）
        if (!code && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
          code = code || hashParams.get('code')
          state = state || hashParams.get('state')
        }
        
        // 如果还是没找到，尝试从 route.query 获取（作为备用）
        if (!code) {
          code = route.query.code
          state = route.query.state
        }
        
        const savedState = localStorage.getItem('wechat_state')
        
        console.log('从URL获取的参数 - code:', code, 'state:', state)
        console.log('localStorage中的state:', savedState)

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
        console.log('开始调用后端接口 POST /pb/auth/wechat/callback')
        console.log('请求参数 - code:', code, 'state:', state)
        
        const requestData = {
          code: code,
          state: state
        }
        console.log('请求数据:', JSON.stringify(requestData))
        
        const response = await $http.post('/pb/auth/wechat/callback', requestData, {
          timeout: 30000, // 30秒超时
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('后端接口调用成功，响应状态:', response.status)

        console.log('后端接口响应:', response.data)

        // 支持多种响应格式：
        // 格式1: {code: 1000, data: {token: "...", user_id: "..."}}
        // 格式2: {code: 1000, desc: "success", message: {token: "..."}, user_id: "..."}
        // 格式3: {desc: "success", message: {token: "..."} 或 message: "token", user_id: "..."}
        const isSuccess = response.data.code === 1000 || response.data.desc === 'success'
        
        if (isSuccess) {
          // 登录成功 - 第一次使用微信登录的用户信息存储流程
          // 1. 提取并保存 token
          let token = null
          let userId = null
          
          // 优先处理格式1: {code: 1000, data: {token, user_id}}
          if (response.data.code === 1000 && response.data.data) {
            token = response.data.data.token
            userId = response.data.data.user_id || response.data.data.userId
          } 
          // 处理格式2和格式3
          else if (response.data.message?.token) {
            token = response.data.message.token
            userId = response.data.user_id || response.data.message?.user_id
          } else if (typeof response.data.message === 'string') {
            token = response.data.message
            userId = response.data.user_id
          }
          
          if (!token) {
            console.error('未找到token，响应数据:', response.data)
            ElMessage.error('登录失败：未获取到token')
            setTimeout(() => {
              router.push('/')
            }, 2000)
            return
          }
          
          // 保存 token 到 localStorage（持久化存储）
          localStorage.setItem('token', token)
          console.log('Token已保存到localStorage')
          
          if (!userId) {
            console.error('未找到user_id，响应数据:', response.data)
            ElMessage.error('登录失败：未获取到用户ID')
            setTimeout(() => {
              router.push('/')
            }, 2000)
            return
          }
          
          // 保存 user_id 到 localStorage（持久化存储）
          localStorage.setItem('id', userId)
          console.log('User ID已保存到localStorage:', userId)
          
          // 3. 更新 Vuex store 中的登录状态
          store.commit('hasLogin', true)
          console.log('登录状态已更新到store')
          
          // 4. 获取并保存用户详细信息（包括第一次登录的新用户）
          try {
            const userRes = await $http.get(`/user/${userId}`, {
              timeout: 10000,
              headers: {
                'Authorization': 'Bearer ' + token
              }
            })
            
            if (userRes.data && userRes.data.message) {
              // 保存用户信息到 Vuex store（用于全局状态管理）
              store.commit('setUserInfo', userRes.data.message)
              console.log('用户信息已保存到store:', userRes.data.message)
              
              // 如果是新用户，后端可能返回了默认的用户信息
              // 可以在这里处理新用户的特殊逻辑，比如显示欢迎信息等
              if (userRes.data.message.is_new_user) {
                console.log('检测到新用户，可以显示欢迎信息')
              }
            } else {
              console.warn('用户信息响应格式异常:', userRes.data)
            }
          } catch (err) {
            console.error('获取用户信息失败:', err)
            // 即使获取用户信息失败，也不影响登录流程
            // 因为 token 和 user_id 已经保存，用户已经登录成功
            // 可以在后续页面加载时重新获取用户信息
            if (err.response && err.response.status === 404) {
              console.warn('用户信息不存在，可能是新用户，后端正在创建中')
            }
          }
          
          // 5. 显示成功提示
          ElMessage.success(t('wechatCallback.loginSuccess'))
          
          // 6. 跳转到首页或之前的页面
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

