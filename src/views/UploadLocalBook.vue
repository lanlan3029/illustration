<template>
<div class="container">
<div class="box">

<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="上传作品">
    <el-upload
        ref="upload"
        action="https://api.kidstory.cc/picture/"
        list-type="picture-card"
        :auto-upload="false"
        :on-change="fileChange"
        :on-preview="handlePictureCardPreview"
        :on-remove="handleRemove"
        :file-list="uploadFileList"
        accept=".png, .jpg, .jpeg, .JPG, .JPEG"
        multiple
        :limit="30"
        class="upload-wrapper"
    >
      <template #default>
        <el-icon><Plus /></el-icon>
      </template>
    </el-upload>
    <div class="upload-tip" v-if="uploadFileList.length > 1">
      <el-icon><InfoFilled /></el-icon>
      <span>提示：可以拖动图片进行排序</span>
    </div>
    <el-dialog v-model="dialogVisible" width="80%" :close-on-click-modal="true">
      <el-image :src="dialogImageUrl" alt="" fit="contain"></el-image>
</el-dialog>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="form.name"></el-input>
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
  <el-form-item label="绘本描述">
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
import { ElMessage } from 'element-plus'
import { InfoFilled, Plus } from '@element-plus/icons-vue'

export default {
  components: {
    InfoFilled,
    Plus
  },
   data() {
      return {
        dialogImageUrl: '',
        dialogVisible: false,
        disabled:false,
        fileList: [], // 存储所有选中的文件（File 对象）
        uploadFileList: [], // Element UI 需要的文件列表格式
        form: {
          name: '',
          desc: '',
          category:''
        },
        dragIndex: null, // 当前拖拽的索引
      };
    },
    methods: {
      handleRemove(file, fileList) {
        // 更新文件列表
        this.updateFileLists(fileList);
        
        // 重新初始化拖拽功能
        this.$nextTick(() => {
          this.initDragSort();
        });
      },
      handlePictureCardPreview(file) {
        this.dialogImageUrl = file.url;
        this.dialogVisible = true;
      },
      fileChange(file, fileList) {
        // 确保新文件有正确的格式
        if (file.raw && !file.url) {
          // 为新文件创建预览 URL
          file.url = URL.createObjectURL(file.raw);
        }
        
        // 更新文件列表
        this.updateFileLists(fileList);
        
        // 在下一个 tick 后初始化拖拽功能
        this.$nextTick(() => {
          this.initDragSort();
        });
      },
      
      // 更新文件列表
      updateFileLists(fileList) {
        // 确保文件列表格式正确
        this.uploadFileList = fileList.map((item, index) => {
          // 如果 item 是文件对象，转换为 Element Plus 需要的格式
          if (item instanceof File) {
            return {
              name: item.name,
              url: URL.createObjectURL(item),
              raw: item,
              uid: Date.now() + index + Math.random()
            };
          }
          // 如果已经有正确的格式，确保有必要的属性
          if (!item.url && item.raw) {
            item.url = URL.createObjectURL(item.raw);
          }
          return item;
        });
        
        // 提取原始文件对象数组，按顺序保存
        this.fileList = this.uploadFileList
          .filter(item => item.raw) // 只保留有原始文件的对象
          .map(item => item.raw);
      },
      
      // 初始化拖拽排序功能
      initDragSort() {
        const uploadList = this.$refs.upload?.$el?.querySelector('.el-upload-list--picture-card');
        if (!uploadList) return;
        
        const items = uploadList.querySelectorAll('.el-upload-list__item');
        items.forEach((item, index) => {
          // 移除旧监听器
          if (item._oldDragStartHandler) {
            item.removeEventListener('dragstart', item._oldDragStartHandler);
            item.removeEventListener('dragover', item._oldDragOverHandler);
            item.removeEventListener('drop', item._oldDropHandler);
            item.removeEventListener('dragend', item._oldDragEndHandler);
          }
          
          // 创建新的事件处理器
          const dragStartHandler = (e) => this.handleDragStart(e);
          const dragOverHandler = (e) => this.handleDragOver(e);
          const dropHandler = (e) => this.handleDrop(e);
          const dragEndHandler = (e) => this.handleDragEnd(e);
          
          // 设置可拖拽
          item.draggable = true;
          item.dataset.index = index;
          item.style.cursor = 'grab';
          item.style.userSelect = 'none';
          
          // 添加事件监听
          item.addEventListener('dragstart', dragStartHandler);
          item.addEventListener('dragover', dragOverHandler);
          item.addEventListener('drop', dropHandler);
          item.addEventListener('dragend', dragEndHandler);
          
          // 保存处理器以便后续移除
          item._oldDragStartHandler = dragStartHandler;
          item._oldDragOverHandler = dragOverHandler;
          item._oldDropHandler = dropHandler;
          item._oldDragEndHandler = dragEndHandler;
        });
      },
      
      // 拖拽开始
      handleDragStart(e) {
        const item = e.target.closest('.el-upload-list__item');
        if (!item) {
          e.preventDefault();
          return;
        }
        
        // 如果点击的是图片，阻止图片的默认拖拽行为
        if (e.target.tagName === 'IMG') {
          e.preventDefault();
          return;
        }
        
        this.dragIndex = parseInt(item.dataset.index);
        item.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
        
        // 阻止图片拖拽的默认行为
        const img = item.querySelector('img');
        if (img) {
          img.draggable = false;
        }
      },
      
      // 拖拽经过
      handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        const currentItem = e.currentTarget;
        if (!currentItem || this.dragIndex === null) return;
        
        const currentIndex = parseInt(currentItem.dataset.index);
        const dragIndex = this.dragIndex;
        
        if (currentIndex !== dragIndex) {
          // 移除所有插入指示器
          const allIndicators = document.querySelectorAll('.drag-indicator');
          allIndicators.forEach(indicator => indicator.remove());
          
          // 计算鼠标位置，决定插入位置
          const rect = currentItem.getBoundingClientRect();
          const mouseY = e.clientY;
          const itemCenterY = rect.top + rect.height / 2;
          
          // 添加插入指示器
          const indicator = document.createElement('div');
          indicator.className = 'drag-indicator';
          indicator.style.cssText = `
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: #f5576c;
            z-index: 10;
            pointer-events: none;
          `;
          
          currentItem.style.position = 'relative';
          if (mouseY > itemCenterY) {
            indicator.style.bottom = '0';
            currentItem.appendChild(indicator);
          } else {
            indicator.style.top = '0';
            currentItem.insertBefore(indicator, currentItem.firstChild);
         }
        }
      },
      
      // 拖拽放下
      handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetItem = e.target.closest('.el-upload-list__item');
        if (!targetItem || this.dragIndex === null) return;
        
        const targetIndex = parseInt(targetItem.dataset.index);
        const dragIndex = this.dragIndex;
        
        if (targetIndex !== dragIndex) {
          // 计算插入位置
          const rect = targetItem.getBoundingClientRect();
          const mouseY = e.clientY;
          const itemCenterY = rect.top + rect.height / 2;
          
          // 重新排序文件列表
          const newFileList = [...this.uploadFileList];
          const [draggedItem] = newFileList.splice(dragIndex, 1);
          
          // 根据鼠标位置决定插入位置
          let insertIndex = targetIndex;
          if (mouseY > itemCenterY) {
            insertIndex = dragIndex < targetIndex ? targetIndex : targetIndex + 1;
          } else {
            insertIndex = dragIndex < targetIndex ? targetIndex : targetIndex;
          }
          
          // 确保索引有效
          insertIndex = Math.max(0, Math.min(insertIndex, newFileList.length));
          newFileList.splice(insertIndex, 0, draggedItem);
          
          // 更新列表
          this.updateFileLists(newFileList);
          
          // 重新初始化拖拽
          this.$nextTick(() => {
            this.initDragSort();
          });
        }
        
        // 清理插入指示器
        const indicators = document.querySelectorAll('.drag-indicator');
        indicators.forEach(indicator => indicator.remove());
      },
      
      // 拖拽结束
      handleDragEnd(e) {
        const item = e.target.closest('.el-upload-list__item');
        if (item) {
          item.style.opacity = '1';
        }
        this.dragIndex = null;
        
        // 清理插入指示器
        const indicators = document.querySelectorAll('.drag-indicator');
        indicators.forEach(indicator => indicator.remove());
        
        // 恢复所有列表项的样式
        const allItems = this.$refs.upload?.$el?.querySelectorAll('.el-upload-list__item');
        if (allItems) {
          allItems.forEach(item => {
            item.style.opacity = '1';
          });
        }
      },
         async onSubmit(){
          // 验证表单
          if (this.fileList.length === 0) {
            ElMessage({
              message: '请至少上传一张图片',
              type: 'warning',
              offset: 100
            });
            return;
          }
          
          if (!this.form.name || !this.form.category) {
              ElMessage({
              message: '作品名称、类别不能为空',
              type: 'warning',
              offset: 100
        });
            return;
          }
          
          this.disabled = true;
          
          try {
            // 使用方式1：直接上传多张图片文件到 /book/ 接口（推荐方式）
            const formData = new FormData();
            
            // 添加表单字段
            formData.append('title', this.form.name);
            formData.append('description', this.form.desc || '');
            formData.append('type', this.form.category);
            
            // 添加所有图片文件（使用 pictures 字段，可以多次 append）
            this.fileList.forEach((file) => {
              formData.append('pictures', file);
            });
            
            ElMessage.info('正在上传绘本...');
            
            const response = await this.$http.post(`/book/`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": "Bearer " + localStorage.getItem("token")
              }
            });
            
            if (response.data && (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0')) {
              const bookData = response.data.message || response.data.data;
              const illustrationCount = bookData?.illustration_count || bookData?.illustration_ids?.length || this.fileList.length;
              
              ElMessage.success({
                message: `绘本创建成功！共上传 ${illustrationCount} 张图片`,
                type: 'success',
                offset: 100
              });
              
              // 跳转到提交结果页面
              this.$router.push('/user/upload/submit-res/');
            } else {
              const errorMsg = response.data?.message || response.data?.desc || '创建绘本失败';
              ElMessage.error({
                message: errorMsg,
                offset: 100
              });
              this.disabled = false;
            }
          } catch (error) {
            console.error('上传失败:', error);
            const errorMsg = error.response?.data?.message || error.message || '上传失败，请稍后重试';
            ElMessage.error({
              message: errorMsg,
              offset: 100
            });
            this.disabled = false;
          }
   },
      },
      
      mounted() {
        // 初始化拖拽功能
        this.$nextTick(() => {
          this.initDragSort();
        });
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
    background-color: #f5f6fa;
}

