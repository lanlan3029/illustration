<template>
  <div class="container">
    
    <div class="box">
      <div v-if="imgToPDF.length==0" class="backAdd" @click="handleBack"><i class="el-icon-document-add" ></i><span>点击添加图片</span></div>
      <div v-else v-for="(item, index) in imgToPDF" :key="index" class="item">
        <el-image :src="(`https://static.kidstory.cc/`+item.content)" style="width:984.3px; height:699px" fit="contain"></el-image>
      </div>
      <div  class="item">
        <el-image :src="codeImg" style="width:984.3px; height:699px" fit="contain"></el-image>
      </div>
    </div>
    <div class="details">
      <el-form ref="form" :model="form" label-width="80px">
  <el-form-item label="书名" >
    <el-input v-model="form.title" maxlength="24"
        show-word-limit></el-input>
  </el-form-item>
   <el-form-item label="类别">
    <el-select v-model="form.category" placeholder="请选择绘本类别">
      <el-option label="儿童读物" value="reading"></el-option>
      <el-option label="习惯养成" value="habit"></el-option>
       <el-option label="英语启蒙" value="english"></el-option>
        <el-option label="数学启蒙" value="math"></el-option>
        <el-option label="科普百科" value="knowledge"></el-option>
        <el-option label="其他" value="others"></el-option>
    </el-select>
  </el-form-item>

  <el-form-item label="介绍">
    <el-input type="textarea" v-model="form.desc"  :autosize="{ minRows: 2, maxRows: 4 }" maxlength="200"
    show-word-limit></el-input>
  </el-form-item>
  <div class="btn">
   <el-button @click="downPDF" :disabled="disabled">下载PDF</el-button>
    <el-button @click="submit" type="primary">发布作品</el-button>
    
  </div>

      </el-form>

    </div>
  </div>
</template>


<script>
import html2Canvas from "html2canvas";
import JsPDF from "jspdf";
import { mapState } from "vuex";

export default {
  data() {
    return {
      disabled:false,
      checkedId:[],
      form: {
          title: '',
          category: '',
          desc:''
    },
    codeImg:require('../assets/images/pdfCode.png'),
    pdfBase64:''
    }
  },
  computed: mapState(["imgToPDF"]),
  mounted(){
     
  },
  methods: {
    handleBack(){
      this.$router.push('/user/upload/compose-illustration/');
    },
    getcheckedId(){
      for(var i=0;i<this.imgToPDF.length;i++){
      //获取绘本图片ID
      let tool=this.imgToPDF[i]._id
     
      //将图片id添加到checkedId
      this.checkedId.push(tool)
      
    }  
    },
    //上传绘本
    async submit(){
     await this.getcheckedId()
     //this.$router.push('/user/upload/submit-res/');
     this.$http
       .post(`/book/`,{content:this.checkedId,title:this.form.title,description:this.form.desc,type:this.form.category}
       ,{
         headers:{
           "Authorization":"Bearer "+localStorage.getItem("token")
         }
       })
       .then((response) => {
         if (response.data.desc === "success") {
          this.$router.push('/user/upload/submit-res/')        
         } else {
            this.$router.push({path:'/errorpage'});   
         }
       })
       .catch((error) => console.log(error));
     
    },
    draft(){
       console.log("作品已保存")
    },

    downPDF() {
      this.disabled = true;
      this.$message("正在下载，请勿重复点击");

      let target = document.getElementsByClassName("box");
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
        //上传至服务器
        this.pdfBase64 = pdf.output("dataurlstring");
        console.log(this.pdfBase64);
      });
    },
  },
};
</script>

<style scoped>
.container {
  width: 100vw;
  height: 90vh;
  background-color: #f5f5f5;
  overflow: scroll;
}
.btn {
  width: 984.3px;
height:120px;
padding:40px 0;
  margin:auto;
  display: flex;
  justify-content: space-around;
  
  
}
.box {
  width: 984.3px;
  min-height: 699px;
  margin: auto;
  background-color: #fff;
  border-radius: 8px;
}
.box .item{
  width: 984.3px;
  height: 699px;
}

.details{
  width: 984.3px;
  height: 200px;
  margin:auto;
  margin-top:24px;
}

.backAdd{
    width:240px;
    height:160px;
    font-size: 60px;
    align-items: center;
    border: 6px dashed #eee;
    cursor: pointer;
    display: flex;
   position: relative;
   left:372px;
   top:269.5px;
    flex-direction: column;  
     padding:37px 0;
}
.backAdd span{
    font-size:18px;
    height:18px;
    line-height: 18px;
    margin-top: 8px;
  
}
.backAdd:hover{
    background-color: #f5f6fa;
} 
</style>