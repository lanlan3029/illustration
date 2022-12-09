<template>
  <div class="container">
    <div class="left">
     
      <el-menu
        :default-active="activeIndex"
        class="el-menu-demo"
        mode="horizontal"
        @select="handleSelect"
      >
        <el-menu-item index="1">主页</el-menu-item>
        <el-menu-item index="2">我的插画</el-menu-item>
        <el-menu-item index="3">我的绘本</el-menu-item>
        <el-menu-item index="4">已收藏插画</el-menu-item>
        <el-menu-item index="5">已收藏绘本</el-menu-item>
        <el-menu-item index="6">我的关注</el-menu-item>
        <el-menu-item index="7">我的粉丝</el-menu-item>
      </el-menu>

      <div v-if="activeIndex == 1">
        <div class="illustration">
          <div class="title">
            <p>我的插画</p>
            <el-link :underline="false" @click="goMyIllu"
              >更多<i class="el-icon-d-arrow-right el-icon--right"></i>
            </el-link>
          </div>
          <ul class="illu-items">
            <li
              class="illu-item"
              v-for="(item, index) in illArr.slice(0, 4)"
              :key="index"
            >
              <el-image
                :src="(`http://119.45.172.191:3000/`+item.content)"
                style="width: 14vw; height: 9.85vw;cursor:pointer"
                fit="contain"
                @click="goIllusDetails(item._id)"
              ></el-image>
            </li>
          </ul>
        </div>

        <div class="books">
          <div class="title">
            <p>我的绘本</p>
            <el-link :underline="false" @click="goMybooks"
              >更多<i class="el-icon-d-arrow-right el-icon--right"></i>
            </el-link>
          </div>
          <ul class="books-items">
            <li
              class="books-items"
              v-for="(item, index) in myBooks.slice(0, 4)"
              :key="index"
            >
              <el-image
                :src="(`http://119.45.172.191:3000/`+item.content[0])"
                style="width: 14vw; height: 9.85vw;cursor:pointer"
                fit="contain"
                @click="goBookDetails(item._id)"
              ></el-image>
            </li>
          </ul>
        </div>
      </div>
<!-- 我的插画 -->
      <div v-if="activeIndex == 2" class="index2">
        <ul class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in illArr"
            :key="index"
          >
            <div class="index2-avatar">
              <el-image
                :src="(`http://119.45.172.191:3000/`+item.content)"
                style="width: 250px; height: 176px;cursor:pointer"
                fit="contain"
                @click="goIllusDetails(item._id)"
              ></el-image>
            </div>
   <el-descriptions :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    <template slot="extra">
      <el-button size="small" @click="goEdition(item)">编辑</el-button>
    </template>
   <el-descriptions-item span="2" label="描述">kooriookami</el-descriptions-item>
    <el-descriptions-item label="获赞">1289</el-descriptions-item>
    <el-descriptions-item label="收藏">89</el-descriptions-item>
    <el-descriptions-item v-if="(item.status==0)" label="状态"><el-tag type="warning" size="mini">待审核</el-tag></el-descriptions-item>
    <el-descriptions-item v-if="(item.status==1)" label="状态"><el-tag type="success" size="mini">审核通过</el-tag></el-descriptions-item>
  </el-descriptions> 
          </li>
        </ul>
      </div>
<!-- 我的绘本 -->
      <div v-if="activeIndex == 3" class="index2">
        <ul class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in myBooks"
            :key="index"
          >
            <div class="index2-avatar">
              <el-image
                :src="(`http://119.45.172.191:3000/`+item.content[0])"
                style="width: 250px; height: 176px;cursor:pointer"
                fit="contain"
                @click="goBookDetails(item._id)"
              ></el-image>
            </div>
   <el-descriptions :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    <template slot="extra">
      <el-button size="small" @click="goBookEdition(item)">编辑</el-button>
    </template>
   <el-descriptions-item span="2"  label="描述">kooriookami</el-descriptions-item>
    <el-descriptions-item label="获赞">1289</el-descriptions-item>
     <el-descriptions-item label="收藏">89</el-descriptions-item>
     <el-descriptions-item v-if="(item.status==0)" label="状态"><el-tag type="warning" size="mini">待审核</el-tag></el-descriptions-item>
    <el-descriptions-item v-if="(item.status==1)" label="状态"><el-tag type="success" size="mini">审核通过</el-tag></el-descriptions-item>
  </el-descriptions> 
          </li>
        </ul>
      </div>

