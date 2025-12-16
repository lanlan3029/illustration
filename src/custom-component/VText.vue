<template>
    <div
        v-if="editMode == 'edit'"
        class="v-text"
    >   
    <!-- 
        contenteditable是超文本编辑
        tabindex 属性规定使用"tab"键进行导航元素的顺序
     -->
        <div
            ref="text"
            :contenteditable="canEdit"
            :class="{canEdit}"
            :tabindex="element.id"
            :style="getTextStyle()"
            v-html="element.propValue"
            @dblclick="setEdit"
            @blur="handleBlur"
            @input="handleInput"
        >

        </div>
    </div>
    <div
        v-else class="v-text preview"
    ></div>
</template>
<script>
import {mapState} from "vuex"

export default {
    props:{
        propValue:{
            type:String,
            require:true,
            default:""
        },
        element:{
            type:Object,
            default:()=>{},
        }
    },
    data(){
        return {
            canEdit:false,
        }
    },
    computed:{
        ...mapState([
            "editMode",
            "componentData"
        ])
    }, 
    mounted(){
        console.log(this.element);
        // 组件挂载后，根据内容更新尺寸
        this.$nextTick(() => {
            this.updateSize()
        })
    },
    watch: {
        // 监听内容变化，自动调整大小
        'element.propValue'() {
            this.$nextTick(() => {
                this.updateSize()
            })
        },
        // 监听字体大小变化，自动调整大小
        'element.style.fontSize'() {
            this.$nextTick(() => {
                this.updateSize()
            })
        }
    },
    methods:{
        handleBlur(e){
            // 使用 store mutation 更新 propValue，而不是直接修改 props
            const newValue = e.target.innerHTML
            this.$emit("input", this.element, newValue)
            // 如果 element 是当前选中的组件，也更新 store
            if (this.$store.state.curComponent && this.$store.state.curComponent.id === this.element.id) {
                this.$store.commit('setComponentImage', newValue)
            }
            this.canEdit = false
            // 失焦时更新尺寸
            this.updateSize()
        },
        handleInput(e){
            this.$emit("input",this.element,e.target.innerHTML)
            // 输入时实时更新尺寸
            this.$nextTick(() => {
                this.updateSize()
            })
        },
        setEdit(){
            this.canEdit = true
            // 开始编辑时，确保尺寸正确
            this.$nextTick(() => {
                this.updateSize()
            })
        },
        updateSize(){
            // 根据内容自动调整文本框大小
            if (this.$refs.text) {
                const element = this.$refs.text
                
                // 临时移除固定宽高，让元素自适应内容
                const originalWidth = element.style.width
                const originalHeight = element.style.height
                const originalMaxWidth = element.style.maxWidth
                
                // 设置为 auto 以获取实际内容尺寸
                element.style.width = 'auto'
                element.style.height = 'auto'
                element.style.maxWidth = 'none'
                element.style.display = 'inline-block'
                
                // 强制浏览器重新计算布局
                void element.offsetWidth
                
                // 获取实际内容尺寸
                const scrollWidth = element.scrollWidth || element.offsetWidth
                const scrollHeight = element.scrollHeight || element.offsetHeight
                
                // 恢复原始样式
                element.style.width = originalWidth
                element.style.height = originalHeight
                element.style.maxWidth = originalMaxWidth
                
                // 更新组件的宽高（添加内边距，确保有最小尺寸）
                const padding = 8
                const minWidth = 50
                const minHeight = 22
                
                // 如果内容为空，使用最小尺寸
                // 使用 store mutation 更新 style，而不是直接修改 props
                const newWidth = (!this.element.propValue || this.element.propValue.trim() === '') 
                    ? minWidth 
                    : Math.max(scrollWidth + padding, minWidth)
                const newHeight = (!this.element.propValue || this.element.propValue.trim() === '') 
                    ? minHeight 
                    : Math.max(scrollHeight + padding, minHeight)
                
                // 如果 element 是当前选中的组件，使用 store mutation 更新
                if (this.$store.state.curComponent && this.$store.state.curComponent.id === this.element.id) {
                    this.$store.commit('setShapeSingStyle', { key: 'width', value: newWidth })
                    this.$store.commit('setShapeSingStyle', { key: 'height', value: newHeight })
                } else {
                    // 如果不是当前组件，直接更新 element（因为它是从 store 来的引用）
                    // 但为了符合 Vue 3 规范，我们仍然通过 mutation 更新
                    // 找到 element 在 componentData 中的索引
                    const componentData = this.componentData || this.$store.state.componentData || []
                    const index = componentData.findIndex(item => item.id === this.element.id)
                    if (index !== -1) {
                        // 临时设置为当前组件，然后更新
                        const originalCurComponent = this.$store.state.curComponent
                        this.$store.commit('setCurComponent', { component: this.element, index })
                        this.$store.commit('setShapeSingStyle', { key: 'width', value: newWidth })
                        this.$store.commit('setShapeSingStyle', { key: 'height', value: newHeight })
                        // 恢复原来的当前组件
                        if (originalCurComponent) {
                            const originalIndex = componentData.findIndex(item => item.id === originalCurComponent.id)
                            if (originalIndex !== -1) {
                                this.$store.commit('setCurComponent', { component: originalCurComponent, index: originalIndex })
                            }
                        }
                    }
                }
            }
        },
        getTextStyle(){
            // 获取文字样式，包括字体和其他样式
            // 从 element.style 中提取所有文字相关的样式
            const style = {}
            const textStyleKeys = [
                'verticalAlign', 'fontFamily', 'fontSize', 'fontWeight', 
                'color', 'lineHeight', 'letterSpacing', 'textAlign'
            ]
            
            textStyleKeys.forEach(key => {
                if (this.element.style[key] !== undefined && this.element.style[key] !== '') {
                    if (key === 'fontSize' || key === 'lineHeight' || key === 'letterSpacing') {
                        // 需要添加单位
                        style[key] = this.element.style[key] + (typeof this.element.style[key] === 'number' ? 'px' : '')
                    } else {
                        style[key] = this.element.style[key]
                    }
                }
            })
            
            // 默认垂直对齐
            if (!style.verticalAlign) {
                style.verticalAlign = 'middle'
            }
            
            return style
        },
    }
}
</script>
<style scoped>
/* display:table 是块级表格，前后带有换行符 */
/* display:table-cell 是表格单元格显示 */
.v-text{
    font-weight: 500;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
}
.v-text > div{
    display: inline-block;
    min-width: 50px;
    min-height: 22px;
    width: auto;
    height: auto;
    outline: none;
    white-space: pre-wrap; /* 允许换行 */
    word-wrap: break-word; /* 长单词换行 */
    padding: 4px;
    box-sizing: border-box;
    vertical-align: top;
}
.canEdit{
    cursor: text;
    height: 100%;
}
</style>