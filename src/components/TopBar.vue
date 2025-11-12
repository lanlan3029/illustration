<template>
    <div class="container">
        <router-link to="/" class="logo-link">
            <div class="logo">
                <el-image :src="logoUrl" fit="contain"></el-image>
            </div>
        </router-link>

        <el-menu
            class="navigation"
            mode="horizontal"
            router
            :default-active="$route.fullPath"
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
        >
            <el-menu-item index="/">
                <span>AI榜单</span>
            </el-menu-item>

            <el-submenu index="/creation">
                <template #title>
                    <span>创作</span>
                </template>
                <el-menu-item index="/create-character">创作角色</el-menu-item>
                <el-menu-item index="/creation">创作插画</el-menu-item>
                <el-menu-item index="/user/upload/compose-illustration">合成绘本</el-menu-item>
                
            </el-submenu>

            <el-menu-item index="/user/upload/upload-element">
                <span>上传图元</span>
            </el-menu-item>

            <el-menu-item index="/books">
                <span>原创绘本</span>
            </el-menu-item>

            <el-menu-item index="/connection">
                <span>关于我们</span>
            </el-menu-item>
        </el-menu>

        <div class="right-section">
            <input type="text" class="search" v-model="searchValue" name="search" autocomplete=off placeholder="请输入搜索内容" @keyup.enter="searchFun(searchValue)">

            <div class="user" v-if="isLogin">
                <el-avatar style="background-color: #019AD8" icon="ios-person" class="avatar" :src="userInfo.avatar"/>
                 
                <ul class="user-info">
                    <li @click="toMyHomePage">我的主页</li>
                    <li @click="toProfile">个人资料</li>
                    <li @click="logout">退出登陆</li>
                </ul>
            </div> 
            <div v-else @click="showMask">
                <div class="loginBt">登陆</div>
            </div>
        </div>
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
.container {
    width: 100vw;
    height: 60px;
    padding: 12px 40px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #545c64;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1000;
}

.logo-link {
    text-decoration: none;
    flex-shrink: 0;
}

.logo {
    height: 48px;
    width: 152px;
    transition: opacity 0.3s;
}

.logo:hover {
    opacity: 0.8;
}

.logo .el-image {
    height: 48px;
    width: 152px;
}

.navigation {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
    margin: 0 40px;
    border-bottom: none;
    height: 60px;
}

/* 确保 Element UI 菜单项垂直居中 */
.navigation >>> .el-menu-item,
.navigation >>> .el-submenu__title {
    display: flex;
    align-items: center;
    height: 60px;
    line-height: 60px;
}

.navigation >>> .el-submenu__title span {
    display: flex;
    align-items: center;
}

.nav-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    text-decoration: none;
    color: #1c345e;
    font-size: 15px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.nav-item:hover {
    background-color: #f5f6fa;
    color: #019AD8;
}

.nav-item.active {
    background-color: #e6f7ff;
    color: #019AD8;
}


.right-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}

.search {
    background-color: #f5f6fa;
    border: none;
    width: 280px;
    height: 40px;
    line-height: 40px;
    padding: 0 16px 0 44px;
    border-radius: 20px;
    font-size: 14px;
    transition: all 0.3s ease;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
    background-image: url('../assets/images/search.svg');
    cursor: text;
    background-position: 14px center;
    background-size: 20px;
    background-repeat: no-repeat;
    outline: none;
}

.search:focus {
    width: 320px;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #019AD8;
}

.avatar {
    cursor: pointer;
    width: 40px;
    height: 40px;
    transition: transform 0.3s ease;
}

.avatar:hover {
    transform: scale(1.05);
}

.user {
    position: relative;
    display: flex;
    align-items: center;
}

.user .user-info {
    display: none;
    position: absolute;
    top: 52px;
    right: 0;
    padding: 8px;
    list-style: none;
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 140px;
    border-radius: 8px;
    transition: all 0.3s ease;
    z-index: 10000;
    margin-top: 8px;
}

.user:hover .user-info {
    display: block;
}

.user .user-info li {
    width: 100%;
    height: 44px;
    line-height: 44px;
    text-align: center;
    color: #1d1d1f;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    border-radius: 6px;
    transition: background-color 0.2s ease;
}

.user .user-info li:hover {
    background-color: #f0f9ff;
    color: #019AD8;
}

.loginBt {
    width: 80px;
    height: 40px;
    border-radius: 20px;
    text-align: center;
    line-height: 40px;
    color: #fff;
    background-color: #019AD8;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(1, 154, 216, 0.2);
}

.loginBt:hover {
    background-color: #0180b8;
    box-shadow: 0 4px 8px rgba(1, 154, 216, 0.3);
    transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1400px) {
    .navigation {
        margin: 0 20px;
    }
    
    .nav-item {
        padding: 8px 12px;
        font-size: 14px;
    }
    
    .search {
        width: 240px;
    }
}

@media (max-width: 1200px) {
    .container {
        padding: 12px 24px;
    }
    
    .navigation {
        gap: 4px;
        margin: 0 12px;
    }
    
    .nav-item span {
        display: none;
    }
    
    .nav-item {
        padding: 8px;
        min-width: 40px;
        justify-content: center;
    }
    
    .search {
        width: 200px;
    }
}
</style>

<style>
/* 全局样式：调整 Element UI 子菜单下拉框宽度 */
/* 因为下拉菜单可能附加到body，需要使用全局样式 */
.el-menu--popup {
    min-width: 150px !important;
    max-width: 160px !important;
    padding: 4px 0 !important;
}

.el-menu--popup .el-menu-item {
    height: 40px !important;
    line-height: 40px !important;
    padding: 0 20px !important;
    font-size: 14px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}
</style>