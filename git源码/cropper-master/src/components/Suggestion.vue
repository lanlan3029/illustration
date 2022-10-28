<template>
   <div class="box">
          <div class="item" v-for="(item, index) in pictures" :key="index">
              <el-image :src="item.src" :fit="cover" style="width:20vw; height: 14.08vw"  class="avatar" @click="toDetail()"/>   
        </div>

   </div>

  
</template>

<script>
export default {
    data(){
        return{
         pictures:[{id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12085380--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12085381--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12085382--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12085389--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12086904--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12086905--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12086906--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12086907--square.jpg")},
         {id:1,title:"背景",desc:"就是一个背景",thumb:23,src:require("../assets/books/image-12086908--square.jpg")},
      ]
        }
    }

}
</script>

<style scoped>
.box{
    width:100vw;
    padding:6vw;  
    display: flex;
    flex-wrap: wrap; 
}
.item{
    width:22vw;
    height:18.08vw;
    padding:1vw;
    
}
.item .avatar{
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .1);;
}
</style>