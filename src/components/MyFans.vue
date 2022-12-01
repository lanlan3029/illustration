<template>
  <div>
 <div class="index5-focus" v-for="(item,index) in attentionDetails" :key="index">    
      <el-avatar :src="item.src" :size="120" class="avatar"></el-avatar>
        <el-descriptions class="index5-info" :column="2" :colon="false">
  <template slot="title">{{item.name}}</template>
  <template slot="extra">
    <el-button size="small" @click="unFocus(item)">取消关注</el-button>
  </template>
 <el-descriptions-item label="描述">{{item.introduce}}</el-descriptions-item>
  <el-descriptions-item></el-descriptions-item>
 
   <el-descriptions-item label="粉丝">{{item.fans_num}}</el-descriptions-item>
</el-descriptions> 
        </div></div>
</template>

<script>
import {mapState} from "vuex"

export default {
  data(){
  return{
  id:localStorage.getItem("id"),
   fansDetails:[]
  }},
  computed:mapState(["fansArr"]),
  mounted(){
    this.getFans()
  },
 

  methods:{
    async getFans(){
      console.log(this.fansArr)
      for(var i=0;i<this.fansArr.length;i++){
        try{
          let res=await this.$http.get(`/user/`+this.fansArr[i])
          this.fansDetails.push(res.data.message)
        } catch(err){
          console.log(err)
        }
      }
      console.log(this.attentionDetails)
    },

  }

}
</script>

<style>

.index5-focus{
  display: flex;
  height:152px;
  padding:16px 0 ;
  justify-content: space-between;
  box-sizing: border-box;
  background-color: #fff;
  border-bottom: 1px solid rgb(238, 238, 238);
 
}
.index5-info{
  width:55vw;
   
}

</style>