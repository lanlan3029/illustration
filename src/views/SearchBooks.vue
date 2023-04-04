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
  

        
      <!-- 搜索到的绘本 -->
      <div class="box">
        <div class="items">
          <div class="item" v-for="(item, index) in searchArry" :key="index">
            <el-card style="width: 20vw" >
              <div>
                <el-image :src="(`https://static.kidstory.cc/`+item.content[0])" class="image" fit="cover" @click="toDetail(item._id)"/>
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
           "collectBookArr",
          "likeBookArr","searchInput","searchArry"
      ]),
    data() {
      return {
        userid:localStorage.getItem("id"),
        bookArry:[],
       toolArry:[],
      
       snum:1,
       imgUrl:[],
       loading:true,
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
     
         //获取后台返回的搜索数据（18）
     async getSearchBooks(){
        try{
          let res=await this.$http.get(`/book/?sort_param=heat&sort_num=desc&keyword=`+ this.searchInput+`&page=1`)
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
      this.$store.commit("searchedBooks",this.toolArry)
      this.loading=false  
     },
  
  
      //搜索结果的下一页
      async spageAdd(){
        this.snum++
        try{
           let res=await this.$http.get(`/book/?sort_param=heat&sort_num=desc&keyword=`+this.searchInput+`&page=`+this.snum)
           this.toolArry=res.data.message
          await this.getImgUrl();
          await this.setBooks();   
         } catch(err){
           console.log(err)
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
       
          await this.getSearchBooks()
          await this.getImgUrl()
          await this.setBooks()
     
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
      
        await this.searchFun()
   
    },
  
  };
  </script>
  <style scoped>
  .content {
    display: flex;
   
  }
  .content-left {
    width: 80vw;
    padding: 0 6vw;
    height: 88vh;
    background-color: #f5f6fa;
  
  }
  .items{
    width:100%;
    height:108vw;
    overflow-y: auto;
    margin-top:2vh;
    display: flex;
    flex-wrap: wrap;
    align-content:flex-start;
    
  }
  .item {
    width: 20vw;
    margin: 1vw 1vw;
    height: 16vw;
    overflow: hidden;
    border-radius: 4px;
    user-select: none;
  }
  .image {
    width: 17vw;
    height: 11.968vw;
    border-radius: 4px;
    cursor: pointer;
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