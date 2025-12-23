<template>
  <div class="utility-tools-container">
    <div class="header">
      <h1 class="page-title">{{ $t('utilityTools.pageTitle') }}</h1>
      <p class="page-description">{{ $t('utilityTools.pageDescription') }}</p>
    </div>

    <div class="tool-content">
      <el-card class="main-card" shadow="hover">
        <div class="images-layout">
          <!-- 左侧：上传区域或原图 -->
          <div class="image-section left-section">
            <h3 class="section-title">{{ originalImageUrl ? $t('utilityTools.originalImage') : $t('utilityTools.uploadImage') }}</h3>
            <div class="image-wrapper">
              <!-- 没有图片时显示上传框 -->
              <div v-if="!originalImageUrl" class="upload-area">
                <el-upload
                  class="upload-demo"
                  drag
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  :show-file-list="false"
                  accept=".png, .jpg, .jpeg, .JPG, .JPEG"
                >
                  <i class="el-icon-upload"></i>
                  <div class="el-upload__text" v-html="$t('utilityTools.dragUpload')"></div>
                  <template #tip>
                    <div class="el-upload__tip">{{ $t('utilityTools.uploadTip') }}</div>
                  </template>
                </el-upload>
              </div>
              <!-- 有图片时显示原图 -->
              <div v-else class="preview-container">
                <el-image 
                  :src="originalImageUrl" 
                  fit="contain" 
                  class="preview-image"
                  :preview-src-list="[originalImageUrl]"
                ></el-image>
                <el-button 
                  type="danger" 
                  icon="el-icon-delete" 
                  circle 
                  size="small"
                  class="delete-btn"
                  @click="handleDeleteOriginal"
                  :title="$t('utilityTools.deleteImage')"
                ></el-button>
              </div>
            </div>
            <el-button 
              v-if="originalImageUrl"
              type="primary" 
              @click="handleSegment" 
              :loading="processing"
              :disabled="!originalFile"
              class="segment-btn"
              size="medium"
            >
              {{ processing ? $t('utilityTools.processing') : $t('utilityTools.startSegment') }}
            </el-button>
          </div>

          <!-- 右侧：分割结果 -->
          <div class="image-section right-section">
            <h3 class="section-title">{{ $t('utilityTools.segmentResult') }}</h3>
            <div class="image-wrapper">
              <div v-if="!segmentedImageUrl" class="placeholder">
                <i class="el-icon-picture-outline"></i>
                <p>{{ $t('utilityTools.resultPlaceholder') }}</p>
              </div>
              <el-image 
                v-else
                :src="segmentedImageUrl" 
                fit="contain" 
                class="preview-image"
                :preview-src-list="[segmentedImageUrl]"
                @error="handleImageError"
              >
                <template #error>
                  <div class="image-error">
                    <i class="el-icon-picture-outline"></i>
                    <p>图片加载失败</p>
                    <p class="error-url">{{ segmentedImageUrl }}</p>
                  </div>
