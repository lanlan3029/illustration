<template>
  <div class="prompt-fill">
    <!-- 模板选择 -->
    <div class="template-selector" v-if="showTemplateSelector">
      <div class="template-radio-group">
        <el-radio-group v-model="selectedTemplateId" @change="onTemplateChange" size="small" class="template-radio-group-inline">
          <el-radio 
            v-for="template in systemTemplatesOnly"
            :key="template.id"
            :label="template.id"
            class="template-radio">
            {{ template.name }}
          </el-radio>
        </el-radio-group>
      </div>
    </div>

    <!-- 引导式填写区域 -->
    <div v-if="selectedTemplate" class="guide-section">
      <div 
        v-for="category in sortedCategories" 
        :key="category.id"
        class="category-group">
        <div class="category-header" @click="toggleCategory(category.id)">
          <div class="category-title">
            <i :class="getCategoryIcon(category.id)" class="category-icon"></i>
            <span>{{ category.name }}</span>
         
          </div>
          <i :class="categoryCollapsed[category.id] ? 'el-icon-arrow-down' : 'el-icon-arrow-up'" class="collapse-icon"></i>
        </div>
        
        <div v-show="!categoryCollapsed[category.id]" class="category-content">
          <div 
            v-for="varItem in getCategoryVars(category.id)" 
            :key="varItem.key"
            class="var-item"
            :class="{ 'filled': isVarFilled(varItem.name), 'highlight': currentVar && currentVar.key === varItem.key }">
            <div class="var-label">
              <span class="var-name">{{ getVarLabel(varItem.name) }}</span>
         
            </div>
            <div class="var-control">
              <!-- 输入框（始终显示，与选中值绑定） -->
              <el-input
                v-model="varValues[varItem.key]"
                :placeholder="`请输入或选择${getVarLabel(varItem.name)}`"
                size="small"
                class="var-input"
                @input="onInputChange(varItem, $event)"
                @blur="onInputBlur(varItem)">
                <template #append>
                  <el-button 
                    v-if="varValues[varItem.key]"
                    @click="clearVarValue(varItem)"
                    size="small">
                    <i class="el-icon-close"></i>
                  </el-button>
                </template>
              </el-input>
              
              <!-- 选项标签列表 -->
              <div class="options-tags">
                <el-tag
                  v-for="option in getVarOptions(varItem.name)"
                  :key="option"
                  :type="getTagType(varItem.name)"
                  size="small"
                  class="option-tag"
                  :class="{ 'tag-selected': varValues[varItem.key] === option }"
                  @click="selectOption(varItem, option)"
                  effect="plain">
                  {{ option }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 简单描述模式：自由输入 + 风格选择 -->
    <div v-if="selectedTemplate && selectedTemplate.id === 'character-simple'" class="simple-input-section">
      <div class="simple-input-wrapper">
        <el-input
          v-model="customPromptText"
          type="textarea"
          :rows="4"
          placeholder="请输入角色描述（如：穿背带裤的小男孩，开心地笑着）"
          @input="onCustomPromptInput">
        </el-input>
      </div>
      <!-- 风格选择（简单描述模式下只显示风格） -->
      <div class="style-select-section">
        <div class="style-label">风格选择：</div>
        <div class="style-tags">
          <el-tag
            v-for="option in getVarOptions('art_style')"
            :key="option"
            type="success"
            size="small"
            class="option-tag"
            :class="{ 'tag-selected': varValues['art_style-0'] === option }"
            @click="selectStyleOption(option)"
            effect="plain">
            {{ option }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 最终预览 -->
    <div v-if="selectedTemplate" class="preview-section">
      <div class="preview-header">
        <span class="preview-label">最终提示词预览：</span>
        <el-button 
          type="text" 
          size="mini" 
          @click="copyPrompt"
          v-if="finalPrompt">
          <i class="el-icon-document-copy"></i> 复制
        </el-button>
      </div>
      <div class="preview-content">
        <div v-if="finalPrompt" class="rendered-text">{{ finalPrompt }}</div>
        <div v-else class="empty-hint">请完成上方各项填写</div>
      </div>
    </div>
    
    <!-- 调试信息（开发时可见） -->
    <div v-if="!selectedTemplate && showTemplateSelector" style="padding: 20px; color: #909399; text-align: center;">
      <p>正在加载模板...</p>
      <p style="font-size: 12px; margin-top: 8px;">模板数量: {{ templates.length }}</p>
    </div>
  </div>
</template>

<script>
import { parseTemplate, renderTemplate } from '@/prompt-core/parseTemplate';
import { mapState, mapGetters, mapActions } from 'vuex';
import { ElMessage } from 'element-plus';

export default {
  name: 'PromptFill',
  props: {
    value: {
      type: String,
      default: ''
    },
    templateId: {
      type: String,
      default: null
    },
    showTemplateSelector: {
      type: Boolean,
      default: true
    },
    allowCustom: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      selectedTemplateId: this.templateId || 'character-detail', // 默认选择第一个模板
      varValues: {}, // { varKey: value }
      categoryCollapsed: {}, // { categoryId: boolean }
      currentVar: null,
      customInputs: {}, // { varKey: customInputValue }
      customPromptText: '' // 简单描述模式下的自由输入文本
    };
  },
  computed: {
    ...mapState('prompt', ['templates', 'banks', 'defaults', 'selections', 'categories']),
    ...mapGetters('prompt', ['templateById', 'bankById', 'selection']),
    
    selectedTemplate() {
      if (!this.selectedTemplateId) return null;
      return this.templateById(this.selectedTemplateId);
    },
    
    templateContent() {
      return this.selectedTemplate ? this.selectedTemplate.content : '';
    },
    
    tokens() {
      if (!this.templateContent) return [];
      return parseTemplate(this.templateContent);
    },
    
    // 获取所有唯一的变量
    uniqueVars() {
      const varMap = new Map();
      this.tokens.forEach(token => {
        if (token.type === 'var') {
          if (!varMap.has(token.name)) {
            varMap.set(token.name, token);
          }
        }
      });
      return Array.from(varMap.values());
    },
    
    // 按分类组织的变量
    varsByCategory() {
      const result = {};
      this.uniqueVars.forEach(varItem => {
        const bank = this.bankById(varItem.name);
        const categoryId = bank ? (bank.category || 'other') : 'other';
        if (!result[categoryId]) {
          result[categoryId] = [];
        }
        result[categoryId].push(varItem);
      });
      return result;
    },
    
    // 排序后的分类（只显示角色和风格两大类）
    sortedCategories() {
      // 只显示 character 和 visual 分类，并且将 visual 重命名为"风格"
      const allowedCategories = ['character', 'visual'];
      const categoryList = Object.keys(this.varsByCategory)
        .filter(catId => allowedCategories.includes(catId))
        .map(catId => {
          let displayName = this.categories[catId]?.name || catId;
          // 将 visual 分类显示为"风格"
          if (catId === 'visual') {
            displayName = '风格';
          } else if (catId === 'character') {
            displayName = '角色';
          }
          return {
            id: catId,
            name: displayName,
            color: this.categories[catId]?.color || '#909399'
          };
        });
      
      // 确保顺序：角色在前，风格在后
      return categoryList.sort((a, b) => {
        if (a.id === 'character') return -1;
        if (b.id === 'character') return 1;
        return 0;
      });
    },
    
    // 合并后的选择值（用于渲染）
    mergedSelections() {
      const result = {};
      // 从 store 获取
      Object.keys(this.$store.state.prompt.selections).forEach(key => {
        result[key] = this.$store.state.prompt.selections[key];
      });
      // 从本地 varValues 获取（优先级更高）
      Object.keys(this.varValues).forEach(key => {
        const varName = key.split('-')[0];
        result[varName] = this.varValues[key];
      });
      return result;
    },
    
    renderedPrompt() {
      if (!this.templateContent) return this.value || '';
      return renderTemplate(this.templateContent, this.mergedSelections);
    },
    
    // 最终提示词（简单描述模式：用户输入 + 风格；详细描述模式：模板渲染）
    finalPrompt() {
      if (this.selectedTemplate && this.selectedTemplate.id === 'character-simple') {
        // 简单描述模式：用户输入的内容 + 风格
        const styleText = this.mergedSelections.art_style || '';
        if (this.customPromptText && styleText) {
          return `${this.customPromptText}，${styleText}`;
        } else if (this.customPromptText) {
          return this.customPromptText;
        } else if (styleText) {
          return styleText;
        }
        return '';
      } else {
        // 详细描述模式：使用模板渲染
        return this.renderedPrompt;
      }
    },
    
    // 仅系统模板（从 constants.js 导入的）
    systemTemplatesOnly() {
      // 从 INITIAL_TEMPLATES_CONFIG 获取系统模板 ID
      const systemIds = ['character-detail', 'character-simple'];
      return this.templates.filter(t => systemIds.includes(t.id));
    },
    
    // 自定义模板（用户添加的）
    customTemplates() {
      const systemIds = ['character-detail', 'character-simple'];
      return this.templates.filter(t => !systemIds.includes(t.id));
    },
    
    // 是否有自定义模板
    hasCustomTemplates() {
      return this.customTemplates.length > 0;
    }
  },
  watch: {
    finalPrompt: {
      handler(newVal) {
        if (newVal !== this.value) {
          this.$emit('input', newVal);
        }
      },
      immediate: true
    },
    renderedPrompt: {
      handler(newVal) {
        if (newVal !== this.value && this.selectedTemplate && this.selectedTemplate.id !== 'character-simple') {
          this.$emit('input', newVal);
        }
      },
      immediate: true
    },
    templateId(newVal) {
      if (newVal) {
        this.selectedTemplateId = newVal;
        this.onTemplateChange(newVal);
      }
    },
    // 同步 store 中的 selections 到本地 varValues
    '$store.state.prompt.selections': {
      handler(newSelections) {
        if (this.tokens && this.tokens.length > 0) {
          this.tokens.forEach(token => {
            if (token.type === 'var' && newSelections[token.name]) {
              this.varValues[token.key] = newSelections[token.name];
            }
          });
        }
      },
      deep: true
    },
    // 当 subject 改变时，如果正在选择 clothing，需要更新选项
    '$store.state.prompt.selections.subject'() {
      // 强制更新以刷新 clothing 选项
      this.$forceUpdate();
    }
  },
  mounted() {
    // 确保默认选择详细描述模板
    if (!this.selectedTemplateId) {
      this.selectedTemplateId = 'character-detail';
    }
    
    // 等待 store 初始化完成
    this.$nextTick(() => {
      if (this.selectedTemplateId) {
        const template = this.templateById(this.selectedTemplateId);
        if (template) {
          this.onTemplateChange(this.selectedTemplateId);
        } else {
          // 如果指定的模板不存在，使用第一个系统模板
          if (this.systemTemplatesOnly.length > 0) {
            this.selectedTemplateId = this.systemTemplatesOnly[0].id;
            this.onTemplateChange(this.selectedTemplateId);
          }
        }
      }
      
      // 默认展开所有分类
      this.$nextTick(() => {
        this.sortedCategories.forEach(cat => {
          this.categoryCollapsed[cat.id] = false;
        });
      });
    });
  },
  methods: {
    ...mapActions('prompt', ['selectValue']),
    
    onTemplateChange(templateId) {
      const template = this.templateById(templateId);
      if (template) {
        // 如果是简单描述模式，初始化自定义输入框
        if (templateId === 'character-simple') {
          // 如果当前 value 有内容且不是模板渲染的结果，保留用户输入
          if (this.value && !this.value.includes('{{')) {
            this.customPromptText = this.value;
          } else {
            this.customPromptText = '';
          }
        } else {
          this.customPromptText = '';
        }
        
        // 初始化变量值
        this.varValues = {};
        this.tokens.forEach(token => {
          if (token.type === 'var') {
            const currentValue = this.$store.getters['prompt/selection'](token.name) || this.defaults[token.name] || '';
            if (currentValue) {
              this.varValues[token.key] = currentValue;
              // 同步到 store
              this.selectValue({
                varKey: token.name,
                value: currentValue,
                bankId: token.name,
                createOption: false
              });
            }
          }
        });
      }
    },
    
    onVarChange(varItem, value) {
      if (value) {
        this.varValues[varItem.key] = value;
        // 同步到 store
        this.selectValue({
          varKey: varItem.name,
          value: value,
          bankId: varItem.name,
          createOption: !this.getVarOptions(varItem.name).includes(value)
        });
      }
    },
    
    // 点击标签选择选项
    selectOption(varItem, option) {
      this.varValues[varItem.key] = option;
      this.syncToStore(varItem, option, false);
    },
    
    // 输入框内容变化
    onInputChange(varItem, value) {
      // 实时更新本地值，但不立即同步到 store（等 blur 时同步）
      this.varValues[varItem.key] = value;
    },
    
    // 输入框失去焦点时同步到 store
    onInputBlur(varItem) {
      const value = this.varValues[varItem.key];
      if (value && value.trim()) {
        const trimmedValue = value.trim();
        this.varValues[varItem.key] = trimmedValue;
        // 检查是否是预设选项，如果不是则作为自定义选项
        const isPresetOption = this.getVarOptions(varItem.name).includes(trimmedValue);
        this.syncToStore(varItem, trimmedValue, !isPresetOption);
      } else if (!value) {
        // 如果输入框为空，清除 store 中的值
        this.clearVarValue(varItem);
      }
    },
    
    // 同步值到 store
    syncToStore(varItem, value, createOption) {
      this.selectValue({
        varKey: varItem.name,
        value: value,
        bankId: varItem.name,
        createOption: createOption
      });
    },
    
    // 清除变量值
    clearVarValue(varItem) {
      this.varValues[varItem.key] = '';
      this.$store.commit('prompt/setSelection', {
        key: varItem.name,
        value: ''
      });
    },
    
    // 获取标签类型（根据分类返回不同的颜色类型）
    getTagType(varName) {
      const bank = this.bankById(varName);
      if (!bank) return 'info';
      const category = bank.category || 'other';
      const categoryMap = {
        character: 'primary',
        visual: 'success',
        item: 'warning',
        action: 'danger',
        location: 'success',
        other: 'info'
      };
      return categoryMap[category] || 'info';
    },
    
    getVarOptions(varName) {
      // 如果选择的是 clothing，根据 subject 自动选择对应的服饰类型
      if (varName === 'clothing') {
        const subject = this.$store.getters['prompt/selection']('subject') || this.varValues['subject-0'] || '';
        if (subject.includes('男性') || subject.includes('男')) {
          const bank = this.bankById('clothing_male');
          return bank ? bank.options : [];
        } else if (subject.includes('女性') || subject.includes('女')) {
          const bank = this.bankById('clothing_female');
          return bank ? bank.options : [];
        }
        // 默认使用通用 clothing
        const bank = this.bankById('clothing');
        return bank ? bank.options : [];
      }
      
      const bank = this.bankById(varName);
      return bank ? bank.options : [];
    },
    
    getVarLabel(varName) {
      const bank = this.bankById(varName);
      return bank ? (bank.name || bank.label || varName) : varName;
    },
    
    isVarFilled(varName) {
      const value = this.$store.getters['prompt/selection'](varName) || this.varValues[`${varName}-0`];
      return value && value.trim() !== '';
    },
    
    getCategoryVars(categoryId) {
      return this.varsByCategory[categoryId] || [];
    },
    
    getCategoryFilledCount(categoryId) {
      return this.getCategoryVars(categoryId).filter(v => this.isVarFilled(v.name)).length;
    },
    
    getCategoryTotalCount(categoryId) {
      return this.getCategoryVars(categoryId).length;
    },
    
    toggleCategory(categoryId) {
      this.categoryCollapsed[categoryId] = !this.categoryCollapsed[categoryId];
    },
    
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
    
    copyPrompt() {
      if (this.finalPrompt) {
        const textarea = document.createElement('textarea');
        textarea.value = this.finalPrompt;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        ElMessage.success('已复制到剪贴板');
      }
    },
    
    // 简单描述模式下的输入处理
    onCustomPromptInput(value) {
      this.customPromptText = value;
      // 实时更新最终提示词
      this.$emit('input', this.finalPrompt);
    },
    
    // 简单描述模式下选择风格
    selectStyleOption(option) {
      this.varValues['art_style-0'] = option;
      this.selectValue({
        varKey: 'art_style',
        value: option,
        bankId: 'art_style',
        createOption: false
      });
      // 更新最终提示词
      this.$emit('input', this.finalPrompt);
    },
    
    handleTemplateAction(command) {
      if (command === 'clear') {
        this.$confirm('确定要清除所有自定义模板吗？此操作无法撤销。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 只保留系统模板
          const systemIds = ['character-detail', 'character-simple'];
          const systemTemplates = this.templates.filter(t => systemIds.includes(t.id));
          this.$store.commit('prompt/setTemplates', systemTemplates);
          ElMessage.success('已清除所有自定义模板');
          // 如果当前选中的是自定义模板，切换到第一个系统模板
          if (this.selectedTemplateId && !systemIds.includes(this.selectedTemplateId)) {
            this.selectedTemplateId = systemIds[0];
            this.onTemplateChange(this.selectedTemplateId);
          }
        }).catch(() => {});
      }
    },
    
    deleteCustomTemplate(templateId) {
      const template = this.templateById(templateId);
      const templateName = template ? template.name : '此模板';
      
      this.$confirm(`确定要删除"${templateName}"吗？此操作无法撤销。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除模板
        this.$store.commit('prompt/removeTemplate', templateId);
        ElMessage.success('已删除模板');
        
        // 如果当前选中的是被删除的模板，切换到第一个系统模板
        const systemIds = ['character-detail', 'character-simple'];
        if (this.selectedTemplateId === templateId) {
          this.selectedTemplateId = systemIds[0];
          this.onTemplateChange(this.selectedTemplateId);
        }
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.prompt-fill {
  width: 100%;
}

.template-selector {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.template-radio-group {
  margin-bottom: 12px;
}

.template-radio-group-inline {
  display: flex;
  gap: 16px;
}

.template-radio {
  margin-right: 0;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.template-radio:hover {
  background-color: #ecf5ff;
}

.custom-templates-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #dcdfe6;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.custom-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.custom-radio {
  color: #909399;
}

.custom-template-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
}

.custom-template-item:hover .delete-template-btn {
  opacity: 1;
}

.delete-template-btn {
  opacity: 0;
  transition: opacity 0.3s;
  color: #f56c6c;
  padding: 4px 8px;
}

.delete-template-btn:hover {
  color: #f78989;
}

/* 简单输入区域 */
.simple-input-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.simple-input-wrapper {
  margin-bottom: 16px;
}

/* 引导式填写区域 */
.guide-section {
  margin-bottom: 20px;
}

.category-group {
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: background-color 0.3s;
}

.category-header:hover {
  background-color: #ecf5ff;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.category-icon {
  font-size: 16px;
  color: #409eff;
}



.collapse-icon {
  font-size: 14px;
  color: #909399;
  transition: transform 0.3s;
}

.category-content {
  padding: 12px 16px;
}

.var-item {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  background-color: #fafafa;
  transition: all 0.3s;
}

.var-item:last-child {
  margin-bottom: 0;
}

.var-item.filled {
  border-color: #8167a9;
  background-color: #f0f9ff;
}

.var-item.highlight {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.var-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.var-name {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.filled-tag {
  margin-left: 8px;
}

.var-control {
  width: 100%;
}

.var-input {
  margin-bottom: 12px;
  width: 100%;
}

.options-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.option-tag {
  cursor: pointer;
  transition: all 0.3s;
  margin: 0;
}

.option-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.option-tag.tag-selected {
  transform: scale(1.1);
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.4);
  font-weight: 600;
}

/* 预览区域 */
.preview-section {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
  min-height: 100px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.preview-content {
  line-height: 1.8;
  font-size: 14px;
  color: #303133;
  word-break: break-word;
  white-space: pre-wrap;
  padding: 12px;
  background-color: #fff;
  border-radius: 4px;
  min-height: 60px;
}

.rendered-text {
  color: #303133;
}

.empty-hint {
  color: #909399;
  font-style: italic;
  text-align: center;
  padding: 20px 0;
}

/* 简单输入区域样式 */
.style-select-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.style-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
