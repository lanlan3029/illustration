<template>
    <div class="box">
       <ul class="info">
       <li><el-avatar :size="56" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar></li>
        <li @click="likeit"><el-button type="primary" icon="iconfont icon-dianzan_kuai" circle></el-button></li>
        <li @click="collectit"><el-button type="primary" icon="iconfont icon-shoucang-shoucang" circle></el-button></li>
         
       </ul>
    </div>
</template>

<script>
export default {
    data(){
        return{
          hasClickLike:false,
          hasClickCollect:false
        }
    },
    methods:{
      likeit(){
       this.hasClickLike=true
      },
      collectit(){
        this.hasClickCollect=true
      }
    }
    
}
</script>

<style scoped>
.box{
    display: block;
    width:12vw;
    height:90vh;
   
    padding:15vw 2vw;
}
.box .info{
    list-style: none;
     display: flex;
    flex-direction: column;
    align-items: center;
}
.box .info li{
    
  width:60px;
  height:60px;
 
  margin-bottom: 90px;
}
.box .info li:active{
    animation:zoomOut;
   animation-duration: 2s;
}
.hasCLick{
    background-color: #909399;
}
</style>