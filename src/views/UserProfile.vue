<template>
<div class="container">
<div class="box">
<el-form ref="form" :model="form" label-width="120px" label-position="left">
    <el-form-item :label="$t('userProfile.avatar')">
      <div v-if="form.avatar && form.avatar.trim()" class="hasImg">
        <el-avatar shape="square" :size="120" :src="form.avatar"></el-avatar>
        <span class="editIcon" @click="editAvatar">
          <el-icon><Delete /></el-icon>
        </span>
      </div>
      <div v-else>
        <el-upload
          ref="upload"
          action="#"
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :auto-upload="false"
          :on-change="fileChange"
          :on-remove="handleRemove"
          accept=".png, .jpg, .jpeg, .JPG, .JPEG"
          :file-list="uploadFileList"
          :limit="1">
          <template #default>
            <div class="upload-trigger">
              <i class="el-icon-plus"></i>
              <span class="upload-text">{{ $t('userProfile.uploadAvatar') }}</span>
            </div>
          </template>
        </el-upload>
        <el-dialog v-model="dialogVisible" width="80%">
          <img width="100%" :src="dialogImageUrl" alt="">
        </el-dialog>
      </div>
    </el-form-item>
  <el-form-item :label="$t('userProfile.username')">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  
    <el-form-item :label="$t('userProfile.gender')" >
        <el-radio-group v-model="form.gender">
    <el-radio label="male">{{ $t('userProfile.male') }}</el-radio>
      <el-radio label="female">{{ $t('userProfile.female') }}</el-radio></el-radio-group>
  </el-form-item>
   <el-form-item :label="$t('userProfile.birthday')" prop="date">
     <el-date-picker type="date" :placeholder="$t('userProfile.selectDate')" v-model="form.birthday" style="width: 100%;"></el-date-picker>
  </el-form-item>
 
  <el-form-item prop="email" :label="$t('userProfile.email')">
    <el-input v-model="form.email"></el-input>
  </el-form-item>

   <el-form-item>
    <el-button type="primary" @click="onSubmit" class="btn" :disabled="!hasFormChanged || disabled">{{ $t('userProfile.submitChanges') }}</el-button>
   
  </el-form-item>

</el-form>

</div>
</div>
</template>

<script>

import {mapState} from "vuex"
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

