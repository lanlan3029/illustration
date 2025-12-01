<template>
  <div>
        <el-menu
            class="navigation"
            mode="horizontal"
            router
            :default-active="$route.fullPath"
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
            :ellipsis="false"
        >
            <!-- Logo 居左 -->
            <el-menu-item index="logo" class="logo-item" @click="$router.push('/')">
                <el-image :src="logoUrl" fit="contain" class="logo-image"></el-image>
            </el-menu-item>

            <!-- 中间菜单项 -->
            <el-menu-item index="/">
                <span>AI插画</span>
            </el-menu-item>

            <el-submenu index="/creation">
                <template #title>
                    <span>创作</span>
                </template>
                <el-menu-item index="/create-character">创作角色</el-menu-item>
                <el-menu-item index="/create-group-images">创作组图</el-menu-item>
                <el-menu-item index="/creation">创作插画</el-menu-item>
                <el-menu-item index="/user/upload/compose-illustration">合成绘本</el-menu-item>
            </el-submenu>

            <el-menu-item index="/user/upload">
                <span>上传</span>
            </el-menu-item>

            <el-menu-item index="/books">
                <span>原创绘本</span>
            </el-menu-item>

            <el-menu-item index="/utility-tools">
                <span>实用工具</span>
            </el-menu-item>

         

      

           
            <el-menu-item index="search" class="search-item">
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
            </el-menu-item>

            <!-- 用户登录/头像 -->
            <el-menu-item v-if="!isLogin" class="login-item" @click="showMask">
                <div class="loginBt">登陆</div>
            </el-menu-item>

            <el-submenu v-else index="user-menu" class="user-menu-item" :show-timeout="0" :hide-timeout="0">
                <template #title>
                    <div class="user-header-wrapper">
                        <!-- 积分和Pro显示框 -->
                        <div class="points-pro-box" >
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
                        <el-avatar :src="userInfo.avatar" :size="40"/>
                    </div>
                </template>
                    <el-menu-item index="user-home" @click="toMyHomePage">
                    <i class="iconfont icon-a-collection"></i>
                    <span>我的创作</span>
                </el-menu-item>
                <el-menu-item index="user-profile" @click="toProfile">
                    <i class="iconfont icon-zhanghu"></i>
                    <span>账户设置</span>
                </el-menu-item>
                <el-menu-item index="member-recharge" @click="toMemberRecharge">
                    <i class="iconfont icon-dingyue"></i>
                    <span>订阅管理</span>
                </el-menu-item>
                <el-menu-item index="user-logout" @click="logout">
                    <i class="iconfont icon-tuichudenglu-"></i>
                    <span>退出登陆</span>
                </el-menu-item>
                <el-menu-item index="contact-us" @click="contactUs">
                    <i class="iconfont icon-lianxiwomen1"></i>
                    <span>联系我们</span>
                </el-menu-item>
            </el-submenu>
        </el-menu>

      
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
        }
    },
    computed:mapState([
        "userInfo","isLogin","fansArr","attentionArr","searchArry"
    ]),
 async mounted(){
    await this.tokenFail();
    await this.getUser();
    await this.getCollectionBook();
    await this.getLikeBook();
    await this.getCollectionIllus();
    await this.getLikeIllus();
    await this.getAttention();
    await this.getFans();
    },
   
    methods:{
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
/* 菜单高度 */
.el-menu--horizontal {
  --el-menu-horizontal-height: 60px;
  display: flex;
  align-items: center !important;
  justify-content: space-between;
  padding: 0 80px;

  overflow: visible !important;
  position: relative;
  box-sizing: border-box !important;
}

/* Logo和中间菜单项容器 */
.el-menu--horizontal > .el-menu-item:first-child,
.el-menu--horizontal > .el-menu-item:nth-child(n+2):not(.search-item):not(.login-item):not(.points-pro-item),
.el-menu--horizontal > .el-submenu:nth-child(n):not(.user-menu-item) {
  order: 1;
}

/* 搜索、登录、用户菜单居右 */
.el-menu--horizontal > .el-menu-item.search-item {
  order: 2;
  margin-left: 100px !important;
}

.el-menu--horizontal > .el-menu-item.login-item {
  order: 2;
  margin-left: auto;
}

.el-menu--horizontal > .el-submenu.user-menu-item {
  order: 2;
  margin-left: auto;
  margin-right: 0;
}

.navigation >>> .el-submenu {
  min-width: 120px;  /* 或其他值 */
}
/* 搜索框样式 */
.search-item {
  position: relative;
  margin-right: 10px;
}

/* 搜索框菜单项垂直居中 */
.navigation >>> .el-menu-item.search-item {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 搜索框选中时不改变背景色 */
.navigation >>> .el-menu-item.search-item.is-active,
.navigation >>> .el-menu-item.search-item:hover {
  background-color: transparent !important;
}

/* 搜索框容器 */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

/* 搜索图标样式 - 居左，垂直居中 */
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

/* Logo 样式 */
.navigation >>> .el-menu-item.logo-item {
  cursor: pointer;
  
}

.navigation >>> .el-menu-item.logo-item.is-active,
.navigation >>> .el-menu-item.logo-item:hover {
  background-color: transparent !important;
}

.logo-image {
  height: 36px;
  width: auto;
  max-width: 120px;
  transition: opacity 0.3s;
}

.logo-image:hover {
  opacity: 0.8;
}
.search {
  width: 200px;
  height: 32px;
  padding: 0 15px 0 40px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.search::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search:focus {
  width: 240px;
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 登录按钮菜单项垂直居中 */
.navigation >>> .el-menu-item.login-item {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 登录按钮样式优化 - 简洁美观 */
.login-item .loginBt {
  padding: 8px 20px;
  height: 36px;
  line-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 18px;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.15);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.login-item:hover .loginBt {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 登录按钮选中时不改变背景色 */
.navigation >>> .el-menu-item.login-item.is-active,
.navigation >>> .el-menu-item.login-item:hover {
  background-color: transparent !important;
}

/* 更具体的选择器，确保覆盖所有情况 */
.el-menu--horizontal > .el-menu-item.login-item.is-active,
.el-menu--horizontal > .el-menu-item.login-item:hover {
  background-color: transparent !important;
}

/* 用户菜单样式优化 */
.user-menu-item {
  margin-left: 10px;
}

/* 确保菜单容器固定高度，子菜单不影响高度 */
.navigation {
  height: 60px !important;
  overflow: visible !important;
  position: relative;
}

.navigation >>> .el-menu--horizontal {
  height: 60px !important;
  max-height: 60px !important;
  overflow: visible !important;
}

/* 确保所有菜单项和子菜单标题高度固定且对齐 */
.navigation >>> .el-menu-item:not(.search-item):not(.login-item),
.navigation >>> .el-submenu__title {
  height: 60px !important;
  line-height: 60px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 20px !important;
  margin: 0 !important;
  vertical-align: middle !important;
  box-sizing: border-box !important;
}

/* 确保子菜单标题内的文字垂直居中 */
.navigation >>> .el-submenu__title > span {
  display: inline-block !important;
  vertical-align: middle !important;
  line-height: normal !important;
}

/* search-item 单独设置，允许自定义 margin */
.navigation >>> .el-menu-item.search-item {
  height: 60px !important;
  line-height: 60px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  vertical-align: top !important;
  box-sizing: border-box !important;
}

/* 确保菜单项内容垂直居中 */
.navigation >>> .el-menu-item > *,
.navigation >>> .el-submenu__title > * {
  vertical-align: middle !important;
}

/* 确保子菜单标题内的内容对齐 */
.navigation >>> .el-submenu__title {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 确保子菜单弹出层不影响菜单高度 */
.navigation >>> .el-submenu__popper {
  z-index: 9999 !important;
  position: absolute !important;
}

.navigation >>> .el-menu--popup {
  position: absolute !important;
}

.user-menu-item .el-avatar {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.user-menu-item:hover .el-avatar {
  transform: scale(1.1);
}

/* 用户头部包装器 - 包含积分框和头像 */
.user-header-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 用户头部包装器 - 包含积分框和头像 */
.user-header-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 积分和Pro显示框样式 */
.points-pro-box {
  cursor: default !important;
  pointer-events: auto !important;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  gap: 8px;
}

.points-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.points-icon-small {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.points-value {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.pro-section {
  display: flex;
  align-items: center;
}

.pro-text {
  font-size: 16px;
  font-weight: 600;
  color: #ffd04b;
  line-height: 1;
  letter-spacing: 0.5px;
}

/* 会员信息对话框样式 */
.member-info-content {
  padding: 20px 0;
}

.member-info-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.member-avatar {
  flex-shrink: 0;
}

.member-basic-info {
  flex: 1;
}

.member-basic-info h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #303133;
}

.member-badge {
  display: inline-block;
}

.pro-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #ffd04b 0%, #ffb347 100%);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.member-points-info {
  margin-bottom: 20px;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.points-icon-large {
  width: 48px;
  height: 48px;
}

.points-details {
  flex: 1;
}

.points-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.points-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.points-tip {
  font-size: 14px;
  color: #606266;
  text-align: center;
}

.points-tip img {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  margin: 0 2px;
}

.member-actions {
  margin-top: 20px;
}

/* 会员信息对话框样式 */
.member-info-content {
  padding: 20px 0;
}

.member-info-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.member-avatar {
  flex-shrink: 0;
}

.member-basic-info {
  flex: 1;
}

.member-basic-info h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #303133;
}

.member-badge {
  display: inline-block;
}

.pro-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #ffd04b 0%, #ffb347 100%);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.member-points-info {
  margin-bottom: 20px;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.points-icon-large {
  width: 48px;
  height: 48px;
}

.points-details {
  flex: 1;
}

.points-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.points-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.points-tip {
  font-size: 14px;
  color: #606266;
  text-align: center;
}

.points-tip img {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  margin: 0 2px;
}

.member-actions {
  margin-top: 20px;
}

/* 用户菜单选中时不改变背景色 */
.navigation >>> .el-submenu.user-menu-item.is-active .el-submenu__title,
.navigation >>> .el-submenu.user-menu-item .el-submenu__title:hover {
  background-color: transparent !important;
}

/* 用户菜单下拉项样式：图标和文字间距、大小 */
.navigation >>> .el-menu--popup .el-menu-item {
  display: flex !important;
  align-items: center !important;
  padding: 0 20px !important;
  height: 40px !important;
  line-height: 40px !important;
}

.navigation >>> .el-menu--popup .el-menu-item i.iconfont {
  font-size: 16px !important;
  margin-right: 12px !important;
  width: 16px !important;
  text-align: center !important;
  flex-shrink: 0 !important;
  display: inline-block !important;
  color: ffffff !important; /* 图标颜色，可以根据需要修改 */
}

/* 更具体的选择器，确保样式生效 */
.navigation >>> .el-menu--popup .el-menu-item > i.iconfont {
  margin-right: 12px !important;
  color: #ffffff !important; /* 图标颜色 */
}

/* 全局样式，确保覆盖 Element UI 默认样式 */
.el-menu--popup .el-menu-item i.iconfont {
  margin-right: 12px !important;
  color: #ffffff !important; /* 图标颜色 */
}

.navigation >>> .el-menu--popup .el-menu-item span {
  font-size: 14px !important;
  flex: 1 !important;
}

/* 使用 gap 属性来设置间距（如果 flexbox 支持） */
.navigation >>> .el-menu--popup .el-menu-item {
  gap: 12px !important;
}

/* 如果 gap 不支持，使用更强制的方式 */
.navigation >>> .el-menu--popup .el-menu-item i + span {
  margin-left: 12px !important;
}

/* 增大 menu-item 的宽度 */
.navigation >>> .el-menu-item:not(.logo-item):not(.search-item):not(.login-item) {
  padding: 0 24px !important;
  min-width: 120px;
}



/* 移除所有菜单项的底部边框 */
.navigation >>> .el-menu-item,
.navigation >>> .el-submenu__title {
  border-bottom: none !important;
}

/* 移除选中菜单项的底部边框和伪元素 */
.navigation >>> .el-menu-item.is-active {
  border-bottom: none !important;
}

.navigation >>> .el-menu-item.is-active::after,
.navigation >>> .el-menu-item::after {
  display: none !important;
  content: none !important;
}

/* 移除子菜单标题的底部边框 */
.navigation >>> .el-submenu.is-active .el-submenu__title,
.navigation >>> .el-submenu .el-submenu__title {
  border-bottom: none !important;
}

.navigation >>> .el-submenu .el-submenu__title::after {
  display: none !important;
  content: none !important;
}

/* 修复子菜单选中时的背景高度和颜色 */
.navigation >>> .el-submenu.is-active .el-submenu__title {
  height: 60px !important;
  line-height: 60px !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.navigation >>> .el-submenu .el-submenu__title:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  height: 60px !important;
  line-height: 60px !important;
}
</style>

<style>
/* 全局样式：移除所有菜单项的底部边框 */
.el-menu--horizontal > .el-menu-item {
  border-bottom: none !important;
}

.el-menu--horizontal > .el-menu-item::after {
  display: none !important;
  content: none !important;
}

.el-menu--horizontal > .el-menu-item.is-active {
  border-bottom: none !important;
}

.el-menu--horizontal > .el-menu-item.is-active::after {
  display: none !important;
  content: none !important;
}

.el-menu--horizontal > .el-submenu .el-submenu__title {
  border-bottom: none !important;
}

.el-menu--horizontal > .el-submenu .el-submenu__title::after {
  display: none !important;
  content: none !important;
}

/* 确保子菜单标题没有白色背景 */
.el-menu--horizontal > .el-submenu .el-submenu__title {
  background-color: transparent !important;
  padding: 0 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.el-menu--horizontal > .el-submenu.is-active .el-submenu__title {
  border-bottom: none !important;
  height: 60px !important;
  line-height: 60px !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  padding: 0 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 用户菜单选中时不显示背景色 */
.el-menu--horizontal > .el-submenu.user-menu-item.is-active .el-submenu__title,
.el-menu--horizontal > .el-submenu.user-menu-item .el-submenu__title:hover {
  background-color: transparent !important;
}

.el-menu--horizontal > .el-submenu.is-active .el-submenu__title::after {
  display: none !important;
  content: none !important;
}

.el-menu--horizontal > .el-submenu .el-submenu__title:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  height: 60px !important;
  line-height: 60px !important;
}

/* 当子菜单项被选中时，父菜单的样式 */
.el-menu--horizontal > .el-submenu.is-opened .el-submenu__title,
.el-menu--horizontal > .el-submenu.is-opened.is-active .el-submenu__title {
  background-color: rgba(255, 255, 255, 0.1) !important;
  height: 60px !important;
  line-height: 60px !important;
  padding: 0 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-bottom: none !important;
}

/* 确保子菜单标题内的文字垂直居中 */
.el-menu--horizontal > .el-submenu .el-submenu__title > span {
  display: inline-block !important;
  vertical-align: middle !important;
  line-height: normal !important;
}

/* 覆盖 Element UI 可能添加的白色背景 */
.el-menu--horizontal > .el-submenu.is-opened .el-submenu__title,
.el-menu--horizontal > .el-submenu.is-active.is-opened .el-submenu__title {
  background-color: rgba(255, 255, 255, 0.1) !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* 用户菜单下拉项图标间距 - 全局样式，确保覆盖 Element UI 默认样式 */
.el-menu--popup .el-menu-item i.iconfont {
  margin-right: 12px !important;
  color: #ffffff !important; /* 图标颜色 */
}

.el-menu--popup .el-menu-item > i.iconfont {
  margin-right: 12px !important;
  color: #ffffff !important; /* 图标颜色 */
}
</style>