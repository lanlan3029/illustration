<template>
    <div class="container">
        <div class="header">
      
            <p>上传单个 PNG 图元，用于创作页面左侧元素库。请确保画布透明，大小不超过 1MB。</p>
        </div>

        <el-card class="card" shadow="hover">
            <el-form ref="form" :model="form" :rules="rules" label-width="96px">
                <el-form-item label="图元文件">
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
                    <el-dialog :visible.sync="dialogVisible" width="520px">
                        <img width="100%" :src="dialogImageUrl" alt="preview">
                    </el-dialog>
                </el-form-item>

                <el-form-item label="图元名称" prop="name">
                    <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="请输入名称"></el-input>
                </el-form-item>

                <el-form-item label="类别" prop="category">
                    <el-select v-model="form.category" placeholder="请选择图元类别" class="full">
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
                </el-form-item>

                <el-form-item label="图元描述">
                    <el-input type="textarea" :rows="3" v-model="form.desc" placeholder="可选，简要说明此图元的用途或风格"></el-input>
                </el-form-item>

                <div class="actions">
                    <el-button class="btn" type="primary" :loading="disabled" @click="onSubmit">
                      
                        <span>提交上传</span>
                    </el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>
    
    <script>
    export default {
       data() {
          return {
            dialogImageUrl: '',
            dialogVisible: false,
            disabled:false,
            form: {
              name: '',
              desc: '',
              category:'',
            },
            rules: {
          name: [
            { required: true, message: '请输入图元名称', trigger: 'blur' },
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
        methods: {
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
                 this.$message.error('上传图片大小不能超过 1MB!');
                 this.$refs['element-upload'].clearFiles()
             } else {
                 this.objClass.uploadHide=true;
                 this.objClass.uploadShow=false;
                 this.fileStore=file.raw
             }
             return isLt1M;

          },
          onSubmit(){
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

                this.$http
                    .post(`/picture/`, formdata, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            "Authorization": "Bearer " + localStorage.getItem("token")
                        }
                    })
                    .then((response) => {
                        if (response.data.desc === "success") {
                            this.$message({ message: '上传成功', type: 'success' })
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
                this.$message({
                    message: '图元、图元名称、类别不能为空',
                    type: 'warning',
                    offset: '300'
                });
            }
         
    },
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
    .actions{ display:flex; justify-content:flex-end; padding-top: 8px; }
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
    .uploadHide >>> .el-upload { display: none; }

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
    .card >>> .el-input__inner,
    .card >>> .el-textarea__inner,
    .card >>> .el-select .el-input__inner {
        box-shadow: none !important;
    }
</style>