<template>
<div class="container">
<div class="box">
<el-form ref="form" :model="form" label-width="120px" label-position="left">
    <el-form-item label="头像">
      <div v-if="(form.avatar)" class="hasImg">
        <el-avatar :size="120" :src="form.avatar"></el-avatar>
        <span class="editIcon" @click="editAvatar">
          <i class="el-icon-edit"></i>
        </span>
      </div>
      <div v-else>
        <el-upload
          ref="upload"
          action="#"
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :auto-upload="false"
          :on-change="fileChange"
          :on-remove="handleRemove"
          accept=".png, .jpg, .jpeg, .JPG, .JPEG"
          :class="objClass">
          <i class="el-icon-plus"></i>
        </el-upload>
        <el-dialog :visible.sync="dialogVisible" width="80%">
          <img width="100%" :src="dialogImageUrl" alt="">
        </el-dialog>
      </div>
    </el-form-item>
  <el-form-item label="用户名">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  
    <el-form-item label="性别" >
        <el-radio-group v-model="form.gender">
    <el-radio label="male">男</el-radio>
      <el-radio label="female">女</el-radio></el-radio-group>
  </el-form-item>
   <el-form-item label="出生年月" prop="date">
     <el-date-picker type="date" placeholder="选择日期" v-model="form.birthday" style="width: 100%;"></el-date-picker>
  </el-form-item>
 
  <el-form-item prop="email" label="邮箱">
    <el-input v-model="form.email"></el-input>
  </el-form-item>

   <el-form-item>
    <el-button type="primary" @click="onSubmit" class="btn">修改</el-button>
   
  </el-form-item>

</el-form>

</div>
</div>
</template>

<script>

import {mapState} from "vuex"

export default {
   data() {
      return {
        dialogImageUrl: '',
        dialogVisible: false,
        form: {
          avatar:'',
          name:'',
          email:'',
          birthday:'',
          gender:''
        },
        objClass:{
          uploadShow:true,
          uploadHide:false
        },
        imgBase64:''

      };
    },
    computed:mapState([
        "userInfo"
    ]),
    mounted(){
      this.setInfo()
    },
    methods: {
      setInfo(){
       this.form.avatar=this.userInfo.avatar
      this.form.name=this.userInfo.name
      this.form.gender=this.userInfo.gender
      this.form.birthday=this.userInfo.birthday
      this.form.introduce=this.userInfo.introduce
      this.form.email=this.userInfo.email
      },
      
 
      handleRemove() {
            this.objClass.uploadShow=true;
            this.objClass.uploadHide=false;
            
          },
          handlePictureCardPreview(file) {
            console.log("handlePicturePreview")
            this.dialogImageUrl = file.url;
            this.dialogVisible = true;
          },
          fileChange(file){
          
        const isLt2M = file.size / 1024 / 1024 < 2;
       if (!isLt2M) {
          this.$message.error('上传头像图片大小不能超过 2MB!');
          this.$refs.upload.clearFiles()
        }else{
          this.objClass.uploadHide=true;
            this.objClass.uploadShow=false;
          this.getBase64(file.raw).then(res=>{
     this.imgBase64=res
        })
             
          }},
        //转Base64
          getBase64(file){
             return new Promise(function(resolve,reject){
              let reader=new FileReader();
              let imgResult="";
              reader.readAsDataURL(file);
              reader.onload=function(){
                imgResult=reader.result
              };
              reader.onerror=function(error){
                reject(error)
              };
              reader.onloadend = function() {
                        resolve(imgResult);
                    };
             })
          },
      //修改个人信息
      onSubmit() {
        this.disabled = true;
          
         this.$http
        .put(`/user/`+this.userInfo._id,{avatar:this.imgBase64,name:this.form.name,gender:this.form.gender,
          birthday:this.form.birthday,introduce:this.form.introduce,email:this.form.email}
        ,{
          headers:{
            'Content-Type': 'multipart/form-data',
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success") {
            this.$message({
          message: '个人资料修改成功',
          type: 'success'
        });     
            this.$router.push('/user/profile');  
            this.userInfo.avatar=this.imgBase64
             
          } else {
             this.$router.push({path:'/errorpage'});   
          }
        })
        .catch((error) => console.log(error));
      },

      editAvatar(){
      this.form.avatar=""
      console.log("dianjil")
      },
      //头像
      handleAvatarSuccess(res, file) {
        this.form.avatar = URL.createObjectURL(file.raw);
      },


    }
}
</script>

<style scoped>
.container {
    width: 100vw;
    min-height: 90vh;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background-color: #f5f6fa;
}

.box {
    width: 100%;
    max-width: 900px;
    height: 80vh;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表单样式统一 */
.box >>> .el-form {
    width: 100%;
    text-align: left;
}

.box >>> .el-form-item {
    margin-bottom: 32px;
    text-align: left;
}

.box >>> .el-form-item__label {
    text-align: left;
    font-weight: 500;
    color: #606266;
    padding-right: 20px;
}

.box >>> .el-form-item__content {
    text-align: left;
}

/* 统一输入框样式 */
.box >>> .el-input,
.box >>> .el-select,
.box >>> .el-textarea,
.box >>> .el-date-editor {
    width: 100%;
}

.box >>> .el-input__inner,
.box >>> .el-textarea__inner {
    box-shadow: none;
    border: 1px solid #dcdfe6;
    transition: border-color 0.2s;
}

.box >>> .el-input__inner:focus,
.box >>> .el-textarea__inner:focus {
    border-color: #409eff;
}

/* 选择框样式 */
.box >>> .el-select {
    width: 100%;
}

.box >>> .el-select .el-input__inner {
    width: 100%;
}

/* 日期选择器样式 */
.box >>> .el-date-editor {
    width: 100%;
}

/* 单选框组样式 */
.box >>> .el-radio-group {
    display: flex;
    align-items: center;
    gap: 20px;
}

.box >>> .el-radio {
    margin-right: 0;
}

/* 按钮样式 */
.box >>> .el-form-item:last-child {
    margin-bottom: 0;
    margin-top: 20px;
}

.btn {
    width: 120px;
    height: 40px;
    font-size: 16px;
}

/* 头像区域样式 */
.hasImg {
    position: relative;
    display: inline-block;
}

.editIcon {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 100;
    cursor: pointer;
    font-size: 24px;
    color: #409eff;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s;
}

.editIcon:hover {
    background-color: #409eff;
    color: #fff;
    transform: scale(1.1);
}

/* 标签样式 */
.tag {
    margin-left: 12px;
    margin-top: 12px;
}

.box >>> .el-tag {
    margin-right: 8px;
    margin-top: 8px;
}

/* 上传组件样式 */
.uploadShow >>> .el-upload {
    width: 120px !important;
    height: 120px !important;
    line-height: 120px !important;
    border-radius: 8px;
}

.uploadShow >>> .el-upload .el-icon-plus {
    font-size: 28px;
    color: #8c939d;
}

.uploadHide >>> .el-upload-list--picture-card .el-upload-list__item {
    width: 120px !important;
    height: 120px !important;
    border-radius: 8px;
}

.uploadHide >>> .el-upload {
    display: none !important;
}

/* 对话框样式 */
.box >>> .el-dialog__body {
    padding: 20px;
}

.box >>> .el-dialog__body img {
    border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .container {
        padding: 20px 10px;
    }
    
    .box {
        padding: 24px;
    }
    
    .box >>> .el-form-item {
        margin-bottom: 24px;
    }
}
</style>