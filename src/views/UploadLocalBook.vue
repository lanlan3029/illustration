<template>
<div class="container">
<div class="box">

<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="上传绘本">
    <div class="upload-container">
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
        class="custom-upload"
  >
  <i class="el-icon-plus"></i>
</el-upload>
    </div>
    <el-dialog v-model="dialogVisible" width="80%">
      <el-image :src="dialogImageUrl" alt="" fit="contain" style="width: 100%; max-height: 70vh;"></el-image>
</el-dialog>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  <el-form-item label="类别"> 
    <el-select v-model="form.category" placeholder="请选择绘本类别">
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

export default {
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
        console.log('移除文件:', file, '剩余文件:', fileList);
        
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
        // 更新文件列表
        this.updateFileLists(fileList);
        console.log('文件列表:', this.fileList);
        
        // 在下一个 tick 后初始化拖拽功能
        this.$nextTick(() => {
          this.initDragSort();
        });
      },
      
      // 更新文件列表
      updateFileLists(fileList) {
        this.uploadFileList = fileList;
        this.fileList = fileList.map(item => item.raw || item);
      },
      
      // 初始化拖拽排序功能
      initDragSort() {
        const uploadList = this.$refs.upload?.$el?.querySelector('.el-upload-list--picture-card');
        if (!uploadList) return;
        
        const items = uploadList.querySelectorAll('.el-upload-list__item');
        items.forEach((item, index) => {
          // 移除之前的监听器（使用命名函数以便正确移除）
          const dragStartHandler = (e) => this.handleDragStart(e);
          const dragOverHandler = (e) => this.handleDragOver(e);
          const dropHandler = (e) => this.handleDrop(e);
          const dragEndHandler = (e) => this.handleDragEnd(e);
          
          // 保存处理器到元素上，以便后续移除
          item._dragStartHandler = dragStartHandler;
          item._dragOverHandler = dragOverHandler;
          item._dropHandler = dropHandler;
          item._dragEndHandler = dragEndHandler;
          
          // 移除旧监听器
          if (item._oldDragStartHandler) {
            item.removeEventListener('dragstart', item._oldDragStartHandler);
            item.removeEventListener('dragover', item._oldDragOverHandler);
            item.removeEventListener('drop', item._oldDropHandler);
            item.removeEventListener('dragend', item._oldDragEndHandler);
          }
          
          // 设置可拖拽
          item.draggable = true;
          item.dataset.index = index;
          
          // 添加样式提示可拖拽
          item.style.cursor = 'move';
          item.style.userSelect = 'none';
          
          // 添加事件监听
          item.addEventListener('dragstart', dragStartHandler);
          item.addEventListener('dragover', dragOverHandler);
          item.addEventListener('drop', dropHandler);
          item.addEventListener('dragend', dragEndHandler);
          
          // 保存旧处理器
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
        
        // 如果点击的是图片或其他子元素，确保能拖拽
        if (e.target !== item) {
          // 如果点击的是图片，阻止图片的默认拖拽行为
          if (e.target.tagName === 'IMG') {
            e.preventDefault();
            // 手动触发父元素的拖拽
            item.dispatchEvent(new DragEvent('dragstart', {
              bubbles: true,
              cancelable: true,
              dataTransfer: e.dataTransfer
            }));
            return;
          }
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
          indicator.style.cssText = 'position: absolute; left: 0; right: 0; height: 2px; background: #409eff; z-index: 10; pointer-events: none;';
          
          currentItem.style.position = 'relative';
          if (mouseY > itemCenterY) {
            // 鼠标在下半部分，插入到后面
            indicator.style.bottom = '0';
            currentItem.appendChild(indicator);
          } else {
            // 鼠标在上半部分，插入到前面
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
          if (mouseY > itemCenterY && dragIndex < targetIndex) {
            insertIndex = targetIndex;
          } else if (mouseY <= itemCenterY && dragIndex > targetIndex) {
            insertIndex = targetIndex;
          } else if (dragIndex < targetIndex) {
            insertIndex = targetIndex;
         } else {
            insertIndex = targetIndex;
          }
          
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
        
        // 恢复所有列表项的透明度
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
              offset: '300'
            });
            return;
          }
          
          if (!this.form.name || !this.form.category) {
              ElMessage({
              message: '插画名称、类别不能为空',
          type: 'warning',
              offset: '300'
        });
            return;
          }
          
          this.disabled = true;
          
          try {
            // 步骤1：先将所有图片上传到 /ill/ 接口，获取图片ID
            const imageIds = [];
            let successCount = 0;
            let failCount = 0;
            
            ElMessage.info('正在上传图片...');
            
            for (let i = 0; i < this.fileList.length; i++) {
              try {
                let formdata = new FormData();
                formdata.append('picture', this.fileList[i]);
                formdata.append('title', this.form.name + (i > 0 ? ` (${i + 1})` : ''));
                formdata.append('description', this.form.desc);
                formdata.append('type', this.form.category);
                
                const response = await this.$http.post(`/ill/`, formdata, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    "Authorization": "Bearer " + localStorage.getItem("token")
                  }
                });
                
                if (response.data && (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0')) {
                  // 获取图片ID
                  const imageId = response.data.message?._id || response.data.message?.id || response.data.data?._id || response.data.data?.id;
                  if (imageId) {
                    imageIds.push(imageId);
                    successCount++;
                  } else {
                    console.warn(`第 ${i + 1} 张图片上传成功但未返回ID`);
                    failCount++;
                  }
                } else {
                  failCount++;
                }
              } catch (error) {
                console.error(`上传第 ${i + 1} 张图片失败:`, error);
                failCount++;
              }
            }
            
            // 步骤2：如果有成功上传的图片，将图片ID数组发送到 /book/ 接口创建绘本
            if (imageIds.length > 0) {
              try {
                const response = await this.$http.post(`/book/`, {
                  content: imageIds,
                  title: this.form.name,
                  description: this.form.desc,
                  type: this.form.category
                }, {
                  headers: {
                    'Content-Type': 'application/json',
                    "Authorization": "Bearer " + localStorage.getItem("token")
                  }
                });
                
                if (response.data && (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0')) {
                  if (failCount > 0) {
                    ElMessage.success(`绘本创建成功！成功上传 ${successCount} 张图片${failCount > 0 ? `，${failCount} 张失败` : ''}`);
                  } else {
                    ElMessage.success('绘本上传成功！');
                  }
                  this.$router.push('/user/upload/submit-res/');
                } else {
                  throw new Error(response.data?.message || '创建绘本失败');
                }
              } catch (error) {
                console.error('创建绘本失败:', error);
                ElMessage.error('图片上传成功，但创建绘本失败，请稍后重试');
                this.disabled = false;
              }
            } else {
              ElMessage.error('所有图片上传失败，请重试');
              this.disabled = false;
            }
          } catch (error) {
            console.error('上传失败:', error);
            ElMessage.error('上传失败，请稍后重试');
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
    min-height:90vh;
    padding:40px 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background-color: #f5f6fa;
}
.box{
    width:60vw;
    max-width: 1200px;
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
}

.box  :deep(.el-form-item) {
    margin-bottom: 48px;
    text-align: left !important; /* 确保表单项内容左对齐 */
}

/* 确保上传表单项内容左对齐 */
.box  :deep(.el-form-item__content) {
    text-align: left !important;
    justify-content: flex-start !important;
}

.box  :deep(.el-form-item__label) {
    text-align: left;
    font-weight: 500;
    color: #606266;
}

/* 统一输入框样式 */
.box  :deep( .el-input,)
.box  :deep( .el-select,)
.box  :deep(.el-textarea) {
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

/* 按钮样式 */
.box  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
    margin-top: 10px;
}

.btn{
    width: 120px;
    height: 40px;
    font-size: 16px;
}

/* 上传容器 - 左对齐 */
.upload-container {
    width: 100%;
    text-align: left;
}

/* Element UI upload组件根容器 - 使用flex布局，让列表和按钮在同一行 */
.custom-upload  :deep(.el-upload) {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0; /* 使用gap统一间距 */
}

/* 缩略图列表 - 使用flex布局，让列表项和上传按钮一起换行 */
.custom-upload  :deep(.el-upload-list--picture-card) {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
}

/* 缩略图项 - 4:3 宽高比，可拖拽 */
.custom-upload  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 148px;
    height: 111px; /* 148 * 3/4 = 111px，保持4:3比例 */
    margin-right: 8px;
    margin-bottom: 8px;
    flex-shrink: 0;
    cursor: move;
    position: relative;
    user-select: none;
	}

/* 确保缩略图内的图片不可拖拽，只有容器可拖拽 */
.custom-upload  :deep(.el-upload-list--picture-card .el-upload-list__item img) {
    pointer-events: none;
    user-select: none;
}

/* 缩略图图片 - 按比例显示 */
.custom-upload  :deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
}

/* 上传按钮 - 4:3 宽高比，紧跟缩略图 */
.custom-upload  :deep(.el-upload--picture-card) {
    width: 148px;
    height: 111px; /* 148 * 3/4 = 111px，保持4:3比例 */
    line-height: 111px;
    margin-right: 8px;
    margin-bottom: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
	}

/* 确保加号图标居中 */
.custom-upload  :deep(.el-upload--picture-card .el-icon-plus) {
    line-height: 1;
    font-size: 28px;
    color: #8c939d;
}

/* 拖拽时的样式 */
.custom-upload  :deep(.el-upload-list__item[draggable="true"]) {
    cursor: move;
    transition: opacity 0.2s;
}

.custom-upload  :deep(.el-upload-list__item[draggable="true"]:hover) {
    opacity: 0.8;
	}
</style>