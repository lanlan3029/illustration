<template>
    <div class="container">
     <router-link to="/"><div class="logo"><el-image :src="logoUrl" fit="contain"></el-image></div></router-link>

         <input type="text" class="search" v-model="searchValue" name="search" autocomplete=off placeholder=" 请输入搜索内容" @keyup.enter="searchFun(searchValue)">

        <div class="user" v-if="isLogin">
            <el-avatar style="background-color: #019AD8" icon="ios-person" class="avatar" :src="userInfo.avatar"/>
             
            <ul class="user-info">
                <li @click="toMyHomePage">我的主页</li>
                  <li @click="toProfile">个人资料</li>
                   <li @click="logout" >退出登陆</li>
            </ul>

      </div> 
      <div v-else  @click="showMask">
        <div style="background-color: #019ad8" class="loginBt">登陆</div>
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
          this.$store.commit("setSearchInput",this.searchValue)
           this.$router.push({
        name: "books",
        query: { keyWord: Value },
      });
     

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
        let res= await this.$http.get(`/user/`+this.userid)
        let toolUser=res.data.message;
        this.$store.commit("setUserInfo",toolUser)
       }catch(err){
        this.$store.commit('showMask')     
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
.container{
    width:100vw;
    height:72px;
    padding:12px 4vh;
    border-bottom: 2px solid #f8f8f9;
    display: flex;
    justify-content: space-between;
    
}
.container .logo{
     height:48px;
     width:152px;
}
.container .logo .el-image{
  height:48px;
     width:152px;
}
.container .search{
    background-color: #f5f6fa;
    border:none;
    width:24vw;
    height:48px;
    line-height:48px;
    padding:0 3vh 0 5vh;
    border-radius:6vh;
    position: relative;
    font-size:16px;
    left:-30vh;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 4%);
background-image: url('../assets/images/search.svg');
 background-position: 12px 12px;
  background-size: 24px;
  background-repeat: no-repeat;
}
.avatar{
    cursor: pointer;
    width:48px;
    height:48px;
}
.user{
    width:6vw;
    height:10vh;
}
.user .user-info{
    display: none;
    position: absolute;
    top:72px;
    right:8px;
    padding:8px;
    list-style: none;
    background-color: rgb(255, 255, 255);
     box-shadow: 2px 2px 2px 2px rgb(0 0 0 / 10%);
     width:196px;
     height:178px;
     transition: .3s;
     border-radius: 4px;
     z-index: 10000;
}
.user:hover .user-info{
    display: block;
}
.user .user-info li{
    width:180px;
    height:54px;
    line-height:54px;
    text-align: center;
    color:#1d1d1f;
    font-size:14px;
    cursor: pointer;
    user-select: none;
    border-radius: 8px;
    
}
.user .user-info li:hover{
    background-color: #FFE567;
}
.loginBt{
    width:48px;
    height:48px;
    border-radius: 4px;
    text-align: center;
    line-height: 48px;
    color:#fff;
    cursor:pointer;
}

</style>