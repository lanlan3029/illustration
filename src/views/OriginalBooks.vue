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
              :value="item.value"
              :key="item.value"
              >{{ item.label }}</el-option
            >
          </el-select>
          <el-radio-group v-model="button1"  size="mini">
            <el-radio-button label="不限"></el-radio-button>
            <el-radio-button label="0-3岁"></el-radio-button>
            <el-radio-button label="3-6岁"></el-radio-button>
          </el-radio-group>
          <el-radio-group v-model="button2"  size="mini">
            <el-radio-button label="不限"></el-radio-button>
            <el-radio-button label="百科"></el-radio-button>
            <el-radio-button label="习惯"></el-radio-button>
            <el-radio-button label="益智"></el-radio-button>
            <el-radio-button label="艺术"></el-radio-button>
            <el-radio-button label="英语"></el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="items" v-infinite-scroll="load" style="overflow:auto">
        <div class="item" v-for="(item, index) in books" :key="index">
          <el-card style="width: 20vw" >
            <div>
              <el-image :src="(`http://10.0.0.31:3000/`+item.content[0])" class="image" fit="cover" @click="toDetail(item._id)"/>
               <div class="data">
              <span class="name">{{item.title}}</span>
              <span class="icon"><i class="el-icon-edit"></i>{{item.like_num}}</span>
               <span class="icon"><i class="el-icon-share"></i>2345</span>
            </div>
            </div>
          </el-card>
        </div>
      </div>
      </div>

      <right-menu />
    </div>
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
  computed:mapState([
        "books"
    ]),
  data() {
    return {
      bookArry:[],
     toolArry:[],
     imgUrl:[],
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
    toDetail(id) {
      this.$router.push({name:'original-bookdetails',params:{bookId:id}});
    },
   async getBooks(){
      try{
        let res=await this.$http.get(`/book`)
        this.toolArry=res.data.message
        
      }catch(err){
        console.log(err)
      }

    },
   async getImgUrl(){
    for(var i=0;i<this.toolArry.length;i++){
      //获取绘本图片ID
      let tool=this.toolArry[i].content
      //遍历绘本图片ID，替换成图片URL
      for(var j=0;j<tool.length;j++){
        try{
          let res=await this.$http.get(`/ill/`+tool[j])
          this.toolArry[i].content[j]=res.data.message.content
        } catch(err){
          console.log(err)
        }

      } 
    }  
   },
   setBooks(){
    this.$store.commit("addBooks",this.toolArry)
    
   },

   async load(){
      this.num++
      try{
         let res=await this.$http.get(`/book/?sort_param=heat&sort_num=desc&page=`+this.num)
         console.log(res.data.message)
         this.illsArry=this.illsArry.concat(res.data.message)
         console.log(this.illsArry)
       } catch(err){
         console.log(err)
       }
    }

  },
  async mounted(){
    await this.getBooks();
    await this.getImgUrl();
   await this.setBooks();
   console.log(this.books)
    
  },
};
</script>
<style scoped>
.content {
  display: flex;
}
.content-left {
  width: 80vw;
  height: 88vh;
  background-color: #f5f6fa;
  overflow: scroll;
}
.items{
  width:100%;
  padding: 0 7vw;
  height:88vw;
  margin-top:2vh;
  display: flex;
  flex-wrap: wrap;
  align-content:flex-start 
}
.item {
  width: 20vw;
  margin: 2vh 1vw;
  height: 15vw;
  overflow: hidden;
  border-radius: 4px;
  user-select: none;
}
.image {
  width: 17vw;
  height: 10vw;
  border-radius: 4px;
  cursor: pointer;
}
.text {
  margin-top: 1vh;
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
  
}
.data .name{
  width:11vw;
  display: inline-block;
 white-space:nowrap;
overflow:hidden;
text-overflow:ellipse;
font-size:14px;
font-weight: 500;
}
.data .icon{
  width:3vw;
  display: block;
  font-size:12px;
  overflow: hidden;
  white-space:nowrap;
}
</style>