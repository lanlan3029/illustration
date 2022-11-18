<template>
    <div class="container">
<div class="box">
<el-form label-width="100px">
    <el-form-item label="作品">
      <div></div>
    <el-image :src="(`http://10.0.0.31:3000/`+editionBook.content[0])" style="width:500px;height:352px" fit="contain"/>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="editionBook.title"></el-input>
  </el-form-item>
  <el-form-item label="作品描述">
    <el-input type="textarea" v-model="editionBook.description"></el-input>
  </el-form-item>
   <el-form-item>
    <el-button type="primary" @click="onSubmit" class="btn">上传</el-button>
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
   
    }
  },
     computed:mapState([
    "editionBook"
  ]),
  
  mounted(){
   console.log(this.editionBook)
  },
  methods:{
    onSubmit(){
      this.$router.push('/user/upload/compose-illustration/submit-res/')
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
}
.box>>>.el-input__inner{
    box-shadow:none;
}
.btn{
  width:120px;
 margin-left:86px;
}
</style>