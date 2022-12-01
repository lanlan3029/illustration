<template>
    <div class="container">
<div class="box">
<el-form label-width="100px" ref="form" :model="form">
    <el-form-item label="作品">
    <el-image :src="(`http://10.0.0.31:3000/`+ editionIllus.content)" style="width:500px;height:352px" fit="contain"/>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
  <el-form-item label="类别">
    <el-select v-model="form.category" placeholder="请选择图元类别">
      <el-option label="节庆" value="shanghai"></el-option>
      <el-option label="风景" value="beijing"></el-option>
       <el-option label="日常" value="beijing"></el-option>
        <el-option label="氛围" value="beijing"></el-option>
    </el-select>
  </el-form-item>
  <el-form-item label="作品描述">
    <el-input type="textarea" v-model="form.desc"></el-input>
  </el-form-item>
   <el-form-item>
    <el-button type="primary" @click="onSubmit(editionIllus._id)" class="btn">上传</el-button>
    <el-button  @click="deleteWork" class="btn">删除</el-button>
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
    deleteWork(){
        console.log("删除")
    }
 
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
    height:90vh;
    overflow-y: scroll;
}
.box>>>.el-input__inner{
    box-shadow:none;
}
.btn{
  width:120px;
 margin-left:86px;
}
</style>