.box{
    width: 100%;
    max-width: 900px;
    background-color: #fff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    overflow-y: scroll;
    height:80vh;
}

/* 表单样式 */
.box :deep(.el-form-item) {
    margin-bottom: 32px;
}

.box :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
}

.box :deep(.el-input),
.box :deep(.el-select),
.box :deep(.el-textarea) {
    width: 100%;
}

/* 上传组件样式 */
.upload-wrapper {
    width: 100%;
}

/* 文件列表容器 - 使用flex布局精确控制 */
.upload-wrapper :deep(.el-upload-list--picture-card) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
    margin: 0;
    padding: 0;
}

/* 缩小上传卡片和预览图尺寸 - 精确计算宽度，一行4个，4:3 宽高比 */
.upload-wrapper :deep(.el-upload-list--picture-card .el-upload-list__item),
.upload-wrapper :deep(.el-upload--picture-card) {
    width: calc((100% - 24px) / 4); /* 一行4个，3个间距(8px*3=24px) */
    aspect-ratio: 4 / 3;            /* 宽高比 4:3 */
    height: auto;
    margin: 0 !important;
    flex-shrink: 0;
    line-height: normal;
    box-sizing: border-box;
}

/* 确保上传按钮始终显示 */
.upload-wrapper :deep(.el-upload--picture-card) {
    display: flex !important;
    align-items: center;
    justify-content: center;
    margin: 0 !important;
}

/* 图片预览样式 */
.upload-wrapper :deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 拖拽相关样式 */
.upload-wrapper :deep(.el-upload-list__item[draggable="true"]) {
    cursor: grab;
}

.upload-wrapper :deep(.el-upload-list__item[draggable="true"]:active) {
    cursor: grabbing;
}

/* 上传提示 */
.upload-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 16px;
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    color: #0369a1;
    font-size: 14px;
}

.upload-tip .el-icon {
    font-size: 16px;
}

/* 按钮样式 */
.btn {
    width: 100%;
    display: flex;
    justify-content: center;
}

.btn :deep(.el-button) {
    width: 200px;
    height: 40px;
    font-size: 16px;
}

/* 拖拽指示器 */
:deep(.drag-indicator) {
    background: #f5576c;
}
</style>
