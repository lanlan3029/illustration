<template>
    <div class="container">
     <router-link to="/"><el-avatar style="background-color: #e5defe" shape="square" size="large" >Logo</el-avatar></router-link>

         <input type="text" class="search" name="search" placeholder="请输入搜索内容">

        <div class="user" v-if="hasLogin">
            <el-avatar style="background-color: #e5defe" icon="ios-person" class="avatar"/>
             
            <ul class="user-info">
                <li @click="toMyHomePage">我的主页</li>
                  <li @click="toProfile">个人资料</li>
                  <el-divider></el-divider>
                   <li >退出登陆</li>
            </ul>

      </div> 
      <div v-else  @click="showMask">
        <el-avatar style="background-color: #e5defe" class="avatar" shape="square">登陆</el-avatar>
      </div>
     
      
      
   
    </div>

</template>

<script>

export default {
     data(){
        return{
            hasLogin:true,
            
        }
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
        }
    }
    
}
</script>

<style scoped>
.container{
    width:100vw;
    height:10vh;
    padding:2vh 5vh;
    border-bottom: 2px solid #f8f8f9;
    display: flex;
    justify-content: space-between;
    
}

.container .search{
    background-color: #f5f6fa;
    border:none;
    width:24vw;
    height:6vh;
    line-height:6vh;
    padding:0 3vh 0 5vh;
    border-radius:6vh;
    position: relative;
    font-size:14px;
    left:-30vh;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 4%);
background-image: url('../assets/images/search.svg');
 background-position: 1.5vh 1.5vh;
  background-size: 3vh;
  background-repeat: no-repeat;
}
.avatar{
    cursor: pointer;
    width:6vh;
    height:6vh;
}
.user{
    width:6vw;
    height:10vh;
}
.user .user-info{
    display: none;
    position: absolute;
    top:10vh;
    right:8px;
    padding:8px;
    list-style: none;
    background-color: rgb(255, 255, 255);
     box-shadow: 2px 2px 2px 2px rgb(0 0 0 / 10%);
     width:196px;
     height:224px;
     transition: .3s;
     border-radius: 4px;
     z-index: 100;
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
    background-color: #e5defe ;
}


</style>