<template>
    <div>
        <div v-show="menuShow" class="contextmenu" :style="{top:menuTop+'px',left:menuLeft+'px'}">
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
            cur:{}
        }
    },
    computed:mapState([
        'menuTop',
        'menuLeft',
        'menuShow',
        'curComponent'
    ]),
    mounted(){
        console.log(this.curComponent);
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
     
    }
}
</script>
<style scoped>
.contextmenu{
    position: absolute;
    z-index: 10000;
}
ul{
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
    box-sizing: border-box;
    margin: 5px 0;
    padding: 6px 0;
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