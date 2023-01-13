<template>
  
   
    <div class="content">
     
      <el-button class="btn" @click="gobookEdition(bookDetails._id)">编辑</el-button>
    
         <div class="book">
          <div class="desc"><h2>《{{bookDetails.title}}》</h2>{{bookDetails.description}}</div>
        <div v-for="(item, index) in bookDetails.content" :key="index" class="item">
        <el-image :src="(`https://api.kidstory.cc/`+item)" style="width:984.3px;height:699px" fit="cover"></el-image>
      </div>
     
      </div>  
    </div>
  
</template>

<script>
// @ is an alias to /src



import {mapState} from "vuex"

export default {
  name: "Home",
  components: {

   
  },
  data(){
    return{
      id:this.$router.currentRoute.params.bookId,
     
      bookDetails:[],
      
    }
  },
  computed:mapState([
        "myBooks"
    ]),

  methods:{
   attention(){
    console.log("关注作者")
   },
   getBookDetails(){
    let tool=this.myBooks.filter(item=>{return item._id==this.id})
    this.bookDetails=tool[0]
    console.log(this.bookDetails) 
   },
      //编辑绘本
     gobookEdition(id){
      this.$store.commit("editionBookFun",this.bookDetails)
        this.$router.push({name:'edition-book',params:id});
}
  },

  async mounted(){
    await this.getBookDetails();
   
   

    
  }
};
</script>
<style scoped>
.content {
  width: 100vw; 
  height: 88vh;
  display: flex;
  flex-wrap: wrap;
  background-color: #f5f6fa;
  overflow: scroll;
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



.item{
  width: 984.3px;
  height: 699px;
}

.btn{
  position: fixed;
  right:5vw;
  bottom: 3vw;
}
</style>