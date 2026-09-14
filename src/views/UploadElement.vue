<template>
    <div class="container">
        <div class="header">
            <p>上传 PNG 图元，用于创作页面左侧元素库。请确保画布透明；单文件不超过 1MB，超过将自动压缩（保留 PNG 透明）。可一次上传多个图元，并逐个编辑信息。</p>
        </div>

        <el-card class="card" shadow="hover">
            <el-form ref="form" :model="form" :rules="rules" label-width="96px">
                <el-form-item label="图元文件">
                    <div class="upload-row">
                        <el-upload
                            ref="element-upload"
                            action="https://api.kidstory.cc/picture/"
                            :show-file-list="false"
                            :auto-upload="false"
                            :on-change="fileChange"
                            :limit="20"
                            accept=".png"
                            multiple>
                            <el-button type="primary">
                                <i class="el-icon-upload"></i> 选择图元文件
                            </el-button>
                        </el-upload>
                        <div class="upload-hint">
                            <div class="badges">
                                <span class="badge">PNG</span>
                                <span class="badge">≤1MB·可压缩</span>
                                <span class="badge">透明背景</span>
                            </div>
                            <p>可一次选择多个文件，选择后将在下方表格中显示，请为每个图元编辑信息后单独上传。</p>
                        </div>
                    </div>
                </el-form-item>

                <template v-if="elements.length > 0">
                    <el-divider content-position="left">图元列表</el-divider>
                    <el-table 
                        :data="elements" 
                        stripe
                        border
                        class="element-table">
                        <el-table-column label="图片" width="120" align="center">
                            <template #default="{ row }">
                                <el-image 
                                    :src="row.url" 
                                    fit="contain"
                                    class="table-image"
                                    :preview-src-list="[row.url]">
                                    <template #error>
                                        <div class="image-slot">
                                            <i class="el-icon-picture-outline"></i>
                                        </div>
                                    </template>
                                </el-image>
                            </template>
                        </el-table-column>
                        <el-table-column label="类别" width="150">
                            <template #default="{ row }">
                                <el-select 
                                    v-model="row.category" 
                                    placeholder="选择类别" 
                                    size="small"
                                    style="width: 100%">
                                    <el-option label="背景" value="background"></el-option>
                                    <el-option label="场景" value="scene"></el-option>
                                    <el-option label="文本框" value="textbox"></el-option>
                                    <el-option label="人物" value="people"></el-option>
                                    <el-option label="动物" value="animal"></el-option>
                                    <el-option label="植物" value="plant"></el-option>
                                    <el-option label="食物" value="food"></el-option>
                                    <el-option label="玩具" value="toy"></el-option>
                                    <el-option label="交通工具" value="vehicle"></el-option>
                                    <el-option label="装饰" value="decoration"></el-option>
                                    <el-option label="家居" value="furniture"></el-option>
                                    <el-option label="其它" value="others"></el-option>
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column label="描述" min-width="200">
                            <template #default="{ row }">
                                <el-input 
                                    v-model="row.desc" 
                                    type="textarea" 
                                    :rows="2"
                                    size="small"
                                    placeholder="可选，简要说明此图元的用途或风格">
                                </el-input>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" align="center" fixed="right">
                            <template #default="{ row }">
                                <el-tooltip v-if="row.uploadStatus === 'success'" content="已上传" placement="top">
                                    <el-button 
                                        type="success"
                                        size="small"
                                        circle
                                        disabled>
                                        <el-icon><Check /></el-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-button 
                                    v-else
                                    type="primary"
                                    size="small"
                                    :loading="row.uploadStatus === 'uploading'"
                                    :disabled="!row.name || !row.category || row.uploadStatus === 'uploading'"
                                    @click="uploadSingleElement(row)">
                                    {{ row.uploadStatus === 'uploading' ? '上传中' : '上传' }}
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>

            </el-form>
        </el-card>
    </div>
