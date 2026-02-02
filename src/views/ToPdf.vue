<template>
  <div class="container">
    
    <div class="box">
      <div v-if="imgToPDF.length==0" class="backAdd" @click="handleBack"><i class="el-icon-document-add" ></i><span>点击添加插画</span></div>
      <div v-else v-for="(item, index) in imgToPDF" :key="index" class="item">
        <el-image :src="(`https://static.kidstory.cc/`+item.content)" fit="contain"></el-image>
      </div>
    
      <div v-if="imgToPDF.length > 0" class="item">
        <el-image :src="codeImg" fit="contain"></el-image>
      </div>
    </div>
    
    <div class="details">
      <el-form ref="form" :model="form" label-width="80px">
  <el-form-item label="绘本名称" >
    <el-input v-model="form.title" maxlength="24"
        show-word-limit></el-input>
  </el-form-item>
   <el-form-item label="绘本类别">
    <el-select v-model="form.category" placeholder="请选择绘本类别">
      <el-option label="儿童读物" value="reading"></el-option>
      <el-option label="习惯养成" value="habit"></el-option>
       <el-option label="英语启蒙" value="english"></el-option>
        <el-option label="数学启蒙" value="math"></el-option>
        <el-option label="科普百科" value="knowledge"></el-option>
        <el-option label="其他" value="others"></el-option>
    </el-select>
  </el-form-item>

  <el-form-item label="绘本介绍">
    <el-input type="textarea" v-model="form.desc"  :autosize="{ minRows: 6, maxRows: 10 }" maxlength="500"
    show-word-limit></el-input>
  </el-form-item>

  <!-- 审核与合规字段 -->
  <el-form-item>
    <el-checkbox v-model="form.authorizationConfirmed">
      我确认本作品内容为原创或已获得合法授权，适合儿童阅读，对作品内容负责
    </el-checkbox>
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
import { ElMessage } from 'element-plus'

export default {
  data() {
    return {
      disabled:false,
      checkedId:[],
      form: {
          title: '',
          category: '',
          desc:'',
          // 审核与合规字段
          authorizationConfirmed: false
    },
    codeImg:require('../assets/images/pdfCode.webp'),
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
    // 验证审核与合规信息
    validateCompliance() {
      if (!this.form.authorizationConfirmed) {
        ElMessage.warning('请确认审核与合规声明');
        return false;
      }
      return true;
    },
    // 获取用户名
    getUserName() {
      const userInfo = this.$store.state.userInfo;
      return userInfo ? (userInfo.name || userInfo.username || '用户') : '用户';
    },
    // 获取当前时间
    getCurrentTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    //上传绘本
    async submit(){
      // 验证审核与合规信息
      if (!this.validateCompliance()) {
        return;
      }

      await this.getcheckedId()
      //this.$router.push('/user/upload/submit-res/');
      this.$http
        .post(`/book/`,{
          content: this.checkedId,
          title: this.form.title,
          description: this.form.desc,
          type: this.form.category,
          // 提交审核与合规信息
          compliance_checked: true
        }
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
      // 验证审核与合规信息
      if (!this.validateCompliance()) {
        return;
      }

      this.disabled = true;
      ElMessage("正在下载，请勿重复点击");

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
  display: flex;
  gap: 24px;
  max-width: 80vw;
  width:80vw;
  height: 60vh;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.btn {
  width: 100%;
  padding: 20px 0 0;
  margin-top: auto;
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.btn :deep(.el-button) {
  flex: 1;
  height: 44px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn :deep(.el-button--default) {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.btn :deep(.el-button--default:hover) {
  background-color: #f5f7fa;
  border-color: #b7a6d6;
  color: #8167a9;
}

.btn :deep(.el-button--primary) {
  background-color: #8167a9;
  border-color: #8167a9;
  color: #fff;
}

.btn :deep(.el-button--primary:hover) {
  background-color: #6e5494;
  border-color: #6e5494;
}

.btn :deep(.el-button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
.box {
  width: 50%;
 height:100%; 
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  gap: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 60vh;
  overflow-y: scroll;
}

.box .item{
  width: 80%;
  display: flex;
  justify-content: center;
}

.box .item :deep(.el-image) {
  width: 100%;
  max-width: 800px;
  aspect-ratio: 4 / 3;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.details{
  width: 50%;
  flex-shrink: 0;
  min-width: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 60vh;
  overflow: hidden;
}

.details :deep(.el-form) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 60px 32px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 表单内容区域可滚动 */
.details :deep(.el-form > .el-form-item) {
  flex-shrink: 0;
}

.details :deep(.el-form-item) {
  margin-bottom: 32px;
  flex-shrink: 0;
}

/* 最后一个表单项（复选框）与按钮之间的间距 */
.details :deep(.el-form-item:last-of-type) {
  margin-bottom: 24px;
}

.details :deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
  padding-bottom: 10px;
  line-height: 1.5;
}

.details :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s;
}

.details :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #b7a6d6 inset;
}

.details :deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #8167a9 inset;
}

.details :deep(.el-select) {
  width: 100%;
}

.details :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s;
}

.details :deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #b7a6d6 inset;
}

.details :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
  font-family: inherit;
  min-height: 80px;
  resize: vertical;
}

.details :deep(.el-textarea__inner:hover) {
  border-color: #b7a6d6;
}

.details :deep(.el-textarea__inner:focus) {
  border-color: #8167a9;
  box-shadow: 0 0 0 1px #8167a9 inset;
}

.details :deep(.el-checkbox) {
  width: 100%;
  margin-top: 8px;
}

.details :deep(.el-checkbox__label) {
  color: #606266;
  font-size: 14px;
  line-height: 1.7;
  padding-left: 8px;
  white-space: normal;
  word-break: break-word;
}

.details :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #8167a9;
  border-color: #8167a9;
}

.details :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #303133;
}

/* 滚动条样式优化 */
.details :deep(.el-form)::-webkit-scrollbar {
  width: 6px;
}

.details :deep(.el-form)::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.details :deep(.el-form)::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.details :deep(.el-form)::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.backAdd{
    width:240px;
    height:160px;
    font-size: 60px;
    align-items: center;
    justify-content: center;
    border: 4px dashed #eee;
    cursor: pointer;
    display: flex;
    flex-direction: column;  
    padding:37px 0;
    margin: auto;
    border-radius: 8px;
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

/* 审核与合规页面样式 */
.compliance-page {
  padding: 60px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compliance-content {
  width: 100%;
  max-width: 700px;
}

.compliance-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  margin-bottom: 50px;
  padding-bottom: 20px;
  border-bottom: 2px solid #409eff;
}

.compliance-statement {
  background-color: #f5f7fa;
  padding: 40px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.compliance-statement p {
  font-size: 18px;
  color: #303133;
  line-height: 2;
  margin-bottom: 30px;
  text-align: center;
}

.signature {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  text-align: right;
}

.signature p {
  font-size: 14px;
  color: #909399;
  margin: 5px 0;
  font-weight: normal;
}
</style>