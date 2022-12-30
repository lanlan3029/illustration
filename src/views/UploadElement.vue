<template>
    <div class="container">
    <div class="box">
    
    <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上传图元">
        <el-upload
        ref="element-upload"
      action="http://119.45.172.191:3000/picture/"
      list-type="picture-card"
      :on-preview="handlePictureCardPreview"
      :auto-upload="false"
      :on-change="fileChange"
      :on-remove="handleRemove"
      accept=".png"
      :class="objClass">
      <i class="el-icon-plus"></i>
      <div slot="tip" class="el-upload__tip">图元上传后为创作页面左侧的单个元素，只接受png格式的文件。</div>
    </el-upload>
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>
      </el-form-item>
      <el-form-item label="图元名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="类别">
    <el-select v-model="form.category" placeholder="请选择图元类别">
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
            this.dialogVisible = false;
          },
  
          fileChange(file){
             const isLt2M = file.size / 1024 / 1024 < 1;
        if (!isLt2M) {
          this.$message.error('上传图片大小不能超过 1MB!');
          this.$refs['element-upload'].clearFiles()
        }else{
          this.objClass.uploadHide=true;
            this.objClass.uploadShow=false;
             this.fileStore=file.raw
        }
        return isLt2M;

          },
          onSubmit(){
            if((this.fileStore!={})&(this.form.name!='')&(this.form.category!='')){
              this.disabled = true;
            let formdata = new window.FormData()
            formdata.append('picture',this.fileStore)
            formdata.append('title',this.form.name)
            formdata.append('description',this.form.desc)
            formdata.append('type',this.form.category)
            console.log(formdata.title)
         this.$http
        .post(`/picture/`,formdata
        ,{
          headers:{
            'Content-Type': 'multipart/form-data',
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            this.$router.push('/user/upload/submit-res/');        
          } else {
             this.$router.push({path:'/errorpage'});   
          }
        })
        .catch((error) => console.log(error));
            }else{
              this.$message({
          message: '图元、图元名称、类别不能为空',
          type: 'warning',
          offset:'300'
        });
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
    }
    .box{
        width:60vw;
    }
    .box>>>.el-input__inner{
        box-shadow:none;
    }
    .btn{
      width:150px;
    }
    .uploadShow .el-upload {
		width: 30rem !important;
		height: 30rem !important;
		line-height: 30rem !important;
	}

        /*当upLoadHide为true时，启用如下样式，即缩略图的样式，若为false则不启用该样式*/
	.uploadHide .el-upload-list--picture-card .el-upload-list__item {
		width: 30rem !important;
		height: 30rem !important;
		line-height: 30rem !important;
	}

        /*当upLoadHide为true时，启用如下样式，即上传框的样式，若为false则不启用该样式*/
	/deep/.uploadHide .el-upload {
		display: none;
	}
    </style>