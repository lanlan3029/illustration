<template>
  <div>
  

  <div class="content">
    <div class="defaultPic">
    <el-image :src="imgUrl" fit="fill" style="width:122vh;height:86vh"/>
    </div>

    <right-menu />

  </div>

  </div>
</template>

<script>
// @ is an alias to /src



import RightMenu from '../components/RightMenu.vue'

export default {
  name: 'Home',
  components: {
    RightMenu,
  },
  data(){
    return{
imgUrl:require('../assets/images/111.png'),

    }
    
  },
methods:{
  
}
}
</script>
<style scoped>

.content{
  display: flex;
  width:100vw;
  margin-left: 8vw;
}
.defaultPic{
  margin-top:2vh;
  width:72vw;
    height:calc(98vh-72px);
    background-color:#f5f6fa;
    border-radius: 8px;
    padding:2vh;
}
</style>