export default {
  components: {
    Delete
  },
   data() {
      return {
        dialogImageUrl: '',
        dialogVisible: false,
        disabled: false,
        form: {
          avatar:'',
          name:'',
          email:'',
          birthday:'',
          gender:'',
          introduce: ''
        },
        originalForm: {
          avatar:'',
          name:'',
          email:'',
          birthday:'',
          gender:'',
          introduce: ''
        },
        objClass:{
          uploadShow:true,
          uploadHide:false
        },
        imgBase64:'',
        uploadFileList: [] // 上传文件列表

      };
    },
    computed:{
      ...mapState([
        "userInfo"
      ]),
      // 检测表单是否有变化
      hasFormChanged() {
        // 检查是否有新上传的头像
        if (this.imgBase64) {
          return true;
        }
        // 格式化日期用于比较（处理 Date 对象和字符串）
        const formatDate = (date) => {
          if (!date) return '';
          if (date instanceof Date) {
            return date.toISOString();
          }
          return String(date);
        };
        // 检查各个字段是否有变化
        return (
          this.form.avatar !== this.originalForm.avatar ||
          this.form.name !== this.originalForm.name ||
          this.form.email !== this.originalForm.email ||
          this.form.gender !== this.originalForm.gender ||
          formatDate(this.form.birthday) !== formatDate(this.originalForm.birthday) ||
          this.form.introduce !== this.originalForm.introduce
        );
      }
    },
    async mounted(){
      // 如果 store 中没有用户信息，从 API 获取
      if (!this.userInfo || !this.userInfo._id) {
        await this.loadUserInfo();
      }
      this.setInfo();
    },
    methods: {
      // 从 API 加载用户信息
      async loadUserInfo() {
        try {
          const userId = localStorage.getItem("id");
          const token = localStorage.getItem("token");
          if (!userId || !token) {
            return;
          }
          const res = await this.$http.get(`/user/${userId}`, {
            headers: {
              "Authorization": "Bearer " + token
            }
          });
          if (res.data && res.data.message) {
            this.$store.commit("setUserInfo", res.data.message);
          }
        } catch (error) {
          // 静默处理错误，避免影响用户体验
        }
      },
      
      setInfo(){
       this.form.avatar = this.userInfo.avatar || '';
       this.form.name = this.userInfo.name || '';
       this.form.gender = this.userInfo.gender || '';
       // 处理日期格式：如果是字符串，转换为 Date 对象供日期选择器使用
       if (this.userInfo.birthday) {
         this.form.birthday = this.userInfo.birthday instanceof Date 
           ? this.userInfo.birthday 
           : new Date(this.userInfo.birthday);
       } else {
         this.form.birthday = '';
       }
       this.form.introduce = this.userInfo.introduce || '';
       this.form.email = this.userInfo.email || '';
       // 保存原始数据用于比较（保存字符串格式的日期）
       this.originalForm = {
         avatar: this.form.avatar,
         name: this.form.name,
         email: this.form.email,
         gender: this.form.gender,
         birthday: this.userInfo.birthday || '',
         introduce: this.form.introduce
       };
      },
      
 
      handleRemove() {
            this.objClass.uploadShow=true;
            this.objClass.uploadHide=false;
            this.uploadFileList = [];
            this.form.avatar = '';
            this.imgBase64 = '';
          },
          handlePictureCardPreview(file) {
            
            this.dialogImageUrl = file.url;
            this.dialogVisible = true;
          },
          async fileChange(file){
            try {
              // 先压缩图片
              const compressedBlob = await this.compressImage(file.raw, 800, 800, 0.8, 500);
              
              // 将压缩后的图片转换为base64
              const base64 = await this.blobToBase64(compressedBlob);
              
              if (base64) {
                this.imgBase64 = base64;
                // 立即更新 form.avatar 以显示预览
                this.form.avatar = base64;
                // 清空上传文件列表，让头像显示出来
                this.uploadFileList = [];
                // 使用 nextTick 确保 DOM 更新
                this.$nextTick(() => {
                  if (this.$refs.upload) {
                    this.$refs.upload.clearFiles();
                  }
                });
              }
            } catch (error) {
              ElMessage.error(this.$t('userProfile.imageProcessFailed'));
              this.uploadFileList = [];
              if (this.$refs.upload) {
                this.$refs.upload.clearFiles();
              }
            }
      },
        // 压缩图片
        compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8, maxSizeKB = 500) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                // 计算新尺寸
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                  if (width > height) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                  } else {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                  }
                }
                
                // 创建canvas进行压缩
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为blob，并检查大小
                canvas.toBlob((blob) => {
                  const sizeKB = blob.size / 1024;
                  if (sizeKB <= maxSizeKB) {
                    resolve(blob);
                  } else {
                    // 如果还是太大，降低质量继续压缩
                    let currentQuality = quality;
                    const compressRecursive = () => {
                      canvas.toBlob((compressedBlob) => {
                        const compressedSizeKB = compressedBlob.size / 1024;
                        if (compressedSizeKB <= maxSizeKB || currentQuality <= 0.1) {
                          resolve(compressedBlob);
                        } else {
                          currentQuality -= 0.1;
                          compressRecursive();
                        }
                      }, 'image/jpeg', currentQuality);
                    };
                    compressRecursive();
                  }
                }, 'image/jpeg', quality);
              };
              img.onerror = reject;
              img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        },

        // 将Blob转换为Base64
        blobToBase64(blob) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        },
      //修改个人信息
      onSubmit() {
        // 检查是否有新的头像需要上传（imgBase64 有值且与当前头像不同）
        const avatarToSubmit = this.imgBase64 || this.form.avatar;
        // 处理日期格式：如果是 Date 对象，转换为 ISO 字符串
        const birthdayToSubmit = this.form.birthday instanceof Date 
          ? this.form.birthday.toISOString() 
          : this.form.birthday;
        
        this.disabled = true;
        
        this.$http
        .put(`/user/`+this.userInfo._id,{
          avatar: avatarToSubmit,
          name: this.form.name,
          gender: this.form.gender,
          birthday: birthdayToSubmit,
          introduce: this.form.introduce,
          email: this.form.email
        },{
          headers:{
            'Content-Type': 'application/json',
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then(async (response) => {
          this.disabled = false;
          // 添加调试信息
         
          
          // 检查响应是否成功（兼容多种响应格式）
          const isSuccess = response.data.code === 0 || 
                           response.data.desc === "success" ||
                           response.status === 200;
          
          if (isSuccess) {
            // 先弹出成功提示（在异步操作之前）
            ElMessage({
              message: this.$t('userProfile.updateSuccess'),
              type: 'success',
              offset: 100,
            });
            // 清除新上传的头像标记
            this.imgBase64 = '';
            // 重新加载用户信息以刷新界面
            await this.loadUserInfo();
            // 更新表单显示（会同时更新原始数据）
            this.setInfo();
          } else {
            const errorMsg = response.data.message || response.data.desc || this.$t('userProfile.updateFailed');
            ElMessage({
              message: errorMsg,
              type: 'error',
              offset: 100,
            });
          }
        })
        .catch(() => {
          this.disabled = false;
          ElMessage({
            message: this.$t('userProfile.updateFailedRetry'),
            type: 'error',
            offset: 100,
          });
        });
      },

      editAvatar(){
      this.form.avatar="";
      this.uploadFileList = [];
      this.imgBase64 = '';
      this.objClass.uploadShow = true;
      this.objClass.uploadHide = false;
      },
      //头像
      handleAvatarSuccess(res, file) {
        this.form.avatar = URL.createObjectURL(file.raw);
      },


    }
}
</script>

<style scoped>
.container {
    width: 100vw;
    min-height: 90vh;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background-color: #f5f6fa;
}

.box {
    width: 100%;
    max-width: 900px;
    height: 80vh;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表单样式统一 */
.box  :deep(.el-form) {
    width: 100%;
    text-align: left;
}

.box  :deep(.el-form-item) {
    margin-bottom: 32px;
    text-align: left;
}

.box  :deep(.el-form-item__label) {
    text-align: left;
    font-weight: 500;
    color: #606266;
    padding-right: 20px;
}

.box  :deep(.el-form-item__content) {
    text-align: left;
}

/* 统一输入框样式 */
.box  :deep( .el-input,)
.box  :deep( .el-select,)
.box  :deep( .el-textarea,)
.box  :deep(.el-date-editor) {
    width: 100%;
}

.box  :deep( .el-input__inner,)
.box  :deep(.el-textarea__inner) {
    box-shadow: none;
    border: 1px solid #dcdfe6;
    transition: border-color 0.2s;
}

.box  :deep( .el-input__inner:focus,)
.box  :deep(.el-textarea__inner:focus) {
    border-color: #409eff;
}

/* 选择框样式 */
.box  :deep(.el-select) {
    width: 100%;
}

.box  :deep(.el-select .el-input__inner) {
    width: 100%;
}

/* 日期选择器样式 */
.box  :deep(.el-date-editor) {
    width: 100%;
}

/* 单选框组样式 */
.box  :deep(.el-radio-group) {
    display: flex;
    align-items: center;
    gap: 20px;
}

.box  :deep(.el-radio) {
    margin-right: 0;
}

/* 按钮样式 */
.box  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
    margin-top: 20px;
}

.btn {
    width: 120px;
    height: 40px;
    font-size: 16px;
}

/* 头像区域样式 */
.hasImg {
    position: relative;
    display: inline-block;
    width: 120px;
    height: 120px;
}

.editIcon {
    position: absolute;
    bottom:0;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    cursor: pointer;
    font-size: 20px;
    color: #409eff;
    background-color: rgba(255, 255, 255, 0.6);
    border-radius: 4px;
    width: 100%;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s;
}

.editIcon:hover {
    background-color: #409eff;
    color: #fff;
    transform: translateX(-50%);
}

/* 标签样式 */
.tag {
    margin-left: 12px;
    margin-top: 12px;
}

.box  :deep(.el-tag) {
    margin-right: 8px;
    margin-top: 8px;
}

/* 上传组件样式 */
.uploadShow  :deep(.el-upload) {
    width: 120px !important;
    height: 120px !important;
    border-radius: 8px;
    border: 2px dashed #d9d9d9;
    background-color: #fafafa;
    transition: all 0.3s;
}

.uploadShow  :deep(.el-upload:hover) {
    border-color: #409eff;
    background-color: #f0f9ff;
}

.uploadShow  :deep(.el-upload .el-icon-plus) {
    font-size: 28px;
    color: #8c939d;
    margin-bottom: 0;
}

.upload-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.upload-text {
    margin-top: 8px;
    font-size: 14px;
    color: #8c939d;
}

.uploadHide  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 120px !important;
    height: 120px !important;
    border-radius: 8px;
}

.uploadHide  :deep(.el-upload) {
    display: none !important;
}

/* 对话框样式 */
.box  :deep(.el-dialog__body) {
    padding: 20px;
}

.box  :deep(.el-dialog__body img) {
    border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .container {
        padding: 20px 10px;
    }
    
    .box {
        padding: 24px;
    }
    
    .box  :deep(.el-form-item) {
        margin-bottom: 24px;
    }
}
</style>