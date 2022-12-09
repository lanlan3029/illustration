<template>
  <div class="container">
    <div class="left">
      <div class="info">
        <div class="info-left">
          <el-avatar
            :src="details.author_avatar"
            :size="120"
            class="avatar"
          ></el-avatar>
        </div>

        <div class="info-center">
            <div class="username">进击的大佬</div>
              <el-descriptions :column="1">
          
              <el-descriptions-item  :contentStyle="{'width': '30vw'}" label="介绍">嘿嘿哈哈快使用双节棍嘿嘿哈哈快使用双节棍嘿嘿哈哈快使用双节棍嘿嘿哈哈快使用双节棍嘿嘿哈哈快使用双节棍</el-descriptions-item>
              </el-descriptions>
          <el-descriptions :column="2">
           
            
            <el-descriptions-item label="关注">
              22
            </el-descriptions-item>
          
            <el-descriptions-item label="粉丝"
              >183</el-descriptions-item
            >
          </el-descriptions>
        </div>
        <div class="info-right">
            <el-button type="primary" icon="el-icon-plus">关注</el-button>
        </div>
      </div>

      <div v-if="activeIndex == 1">
        <div class="illustration">
          <div class="title">
            <p>插画创作</p>
            <el-link :underline="false" @click="goMyIllu"
              >更多<i class="el-icon-d-arrow-right el-icon--right"></i>
            </el-link>
          </div>
          <ul class="illu-items">
            <li
              class="illu-item"
              v-for="(item, index) in illArry.slice(0, 4)"
              :key="index"
            >
              <el-image
                :src="`http://119.45.172.191:3000/`+item.content"
                style="width: 16vw; height: 11.26vw"
                fit="cover"
                @click="goIllusDetails(item._id)"
              ></el-image>
            </li>
          </ul>
        </div>

        <div class="books">
          <div class="title">
            <p>绘本创作</p>
            <el-link :underline="false" @click="goMybooks"
              >更多<i class="el-icon-d-arrow-right el-icon--right"></i>
            </el-link>
          </div>
          <ul class="books-items">
            <li
              class="books-items"
              v-for="(item, index) in bookArry.slice(4, 8)"
              :key="index"
            >
              <el-image
                :src="`http://119.45.172.191:3000/`+item.content"
                style="width: 16vw; height: 11.26vw"
                fit="contain"
              ></el-image>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="activeIndex == 2" class="index2">
        <ul class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in pictures"
            :key="index"
          >
            <el-image
              :src="item.src"
              style="width: 250px; height: 176px"
              fit="contain"
            ></el-image
            ><span></span>
          </li>
        </ul>
      </div>
    </div>
    <div class="right">
     
      <ul class="create">
        <li @click="goCreation()">
          <i class="el-icon-edit"></i><span>创作插画</span>
        </li>
        <li @click="goPdf()">
          <i class="el-icon-document-add"></i><span>合成绘本</span>
        </li>
        <li @click="goPdf()">
          <i class="el-icon-document-add"></i><span>上传本地插画</span>
        </li>
        <li @click="goPdf()">
          <i class="el-icon-document-add"></i><span>上传PDF</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      id:this.$router.currentRoute.params.authorId,
      activeIndex: "1",
      details: {
        id: 1,
        title: "背景",
        desc: "就是一个背景",
        thumb: 23,
        src: require("../assets/blush/background.svg"),
        author_id: 12,
        author_avatar: require("../assets/blush/cat.png"),
        author_name: "进击的大佬",
      },
      illArry:[],
      bookArry:[],
    };
  },
  methods: {
    handleSelect(key, keyPath) {
      this.activeIndex = key;
      console.log(key, keyPath);
    },
    //获取该用户的所有插画
    async getIlls(){ 
      try{
        let res = await this.$http.get(`/ill/`,{
          params:{
            ownerid:this.id
          }
        })
        this.illArry=res.data.message 
        console.log(this.illArry)
        
      } catch(err){
        console.log(err)
      }
    
    },
      //获取该用户的所有绘本
      async getbook(){ 
      try{
        let res = await this.$http.get(`/book/`,{
          params:{
            ownerid:this.id
          }
        })
        this.bookArry=res.data.message 
        console.log(this.bookArry)
        
      } catch(err){
        console.log(err)
      }
    
    },




    goPdf() {
      this.$router.push("/user/upload/compose-illustration/");
    },
    goCreation() {
      this.$router.push("/creation");
    },
    goMyIllu() {
      this.activeIndex = 2;
    },
    goMybooks() {
      this.activeIndex = 3;
    },
    goIllusDetails(id) {
      this.$router.push({name:'original-illusdetails',params:{illId:id}});
    },
  },

  mounted(){
    this.getIlls()
    this.getBook()
  }
};
</script>

<style scoped>
.container {
  width: 100vw;
  background-color: #f5f6fa;
  color: #333;
  margin: 0;
  height: 90vh;
  overflow: scroll;
  display: flex;
}
.container .left {
  width: 80vw;
  min-height: 90vh;
  margin-right: 8px;
  margin-left: 8vw;
}
.container .left .info{
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    background-color: #fff;
    padding:20px;
    justify-content: space-between;
}

.container .left .info .info-center{
    width:50vw;
}
.container .left .info .info-center .username{
  
    font-size: 28px;
    font-weight:500;
}
.container .left .info .info-right{
    
}
.container .left .illustration,
.books {
  height: 38vh;
  background-color: #fff;
  margin-top: 8px;
  padding: 2vw;
  font-size: 18px;
}
.container .left .illustration .title {
  display: flex;
  justify-content: space-between;
}
.container .left .books .title {
  display: flex;
  justify-content: space-between;
}
.container .left .illustration ul {
  list-style: none;
  margin-top: 4vh;
  display: flex;
  
}
.container .left .illustration ul li {
  width: 16vw;
  height: 11.26vw;
  background-color: #f5f6fa;
  cursor: pointer;
  margin-right: 3vw;
}
.container .left .illustration ul li:last-child{
  margin-right: 0;
}
.container .left .books ul {
  list-style: none;
  margin-top: 4vh;
  display: flex;
  justify-content: space-between;
}
.container .left .books ul li {
  width: 16vw;
  height: 11.26vw;
  background-color: #f5f6fa;
  cursor: pointer;
  margin-right: 3vw;
}
.container .left .books ul li:last-child{
  margin-right: 0;
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
}

.container .right .create {
  width: 20vw;
  background-color: #fff;
  list-style: none;
  display: flex;
  padding: 1vw;
  padding: 2vw 2vw 0 2vw;
  flex-wrap: wrap;
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

.index2 {
  height: 90vh;
  background-color: #fff;
  margin-top: 8px;
  padding: 4vh;
  font-size: 18px;
}
.index2 .index2-items {
  list-style: none;
}
.index2 .index2-items .index2-item {
  height: 176px;
  margin: 2vh 8vw;
}
</style>