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
            :style="{verticalAlign:element.style.verticalAlign}"
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
            "editMode"
        ])
    }, 
    mounted(){
        console.log(this.element);
    },
    methods:{
        handleBlur(e){
            this.element.propValue = e.target.innerHTML
            this.canEdit = false
        },
        handleInput(e){
            this.$emit("input",this.element,e.target.innerHTML)
        },
        setEdit(){
            this.canEdit = true
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
    display: table;
}
.v-text > div{
    display: table-cell;
    width: 100%;
    height: 100%;
    outline: none;
}
.canEdit{
    cursor: text;
    height: 100%;
}
</style>