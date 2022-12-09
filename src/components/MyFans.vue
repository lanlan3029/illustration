<template>
  <div>
 <div class="index5-focus" v-for="(item,index) in fansDetails" :key="index">    
      <el-avatar :src="item.avatar" :size="120" class="avatar"></el-avatar>
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
  async mounted(){
   await this.getFans();
   await this.completeFun();
  },
 

  methods:{
 

    async getFans(){
      console.log(this.fansArr)
      for(var i=0;i<this.fansArr.length;i++){
        try{
          let res=await this.$http.get(`/user/`+this.fansArr[i])
          this.fansDetails.push(res.data.message)
          
          console.lo
        } catch(err){
          console.log(err)
        }
      }
      console.log(this.attentionDetails)
    },
        //将粉丝数和关注数放到fansDetails
        async completeFun(){
      for(var i=0;i<this.fansDetails.length;i++){
        try{
          let resF=await this.$http.get(`/user/number/fllow`,{params:{id:this.attentionDetails[i]._id,sign:"item"}})
          console.log(resF)
          let resA=await this.$http.get(`/user/number/fllow`,{params:{id:this.attentionDetails[i]._id}})
          console.log(resA)
          if(resF.data.desc=="success"&resA.data.desc=="success"){
            this.fansDetails[i].fans_num=resF.data.message;
        this.fansDetails[i].attention_num=resA.data.message
          }
        
      } catch(err){
            console.log(err)
          }
      
        }

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