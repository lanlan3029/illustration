<template>
    <div class="prompt-fill-page">
        <div class="prompt-fill-container">
            <!-- 三列布局 -->
            <div class="three-column-layout">
                <!-- 第一列：模板选择器 -->
                <div class="column template-column">
                    <div class="column-header">
                        <h3 class="column-title">{{ $t('promptFill.template') || '模板选择' }}</h3>
                    </div>
                    <div class="column-content">
                       
                        
                       
                    </div>
                </div>

                <!-- 第二列：提示词词库 -->
                <div class="column banks-column">
                    <div class="column-header">
                        <h3 class="column-title">{{ $t('promptFill.banks') || '提示词词库' }}</h3>
                    </div>
                    <div class="column-content banks-display">
                        <el-collapse v-model="activeCategories" accordion>
                            <el-collapse-item 
                                v-for="category in sortedCategories" 
                                :key="category.id"
                                :name="category.id">
                                <template #title>
                                    <div class="collapse-title-wrapper">
                                        <i :class="getCategoryIcon(category.id)" class="category-icon"></i>
                                        <span class="category-title">{{ category.name }}</span>
                                        <span class="category-count">({{ getCategoryBanksCount(category.id) }})</span>
                                    </div>
                                </template>
                                <div class="category-content">
                                    <div 
                                        v-for="bank in getCategoryBanks(category.id)" 
                                        :key="bank.id"
                                        class="bank-item">
                                        <div class="bank-header">
                                            <span class="bank-label">{{ bank.label }}</span>
                                            <span class="bank-options-count">{{ bank.options.length }} 个选项</span>
                                        </div>
                                        <div class="bank-options">
                                            <el-tag
                                                v-for="(option, index) in bank.options"
                                                :key="index"
                                                :type="getTagType(category.id)"
                                                size="small"
                                                class="option-tag"
                                                :class="{ 'tag-selected': isOptionSelected(bank.id, option) }"
                                                @click="selectOption(bank.id, option)"
                                                effect="plain">
                                                {{ option }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </div>
                            </el-collapse-item>
                        </el-collapse>
                    </div>
                </div>

                <!-- 第三列：完整提示词 -->
                <div class="column prompt-column">
                    <div class="column-header">
                        <h3 class="column-title">{{ $t('promptFill.finalPromptPreview') || '完整提示词' }}</h3>
                        <el-button 
                            v-if="finalPrompt"
                            type="text" 
                            size="small" 
                            @click="copyPrompt"
                            class="copy-btn">
                            <i class="el-icon-document-copy"></i> {{ $t('promptFill.copy') || '复制' }}
                        </el-button>
                    </div>
                    <div class="column-content prompt-content">
                        <div v-if="finalPrompt" class="prompt-text">{{ finalPrompt }}</div>
                        <div v-else class="prompt-empty">
                            <i class="el-icon-info"></i>
                            <p>{{ $t('promptFill.pleaseComplete') || '请选择模板并填写词库选项' }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { INITIAL_BANKS, INITIAL_CATEGORIES } from '@/prompt-core/banks';
import { INITIAL_TEMPLATES_CONFIG } from '@/prompt-core/constants';
import { renderTemplate } from '@/prompt-core/parseTemplate';
import { ElMessage } from 'element-plus';

export default {
    name: 'PromptFill',
    data() {
        return {
            banks: INITIAL_BANKS,
            categories: INITIAL_CATEGORIES,
            templates: INITIAL_TEMPLATES_CONFIG,
            selectedTemplateId: 'complete-prompt',
            selections: {}, // { varKey: value }
            activeCategories: [] // el-collapse 的激活项，可以是数组（非手风琴模式）或字符串（手风琴模式）
        }
    },
    computed: {
        // 排序后的分类（按照：人物 -> 动作 -> 物品 -> 地点 -> 画面 -> 其他）
        sortedCategories() {
            const categoryOrder = ['character', 'action', 'item', 'location', 'visual', 'other'];
            return categoryOrder.map(catId => {
                const cat = this.categories[catId];
                if (!cat) return null;
                return {
                    id: catId,
                    name: this.$t(`promptBanks.categories.${catId}`) || cat.label,
                    color: cat.color
                };
            }).filter(Boolean);
        },
        
        // 当前选中的模板
        selectedTemplate() {
            return this.templates.find(t => t.id === this.selectedTemplateId);
        },
        
        // 最终生成的提示词
        finalPrompt() {
            if (!this.selectedTemplate) return '';
            
            if (this.selectedTemplate.id === 'character-simple') {
                // 简单描述模式：只显示风格
                return this.selections.art_style || '';
            }
            
            // 完整提示词模式：使用模板渲染
            if (!this.selectedTemplate.content) return '';
            
            const rendered = renderTemplate(this.selectedTemplate.content, this.selections);
            
            // 如果渲染结果为空，返回提示信息
            if (!rendered || !rendered.trim()) {
                return '';
            }
            
            return rendered;
        }
    },
    mounted() {
        // 默认展开第一个分类（手风琴模式）- 现在是 character（人物）
        if (this.sortedCategories.length > 0) {
            this.activeCategories = this.sortedCategories[0].id;
        }
        
        // 初始化默认值
        this.onTemplateChange(this.selectedTemplateId);
    },
    methods: {
        // 获取模板名称
        getTemplateName(template) {
            if (template.id === 'character-detail') {
                return this.$t('promptBanks.templates.characterDetail') || '详细描述';
            } else if (template.id === 'character-simple') {
                return this.$t('promptBanks.templates.characterSimple') || '简单描述';
            }
            return template.name || template.id;
        },
        
        // 模板切换
        onTemplateChange(templateId) {
            this.selectedTemplateId = templateId;
            // 可以在这里重置选择或加载默认值
        },
        
        // 选择选项
        selectOption(bankId, option) {
            // 切换选择状态
            if (this.selections[bankId] === option) {
                // 如果已选中，取消选择
                this.selections[bankId] = '';
            } else {
                // 选中新选项
                this.selections[bankId] = option;
            }
        },
        
        // 检查选项是否被选中
        isOptionSelected(bankId, option) {
            return this.selections[bankId] === option;
        },
        
        // 复制提示词
        copyPrompt() {
            if (this.finalPrompt) {
                const textarea = document.createElement('textarea');
                textarea.value = this.finalPrompt;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                ElMessage.success(this.$t('promptFill.copiedToClipboard') || '已复制到剪贴板');
            }
        },
        
        // 获取分类下的所有词库
        getCategoryBanks(categoryId) {
            const banks = [];
            if (!this.banks || typeof this.banks !== 'object') {
                console.warn('Banks data is not valid:', this.banks);
                return banks;
            }
            
            Object.keys(this.banks).forEach(bankId => {
                const bank = this.banks[bankId];
                // 确保 bank 存在且有 category 属性
                if (bank && typeof bank === 'object' && bank.category === categoryId) {
                    banks.push({
                        id: bankId,
                        label: bank.label || bankId,
                        options: Array.isArray(bank.options) ? bank.options : []
                    });
                }
            });
            
            // 对于 character 类别，按人物建模顺序排序：主体对象 -> 其他特征 -> 配饰
            if (categoryId === 'character') {
                const orderMap = {
                    'role': 1,              // 主体对象 - 最先
                    'expressions': 2,       // 表情
                    'body_type': 3,         // 体型
                    'pose': 4,              // 姿态
                    'hair_style': 5,        // 发型
                    'hair_color': 6,        // 发色
                    'character_companion': 7, // 合影角色
                    'character_traits': 8,  // 角色特点
                    'accessories': 9        // 配饰 - 最后
                };
                return banks.sort((a, b) => {
                    const orderA = orderMap[a.id] || 99;
                    const orderB = orderMap[b.id] || 99;
                    return orderA - orderB;
                });
            }
            
            // 对于 item 类别，按物品类型排序：服饰 -> 包袋 -> 物品
            if (categoryId === 'item') {
                const orderMap = {
                    'clothing': 1,          // 人物服饰
                    'clothing_male': 2,     // 男性服饰
                    'clothing_female': 3,   // 女性服饰
                    'bag_content': 4,       // 随身包袋
                    'cosmetics': 5,         // 随身物品
                    'private_items': 6      // 个人物品
                };
                return banks.sort((a, b) => {
                    const orderA = orderMap[a.id] || 99;
                    const orderB = orderMap[b.id] || 99;
                    return orderA - orderB;
                });
            }
            
            // 其他类别按 id 排序
            return banks.sort((a, b) => a.id.localeCompare(b.id));
        },
        
        // 获取分类下的词库数量
        getCategoryBanksCount(categoryId) {
            return this.getCategoryBanks(categoryId).length;
        },
        
        
        // 获取分类图标
        getCategoryIcon(categoryId) {
            const iconMap = {
                character: 'el-icon-user',
                item: 'el-icon-shopping-bag-1',
                visual: 'el-icon-picture',
                action: 'el-icon-video-play',
                location: 'el-icon-location',
                other: 'el-icon-more'
            };
            return iconMap[categoryId] || 'el-icon-more';
        },
        
        // 获取标签类型（根据分类返回不同的颜色类型）
        getTagType(categoryId) {
            const typeMap = {
                character: 'primary',
                item: 'warning',
                visual: 'success',
                action: 'danger',
                location: 'info',
                other: 'info'
            };
            return typeMap[categoryId] || 'info';
        }
    }
}
</script>

<style scoped>
.prompt-fill-page {
    min-height: calc(100vh - 50px - 40px);
    background-color: #f5f7fa;
    padding: 24px;
}

.prompt-fill-container {
    max-width: 100%;
    margin: 0 auto;
    width: 100%;
    height: calc(100vh - 50px - 40px - 48px);
}

.three-column-layout {
    display: grid;
    grid-template-columns: 300px 1fr 400px;
    gap: 16px;
    height: 100%;
}

.column {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.column-header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    background-color: #f5f7fa;
}

.column-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0;
}

.copy-btn {
    padding: 4px 8px;
}

.column-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    min-height: 0;
}

