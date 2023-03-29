<template>
  
   
    <div class="content">
      <div class="content-left">
        <div class="info">   
        <el-avatar :src="authorDetails.avatar" :size="48" class="avatar"></el-avatar>
        <div class="text">
          <div class="title"><span>{{bookDetails.title}}</span><el-tag size="mini" type="info">{{bookDetails.category}}</el-tag></div>
          <div class="author"><span @click="toAuthor(authorDetails._id)">{{authorDetails.name}}</span><span v-if="(authorDetails._id!=userid)"><el-button type="text" size="mini" v-if="attentionArr.includes(authorDetails._id)">已关注</el-button><el-button type="text" size="mini">关注</el-button>
            </span></div>
          </div>
          </div>
    
         <div class="book">
          <div class="desc">{{bookDetails.desc}}</div>
        <div v-for="(item, index) in bookDetails.content" :key="index" class="item">
        <el-image :src="(`https://static.kidstory.cc/`+item)" style="width:984.3px;height:699px" fit="cover"></el-image>
      </div>
         </div>

        

      <div class="footer">
        <ul>
       <li @click="attention"><el-tooltip class="item" effect="dark" content="关注作者" placement="top">
        <el-avatar :size="56" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar></el-tooltip>
        </li>
        <li> 
          <span v-if="likeBookArr.includes(bookDetails._id)"><i  style="color:#c1b0ff" class="iconfont icon-aixin1"></i>{{bookDetails.like_num}}</span>
                <span v-else><i class="iconfont icon-aixin" @click="likeBookFun(bookDetails._id)" ></i>{{bookDetails.like_num}}</span></li>
        <li>
                <span v-if="collectBookArr.includes(bookDetails._id)" ><i style="color:#c1b0ff" class="iconfont icon-shoucang1"></i>{{bookDetails.collection_num}}</span>
                <span v-else><i class="iconfont icon-shoucang" @click="collectBookFun(bookDetails._id)" ></i>{{bookDetails.collection_num}}</span></li>
         
       </ul>
      </div>
      </div>

      <right-menu />
    </div>
  
</template>

<script>
// @ is an alias to /src


import RightMenu from "../components/RightMenu.vue";

import {mapState} from "vuex"

export default {
  name: "Home",
  components: {

    RightMenu,
  },
  data(){
    return{
      userid:localStorage.getItem("id"),
      id:this.$router.currentRoute.params.bookId,
      authorId:'',
      bookDetails:[],
      authorDetails:[],
    }
  },
  computed:mapState([
        "collectBookDetails",
        "collectBookArr",
        "likeBookArr",
        "attentionArr",
    ]),

  methods:{
   attention(){
    console.log("关注作者")
   },
   getBookDetails(){
    let tool=this.collectBookDetails.filter(item=>{return item._id==this.id}) 
    this.bookDetails=tool[0]
    console.log(this.bookDetails)
    
   },
   //点击喜欢绘本
   likeBookFun(id) {
      this.$http
        .post(`/user/like/`+id,{ownerid:this.userid,type:"book",likeid:id}
        ,{
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          console.log(response)
          if (response.data.desc === "success") {
              //把该插画ID添加到用户已收藏插画数组
              this.$store.commit("likeBook",id)
          } 
        })
        .catch((error) => console.log(error));
    },
//点击收藏绘本
collectBookFun(id) {
      this.$http
        .post(`/user/collect/`+id,{ownerid:this.userid,type:"book",id:id}
        ,{
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          console.log(response)
          if (response.data.desc === "success") {
              //把该插画ID添加到用户已收藏插画数组
              this.$store.commit("collectBook",id)
          } 
        })
        .catch((error) => console.log(error));
    },

   setId(){
      
      this.authorId=this.bookDetails.ownerid
     },
     async getAuthor(){
       try{
         let res=await this.$http.get(`/user/`+this.authorId)
         this.authorDetails=res.data.message 
       } catch(err){
         console.log(err)
       }
     },
   likeit(){
    console.log("点赞")
   },
   collectit(){
    console.log("收藏")
   },
   toAuthor(id){
      this.$router.push({name:'user-g',params:{authorId:id}});
    }
  },
  async mounted(){
    console.log(this.books)
    await this.getBookDetails();
    await this.setId();
    await this.getAuthor();
   

    
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
  overflow-y: scroll;
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
 width:100%;
  height:180px;

}
.content-left .footer ul{
  list-style: none;
     display: flex;
    width:600px;
    justify-content: space-between;
    margin:auto;
    padding:60px 0;
   
}
.content-left .footer ul li{
 cursor:pointer;
  width:56px;
  height:56px;
  font-size:20px;
  line-height: 56px;
 text-align: center;
}
.content-left .footer ul li .iconfont{
  font-size:28px;
  cursor:pointer;
}
.content-left .footer ul li:active{
   animation:zoomOut;
   animation-duration: 1s;
}

</style>