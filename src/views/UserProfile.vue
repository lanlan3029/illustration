<template>
<div class="container">
<div class="box">

<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="头像">
    <el-upload
  class="avatar-uploader"
  action="https://jsonplaceholder.typicode.com/posts/"
  :show-file-list="false"
  :on-success="handleAvatarSuccess"
  :before-upload="beforeAvatarUpload">
  <img v-if="form.imageUrl" :src="form.imageUrl" class="avatar">
  <i v-else class="el-icon-plus avatar-uploader-icon"></i>
</el-upload>

  </el-form-item>
  <el-form-item label="用户名">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  
    <el-form-item label="性别" >
        <el-radio-group v-model="form.gender">
    <el-radio label="男"></el-radio>
      <el-radio label="女"></el-radio></el-radio-group>
  </el-form-item>
   <el-form-item label="出生年月" prop="date">
     <el-date-picker type="date" placeholder="选择日期" v-model="form.date" style="width: 100%;"></el-date-picker>
  </el-form-item>
   <el-form-item label="个人介绍">
    <el-input type="textarea" v-model="form.desc"></el-input>
    <el-tag>标签一</el-tag><el-tag class="tag">标签一</el-tag><el-tag class="tag">标签一</el-tag>
  </el-form-item>
  <el-form-item prop="email" label="邮箱">
    <el-input v-model="form.eamil"></el-input>
  </el-form-item>
   <el-form-item prop="pass" label="密码">
    <el-input v-model="form.desc"></el-input>
  </el-form-item>
 
   <el-form-item>
    <el-button type="primary" @click="onSubmit" class="btn">上传</el-button>
   
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
        form: {
          imgUrl:'',
          name: '',
          desc: '',
          emial:'',
          date:'',
          gender:''
        }
      };
    },
    methods: {
      handleRemove(file, fileList) {
        console.log(file, fileList);
      },
      handlePictureCardPreview(file) {
        this.dialogImageUrl = file.url;
        this.dialogVisible = true;
      },
      onSubmit() {
        console.log('submit!');
      },
      //头像
      handleAvatarSuccess(res, file) {
        this.form.imageUrl = URL.createObjectURL(file.raw);
      },
      beforeAvatarUpload(file) {
        const isJPG = file.type === 'image/jpeg';
        const isLt2M = file.size / 1024 / 1024 < 2;

        if (!isJPG) {
          this.$message.error('上传头像图片只能是 JPG 格式!');
        }
        if (!isLt2M) {
          this.$message.error('上传头像图片大小不能超过 2MB!');
        }
        return isJPG && isLt2M;
      }

    }
}
</script>

<style scoped>
.container{
    width:100vw;
    height:90vh;
    padding:5vw 20vw;
    overflow-y: scroll;
    align-items: center;
}
.box{
    width:60vw;
    min-height:90vh;
   
}
.box>>>.el-input__inner{
    box-shadow:none;
}
.btn{
  width:150px;
}

.avatar-uploader {
    width:180px;
    height:180px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
  .tag{
    margin-left:18px;
  }
</style>