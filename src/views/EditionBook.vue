<template>
    <div class="container">
<div class="box">
<el-form label-width="100px">
    <el-form-item label="作品">
      <div></div>
    <el-image :src="(`https://kidstory.cc/`+editionBook.content[0])" style="width:500px;height:352px" fit="contain"/>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="form.title"></el-input>
  </el-form-item>
  <el-form-item label="类别">
    <el-select v-model="form.category" placeholder="请选择绘本类别">
      <el-option label="儿童读物" value="reading"></el-option>
      <el-option label="习惯养成" value="habit"></el-option>
       <el-option label="英语启蒙" value="english"></el-option>
        <el-option label="数学启蒙" value="math"></el-option>
        <el-option label="科普百科" value="knowledge"></el-option>
        <el-option label="其他" value="others"></el-option>
    </el-select>
  </el-form-item>
  <el-form-item label="作品描述">
    <el-input type="textarea" v-model="form.desc"></el-input>
  </el-form-item>
   <el-form-item>
    <el-button type="primary" @click="onSubmit(editionBook._id)" class="btn">上传</el-button>
    <el-button  @click="deleteBook(editionBook._id)" class="btn">删除</el-button>
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
          title:'',
          desc:'',
          category:''
    },
    }
  },
     computed:mapState([
    "editionBook"
  ]),
  
  mounted(){
   this.form.title=this.editionBook.title,
   this.form.desc=this.editionBook.description,
   this.form.category=this.editionBook.type
  },
  methods:{
    onSubmit(id){
      this.$http.put(`/book/`+id,
      {title:this.form.title,description:this.form.desc,type:this.form.category},
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
     //删除绘本
     deleteBook(id){
      this.$http
        .delete(`/book/`+id,
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
}
.box{
    width:60vw;
    height: 90vh;
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