</template>
    
    <script>
    import { ElMessage } from 'element-plus'
    import { Check } from '@element-plus/icons-vue'
    import imageCompression from 'browser-image-compression'
    
    export default {
      components: {
        Check
      },
       data() {
          return {
            dialogImageUrl: '',
            dialogVisible: false,
            disabled:false,
            form: {
              name: '',
              desc: '',
              category:'',
              is_public: 1, // 默认公开
            },
            rules: {
          name: [
            { required: true, message: '请输入名称', trigger: 'blur' },
          ],
          category: [
            { required: true, message: '请选择类别', trigger: 'blur' },
          ],
        },
            elements: [], // 存储多个图元的数据 [{ file, url, name, category, desc, is_public, uid }]
            compressingUids: new Set(),
          };
        },
        beforeRouteEnter(to, from, next) {
            if (to.query.mode === 'character') {
                next({
                    name: 'character-studio-workbench',
                    params: { characterId: 'new' },
                    replace: true,
                });
                return;
            }
            next();
        },
        methods: {
          handleRemove(file) {
            // 从 elements 数组中移除对应的图元
            const index = this.elements.findIndex(el => el.uid === file.uid);
            if (index !== -1) {
              this.elements.splice(index, 1);
            }
          },
          handlePictureCardPreview(file) {
            this.dialogImageUrl = file.url;
            this.dialogVisible = true;
          },
  
          async compressElementPng(file) {
            const MAX_BYTES = Math.floor(1024 * 1024 * 0.98);
            let blob = file;
            let maxDim = 2048;

            for (let attempt = 0; attempt < 6 && blob.size > MAX_BYTES; attempt += 1) {
              blob = await imageCompression(blob, {
                maxSizeMB: 0.98,
                maxWidthOrHeight: maxDim,
                fileType: 'image/png',
                useWebWorker: typeof Worker !== 'undefined',
              });
              maxDim = Math.max(480, Math.floor(maxDim * 0.8));
            }

            const baseName = (file.name || 'element').replace(/\.png$/i, '');
            return new File([blob], `${baseName}.png`, {
              type: 'image/png',
              lastModified: Date.now(),
            });
          },

          async fileChange(file, fileList) {
            if (!file?.raw) return;

            if (this.compressingUids.has(file.uid)) return;
            if (this.elements.some((el) => el.uid === file.uid)) return;

            this.compressingUids.add(file.uid);
            try {
              let processed = file.raw;
              const needCompress = processed.size / 1024 / 1024 >= 1;

              if (needCompress) {
                ElMessage.info(`正在压缩「${file.name}」…`);
                processed = await this.compressElementPng(file.raw);
                if (processed.size / 1024 / 1024 >= 1) {
                  ElMessage.error(`「${file.name}」压缩后仍超过 1MB，请缩小图片后重试`);
                  const index = fileList.findIndex((f) => f.uid === file.uid);
                  if (index !== -1) fileList.splice(index, 1);
                  return;
                }
                ElMessage.success(
                  `「${file.name}」已压缩至 ${(processed.size / 1024).toFixed(0)}KB`
                );
              }

              file.raw = processed;
              file.size = processed.size;

              const previewUrl = URL.createObjectURL(processed);
              this.elements.push({
                file: processed,
                url: previewUrl,
                uid: file.uid,
                name: file.name.replace(/\.png$/i, '') || '',
                category: '',
                desc: '',
                is_public: 1,
                uploadStatus: 'pending',
              });
            } catch (error) {
              console.error('图元压缩失败:', error);
              ElMessage.error(`「${file.name}」压缩失败，请换一张图重试`);
              const index = fileList.findIndex((f) => f.uid === file.uid);
              if (index !== -1) fileList.splice(index, 1);
            } finally {
              this.compressingUids.delete(file.uid);
            }
          },
          
          // 移除单个图元
          removeElement(index) {
            const element = this.elements[index];
            if (element.uploadStatus === 'uploading') {
              ElMessage.warning('正在上传中，请稍候再删除');
              return;
            }
            
            this.$confirm('确定要删除这个图元吗？', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              // 从 elements 中移除
              this.elements.splice(index, 1);
              
              // 从上传组件中移除对应的文件
              if (this.$refs['element-upload']) {
                const fileList = this.$refs['element-upload'].fileList || [];
                const fileIndex = fileList.findIndex(f => f.uid === element.uid);
                if (fileIndex !== -1) {
                  this.$refs['element-upload'].handleRemove(fileList[fileIndex]);
                }
              }
              
              ElMessage.success('已删除');
            }).catch(() => {
              // 用户取消
            });
          },
          
          // 单个图元上传
          async uploadSingleElement(element) {
            // 验证必填项
            if (!element.name || !element.category) {
              ElMessage.warning('请填写图元名称和选择类别');
              return;
            }

            // 设置上传状态
            element.uploadStatus = 'uploading';
            
            try {
              const token = localStorage.getItem('token');
              const formdata = new window.FormData();
              formdata.append('picture', element.file);
              formdata.append('title', element.name);
              formdata.append('description', element.desc || '');
              formdata.append('type', element.category);
              formdata.append('is_public', element.is_public);

              const response = await this.$http.post(`/picture/`, formdata, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'Authorization': 'Bearer ' + token
                }
              });

              if (response.data.desc === "success") {
                // 上传成功
                element.uploadStatus = 'success';
                ElMessage.success(`图元 "${element.name}" 上传成功`);
              } else {
                // 上传失败
                element.uploadStatus = 'error';
                ElMessage.error(`图元 "${element.name}" 上传失败: ${response.data.message || '未知错误'}`);
              }
            } catch (error) {
              // 上传失败
              element.uploadStatus = 'error';
              const errorMsg = error.response?.data?.message || error.message || '上传失败';
              ElMessage.error(`图元 "${element.name}" 上传失败: ${errorMsg}`);
            }
          },
        }
    }
    </script>
    
