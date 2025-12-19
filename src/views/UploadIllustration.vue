<template>
    <div class="container">
<div class="box">
<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="上传作品">
      <!-- 如果有从store来的图片，显示它 -->
      <div v-if="imgUrl && !localFile" class="image-preview">
    <el-image :src="imgUrl" style="width:100%;" fit="contain"/>
        <el-button 
          type="text" 
          class="remove-btn"
          @click="removeStoreImage">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
      
      <!-- 如果有本地文件，显示本地文件预览 -->
      <div v-else-if="localFile" class="image-preview">
        <el-image :src="localImageUrl" style="width:100%;" fit="contain"/>
        <el-button 
          type="text" 
          class="remove-btn"
          @click="removeLocalFile">
          <el-icon><Delete /></el-icon>
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
          <template #trigger>
            <el-button type="primary">选择图片</el-button>
          </template>
          <template #tip>
            <div class="el-upload__tip">只能上传jpg/png文件</div>
          </template>
        </el-upload>
      </div>
  </el-form-item>
  <el-form-item label="插画名称">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  <el-form-item label="插画类别">
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
  <el-form-item label="插画描述">
    <el-input type="textarea" v-model="form.desc" :rows="4"></el-input>
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
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

export default {
  components: {
    Delete
  },
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
              ElMessage({
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
         ElMessage.success('上传成功');
         this.$router.push('/user/upload/submit-res/');
       } else {
         ElMessage.error('上传失败');
         this.disabled = false;
       }
     } catch (error) {
       console.error('上传失败:', error);
       ElMessage.error('上传失败，请稍后重试');
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
         ElMessage.success('上传成功');
         this.$router.push('/user/upload/submit-res/');
       } else {
         ElMessage.error('上传失败');
         this.disabled = false;
       }
     } catch (error) {
       console.error('上传失败:', error);
       ElMessage.error('上传失败，请稍后重试');
       this.disabled = false;
     }
   },
 
  }
}
</script>

<style scoped>
.container{
    width:100vw;
    min-height:calc(100vh - 90px);
    padding: 60px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-attachment: fixed;
}

.box{
    width: 100%;
    max-width: 900px;
    min-height: 80vh;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.box :deep(.el-form) {
    width: 100%;
}

.box :deep(.el-form-item) {
    margin-bottom: 32px;
}

.box :deep(.el-form-item__label) {
    font-weight: 600;
    color: #303133;
    font-size: 15px;
    padding-bottom: 10px;
    line-height: 1.5;
}

.box :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: all 0.3s;
}

.box :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #b7a6d6 inset;
}

.box :deep(.el-input.is-focus .el-input__wrapper) {
    box-shadow: 0 0 0 1px #8167a9 inset;
}

.box :deep(.el-select) {
    width: 100%;
}

.box :deep(.el-select .el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #fafbfc;
    padding: 12px 16px;
}

.box :deep(.el-select .el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #667eea inset;
    background: #fff;
}

.box :deep(.el-textarea__inner) {
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    min-height: 120px;
    resize: vertical;
    background: #fafbfc;
    padding: 12px 16px;
}

.box :deep(.el-textarea__inner:hover) {
    border-color: #667eea;
    background: #fff;
}

.box :deep(.el-textarea__inner:focus) {
    border-color: #667eea;
    box-shadow: 0 0 0 2px #667eea inset;
    background: #fff;
}

.btn{
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.btn :deep(.el-button) {
    width: 200px;
    height: 44px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s;
}

.btn :deep(.el-button--primary) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: #fff;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn :deep(.el-button--primary:hover) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
    background: linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%);
}

.btn :deep(.el-button:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
}

.image-preview {
  position: relative;
  display: inline-block;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.image-preview:hover {
  box-shadow: 0 16px 50px rgba(102, 126, 234, 0.25);
  transform: translateY(-4px);
}

.image-preview :deep(.el-image) {
  border-radius: 8px;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 44px;
}

.remove-btn :deep(.el-icon) {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.remove-btn:hover {
  background: rgba(245, 108, 108, 0.95);
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 15px rgba(245, 108, 108, 0.4);
}

.upload-container {
  width: 100%;
  min-height: 300px;
  padding: 60px 20px;
  border: 3px dashed rgba(102, 126, 234, 0.3);
  border-radius: 20px;
  text-align: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  margin: auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.upload-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.4s;
}

.upload-container:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
}

.upload-container:hover::before {
  opacity: 1;
}

.upload-container :deep(.el-upload) {
    width: 100%;
}

.upload-container :deep(.el-button--primary) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    padding: 14px 36px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
}

.upload-container :deep(.el-button--primary:hover) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
    background: linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%);
}

.upload-container :deep(.el-upload__tip) {
    margin-top: 16px;
    color: #909399;
    font-size: 14px;
}

/* 滚动条样式优化 */
.box::-webkit-scrollbar {
  width: 8px;
}

.box::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.box::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%);
  border-radius: 4px;
  transition: all 0.3s;
}

.box::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 40px 16px;
  }
  
  .box {
    padding: 32px 24px;
    border-radius: 20px;
  }
  
  .upload-container {
    min-height: 250px;
    padding: 40px 16px;
  }
}
</style>