/* 模板选择器列 */
.template-column {
    min-width: 300px;
}

.template-radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.template-radio {
    display: block;
    margin: 0;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.3s;
    cursor: pointer;
}

.template-radio:hover {
    background-color: #f5f7fa;
    border-color: #409eff;
}

.template-radio :deep(.el-radio__input.is-checked + .el-radio__label) {
    color: #409eff;
    font-weight: 600;
}

.template-preview {
    margin-top: 20px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
}

.template-preview-label {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 8px;
}

.template-preview-text {
    font-size: 13px;
    color: #909399;
    line-height: 1.6;
    word-break: break-word;
}

/* 词库列 */
.banks-column {
    min-width: 0;
}

.banks-display {
    width: 100%;
}

.banks-display :deep(.el-collapse) {
    border: none;
}

.banks-display :deep(.el-collapse-item) {
    margin-bottom: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fafafa;
}

.banks-display :deep(.el-collapse-item__header) {
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
    height: auto;
    min-height: 44px;
    line-height: 1.5;
    flex-shrink: 0;
}

.banks-display :deep(.el-collapse-item__header:hover) {
    background-color: #ecf5ff;
}

.banks-display :deep(.el-collapse-item__header.is-active) {
    border-bottom-color: #ebeef5;
}

.banks-display :deep(.el-collapse-item__wrap) {
    border-bottom: none;
    background-color: #fff;
}

