<template>
    <div>
        <div 
            v-show="menuShow" 
            ref="contextMenu"
            class="contextmenu" 
            :style="menuStyle">
            <ul @mouseup="handleMouseUp">
                <template v-if="curComponent">
                    <li @click="copy">复制</li>
                    <li @click="paste">粘贴</li>
                    <li @click="cut">剪切</li>
                    <li @click="deleteComponent">删除</li>
                    <li v-show="curComponent.component !== 'v-text'" @click="cropper">编辑</li>
                    <!-- <li>锁定</li>
                    <li>置顶</li>
                    <li>置底</li>
                    <li>上移</li>
                    <li>下移</li> -->
                </template>
                <li v-else @click="paste">粘贴</li>
            </ul>
        </div>
    </div>
    
</template>
<script>
import { mapState } from 'vuex'
export default {
    data(){
        return{
            copyData:null,
            cur:{},
            menuWidth: 120,
            menuHeight: 200
        }
    },
    computed:{
        ...mapState([
        'menuTop',
        'menuLeft',
        'menuShow',
        'curComponent'
    ]),
        menuStyle() {
            if (!this.menuShow) {
                return {};
            }
            
            // 获取菜单实际尺寸（如果还没有测量，使用默认值）
            const menuWidth = this.menuWidth;
            const menuHeight = this.menuHeight;
            // 获取视口尺寸
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 初始位置就是鼠标位置（clientY/clientX已经是相对于视口的坐标）
            let left = this.menuLeft;
            let top = this.menuTop;
            
            // 边界检测：只在超出边界时才调整位置
            // 如果超出右边界，向左调整（菜单左边缘对齐鼠标）
            if (left + menuWidth > viewportWidth) {
                left = Math.max(10, viewportWidth - menuWidth - 5);
            }
            // 如果超出左边界，向右调整
            if (left < 5) {
                left = 5;
            }
            
            // 如果超出下边界，向上调整（菜单上边缘对齐鼠标）
            if (top + menuHeight > viewportHeight) {
                top = Math.max(5, viewportHeight - menuHeight - 5);
            }
            // 如果超出上边界，向下调整
            if (top < 5) {
                top = 5;
            }
            
            return {
                top: top + 'px',
                left: left + 'px',
                visibility: 'visible'
            };
        }
    },
    mounted(){
        console.log(this.curComponent);
    },
    watch: {
        menuShow(newVal) {
            if (newVal) {
                // 菜单显示时，在下一个tick更新尺寸并重新计算位置
                this.$nextTick(() => {
                    this.updateMenuSize();
                    // 强制更新样式
                    this.$forceUpdate();
                });
            }
        },
        menuLeft() {
            // 当菜单位置改变时，如果菜单已显示，更新尺寸
            if (this.menuShow) {
                this.$nextTick(() => {
                    this.updateMenuSize();
                });
            }
        },
        menuTop() {
            // 当菜单位置改变时，如果菜单已显示，更新尺寸
            if (this.menuShow) {
                this.$nextTick(() => {
                    this.updateMenuSize();
                });
            }
        }
    },
    methods:{
        // 点击菜单时不取消当前组件的选中状态
        handleMouseUp(){
            this.$store.commit('setClickComponentStatus',true)
        },
        deleteComponent(){
            this.$store.commit('deleteComponent')
        },
        copy(){
            this.$store.commit('copy')
        },
        paste(){
            this.$store.commit('paste',true)
        },
        cut(){
            this.$store.commit('cut')
        },
        cropper(){
            this.$store.commit("changeCropper",true)
        },
        updateMenuSize() {
            if (this.$refs.contextMenu) {
                const rect = this.$refs.contextMenu.getBoundingClientRect();
                this.menuWidth = rect.width || 120;
                this.menuHeight = rect.height || 200;
            }
        }
    }
}
</script>
<style>
/* 不使用scoped，确保样式生效 */
.contextmenu{
    position: fixed;
    z-index: 99999;
    pointer-events: auto;
    margin: 0;
    padding: 0;
    overflow: visible;
    max-width: none;
    max-height: none;
}
.contextmenu ul{
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
    box-sizing: border-box;
    margin: 0;
    padding: 6px 0;
    list-style: none;
    min-width: 120px;
    overflow: visible;
}

li{
    font-size: 14px;
    padding: 0 20px;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #606266;
    height: 34px;
    line-height: 34px;
    box-sizing: border-box;
    cursor: pointer;
}
li:hover{
    background-color: #f5f7f5;
}
</style>