<!-- 已收藏插画 -->
      <div v-if="activeIndex == 4" class="index2">
       <my-collection-ill/>
      </div>

<!-- 已收藏绘本 -->
      <div v-if="activeIndex == 5" class="index5">
       <my-collection-book />
      </div>

<!-- 我的关注 -->
      <div v-if="activeIndex == 6" class="index2">
       <my-attention />    
      </div>

<!-- 我的粉丝 -->
      <div v-if="activeIndex == 7" class="index2">
       <my-fans />    
      </div>

    </div>
    <div class="right">
      <ul class="message">
        <li>新增关注<span>12</span></li>
        <li>新增赞数<span>122</span></li>
        <li>总粉丝数<span>1224</span></li>
        <li>总获赞数<span>17892</span></li>
      </ul>
      <ul class="create">
        <li @click="goCreation()">
          <i class="el-icon-edit"></i><span>创作插画</span>
        </li>
        <li @click="goLocalIllus()">
          <i class="el-icon-picture-outline"></i><span>上传本地插画</span>
        </li>
        <li @click="goCompose()">
          <i class="el-icon-reading"></i><span>合成绘本</span>
        </li>
       
        <li @click="goHome()">
          <i class="el-icon-house"></i><span>返回首页</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import {mapState} from "vuex"
