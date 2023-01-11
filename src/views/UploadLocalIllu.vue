<template>
<div class="container">
<div class="box">

<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="上传插画">
    <el-upload
  action="https://kidstory.cc/picture/"
  list-type="picture-card"
  :auto-upload="false"
  :on-change="fileChange"
  :on-preview="handlePictureCardPreview"
  :on-remove="handleRemove"
  accept=".png, .jpg, .jpeg, .JPG, .JPEG"
  :class="objClass"
  >
  <i class="el-icon-plus"></i>
</el-upload>
<el-dialog :visible.sync="dialogVisible">
  <img width="100%" :src="dialogImageUrl" alt="">
</el-dialog>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  <el-form-item label="类别"> 
    <el-select v-model="form.category" placeholder="请选择插画类别">
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
  <el-form-item label="作品描述">
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
          category:''
        },
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
        this.objClass.uploadHide=true;
            this.objClass.uploadShow=false;
            this.fileStore=file.raw
            console.log(this.fileStore)
         },
         onSubmit(){
          if((this.fileStore!={})&(this.form.name!='')&(this.form.category!='')){
            this.disabled = true;
           let formdata = new window.FormData()
           formdata.append('picture',this.fileStore)
           formdata.append('title',this.form.name)
           formdata.append('description',this.form.desc)
           formdata.append('type',this.form.category)
           console.log(formdata)
        this.$http
       .post(`/ill/`,formdata
       ,{
         headers:{
           'Content-Type': 'multipart/form-data',
           "Authorization":"Bearer "+localStorage.getItem("token")
         }
       })
       .then((response) => {
         if (response.data.desc === "success") {
          this.$router.push('/user/upload/submit-res/')        
         } else {
            this.$router.push({path:'/errorpage'});   
         }
       })
       .catch((error) => console.log(error));
          }else{
              this.$message({
          message: '插画、插画名称、类别不能为空',
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