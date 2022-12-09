<template>
    <div class="container">
<div class="box">
<el-form label-width="100px" ref="form" :model="form">
    <el-form-item label="作品">
    <el-image :src="(`http://119.45.172.191:3000/`+ editionIllus.content)" style="width:500px;height:352px" fit="contain"/>
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
        <el-option label="其他" value="others"></el-option>
    </el-select>
  </el-form-item>
  <el-form-item label="作品描述">
    <el-input type="textarea" v-model="form.desc"></el-input>
  </el-form-item>
   <el-form-item>
    <el-button type="primary" @click="onSubmit(editionIllus._id)" class="btn">上传</el-button>
    <el-button  @click="deleteIll(editionIllus._id)" class="btn">删除</el-button>
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
          name:'',
          desc:'',
          category:'',
        }
   
    }
  },
     computed:mapState([
    "editionIllus"
  ]),
  
  mounted(){
   this.form.name= this.editionIllus.title,
   this.form.desc=this.editionIllus.description,
   this.form.category=this.editionIllus.type
  },
  methods:{
    onSubmit(id){
      this.$http.put(`/ill/`+id,
      {title:this.form.name,description:this.form.desc,type:this.form.category},
      {
         headers:{
           "Authorization":"Bearer "+localStorage.getItem("token")
         }})
      .then((response)=>{
        if (response.data.desc === "success"){
          this.$router.push('/user/upload/edition-success')
        }
      })
      
    },
    //删除插画
    deleteIll(id){
      this.$http
        .delete(`/ill/`+id,
        {
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        },
    ).then((response) => {
          if (response.data.desc === "success") {
            this.$message({
          message: '已删除',
          type: 'success'
        });
        this.$router.push('/user')
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
    overflow-y: scroll;
}
.box{
    width:60vw;
    height:90vh;
   
}
.box>>>.el-input__inner{
    box-shadow:none;
}
.btn{
  width:120px;
 margin-left:86px;
}
</style>