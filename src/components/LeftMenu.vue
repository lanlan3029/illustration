<template>
   <div class="container">
    <div class="search">
     <el-input  size="medium" v-model="searchInput" prefix-icon="el-icon-search" placeholder="Enter something..." @input="loadSearch(searchInput)"/></div>
   <!--  显示搜索结果 -->
     <div v-if="(searchInput !='')" class="classify">
        <ul class="elements" v-infinite-scroll="searchLoad" infinite-scroll-disabled="searchScrollDisabled" :disabled="searchLoading">
        <li class="element" v-for="(item,index) in searchArr" :key="index" @click="handleImageChange(item.content[0])">
            <el-image fit="contain"  style="width:6vw; height:8vh" :src="`https://static.kidstory.cc/`+ item.content"></el-image>
        </li>
    </ul>
    
     </div>
     <!-- 显示全部图元 -->
     <!-- infinite-scroll-disabled是控制是否允许无限滚动加载数据，而:disabled是控制是否禁用当前组件。
        在使用v-infinite-scroll指令时，如果infinite-scroll-disabled返回true，则该指令会被禁用，不再监听滚动事件。
        而:disabled则是在元素上添加或移除disabled属性，从而控制该元素是否可以被交互。 -->
     <div v-else class="classify">
    <ul class="menu">
        <li class="menu-item" v-for="item in icons" :key="item.id" @click="select(item.id,item.type,item.num)"  :class="{'active':item.id===selectIndex }"><i :class="item.icon"></i></li>
    </ul>
    <div class="menu-right">
        <ul class="elements" v-infinite-scroll="load" infinite-scroll-disabled="scrollDisabled" :disabled="loading">
        <li class="element" v-for="(item,index) in pictureArr" :key="index" @click="handleImageChange(item.content[0])">
            <el-image fit="contain"  style="width:6vw; height:8vh" :src="`https://static.kidstory.cc/`+ item.content"></el-image></li>

    </ul>
    </div>
</div>
    
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
            {type:"scene",icon:'iconfont icon-tupian',id:0,num:2},
          {type:"people",icon:'iconfont icon-ren1',id:1,num:2},
          {type:"animal",icon:'iconfont icon--panda',id:2,num:2},
          {type:"plant",icon:'iconfont icon-shu3',id:3,num:2},
          {type:"food",icon:'iconfont icon-shiwu-2',id:4,num:2},
          {type:"toy",icon:'iconfont icon-jimu2',id:5,num:2},
          {type:"vehicle",icon:'iconfont icon-qichepiao',id:6,num:2},
          {type:"decoration",icon:'iconfont icon-zhuangshipin',id:7,num:2},
          {type:"furniture",icon:'iconfont icon-shafa1',id:8,num:2},
          {type:"others",icon:'iconfont icon-other',id:9,num:2}],
          pictureArr:[],
          num:2,
          searchNum:2,
          selectType:'scene',
          selectIndex:0,
          searchInput:'',
          searchArr:[],
          searchPage:1,
          scrollDisabled:false,
          loading:false,
          searchLoading:false,
          searchScrollDisabled:false
        }
    },
     computed:mapState([
        "componentData",
        "canvasStyleData",
        "curComponent"
    ]),
    methods:{
        
        //请求数据库数据
        async getPictures(){
            try{
                let res=await this.$http .get(`/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=1`)
                this.pictureArr=res.data.message
               
            }
        catch(error){
            console.log(error)
        }
        },

       //选择左侧类别
       select(index,type,num){
            this.scrollDisabled=false
            this.loading=false
           this.selectIndex=index
           this.selectType=type
           this.pictureArr.length=0
           this.num=num
           this.getPictures()   
        },
        
        //无限加载
        async load() {
      if(!this.loading){
        this.loading=true
        try {
        let res = await this.$http.get(
            `/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=`+this.num);
        if(res.data.message.length==0){ 
            this.scrollDisabled=true   
        }else{
            this.pictureArr = this.pictureArr.concat(res.data.message);
            this.num++
            this.loading=false
        }  
      } catch (err) {
        console.log(err);
      }
      }
  
    },
 
 

              //转Base64
          getBase64(file){
             return new Promise(function(resolve,reject){
              let reader=new FileReader();
              let imgResult="";
              reader.readAsDataURL(file);
              reader.onload=function(){
                imgResult=reader.result
              };
              reader.onerror=function(error){
                reject(error)
              };
              reader.onloadend = function() {
                        resolve(imgResult);
                    };
             })
          },

          theImage(i){
             let IMAGE=new Image()
             IMAGE.src=('https://api.kidstory.cc/'+i)
             return [IMAGE.width,IMAGE.height]
          },
      

        //把小图片添加到中间面板
       async handleImageChange(item){
        console.log(this.componentData)
           
                      let IMAGE= new Image()
                      const self=this
                      IMAGE.onload=function(){
                        self.$store.commit("addComponent",{
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
                      }
                      
                      IMAGE.src=('https://api.kidstory.cc/'+item)
                    
              
                    
                     
        },
        //搜索关键字
        async loadSearch(value){
            this.searchArr.length=0
            try {
        let res = await this.$http.get(
            `/picture/?sort_param=heat&sort_num=desc&keyword=`+ value +`&page=1`
        );
        this.searchArr = this.searchArr.concat(res.data.message);
       
      } catch (err) {
        console.log(err);
      }        
        },
//搜索结果无限加载
        async searchLoad() {
      if(!this.searchLoading){
        this.searchLoading=true
             try {
                    let res = await this.$http.get(
                        `/picture/?sort_param=heat&sort_num=desc&keyword=` + this.searchInput + `&page=` + this.searchNum
                    );
                    if (res.data.message.length == 0) {
                        this.searchScrollDisabled = true

                    } else {
                        this.searchArr = this.searchArr.concat(res.data.message);
                        console.log(this.searchArr)
                        this.searchNum++;
                        this.searchLoading = false
                    }

                } catch (err) {
                    console.log(err);
                }
      }

    },


    },
    mounted(){
        this.getPictures()
      
    },
    beforeDestory(){
       window.removeEventListener('scroll',this.load)
    },
    
    
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
.menu-right{
    height:80vh;
    overflow-y: auto;
    width:16vw;
    position: relative;
    left:4vw;

}
.elements{
    width:15.5vw;
    display: flex;
    background-color: #fff;
    list-style: none;;
    flex-wrap: wrap;
    height:81vh;
    align-content:flex-start;
    position: absolute;
    right:0px;  
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