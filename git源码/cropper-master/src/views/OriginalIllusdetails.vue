<template>
    
    <div class="content">
      <div class="top">
      <div class="content-left">
         <div class="info">   
        <el-avatar :src="details.author_avatar" :size="48" class="avatar"></el-avatar>
        <div class="text">
          <div class="title"><span>{{details.title}}</span></div>
          <div class="author" @click="toAuthor"><span>{{details.author_name}}</span><el-button type="text" size="mini">关注</el-button><el-button type="text" size="mini">已关注</el-button></div>
          </div>
        </div>

 <div class="book">
          <div class="desc">{{details.desc}}</div>
          <div class="image">
          <el-image style="width: 73vw; height: 51.4vw" :src="details.src" /></div>
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
import Suggestion from "../components/Suggestion.vue"
export default {
  name: "Home",
  components: {

    RightInfo,Suggestion
  },
  data(){
    return{
      details:{id:1,title:"背景",desc:"就是一个背景,这里是一些关于插画内容的介绍",thumb:23,src:require("../assets/blush/background.svg"),author_id:12,author_avatar:require("../assets/blush/cat.png"),author_name:"进击的大佬"}
    }
  },
  methods:{
    toAuthor(){
      this.$router.push('/user/upload/compose-illustration/');
    }
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