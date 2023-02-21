<template>
<div class="container">
<div class="box">

<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="头像">
      <div v-if="(form.avatar)" class="hasImg"><el-avatar  :size="120" :src="form.avatar"></el-avatar><span class="editIcon"><i class="el-icon-edit" @click="editAvatar"></i></span></div>
<div v-else>      <el-upload
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
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog></div>


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
   <el-form-item label="个人介绍">
    <el-input type="textarea" v-model="form.introduce"></el-input>
    <el-tag>标签一</el-tag><el-tag class="tag">标签一</el-tag><el-tag class="tag">标签一</el-tag>
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
          introduce: '',
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


  .tag{
    margin-left:18px;
  }
  .editIcon{
    z-index:100; 
    cursor: pointer;
    font-size: 22px;
  }
  .editIcon:hover{
   color:#409EFF
  }
  /*当upLoadShow为true时，启用如下样式，即上传框的样式，若为false则不启用该样式*/
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