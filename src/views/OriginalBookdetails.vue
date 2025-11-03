<template>
  
   
    <div class="content">
      <div class="content-left">
        <div class="info">   
        <el-avatar :src="authorDetails.avatar" :size="48" class="avatar"></el-avatar>
        <div class="text">
          <div class="title"><span>{{bookDetails.title}}</span><el-tag size="mini">{{bookDetails.type}}</el-tag></div>
          <div class="author"><span @click="toAuthor(authorDetails._id)">{{authorDetails.name}}</span><span v-if="(authorDetails._id!=userid)">
            <el-button type="text" size="mini" v-if="attentionArr.includes(authorDetails._id)" @click="cancelAttention(authorDetails._id)">已关注</el-button>
            <el-button type="text" size="mini" v-else @click="newAttention(authorDetails._id)">关注</el-button>
            </span></div>
          </div>
          </div>
    
         <div class="book">
          <div class="desc">{{bookDetails.description}}</div>
          <div class="book-content">
        <div v-for="(item, index) in bookDetails.content" :key="index" class="item">
        <el-image :src="(`https://static.kidstory.cc/`+item)" style="width:984.3px;height:699px" fit="contain"></el-image>
      </div>
      <div  class="item">
      <el-image :src="codeImg" style="width:984.3px; height:699px" fit="contain"></el-image></div>
    </div>
         </div>

        

      <div class="footer">
        <ul>
       <li @click="attention"><el-tooltip class="item" effect="dark" content="关注作者" placement="top">
        <el-avatar :size="56" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar></el-tooltip>
        </li>
        <li> 
          <span v-if="likeBookArr.includes(bookDetails._id)"><i  style="color:#F489B5" class="iconfont icon-aixin1"></i></span>
                <span v-else><i class="iconfont icon-aixin" @click="likeBookFun(bookDetails._id)" ></i></span></li>
        <li>
                <span v-if="collectBookArr.includes(bookDetails._id)" ><i style="color:#FFd301" class="iconfont icon-shoucang1"></i></span>
                <span v-else><i class="iconfont icon-shoucang" @click="collectBookFun(bookDetails._id)" ></i></span></li>

              <li>
                <el-button @click="downPDF" :disabled="disabled">下载</el-button>
              </li>
         
       </ul>
      </div>
      </div>

    </div>
  
</template>

<script>
// @ is an alias to /src


import html2Canvas from "html2canvas";
import JsPDF from "jspdf";
import {mapState} from "vuex"

export default {
  name: "Home",
  components: {
  },
  data(){
    return{
      disabled:false,
      userid:localStorage.getItem("id"),
      id:this.$router.currentRoute.params.bookId,
      authorId:'',
      bookDetails:[],
      authorDetails:[],
      //存放请求到的绘本原始数据

      codeImg:require('../assets/images/pdfCode.png'),
    }
  },
  computed:mapState([
        "collectBookArr",
        "likeBookArr",
        "attentionArr",
    ]),

  methods:{
   //获取绘本详情
      async getBooks() {
      try {
        let res = await this.$http.get(`/book/`+this.id)
        console.log(res)
        //对象数组，对象包含绘本的name\id\content\description等
        this.bookDetails = res.data.message

      } catch (err) {
        this.loading = false
        console.log(err)
        this.$message({
          message: '抱歉，出错了！',
          type: 'error'
        });
      }

    },
    //获取绘本的每一张图片
    async getImgUrl() {
        //获取绘本图片ID
        let tool = this.bookDetails.content
        //遍历绘本图片ID，替换成图片URL
        for (var i = 0; i < tool.length; i++) {
          try {
            let res = await this.$http.get(`/ill/` + tool[i])
            this.bookDetails.content[i] = res.data.message.content
          } catch (err) {
            console.log(err)
          }
        }  
       
        
    },




   attention(){
    console.log("关注作者")
   },
   



    //关注
    newAttention(id){
      this.$http
        .post(`/user/fllow/`+id,{},
        {
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          console.log(this.attentionArr)
          if (response.data.desc === "success") {
              //把该用户ID到用户已关注数组
              this.$store.commit("myAttention",id)
          } 
        })
        .catch((error) => console.log(error));
   },
    //取消关注
    cancelAttention(id){
      this.$http
        .delete(`/user/list/fllow?id=`+id,
        {
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        },
    )
        .then((response) => {
          console.log(this.attentionArr)
          if (response.data.desc === "success") {
              //把该用户ID到用户已关注数组
              this.$store.commit("cancelAttention",id)
              console.log(this.attentionArr)
          } 
        })
        .catch((error) => console.log(error));
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

     //获取绘本作者
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
    },

    downPDF() {
      this.disabled = true;
      this.$message("正在下载，请勿重复点击");

      let target = document.getElementsByClassName("book-content");
      console.log(target)
     //打印区域
      html2Canvas(target[0], {
        dpi: 172,
        useCORS: true,
      }).then((canvas) => {
        var contentWidth = canvas.width;
        var contentHeight = canvas.height;
      
        //一页pdf显示html页面生成的canvas高度;
        var pageHeight = (contentWidth / 984.3) * 699;
        //未生成pdf的html页面高度
        var leftHeight = contentHeight;
        //pdf页面偏移
        var position = 0;
        //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
        var imgWidth = 984.3;
        var imgHeight = (984.3 / contentWidth) * contentHeight;
        var pageData = canvas.toDataURL("image/jpeg");
        var pdf = new JsPDF("l", "pt", [imgWidth,699]);
      
        //有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
        //当内容未超过pdf一页显示的范围，无需分页
        if (leftHeight < pageHeight) {
          pdf.addImage(pageData, "JPEG", 0, 0, imgWidth, imgHeight);
        } else {
          while (leftHeight > 0) {
            pdf.addImage(pageData, "JPEG", 0, position, imgWidth, imgHeight);
            leftHeight -= pageHeight;
            position -= 699;
            //避免添加空白页
            if (leftHeight > 0) {
              pdf.addPage();
            }
          }
        }
        //保存到本地
        pdf.save("StoryTime.pdf");
      
      });
    },
  },
  async mounted(){
   
    await this.getBooks();
    await this.getImgUrl();
     await this.setId();
    await this.getAuthor();
   console.log(this.bookDetails)
console.log(this.authorDetails)
    
  }
};
</script>
<style scoped>
.content {
  display: flex;
  justify-content: center;
}
.content-left {
  width: 1200px;
  max-width: 90vw;
  height: 88vh;
  display: flex;
  flex-wrap: wrap;
  background-color: #f5f6fa;
  overflow-y: scroll;
  margin: 0 auto;
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
.content-left .book.book-content{
  width: 984.3px;
  min-height: 200px;
  background-color: #fff;
  margin:auto;
  font-size:20px;
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
  text-align: left;
}

.content-left .info .text .author{
   font-size:14px;
   cursor:pointer;
   text-align: left;
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