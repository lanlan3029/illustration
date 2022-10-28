<template>
  <div>
  
  <div class="content">
    <div class="defaultPic">
    
    </div>

    <right-menu />

  </div>

  </div>
</template>

<script>
// @ is an alias to /src




export default {
  name: 'Home',
  components: {

  },
  data(){
    return{

    }
    
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