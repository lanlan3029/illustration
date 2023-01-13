<template>

  

  <div class="content">
    <div class="defaultPic">
    <el-image :src="imgUrl" fit="fill" style="width:70vw;height:84vh"/>
    </div>

    <right-menu />

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
  overflow: scroll;
}
.defaultPic{
  margin-left: 8vw;
  margin-top:1vh;
  width:72vw;
    height:calc(94vh-72px);
    background-color:#f5f6fa;
    border-radius: 8px;
    padding:1vh;
    overflow: hidden;
}

</style>