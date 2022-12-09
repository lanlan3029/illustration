<template>
    <div>
   <div class="index5-focus" v-for="(item,index) in attentionDetails" :key="index">    
        <el-avatar :src="item.avatar" :size="120" class="avatar"></el-avatar>
          <el-descriptions class="index5-info" :column="2" :colon="false">
    <template slot="title">{{item.name}}</template>
    <template slot="extra">
      <el-button size="small" @click="unFocus(item)">取消关注</el-button>
    </template>
   <el-descriptions-item label="描述">{{item.introduce}}</el-descriptions-item>
    <el-descriptions-item></el-descriptions-item>
   
     <el-descriptions-item label="粉丝">{{item.fans_num}}</el-descriptions-item>
     <el-descriptions-item label="关注">{{item.attention_num}}</el-descriptions-item>
  </el-descriptions> 
          </div></div>
</template>

<script>
import {mapState} from "vuex"

export default {
    data(){
    return{
    id:localStorage.getItem("id"),
     attentionDetails:[]
    }},
    computed:mapState(["attentionArr"]),

    async mounted(){
     await this.getAttention()
      await this.completeFun()
    },

  
   

    methods:{
     
   //获取关注的人的信息（不含这个人的粉丝数量）
      async getAttention(){
        console.log(this.attentionArr)
        for(var i=0;i<this.attentionArr.length;i++){
          try{
            let res=await this.$http.get(`/user/`+this.attentionArr[i])
            this.attentionDetails.push(res.data.message)
          } catch(err){
            console.log(err)
          }
        }
       
      },
    //将粉丝数和关注数放到attentionDetails
    async completeFun(){
      for(var i=0;i<this.attentionDetails.length;i++){
        try{
          let resF=await this.$http.get(`/user/number/fllow`,{params:{id:this.attentionDetails[i]._id,sign:"item"}})
          console.log(resF)
          let resA=await this.$http.get(`/user/number/fllow`,{params:{id:this.attentionDetails[i]._id}})
          console.log(resA)
          if(resF.data.desc=="success"&resA.data.desc=="success"){
            this.attentionDetails[i].fans_num=resF.data.message;
        this.attentionDetails[i].attention_num=resA.data.message
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