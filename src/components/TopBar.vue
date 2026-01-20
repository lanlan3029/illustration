<template>
  <div class="navigation-wrap">
    <nav class="navbar start-header" :class="{ 'scroll-on': isScrolled }">
      <div class="container-fluid">
        <div class="navbar-header">
          <!-- Logo -->
          <a class="navbar-brand" @click.prevent="$router.push('/')">
            <img :src="logoUrl" alt="Logo" />
          </a>
        </div>

        <ul class="navbar-nav">
          <!-- 菜单项 -->
          <li class="nav-item" :class="{ 'active': route.path === '/' }">
            <router-link to="/" class="nav-link" @click="closeSubmenu">{{ $t('nav.home') || '首页' }}</router-link>
          </li>
          <li class="nav-item" :class="{ 'active': route.path === '/ai-picture' }">
            <router-link to="/ai-picture" class="nav-link" @click="closeSubmenu">{{ $t('nav.aiIllustration') }}</router-link>
          </li>
          <li class="nav-item" :class="{ 'active': route.path === '/AIbooks' }">
            <router-link to="/AIbooks" class="nav-link" @click="closeSubmenu">{{ $t('nav.aiBooks') }}</router-link>
          </li>

          <li class="nav-item dropdown" :class="{ 'show': activeSubmenu === 'creation' }">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggleSubmenu('creation')">
              {{ $t('nav.creation') }}
            </a>
            <ul class="dropdown-menu">
              <li><router-link to="/create-character" class="dropdown-item" @click="closeSubmenu">{{ $t('nav.createCharacter') }}</router-link></li>
              <li><router-link to="/create-group-images" class="dropdown-item" @click="closeSubmenu">{{ $t('nav.createGroupImages') }}</router-link></li>
              <li><router-link to="/create-layout-illustration" class="dropdown-item" @click="closeSubmenu">{{ $t('nav.createLayoutIllustration') }}</router-link></li>
              <li><router-link to="/creation" class="dropdown-item" @click="closeSubmenu">{{ $t('nav.createIllustration') }}</router-link></li>
              <li><router-link to="/user/upload/compose-illustration" class="dropdown-item" @click="closeSubmenu">{{ $t('nav.composeBook') }}</router-link></li>
            </ul>
          </li>

          <li class="nav-item" :class="{ 'active': route.path === '/user/upload' }">
            <router-link to="/user/upload" class="nav-link" @click="closeSubmenu">{{ $t('common.upload') }}</router-link>
          </li>

          <li class="nav-item" :class="{ 'active': route.path === '/books' }">
            <router-link to="/books" class="nav-link" @click="closeSubmenu">{{ $t('common.books') }}</router-link>
          </li>

          <li class="nav-item" :class="{ 'active': route.path === '/utility-tools' }">
            <router-link to="/utility-tools" class="nav-link" @click="closeSubmenu">{{ $t('common.tools') }}</router-link>
          </li>

        

          <!-- 搜索框 -->
          <li class="nav-item search-item">
            <div class="search-wrapper">
              <i class="el-icon-search search-icon"></i>
              <input 
                type="text" 
                class="search" 
                v-model="searchValue" 
                name="search" 
                autocomplete="off" 
                :placeholder="$t('common.search') + ' ' + $t('common.books')" 
                @keyup.enter="searchFun(searchValue)"
                @click.stop
              >
            </div>
          </li>

          <!-- 语言切换 -->
          <li class="nav-item language-switcher-item">
            <el-radio-group 
              v-model="currentLanguage" 
              size="small" 
              fill="#8167a9"
              @change="handleLanguageChange"
              class="language-radio-group"
            >
              <el-radio-button label="zh" value="zh">中文</el-radio-button>
              <el-radio-button label="en" value="en">EN</el-radio-button>
            </el-radio-group>
          </li>

          <!-- 用户登录/头像 -->
          <li v-if="!isLogin" class="nav-item">
            <a @click.prevent="showMask" class="nav-link">{{ $t('common.login') }}</a>
          </li>

          <li v-else class="nav-item dropdown" :class="{ 'show': activeSubmenu === 'user' }">
            <a class="nav-link dropdown-toggle user-menu-trigger" href="#" @click.prevent="toggleSubmenu('user')">
              <div class="user-header-wrapper">
                <!-- 积分和Pro显示框 -->
                <div class="points-pro-box" @click.stop="showMemberDialog = true">
                  <div class="points-section">
                    <img src="@/assets/logo/count.png" alt="积分" class="points-icon-small" />
                    <span class="points-value">{{ userPoints || 0 }}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="pro-section">
                    <span class="pro-text">Pro</span>
                  </div>
                </div>
                <!-- 用户头像 -->
                <img :src="userInfo && userInfo.avatar" :alt="userInfo && userInfo.name" class="user-avatar" />
              </div>
            </a>
            <ul class="dropdown-menu">
              <!-- 显示用户名 -->
              <li class="dropdown-header" v-if="userInfo && userInfo.name">
                <span class="user-name">{{ userInfo.name }}</span>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li><a @click.prevent="toMyHomePage(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-a-collection"></i>
                <span>{{ $t('nav.myWorks') }}</span>
              </a></li>
              <li><a @click.prevent="toProfile(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-zhanghu"></i>
                <span>{{ $t('nav.accountSettings') }}</span>
              </a></li>
              <li><a @click.prevent="toMemberRecharge(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-dingyue"></i>
                <span>{{ $t('nav.subscription') }}</span>
              </a></li>
              <li><a @click.prevent="logout(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-tuichudenglu-"></i>
                <span>{{ $t('common.logout') }}</span>
              </a></li>
              <li><a @click.prevent="contactUs(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-lianxiwomen1"></i>
                <span>{{ $t('nav.connection') }}</span>
              </a></li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
    name: 'TopBar',
    setup() {
        const store = useStore()
        const router = useRouter()
        const route = useRoute()
        const { proxy } = getCurrentInstance()
        const { locale } = useI18n()
        
        const logoUrl = require('../assets/logo/logo.png')
        const userid = ref(localStorage.getItem("id"))
        const searchValue = ref('')
        const userPoints = ref(0) // 用户积分
        const showMemberDialog = ref(false) // 是否显示会员信息对话框
        const activeSubmenu = ref(null) // 当前激活的子菜单
        const isScrolled = ref(false) // 是否已滚动
        
        const $http = proxy?.$http || axios
        const $message = proxy?.$message || ElMessage
        
        // 当前语言（使用 ref 以便双向绑定）
        const currentLanguage = ref(locale.value)
        
        // 监听 locale 变化，同步到 currentLanguage
        watch(() => locale.value, (newVal) => {
            currentLanguage.value = newVal
        })
        
        // 处理语言切换
        const handleLanguageChange = (value) => {
            locale.value = value
            localStorage.setItem('lang', value)
            // 更新 HTML lang 属性
            if (typeof document !== 'undefined') {
                document.documentElement.lang = value
            }
        }
        
        // 切换语言（保留以兼容其他可能的调用）
        const toggleLanguage = () => {
            const newLocale = locale.value === 'zh' ? 'en' : 'zh'
            handleLanguageChange(newLocale)
        }
        
        // 从 store 获取状态
        const userInfo = computed(() => store.state.userInfo)
        const isLogin = computed(() => store.state.isLogin)
        const fansArr = computed(() => store.state.fansArr)
        const attentionArr = computed(() => store.state.attentionArr)
        const searchArry = computed(() => store.state.searchArry)
        
        const handleScroll = () => {
            // 检查滚动位置，如果小于等于 0，确保 isScrolled 为 false
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
            isScrolled.value = scrollY > 50
        }
        
        const toggleSubmenu = (menuName) => {
            // 如果点击的是当前已打开的菜单，则关闭；否则关闭其他菜单并打开当前菜单
            if (activeSubmenu.value === menuName) {
                activeSubmenu.value = null
            } else {
                activeSubmenu.value = menuName
            }
        }
        
        const closeSubmenu = () => {
            activeSubmenu.value = null
        }
        
        const handleClickOutside = (event) => {
            const el = proxy?.$el
            if (el && !el.contains(event.target)) {
                closeSubmenu()
            }
        }
        
        const showMask = () => {
            store.commit("showMask")
        }
        
        const toMyHomePage = () => {
            router.push("/user/")
        }
        
        const toProfile = () => {
            router.push("/user/profile")
        }
        
        const toMemberRecharge = () => {
            router.push("/member/recharge")
        }
        
        const contactUs = () => {
            // 联系我们功能，可以跳转到联系页面或显示联系方式
            $message.info('请联系客服：support@kidstory.cc')
        }
      
        const goToRecharge = () => {
            // 跳转到充值页面
            showMemberDialog.value = false
            router.push('/member/recharge')
        }
        
        const logout = () => {
            localStorage.removeItem("id")
            localStorage.removeItem("token")
            store.commit("hasLogin", false)
            store.commit("setUserInfo", null)
            router.push('/')
        }
        
        //搜索绘本
        const searchFun = async (Value) => {
            if (Value) {
                store.commit("setSearchInput", searchValue.value)
                router.push({
                    name: "search-books",
                    query: { keyWord: Value },
                })
            } else {
                router.push("/books")
            }
        }

        const tokenFail = () => {
            const token = localStorage.getItem("token")
            if (!token) {
                // 没有token，直接返回，不显示登录框（避免干扰正常浏览）
                return Promise.resolve()
            }
            
            return $http.post(`/user/iflogin`, {}, {
                headers: {
                    "Authorization": "Bearer " + token
                },
                timeout: 10000 // 10秒超时
            })
            .then((response) => {
                if (response.data.desc == "success") {
                    store.commit("hasLogin", true)
                } else {
                    // token无效，清除登录状态
                    localStorage.removeItem("token")
                    localStorage.removeItem("id")
                    store.commit("hasLogin", false)
                    store.commit("setUserInfo", null)
                }
            })
            .catch((error) => {
                // 处理401未授权错误
                if (error.response && error.response.status === 401) {
                    console.log('Token无效，清除登录状态')
                    localStorage.removeItem("token")
                    localStorage.removeItem("id")
                    store.commit("hasLogin", false)
                    store.commit("setUserInfo", null)
                } 
                // 超时或网络错误时静默处理，不强制显示登录框
                else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
                    console.log('登录检查超时或网络错误，跳过')
                    // 网络错误时不清除登录状态，可能是临时网络问题
                } else {
                    // 其他错误，静默处理
                    console.log('登录检查失败:', error.message)
                }
            })
        }

        const getUser = async () => {
            try {
                // 更新 userid（可能从 localStorage 中刚设置）
                const currentUserId = localStorage.getItem("id")
                if (!currentUserId) {
                    return // 如果没有用户ID，直接返回
                }
                userid.value = currentUserId
                
                const token = localStorage.getItem("token")
                if (!token) {
                    console.warn('获取用户信息失败: 未找到token')
                    return
                }
                
                let res = await $http.get(`/user/` + currentUserId, {
                    timeout: 10000, // 10秒超时
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                
                let toolUser = res.data.message
                if (toolUser) {
                    store.commit("setUserInfo", toolUser)
                    // 获取用户积分
                    userPoints.value = toolUser.points || toolUser.credits || 0
                } else {
                    console.warn('获取用户信息失败: 响应数据为空', res.data)
                }
            } catch(err) {
                console.error('获取用户信息失败:', err)
                
                // 详细的错误信息
                if (err.response) {
                    console.error('错误响应:', err.response.status, err.response.data)
                    if (err.response.status === 401) {
                        // 401未授权，清除登录状态
                        localStorage.removeItem("token")
                        localStorage.removeItem("id")
                        store.commit("hasLogin", false)
                        store.commit("setUserInfo", null)
                        store.commit('showMask')
                    } else if (err.response.status === 404) {
                        console.warn('用户不存在或接口路径错误')
                    }
                } else if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message?.includes('timeout')) {
                    // 网络错误或超时，静默失败，不强制显示登录框
                    console.warn('网络错误或超时，跳过获取用户信息')
                } else {
                    console.error('未知错误:', err)
                }
            }
        }
        //获取用户收藏的绘本
        const getCollectionBook = () => {
            if (!userid.value) {
                return Promise.resolve() // 如果没有用户ID，直接返回
            }
            return $http
                .get(`/user/list/collect`, {
                    params: { category: "book", id: userid.value },
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    timeout: 10000 // 10秒超时
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        let arr = response.data.message
                        let tool = []
                        for (var i = 0; i < arr.length; i++) {
                            tool.push(arr[i].collectid)
                        }
                        store.commit("collectBook", tool)
                    }
                })
                .catch((error) => {
                    // 静默处理错误，避免影响页面加载
                    if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
                        console.log('获取收藏绘本失败:', error)
                    }
                })
        }

        //获取用户喜欢的绘本
        const getLikeBook = () => {
            if (!userid.value) {
                return Promise.resolve() // 如果没有用户ID，直接返回
            }
            return $http
                .get(`/user/list/like`, {
                    params: { category: "book", id: userid.value },
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    timeout: 10000 // 10秒超时
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        let arr = response.data.message
                        let tool = []
                        for (var i = 0; i < arr.length; i++) {
                            tool.push(arr[i].likeid)
                        }
                        store.commit("likeBook", tool)
                    }
                })
                .catch((error) => {
                    // 静默处理错误，避免影响页面加载
                    if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
                        console.log('获取喜欢绘本失败:', error)
                    }
                })
        }

        //获取用户收藏的插画
        const getCollectionIllus = () => {
            if (!userid.value) {
                return Promise.resolve() // 如果没有用户ID，直接返回
            }
            return $http
                .get(`/user/list/collect`, {
                    params: { category: "illustration", id: userid.value },
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    timeout: 10000 // 10秒超时
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        let arr = response.data.message
                        let tool = []
                        for (var i = 0; i < arr.length; i++) {
                            tool.push(arr[i].collectid)
                        }
                        store.commit("collectIllus", tool)
                    }
                })
                .catch((error) => {
                    // 静默处理错误，避免影响页面加载
                    if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
                        console.log('获取收藏插画失败:', error)
                    }
                })
        }

        //获取用户喜欢的插画
        const getLikeIllus = () => {
            return $http
                .get(`/user/list/like`, {
                    params: { category: "illustration", id: userid.value },
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    }
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        let arr = response.data.message
                        let tool = []
                        for (var i = 0; i < arr.length; i++) {
                            tool.push(arr[i].likeid)
                        }
                        store.commit("likeIllus", tool)
                    }
                })
                .catch((error) => console.log(error))
        }

        //获取用户关注的人
        const getAttention = () => {
            if (!userid.value) {
                return Promise.resolve() // 如果没有用户ID，直接返回
            }
            return $http
                .get(`/user/list/fllow`, {
                    params: { id: userid.value },
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    timeout: 10000 // 10秒超时
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        let arr = response.data.message
                        let tool = []
                        for (var i = 0; i < arr.length; i++) {
                            tool.push(arr[i].fllowid)
                        }
                        store.commit("myAttention", tool)
                        console.log(tool)
                    }
                })
                .catch((error) => {
                    // 静默处理错误，避免影响页面加载
                    if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
                        console.log('获取关注列表失败:', error)
                    }
                })
        }

        //获取粉丝
        const getFans = () => {
            if (!userid.value) {
                return Promise.resolve() // 如果没有用户ID，直接返回
            }
            return $http
                .get(`/user/list/fllow`, {
                    params: { id: userid.value, sign: "item" },
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    timeout: 10000 // 10秒超时
                })
                .then((response) => {
                    if (response.data.desc === "success") {
                        let arr = response.data.message
                        let tool = []
                        for (var i = 0; i < arr.length; i++) {
                            tool.push(arr[i].fllowid)
                        }
                        store.commit("myFans", tool)
                        console.log(tool)
                    }
                })
                .catch((error) => {
                    // 静默处理错误，避免影响页面加载
                    if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
                        console.log('获取粉丝列表失败:', error)
                    }
                })
        }
        
        // 监听登录状态变化，当微信登录成功后自动获取用户信息
        watch(() => isLogin.value, (newVal, oldVal) => {
            // 当登录状态从false变为true时，重新获取用户信息
            if (newVal && !oldVal) {
                console.log('检测到登录状态变化，重新获取用户信息')
                // 延迟一下，确保token和id已经保存到localStorage
                setTimeout(() => {
                    getUser()
                }, 100)
            }
        }, { immediate: false })

        // 监听store中userInfo的变化，确保用户名正确显示
        watch(() => userInfo.value, (newVal, oldVal) => {
            if (newVal && newVal.name) {
                console.log('用户信息已更新，用户名:', newVal.name)
                // 如果用户信息更新了，确保userid也更新
                if (newVal._id || newVal.id) {
                    const newUserId = newVal._id || newVal.id
                    if (newUserId !== userid.value) {
                        userid.value = newUserId
                        localStorage.setItem('id', newUserId)
                    }
                }
            } else if (!newVal && oldVal) {
                // 用户信息被清空（登出）
                console.log('用户信息已清空')
            }
        }, { deep: true })

        // 监听路由变化，当从微信回调页面返回时重新获取用户信息
        watch(() => route.path, (to, from) => {
            closeSubmenu()
            
            // 如果从微信回调页面返回，且已登录，重新获取用户信息
            if (from === '/wechat/callback' && to !== '/wechat/callback') {
                // 检查是否有token和id
                const token = localStorage.getItem('token')
                const id = localStorage.getItem('id')
                if (token && id && isLogin.value) {
                    console.log('从微信回调页面返回，重新获取用户信息')
                    // 延迟一下，确保store状态已更新
                    setTimeout(() => {
                        getUser()
                    }, 200)
                }
            }
            
            // 如果跳转到 Creation 页面，重置滚动状态
            if (to === '/creation') {
                nextTick(() => {
                    window.scrollTo(0, 0)
                    isScrolled.value = false
                })
            }
        })

        // 初始化
        onMounted(async () => {
            // 先检查登录状态，再获取用户信息
            // 使用 Promise.allSettled 确保即使某些请求失败也不影响页面加载
            try {
                // 先检查token是否有效
                await tokenFail()
                
                // 如果已登录，再获取用户信息和其他数据
                if (store.state.isLogin && localStorage.getItem("token") && localStorage.getItem("id")) {
                    // 并行获取用户相关数据，但不阻塞页面加载
                    Promise.allSettled([
                        getUser(),
                        getCollectionBook(),
                        getLikeBook(),
                        getCollectionIllus(),
                        getLikeIllus(),
                        getAttention(),
                        getFans()
                    ]).then(() => {
                        console.log('用户数据加载完成（部分可能失败）')
                    })
                }
            } catch (error) {
                // 初始化错误，静默处理
                console.log('初始化完成（部分可能失败）:', error.message)
            }
            
            // 点击外部关闭子菜单
            document.addEventListener('click', handleClickOutside)
            
            // 监听滚动事件
            window.addEventListener('scroll', handleScroll)
            // 延迟初始化检查，确保页面已完全加载
            nextTick(() => {
                handleScroll()
            })
            
            // 注意：storage事件只在其他窗口/tab页修改localStorage时触发
            // 当前窗口修改localStorage不会触发storage事件
            // 所以我们需要通过其他方式检测登录状态变化
        })
        
        onBeforeUnmount(() => {
            document.removeEventListener('click', handleClickOutside)
            window.removeEventListener('scroll', handleScroll)
        })
        
        return {
            logoUrl,
            userid,
            searchValue,
            userPoints,
            showMemberDialog,
            activeSubmenu,
            isScrolled,
            userInfo,
            isLogin,
            fansArr,
            attentionArr,
            searchArry,
            route,
            currentLanguage,
            toggleLanguage,
            handleLanguageChange,
            handleScroll,
            toggleSubmenu,
            closeSubmenu,
            handleClickOutside,
            showMask,
            toMyHomePage,
            toProfile,
            toMemberRecharge,
            contactUs,
            goToRecharge,
            logout,
            searchFun,
            tokenFail,
            getUser,
            getCollectionBook,
            getLikeBook,
            getCollectionIllus,
            getLikeIllus,
            getAttention,
            getFans
        }
    }
}
</script>

