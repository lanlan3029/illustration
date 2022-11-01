<template>
  <div>
  

  <div class="content">
    <div class="defaultPic">
    <el-image :src="imgUrl" :fit="cover" style="width:68vw;height:86vh"/>
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
imgUrl:require('../assets/images/111.jpeg'),

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
  width:72vw;
    height:90vh;
    background-color:#f5f6fa;
    border-radius: 8px;
    padding:2vh 2vw;
}
</style>