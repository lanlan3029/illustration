<template>
    <div class="container">
        <div class="header">
            <p v-if="!isCharacterMode">上传 PNG 图元，用于创作页面左侧元素库。请确保画布透明，大小不超过 1MB。可一次上传多个图元，并逐个编辑信息。</p>
            <p v-else>确认角色信息并保存到"我的角色"。您可以修改名称、分类和描述等信息。</p>
        </div>

        <el-card class="card" shadow="hover">
            <el-form ref="form" :model="form" :rules="rules" label-width="96px">
                <!-- 图元模式：上传文件 -->
                <el-form-item v-if="!isCharacterMode" label="图元文件">
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
                                <span class="badge">≤ 1MB</span>
                                <span class="badge">透明背景</span>
                            </div>
                            <p>可一次选择多个文件，选择后将在下方表格中显示，请为每个图元编辑信息后单独上传。</p>
                        </div>
                    </div>
                </el-form-item>

                <!-- 角色模式：显示生成的图片 -->
                <el-form-item v-if="isCharacterMode" label="角色图片">
                    <div class="character-image-preview">
                        <el-image 
                            :src="characterImageUrl" 
                            fit="contain"
                            class="character-preview-image"
                            :preview-src-list="[characterImageUrl]">
                        </el-image>
                    </div>
                </el-form-item>

                <!-- 图元模式：表格显示 -->
                <template v-if="!isCharacterMode && elements.length > 0">
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
                                    <el-option label="场景" value="scene"></el-option>
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

                <!-- 角色模式：单个角色编辑表单 -->
                <template v-if="isCharacterMode">
                    <el-form-item :label="'角色名称'" prop="name">
                        <el-input v-model="form.name" maxlength="30" show-word-limit :placeholder="'请输入角色名称'"></el-input>
                    </el-form-item>

                    <el-form-item label="类别" prop="category">
                        <el-select v-model="form.category" :placeholder="'请选择角色分类'" class="full">
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
                    </el-form-item>

                    <el-form-item :label="'角色描述'">
                        <el-input type="textarea" :rows="3" v-model="form.desc" :placeholder="'可选，描述角色的特征或风格'"></el-input>
                    </el-form-item>
                    <el-form-item label="是否公开">
                        <el-radio-group v-model="form.is_public">
                            <el-radio :label="1">公开</el-radio>
                            <el-radio :label="0">不公开</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </template>

                <div class="actions" v-if="isCharacterMode">
                    <el-button 
                        class="btn" 
                        type="primary" 
                        :loading="disabled" 
                        @click="onSubmit">
                        <span>保存角色</span>
                    </el-button>
                    <el-button class="btn" @click="handleDelete">
                        <i class="el-icon-delete"></i> 清空
                    </el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>
    
    <script>
    import { ElMessage } from 'element-plus'
    import { Check } from '@element-plus/icons-vue'
    
    export default {
      components: {
        Check
      },
       data() {
          return {
            dialogImageUrl: '',
            dialogVisible: false,
            disabled:false,
            isCharacterMode: false, // 是否为角色模式
            characterImageUrl: '', // 角色图片URL
            characterData: null, // 角色数据
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
          };
        },
        mounted() {
            // 检查是否是角色模式
            if (this.$route.query.mode === 'character') {
                this.isCharacterMode = true;
                this.loadCharacterData();
            }
        },
        methods: {
          loadCharacterData() {
            // 从 localStorage 加载角色数据
            const storedData = localStorage.getItem('pendingCharacterData');
            if (storedData) {
              try {
                this.characterData = JSON.parse(storedData);
                this.characterImageUrl = this.characterData.image_url || '';
                this.form.name = this.characterData.character_name || '';
                this.form.category = this.characterData.character_type || '';
                this.form.desc = this.characterData.description || '';
                // 清理 localStorage
                localStorage.removeItem('pendingCharacterData');
              } catch (error) {
                console.error('加载角色数据失败:', error);
                ElMessage.error('加载角色数据失败，请重新生成角色');
                this.$router.push('/create-character');
              }
            } else {
              ElMessage.warning('未找到角色数据，请重新生成角色');
              this.$router.push('/create-character');
            }
          },
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
  
          fileChange(file, fileList) {
            // 检查文件大小
            const isLt1M = file.size / 1024 / 1024 < 1;
            if (!isLt1M) {
                ElMessage.error(`文件 "${file.name}" 大小不能超过 1MB!`);
                // 从文件列表中移除
                const index = fileList.findIndex(f => f.uid === file.uid);
                if (index !== -1) {
                  fileList.splice(index, 1);
                }
                return false;
            }

            // 检查是否已存在（避免重复添加）
            const exists = this.elements.some(el => el.uid === file.uid);
            if (!exists && file.raw) {
              // 创建预览 URL
              const previewUrl = file.url || URL.createObjectURL(file.raw);
              
              // 添加到 elements 数组
              this.elements.push({
                file: file.raw,
                url: previewUrl,
                uid: file.uid,
                name: file.name.replace(/\.png$/i, '') || '', // 默认使用文件名（去掉扩展名）
                category: '',
                desc: '',
                is_public: 1,
                uploadStatus: 'pending' // 上传状态：pending, uploading, success, error
              });
            }
            
            return true;
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
          onSubmit(){
            if (this.isCharacterMode) {
              // 角色模式：保存角色到 /character 接口
              this.saveCharacter();
            } else {
              // 图元模式：上传图元到 /picture/ 接口
              this.uploadElement();
            }
          },
          async saveCharacter() {
            const hasName = !!this.form.name;
            const hasCategory = !!this.form.category;
            const hasImage = !!this.characterImageUrl;

            if (!hasName || !hasCategory || !hasImage) {
              ElMessage({
                message: '角色名称、类别和图片不能为空',
                type: 'warning',
                offset: '300'
              });
              return;
            }

            this.disabled = true;

            try {
              const token = localStorage.getItem('token') || '';
              let imageUrl = this.characterImageUrl;
              const isBase64 = imageUrl.startsWith('data:');
              
              // 步骤1：先创建角色（使用占位图或原图）
              let characterId = null;
              
              // 如果图片是 base64，尝试从 characterData 中获取外部URL作为占位图
              let placeholderImageUrl = imageUrl;
              if (isBase64 && this.characterData && this.characterData.full_response) {
                const fullResponse = this.characterData.full_response;
                if (fullResponse.data && Array.isArray(fullResponse.data) && fullResponse.data.length > 0) {
                  placeholderImageUrl = fullResponse.data[0].url || fullResponse.data[0].ResultUrl || imageUrl;
                } else {
                  placeholderImageUrl = fullResponse.result_url || fullResponse.ResultUrl || fullResponse.url || imageUrl;
                }
              }
              
              // 创建角色
              const createData = {
                character_name: this.form.name,
                image_url: placeholderImageUrl, // 先使用占位图
                character_type: this.form.category,
                description: this.form.desc || undefined,
                is_public: this.form.is_public !== undefined ? this.form.is_public : 1
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
                const characterData = createResponse.data.data || createResponse.data.message || createResponse.data;
                characterId = characterData.id || characterData._id || createResponse.data.id;
              } else {
                throw new Error(createResponse.data?.message || '创建角色失败');
              }

              // 步骤2：如果图片是分割后的图片（base64），调用图像分割接口更新角色
              if (isBase64 && characterId) {
                // 提取base64数据（去掉data:image/xxx;base64,前缀）
                let base64Data = imageUrl;
                if (imageUrl.includes(',')) {
                  base64Data = imageUrl.split(',')[1];
                }

                const segmentResponse = await this.$http.post('/image-segmentation/general', {
                  image_base64: base64Data,
                  character_id: characterId,
                  character_name: this.form.name,
                  character_type: this.form.category,
                  description: this.form.desc || undefined,
                  is_public: this.form.is_public !== undefined ? this.form.is_public : 1
                }, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                  }
                });

                if (segmentResponse.data && segmentResponse.data.code === 0) {
                  // 图像分割成功，角色已更新
                  ElMessage({ message: '角色保存成功', type: 'success' });
                  this.$router.push('/user?tab=2');
                } else {
                  // 图像分割失败，但角色已创建，仍然提示成功
                  console.warn('图像分割更新失败，但角色已创建:', segmentResponse.data?.message);
                  ElMessage({ message: '角色保存成功', type: 'success' });
                  this.$router.push('/user?tab=2');
                }
              } else {
                // 如果图片不是base64，直接提示成功
                ElMessage({ message: '角色保存成功', type: 'success' });
                this.$router.push('/user?tab=2');
              }
            } catch (error) {
              console.error('保存角色失败:', error);
              ElMessage.error(error.response?.data?.message || error.message || '保存角色失败，请重试');
            } finally {
              this.disabled = false;
            }
          },
          uploadElement() {
            // 图元模式现在使用单个上传，这个方法保留用于兼容
            // 实际的上传逻辑在 uploadSingleElement 中
            ElMessage.info('请使用表格中的"上传"按钮逐个上传图元');
          },
          handleDelete() {
            this.$confirm('确定要清空所有数据吗？清空后数据将无法恢复。', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              // 清除表单数据
              this.form.name = '';
              this.form.desc = '';
              this.form.category = '';
              this.form.is_public = 1;
              
              // 清除所有图元
              this.elements = [];
              
              // 清除上传的文件
              if (this.$refs['element-upload']) {
                this.$refs['element-upload'].clearFiles();
              }
              
              // 清除角色数据
              if (this.isCharacterMode) {
                this.characterImageUrl = '';
                this.characterData = null;
                // 清理 localStorage 中的角色数据
                localStorage.removeItem('pendingCharacterData');
                // 返回角色创建页面
                this.$router.push('/create-character');
              } else {
                // 图元模式，只清除数据，留在当前页面
                ElMessage.success('已清空');
              }
            }).catch(() => {
              // 用户取消删除
            });
          }
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
    /* 角色图片预览 */
    .character-image-preview {
        width: 100%;
        max-width: 400px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f7fa;
    }
    .character-preview-image {
        width: 100%;
        height: auto;
        display: block;
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