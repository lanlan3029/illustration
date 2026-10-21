<template>
  <div class="navigation-wrap story-controls" @keydown.esc="dismissMenus">
    <nav class="navbar start-header" :class="{ 'scroll-on': isScrolled }">
      <div class="container-fluid">
        <div class="navbar-header">
          <!-- Logo -->
          <router-link class="navbar-brand" to="/" :aria-label="$t('nav.home')">
            <img :src="logoUrl" alt="故事时间" />
          </router-link>
        </div>

        <button
          v-if="isMobile"
          type="button"
          class="mobile-nav-button"
          :aria-expanded="mobileMenuVisible"
          :aria-label="$t('nav.menu')"
          aria-controls="mobile-navigation"
          @click="toggleMobileMenu"
        >
          <span /><span /><span />
        </button>

        <!-- 桌面导航 -->
        <ul class="navbar-nav desktop-nav">
          <!-- 首页（导航数据见 setup 中的 navItems） -->
          <li class="nav-item" :class="{ 'active': isNavActive(homeNavItem) }">
            <router-link :to="homeNavItem.to" class="nav-link" @click="closeSubmenu">{{ $t(homeNavItem.label) }}</router-link>
          </li>

          <li class="nav-item dropdown" :class="{ 'show': activeSubmenu === 'creation', 'active': isCreationNavActive }">
            <button type="button" class="nav-link dropdown-toggle" :aria-expanded="activeSubmenu === 'creation'" aria-controls="nav-creation" @click="toggleSubmenu('creation')">
              {{ $t('nav.creation') }}
            </button>
            <ul id="nav-creation" class="dropdown-menu">
              <li v-for="item in creationItems" :key="item.to">
                <router-link :to="item.to" class="dropdown-item" @click="closeSubmenu">{{ $t(item.label) }}</router-link>
              </li>
            </ul>
          </li>

          <li class="nav-item dropdown" :class="{ 'show': activeSubmenu === 'activities', 'active': isActivitiesNavActive }">
            <button type="button" class="nav-link dropdown-toggle" :aria-expanded="activeSubmenu === 'activities'" aria-controls="nav-activities" @click="toggleSubmenu('activities')">
              {{ $t('nav.activities') }}
            </button>
            <ul id="nav-activities" class="dropdown-menu">
              <li v-for="item in activityItems" :key="item.to">
                <router-link :to="item.to" class="dropdown-item" @click="closeSubmenu">{{ $t(item.label) }}</router-link>
              </li>
            </ul>
          </li>

          <!-- 其余简单导航项（与手机端共用 navItems 配置） -->
          <li
            v-for="item in desktopRestItems"
            :key="item.key"
            class="nav-item"
            :class="{ 'active': isNavActive(item), 'book-library-nav': item.key === 'books' }"
          >
            <router-link :to="item.to" class="nav-link" :class="item.linkClass" @click="closeSubmenu">{{ $t(item.label) }}</router-link>
          </li>



          <!-- 搜索框 -->
          <li class="nav-item search-item" :class="{ 'search-open': searchOpen }">
            <button type="button" class="search-toggle" :aria-label="$t('common.search') + ' ' + $t('common.books')" :aria-expanded="searchOpen" aria-controls="header-search" @click="toggleSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
            </button>
            <div class="search-wrapper">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
              <input
                ref="searchInputRef"
                id="header-search"
                type="text"
                class="search"
                v-model="searchValue"
                name="search"
                :aria-label="$t('common.search') + ' ' + $t('common.books')"
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
              @change="handleLanguageChange"
              class="language-radio-group"
            >
              <el-radio-button label="zh" value="zh">中文</el-radio-button>
              <el-radio-button label="en" value="en">EN</el-radio-button>
            </el-radio-group>
          </li>

          <!-- 用户登录/头像 -->
          <li v-if="!isLogin" class="nav-item">
            <button type="button" @click="showMask" class="nav-link">{{ $t('common.login') }}</button>
          </li>

          <li v-else class="nav-item dropdown user-nav" :class="{ 'show': activeSubmenu === 'user' }">
            <div class="user-header-wrapper">
                <!-- 积分和Pro显示框 -->
                <button type="button" class="points-pro-box" @click="goPointsHistory">
                  <div class="points-section">
                    <img src="@/assets/logo/count.png" alt="积分" class="points-icon-small" />
                    <span class="points-value">{{ userPoints || 0 }}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="pro-section">
                    <span class="pro-text">Pro</span>
                  </div>
                </button>
                <!-- 用户头像 -->
                <button type="button" class="user-menu-trigger" :aria-label="$t('nav.my')" :aria-expanded="activeSubmenu === 'user'" aria-controls="nav-user" @click="toggleSubmenu('user')">
                <img
                  :src="(userInfo && userInfo.avatar) ? userInfo.avatar : defaultAvatar"
                  :alt="(userInfo && userInfo.name) || 'User Avatar'"
                  class="user-avatar"
                />
                </button>
            </div>
            <ul id="nav-user" class="dropdown-menu">
              <li><router-link to="/member/points-history" class="dropdown-item" @click="closeSubmenu">{{ $t('pointsHistory.title') }}</router-link></li>
              <li v-if="isAdmin"><router-link to="/admin/books" class="dropdown-item" @click="closeSubmenu()">{{ currentLanguage === 'en' ? 'Admin dashboard' : '管理后台' }}</router-link></li>
              <li><router-link to="/member/generation-history" class="dropdown-item" @click="closeSubmenu()">
                <i class="el-icon-time"></i>
                <span>{{ $t('generationHistory.title') }}</span>
              </router-link></li>
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
              <li><a @click.prevent="toAboutUs(); closeSubmenu();" class="dropdown-item dropdown-item--muted">
                <i class="iconfont icon-other"></i>
                <span>{{ $t('nav.aboutUs') }}</span>
              </a></li>
              <li><a @click.prevent="toFeedback(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-lianxiwomen1"></i>
                <span>{{ $t('nav.feedback') }}</span>
              </a></li>
            </ul>
          </li>
        </ul>



      </div>
    </nav>
    <div v-if="isMobile && mobileMenuVisible" id="mobile-navigation" class="mobile-nav-sheet">
      <section>
        <p class="mobile-nav-sheet__label">{{ $t('nav.activities') }}</p>
        <router-link
          v-for="item in activityItems"
          :key="item.to"
          :to="item.to"
          class="mobile-nav-sheet__link"
          @click="closeMobileMenu"
        >{{ $t(item.label) }}</router-link>
      </section>
      <section>
        <p class="mobile-nav-sheet__label">{{ $t('nav.tools') }}</p>
        <router-link
          v-for="item in creationItems"
          :key="'tool-' + item.to"
          :to="item.to"
          class="mobile-nav-sheet__link"
          @click="closeMobileMenu"
        >{{ $t(item.label) }}</router-link>
      </section>
    </div>
  </div>