<style scoped>
/* 导航栏包装器 - 固定定位 */
.navigation-wrap {
	position: fixed;
	width: 100%;
	top: 0;
	left: 0;
	z-index: 10000;
	-webkit-transition: all 0.3s ease-out;
	transition: all 0.3s ease-out;
}

/* 导航栏主体 */
.start-header {
	opacity: 1;
	transform: translateY(0);
	height: 50px;
	display: flex;
	align-items: center;
	box-shadow: 0 10px 30px 0 rgba(138, 155, 165, 0.15);
	-webkit-transition: all 0.3s ease-out;
	transition: all 0.3s ease-out;
	background-color: #fff;
}

.start-header.scroll-on {
	height: 50px;
	box-shadow: 0 5px 10px 0 rgba(138, 155, 165, 0.15);
	-webkit-transition: all 0.3s ease-out;
	transition: all 0.3s ease-out;
}

.start-header.scroll-on .navbar-brand img {
	height: 24px;
	-webkit-transition: all 0.3s ease-out;
	transition: all 0.3s ease-out;
}

.navbar {
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.container-fluid {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30px;
}

.navbar-header {
	display: flex;
	align-items: center;
}

.navbar-brand {
	cursor: pointer;
	padding: 0;
	margin-right: 30px;
}

.navbar-brand img {
	height: 28px;
	width: auto;
	display: block;
	-webkit-transition: all 0.3s ease-out;
	transition: all 0.3s ease-out;
}

.navbar-nav {
	display: flex;
	align-items: center;
	list-style: none;
	margin: 0;
	padding: 0;
	gap: 30px;
}

.nav-item {
	position: relative;
	transition: all 200ms linear;
}

.nav-link {
	color: #212121 !important;
	font-weight: 500;
	transition: all 200ms linear;
	position: relative;
	padding: 5px 15px !important;
	cursor: pointer;
	display: inline-block;
	text-decoration: none;
}

.nav-item:hover .nav-link {
	color: #8167a9 !important;
}

.nav-item.active .nav-link {
	color: #777 !important;
}

.nav-item:after {
	display: none;
}

/* 下拉菜单 */
.nav-item .dropdown-menu {
	transform: translate3d(0, 10px, 0);
	visibility: hidden;
	opacity: 0;
	max-height: 0;
	display: block;
	padding: 0;
	margin: 0;
	transition: all 200ms linear;
	position: absolute;
	top: 100%;
	left: 0;
	min-width: 240px;
	z-index: 1000;
}

.nav-item.show .dropdown-menu {
	opacity: 1;
	visibility: visible;
	max-height: 999px;
	transform: translate3d(0, 0px, 0);
}

.dropdown-menu {
	padding: 10px !important;
	margin: 0;
	font-size: 13px;
	letter-spacing: 1px;
	color: #212121;
	background-color: #fcfaff;
	border: none;
	border-radius: 3px;
	box-shadow: 0 5px 10px 0 rgba(138, 155, 165, 0.15);
	transition: all 200ms linear;
	list-style: none;
}

.dropdown-toggle::after {
	display: none;
}

.dropdown-item {
	padding: 8px 16px;
	color: #212121;
	border-radius: 2px;
	transition: all 200ms linear;
	display: flex;
	align-items: center;
	gap: 8px;
	text-decoration: none;
	cursor: pointer;
}

.dropdown-item:hover,
.dropdown-item:focus {
	color: #8167a9;
	
}

.dropdown-item i {
	font-size: 16px;
}

/* 语言切换器样式 */
.language-switcher-item {
	display: flex;
	align-items: center;
	margin-left: 10px;
	margin-right: 10px;
}

.language-radio-group {
	display: flex;
}

.language-radio-group :deep(.el-radio-button__inner) {
	padding: 6px 12px;
	font-size: 13px;
	font-weight: 500;
	border-radius: 4px;
	transition: all 0.3s ease;
}

.language-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner) {
	border-top-left-radius: 4px;
	border-bottom-left-radius: 4px;
}

