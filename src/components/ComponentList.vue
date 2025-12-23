<template>
    <div class="component-list" @dragstart="handleDragStart">
        <div
            v-for="(item, index) in componentList"
            :key="index"
            draggable
            class="list"
            :data-index="index"
            @click="handleClick(index)"
        >
            <el-tooltip class="item" effect="dark" :content="$t('componentList.clickToAddCenter')" placement="top-start">
            <label class="text">{{ item.label }}</label></el-tooltip>
        </div>
    </div>
</template>

<script>
import componentList from '@/custom-component/component-list'
import {deepCopy} from "@/utils/utils"
import generateID from "@/utils/generateID"
import { ElMessage } from 'element-plus'

export default {
    data() {
        return {
            rawComponentList: componentList, // 保存原始列表
        }
    },
    computed: {
        editor() {
            return this.$store.state.editor
        },
        // 国际化的组件列表
        componentList() {
            return this.rawComponentList.map(item => ({
                ...item,
                label: this.$t(item.label), // 翻译 label
                propValue: this.$t(item.propValue) // 翻译 propValue
            }))
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
        },
        handleClick(index) {
            // 点击添加组件到画布中心
            if (this.editor) {
                const rectInfo = this.editor.getBoundingClientRect()
                const component = deepCopy(componentList[index])
                
                // 翻译 label 和 propValue（如果它们是翻译键）
                if (component.label && component.label.startsWith('componentList.')) {
                    component.label = this.$t(component.label)
                }
                if (component.propValue && component.propValue.startsWith('componentList.')) {
                    component.propValue = this.$t(component.propValue)
                }
                
                // 计算画布中心位置（相对于画布本身，不是视口）
                // 画布中心在画布坐标系中的位置
                const centerX = rectInfo.width / 2
                const centerY = rectInfo.height / 2
                
                // 设置组件位置（居中，减去组件宽度/高度的一半）
                component.style.top = centerY - (component.style.height || 22) / 2
                component.style.left = centerX - (component.style.width || 200) / 2
                component.id = generateID()
                
                this.$store.commit("addComponent", {component})
                
            } else {
                ElMessage.warning(this.$t('componentList.canvasNotInitialized'))
            }
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    padding: 6px 16px;
    font-size: 14px;
    margin-left: 10px;
    transition: all 0.3s ease;
    border-radius: 6px;
    font-weight: 500;
    min-height: 30px;
    min-width: 100px;
    color: #1d1d1f;
   text-align: center;
    background-color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.list .text:hover{
    background-color: #f5f7fa;
    color: #019AD8;
    border-color: #019AD8;
    box-shadow: 0 2px 4px rgba(1, 154, 216, 0.15);
    transform: translateY(-1px);
}

.list .text:active{
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}


</style>