</template>

<script>
import { isCurrentUserAdmin } from '@/utils/auth'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { useBreakpoint } from '@/composables/useBreakpoint'

export default {
    name: 'TopBar',
    setup() {
        const store = useStore()
        const router = useRouter()
        const route = useRoute()
        const { proxy } = getCurrentInstance()
        const { locale } = useI18n()

        const logoUrl = require('../assets/logo/logo.png')
        const defaultAvatar = require('../assets/images/magic 2.svg')
        const userid = ref(localStorage.getItem("id"))
        const searchValue = ref('')
        const searchOpen = ref(false)
        const searchInputRef = ref(null)
        const toggleSearch = () => {
            searchOpen.value = !searchOpen.value
            if (searchOpen.value) nextTick(() => searchInputRef.value?.focus())
        }
        const isAdmin = computed(() => { void store.state.isLogin; void route.path; return isCurrentUserAdmin() })
        const userPoints = ref(0) // 用户积分
        const showMemberDialog = ref(false) // 是否显示会员信息对话框
        const activeSubmenu = ref(null) // 当前激活的子菜单
        const isScrolled = ref(false) // 是否已滚动
        const mobileMenuVisible = ref(false) // 手机端菜单是否可见

        // 视口判断统一走 useBreakpoint（isMobile = width <= 768，与 breakpoints.css 一致）
        const { isMobile } = useBreakpoint()

        const $http = proxy?.$http || axios

        /**
         * 顶部导航的唯一数据源：桌面端简单项与手机端菜单共用，改一处两端同步。
         * - label 为 i18n key，模板里用 $t(item.label) 渲染。
         * - mobile: 是否在手机端菜单展示。
         * - key === 'moodDiary' 时高亮逻辑走 isMoodDiaryRoute。
         */
        const navItems = [
            { key: 'home', to: '/', label: 'nav.home', mobile: true },
            { key: 'upload', to: '/user/upload', label: 'common.upload', mobile: false },
            { key: 'books', to: '/books', label: 'common.books', mobile: true },
            { key: 'websites', to: '/websites', label: 'nav.websites', mobile: true },
            { key: 'blog', to: '/blog', label: 'nav.blog', mobile: true },
            { key: 'moodDiary', to: '/mood-diary', label: 'nav.moodDiary', linkClass: 'nav-link-mood-diary', mobile: true },
        ]

        const activityItems = [
            { to: '/childhood', label: 'nav.childhood' },
            { to: '/national-day', label: 'nav.nationalDay' },
        ]

        // 「创作」下拉项配置（同样集中管理）
        const creationItems = [
            { to: '/creation-studio', label: 'nav.characterStudio' },
            { to: '/editorpro', label: 'nav.createIllustration' },
            { to: '/photo-collage', label: 'nav.photoCollage' },
            { to: '/diary-timeline', label: 'nav.diaryTimeline' },
            { to: '/image-segmentation', label: 'nav.imageSegmentation' },
            { to: '/lasso-crop', label: 'nav.lassoCrop' },
            { to: '/creation-studio/book/compose', label: 'nav.layoutExport' },
        ]

        const homeNavItem = navItems[0]
        // 桌面端：首页单独渲染、创作下拉居中，其余简单项在此列表
        const desktopRestItems = navItems.filter((i) => i.key !== 'home')
        // 手机端：仅展示标记 mobile 的项

        /** 创作入口下任一子路由（含 AI 插画 / AI 绘本）时高亮「创作」 */
        const isCreationNavActive = computed(() => {
            const p = route.path
            return (
                p.startsWith('/creation-studio') ||
                p.startsWith('/character-studio') ||
                p.startsWith('/editorpro') ||
                p.startsWith('/photo-collage') ||
                p.startsWith('/diary-timeline') ||
                p.startsWith('/image-segmentation') ||
                p.startsWith('/lasso-crop') ||
                p.startsWith('/user/upload/compose-illustration') ||
                p.startsWith('/creation-studio/book/topdf')
            )
        })

        const isActivitiesNavActive = computed(() => {
            const p = route.path
            return p.startsWith('/childhood') || p.startsWith('/national-day') || p.startsWith('/guoqing')
        })

        const isMoodDiaryRoute = computed(() => route.path.startsWith('/mood-diary'))
        const isWebsitesRoute = computed(() => route.path.startsWith('/websites'))
        const isBlogRoute = computed(() => route.path.startsWith('/blog'))

        // 统一的「当前项是否激活」判断，桌面与手机共用
        const isNavActive = (item) => {
            if (!item) return false
            if (item.key === 'books') return /^\/books(?:\/|$)/.test(route.path)
            if (item.key === 'moodDiary') return isMoodDiaryRoute.value
            if (item.key === 'websites') return isWebsitesRoute.value
            if (item.key === 'blog') return isBlogRoute.value
            return route.path === item.to
        }

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

        const dismissMenus = () => {
            searchOpen.value = false
            closeSubmenu()
            closeMobileMenu()
        }

        const handleClickOutside = (event) => {
            const el = proxy?.$el
            if (el && !el.contains(event.target)) {
                dismissMenus()
            }
        }

        const showMask = () => {
            store.commit("showMask")
        }

        const toProfile = () => {
            router.push('/user/profile')
        }

        const toMemberRecharge = () => {
            router.push('/member/recharge')
        }

        const contactUs = () => {
            router.push('/connection')
        }

        const toFeedback = () => {
            router.push('/feedback')
        }

        const toAboutUs = () => {
            router.push('/user/about')
        }

        const toggleMobileMenu = () => {
            mobileMenuVisible.value = !mobileMenuVisible.value
        }

        const closeMobileMenu = () => {
            mobileMenuVisible.value = false
        }

        const goHomeFromMobile = () => {
            closeMobileMenu()
            router.push('/')
        }

        const handleMobileLogin = () => {
            closeMobileMenu()
            store.commit('showMask')
        }

        const toMemberRechargeFromMobile = () => {
            closeMobileMenu()
            router.push('/member/recharge')
        }

        const logoutFromMobile = () => {
            closeMobileMenu()
            logout()
        }

        const goToRecharge = () => {
            // 跳转到充值页面
            showMemberDialog.value = false
            router.push('/member/recharge')
        }

        const goPointsHistory = () => {
            closeSubmenu()
            if (isLogin.value || localStorage.getItem('token')) {
                router.push('/member/points-history')
            } else {
                store.commit('showMask')
            }
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
            searchOpen.value = false
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
            // 匿名首页无需校验空 token，也避免因此自动加载登录弹窗。
            if (!localStorage.getItem('token')) return Promise.resolve()
            return $http.post(`/user/iflogin`, {}, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                timeout: 10000 // 10秒超时
            })
            .then((response) => {
                if (response.data.desc == "success") {
                    store.commit("hasLogin", true)
                } else {
                    store.commit('showMask')
                }
            })
            .catch((error) => {
                // 超时或网络错误时静默处理，不强制显示登录框
                if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
                    console.log('登录检查超时或网络错误，跳过')
                } else {
                    store.commit('showMask')
                }
            })
        }

        const getUser = async () => {
            try {
                if (!userid.value) {
                    return // 如果没有用户ID，直接返回
                }
                let res = await $http.get(`/user/` + userid.value, {
                    timeout: 10000 // 10秒超时
                })
                let toolUser = res.data.message
                store.commit("setUserInfo", toolUser)
                // 获取用户积分
                userPoints.value = toolUser.points || toolUser.credits || 0
            } catch(err) {
                console.error('获取用户信息失败:', err)
                // 只有非网络错误才显示登录框，避免后端服务不可用时强制弹出登录框
                if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message?.includes('timeout')) {
                    // 网络错误或超时，不强制显示登录框，静默失败
                } else if (err.response && err.response.status === 401) {
                    // 401未授权，显示登录框
                    store.commit('showMask')
                }
            }
        }
        // 插画/绘本/关注/粉丝 改为在具体页面按需请求，见 src/api/userCollect.js

        // 监听登录状态变化，当登录状态变为 true 时，更新 userid 并获取用户信息
        watch(isLogin, async (newVal) => {
            if (newVal) {
                // 登录状态变为 true，从 localStorage 重新读取 userid
                const newUserId = localStorage.getItem('id')
                if (newUserId && newUserId !== userid.value) {
                    userid.value = newUserId
                    // 延迟一下，确保 localStorage 已更新
                    await nextTick()
                    setTimeout(async () => {
                        await getUser()
                        // 获取用户信息后，更新积分显示
                        if (store.state.userInfo && store.state.userInfo.points !== undefined) {
                            userPoints.value = store.state.userInfo.points || store.state.userInfo.credits || 0
                        }
                    }, 100)
                }
            }
        }, { immediate: false })

        // 监听用户信息变化，更新积分显示
        watch(() => store.state.userInfo, (newUserInfo) => {
            if (newUserInfo && newUserInfo.points !== undefined) {
                userPoints.value = newUserInfo.points || newUserInfo.credits || 0
            }
        }, { deep: true })

        // 初始化
        onMounted(async () => {
            try {
                await Promise.allSettled([
                    tokenFail(),
                    getUser()
                ])
            } catch (error) {
                // 所有请求都使用 Promise.allSettled，即使有失败也不会抛出错误
                console.log('初始化请求完成（部分可能失败）')
            }

            // 点击外部关闭子菜单
            document.addEventListener('click', handleClickOutside)

            // 监听滚动事件
            window.addEventListener('scroll', handleScroll)
            // 延迟初始化检查，确保页面已完全加载
            nextTick(() => {
                handleScroll()
            })

            // 视口判断已由 useBreakpoint 统一处理（含 resize 监听），此处无需再绑定

            // 监听路由变化，关闭下拉菜单并重置滚动状态
            watch(() => route.path, (to) => {
                closeSubmenu()
                mobileMenuVisible.value = false
                // 如果跳转到 Editorpro 页面，重置滚动状态
                if (to === '/editorpro') {
                    nextTick(() => {
                        window.scrollTo(0, 0)
                        isScrolled.value = false
                    })
                }
            })
        })

        onBeforeUnmount(() => {
            document.removeEventListener('click', handleClickOutside)
            window.removeEventListener('scroll', handleScroll)
        })

        return {
            logoUrl,
            defaultAvatar,
            userid,
            searchValue,
            searchOpen,
            searchInputRef,
            toggleSearch,
            userPoints,
            isAdmin,
            isMobile,
            mobileMenuVisible,
            navItems,
            creationItems,
            activityItems,
            isActivitiesNavActive,
            homeNavItem,
            desktopRestItems,
            isNavActive,
            toggleMobileMenu,
            closeMobileMenu,
            goHomeFromMobile,
            handleMobileLogin,
            toMemberRechargeFromMobile,
            logoutFromMobile,
            showMemberDialog,
            activeSubmenu,
            isScrolled,
            userInfo,
            isLogin,
            fansArr,
            attentionArr,
            searchArry,
            route,
            isCreationNavActive,
            isMoodDiaryRoute,
            currentLanguage,
            toggleLanguage,
            handleLanguageChange,
            handleScroll,
            toggleSubmenu,
            closeSubmenu,
            dismissMenus,
            handleClickOutside,
            showMask,
            toProfile,
            toMemberRecharge,
            contactUs,
            toFeedback,
            toAboutUs,
            goPointsHistory,
            goToRecharge,
            logout,
            searchFun,
            tokenFail,
            getUser
        }
    }
}
</script>