.language-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
	border-top-right-radius: 4px;
	border-bottom-right-radius: 4px;
}

.language-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
	background-color: #409eff;
	border-color: #409eff;
	color: #fff;
	box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.language-radio-group :deep(.el-radio-button__inner:hover) {
	color: #409eff;
}

/* 搜索框样式 */
.search-item {
	margin-left: auto;
	margin-right: 15px;
}

.search-wrapper {
	display: flex;
	align-items: center;
	position: relative;
	background-color: #f5f5f5;
	border-radius: 4px;
	padding: 8px 12px;
	width: 250px;
	border: 1px solid #e0e0e0;
}

.search-icon {
	color: #212121;
	margin-right: 8px;
	font-size: 16px;
}

.search {
	background: transparent !important;
	border: none !important;
	outline: none !important;
	box-shadow: none !important;
	color: #212121;
	font-size: 14px;
	width: 100%;
	padding: 0;
	margin: 0;
}

.search:focus {
	border: none !important;
	outline: none !important;
	box-shadow: none !important;
}

.search::placeholder {
	color: #999;
}



/* 用户菜单样式 */
.user-menu-trigger {
	padding: 5px 10px !important;
}

.user-header-wrapper {
	display: flex;
	align-items: center;
	gap: 12px;
}

/* 积分和Pro显示框 */
.points-pro-box {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 12px;
	background-color: #f5f5f5;
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.3s;
	border: 1px solid #e0e0e0;
}

