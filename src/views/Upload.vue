<template>
    <div class="container">
    <ul class="upload">
        <router-link to="/user/upload/upload-element"><li style="background-color:rgba(113,197,99,0.6)" ><i class="el-icon-apple"></i><span>上传图元</span></li></router-link>
       <router-link to="/user/upload/upload-local-illustration"><li style="background-color:rgba(255,211,1,0.6)"><i class="el-icon-picture-outline"></i><span>上传插画</span></li></router-link>
       <router-link to="/user/upload/compose-illustration"><li style="background-color:rgba(244,137,181,0.6)"><i class="el-icon-document-add"></i><span>合成绘本</span></li></router-link>
       <router-link to="/user/upload/style-transfer"><li style="background-color:rgba(147,112,219,0.6)"><i class="el-icon-magic-stick"></i><span>风格迁移</span></li></router-link>
       
    </ul> 
    </div>
</template>

<script>
export default {
    data(){
        return{

        }
    },
    methods:{
       
    
    },
    mounted(){
    
    }
    
}
</script>

<style scoped>
.container{
    width:100vw;
    height:90vh;
    padding:14vw;      
}
.upload{
    width:72vw;
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