.banks-display :deep(.el-collapse-item__content) {
    padding: 0;
}

.collapse-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    flex: 1;
}

.category-icon {
    font-size: 16px;
    color: #409eff;
}

.category-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.category-count {
    font-size: 12px;
    color: #909399;
    font-weight: normal;
}

.category-content {
    padding: 16px;
}

.bank-item {
    margin-bottom: 16px;
    padding: 12px;
    background-color: #fff;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
}

.bank-item:last-child {
    margin-bottom: 0;
}

.bank-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.bank-label {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
}

.bank-options-count {
    font-size: 11px;
    color: #909399;
}

.bank-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.option-tag {
    cursor: pointer;
    transition: all 0.2s;
    margin: 0;
}

.option-tag:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.option-tag.tag-selected {
    transform: scale(1.05);
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.4);
    font-weight: 600;
}

/* 提示词列 */
.prompt-column {
    min-width: 400px;
}

.prompt-content {
    display: flex;
    flex-direction: column;
}

.prompt-text {
    font-size: 14px;
    line-height: 1.8;
    color: #303133;
    word-break: break-word;
    white-space: pre-wrap;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    min-height: 200px;
}

.prompt-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #909399;
    text-align: center;
    min-height: 200px;
}

.prompt-empty i {
    font-size: 48px;
    margin-bottom: 16px;
    color: #c0c4cc;
}

.prompt-empty p {
    font-size: 14px;
    margin: 0;
}

/* 滚动条样式 */
.column-content::-webkit-scrollbar {
    width: 6px;
}

.column-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* Responsive */
@media (max-width: 1400px) {
    .three-column-layout {
        grid-template-columns: 280px 1fr 350px;
    }
}

@media (max-width: 1200px) {
    .three-column-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr;
        height: auto;
    }
    
    .column {
        height: auto;
        max-height: 400px;
    }
    
    .prompt-column {
        max-height: 300px;
    }
}

@media (max-width: 768px) {
    .prompt-fill-page {
        padding: 16px;
    }
    
    .prompt-fill-container {
        height: auto;
    }
    
    .column-header {
        padding: 12px 16px;
    }
    
    .column-content {
        padding: 12px;
    }
}
</style>
