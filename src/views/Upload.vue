<template>
    <div class="container">
    <ul class="upload">
        <router-link to="/user/upload/upload-element"><li><i class="el-icon-apple"></i><span>上传图元</span></li></router-link>
       <router-link to="/user/upload/upload-local-illustration"><li><i class="el-icon-edit"></i><span>上传插画</span></li></router-link>
       <router-link to="/user/upload/compose-illustration"><li><i class="el-icon-document-add" ></i><span>合成绘本</span></li></router-link>
       <router-link to="/user/upload/upload-loacl-pdf"><li><i class="el-icon-reading" ></i><span>上传本地绘本</span></li></router-link>
    </ul> 
    </div>
</template>

<script>
export default {
    
}
</script>

<style scoped>
.container{
    width:100vw;
    height:90vh;
    padding:10vw;      
}
.upload{
    width:80vw;
    background-color: #fff;
    list-style: none;
    display: flex;
    padding:1vw;
     justify-content: space-between;
    padding:2vw;
}
.upload a{
    text-decoration: none;
}
.upload li{
    width:240px;
    height:160px;
    font-size: 60px;
    align-items: center;
    border: 6px dashed #eee;
    cursor: pointer;
    margin-bottom: 2vw;
    display: flex;
    flex-direction: column;  
    padding:37px 0;
    color:#333
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