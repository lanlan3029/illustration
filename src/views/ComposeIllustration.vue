<template>
    <div class="container">
        <div class="title">请按顺序选择要合成绘本的图片，第一页为封面。</div>
       <ul class="items" v-infinite-scroll="getMore">
        <li v-for="(item, index) in illusArr" :key="index" @click="handleAdd(item)">
          <el-image :src="(`https://api.kidstory.cc/`+item.content)" style="width:13vw; height: 8vw" fit="contain"></el-image>
          <span v-if="(checkedImage.includes(item))"><i class="el-icon-check"></i></span></li>
       </ul>
    <div class="btn">
     <el-button @click="toPDF" type="info" size="medium">预览</el-button></div>

    </div>
</template>

<script>
import {mapState} from "vuex"

export default {
     data() {
    return {
      illusArr:[],
      num:1,
      checkedImage:[],
      checkedId:[],
      userid:localStorage.getItem("id"),
    };
  },
    computed:mapState([
        "imgToPDF",      
    ]),
  methods:{
    //获取我的插画
    async getIll(){
      try{
          let res=await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=`+this.userid+`&page=1`)
          this.illusArr=res.data.message
        } catch(err){
          console.log(err)
        }
    },
    handleAdd(item){
       this.checkedImage.push(item)
    },
    toPDF(){
      this.checkedImage.push()
      this.$store.commit("removeImages")
      this.$router.push('/user/upload/compose-illustration/topdf');
       this.$store.commit("addImages",this.checkedImage)
       
    },
    async getMore(){
      this.num++
      try{
          let res=await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=`+this.userid+`&page=`+this.num)
          this.illusArr=this.illusArr.concat(res.data.message)
        } catch(err){
          console.log(err)
        }
    }

  },
  async mounted(){
    await this.getIll(); 
  }
}
</script>

<style scoped>
.container{
    width:100vw;
    height:90vh;
    padding:0 5vw;
    background-color: #f5f5f5;
    overflow: scroll;
}
.container .title{
    margin:1vw 1vw 0 1vw;
    font-size:18px;
    font-weight: 400;
    height:54px;
    line-height: 54px;
    text-align: center;
    border-radius: 4px;
    background-color: #fff;
    letter-spacing: 2px;
}
.container .items{
    width:90vw;
    height:90vh;
   margin-bottom: 14vh;
    display: flex;
    flex-wrap:wrap;
}
.container .items li{
    width:13vw;
    height:9.23vw;
    margin:1vw;
    border-radius: 4px;
     background-color: #fff;
     font-size:60px;
     cursor:pointer;
     
}
.container .items li:hover{
   animation:pulse;
   animation-duration: 1s;
}
.container .items li span{
    width:13vw;
    height:9.23vw;
    display: block;
    position: relative;
    top:-9.43vw;
     border-radius: 4px;
     font-size:60px;
     text-align: center;
     line-height: 9.23vw;
     color:#fff;
     background-color: rgba(0, 0, 0, 0.5);
}

.btn{
  height: 10vh; 
   position: absolute;
   left:47.6%;
   bottom: 2vh;  
}

</style>