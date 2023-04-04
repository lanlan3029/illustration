<template>
    <div
        id="editor"
        class="editor"
        :class="{edit:isEdit}"
        :style="{
            width:changeStyleWithScale(canvasStyleData.width) + 'vw',
            height:changeStyleWithScale(canvasStyleData.height) + 'vw',
        }"
    >
        <!-- 网格线 -->
        <Grid/>
        <!-- 页面组件列表展示 -->
        <Shape 
            v-for="(item,index) in componentData"
            :key="index"
            :default-style="item.style"
            :style="getShapeStyle(item.style)"
            :active="item.id === (curComponent || {}).id"
            :element="item"
            :index="index"
            :class="{ lock:item.isLock }"
        >
        <!-- 判断是文本还是图片 -->
            <!-- 
                :is 指的是组件的属性，picture
                :id 值得是这个组件的独立的id属性，component0
                :prop-value指的是组件的图片路径
             -->
             <component
                :is="item.component"
                v-if="item.component != 'v-text'"
                :id="'component' + item.id"
                class="component"
                :style="getComponentStyle(item.style)"
                :prop-value="item.propValue"
                :element="item"
            />
            <component
                :is="item.component"
                v-else
                :id="'component' + item.id"
                class="component"
                :style="getComponentStyle(item.style)"
                :prop-value="item.propValue"
                :element="item"
            />
        </Shape>
        <ContextMenu/>
        
    </div>
</template>
<script>
// 调用vuex中的state值
import {mapState} from "vuex"
import Shape from "./Shape.vue"
import Grid from "./Grid.vue"
import ContextMenu from './ContextMenu.vue'
// 导入utils
import {changeStyleWithScale} from '@/utils/translate'
import { getStyle } from '@/utils/style'
export default {
    components:{
        Shape,Grid,ContextMenu
    },
    props:{
        isEdit:{
            type:Boolean,
            default:true
        }
    },
 
    // 把vuex中的值解剖开来
    computed:mapState([
        "canvasStyleData",
        "componentData",
        "curComponent",
    ]),
    methods:{
        // 使用utils中的方法
        changeStyleWithScale,
        // 得到图片样式
        getShapeStyle(style){
            const result = {};
            ["width","height","top","left","rotate","zIndex"].forEach(attr => {
                if (attr != "rotate" && attr != "zIndex"){
                    result[attr] = style[attr] + "px"
                } else if(attr == "rotate") {
                    result.transform = "rotate(" + style[attr] +"deg)"
                } else {
                    result[attr] = style[attr]
                }
            })

            return result
        },
        // 获得透明度或者旋转
        getComponentStyle(style) {
            // 使用getStyle函数得出结果
            return getStyle(style, ['top', 'left', 'width', 'height', 'rotate'])
        },
    },
    created(){

    },
    mounted(){
        // 获取编辑器元素
        this.$store.commit("getEditor")
    },
    hideArea(){
        this.isShowArea = 0
        this.width = 0
        this.heigth = 0

        this.$store.commit('setAreaData',{
            style:{
                left:0,
                top:0,
                width:0,
                heigth:0
            },
            components: []
        })
    }
}
</script>
<style scoped>
.editor{
    position: relative;
    margin: auto;
    background-color: #fff;
    perspective: 100px;
    /* width: 984.3px; */
    /* height: 740px; */
}
.component{
    outline: none;
    width: 100%;
    height: 100%;
}
#div2{
	width:100px;
	height:75px;
	background-color:red;
	border:1px solid black;
}
</style>