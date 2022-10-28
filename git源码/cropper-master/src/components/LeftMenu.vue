<template>
   <div class="container">
    <div class="search">
     <el-input  size="medium" prefix-icon="el-icon-search" placeholder="Enter something..." /></div>
     <div class="classify">
    <ul class="menu">
        <li class="menu-item" v-for="(item,index) in icons" :key="index" @click="select(index)" @mouseover="select(index)" :class="{'active':index===selectIndex }"><i :class="item.icon"/></li>
    </ul>
    <ul class="elements">
        <li class="element" v-for="(item,index) in choosenArr" :key="index" @click="handleImageChange(item)"><el-image fit="contain"  style="width:6vw; height:8vh" :src="item"></el-image></li>

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
          icons:[{icon:'iconfont icon-tupian'},{icon:'iconfont icon-ren1'},{icon:'iconfont icon--panda'},{icon:'iconfont icon-shu3'},{icon:'iconfont icon-shafa1'},{icon:'iconfont icon-qichepiao'},{icon:'iconfont icon-jimu2'},{icon:'iconfont icon-zhuangshipin'},{icon:'iconfont icon-shiwu-2'},{icon:'iconfont icon-other'}],
          pictures:[[require("../assets/blush/background.svg")],[require("../assets/blush/background2.svg")],[require("../assets/blush/bike.svg")],[require("../assets/blush/cat.png")],[require("../assets/blush/decoration.png"),require("../assets/blush/decoration.svg")],[require("../assets/blush/desk.svg")],[require("../assets/blush/flower.svg")],[require("../assets/blush/people.svg"),require("../assets/blush/people2.svg")]],
          selectIndex:0,
          choosenArr:[],
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
        select(index){
           this.selectIndex=index
           this.computedArr(index)
        },
        handleImageChange(item){
                      let IMAGE=new Image()
                      IMAGE.src=item
                      this.$store.commit("addComponent",{
                        component:{
                            ...commonAttr,
                            id:generateID(),
                            // 组件种类
                            component:"Picture",
                            label:"图片",
                            icon:"",
                            // 图片路径
                            propValue:item,
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


    },
    mounted(){
        this.choosenArr=this.pictures[0]
    }

    
    
}
</script>

<style scoped>
.container{
    width:18.5vw;
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
    width:18.5vw;
    height:83vh;  
    display: flex;
    justify-content: space-between; 
}
.container .classify .menu{
    width:4vw;
    height:84vh;
    list-style: none;
    display: block;
}

.container .classify .menu li{
    height:8.4vh;
    line-height:8.4vh;
    cursor: pointer;
    font-size:24px; 
   text-align: center;
   border-radius: 0 4vh 4vh 0;
}


.menu-item:hover{
    background-color: #f5f6fa;
}
.active{
    background-color: #f5f6fa;
}
.elements{
    width:14vw;
    display: flex;
    background-color: #fff;
    list-style: none;;
    flex-wrap: wrap;
}
.element{
    width:6.5vw;
    height:8vh;
    background-color: #f5f6fa;
    border-radius: 4px;
    margin-right:0.5vw;
    margin-bottom: 1vw;
    cursor: pointer;
}
.element:hover{
    background-color:#fafafa ;
}
</style>