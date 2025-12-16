<template>
    <div class="attr-list">
        <el-form label-position="left" label-width="auto">
            <el-form-item v-for="({key,label},index) in styleKeys" :key="index" :label="label" class="form-item-inline">
                <el-color-picker v-if="key == 'borderColor'" v-model="curComponent.style[key]"></el-color-picker>
                <el-color-picker v-else-if="key == 'color'" v-model="curComponent.style[key]"></el-color-picker>
                <el-color-picker v-else-if="key == 'backgroundColor'" v-model="curComponent.style[key]"></el-color-picker>
                <el-select v-else-if="selectKey.includes(key)" v-model="curComponent.style[key]">
                    <template v-if="key == 'textAlign'">
                        <el-option
                            v-for="item in textAlignOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        ></el-option>
                    </template>
                    <template v-else-if="key == 'borderStyle'">
                        <el-option
                            v-for="item in borderStyleOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        ></el-option>
                    </template>
                    <template v-else-if="key == 'fontFamily'">
                        <el-option
                            v-for="item in fontFamilyOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        ></el-option>
                    </template>
                    <template v-else>
                        <el-option
                            v-for="item in verticalAlignOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        ></el-option>
                    </template>
                </el-select>
                <el-input v-else v-model.number="curComponent.style[key]" type="number"></el-input>
            </el-form-item>
            <el-form-item v-if="curComponent && !excludes.includes(curComponent.component)" label="内容" class="form-item-inline form-item-textarea">
                <el-input v-model="curComponent.propValue" type="textarea" :rows="3"></el-input>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
import {styleData} from '@/utils/style'
export default {
    data(){
        return{
            excludes: ['Picture', 'Group'], // 这些组件不显示内容
            textAlignOptions: [
                {
                    label: '左对齐',
                    value: 'left',
                },
                {
                    label: '居中',
                    value: 'center',
                },
                {
                    label: '右对齐',
                    value: 'right',
                },
            ],
            borderStyleOptions: [
                {
                    label: '实线',
                    value: 'solid',
                },
                {
                    label: '虚线',
                    value: 'dashed',
                },
            ],
            verticalAlignOptions: [
                {
                    label: '上对齐',
                    value: 'top',
                },
                {
                    label: '居中对齐',
                    value: 'middle',
                },
                {
                    label: '下对齐',
                    value: 'bottom',
                },
            ],
            styleData,
            selectKey:['textAlign','borderStyle','verticalAlign','fontFamily'],
            fontFamilyOptions: [
                // 儿童友好字体 - 圆润可爱
                { label: '圆体 (适合儿童)', value: 'STYuanti-SC-Regular, "Microsoft YaHei", sans-serif' },
                { label: '幼圆', value: 'YouYuan, "Microsoft YaHei", sans-serif' },
                { label: 'Comic Sans MS (卡通)', value: 'Comic Sans MS, cursive, sans-serif' },
                { label: 'Chalkboard (黑板体)', value: 'Chalkboard, "Comic Sans MS", cursive, sans-serif' },
                { label: 'Marker Felt (马克笔)', value: 'Marker Felt, "Comic Sans MS", cursive, sans-serif' },
                
                // 手写风格字体
                { label: 'Bradley Hand (手写体)', value: 'Bradley Hand, cursive, sans-serif' },
                { label: 'Brush Script MT ( brush 手写)', value: 'Brush Script MT, cursive, sans-serif' },
                { label: 'Lucida Handwriting (手写)', value: 'Lucida Handwriting, cursive, sans-serif' },
                { label: 'Kalam (手写风格)', value: 'Kalam, cursive, sans-serif' },
                
                // 卡通风格字体
                { label: 'Fredoka One (圆润卡通)', value: 'Fredoka One, cursive, sans-serif' },
                { label: 'Nunito (友好圆润)', value: 'Nunito, sans-serif' },
                { label: 'Quicksand (轻盈圆润)', value: 'Quicksand, sans-serif' },
                { label: 'Poppins (现代圆润)', value: 'Poppins, sans-serif' },
                
                // 中文儿童字体
                { label: '微软雅黑 (清晰易读)', value: 'Microsoft YaHei, sans-serif' },
                { label: '方正少儿简体', value: 'FZSEJW, "Microsoft YaHei", sans-serif' },
                { label: '汉仪娃娃篆', value: 'HYWaWaZhuan, "Microsoft YaHei", sans-serif' },
                { label: '汉仪乐喵体', value: 'HYLeMiaoTi, "Microsoft YaHei", sans-serif' },
                
                // 常用中文字体
                { label: '宋体', value: 'SimSun, serif' },
                { label: '黑体', value: 'SimHei, sans-serif' },
                { label: '楷体', value: 'KaiTi, serif' },
                { label: '仿宋', value: 'FangSong, serif' },
                { label: '隶书', value: 'LiSu, serif' },
                { label: '华文黑体', value: 'STHeiti, "SimHei", sans-serif' },
                { label: '华文宋体', value: 'STSong, "SimSun", serif' },
                { label: '华文楷体', value: 'STKaiti, "KaiTi", serif' },
                { label: '华文仿宋', value: 'STFangsong, "FangSong", serif' },
                { label: '华文细黑', value: 'STXihei, "Microsoft YaHei", sans-serif' },
                { label: '华文新魏', value: 'STXinwei, serif' },
                { label: '华文行楷', value: 'STXingkai, cursive, serif' },
                { label: '方正舒体', value: 'FZShuTi, serif' },
                { label: '方正姚体', value: 'FZYaoTi, serif' },
                { label: '方正粗圆简体', value: 'FZCuYuan-M03S, sans-serif' },
                { label: '方正胖娃简体', value: 'FZPangWa-M18S, sans-serif' },
                { label: '汉仪文黑', value: 'HYWenHei, "Microsoft YaHei", sans-serif' },
                { label: '汉仪中楷', value: 'HYZhongKai, "KaiTi", serif' },
                { label: '汉仪行楷', value: 'HYXingKai, cursive, serif' },
                { label: '思源黑体', value: 'Source Han Sans CN, "Microsoft YaHei", sans-serif' },
                { label: '思源宋体', value: 'Source Han Serif CN, "SimSun", serif' },
                { label: '站酷高端黑', value: 'ZhanKuGaoDuanHei, "Microsoft YaHei", sans-serif' },
                { label: '站酷快乐体', value: 'ZhanKuKuaiLeTi, "Microsoft YaHei", sans-serif' },
                { label: '站酷文艺体', value: 'ZhanKuWenYiTi, "Microsoft YaHei", sans-serif' },
                
                // 经典英文字体
                { label: 'Arial', value: 'Arial, sans-serif' },
                { label: 'Times New Roman', value: 'Times New Roman, serif' },
                { label: 'Georgia', value: 'Georgia, serif' },
                { label: 'Verdana', value: 'Verdana, sans-serif' },
            ]
        }
    },
    computed:{
        styleKeys(){
            if(this.$store.state.curComponent){
                const curComponentStyleKeys = Object.keys(this.$store.state.curComponent.style)
                return this.styleData.filter(item => curComponentStyleKeys.includes(item.key))
            }
            return []
        },
        curComponent(){
            return this.$store.state.curComponent
        }
    }
}
</script>
<style scoped>
.attr-list{
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    padding-top: 0;
    min-height:70vh;
    width: 100%;
    box-sizing: border-box;
}