import MyCollectionIll from '../components/MyCollectionIll.vue'
import MyCollectionBook from '../components/MyCollectionBook.vue'
import MyAttention from '../components/MyAttention.vue'
import MyFans from '../components/MyFans.vue'
export default {
  components:{
MyCollectionIll,MyCollectionBook,MyAttention,MyFans
  },
  data() {
    return {
      id:localStorage.getItem("id"),
      activeIndex: "1",
      illArr:[],
      
      toolArr:[],
     
    };
  },
  computed:mapState([
        "myBooks"
    ]),
  methods: {
    handleSelect(key, keyPath) {
      this.activeIndex = key;
      console.log(key, keyPath);
    },
    goCompose() {
      this.$router.push("/user/upload/compose-illustration/");
    },
    goCreation() {
      this.$router.push("/creation");
    },
   goLocalIllus(){
       this.$router.push("/user/upload/upload-local-illustration");
   },
   goHome(){
       this.$router.push("/");
   },
    goIllusDetails(id) {
      this.$router.push({name:'user-illusdetails',params:{illId:id}});
    },
    goBookDetails(id){
      this.$router.push({name:'user-bookdetails',params:{bookId:id}});
    },
    goEdition(item){
        this.$store.commit("editionIllusFun",item)
        this.$router.push({name:'edition-illus',params:item._id});
    },
    goBookEdition(item){
      this.$store.commit("editionBookFun",item)
        this.$router.push("/user/upload/editionbook");
    },
    goMyIllu(){
      this.activeIndex=2
    },
    goMybooks(){
      this.activeIndex=3
    },
    //获取我的插画
    async getIll(){
      try{
          let res=await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=`+this.id)
          this.illArr=res.data.message
          console.log(this.illArr)
        } catch(err){
          console.log(err)
        }
    },
   // 获取我的绘本
    async getBook(){
      try{
          let res=await this.$http.get(`/book/?sort_param=createdAt&sort_num=desc&ownerid=`+this.id)
          this.toolArr=res.data.message   
        } catch(err){
          console.log(err)
        }
    },
    //获取我的绘本的图片
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
    this.$store.commit("addMyBooks",this.toolArr)  
   },

 

  },
  async mounted(){
    await this.getIll();
    await this.getBook();
    await this.getImgUrl();
    await this.setBooks();
   
  }
};
</script>

<style scoped>
.container {
  width: 100vw;
  background-color: #f5f6fa;
  color: #333;
  margin: 0;
  min-height: 90vh;
  display: flex;

}
.container .left {
  width: calc(72vw - 8px);
  height: 90vh;
  margin-right: 8px;
  margin-left: 8vw;
  
}
.el-menu.el-menu--horizontal {
  border: none;
  border-radius: 4px;
}
.container .left .illustration,
.books {
  width:100%;
  padding:2vw;
  min-height: 38vh;
  background-color: #fff;
  margin-top: 8px;
  font-size: 18px;
  border-radius: 4px;
}
.container .left .illustration .title {
  margin-bottom: 4vh;
  display: flex;
  justify-content: space-between;
}
.container .left .books .title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4vh;
}
.container .left .illustration ul {
  list-style: none;
  display: flex;
  justify-content: space-between;
}
.container .left .illustration ul li {
  width: 14vw;
  height: 9.85vw;
  background-color: #f5f6fa;
  cursor: pointer;
 border-radius: 4px;
}
.container .left .books ul {
  list-style: none;
  
  display: flex;
  justify-content: space-between;
}
.container .left .books ul li {
  width: 14vw;
  height: 9.85vw;
  background-color: #f5f6fa;
  cursor: pointer;
  border-radius: 4px;
}
.container .right {
  width: 20vw;
  min-height: 90vh;
}
.container .right .message {
  width: 20vw;
  height: 12vw;
  margin-bottom: 8px;
  background-color: #fff;
  border-radius: 4px;
}
.container .right .message li {
  height: 3vw;
  line-height: 3vw;
  padding-left: 2vw;
  font-size: 14px;
  display: flex;
justify-content: flex-start;
align-items: center;

}
.container .right .message li span{
  height:18px;
  font-size:12px;
  background-color: #f56c6c;
  color:#fff;
  display: block;
  min-width:24px;
  line-height:18px;
  margin-left: 8px;
  padding:0 8px;
  border-radius: 18px;
  text-align: center;
}
.container .right .create {
  width: 20vw;
  background-color: #fff;
  list-style: none;
  display: flex;
 
  padding: 2vw 2vw 0 2vw;
  flex-wrap: wrap;
  border-radius: 4px;
}
.container .right .create li {
  width: 240px;
  height: 80px;
  font-size: 18px;
  line-height: 80px;
  padding: 0 16px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 2vw;
  font-weight: 500;
}
.container .right .create li:first-child {
  background-color: #b8E2b1;
}
.container .right .create li span {
  margin-left: 8px;
}
.container .right .create li:hover {
  background-color: #f5f6fa;
}
/* 我的插画页面样式 */
.index2 {
  width: 72vw;
  height: calc(100vh - 140px);
  background-color: #fff;
  margin-top: 8px;
  padding: 2vw;
  margin-bottom: 8px;
  font-size: 18px;
  border-radius: 4px;
  overflow-y: scroll;
  overflow-x: hidden;
}
.index2 .index2-items {
  list-style: none;
  width: 68vw;
}
.index2 .index2-items .index2-item {
  height: 208px;
  padding:16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
   
    border-bottom: 1px solid rgb(238, 238, 238);
}
.index2 .index2-items .index2-item .index2-avatar {
  width: 250px;
  height: 176px;
  margin-right: 16px;
}
.index2 .index2-items .index2-item .index2-center {
  width: 500px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 144px;
}
.index2 .index2-items .index2-item .index2-center .index2-name p:nth-child(2) {
  font-size: 14px;
}

.index2 .index2-items .index2-item .index2-center.index2-icon {
  display: flex;
  height:18px;
  justify-content: space-between;
  font-size: 14px;
  width:500px;
}
.index2 .index2-items .index2-item .index2-center.index2-icon div {
  display: inline-block;
  width: 60px;
}
/* 我的关注页面样式 */

.index5 {
  width: 72vw;
  height: 90vh;
  background-color: #fff;
  margin-top: 8px;
  padding: 2vw;
  font-size: 18px;
  border-radius: 4px;
  overflow-y: scroll; 
}
.index5-focus{
    display: flex;
    height:152px;
    padding:16px 0 ;
    justify-content: space-between;
    box-sizing: border-box;
   
    border-bottom: 1px solid rgb(238, 238, 238);
   
}
.index5-info{
    width:55vw;
     
}
</style>