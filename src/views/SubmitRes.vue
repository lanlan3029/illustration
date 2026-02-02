<template>
<div class="container">
  <div class="box">
   <!--  <div class="steps">
    <el-steps :space="200" :active="1" finish-status="success" align-center>
  <el-step title="已上传"></el-step>
  <el-step title="待审核"></el-step>
  <el-step title="发布成功"></el-step>
</el-steps></div> -->
<h1>上传成功，非常感谢您的分享。</h1>
<el-image
      style="width:30vw; height:30vw;margin:auto"
      :src="sumitImg"
      fit="contain"></el-image>

<div class="middle">
  <el-button type="primary" @click="upload">继续上传</el-button>
  <el-button @click="home">返回首页</el-button>
</div>
  </div>
</div>
</template>

<script>
export default {
  data(){
    return{
      sumitImg:require('../assets/images/submit.webp')
    }
  },
  methods:{
   upload(){
    this.$router.push('/user/upload');
   },
   home(){
    this.$router.push('/')
   }
  }
    
}
</script>

<style scoped>
.container{
   width: 100vw;
  height: 90vh;
  background-color: #f5f5f5;
  overflow: scroll;
}
.box{
   width: 984.3px;
  height: 90vh;
  margin: auto;
  padding:2vw;
  display: flex;
  flex-direction: column;
  
  background-color: #fff;
  border-radius: 8px;
}
.box .steps{
  
  width:600px;
  margin:120px auto;
}
.box .middle{
  width: 400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
}
</style>