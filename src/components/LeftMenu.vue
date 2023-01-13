<template>
   <div class="container">
    <div class="search">
     <el-input  size="medium" v-model="searchInput" prefix-icon="el-icon-search" placeholder="Enter something..." @input="loadSearch(searchInput)"/></div>
     <div v-if="(searchInput !='')" class="classify">
        
        <ul class="elements" v-infinite-scroll="searchLoad">
        <li class="element" v-for="(item,index) in searchArr" :key="index" @click="handleImageChange(item.content[0])">
            <el-image fit="contain"  style="width:6vw; height:8vh" :src="`https://api.kidstory.cc/`+ item.content"></el-image>
        </li>
    </ul>
    
     </div>
     <div v-else class="classify">
    <ul class="menu">
        <li class="menu-item" v-for="item in icons" :key="item.id" @click="select(item.id,item.type)"  :class="{'active':item.id===selectIndex }"><i :class="item.icon"></i></li>
    </ul>
    <ul class="elements" v-infinite-scroll="load" infinite-scroll-disabled="scrollDisabled">
        <li class="element" v-for="(item,index) in pictureArr" :key="index" @click="handleImageChange(item.content[0])">
            <el-image fit="contain"  style="width:6vw; height:8vh" :src="`https://api.kidstory.cc/`+ item.content"></el-image></li>

    </ul></div>
    
    <class-chart />
    </div> 

</template>

<script>
import {mapState} from "vuex"
import ClassChart from './ClassChart.vue'
// 导入generateID
import generateID from "@/utils/generateID"
// 导入自定义样式的包
import {commonStyle,commonAttr} from "@/custom-component/component-list"


export default {
    components:{
        ClassChart
    },
    
    data(){
        return{
          icons:[
            {type:"scene",icon:'iconfont icon-tupian',id:0,num:0},
          {type:"people",icon:'iconfont icon-ren1',id:1,num:0},
          {type:"animal",icon:'iconfont icon--panda',id:2,num:0},
          {type:"plant",icon:'iconfont icon-shu3',id:3,num:0},
          {type:"food",icon:'iconfont icon-shiwu-2',id:4,num:0},
          {type:"toy",icon:'iconfont icon-jimu2',id:5,num:0},
          {type:"vehicle",icon:'iconfont icon-qichepiao',id:6,num:0},
          {type:"decoration",icon:'iconfont icon-zhuangshipin',id:7,num:0},
          {type:"furniture",icon:'iconfont icon-shafa1',id:8,num:0},
          {type:"others",icon:'iconfont icon-other',id:9,num:0}],
          selectIndex:0,
          pictureArr:[],
          num:1,
          searchNum:1,
          selectType:'',
          searchInput:'',
          searchArr:[],
          searchPage:1,
          scrollDisabled:false
        }
    },
     computed:mapState([
        "componentData",
        "canvasStyleData",
        "curComponent"
    ]),
    methods:{
         computedArr(i){
            this.choosenArr=this.pictures[i]
        },
        //请求数据库数据
        async getPictures(type){
            try{
                let res=await this.$http .get(`/picture/?sort_param=heat&sort_num=desc&type=`+ type +`&page=1`)
                this.pictureArr=res.data.message
                console.log(this.pictureArr)
            }
        catch(error){
            console.log(error)
        }
        },


        
        //无限加载
        async load() {
      this.num++;
      try {
        let res = await this.$http.get(
            `/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=`+this.num
        );
        if(res.data.message!=[]){
            this.pictureArr = this.pictureArr.concat(res.data.message);
        }else{
            this.scrollDisabled=true
        }
        
      } catch (err) {
        console.log(err);
      }
    },
        //选择左侧类别
        select(index,type){
           this.selectIndex=index
           this.selectType=type
           this.pictureArr.length=0
           this.num=1
           this.getPictures(type)   
        },
      

        //把小图片添加到中间面板
        handleImageChange(item){
                      let IMAGE=new Image()
                      IMAGE.src=('https://api.kidstory.cc/'+item)
                      console.log(IMAGE.src)
                      this.$store.commit("addComponent",{
                        component:{
                            ...commonAttr,
                            id:generateID(),
                            // 组件种类
                            component:"Picture",
                            label:"图片",
                            icon:"",
                            // 图片路径
                            propValue:('https://api.kidstory.cc/'+item),
                            // 图片样式
                            style:{
                                ...commonStyle,
                                top:0,
                                left:0,
                                width:IMAGE.width,
                                height:IMAGE.height,
                            }
                        }
                    })
        },
        //搜索关键字
        async loadSearch(value){
            this.searchArr.length=0
            try {
        let res = await this.$http.get(
            `/picture/?sort_param=heat&sort_num=desc&keyword=`+ value +`&page=1`
        );
        console.log(res)
        this.searchArr = this.searchArr.concat(res.data.message);
       
      } catch (err) {
        console.log(err);
      }        
        },
//搜索结果加载
        async searchLoad() {
      this.searchNum++;
      try {
        let res = await this.$http.get(
            `/picture/?sort_param=heat&sort_num=desc&keyword=`+ this.searchInput +`&page=`+this.searchNum
        );
        if(res.data.message!=[]){
            this.pictureArr = this.pictureArr.concat(res.data.message);
        }else{
            this.scrollDisabled=true
        }
        
      } catch (err) {
        console.log(err);
      }
    },


    },
    mounted(){
        this.getPictures("scene")
        this.choosenArr=this.pictures[0]

    }

    
    
}
</script>

<style scoped>
.container{
    width:19.5vw;
    height:90vh;
    
}
.search{
    width:17.5vw;
    height:5vh;
    margin:1vh 0.5vw;
}
.classify{
    margin:0;
    padding:0;
    width:19.5vw;
    height:83vh;  
    display: flex;
    justify-content: space-between; 
    overflow-y: scroll;
}
.container .classify .menu{
    width:4vw;
    height:80vh;
    list-style: none;
    display: block;
    position: fixed;
}

.container .classify .menu li{
    height:8vh;
    line-height:8vh;
    cursor: pointer;
    font-size:24px; 
   text-align: center;
   border-radius: 0 4vh 4vh 0;
}
.menu-item .iconfont{
    font-size: 22px;
}

.menu-item:hover{
    background-color: #f5f6fa;
}
.active{
    background-color: #f5f6fa;
}
.elements{
    width:15vw;
    display: flex;
    background-color: #fff;
    list-style: none;;
    flex-wrap: wrap;
    height:80vh;
    align-content:flex-start;
    position: relative;
    left:4vw;
}
.element{
    width:6.5vw;
    height:8vh;
    background-color: #f5f6fa;
    border-radius: 4px;
    margin-right:0.5vw;
    margin-bottom: 1vh;
    cursor: pointer;
}
.element:hover{
    background-color:#fafafa ;
}
.emptyResult{
    width:19.5vw;
    display: flex;  
    justify-content: center;
    align-content: center;
}
</style>