<template>
    <div>
          <ul class="index2-items">
            <li
              class="index2-item"
              v-for="(item, index) in toolArr"
              :key="index"
            >
              <div class="index2-avatar">
                <el-image :src="(`http://10.0.0.31:3000/`+item.content[0])" fit="contain" @click="toDetail(item._id)"/>
           
              </div>
     <el-descriptions class="margin-top" :column="2" :colon="false">
      <template slot="title">{{item.title}}</template>
      <template slot="extra">
      <el-button size="small" @click="deleteCollectBook(item)">取消收藏</el-button>
    </template>
     <el-descriptions-item label="描述">{{item.description}}</el-descriptions-item>
     <el-descriptions-item></el-descriptions-item>
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
            toolArr:[]
          }
      },
      computed:mapState(["collectBookArr"]),
  async mounted(){
  await this.getCollectBook();
  await this.getImgUrl();
  
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
    }  console.log(this.toolArr)
   },

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