.points-pro-box:hover {
	background-color: #eeeeee;
}

.points-section {
	display: flex;
	align-items: center;
	gap: 4px;
}

.points-icon-small {
	width: 16px;
	height: 16px;
}

.points-value {
	color: #212121;
	font-size: 14px;
	font-weight: 500;
}

.divider {
	width: 1px;
	height: 16px;
	background-color: #e0e0e0;
}

.pro-section {
	display: flex;
	align-items: center;
}

.pro-text {
	color: #8167a9;
	font-size: 12px;
	font-weight: 600;
}

.user-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	cursor: pointer;
}

/* 下拉菜单用户名显示 */
.dropdown-header {
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 600;
	color: #212121;
	background-color: #f8f9fa;
	border-bottom: 1px solid #e9ecef;
}

.user-name {
	color: #8167a9;
	font-weight: 600;
}

.dropdown-divider {
	margin: 4px 0;
	border-top: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 767px) {
	.nav-item:after {
		display: none;
	}

	.nav-item::before {
		position: absolute;
		display: block;
		top: 15px;
		left: 0;
		width: 11px;
		height: 1px;
		content: "";
		border: none;
		background-color: #fff;
	}

	.dropdown-toggle::after {
		position: absolute;
		display: block;
		top: 10px;
		left: -23px;
		width: 1px;
		height: 11px;
		content: "";
		border: none;
		background-color: #fff;
		transition: all 200ms linear;
	}

	.dropdown-toggle[aria-expanded="true"]::after {
		transform: rotate(90deg);
		opacity: 0;
	}

	.dropdown-menu {
		padding: 0 !important;
		background-color: transparent;
		box-shadow: none;
		transition: all 200ms linear;
	}

	.nav-item.show .dropdown-menu {
		margin-top: 10px !important;
		margin-bottom: 20px !important;
	}

	.search-wrapper {
		width: 150px;
	}
}
</style>