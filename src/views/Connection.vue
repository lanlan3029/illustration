<template>
  <div>
  
  <div class="content">
    <div class="left">
      <div class="code">
        <el-image
      style="width: 300px; height: 300px"
      :src="codepic"
      fit="fit" @click="toAnother(item.url)"></el-image>
      </div>
      <h2>关注公众号</h2>
      <h2>投稿儿童故事&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;&nbsp;&nbsp;阅读原创绘本&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;&nbsp;&nbsp;发现有趣插画</h2>
    
    
    </div>
    <div class="right">
      <h2>您还可在这些网站寻找灵感</h2>
      <ul class="items">
        <li v-for="(item,index) in logoUrl" :key="index"><el-image
      style="width: 100px; height: 40px"
      :src="item.src"
      fit="fit" @click="toAnother(item.url)"></el-image></li>
   
      </ul>

    </div>
   

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
      logoUrl:[
        {name:"freepik",
      url:"https://www.freepik.com/",
      src:require('../assets/logo/freepik.svg')},
      {name:"blush",
      url:"https://blush.design/zh-CN",
      src:require('../assets/logo/blush.svg')}
               ],
               codepic:require('../assets/logo/code.jpg')
    }
    
  },
  methods:{
    toAnother(){
      window.open()
    }
  }
}
</script>
<style scoped>

.content{
  display: flex;
  width:100vw;
  justify-content: space-between;
}
.left{
  width:60vw;
    height:90vh;
    background-color:#f5f6fa;
    border-radius: 8px;
    padding:8vw 2vw;
    margin:auto;
}
.left .code{
   width:300px;
   height:300px;
   margin:auto;

}
.left h2{
  text-align: center;
  color:#374957;
  margin-bottom: 48px;
}
.right{
  width:35vw;
  height:90vh;
  background-color:#f5f6fa;
}
.right h2{
  margin-top:10vh;
  text-align: center;
  color:#374957;
}
.right li{
  width:100%;
  height:40px;
  margin:20px 0;
  text-align: center; 
}

</style>