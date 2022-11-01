<template>
    <div class="shape"
        :class="{active}"
        @click="selectCurComponent"
        @mousedown="handleMouseDownOnShape">
        <!-- 是否可以出现旋转按钮 -->
        <span v-show="isActive()" class="iconfont icon-xiangyouxuanzhuan" @mousedown="handleRotate"></span>
        <!-- 是否被锁住 -->
        <span v-show="element.isLock" class="iconfont icon-suo"></span>
        <!-- 当图片被激活的时候，遍历pointList，否则就是空数组 -->
        <div
            v-for="item in (isActive() ? pointList : [])"
            :key="item"
            class="shape-point"
            :style="getPointStyle(item)" 
            @mousedown="handleMouseDownOnPoint(item,$event)"   
        >
        </div>
        <slot></slot>
    </div>
</template>
<script>
// 导入vuex
import { mapState } from 'vuex'
// 导入utils的函数
import eventBus from "@/utils/eventBus"
import calculateComponentPositionAndSize from "@/utils/calculateComponentPositionAndSize"
import { mod360 } from "@/utils/translate"
export default {
    data(){
        return{
            pointList:['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l'], // 八个方向
            cursors:{},
            // 每个点对应的初始角度
            initialAngle:{
                lt:0,
                t:45,
                rt:90,
                r:135,
                rb:180,
                b:225,
                lb:270,
                l:315
            },
            // 每个范围的角度对应的光标
            angleToCursor:[
                { start: 338, end: 23, cursor: 'nw' },
                { start: 23, end: 68, cursor: 'n' },
                { start: 68, end: 113, cursor: 'ne' },
                { start: 113, end: 158, cursor: 'e' },
                { start: 158, end: 203, cursor: 'se' },
                { start: 203, end: 248, cursor: 's' },
                { start: 248, end: 293, cursor: 'sw' },
                { start: 293, end: 338, cursor: 'w' },
            ]
        }
    },
    props:{
        // 是否是选中状态
        active:{
            type:Boolean,
            default:false
        },
        element:{
            require:true,
            type:Object,
            default:() => {}
        },
        defaultStyle:{
            require:true,
            type:Object,
            default:() => {}
        },
        index:{
            require:true,
            type:[Number,String],
            default:0
        }
    },
    computed:mapState([
        "curComponent",
        "editor"
    ]),
    mounted(){
        // 用于 Group 组件
        if(this.curComponent){
            this.cursors = this.getCursor() // 根据旋转角度获取光标位置
        }
       
    },
    methods:{
        // 获取不同的光标
        getCursor(){
            
            const {angleToCursor,initialAngle,pointList,curComponent} = this
            console.log(curComponent)
            const rotate = mod360(curComponent.style.rotate) // 取余360
            const result = {}
            // 从上一个命中的角度的索引开始匹配下一个，降低时间复杂度
            let lastMatchIndex = -1

            pointList.forEach(point => {
                const angle = mod360(initialAngle[point] + rotate)
                const len = angleToCursor.length
                while(len){
                    lastMatchIndex = (lastMatchIndex + 1) % len
                    const angleLimit = angleToCursor[lastMatchIndex]
                    if(angle < 23 || angle >= 338){
                        result[point] = "nw-resize"
                        return
                    }
                    if(angleLimit.start <= angle && angle < angleLimit.end){
                        result[point] = angleLimit.cursor + "-resize"
                        return
                    }
                }
            })
            return result
        },
        // 是否图片被点击激活
        isActive(){
            return this.active && !this.element.isLock
        },
        // 获取点的坐标样式
        getPointStyle(point){
            // 获得最初始的图片长宽
            const {width,height} = this.defaultStyle
            // Reg查看是否有t
            const hasT = /t/.test(point)
            const hasB = /b/.test(point)
            const hasL = /l/.test(point)
            const hasR = /r/.test(point)
            let newLeft = 0
            let newTop = 0

            // 四个角的点
            if(point.length === 2){
                newLeft = hasL ? 0 : width
                newTop = hasT ? 0 : height
            }else{
                // 上下两点的点，宽度居中
                if(hasT || hasB){
                    newLeft = Math.floor(width / 2)
                    newTop = hasT ? 0 : height
                }

                // 左右两边的点，高度居中
                if(hasL || hasR){
                    newLeft = hasL ? 0 : width
                    newTop = Math.floor(height / 2)
                }
            }
            const style ={
                marginLeft:"-4px",
                marginTop:"-4px",
                left:`${newLeft}px`,
                top:`${newTop}px`,
                cursor:this.cursors[point]
            }

            return style
        },
        // 鼠标点击组件，需要先激活组件，才能继续点击拖拽移动
        handleMouseDownOnShape(e){
            this.$store.commit('setClickComponentStatus', true)
            if(this.element.component != 'v-text' && this.element.component != 'rect-shape'){
                e.preventDefault()
            }

            e.stopPropagation()
            this.$store.commit('setCurComponent', { component: this.element, index: this.index })
            // 查看是否是锁住的情况
            if(this.element.isLock) return

            // 根据旋转角度获取光标位置
            this.cursors = this.getCursor()

            const pos = { ...this.defaultStyle }
            // 鼠标点入的位置
            const startY = e.clientY
            const startX = e.clientX

            // 如果直接修改属性，值得类型会变为字符串，所以要转为数值型
            const startTop = Number(pos.top)
            const startLeft = Number(pos.left)

            // 如果元素没有移动，则不保存快照
            let hasMove = false
            // 当被移动的时候
            const move = (moveEvent) => {
                hasMove = true
                // 鼠标移动到松开的位置
                const curX = moveEvent.clientX
                const curY = moveEvent.clientY
                pos.top = curY - startY + startTop
                pos.left = curX - startX + startLeft
                // 修改当前组件样式
                this.$store.commit("setShapeStyle",pos)
            }
            // 当没有被移动的时候
            const up = () => {
                // 查看是否移动过
                hasMove
                /**
                 * 通过 $on(eventName,eventHandler) 侦听一个事件
                 * 通过 $once(eventName,eventHandler) 一次性侦听一个事件
                 * 通过 $off(eventName,eventHandler) 停止侦听一个事件
                 * $emit 触发当前实例上的事件。附加参数都会传给监听器回调
                */
                eventBus.$emit("unmove")
                document.removeEventListener("mousemove",move)
                document.removeEventListener("mouseup",up)
            }
            // 全局注册移动组件方法
            // 当鼠标点击移动的时候
            document.addEventListener("mousemove",move)
            // 当鼠标松开的时候
            document.addEventListener("mouseup",up)
        },
        // 鼠标恢复组件样式
        selectCurComponent(e){
            // 阻止向父组件冒泡
            e.stopPropagation()
            e.preventDefault()
        },
        // 拉伸图片的点
        handleMouseDownOnPoint(point,e){
            this.$store.commit("setClickComponentStatus",true)
            e.stopPropagation()
            e.preventDefault()

            const style = {...this.defaultStyle}

            // 组件中心点
            const center = {
                x:style.left + style.width / 2,
                y:style.top + style.height / 2,
            }

            // 获取画布位移信息
            // getBoundingClientRect()这个方法返回一个矩形对象
            // 包含四个属性：left，right，bottom，top
            // 分别表示元素各边与页面上边和下边的距离
            const editorRectInfo = this.editor.getBoundingClientRect()

            // 获取point 与实际拖动基准点的差值
            const pointRect = e.target.getBoundingClientRect()
            // 当前点击原点相对于画布的中心坐标
            const curPoint = {
                x:Math.round(pointRect.left - editorRectInfo.left + e.target.offsetWidth / 2),
                y:Math.round(pointRect.top - editorRectInfo.top + e.target.offsetHeight / 2)
            }

            // 获取对称点的坐标
            const symmetricPoint = {
                x:center.x - (curPoint.x - center.x),
                y:center.y - (curPoint.y - center.y)
            }

            let isFirst = true

            const move = (moveEvent) => {
                // 第一次点击时也会触发 move，所以会有“刚点击组件但未移动，组件的大小却改变了”的情况
                // 因此第一次点击时不触发move事件
                if(isFirst){
                    isFirst = false
                    return
                }
                // 点击的距离画布的距离
                const curPosition = {
                    x:moveEvent.clientX - editorRectInfo.left,
                    y:moveEvent.clientY - editorRectInfo.top,
                }
                calculateComponentPositionAndSize(point,style,curPosition,{
                    center,
                    curPoint,
                    symmetricPoint,
                })

                this.$store.commit("setShapeStyle",style)
            }

            const up = () => {
                document.removeEventListener("mousemove",move)
                document.removeEventListener("mouseup",up)
            }

            document.addEventListener("mousemove",move)
            document.addEventListener("mouseup",up)
        },
        isNeedLockProportion(){
            if(this.element.component != "Group") return false
            const rotates = [0,90,180,360]
            // 判断数值是不是旋转
            for(const component of this.element.propValue){
                if(!rotates.includes(mod360(parseInt(component.style.rotate)))){
                    return true
                }
            }
            return false
        },
        handleRotate(e){
            this.$store.commit('setClickComponentStatus', true)
            e.preventDefault()
            e.stopPropagation()
            // 初始坐标和初始角度
            const pos = { ...this.defaultStyle }
            const startY = e.clientY
            const startX = e.clientX
            const startRotate = pos.rotate

            // 获取元素中心点位置
            const rect = this.$el.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            // 旋转前的角度
            const rotateDegreeBefore = Math.atan2(startY - centerY, startX - centerX) / (Math.PI / 180)

            // 如果元素没有移动，则不保存快照
            let hasMove = false
            const move = (moveEvent) => {
                hasMove = true
                const curX = moveEvent.clientX
                const curY = moveEvent.clientY
                // 旋转后的角度
                const rotateDegreeAfter = Math.atan2(curY - centerY, curX - centerX) / (Math.PI / 180)
                // 获取旋转的角度值
                pos.rotate = startRotate + rotateDegreeAfter - rotateDegreeBefore
                
                // 修改当前组件样式
                this.$store.commit('setShapeStyle', pos)
            }

            const up = () => {
                hasMove
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)
                this.cursors = this.getCursor() // 根据旋转角度获取光标位置
            }

            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        }
    }
}
</script>
<style scoped>
.shape{
    position: absolute;
}
.shape:hover{
    cursor: move;
}
.active{
    outline: 1px solid #70c0ff;
    user-select: none;
}
.shape-point{
    position: absolute;
    background-color: #fff;
    border: 1px solid #59c7f9;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    z-index: 1;
}
.icon-xiangyouxuanzhuan {
    position: absolute;
    top: -34px;
    left: 50%;
    transform: translateX(-50%);
    cursor: grab;
    color: #59c7f9;
    font-size: 20px;
    font-weight: 600;
}
.icon-xiangyouxuanzhuan:active{
    cursor: grabbing;
}
.icon-suo{
    position: absolute;
    top: 0;
    right: 0;
}
</style>