</template>
              </el-image>
            </div>
            <div v-if="segmentedImageUrl" class="action-buttons">
              <el-button 
                type="success" 
                icon="el-icon-download"
                @click="downloadImage"
                size="medium"
              >
                {{ $t('utilityTools.downloadImage') }}
              </el-button>
              <el-button 
                type="primary" 
                icon="el-icon-user"
                @click="showAddToCharacterDialog = true"
                size="medium"
              >
                {{ $t('utilityTools.addToCharacter') }}
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加到角色的对话框 -->
    <el-dialog
      title="添加到我的角色"
      v-model:visible="showAddToCharacterDialog"
      width="500px"
    >
      <el-form :model="characterForm" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="characterForm.name" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="角色类别" required>
          <el-select v-model="characterForm.category" placeholder="请选择类别" style="width: 100%">
            <el-option label="人物" value="people"></el-option>
            <el-option label="动物" value="animal"></el-option>
            <el-option label="植物" value="plant"></el-option>
            <el-option label="其他" value="others"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            type="textarea" 
            v-model="characterForm.description" 
            placeholder="请输入角色描述"
            :rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddToCharacterDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="addToCharacter"
          :loading="savingCharacter"
        >
          保存
        </el-button>
        </div>
      </template>
      </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'UtilityTools',
  data() {
    return {
      originalFile: null,
      originalImageUrl: '',
      segmentedImageUrl: '',
      segmentedImageId: null, // 保存分割后的图片ID，用于下载和保存
      processing: false,
      showAddToCharacterDialog: false,
      savingCharacter: false,
      characterForm: {
        name: '',
        category: '',
        description: ''
      },
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
    };
  },
  methods: {
    // 处理文件选择
    handleFileChange(file) {
      this.originalFile = file.raw;
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.originalImageUrl = e.target.result;
        // 保存原图到localStorage
        this.saveToLocalStorage();
      };
      reader.readAsDataURL(file.raw);
      // 清空之前的结果
      this.segmentedImageUrl = '';
      this.segmentedImageId = null;
      // 清除之前的分割结果
      this.clearSegmentedResult();
    },
    
    // 保存到localStorage
    saveToLocalStorage() {
      try {
        const data = {
          originalImageUrl: this.originalImageUrl,
          segmentedImageUrl: this.segmentedImageUrl,
          segmentedImageId: this.segmentedImageId
        };
        localStorage.setItem('utilityTools_segmentation', JSON.stringify(data));
      } catch (error) {
        console.error('保存到localStorage失败:', error);
      }
    },
    
    // 从localStorage恢复
    async loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem('utilityTools_segmentation');
        if (saved) {
          const data = JSON.parse(saved);
          let hasError = false;
          
          // 验证原图路径
          if (data.originalImageUrl) {
            const isValid = await this.validateImageUrl(data.originalImageUrl);
            if (isValid) {
              this.originalImageUrl = data.originalImageUrl;
            } else {
              console.warn('原图路径无效，已清空');
              hasError = true;
            }
          }
          
          // 验证分割后图片路径
          if (data.segmentedImageUrl) {
            const isValid = await this.validateImageUrl(data.segmentedImageUrl);
            if (isValid) {
              this.segmentedImageUrl = data.segmentedImageUrl;
            } else {
              console.warn('分割后图片路径无效，已清空');
              hasError = true;
            }
          }
          
          if (data.segmentedImageId) {
            this.segmentedImageId = data.segmentedImageId;
          }
          
          // 如果图片路径错误，清空所有数据
          if (hasError) {
            this.originalImageUrl = '';
            this.segmentedImageUrl = '';
            this.segmentedImageId = null;
            this.originalFile = null;
            this.saveToLocalStorage();
          }
        }
      } catch (error) {
        console.error('从localStorage恢复失败:', error);
        // 恢复失败时清空数据
        this.originalImageUrl = '';
        this.segmentedImageUrl = '';
        this.segmentedImageId = null;
        this.originalFile = null;
        this.saveToLocalStorage();
      }
    },
    
    // 验证图片URL是否有效
    validateImageUrl(url) {
      return new Promise((resolve) => {
        if (!url) {
          resolve(false);
          return;
        }
        
        // 如果是base64，直接返回true
        if (url.startsWith('data:')) {
          resolve(true);
          return;
        }
        
        // 对于HTTP/HTTPS URL，尝试加载图片验证
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        
        // 设置超时，5秒后如果还没加载完成，认为无效
        setTimeout(() => {
          if (!img.complete) {
            resolve(false);
          }
        }, 5000);
      });
    },
    
    // 删除原图
    handleDeleteOriginal() {
      this.$confirm(this.$t('utilityTools.confirmDelete'), this.$t('utilityTools.tip'), {
        confirmButtonText: this.$t('utilityTools.confirm'),
        cancelButtonText: this.$t('utilityTools.cancel'),
        type: 'warning'
      }).then(() => {
        this.originalFile = null;
        this.originalImageUrl = '';
        this.segmentedImageUrl = '';
        this.segmentedImageId = null;
        this.saveToLocalStorage();
        ElMessage.success(this.$t('utilityTools.originalDeleted'));
      }).catch(() => {
        // 用户取消删除
      });
    },
    
    // 清除分割结果
    clearSegmentedResult() {
      this.segmentedImageUrl = '';
      this.segmentedImageId = null;
      this.saveToLocalStorage();
    },

    // 处理图片加载错误
    handleImageError() {
      console.error('图片加载失败，URL:', this.segmentedImageUrl);
      ElMessage.error('图片加载失败，请检查URL是否正确');
    },

    // 图像分割
    async handleSegment() {
      if (!this.originalFile) {
        ElMessage.warning(this.$t('utilityTools.pleaseUploadImage'));
        return;
      }

      this.processing = true;
      this.segmentedImageUrl = '';

      try {
        const token = localStorage.getItem('token') || '';
        if (!token) {
          ElMessage.error(this.$t('utilityTools.pleaseLogin'));
          this.processing = false;
          return;
        }

        // 构建FormData
        const formData = new FormData();
        formData.append('image', this.originalFile);

        // 调用图像分割接口
        const apiUrl = this.apiBaseUrl 
          ? `${this.apiBaseUrl}/image-segmentation/general`
          : '/image-segmentation/general';

        const response = await this.$http.post(apiUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer ' + token
          },
          timeout: 120000 // 2分钟超时
        });

        // 打印响应数据以便调试
        console.log('图像分割响应:', response.data);
        
        if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
          // 尝试多种可能的响应结构
          const message = response.data.message || response.data.data || {};
          
          // 获取分割后的图片URL，尝试多种可能的字段名
          let imageURL = message.imageURL 
            || message.foreground_image 
            || message.image_url
            || message.segmented_image
            || message.result_image
            || message.image
            || message.url
            || (typeof message === 'string' ? message : null);
          
          // 如果message本身就是字符串（URL或base64）
          if (!imageURL && typeof message === 'string') {
            imageURL = message;
          }
          
          // 如果还是没有，尝试从response.data直接获取
          if (!imageURL) {
            imageURL = response.data.imageURL 
              || response.data.foreground_image 
              || response.data.image_url
              || response.data.segmented_image
              || response.data.result_image;
          }
          
          if (imageURL) {
            // 保存图片ID（如果有）
            const imageId = message.id || message._id || message.image_id || null;
            this.segmentedImageId = imageId;
            
            // 处理URL格式，直接使用返回的URL
            if (imageURL.startsWith('http://') || imageURL.startsWith('https://')) {
              // 完整URL，直接使用
              this.segmentedImageUrl = imageURL;
            } else if (imageURL.startsWith('data:')) {
              // Base64格式，直接使用
              this.segmentedImageUrl = imageURL;
            } else if (imageURL.startsWith('/')) {
              // 以/开头的相对路径
              this.segmentedImageUrl = `https://static.kidstory.cc${imageURL}`;
            } else {
              // 其他相对路径
              this.segmentedImageUrl = `https://static.kidstory.cc/${imageURL}`;
            }
            console.log('分割结果URL:', this.segmentedImageUrl);
            console.log('分割结果ID:', this.segmentedImageId);
            
            // 保存到localStorage
            this.saveToLocalStorage();
            // 强制更新视图
            this.$forceUpdate();
            ElMessage.success(this.$t('utilityTools.segmentSuccess'));
            
            // 自动下载图片
            await this.autoDownloadImage();
          } else {
            console.error('完整响应数据:', JSON.stringify(response.data, null, 2));
            throw new Error(this.$t('utilityTools.noImageData'));
          }
        } else {
          // 检查是否是文件内容错误
          const errorMsg = response.data?.message || response.data?.desc || '';
          if (errorMsg.includes('InvalidFile.Content') || errorMsg.includes('阿里云API错误: InvalidFile.Content')) {
            ElMessage({
              message: this.$t('utilityTools.invalidFile'),
              type: 'error',
              duration: 6000,
              showClose: true
            });
            this.processing = false;
            return;
          }
          throw new Error(errorMsg || '图像分割失败');
        }
      } catch (error) {
        console.error('图像分割失败:', error);
        const errorMessage = error.response?.data?.message || error.message || '';
        
        // 检查是否是文件内容错误
        if (errorMessage.includes('InvalidFile.Content') || errorMessage.includes('阿里云API错误: InvalidFile.Content')) {
          ElMessage({
            message: '上传文件不规范，请上传 单人、完整、清晰 的图片；视频首帧需包含 清晰、完整、占比较大 的人体（部分模型要求全身）。',
            type: 'error',
            duration: 6000,
            showClose: true
          });
        } else {
          ElMessage.error(errorMessage || this.$t('utilityTools.segmentFailed'));
        }
      } finally {
        this.processing = false;
      }
    },

    // 自动下载图片（抠图完成后调用）
    async autoDownloadImage() {
      if (!this.segmentedImageUrl) {
        return;
      }

      try {
        // 如果有图片ID，调用后端接口下载并删除
        if (this.segmentedImageId) {
          const token = localStorage.getItem('token') || '';
          if (!token) {
            // 如果没有token，使用前端下载方式
            await this.downloadImageFromUrl();
            return;
          }

          try {
            // 调用后端下载接口
            const response = await this.$http.get(`/image-segmentation/download/${this.segmentedImageId}`, {
              responseType: 'blob',
              headers: {
                'Authorization': 'Bearer ' + token
              }
            });

            // 创建下载链接
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `segmented-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // 下载成功后删除数据库中的图片
            try {
              await this.$http.delete(`/image-segmentation/${this.segmentedImageId}`, {
                headers: {
                  'Authorization': 'Bearer ' + token
                }
              });
              console.log('临时图片已从数据库删除');
            } catch (deleteError) {
              console.warn('删除临时图片失败:', deleteError);
              // 删除失败不影响下载
            }

            ElMessage.success(this.$t('utilityTools.downloadSuccess'));
          } catch (error) {
            console.warn('后端下载失败，使用前端下载:', error);
            // 后端下载失败，使用前端下载方式
            await this.downloadImageFromUrl();
          }
        } else {
          // 没有ID，使用前端下载方式
          await this.downloadImageFromUrl();
        }
      } catch (error) {
        console.error('自动下载失败:', error);
        // 自动下载失败不显示错误提示，避免打扰用户
      }
    },

    // 从URL下载图片（前端方式）
    async downloadImageFromUrl() {
      try {
        // 如果是base64，直接下载
        if (this.segmentedImageUrl.startsWith('data:')) {
          const link = document.createElement('a');
          link.href = this.segmentedImageUrl;
          link.download = `segmented-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }

        // 如果是URL，需要先获取图片blob
        const response = await fetch(this.segmentedImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `segmented-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('前端下载失败:', error);
        throw error;
      }
    },

    // 手动下载图片（用户点击下载按钮）
    async downloadImage() {
      if (!this.segmentedImageUrl) {
        ElMessage.warning(this.$t('utilityTools.noImageToDownload'));
        return;
      }

      await this.autoDownloadImage();
    },

    // 添加到我的角色
    async addToCharacter() {
      if (!this.characterForm.name || !this.characterForm.category) {
        ElMessage.warning(this.$t('utilityTools.fillNameAndCategory'));
        return;
      }

      if (!this.segmentedImageUrl) {
        ElMessage.warning(this.$t('utilityTools.noImageToSave'));
        return;
      }

      this.savingCharacter = true;

      try {
        const token = localStorage.getItem('token') || '';
        if (!token) {
          ElMessage.error(this.$t('utilityTools.pleaseLogin'));
          this.savingCharacter = false;
          return;
        }

        // 调用后端接口保存图片到服务器并创建角色
        // 如果有图片ID，使用图片URL创建角色
        if (this.segmentedImageId && this.segmentedImageUrl) {
          // 使用图片URL创建角色（图片已经在服务器上）
          const createData = {
            character_name: this.characterForm.name,
            character_type: this.characterForm.category,
            description: this.characterForm.description || undefined,
            image_url: this.segmentedImageUrl,
            is_public: 1
          };

          // 移除 undefined 的字段
          Object.keys(createData).forEach(key => {
            if (createData[key] === undefined) {
              delete createData[key];
            }
          });

          const createResponse = await this.$http.post('/character', createData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            }
          });

          if (createResponse.data && (createResponse.data.code === 0 || createResponse.data.code === '0')) {
            ElMessage.success(this.$t('utilityTools.characterSaveSuccess'));
            this.showAddToCharacterDialog = false;
            this.characterForm = { name: '', category: '', description: '' };
            // 跳转到我的角色页面
            this.$router.push('/user?tab=2');
            return;
          } else {
            throw new Error(createResponse.data?.message || this.$t('utilityTools.saveCharacterFailed'));
          }
        }

        // 如果没有ID，使用URL或base64保存
        // 步骤1：先上传图片到服务器（如果需要）
        let imageUrl = this.segmentedImageUrl;
        
        // 如果是base64，需要先上传
        if (imageUrl.startsWith('data:')) {
          // 提取base64数据
          let base64Data = imageUrl;
          if (imageUrl.includes(',')) {
            base64Data = imageUrl.split(',')[1];
          }

          // 调用图像分割接口保存图片
          const segmentResponse = await this.$http.post('/image-segmentation/general', {
            image_base64: base64Data,
            character_name: this.characterForm.name,
            character_type: this.characterForm.category,
            description: this.characterForm.description || undefined,
            is_public: 1
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            }
          });

          if (segmentResponse.data && segmentResponse.data.code === 0) {
            ElMessage.success('角色保存成功！');
            this.showAddToCharacterDialog = false;
            this.characterForm = { name: '', category: '', description: '' };
            // 跳转到我的角色页面
            this.$router.push('/user?tab=2');
            return;
          } else {
            throw new Error(segmentResponse.data?.message || this.$t('utilityTools.saveCharacterFailed'));
          }
        } else {
          // 使用URL创建角色
          const createData = {
            character_name: this.characterForm.name,
            character_type: this.characterForm.category,
            description: this.characterForm.description || undefined,
            image_url: imageUrl,
            is_public: 1
          };

          // 移除 undefined 的字段
          Object.keys(createData).forEach(key => {
            if (createData[key] === undefined) {
              delete createData[key];
            }
          });

          const createResponse = await this.$http.post('/character', createData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            }
          });

          if (createResponse.data && (createResponse.data.code === 0 || createResponse.data.code === '0')) {
            ElMessage.success(this.$t('utilityTools.characterSaveSuccess'));
            this.showAddToCharacterDialog = false;
            this.characterForm = { name: '', category: '', description: '' };
            // 跳转到我的角色页面
            this.$router.push('/user?tab=2');
          } else {
            throw new Error(createResponse.data?.message || this.$t('utilityTools.createCharacterFailed'));
          }
        }
      } catch (error) {
        console.error('保存角色失败:', error);
        const errorMessage = error.response?.data?.message || error.message || this.$t('utilityTools.saveCharacterFailedRetry');
        ElMessage.error(errorMessage);
      } finally {
        this.savingCharacter = false;
      }
    }
  },
  mounted() {
    // 页面加载时从localStorage恢复数据
    this.loadFromLocalStorage();
  }
};
</script>

<style scoped>
.utility-tools-container {
  min-height: calc(100vh - 72px - 50px);
  background-color: #f5f7fa;
  padding: 40px 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.page-description {
  font-size: 16px;
  color: #909399;
  margin: 0;
}

.tool-content {
  max-width: 1400px;
  margin: 0 auto;
}

.upload-area {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-demo {
  width: 100%;
}

.main-card {
  padding: 30px;
}

.images-layout {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.image-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.left-section {
  border-right: 1px solid #e4e7ed;
  padding-right: 30px;
}

.right-section {
  padding-left: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  text-align: center;
}

.image-wrapper {
  width: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 20px;
  box-sizing: border-box;
}

.image-wrapper .upload-area {
  width: 100%;
  min-height: 360px;
  padding: 20px;
}

.preview-container {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 4px;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.placeholder {
  text-align: center;
  color: #909399;
  padding: 40px;
}

.placeholder i {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
}

.placeholder p {
  font-size: 16px;
  margin: 0;
}

.image-error {
  text-align: center;
  color: #f56c6c;
  padding: 40px;
}

.image-error i {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
}

.image-error p {
  font-size: 14px;
  margin: 8px 0;
}

.error-url {
  font-size: 12px;
  color: #909399;
  word-break: break-all;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.segment-btn {
  width: 200px;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.action-buttons .el-button {
  flex: 1;
  min-width: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .images-layout {
    flex-direction: column;
    gap: 20px;
  }

  .left-section {
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
    padding-right: 0;
    padding-bottom: 30px;
  }

  .right-section {
    padding-left: 0;
    padding-top: 30px;
  }

  .image-wrapper {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
  
  .page-description {
    font-size: 14px;
  }

  .main-card {
    padding: 20px;
  }

  .images-layout {
    gap: 20px;
  }

  .image-wrapper {
    min-height: 250px;
    padding: 15px;
  }

  .preview-image {
    max-height: 300px;
  }

  .action-buttons {
    max-width: 100%;
  }
}
</style>
