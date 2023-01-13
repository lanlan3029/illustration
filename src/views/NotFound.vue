<template>
    <div class="container">
        <h1>喔，页面不存在...</h1>
        <el-image :src="errorImg" fit="contain" style="width:30vw;height:30vw"/>
        <p> <router-link :to="{name:'Home'}">返回首页</router-link></p>
            
           
        
    </div>
</template>

<script>


export default {
    name: 'Home',
  
    data(){
      return{
  errorImg:require('../assets/images/error.png'),
  
      }
      
    },
  }
  </script>

  <style scoped>
  .container p a{
    text-decoration: none;
    font-size: 22px;
    cursor: pointer;
  }
  </style>