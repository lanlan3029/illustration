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
        <el-menu-item index="4">我的收藏</el-menu-item>
        <el-menu-item index="5">我的关注</el-menu-item>
        <el-menu-item index="6">我的粉丝</el-menu-item>
        <el-menu-item index="7">我的草稿</el-menu-item>
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
                :src="(`http://10.0.0.31:3000/`+item.content)"
                style="width: 14vw; height: 9.85vw"
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
                :src="(`http://10.0.0.31:3000/`+item.content[0])"
                style="width: 14vw; height: 9.85vw"
                fit="contain"
                @click="goBookDetails(item._id)"
              ></el-image>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="activeIndex == 2" class="index2">
        <ul class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in illArr"
            :key="index"
          >
            <div class="index2-avatar">
              <el-image
                :src="(`http://10.0.0.31:3000/`+item.content)"
                style="width: 250px; height: 176px"
                fit="contain"
              ></el-image>
            </div>
   <el-descriptions class="margin-top" :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    <template slot="extra">
      <el-button size="small" @click="goEdition(item)">编辑</el-button>
    </template>
   <el-descriptions-item label="描述">kooriookami</el-descriptions-item>
   <el-descriptions-item></el-descriptions-item>
    <el-descriptions-item label="获赞">1289</el-descriptions-item>
    <el-descriptions-item label="收藏">89</el-descriptions-item>
  </el-descriptions> 
          </li>
        </ul>
      </div>

      <div v-if="activeIndex == 3" class="index2">
        <ul class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in myBooks"
            :key="index"
          >
            <div class="index2-avatar">
              <el-image
                :src="(`http://10.0.0.31:3000/`+item.content[0])"
                style="width: 250px; height: 176px"
                fit="contain"
                @click="goBookDetails"
              ></el-image>
            </div>
   <el-descriptions class="margin-top" :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    <template slot="extra">
      <el-button size="small" @click="goBookEdition(item)">编辑</el-button>
    </template>
   <el-descriptions-item label="描述">kooriookami</el-descriptions-item>
    <el-descriptions-item></el-descriptions-item>
    <el-descriptions-item label="获赞">1289</el-descriptions-item>
     <el-descriptions-item label="收藏">89</el-descriptions-item>
  </el-descriptions> 
          </li>
        </ul>
      </div>

<!-- 我的收藏页面：先返回四条数据，点击更多后加载所有收藏 -->
      <div v-if="activeIndex == 4" class="index4">
        <div class="illustration">
          <div class="title">
            <p>收藏插画</p>
            <el-link :underline="false" @click="goCollectIllu"
              >更多<i class="el-icon-d-arrow-right el-icon--right"></i>
            </el-link>
          </div>
          <ul class="illu-items">
            <li
              class="illu-item"
              v-for="(item, index) in pictures.slice(0, 5)"
              :key="index"
            >
              <el-image
                :src="(`http://10.0.0.31:3000/`+item.content)"
                style="width: 14vw; height: 9.85vw"
                fit="contain"
                @click="goIllusDetails"
              ></el-image>
            </li>
          </ul>
        </div>

        <div class="books">
          <div class="title">
            <p>收藏绘本</p>
            <el-link :underline="false" @click="goCollectbooks"
              >更多<i class="el-icon-d-arrow-right el-icon--right"></i>
            </el-link>
          </div>
          <ul class="books-items">
            <li
              class="books-items"
              v-for="(item, index) in pictures.slice(4, 8)"
              :key="index"
            >
              <el-image
                :src="(`http://10.0.0.31:3000/`+item.content)"
                style="width: 14vw; height: 9.85vw"
                fit="contain"
              ></el-image>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="activeIndex == 5" class="index5">
            <div class="index5-focus" v-for="(item,index) in focusList" :key="index">    
        <el-avatar :src="item.src" :size="120" class="avatar"></el-avatar>

          <el-descriptions class="index5-info" :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    <template slot="extra">
      <el-button size="small" @click="unFocus(item)">取消关注</el-button>
    </template>
   <el-descriptions-item label="描述">kooriookami</el-descriptions-item>
    <el-descriptions-item></el-descriptions-item>
    <el-descriptions-item label="关注">1289</el-descriptions-item>
     <el-descriptions-item label="粉丝">89</el-descriptions-item>
  </el-descriptions> 
          </div>
      </div>


      <div v-if="activeIndex == 6" class="index5">
            <div class="index5-focus" v-for="(item,index) in fansList" :key="index">    
        <el-avatar :src="item.src" :size="120" class="avatar"></el-avatar>

          <el-descriptions class="index5-info" :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    
   <el-descriptions-item label="描述">kooriookami</el-descriptions-item>
    <el-descriptions-item></el-descriptions-item>
    <el-descriptions-item label="关注">1289</el-descriptions-item>
     <el-descriptions-item label="粉丝">89</el-descriptions-item>
  </el-descriptions> 
          </div>
      </div>