.attr-list  :deep(.el-form) {
    width: 100%;
    box-sizing: border-box;
}

/* 表单项样式优化 */
.attr-list  :deep(.el-form-item) {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
}

.attr-list  :deep(.el-form-item__label) {
    padding: 0 0px 0 0;
    line-height: 32px;
    text-align: left;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
    flex-shrink: 0;
    white-space: nowrap;
}

.attr-list  :deep(.el-form-item__content) {
    flex: 1;
    line-height: 32px;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
}

/* 输入框和选择框样式 */
.attr-list  :deep( .el-input,)
.attr-list  :deep(.el-select) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
}

.attr-list  :deep(.el-input__inner) {
    width: 100%;
    max-width: 100%;
    padding: 0 4px;
    box-sizing: border-box;
}

.attr-list  :deep( .el-input__inner,)
.attr-list  :deep(.el-textarea__inner) {
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    transition: border-color 0.2s;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
}

.attr-list  :deep( .el-input__inner:focus,)
.attr-list  :deep(.el-textarea__inner:focus) {
    border-color: #409eff;
}

/* 颜色选择器样式 */
.attr-list  :deep(.el-color-picker) {
    vertical-align: middle;
}

/* 文本域特殊处理 */
.attr-list  :deep(.form-item-textarea) {
    align-items: flex-start;
}

.attr-list  :deep(.form-item-textarea .el-form-item__label) {
    padding-top: 8px;
}

.attr-list  :deep(.form-item-textarea .el-textarea) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
}

.attr-list  :deep(.el-select) {
    max-width: 100%;
}

.attr-list  :deep(.el-select .el-input) {
    max-width: 100%;
}

.attr-list  :deep(.el-select .el-input__inner) {
    max-width: 100%;
}
</style>