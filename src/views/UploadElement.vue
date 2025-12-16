<template>
    <div class="container">
        <div class="header">
            <p v-if="!isCharacterMode">上传单个 PNG 图元，用于创作页面左侧元素库。请确保画布透明，大小不超过 1MB。</p>
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
                            list-type="picture-card"
                            :on-preview="handlePictureCardPreview"
                            :auto-upload="false"
                            :on-change="fileChange"
                            :on-remove="handleRemove"
                            :limit="1"
                            accept=".png"
                            :class="objClass">
                            <i class="el-icon-plus"></i>
                        </el-upload>
                        <div class="upload-hint">
                            <div class="badges">
                                <span class="badge">PNG</span>
                                <span class="badge">≤ 1MB</span>
                                <span class="badge">透明背景</span>
                            </div>
                            <p>点击上传。上传后可预览，确认无误再提交。</p>
                        </div>
                    </div>
                    <el-dialog v-model="dialogVisible" width="520px">
                        <img width="100%" :src="dialogImageUrl" alt="preview">
                    </el-dialog>
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

                <el-form-item :label="isCharacterMode ? '角色名称' : '图元名称'" prop="name">
                    <el-input v-model="form.name" maxlength="30" show-word-limit :placeholder="isCharacterMode ? '请输入角色名称' : '请输入名称'"></el-input>
                </el-form-item>

                <el-form-item label="类别" prop="category">
                    <el-select v-model="form.category" :placeholder="isCharacterMode ? '请选择角色分类' : '请选择图元类别'" class="full">
                       

                        <el-option v-if="isCharacterMode" label="人物" value="people"></el-option>
                        <el-option v-if="isCharacterMode" label="动物" value="animal"></el-option>
                        <el-option v-if="isCharacterMode" label="植物" value="plant"></el-option>
                        <el-option v-if="isCharacterMode" label="食物" value="food"></el-option>
                        <el-option v-if="isCharacterMode" label="玩具" value="toy"></el-option>
                        <el-option v-if="isCharacterMode" label="交通工具" value="vehicle"></el-option>
                        <el-option v-if="isCharacterMode" label="装饰" value="decoration"></el-option>
                        <el-option v-if="isCharacterMode" label="家居" value="furniture"></el-option>
                        <el-option v-if="isCharacterMode" label="其它" value="others"></el-option>

                        <el-option v-if="!isCharacterMode" label="场景" value="scene"></el-option>
                        <el-option v-if="!isCharacterMode" label="人物" value="people"></el-option>
                        <el-option v-if="!isCharacterMode" label="动物" value="animal"></el-option>
                        <el-option v-if="!isCharacterMode" label="植物" value="plant"></el-option>
                        <el-option v-if="!isCharacterMode" label="食物" value="food"></el-option>
                        <el-option v-if="!isCharacterMode" label="玩具" value="toy"></el-option>
                        <el-option v-if="!isCharacterMode" label="交通工具" value="vehicle"></el-option>
                        <el-option v-if="!isCharacterMode" label="装饰" value="decoration"></el-option>
                        <el-option v-if="!isCharacterMode" label="家居" value="furniture"></el-option>
                        <el-option v-if="!isCharacterMode" label="其它" value="others"></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item :label="isCharacterMode ? '角色描述' : '图元描述'">
                    <el-input type="textarea" :rows="3" v-model="form.desc" :placeholder="isCharacterMode ? '可选，描述角色的特征或风格' : '可选，简要说明此图元的用途或风格'"></el-input>
                </el-form-item>
                <el-form-item label="是否公开">
                    <el-radio-group v-model="form.is_public">
                        <el-radio :label="1">公开</el-radio>
                        <el-radio :label="0">不公开</el-radio>
                    </el-radio-group>
                </el-form-item>

                <div class="actions">
                    <el-button class="btn" type="primary" :loading="disabled" @click="onSubmit">
                        <span>{{ isCharacterMode ? '保存角色' : '提交上传' }}</span>
                    </el-button>
                    <el-button class="btn" @click="handleDelete">
                        <i class="el-icon-delete"></i> 删除
                    </el-button>
                </div>
            </el-form>
        </el-card>
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
            fileStore:{},
            objClass:{
          uploadShow:true,
          uploadHide:false
        },
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
          handleRemove(file, fileList) {
            this.objClass.uploadShow=true;
            this.objClass.uploadHide=false;
            console.log(file, fileList);
          },
          handlePictureCardPreview(file) {
            this.dialogImageUrl = file.url;
            this.dialogVisible = true;
          },
  
          fileChange(file){
             const isLt1M = file.size / 1024 / 1024 < 1;
             if (!isLt1M) {
                 ElMessage.error('上传图片大小不能超过 1MB!');
                 this.$refs['element-upload'].clearFiles()
             } else {
                 this.objClass.uploadHide=true;
                 this.objClass.uploadShow=false;
                 this.fileStore=file.raw
             }
             return isLt1M;

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
            const hasFile = this.fileStore && Object.keys(this.fileStore).length !== 0;
            const hasName = !!this.form.name;
            const hasCategory = !!this.form.category;

            if (hasFile && hasName && hasCategory) {
                this.disabled = true;
                const formdata = new window.FormData()
                formdata.append('picture', this.fileStore)
                formdata.append('title', this.form.name)
                formdata.append('description', this.form.desc)
                formdata.append('type', this.form.category)
                formdata.append('is_public', this.form.is_public)

                this.$http
                    .post(`/picture/`, formdata, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            "Authorization": "Bearer " + localStorage.getItem("token")
                        }
                    })
                    .then((response) => {
                        if (response.data.desc === "success") {
                            ElMessage({ message: '上传成功', type: 'success' })
                            this.$router.push('/user/upload/submit-res/');
                        } else {
                            this.$router.push({ path: '/errorpage' });
                        }
                    })
                    .catch((error) => console.log(error))
                    .finally(() => {
                        this.disabled = false
                    })
            } else {
                ElMessage({
                    message: '图元、图元名称、类别不能为空',
                    type: 'warning',
                    offset: '300'
                });
            }
          },
          handleDelete() {
            this.$confirm('确定要删除吗？删除后数据将无法恢复。', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              // 清除表单数据
              this.form.name = '';
              this.form.desc = '';
              this.form.category = '';
              this.form.is_public = 1;
              
              // 清除上传的文件
              if (this.$refs['element-upload']) {
                this.$refs['element-upload'].clearFiles();
              }
              this.fileStore = {};
              this.objClass.uploadShow = true;
              this.objClass.uploadHide = false;
              
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
                ElMessage.success('已清除');
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
        padding:32px 24px 64px;
        background: #f7f8fa;
        display: flex;
        flex-direction: column;
        align-items: center;
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
</style>