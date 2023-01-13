<template>
   <div class="container">
     <ul >
        <router-link to="/"><li><i class="el-icon-house" :size="30"/><span>首&nbsp;&nbsp;&nbsp;&nbsp;页</span></li></router-link>
        <router-link to="/creation"><li><i class="el-icon-edit-outline" :size="30"/><span>创作插画</span></li></router-link>
         <router-link to="/user/upload"><li><i class="el-icon-document-add" :size="30"/><span>上传作品</span></li></router-link>
         <router-link to="/illustration"><li><i class="el-icon-picture-outline" :size="30"/><span>原创插画</span></li></router-link> 
        <router-link to="/books"><li><i class="el-icon-reading" :size="30"/><span>原创绘本</span></li></router-link> 
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
    height:calc(96vh - 72px); 
    font-size: 18px;
    letter-spacing: 4px;
    background-color: #fff;
    position: fixed;
    right:0px;
}
.container ul{
    list-style:none;
}
.container ul a{
    height:calc(16vh - 12px);
    text-decoration: none;
    
}
.container ul li{
    padding:0 2vw;
    height:calc(16vh - 12px);
    line-height:calc(16vh - 12px);
    color:#1c345e;
    font-weight: 500;

}
.container ul li span{
    margin-left:8px;
}
.container ul li:hover{
    background-color: #f5f6fa;
}
</style>