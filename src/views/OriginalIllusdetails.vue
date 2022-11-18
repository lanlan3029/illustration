<template>
    
    <div class="content">
      <div class="top">
      <div class="content-left">
         <div class="info">   
        <el-avatar :src="authorDetails.avatar" :size="48" class="avatar"></el-avatar>
        <div class="text">
          <div class="title"><span>{{illsDetails.title}}</span></div>
          <div class="author" ><span @click="toAuthor(illsDetails.ownerid)">{{authorDetails.name}}</span>
            <span v-if="!hasLogin"><el-button type="text" size="mini" @click="toLogin">关注</el-button></span>
            <span v-if="hasLogin"><el-button type="text" size="mini">关注</el-button><el-button type="text" size="mini">已关注</el-button></span></div>
          </div>
        </div>

 <div class="book">
          <div class="desc">{{illsDetails.description}}</div>
          <div class="image">
          <el-image style="width: 73vw; height: 51.4vw" :src="`http://10.0.0.31:3000/`+illsDetails.content" fit="contain" /></div>
      </div>
         </div>


     
      

      <right-info />
      </div>
      <suggestion />
    </div>
</template>

<script>
// @ is an alias to /src



import RightInfo from "../components/RightInfo.vue";
import Suggestion from "../components/Suggestion.vue";
import {mapState} from 'vuex'
export default {
  name: "Home",
  components: {

    RightInfo,Suggestion
  },
  data(){
    return{
     hasLogin:this.isLogin,
     id:this.$router.currentRoute.params.illId,
      illsDetails:[],
      authorDetails:[],
      authorId:'',
    }
  },
  computed:mapState([
    "editionIllus","isMask","isLogin"]),
  methods:{
    async getIllsDetails(){ 
      try{  
        let res=await this.$http.get(`/ill/`+this.id)
        this.illsDetails=res.data.message 
      } catch(err){
        console.log(err)
      }
    
    },
    setId(){
      
     this.authorId=this.illsDetails.ownerid
    },
    async getAuthor(){
      try{
        let res=await this.$http.get(`/user/`+this.authorId)
        this.authorDetails=res.data.message 
      } catch(err){
        console.log(err)
      }
    },
    attention(){
    console.log("关注作者")
   },
   likeit(){
    console.log("点赞")
   },
   collectit(){
    console.log("收藏")
   },
    toAuthor(id){
      this.$router.push({name:'user-g',params:{authorId:id}});
    },
    toLogin(){
      this.$store.commit("showMask",true)
      this.$store.commit("showLoginBox",true)
    }
  },
  async mounted(){
     await this.getIllsDetails(); 
     await this.setId();
     await this.getAuthor();
     console.log(this.isLogin)
  }

};
</script>
<style scoped>
.content {
  width:100vw;
  background-color: #f5f6fa;
   color:#333;
    margin:0;
    height:90vh;
    overflow-y: scroll;
}
.top{
  width:100vw;
  min-height:90vh;
  margin:0;
  display: flex;
  justify-content: flex-start;
}
.content-left {
  width: 80vw;
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  
}
.content-left .info {
  display: flex;
  flex-wrap: nowrap;
   width:984.3px;
  padding:16px;
  color:#606266;
  margin:auto;
 

}
.content-left .book{
  width: 984.3px;
  min-height: 200px;
  background-color: #fff;
  margin:auto;
  font-size:20px;
  font-weight: 600;
}
.content-left .book .desc{
  width:100%;
  min-height:116px;
  padding:48px;
  font-size: 20;
  letter-spacing: 2px;
  background-color: #fff;
  color:#1c345e;
  
}
.content-left .info .avatar{
  cursor: pointer;
}
.content-left .image{
  background-color: #fff;
  margin-top:8px;
  
}
.content-left .info .text{
  font-size:16px;
  margin-left:16px;
  font-weight: bold;
}
.content-left .info .text .title{
   font-weight:700;
  user-select: none;
  height:24px;
  line-height: 24px;
}

.content-left .info .text .author{
   font-size:14px;
   font-weight:400;
   cursor:pointer
}
.content-left .info .text .author span{
  margin-right: 16px;
}

.el-descriptions-item__cell{
  padding:16px;
  font-size:18px;
}
</style>