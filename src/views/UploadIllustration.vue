<template>
    <div class="container">
<div class="box">
<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="上传作品">
    <el-image :src="imgUrl" style="width:500px;height:352px" fit="contain"/>
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
import {mapState} from 'vuex'

export default {
  data(){
    return{
     form: {
          name: '',
          desc: '',
          category:'',
        },
        disabled:false,
    }
  },
     computed:mapState([
    "imgUrl"
  ]),
  
  mounted(){
  },
  methods:{
    onSubmit(){
      if((this.imgUrl!='')&(this.form.name!='')&(this.form.category!='')){      
        this.disabled = true;
           let formdata = new window.FormData()
           formdata.append('picture',this.imgUrl)
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
    overflow-y: scroll;
}
.box{
    width:60vw;
}
.box>>>.el-input__inner{
    box-shadow:none;
}
.btn{
  width:120px;
  margin-left: 190px;
}
</style>