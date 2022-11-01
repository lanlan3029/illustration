<template>
   <div class="container">
     <ul >
        <router-link to="/"><li><i class="el-icon-house" :size="30"/><span>首页</span></li></router-link>
        <router-link to="/creation"><li><i class="el-icon-edit-outline" :size="30"/><span>创作插画</span></li></router-link>
         <router-link to="/user/upload"><li><i class="el-icon-document-add" :size="30"/><span>上传作品</span></li></router-link>
         <router-link to="/original-illustration"><li><i class="el-icon-picture-outline" :size="30"/><span>原创插画</span></li></router-link> 
        <router-link to="/original-books"><li><i class="el-icon-reading" :size="30"/><span>原创绘本</span></li></router-link> 
        <router-link to="/connection"><li><i class="el-icon-service" :size="20"/><span>联系我们</span></li></router-link>
       
    </ul>

    </div> 
</template>

<script>
export default {
    setup(){

    }
}
</script>

<style scoped>
.container{
    width:20vw;
    height:90vh; 
    font-size: 18px;
    letter-spacing: 4px;
    background-color: #fff;
}
.container ul{
    list-style:none;
}
.container ul a{
    height: 15vh;
    text-decoration: none;
    
}
.container ul li{
    padding:0 2vw;
    height:15vh;
    line-height:15vh;
    color:#1c345e;
    font-weight: 400;

}
.container ul li span{
    margin-left:8px;
}
.container ul li:hover{
    background-color: #f5f6fa;
}
</style>