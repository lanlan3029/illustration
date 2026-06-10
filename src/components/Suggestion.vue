<template>
   <div class="box">
          <div class="item" v-for="(item, index) in illsArry" :key="index">
            <el-image
                :src="`https://static.kidstory.cc/` + item.content"
                class="image"
                fit="contain"
                @click="toDetail(item._id)"
              />  
        </div>

   </div>

  
</template>

<script>
import { mapState } from 'vuex'
import { getCollectionIllus, getLikeIllus } from '@/api/userCollect'

export default {
    name: 'SuggestionBox',
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
    async mounted() {
      if (this.userid && localStorage.getItem('token')) {
        await Promise.all([
          getCollectionIllus(this.$http, this.$store),
          getLikeIllus(this.$http, this.$store)
        ])
      }
      this.getIllus()
    },

}
</script>

<style scoped>
/* 卡片由 vw 固定尺寸改为自适应网格 */
.box{
    width:100%;
    padding:24px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
}
.item{
    width:100%;
}
.image {
  cursor: pointer;
  width: 100%;
  aspect-ratio: 18 / 12.672;
  border-radius: 4px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);

}
</style>