<template>
    <div class="component-list" @dragstart="handleDragStart">
        <div
            v-for="(item, index) in componentList"
            :key="index"
            draggable
            class="list"
            :data-index="index"
        >
            <el-tooltip class="item" effect="dark" content="拖到想添加文字的位置吧" placement="top-start">
            <label class="text">{{ item.label }}</label></el-tooltip>
        </div>
    </div>
</template>

<script>
import componentList from '@/custom-component/component-list'

export default {
    data() {
        return {
            componentList,
        }
    },
    methods: {
        handleDragStart(e){
            // DataTransfer.setData(format,data) 方法用来设置拖放操作的drag data到指定的数据和类型。
            // format
            // 一个DOMString 表示要添加到 drag object的拖动数据的类型。
            // data
            // 一个 DOMString表示要添加到 drag object的数据。
            e.dataTransfer.setData("index",e.target.dataset.index)
            console.log(e.target.dataset.index)
            console.log(e.dataTransfer.setData)
            // index 0
        }
    },
}
</script>

<style scoped>
.component-list{
    display: flex;
    flex-wrap: wrap;
}

.list.active{
    cursor: grabbing;
}
.list .text{
   display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    padding: 12px 2px;
    font-size: 14px;
    margin-left: 10px;
    transition: .1s;
    border-radius: 4px;
    font-weight: 500;
    height:14px;
    width: 80px; 
   color:#1d1d1f;
   text-align: center;
}


</style>