<!-- 我的草稿 -->
          <div v-if="activeIndex == 7" class="index2">
        <ul class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in pictures"
            :key="index"
          >
            <div class="index2-avatar">
              <el-image
                :src="item.src"
                style="width: 250px; height: 176px"
                fit="contain"
              ></el-image>
            </div>
   <el-descriptions class="margin-top" :column="2" :colon="false">
    <template slot="title">{{item.title}}</template>
    <template slot="extra">
      <el-button size="small" @click="gocreate(item)">编辑</el-button>
    </template>
   <el-descriptions-item label="描述">kooriookami</el-descriptions-item>
   <el-descriptions-item></el-descriptions-item>
    <el-descriptions-item label="创建时间">2022年9月7日</el-descriptions-item>
    
  </el-descriptions> 
          </li>
        </ul>
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
        <li @click="goCompose()">
          <i class="el-icon-document-add"></i><span>合成绘本</span>
        </li>
        <li @click="goLocalIllus()">
          <i class="el-icon-document-add"></i><span>上传本地插画</span>
        </li>
        <li @click="goLocalPDF()">
          <i class="el-icon-document-add"></i><span>上传PDF</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import {mapState} from "vuex"

export default {
  data() {
    return {
      id:localStorage.getItem("id"),
      activeIndex: "1",
      illArr:[],
      
      toolArr:[],
      focusList: [
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/background.svg"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/background2.svg"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/bike.svg"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/cat.png"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/decoration.png"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/desk.svg"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/flower.svg"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/people.svg"),
        },
        {
          id: 1,
          title: "背景",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/people2.svg"),
        },
      ],
      fansList: [
        {
          id: 1,
          title: "粉丝1",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/background.svg"),
        },
        {
          id: 1,
          title: "粉丝2",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/background2.svg"),
        },
        {
          id: 1,
          title: "粉丝3",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/bike.svg"),
        },
        {
          id: 1,
          title: "粉丝4",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/cat.png"),
        },
        {
          id: 1,
          title: "粉丝5",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/decoration.png"),
        },
        {
          id: 1,
          title: "粉丝6",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/desk.svg"),
        },
        {
          id: 1,
          title: "粉丝7",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/flower.svg"),
        },
        {
          id: 1,
          title: "粉丝8",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/people.svg"),
        },
        {
          id: 1,
          title: "粉丝9",
          desc: "就是一个背景",
          thumb: 23,
          src: require("../assets/blush/people2.svg"),
        },
      ],
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
   goLocalPDF(){
       this.$router.push("/user/upload/upload-loacl-pdf");
   },
    goIllusDetails(id) {
      this.$router.push({name:'user-illusdetails',params:{illId:id}});
    },
    goBookDetails(id){
      this.$router.push({name:'user-bookdetails',params:{bookId:id}});
    },
    goEdition(item){
        this.$store.commit(" editionIllusFun",item)
        this.$router.push("/user/upload/editionillus");
    },
    goBookEdition(item){
      this.$store.commit("editionBookFun",item)
        this.$router.push("/user/upload/editionbook");
    },
    unFocus(){
        console.log("取关")
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
          let res=await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&`+this.id)
          this.illArr=res.data.message
          console.log(this.illArr)
        } catch(err){
          console.log(err)
        }
    },
   // 获取我的绘本
    async getBook(){
      try{
          let res=await this.$http.get(`/book/?sort_param=createdAt&sort_num=desc&`+this.id)
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
  width: 80vw;
  height: 90vh;
  margin-right: 8px;
  margin-left: 8vw;
  overflow-y: scroll;
}
.el-menu.el-menu--horizontal {
  border: none;
  border-radius: 4px;
}
.container .left .illustration,
.books {
  width:72vw;
  min-height: 38vh;
  background-color: #fff;
  margin-top: 8px;
  
  font-size: 18px;
  border-radius: 4px;
}
.container .left .illustration .title {
  padding:2vw 2vw 1vw 2vw;
  display: flex;
  justify-content: space-between;
}
.container .left .books .title {
   padding:2vw 2vw 1vw 2vw;
  display: flex;
  justify-content: space-between;
}
.container .left .illustration ul {
  list-style: none;
 
  display: flex;
  flex-wrap:wrap;
}
.container .left .illustration ul li {
  width: 14vw;
  height: 9.85vw;
  background-color: #f5f6fa;
  cursor: pointer;
 margin:1vw 2vw;
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
  margin:1vw 2vw;
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
  background-color: #e5defe;
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
  height: 90vh;
  background-color: #fff;
  margin-top: 8px;
  padding: 2vw;
  font-size: 18px;
  border-radius: 4px;
  overflow-y: scroll;
  
}
.index2 .index2-items {
  list-style: none;
  width: 68vw;
}
.index2 .index2-items .index2-item {
  height: 176px;
  margin-bottom: 2vw;
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