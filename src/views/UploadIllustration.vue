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
    <el-button type="primary" @click="onSubmit" class="btn">上传</el-button>
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
          content:this.imgUrl
        }
    }
  },
     computed:mapState([
    "imgUrl"
  ]),
  
  mounted(){
   
  },
  methods:{
    onSubmit(){
      console.log(this.imgUrl)
      this.$router.push('/user/upload/compose-illustration/submit-res/')
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
  width:120px;
  margin-left: 190px;
}
</style>