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
          <li class="nav-item" :class="{ 'active': $route.path === '/' }">
            <router-link to="/" class="nav-link" @click.native="closeSubmenu">AI插画</router-link>
          </li>

          <li class="nav-item dropdown" :class="{ 'show': activeSubmenu === 'creation' }">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggleSubmenu('creation')">
              创作
            </a>
            <ul class="dropdown-menu">
              <li><router-link to="/create-character" class="dropdown-item" @click.native="closeSubmenu">创作角色</router-link></li>
              <li><router-link to="/create-group-images" class="dropdown-item" @click.native="closeSubmenu">创作组图</router-link></li>
              <li><router-link to="/creation" class="dropdown-item" @click.native="closeSubmenu">创作插画</router-link></li>
              <li><router-link to="/user/upload/compose-illustration" class="dropdown-item" @click.native="closeSubmenu">合成绘本</router-link></li>
            </ul>
          </li>

          <li class="nav-item" :class="{ 'active': $route.path === '/user/upload' }">
            <router-link to="/user/upload" class="nav-link" @click.native="closeSubmenu">上传</router-link>
          </li>

          <li class="nav-item" :class="{ 'active': $route.path === '/books' }">
            <router-link to="/books" class="nav-link" @click.native="closeSubmenu">原创绘本</router-link>
          </li>

          <li class="nav-item" :class="{ 'active': $route.path === '/utility-tools' }">
            <router-link to="/utility-tools" class="nav-link" @click.native="closeSubmenu">工具</router-link>
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
                placeholder="请输入搜索内容" 
                @keyup.enter="searchFun(searchValue)"
                @click.stop
              >
            </div>
          </li>

          <!-- 用户登录/头像 -->
          <li v-if="!isLogin" class="nav-item">
            <a @click.prevent="showMask" class="nav-link">登陆</a>
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
              <li><a @click.prevent="toMyHomePage(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-a-collection"></i>
                <span>我的创作</span>
              </a></li>
              <li><a @click.prevent="toProfile(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-zhanghu"></i>
                <span>账户设置</span>
              </a></li>
              <li><a @click.prevent="toMemberRecharge(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-dingyue"></i>
                <span>订阅管理</span>
              </a></li>
              <li><a @click.prevent="logout(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-tuichudenglu-"></i>
                <span>退出登陆</span>
              </a></li>
              <li><a @click.prevent="contactUs(); closeSubmenu();" class="dropdown-item">
                <i class="iconfont icon-lianxiwomen1"></i>
                <span>联系我们</span>
              </a></li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>

<script>
import {mapState} from "vuex"