<style scoped>
    .container{
        width:100vw;
        min-height:calc(100vh - 72px - 80px);
        max-height: calc(100vh - 72px - 80px);
        padding:32px 24px 64px;
        background: #f7f8fa;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
    }
    .header{
        width:100%;
        max-width: 920px;
        margin: 8px auto 40px;
    }
    .header h1{
        margin:0 0 8px;
        font-size: 22px;
        color:#1c345e;
    }
    .header p{
        margin:0;
        color:#667085;
        font-size: 14px;
    }
    .card{
        width:100%;
        max-width: 920px;
        border-radius: 16px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.06);
        max-height: calc(100vh - 200px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .card :deep(.el-card__body) {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 24px;
        max-height: calc(100vh - 250px);
    }
    
    /* 自定义滚动条样式 */
    .card :deep(.el-card__body)::-webkit-scrollbar {
        width: 8px;
    }
    
    .card :deep(.el-card__body)::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    
    .card :deep(.el-card__body)::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }
    
    .card :deep(.el-card__body)::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
    .upload-row{
        display: flex;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
    }
    .upload-hint{
        flex: 1;
        min-width: 240px;
        color:#667085;
        font-size: 13px;
        line-height: 1.6;
        padding-top: 8px;
        text-align: left;
    }
    .badges{ display:flex; gap:8px; margin-bottom:8px; flex-wrap: wrap; }
    .badge{
        padding:4px 8px;
        background:#e6f7ff;
        color:#019AD8;
        border:1px solid #bfe9fb;
        border-radius: 999px;
        font-size: 12px;
        line-height: 1;
    }
    .full{ width:100%; }
    .actions{ display:flex; justify-content:flex-end; padding-top: 8px; gap: 12px; }
    .btn{ min-width: 140px; }

    /* 上传框尺寸（初始） */
    .uploadShow .el-upload {
        width: 18rem !important;
        height: 18rem !important;
        line-height: 18rem !important;
    }
    /* 缩略图尺寸（选择后） */
    .uploadHide .el-upload-list--picture-card .el-upload-list__item {
        width: 18rem !important;
        height: 18rem !important;
        line-height: 18rem !important;
    }
    /* 选择后隐藏上传框 */
    .uploadHide  :deep(.el-upload) { display: none; }

    @media (max-width: 1024px){
        .container{ padding:24px 16px 56px; }
        .header, .card{ max-width: 760px; }
    }
    @media (max-width: 768px){
        .header h1{ font-size: 18px; }
        .uploadShow .el-upload,
        .uploadHide .el-upload-list--picture-card .el-upload-list__item{
            width: 14rem !important;
            height: 14rem !important;
            line-height: 14rem !important;
        }
    }
    /* 移除输入与下拉选择阴影 */
    .card  :deep(.el-input__inner),
    .card  :deep(.el-textarea__inner),
    .card  :deep(.el-select .el-input__inner) {
        box-shadow: none !important;
    }
    /* 多个图元编辑样式 */
    .element-item {
        margin-bottom: 24px;
    }
    .element-item:last-child {
        margin-bottom: 0;
    }
    .element-card {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
    }
    .element-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
    }
    .element-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
    }
    .element-preview {
        width: 100%;
        max-width: 200px;
        height: 150px;
        margin-bottom: 16px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .element-preview-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    
    /* 表格样式 */
    .element-table {
        margin-top: 16px;
        width: 100%;
    }
    
    .table-image {
        width: 100px;
        height: 100px;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
        background: #f5f7fa;
    }
    
    .table-image :deep(.el-image__inner) {
        object-fit: contain;
    }
    
    .image-slot {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background: #f5f7fa;
        color: #909399;
        font-size: 24px;
    }
    
    .element-table :deep(.el-table__cell) {
        padding: 12px 0;
    }
    
    .element-table :deep(.el-textarea__inner) {
        min-height: 60px;
    }
</style>