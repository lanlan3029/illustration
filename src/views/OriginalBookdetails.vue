<template>
  
   
    <div class="content">
      <div class="content-left">
        <div class="info">   
        <el-avatar :src="details.author_avatar" :size="48" class="avatar"></el-avatar>
        <div class="text">
          <div class="title"><span>{{details.title}}</span><el-tag size="mini" type="info">{{details.category}}</el-tag></div>
          <div class="author" @click="toAuthor"><span>{{details.author_name}}</span><el-button type="text" size="mini">关注</el-button><el-button type="text" size="mini">已关注</el-button></div>
          </div>
          </div>
    
         <div class="book">
          <div class="desc">{{details.desc}}</div>
        <div v-for="(item, index) in details.src" :key="index" class="item">
        <el-image :src="item" style="width:984.3px;height:699px" fit="cover"></el-image>
      </div>
         </div>

        

      <div class="footer">
        <ul>
       <li @click="attention"><el-tooltip class="item" effect="dark" content="关注作者" placement="top">
        <el-avatar :size="56" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar></el-tooltip>
        </li>
        <li @click="likeit"><el-button type="primary" icon="iconfont icon-dianzan_kuai" circle></el-button></li>
        <li @click="collectit"><el-button type="primary" icon="iconfont icon-shoucang-shoucang" circle></el-button></li>
         
       </ul>
      </div>
      </div>

      <right-menu />
    </div>
  
</template>

<script>
// @ is an alias to /src


import RightMenu from "../components/RightMenu.vue";
export default {
  name: "Home",
  components: {

    RightMenu,
  },
  data(){
    return{
       details:{id:1,title:"《沉香如屑》",category:"益智",desc:"什么烂电视呀明天是国庆肌肉国庆节啊哟房要放七天假怎么玩怎么玩怎么玩，到处查的那么严，怎么玩怎么玩",thumb:23,src:[require("../assets/books/image-12085380--square.jpg"),
        require("../assets/books/image-12085381--square.jpg"),
        require("../assets/books/image-12085382--square.jpg"),
        require("../assets/books/image-12085389--square.jpg"),
        require("../assets/books/image-12086904--square.jpg"),
        require("../assets/books/image-12086905--square.jpg"),
        require("../assets/books/image-12086906--square.jpg")],author_id:12,author_avatar:require("../assets/blush/cat.png"),author_name:"进击的大佬"}
     
    } 
  },
  methods:{
   attention(){
    console.log("关注作者")
   },
   likeit(){
    console.log("点赞")
   },
   collectit(){
    console.log("收藏")
   }
  },
  mounted(){
  
  }
};
</script>
<style scoped>
.content {
  display: flex;
}
.content-left {
  width: 80vw;
  
  height: 88vh;
  display: flex;
  flex-wrap: wrap;
  background-color: #f5f6fa;
  overflow: scroll;
}
.content-left .info {
  display: flex;
  flex-wrap: nowrap;
  padding:16px;
  color:#303133;
  width:984.3px;
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

.content-left .info .text{

  font-size:16px;
  margin-left:16px;
  
}
.content-left .info .text .title{
  font-weight:700;
  user-select: none;
  height:24px;
  line-height: 24px;
}

.content-left .info .text .author{
   font-size:14px;
   cursor:pointer
}
.content-left .info .text .author span{
  margin-right:16px;
}
.item{
  width: 984.3px;
  height: 699px;
}
.content-left .footer{
  width:984.3px;
  height:180px;

}
.content-left .footer ul{
  list-style: none;
     display: flex;
    width:400px;
    justify-content: space-between;
    margin:auto;
    align-items: center;
    padding:60px 0;
}
.content-left .footer ul li{
 
  width:56px;
  height:56px;
 
}
.content-left .footer ul li:active{
   animation:zoomOut;
   animation-duration: 2s;
}

</style>