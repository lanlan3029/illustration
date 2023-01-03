<template>
   <div class="box">
          <div class="item" v-for="(item, index) in illsArry" :key="index">
            <el-image
                :src="`http://119.45.172.191:3000/` + item.content"
                class="image"
                fit="contain"
                @click="toDetail(item._id)"
              />  
        </div>

   </div>

  
</template>

<script>
import {mapState} from "vuex"

export default {
    data(){
        return{
            userid:localStorage.getItem("id"),
      illsArry: [],      
        }
    },
    computed:mapState([
        "collectIllusArr",
        "likeIllusArr",
    ]),
    methods:{
        toDetail(id){
     console.log("zou")
      this.$router.push({
        name: "illusdetails",
        params: { illId: id },
      });
      window.location.reload()
    },
        getIllus() {
      this.$http
        .get(`/ill/?sort_param=heat&sort_num=desc&page=1`)
        .then((response) => {
          this.illsArry = response.data.message;
          console.log(this.illsArry);
        })
        .catch((error) => console.log(error));
    },
    },
    mounted() {
    this.getIllus();
  },

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
    height:15.488vw;
    padding:1vw;
    
}
.image {
  cursor: pointer;
  width: 18vw;
  height: 12.672vw;
  border-radius: 4px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);

}
</style>