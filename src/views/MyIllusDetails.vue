<template>
        <div class="content">
          <el-button class="btn" @click="goEdition(illsDetails._id)">编辑</el-button>
      <div class="top">
        
 <div class="book">
          <div class="desc"><h2>《{{illsDetails.title}}》</h2>{{illsDetails.description}}</div>
          <div class="image">
          <el-image style="width: 73vw; height: 51.4vw" :src="(`https://kidstory.cc/`+illsDetails.content)" fit="contain" /></div>
      </div>
         </div>
     
    
     
    </div>
</template>

<script>
// @ is an alias to /src



//import RightInfo from "../components/RightInfo.vue";
//import Suggestion from "../components/Suggestion.vue"
export default {
  name: "Home",
  components: {

   
  },
  data(){
    return{
     id:this.$router.currentRoute.params.illId,
      illsDetails:[],
      
    }
  },
  methods:{
    goEdition(id){
        this.$store.commit("editionIllusFun",this.illsDetails)
        this.$router.push({name:'edition-illus',params:id});
    },
    async getIllsDetails(){ 
      try{  
        let res=await this.$http.get(`/ill/`+this.id)
        this.illsDetails=res.data.message 
      } catch(err){
        console.log(err)
      }
    
    },
    
   
  },
  async mounted(){
     await this.getIllsDetails(); 
   
  }

};
</script>
<style scoped>
.content {
  width:100vw;
  background-color: #f5f6fa;
   color:#333;
    margin:0;
    height:90vh;
    overflow-y: scroll;
}
.top{
  width:984.3px;;
  min-height:90vh;
  margin:auto;
  display: flex;
  justify-content: flex-start;
}


.book{
  width: 984.3px;
  min-height: 200px;
  background-color: #fff;
  margin:auto;
  font-size:20px;
  font-weight: 600;
}
 .book .desc{
  width:100%;
  min-height:116px;
  padding:48px;
  font-size: 20;
  letter-spacing: 2px;
  background-color: #fff;
  color:#1c345e;
  
}
 
 .image{
  background-color: #fff;
  margin-top:8px;
  
}
 

.btn{
  position: fixed;
  right:5vw;
  bottom: 3vw;
}
</style>