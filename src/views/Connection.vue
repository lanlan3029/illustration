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
      <h2>投稿儿童故事&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;&nbsp;&nbsp;阅读原创绘本&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;&nbsp;&nbsp;获取育儿干货</h2>
    
    
    </div>
    <div class="right">
      <h2>您还可在这些网站寻找灵感</h2>
      <ul class="items">
        <li v-for="(item,index) in logoUrl" :key="index"><el-image
      style="width: 100px; height: 40px"
      :src="item.src"
      fit="fit" @click="toAnother(item.url)"></el-image></li>
   
      </ul>

      <div class="statement">{{ this.statement }}</div>
       <div class="statement">{{ this.statement2 }}</div>

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
      codepic:require('../assets/logo/code.jpg'),
      statement:"声明：本站所用图元部分为二次创作。原图片来自(https://www.freepik.com/;https://fresh-folk.com/ )，并遵循其版权规定。任何对该图片的使用需要尊重其版权，并遵守原图片的使用协议。",
      statement2:"本站所用绘本及其相关内容均为原作者所有，仅用于非商业目的。任何对本站所刊载内容的转载、复制、引用、摘编等行为均需获得原作者或本站授权，并注明出处。任何未经授权使用本站内容的行为均属于侵权，本站将依法追究法律责任。"

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
  margin-top:2vh;
  height:calc(96vh - 72px);
  display: flex;
  width:100vw;
  justify-content: space-between;
}
.left{
  width:62vw;
    height:90vh;
    background-color:#f5f6fa;
    border-radius: 8px;
    padding:8vw 2vw;
    
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
  width:36vw;
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

.statement{
  width:80%;
  margin:auto;
  font-size: 12px;
  margin-top:24px;
}
</style>