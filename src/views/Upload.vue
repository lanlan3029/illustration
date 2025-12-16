<template>
    <div class="container">
    <ul class="upload">
        <router-link to="/user/upload/upload-illustration"><li style="background-color:rgba(113,197,99,0.6)" ><el-icon><UploadPictureIcon /></el-icon><span>上传插画</span></li></router-link>
       <router-link to="/user/upload/upload-local-illustration"><li style="background-color:rgba(255,211,1,0.6)"><el-icon><UploadReadingIcon /></el-icon><span>上传绘本</span></li></router-link>
      
     
       
    </ul> 
    </div>
</template>

<script>
import { Picture as UploadPictureIcon, Reading as UploadReadingIcon } from '@element-plus/icons-vue'

export default {
  name: 'UploadPage',
  components: {
    UploadPictureIcon,
    UploadReadingIcon,
  },
  data() {
    return {
    }
  },
  methods: {
  },
  mounted() {
  },
}
</script>

<style scoped>
.container{
    width:100vw;
    height:calc(100vh - 90px);
    padding:14vw;      
}
.upload{
    width:50vw;
    background-color: #fff;
    list-style: none;
    display: flex;
    padding:1vw;
     justify-content: space-between;
    padding:2vw;
    margin: 0 auto;
}
.upload a{
    text-decoration: none;
}
.upload li{
    width:240px;
    height:160px;
    font-size: 60px;
    align-items: center;
    border: 2px dashed #eee;
    cursor: pointer;
    margin-bottom: 2vw;
    display: flex;
    flex-direction: column;  
    padding:37px 0;
    color:#333;
    border-radius: 16px;
}

.upload li span{
    font-size:18px;
    height:18px;
    line-height: 18px;
    margin-top: 8px;
  
}
.upload li:hover{
    background-color: #f5f6fa;
} 

</style>