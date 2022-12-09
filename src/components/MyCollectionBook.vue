<template>
    <div>
      <ul class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in collectBookDetails"
            :key="index"
          >
            <div class="index2-avatar">
              <el-image :src="(`http://119.45.172.191:3000/`+item.content[0])" class="image" fit="cover" @click="goBookDetails(item._id)"/>
            </div>
   <el-descriptions :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    <template slot="extra">
      <el-button size="small" @click="cancelCollectBook(item._id)">取消收藏</el-button>
    </template>
   <el-descriptions-item span="2" label="描述">{{item.description}}</el-descriptions-item>
   
    <el-descriptions-item label="获赞">{{item.like_num}}</el-descriptions-item>
     <el-descriptions-item label="收藏">{{item.collection_num}}</el-descriptions-item>
  </el-descriptions> 
          </li>
        </ul>
        </div>
  </template>
  
  <script>
  import {mapState} from "vuex"

  export default {
      data(){
          return{
            id:localStorage.getItem("id"),
            toolArr:[],
            
          }
      },
      computed:mapState(["collectBookArr","collectBookDetails"]),

  async mounted(){
  await this.getCollectBook();
  await this.getImgUrl();
  await this.setBooks();
  console.log(this.toolArr)
  
  },
      methods:{
        async getCollectBook(){
        for(var i=0;i<this.collectBookArr.length;i++){
          try{
            let res=await this.$http.get(`/book/`+this.collectBookArr[i])
            this.toolArr.push(res.data.message)
          } catch(err){
            console.log(err)
          }
          
        }
      },

      async getImgUrl(){
    for(var i=0;i<this.toolArr.length;i++){
      //获取绘本图片ID
      let tool=this.toolArr[i].content
     
      //遍历绘本图片ID，替换成图片URL
      for(var j=0;j<tool.length;j++){
        try{
          let res=await this.$http.get(`/ill/`+tool[j])
          this.toolArr[i].content[j]=res.data.message.content    
        } catch(err){
          console.log(err)
        }
      } 
    } 
   },
   setBooks(){
this.$store.commit("getCollectBook",this.toolArr)
   },

cancelCollectBook(id){
  this.$http
        .delete(`/user/list/collect?id=`+id,
        {
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        },
    )
        .then((response) => {
          console.log(this.attentionArr)
          if (response.data.desc === "success") {
             window.location.reload()
          } 
        })
        .catch((error) => console.log(error));
},
   goBookDetails(id){
    this.$router.push({name:'collect-bookdetails',params:{bookId:id}});
   }

      }
  }
  </script>
  
  <style scoped>
  

.index2-items {
    list-style: none;
    width: 68vw;
  }
 .index2-items .index2-item {
    height: 208px;
    padding:16px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
     
      border-bottom: 1px solid rgb(238, 238, 238);
  }
 .index2-items .index2-item .index2-avatar {
    width: 250px;
    height: 176px;
    margin-right: 16px;
  }
  .index2-items .index2-item .index2-avatar .el-image{
    width: 250px;
    height: 176px;
    cursor: pointer;
  }
.index2-items .index2-item .index2-center {
    width: 500px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 144px;
  }
.index2-items .index2-item .index2-center .index2-name p:nth-child(2) {
    font-size: 14px;
  }
  
.index2-items .index2-item .index2-center.index2-icon {
    display: flex;
    height:18px;
    justify-content: space-between;
    font-size: 14px;
    width:500px;
  }
.index2-items .index2-item .index2-center.index2-icon div {
    display: inline-block;
    width: 60px;
  }
  
  </style>