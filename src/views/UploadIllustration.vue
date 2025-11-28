<template>
    <div class="container">
<div class="box">
<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="上传作品">
      <!-- 如果有从store来的图片，显示它 -->
      <div v-if="imgUrl && !localFile" class="image-preview">
        <el-image :src="imgUrl" style="width:500px;height:352px" fit="contain"/>
        <el-button 
          type="text" 
          icon="el-icon-close" 
          class="remove-btn"
          @click="removeStoreImage">
          移除
        </el-button>
      </div>
      
      <!-- 如果有本地文件，显示本地文件预览 -->
      <div v-else-if="localFile" class="image-preview">
        <el-image :src="localImageUrl" style="width:500px;height:352px" fit="contain"/>
        <el-button 
          type="text" 
          icon="el-icon-close" 
          class="remove-btn"
          @click="removeLocalFile">
          移除
        </el-button>
      </div>
      
      <!-- 上传组件 -->
      <div v-else class="upload-container">
        <el-upload
          class="upload-demo"
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".png, .jpg, .jpeg, .JPG, .JPEG"
        >
          <el-button slot="trigger" size="small" type="primary">选择本地图片</el-button>
          <div slot="tip" class="el-upload__tip">只能上传jpg/png文件</div>
        </el-upload>
      </div>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  <el-form-item label="类别">
    <el-select v-model="form.category" placeholder="请选择插画类别">
      <el-option label="生活日常" value="daily"></el-option>
        <el-option label="欢庆节日" value="festival"></el-option>
         <el-option label="校园生活" value="school"></el-option>
          <el-option label="动物世界" value="animal"></el-option>
          <el-option label="奇幻想象" value="fantasy"></el-option>
          <el-option label="数学知识" value="math"></el-option> 
          <el-option label="文学知识" value="literature"></el-option>
          <el-option label="英语学习" value="english"></el-option>
          <el-option label="其他" value="others"></el-option>
    </el-select>
  </el-form-item>
  <el-form-item label="作品描述">
    <el-input type="textarea" v-model="form.desc"></el-input>
  </el-form-item>
   <el-form-item>
    <el-button type="primary" @click="onSubmit" class="btn" :disabled="disabled">上传</el-button>
  </el-form-item>
</el-form>



</div>
 
    </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
  data(){
    return{
     form: {
          name: '',
          desc: '',
          category:'',
        },
        disabled:false,
        localFile: null, // 本地选择的文件
        localImageUrl: '', // 本地文件的预览URL
    }
  },
     computed:mapState([
    "imgUrl"
  ]),
  
  mounted(){
  },
  methods:{
    // 处理本地文件选择
    handleFileChange(file) {
      this.localFile = file.raw;
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.localImageUrl = e.target.result;
      };
      reader.readAsDataURL(file.raw);
    },
    
    // 移除本地文件
    removeLocalFile() {
      this.localFile = null;
      this.localImageUrl = '';
    },
    
    // 移除store中的图片
    removeStoreImage() {
      // 清除store中的imgUrl
      this.$store.commit('uploadIllustration', '');
    },
    
    onSubmit(){
      // 检查是否有图片（本地文件或store中的图片）
      const hasImage = (this.localFile) || (this.imgUrl && this.imgUrl !== '');
      
      if(hasImage && this.form.name && this.form.category){      
        this.disabled = true;
        
        // 如果有本地文件，使用本地文件上传
        if (this.localFile) {
          this.uploadLocalFile();
        } else if (this.imgUrl) {
          // 使用store中的图片（可能是base64或URL）
          this.uploadStoreImage();
        }
      } else {
        this.$message({
          message: '插画、插画名称、类别不能为空',
          type: 'warning',
          offset:'300'
        });
      }
   },
   
   // 上传本地文件
   async uploadLocalFile() {
     try {
       let formdata = new FormData();
       formdata.append('picture', this.localFile);
       formdata.append('title', this.form.name);
       formdata.append('description', this.form.desc);
       formdata.append('type', this.form.category);
       
       const response = await this.$http.post(`/ill/`, formdata, {
         headers: {
           'Content-Type': 'multipart/form-data',
           "Authorization": "Bearer " + localStorage.getItem("token")
         }
       });
       
       if (response.data && (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0')) {
         this.$message.success('上传成功');
         this.$router.push('/user/upload/submit-res/');
       } else {
         this.$message.error('上传失败');
         this.disabled = false;
       }
     } catch (error) {
       console.error('上传失败:', error);
       this.$message.error('上传失败，请稍后重试');
       this.disabled = false;
     }
   },
   
   // 上传store中的图片（可能是base64或URL）
   async uploadStoreImage() {
     try {
       let formdata = new FormData();
       
       // 如果imgUrl是base64格式，需要转换
       if (this.imgUrl.startsWith('data:')) {
         // base64格式，需要转换为Blob
         const response = await fetch(this.imgUrl);
         const blob = await response.blob();
         formdata.append('picture', blob, 'image.png');
       } else if (this.imgUrl.startsWith('http://') || this.imgUrl.startsWith('https://')) {
         // URL格式，直接使用URL
         formdata.append('picture', this.imgUrl);
       } else {
         // 相对路径或其他格式
         formdata.append('picture', this.imgUrl);
       }
       
       formdata.append('title', this.form.name);
       formdata.append('description', this.form.desc);
       formdata.append('type', this.form.category);
       
       const response = await this.$http.post(`/ill/`, formdata, {
         headers: {
           'Content-Type': 'multipart/form-data',
           "Authorization": "Bearer " + localStorage.getItem("token")
         }
       });
       
       if (response.data && (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0')) {
         this.$message.success('上传成功');
         this.$router.push('/user/upload/submit-res/');
       } else {
         this.$message.error('上传失败');
         this.disabled = false;
       }
     } catch (error) {
       console.error('上传失败:', error);
       this.$message.error('上传失败，请稍后重试');
       this.disabled = false;
     }
   },
 
  }
}
</script>

<style scoped>
.container{
    width:100vw;
    height:90vh;
    padding:5vw 20vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: scroll;
}
.box{
    width:60vw;
}
.box>>>.el-input__inner{
    box-shadow:none;
}
.btn{
  width:120px;
  margin-left: 190px;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.remove-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.upload-container {
  width: 500px;
  padding: 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

.upload-container:hover {
  border-color: #409eff;
}
</style>