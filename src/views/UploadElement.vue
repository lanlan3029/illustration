<template>
    <div class="container">
    <div class="box">
    
    <el-form ref="form" :model="form" label-width="100px">
        <el-form-item label="上传图元">
        <el-upload
      action="http://10.0.0.31:3000/picture/"
      list-type="picture-card"
      :on-preview="handlePictureCardPreview"
      :auto-upload="false"
      :on-change="fileChange"
      :on-remove="handleRemove"
      :class="objClass">
      <i class="el-icon-plus"></i>
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
        <el-option label="家具" value="furniture"></el-option>
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
            this.objClass.uploadHide=true;
            this.objClass.uploadShow=false;
             this.fileStore=file.raw
             console.log(this.fileStore)
          },
          onSubmit(){
            this.disabled = true;
            let formdata = new window.FormData()
            formdata.append('picture',this.fileStore)
            formdata.append('title',this.form.name)
            formdata.append('description',this.form.desc)
            formdata.append('type',this.form.category)
            console.log(formdata)
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