export default {
    data(){
        return{ 
          logoUrl:require('../assets/logo/logo.png'),
            userid:localStorage.getItem("id"),
            searchValue:'',
            userPoints: 0, // 用户积分
            showMemberDialog: false, // 是否显示会员信息对话框
            activeSubmenu: null, // 当前激活的子菜单
            isScrolled: false, // 是否已滚动
        }
    },
    computed:{
        ...mapState([
            "userInfo","isLogin","fansArr","attentionArr","searchArry"
        ])
    },
    async mounted(){
        await this.tokenFail();
        await this.getUser();
        await this.getCollectionBook();
        await this.getLikeBook();
        await this.getCollectionIllus();
        await this.getLikeIllus();
        await this.getAttention();
        await this.getFans();
        
        // 点击外部关闭子菜单
        document.addEventListener('click', this.handleClickOutside);
        
        // 监听滚动事件
        window.addEventListener('scroll', this.handleScroll);
        // 延迟初始化检查，确保页面已完全加载
        this.$nextTick(() => {
            this.handleScroll();
        });
        
        // 监听路由变化，关闭下拉菜单并重置滚动状态
        this.$watch('$route', (to) => {
            this.closeSubmenu();
            // 如果跳转到 Creation 页面，重置滚动状态
            if (to.path === '/creation') {
                this.$nextTick(() => {
                    window.scrollTo(0, 0);
                    this.isScrolled = false;
                });
            }
        });
    },
    beforeDestroy() {
        document.removeEventListener('click', this.handleClickOutside);
        window.removeEventListener('scroll', this.handleScroll);
    },
   
    methods:{
        handleScroll() {
            // 检查滚动位置，如果小于等于 0，确保 isScrolled 为 false
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            this.isScrolled = scrollY > 50;
        },
        toggleSubmenu(menuName) {
            // 如果点击的是当前已打开的菜单，则关闭；否则关闭其他菜单并打开当前菜单
            if (this.activeSubmenu === menuName) {
                this.activeSubmenu = null;
            } else {
                this.activeSubmenu = menuName;
            }
        },
        closeSubmenu() {
            this.activeSubmenu = null;
        },
        handleClickOutside(event) {
            if (!this.$el.contains(event.target)) {
                this.closeSubmenu();
            }
        },
        showMask(){
           this.$store.commit("showMask")  
        },
        toMyHomePage(){
           this.$router.push("/user/")
        },
        toProfile(){
            this.$router.push("/user/profile")
        },
        toMemberRecharge(){
            this.$router.push("/member/recharge")
        },
        contactUs(){
            // 联系我们功能，可以跳转到联系页面或显示联系方式
            this.$message.info('请联系客服：support@kidstory.cc');
        },
      
        goToRecharge(){
            // 跳转到充值页面
            this.showMemberDialog = false;
            this.$router.push('/member/recharge');
        },
        logout(){
            localStorage.removeItem("id"),
            localStorage.removeItem("token"),
            this.$store.commit("hasLogin",false),
            this.$store.commit("setUserInfo",null),
            this.$router.push('/')  
        },
        //搜索绘本
        async searchFun(Value){
          if(Value){
            this.$store.commit("setSearchInput",this.searchValue)
           this.$router.push({
        name: "search-books",
        query: { keyWord: Value },
      });
          }else{
            this.$router.push("/books")
          }
        },

        tokenFail(){
      this.$http.post(`/user/iflogin`,{},
      {
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
      .then((response)=>{
        if(response.data.desc == "success"){
          this.$store.commit("hasLogin",true)
        }else{     
          this.$store.commit('showMask')
        }     
      })
    },

   async getUser(){
       try{
        if (!this.userid) {
            return; // 如果没有用户ID，直接返回
        }
        let res= await this.$http.get(`/user/`+this.userid, {
            timeout: 10000 // 10秒超时
        })
        let toolUser=res.data.message;
        this.$store.commit("setUserInfo",toolUser)
        // 获取用户积分
        this.userPoints = toolUser.points || toolUser.credits || 0;
       }catch(err){
        console.error('获取用户信息失败:', err);
        // 只有非网络错误才显示登录框，避免后端服务不可用时强制弹出登录框
        if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message?.includes('timeout')) {
            // 网络错误或超时，不强制显示登录框，静默失败
        } else if (err.response && err.response.status === 401) {
            // 401未授权，显示登录框
            this.$store.commit('showMask');
        }
    }
    },
     //获取用户收藏的绘本
     getCollectionBook(){ 
      this.$http
        .get(`/user/list/collect`,
        {
            params:{category:"book",id:this.userid},
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            let arr=response.data.message
            let tool=[]
            for(var i=0;i<arr.length;i++){
               tool.push(arr[i].collectid)
            }
              this.$store.commit("collectBook",tool)
          } 
        })
        .catch((error) => console.log(error));
    },

        //获取用户喜欢的绘本
        getLikeBook(){
      this.$http
        .get(`/user/list/like`,
        {params:{category:"book",id:this.userid},
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            let arr=response.data.message
            let tool=[]
            for(var i=0;i<arr.length;i++){
               tool.push(arr[i].likeid)
            }
              this.$store.commit("likeBook",tool)

          } 
        })
        .catch((error) => console.log(error));
    },

        //获取用户收藏的插画
        getCollectionIllus(){
      this.$http
        .get(`/user/list/collect`,{
            params:{category:"illustration",id:this.userid},
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            let arr=response.data.message
            let tool=[]
            for(var i=0;i<arr.length;i++){
               tool.push(arr[i].collectid)
            }
              this.$store.commit("collectIllus",tool)
              
          } 
        })
        .catch((error) => console.log(error));
    },

        //获取用户喜欢的插画
        getLikeIllus(){
      this.$http
        .get(`/user/list/like`,{
            params:{category:"illustration",id:this.userid},
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            let arr=response.data.message
            let tool=[]
            for(var i=0;i<arr.length;i++){
               tool.push(arr[i].likeid)
            }
              this.$store.commit("likeIllus",tool)
              
          } 
        })
        .catch((error) => console.log(error));
    },

        //获取用户关注的人
        getAttention(){
          this.$http
        .get(`/user/list/fllow`,
        {params:{id:this.userid},
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            let arr=response.data.message
            let tool=[]
            for(var i=0;i<arr.length;i++){
               tool.push(arr[i].fllowid)
            }
              this.$store.commit("myAttention",tool)  
              console.log(tool)   
          } 
          
        })
        .catch((error) => console.log(error));
        },

         //获取粉丝
         getFans(){
          this.$http
        .get(`/user/list/fllow`,
        {params:{id:this.userid,sign:"item"},
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            let arr=response.data.message
            let tool=[]
            for(var i=0;i<arr.length;i++){
               tool.push(arr[i].fllowid)
            }
              this.$store.commit("myFans",tool)
              console.log(tool)
          } 
         
        })
        .catch((error) => console.log(error));
        },
 
    
}}
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
	min-width: 180px;
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