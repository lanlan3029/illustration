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
  
      </div>
    </div>
  </template>
  
  <script>
  // @ is an alias to /src
  
  import {mapState} from "vuex"
  
  export default {
    name: "SearchBooks",
    components: {
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
    justify-content: center;
  }
  .content-left {
    width: 80vw;
  max-width: 80vw;
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
}.item {
  box-sizing: border-box;
  flex: 0 0 calc((100% - 72px) / 4); /* 五列：四处gap共96px */
  margin: 0; /* 通过 gap 控制间距 */
  border-radius: 8px;
  user-select: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item:hover {
  transform: scale(1.02);
}
.card{ 
  width: 100%; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}
.image {
  width: 100%;
  aspect-ratio: 3 / 2; /* 稳定比例，避免高度不一致 */
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item:hover .image {
  transform: scale(1.05);
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
/* 固定内部 el-select 组件宽度 */
.el-select :deep(.el-select) {
  width: 240px;
  min-width: 240px;
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
margin-top:8px;
  
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

.data .icon .collect-icon {
  cursor: pointer;
  padding: 4px;
  display: inline-block;
  font-size: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
}

.data .icon .collect-icon:hover {
  transform: scale(1.15);
}

.data .icon .collect-icon.collect-animate {
  animation: collectPulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

@keyframes collectPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.6) rotate(15deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
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

/* 自定义类别选择按钮的选中颜色 */
:deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: #8167a9 !important;
  border-color: #8167a9 !important;
  color: #fff !important;
  box-shadow: -1px 0 0 0 #8167a9 !important;
}

:deep(.el-radio-button__inner:hover) {
  color: #8167a9;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-left: 1px solid #dcdfe6;
}
  </style>