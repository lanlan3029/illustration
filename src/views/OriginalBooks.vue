<template>
  <div>
    <div class="content">
      <div class="content-left">
        <div class="el-select">
          <el-select
            v-model="model"
            style="width: 12vw;margin:0"
            placeholder="排序方式"
             size="mini"
          >
            <el-option
              v-for="item in sortList"
              :key="item.value"
      :label="item.label"
      :value="item.value"
              ></el-option
            >
          </el-select>
         
          <el-radio-group v-model="button2"  size="mini">
            <el-radio-button label="不限"></el-radio-button>
            <el-radio-button label="百科"></el-radio-button>
            <el-radio-button label="习惯"></el-radio-button>
            <el-radio-button label="益智"></el-radio-button>
            <el-radio-button label="艺术"></el-radio-button>
            <el-radio-button label="英语"></el-radio-button>
          </el-radio-group>
        </div>

  <!-- 不搜索时显示全部绘本 -->
      <div  class="box">
      <div v-if="loading" class="loading"><span class="text">故事正在加载</span><i class="el-icon-loading" :size="32" ></i></div>
        <div v-show="(!loading)" class="items" v-infinite-scroll="loadMore" infinite-scroll-disabled="scrollDisabled" :disabled="loadControl">
        <div class="item" v-for="(item, index) in books" :key="item._id || index">
          <el-card class="card">
            <div>
              <el-image
                :src="(`https://static.kidstory.cc/`+item.cover)"
                class="image"
                fit="cover"
                lazy
                @click="toDetail(item._id)"
              >
                <div slot="placeholder" class="img-placeholder">
                  <i class="el-icon-picture-outline"></i>
                </div>
                <div slot="error" class="img-error">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </el-image>
               <div class="data">
              <span class="name">{{item.title}}</span>
              <div class="icon">
                <span v-if="likeBookArr.includes(item._id)"><i   style="color:#F489B5" class="iconfont icon-aixin1"></i></span>
                <span v-else class="iconfont icon-aixin"><i @click="likeBookFun(item._id)" ></i></span></div>
            </div>
            </div>
          </el-card>
        </div>
      </div>
     
      
    
    </div>
      
 
      </div>

    </div>
  </div>
</template>

<script>
// @ is an alias to /src

import {mapState} from "vuex"

export default {
  name: "Home",
  components: {
  },
  computed:mapState([
        "books", "collectBookArr",
        "likeBookArr",
    ]),
  data() {
    return {
      userid:localStorage.getItem("id"),
      bookArry:[],
     toolArry:[],
     num:1,
     imgUrl:[],
     loading:true,
     loadControl:false,
     scrollDisabled:false,
      sortList: [
        {
          value: "default",
          label: "默认",
        },
        {
          value: "hot",
          label: "热度",
        },
        {
          value: "time",
          label: "时间",
        },
      ],
      model: "",
      button1: "不限",
      button2: "不限",
    };
  },
  methods: {
    //去绘本详情页
    toDetail(id) {
      this.$router.push({name:'bookdetails',params:{bookId:id}});
    },

    //获取后台返回的绘本数据（18）
   async getBooks(){
      try{
        let res=await this.$http.get(`/book/?sort_param=heat&sort_num=desc&page=1`)
        //对象数组，对象包含绘本的name\id\content\description等
        this.toolArry=res.data.message
        
      }catch(err){
        this.loading=false 
        console.log(err)
        this.$message({
          message: '抱歉，出错了！',
          type: 'error'
        });
      }

    },

//获取绘本的封面图片
   async getImgUrl(){
    const promises = this.toolArry.map((book, idx) => {
      const firstId = Array.isArray(book.content) ? book.content[0] : null;
      if (!firstId) return Promise.resolve();
      return this.$http.get(`/ill/` + firstId)
        .then(res => {
          this.toolArry[idx].cover = res.data.message.content;
        })
        .catch(err => {
          console.log(err);
        });
    });
    await Promise.all(promises);
   },
   setBooks(){
    this.$store.commit("addBooks",this.toolArry)
    this.loading=false  
   },
  //下一页
   async loadMore(){
    if(!this.loadControl) {
      this.loadControl=true
        try {
          let res = await this.$http.get(`/book/?sort_param=heat&sort_num=desc&page=` + this.num)
          if (res.data.message.length == 0) {
            this.scrollDisabled = true
          } else {
            this.toolArry = res.data.message
            await this.getImgUrl();
            await this.setBooks();
            this.num++
            this.loadControl=false
          }
        } catch (err) {
          console.log(err)
        }
    }
  
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

    //搜索绘本
    async searchFun(){
      this.$store.commit("removeBooks")
      if(this.searchInput!= ''){
        this.$router.push({
        name: "books",
        query: { keyWord: this.searchInput },
      });
        await this.getSearchBooks()
        await this.getImgUrl()
        await this.setBooks()
      }else{
        return
      }
    },

    async getAllBooks(){
      this.$store.commit("removeBooks")
      if(this.searchInput==''){
        this.$router.push({
        name: "books"
      });
      //获取第一页的18本绘本
        await this.getBooks();
    //获取图片
    await this.getImgUrl();
    
   await this.setBooks();
      }else{
        return
      }
    },
    //跳转到books
    async toBooks(){
      if(this.searchInput==''){
        this.$router.push({
        name: "books"
      });
       
    }


  }},



  async mounted(){
      await this.getAllBooks()  
  },

};
</script>
<style scoped>
.content {
  width:100vw;
  background-color: #f5f6fa;
  margin: auto;
  display: flex;
  justify-content: center;
}
.content-left {
  width: 1200px;
  max-width: 90vw;
  height: 88vh;
  overflow-y: auto;
  margin: 0 auto;
}
.items{
  width:100%;
  height:auto;
  padding: 0 12px;
  margin-top:2vh;
  display: flex;
  flex-wrap: wrap;
  align-content:flex-start;  
  gap: 24px; /* 列间距 */
}
.item {
  box-sizing: border-box;
  flex: 0 0 calc((100% - 48px) / 3); /* 三列：两处gap共48px */
  margin: 0; /* 通过 gap 控制间距 */
  overflow: hidden;
  border-radius: 4px;
  user-select: none;
}
.card{ width: 100%; }
.image {
  width: 100%;
  aspect-ratio: 3 / 2; /* 稳定比例，避免高度不一致 */
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
.img-placeholder, .img-error{
  width: 100%;
  height: 100%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#f5f6fa;
  color:#c0c4cc;
}
.text {
  margin:1vh 0;
}
.el-select {
  margin-top: 2vh;
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 30px;
  padding: 0 1vw;
}
.el-input__inner{
  height:28px;
  line-height:28px;
}
.data{
  display: flex;
  height:18px;
justify-content: space-between;
color:#606266;
align-items: center;
overflow: hidden;
  
}
.data .name{
  width:11vw;
  white-space:nowrap;
overflow:hidden;
text-overflow:ellipse;
font-size:14px;
font-weight: 500;
text-align: left;
}
.data .icon{
  width:4vw;
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  font-size:14px;
  cursor:pointer;
}
.box{
 
  margin-bottom: 32px;
}
.loading{
  position: absolute;
  top:50%;
  left:40%;
  color:#C0C4CC;
  font-size:18px;
}
.loading .text{
  display: block;
}
</style>