<style scoped>
.navigation-wrap { position: fixed; inset: 0 0 auto; z-index: 1000; }
.start-header {
  height: var(--ks-header-height);
  display: flex;
  align-items: center;
  background: var(--ks-paper);
  border-bottom: var(--ks-line);
}
.container-fluid {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-inline: clamp(16px, 3vw, 48px);
}
.navbar-header { flex-shrink: 0; }
.navbar-brand { display: inline-flex; align-items: center; min-height: 44px; }
.navbar-brand img { display: block; width: auto; height: 28px; }
.navbar-nav { display: flex; align-items: center; gap: clamp(4px, .8vw, 16px); margin: 0; padding: 0; min-width: 0; list-style: none; }
.nav-item { position: relative; flex-shrink: 0; }
.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ks-ink);
  font: 600 14px/1.5 var(--ks-font);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: color var(--ks-motion), box-shadow var(--ks-motion);
}
.nav-link:hover { color: var(--ks-primary); }
.nav-item.active > .nav-link { box-shadow: inset 0 -3px 0 var(--ks-pink); }
.nav-item .dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  max-height: min(600px, calc(100dvh - var(--ks-header-height) - 32px));
  overflow-y: auto;
  margin: 0;
  padding: 8px;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
  border: var(--ks-line);
  border-radius: var(--ks-radius-md);
  background: var(--ks-paper);
  box-shadow: var(--ks-shadow-sm);
  list-style: none;
  text-align: left;
  transition: opacity var(--ks-motion), transform var(--ks-motion), visibility var(--ks-motion);
}
.nav-item.show .dropdown-menu { visibility: visible; opacity: 1; pointer-events: auto; transform: translateY(0); }
.user-nav .dropdown-menu { left: auto; right: 0; }
.dropdown-item { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 10px 12px; border-radius: var(--ks-radius-sm); color: var(--ks-ink); font-size: 14px; text-decoration: none; cursor: pointer; }
.dropdown-item:hover, .dropdown-item:focus-visible { background: var(--ks-primary-soft); color: var(--ks-primary-hover); }
.dropdown-item i { font-size: 16px; }
.dropdown-item--muted { color: var(--ks-muted); }
.search-toggle { display: none; }
.search-item { flex: 1 1 180px; min-width: 100px; max-width: 220px; margin-inline: 4px; }
.search-wrapper { display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 40px; border: var(--ks-line); border-radius: var(--ks-radius-sm); background: var(--ks-surface); }
.search-wrapper:focus-within { outline: var(--ks-focus); outline-offset: 3px; }
.search-icon { width: 18px; height: 18px; flex-shrink: 0; color: var(--ks-muted); }
.search { width: 100%; min-width: 0; padding: 0; border: 0; outline: none; box-shadow: none; background: transparent; color: var(--ks-ink); font-size: 13px; }
.search::placeholder { color: var(--ks-muted); }
.language-radio-group { flex-wrap: nowrap; }
.language-radio-group :deep(.el-radio-button__inner) { padding: 9px 10px; font-size: 13px; }
.user-header-wrapper { display: flex; align-items: center; gap: 12px; }
.points-pro-box { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 6px 10px; border: var(--ks-line); border-radius: var(--ks-radius-sm); background: var(--ks-surface); color: var(--ks-ink); cursor: pointer; }
.points-pro-box:hover { background: var(--ks-primary-soft); }
.points-section, .pro-section { display: flex; align-items: center; gap: 4px; }
.points-icon-small { width: 16px; height: 16px; }
.points-value { font-size: 14px; font-variant-numeric: tabular-nums; }
.divider { width: 1px; height: 16px; background: var(--ks-divider); }
.pro-text { color: var(--ks-primary-hover); font-size: 12px; font-weight: 600; }
.user-menu-trigger { display: flex; align-items: center; padding: 0; border: 0; background: transparent; border-radius: 50%; cursor: pointer; }
.user-avatar { display: block; width: 40px; height: 40px; border: var(--ks-line); border-radius: 50%; object-fit: cover; }
.mobile-nav-button { display: none; width: 44px; height: 44px; margin-left: auto; padding: 11px; border: var(--ks-line); border-radius: var(--ks-radius-sm); background: var(--ks-surface); color: var(--ks-ink); flex-direction: column; justify-content: center; gap: 5px; cursor: pointer; }
.mobile-nav-button span { height: 2px; border-radius: 2px; background: currentColor; }
.mobile-nav-sheet { position: absolute; top: var(--ks-header-height); inset-inline: 12px; max-height: calc(100dvh - var(--ks-header-height) - var(--kid-tabbar-h) - 24px); overflow-y: auto; overscroll-behavior: contain; padding: 12px; border: var(--ks-line); border-radius: 0 0 var(--ks-radius-md) var(--ks-radius-md); background: var(--ks-paper); box-shadow: var(--ks-shadow-sm); text-align: left; }
.mobile-nav-sheet__label { margin: 12px 8px 8px; color: var(--ks-muted); font-size: 12px; font-weight: 600; }
.mobile-nav-sheet__link { display: flex; align-items: center; min-height: 44px; padding: 10px 12px; border-radius: var(--ks-radius-sm); color: var(--ks-ink); font-size: 14px; text-decoration: none; }
.mobile-nav-sheet__link:hover { background: var(--ks-primary-soft); }
.mobile-nav-sheet__link.router-link-active { background: var(--ks-yellow); font-weight: 600; }
@media (min-width: 769px) and (max-width: 1200px) {
  .container-fluid { gap: 12px; padding-inline: 16px; }
  .navbar-nav { gap: 2px; }
  .nav-link { padding-inline: 5px; font-size: 13px; }
  .navbar-brand img { height: 24px; }
  .user-header-wrapper { gap: 8px; }
  .search-item { max-width: 160px; min-width: 80px; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .search-item { flex: 0 0 36px; min-width: 36px; margin: 0; }
  .search-toggle { display: grid; place-items: center; width: 36px; height: 40px; padding: 8px; border: 0; border-radius: var(--ks-radius-sm); color: var(--ks-ink); background: transparent; cursor: pointer; }
  .search-toggle svg { width: 20px; height: 20px; }
  .search-item .search-wrapper { position: absolute; top: calc(100% + 12px); right: 0; display: none; width: min(320px, calc(100vw - 32px)); height: 44px; background: var(--ks-surface); box-shadow: var(--ks-shadow-sm); }
  .search-item.search-open .search-wrapper { display: flex; }
  .points-pro-box { display: none; }
  .container-fluid { gap: 8px; }
  .nav-link { padding-inline: 4px; font-size: 12px; }
  .language-radio-group :deep(.el-radio-button__inner) { padding-inline: 6px; }
}
@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .mobile-nav-button { display: inline-flex; }
  .container-fluid { gap: 12px; padding-inline: 16px; }
}
</style>
