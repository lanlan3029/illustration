<template>
    <div class="inspiration-book">
        <!-- 主内容区域 -->
        <main class="inspiration-main">
            <!-- 左侧：提示词 -->
            <div class="prompt-container">
                <el-scrollbar class="scrollbar-container">
                    <h2 class="section-title">{{ $t('aibooks.title') }}</h2>
                    
                    <el-form :model="form" class="book-form">
                        <el-form-item :label="$t('aibooks.prompt')">
                            <el-input
                                v-model="form.prompt"
                                type="textarea"
                                :rows="4"
                                :placeholder="$t('aibooks.promptPlaceholder')"
                                class="prompt-input">
                            </el-input>
                        </el-form-item>

                        <el-form-item :label="$t('aibooks.style')">
                            <div class="style-tags-container">
                                <el-check-tag
                                    v-for="style in styles"
                                    :key="style.key"
                                    :checked="form.artStyle === style.key"
                                    type="primary"
                                    @change="(checked) => handleStyleChange(style.key, checked)"
                                    class="style-tag">
                                    {{ style.artStyle }}
                                </el-check-tag>
                            </div>
                        </el-form-item>

                   

                        <el-form-item>
                            <el-button
                                type="primary"
                                @click="generateBook"
                                :loading="generating"
                                :disabled="!form.prompt || !form.prompt.trim() || generating"
                                class="generate-btn">
                                {{ generating ? $t('aibooks.generating') : $t('aibooks.generate') }}
                            </el-button>
                        </el-form-item>
                    </el-form>

                    <!-- 生成进度 -->
                    <div v-if="generating" class="progress-info">
                        <el-progress
                            :percentage="progressPercentage"
                            :status="progressStatus"
                            :stroke-width="12">
                        </el-progress>
                        <p class="progress-text">{{ progressText }}</p>
                    </div>

                    <!-- 图片生成提示词编辑区域 -->
                    <div v-if="!generating && imagePrompts && imagePrompts.length > 0" class="prompts-editor">
                        <h3 class="prompts-title">{{ $t('aibooks.editPrompts') }}</h3>
                        <div class="prompts-list">
                            <div
                                v-for="(prompt, index) in imagePrompts"
                                :key="index"
                                class="prompt-item">
                                <div class="prompt-label">{{ $t('aibooks.page', { page: index + 1 }) }}：</div>
                                <el-input
                                    v-model="imagePrompts[index]"
                                    type="textarea"
                                    :rows="3"
                                    :placeholder="$t('aibooks.page', { page: index + 1 }) + ' ' + $t('aibooks.promptPlaceholder')"
                                    class="prompt-textarea">
                                </el-input>
                            </div>
                        </div>
                        <el-button
                            type="primary"
                            @click="generateImagesFromPrompts"
                            :loading="generatingImages"
                            :disabled="generatingImages || !imagePrompts || imagePrompts.length === 0"
                            class="generate-images-btn">
                            {{ generatingImages ? $t('aibooks.generating') : $t('aibooks.startGenerate') }}
                        </el-button>
                    </div>
                </el-scrollbar>
            </div>

            <!-- 右侧：生成绘本 -->
            <div class="generated-book">
                <el-scrollbar class="scrollbar-container">
                    <div v-if="!bookData && !generating" class="empty-state">
                        <i class="el-icon-picture-outline"></i>
                        <p>{{ $t('aibooks.emptyState') }}</p>
                    </div>

                    <div v-if="bookData" class="book-content">
                        <!-- 书名和总结 -->
                        <div class="book-header">
                            <div class="book-header-content">
                                <h1 class="book-title">{{ bookData.title }}</h1>
                                <p class="book-summary">{{ bookData.summary }}</p>
                            </div>
                            <el-button
                                v-if="bookData"
                                type="primary"
                                @click="downloadAllImages"
                                :loading="downloading"
                                :disabled="!bookData.images || bookData.images.length === 0 || downloading"
                                class="download-btn">
                                <el-icon><Download /></el-icon>
                                {{ $t('aibooks.downloadAll') }}
                            </el-button>
                        </div>

                        <!-- 故事内容 -->
                        <div class="story-pages">
                            <el-card
                                v-for="(scene, index) in bookData.scenes"
                                :key="index"
                                class="story-page-card"
                                shadow="hover">
                                <div class="card-image">
                                    <el-image
                                        v-if="bookData.images && bookData.images[index]"
                                        :src="bookData.images[index]"
                                        fit="cover"
                                        class="story-image"
                                        :preview-src-list="bookData.images.filter(img => img)">
                                        <template #error>
                                            <div class="image-slot">
                                                <i class="el-icon-picture-outline"></i>
                                            </div>
                                        </template>
                                        <template #placeholder>
                                            <div class="image-loading">
                                                <i class="el-icon-loading"></i>
                                                <p>加载中...</p>
                                            </div>
                                        </template>
                                    </el-image>
                                    <div v-else class="image-placeholder">
                                        <i class="el-icon-picture-outline"></i>
                                        <p>图片生成中...</p>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">{{ bookData.title }} - 第 {{ index + 1 }} 页</h3>
                                    <p class="scene-text">{{ scene }}</p>
                                    <div class="card-actions">
                                        <el-button
                                            type="primary"
                                            size="small"
                                            @click="collectIllustration(bookData.images[index], index)">
                                            {{ $t('aibooks.collectIllustration') }}
                                        </el-button>
                                    </div>
                                </div>
                            </el-card>
                        </div>
                    </div>
                </el-scrollbar>
            </div>
        </main>
    </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { getCurrentInstance, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { Download } from '@element-plus/icons-vue'

export default {
    name: 'AIBooks',
    components: {
        Download
    },
    setup() {
        const { proxy } = getCurrentInstance()
        const { t, locale } = useI18n()
        
        // 风格键名数组，用于保持顺序
        const styleKeys = [
            'healingWatercolor',
            'penLineArt',
            'colorfulOutlineRomanticism',
            'crayonNoiseHandDrawn',
            'vintageSketch',
            'pixarStyle',
            'engravingLines',
            'pencilSketch3D',
            'feltCollage',
            'collageIllustration',
            'doodleSoul',
            'abstractFlatDesign',
            'simpleCartoon',
            'oilPainting'
        ]
        
        // 根据当前语言动态获取风格列表
        const styles = computed(() => {
            return styleKeys.map(key => ({
                key: key,
                artStyle: t(`aibooks.styles.${key}.artStyle`),
                elementDetails: t(`aibooks.styles.${key}.elementDetails`)
            }))
        })
        
        return {
            $http: proxy?.$http || axios,
            styles,
            locale
        }
    },
    data() {
        return {
            downloading: false,
            form: {
                prompt: '',
                artStyle: 'healingWatercolor' // 使用 key 作为默认值
            },
            generating: false,
            progressPercentage: 0,
            progressStatus: '', // '' | 'success' | 'exception' | 'warning'
            progressText: '准备开始...',
            bookData: null,
            storyData: null,
            imagePrompts: [],
            generatingImages: false,
            // API 配置
            doubaoSeedApiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            doubaoSeedApiKey: '9f3336c3-eb0e-4d80-9fd1-d05297237e7d',
            doubaoSeedModel: 'doubao-seed-1-6-251015',
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
            autoSaveTimer: null // 自动保存定时器
        }
    },
    mounted() {
        // 页面加载时从本地存储恢复数据
        this.loadFromLocalStorage();
        // 设置自动保存
        this.setupAutoSave();
    },
    beforeUnmount() {
        // 组件销毁前清除定时器
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
    },
    methods: {
        // 处理风格选择（单选模式），并将风格信息写入提示词
        handleStyleChange(styleKey, checked) {
            if (!checked) {
                // 单选模式下，取消勾选不改变当前选中风格
                return;
            }
            // 更新当前选中的风格（使用 key）
            this.form.artStyle = styleKey;

            // 在 styles 数组中找到对应的风格说明
            const style = this.styles.find(s => s.key === styleKey);
            if (!style) return;

            const styleText = `【画风：${style.artStyle}】${style.elementDetails}`;

            // 如果 prompt 中还没有这段风格描述，则追加到末尾
            if (!this.form.prompt.includes(styleText)) {
                this.form.prompt = this.form.prompt
                    ? `${this.form.prompt}\n\n${styleText}`
                    : styleText;
            }
        },

        // 将图片转换为 Base64
        async imageToBase64(imageUrl) {
            if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
                return imageUrl
            }
            try {
                const response = await fetch(imageUrl)
                const blob = await response.blob()
                return new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result)
                    reader.onerror = reject
                    reader.readAsDataURL(blob)
                })
            } catch (error) {
                console.error('图片转换失败:', error)
                throw error
            }
        },
        
        // 生成绘本
        async generateBook() {
            if (!this.form.prompt || !this.form.prompt.trim()) {
                ElMessage.warning('请输入提示词')
                return
            }
            
            this.generating = true
            this.progressPercentage = 0
            this.progressStatus = ''
            this.progressText = '正在生成故事...'
            this.bookData = null
            
            try {
                // 步骤1: 调用 doubao-seed-1.6 生成故事
                this.progressPercentage = 10
                this.progressText = '正在创作故事...'
                
                const storyData = await this.generateStory()
                
                this.progressPercentage = 100
                this.progressStatus = 'success'
                this.progressText = '故事创作完成！'
                
                // 保存故事数据
                this.storyData = storyData
                
                // 提取 scenes_detail 并处理为可编辑的提示词
                this.imagePrompts = storyData.scenes_detail.map((detail) => {
                    // 移除"图片X："前缀（如果存在）
                    let prompt = detail.replace(/^图片\d+[：:]\s*/, '')
                    
                    return prompt
                })
                
                // 在末尾添加封面和去文字提示
                if (this.imagePrompts.length > 0) {
                    const lastPrompt = this.imagePrompts[this.imagePrompts.length - 1]
                    this.imagePrompts[this.imagePrompts.length - 1] = lastPrompt + '\n\n最后，为故事书创作一个封面。 再检查所有图片，去除图片中的文字'
                }
                
                ElMessage.success('故事创作完成！请编辑提示词后点击"开始生成绘本"')
                
                // 保存到本地存储
                this.saveToLocalStorage()
            } catch (error) {
                console.error('生成绘本失败:', error)
                this.progressStatus = 'exception'
                this.progressText = '生成失败，请重试'
                ElMessage.error(error.message || '生成失败，请重试')
            } finally {
                this.generating = false
            }
        },
        
        // 生成故事（调用 doubao-seed-1.6）
        async generateStory() {
            const systemPrompt = `# 角色

你是一位专注于固定画风创作的**资深绘本大师**，擅长根据读者群体定位打造统一视觉风格的儿童向治愈系水彩风、能全程保持角色形象（外貌、神态、性格特征）、绘画风格（色彩、光影、笔触、构图逻辑）高度连贯一致，具备成熟的绘本叙事能力。
。

## 任务

贴合**少儿读者**，创作**情节线性连贯的、生动有趣的、充满情绪价值和温度的、有情感共鸣的、分镜-文案-画面严格顺序对应的绘本内容**：
- 核心约束：**分镜拆分→文案（scenes）→画面描述（scenes_detail）必须1:1顺序绑定**，从故事开头到结尾，像「放电影」一样按时间线推进，绝无错位。

## 工作流程

1.  充分理解用户诉求。 优先按照用户的创作细节要求执行（如果有）
2.  **故事构思:** 创作一个能够精准回应用户诉求、提供情感慰藉的故事脉络。整个故事必须围绕"共情"和"情绪价值"展开。
3.  **分镜结构与数量:**
    * 将故事浓缩成 **5~10** 个关键分镜，最多10个（不能超过10个）。
    * 必须遵循清晰的叙事弧线：开端 → 发展 → 高潮 → 结局。
4.  **文案与画面 (一一对应):**
    * **文案 ("scenes"字段):** 为每个分镜创作具备情感穿透力的文案。文案必须与画面描述紧密贴合，共同服务于情绪的传递。**禁止在文案中使用任何英文引号 ("")**。不能超过10个。
    * **画面 ("scenes_detail"字段):** 为每个分镜构思详细的画面。画风必须贴合用户诉求和故事氛围。描述需包含构图、光影、色彩、角色神态等关键视觉要素，达到可直接用于图片生成的标准。
5.  **书名 ("title"字段):**
    * 构思一个简洁、好记、有创意的书名。
    * 书名必须能巧妙地概括故事精髓，并能瞬间"戳中"目标用户的情绪共鸣点。
6.  **故事总结 ("summary"字段):**
    * 创作一句**不超过30个汉字**的总结。
    * 总结需高度凝练故事的核心思想与情感价值。
7. 整合输出：将所有内容按指定 JSON 格式整理输出。

## 安全限制
生成的内容必须严格遵守以下规定：
1.  **禁止暴力与血腥:** 不得包含任何详细的暴力、伤害、血腥或令人不适的画面描述。
2.  **禁止色情内容:** 不得包含任何色情、性暗示或不适宜的裸露内容。
3.  **禁止仇恨与歧视:** 不得包含针对任何群体（基于种族、宗教、性别、性取向等）的仇恨、歧视或攻击性言论。
4.  **禁止违法与危险行为:** 不得描绘或鼓励任何非法活动、自残或危险行为。
5.  **确保普遍适宜性:** 整体内容应保持在社会普遍接受的艺术创作范围内，避免极端争议性话题。

## 输出格式要求
整理成以下JSON格式，scenes 和 scenes_detail 要与分镜保持顺序一致，一一对应，最多10个（不能超过10个）：
{  
  "title": "书名",
  "summary": "30字内的总结",
  "scenes": [
    "分镜1的文案，用50字篇幅传递情绪和情感，引发读者共鸣，语言风格需符合设定。",
    "分镜2的文案"
  ],
  "scenes_detail": [
    "图片1：这是第一页的画面描述。必须以'图片'+序号开头。要有强烈的视觉感，详细描述构图（如特写、远景）、光影、色彩、角色表情、动作和环境细节，符合生图提示词的要求。",
    "图片2："
  ]
}`

            const messages = []
            
            // 构建用户消息，包含选中的风格
            const selectedStyle = this.styles.find(s => s.key === this.form.artStyle)
            const styleName = selectedStyle ? selectedStyle.artStyle : ''
            const styleDetails = selectedStyle ? selectedStyle.elementDetails : ''
            const stylePrompt = styleName && styleDetails ? `\n\n画风要求：${styleName}。${styleDetails}` : ''
            messages.push({
                role: 'user',
                content: `请创作一个绘本故事。${stylePrompt}\n\n用户提示词：${this.form.prompt}`
            })
            
            const requestData = {
                model: this.doubaoSeedModel,
                max_completion_tokens: 65535,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    ...messages
                ],
                reasoning_effort: 'medium'
            }
            
            const response = await this.$http.post(this.doubaoSeedApiUrl, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.doubaoSeedApiKey}`
                },
                timeout: 120000
            })
            
            // 解析响应
            const responseData = response.data
            let storyJson = null
            
            // 判断响应状态
            if (!responseData) {
                throw new Error('API响应为空')
            }
            
            // 检查是否有错误
            if (responseData.error) {
                throw new Error(`API错误: ${responseData.error.message || responseData.error.code || '未知错误'}`)
            }
            
            // 检查 choices 数组是否存在且有效
            if (!responseData.choices || !Array.isArray(responseData.choices) || responseData.choices.length === 0) {
                throw new Error('API响应中未找到有效的choices数组')
            }
            
            const firstChoice = responseData.choices[0]
            
            // 检查 finish_reason 判断生成状态
            if (firstChoice.finish_reason) {
                if (firstChoice.finish_reason === 'stop') {
                    // 正常完成
                    console.log('故事生成完成')
                } else if (firstChoice.finish_reason === 'length') {
                    // 内容被截断
                    console.warn('故事生成可能被截断，finish_reason: length')
                } else if (firstChoice.finish_reason === 'content_filter') {
                    // 内容被过滤
                    throw new Error('生成的内容被安全过滤器拦截')
                } else {
                    console.warn(`未知的finish_reason: ${firstChoice.finish_reason}`)
                }
            }
            
            // 检查 message 是否存在
            if (!firstChoice.message || !firstChoice.message.content) {
                throw new Error('API响应中未找到有效的message内容')
            }
            
            const content = firstChoice.message.content
            
            // 尝试提取 JSON（支持多行JSON格式）
            let jsonMatch = content.match(/\{[\s\S]*\}/)
            
            // 如果没有找到，尝试查找被代码块包裹的JSON
            if (!jsonMatch) {
                jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
                if (jsonMatch) {
                    jsonMatch = [jsonMatch[1], jsonMatch[1]]
                }
            }
            
            if (jsonMatch && jsonMatch[0]) {
                try {
                    // 清理可能的代码块标记
                    let jsonStr = jsonMatch[0]
                        .replace(/```json\n?/g, '')
                        .replace(/```\n?/g, '')
                        .trim()
                    
                    storyJson = JSON.parse(jsonStr)
                } catch (e) {
                    console.error('JSON解析失败:', e)
                    console.error('原始内容:', content)
                    throw new Error('JSON解析失败: ' + e.message)
                }
            } else {
                console.error('未找到JSON内容，完整响应:', content)
                throw new Error('响应中未找到有效的JSON格式')
            }
            
            // 验证数据格式
            if (!storyJson.title || !storyJson.summary || !storyJson.scenes || !storyJson.scenes_detail) {
                throw new Error('生成的故事数据格式不完整')
            }
            
            if (storyJson.scenes.length !== storyJson.scenes_detail.length) {
                throw new Error('文案和画面描述数量不匹配')
            }
            
            return storyJson
        },
        
        // 从编辑后的提示词生成图片
        async generateImagesFromPrompts() {
            if (!this.imagePrompts || this.imagePrompts.length === 0) {
                ElMessage.warning('没有可生成的提示词');
                return;
            }
            
            if (!this.storyData) {
                ElMessage.warning('请先生成故事');
                return;
            }
            
            this.generatingImages = true
            this.progressPercentage = 0
            this.progressStatus = ''
            this.progressText = '开始生成图片...'
            
            try {
                // 生成图片
                const images = await this.generateImages(this.imagePrompts, this.imagePrompts.length)
                
                // 组装故事书数据
                this.bookData = {
                    title: this.storyData.title,
                    summary: this.storyData.summary,
                    scenes: this.storyData.scenes,
                    scenes_detail: this.storyData.scenes_detail,
                    images: images
                }
                
                this.progressPercentage = 100
                this.progressStatus = 'success'
                this.progressText = '绘本生成完成！'
                
                // 保存到本地存储
                this.saveToLocalStorage();
                
                ElMessage.success('绘本生成成功！')
            } catch (error) {
                console.error('生成图片失败:', error)
                this.progressStatus = 'exception'
                this.progressText = '生成失败，请重试'
                ElMessage.error(error.message || '生成失败，请重试')
            } finally {
                this.generatingImages = false
            }
        },
        
        // 将文件转换为Base64
        async fileToBase64(file, compress = false) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = async (e) => {
                    let result = e.target.result
                    
                    // 如果需要压缩
                    if (compress) {
                        try {
                            const img = new Image()
                            img.onload = () => {
                                const canvas = document.createElement('canvas')
                                const maxWidth = 1024
                                const maxHeight = 1024
                                let width = img.width
                                let height = img.height
                                
                                if (width > maxWidth || height > maxHeight) {
                                    if (width > height) {
                                        height = (height * maxWidth) / width
                                        width = maxWidth
                                    } else {
                                        width = (width * maxHeight) / height
                                        height = maxHeight
                                    }
                                }
                                
                                canvas.width = width
                                canvas.height = height
                                const ctx = canvas.getContext('2d')
                                ctx.drawImage(img, 0, 0, width, height)
                                
                                canvas.toBlob((blob) => {
                                    const reader2 = new FileReader()
                                    reader2.onload = () => resolve(reader2.result)
                                    reader2.onerror = reject
                                    reader2.readAsDataURL(blob)
                                }, 'image/jpeg', 0.8)
                            }
                            img.onerror = reject
                            img.src = result
                        } catch (error) {
                            resolve(result) // 压缩失败，返回原始结果
                        }
                    } else {
                        resolve(result)
                    }
                }
                reader.onerror = reject
                reader.readAsDataURL(file)
            })
        },
        
        // 生成图片（调用 /create-character API，参照 CreateCharacter.vue）
        async generateImages(prompts, imageCount) {
            const images = []
            
            // prompts 现在是一个数组，每个元素对应一张图片的提示词
            const promptList = Array.isArray(prompts) ? prompts : [prompts]
            
            // 为每个分镜生成图片
            for (let i = 0; i < imageCount && i < promptList.length; i++) {
                this.progressPercentage = Math.floor((i / imageCount) * 100)
                this.progressText = `正在生成第 ${i + 1}/${imageCount} 张图片...`
                
                try {
                    // 构建请求数据，参照 CreateCharacter.vue 的格式
                    const requestData = {
                        prompt: promptList[i].trim(),
                        size: '1280x960',
                        response_format: 'b64_json',
                        watermark: false
                    }
                    
                    // 在提示词中添加风格信息
                    if (this.form.artStyle) {
                        const selectedStyle = this.styles.find(s => s.key === this.form.artStyle)
                        if (selectedStyle) {
                            const styleInfo = `${selectedStyle.artStyle}。${selectedStyle.elementDetails}`
                            requestData.prompt = `${requestData.prompt}\n\n画风：${styleInfo}`
                        }
                    }
                    
                    // 调用创建角色API（与 CreateCharacter.vue 使用相同的API）
                    const apiUrl = this.apiBaseUrl 
                        ? `${this.apiBaseUrl}/create-character`
                        : '/create-character'
                    
                    const response = await this.$http.post(apiUrl, requestData, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                        },
                        timeout: 180000 // 3分钟超时
                    })
                    
                    // 处理响应，参照 CreateCharacter.vue 的响应处理
                    const responseData = response.data
                    
                    // 判断响应状态
                    if (!responseData) {
                        throw new Error('API响应为空')
                    }
                    
                    // 检查是否有错误信息
                    if (responseData.error) {
                        const errorMsg = responseData.error.message || responseData.error.code || '未知错误'
                        throw new Error(`生成图片失败: ${errorMsg}`)
                    }
                    
                    // 判断成功状态：code === 0 或 desc === 'success'
                    const isSuccess = (responseData.code === 0 || responseData.code === '0') 
                        || responseData.desc === 'success' 
                        || responseData.statuscode === 'success'
                    
                    if (!isSuccess) {
                        const errorMsg = responseData.desc || responseData.message || `code: ${responseData.code}`
                        throw new Error(`生成图片失败: ${errorMsg}`)
                    }
                    
                    if (!responseData.message) {
                        throw new Error('API响应中未找到message字段')
                    }
                    
                    if (isSuccess && responseData.message) {
                        const result = responseData.message
                        
                        // 提取图片URL，优先使用 image_url，其次使用 character_image_url，最后使用 base64
                        let imageUrl = null
                        if (result.image_url) {
                            imageUrl = result.image_url
                        } else if (result.character_image_url) {
                            imageUrl = result.character_image_url
                        } else if (result.image_base64) {
                            let base64Str = result.image_base64.trim()
                            if (!base64Str.startsWith('data:')) {
                                base64Str = base64Str.replace(/\s/g, '')
                                base64Str = `data:image/jpeg;base64,${base64Str}`
                            }
                            imageUrl = base64Str
                        } else if (result.character_image_base64) {
                            let base64Str = result.character_image_base64.trim()
                            if (!base64Str.startsWith('data:')) {
                                base64Str = base64Str.replace(/\s/g, '')
                                base64Str = `data:image/jpeg;base64,${base64Str}`
                            }
                            imageUrl = base64Str
                        }
                        
                        // 如果还是没有图片URL，尝试从 full_response 中获取
                        if (!imageUrl && result.full_response) {
                            if (result.full_response.data && Array.isArray(result.full_response.data) && result.full_response.data.length > 0) {
                                const firstData = result.full_response.data[0]
                                // 处理 b64_json 格式
                                if (firstData.b64_json) {
                                    const base64Str = firstData.b64_json.trim()
                                    imageUrl = `data:image/jpeg;base64,${base64Str}`
                                } else {
                                    imageUrl = firstData.url || firstData.ResultUrl || ''
                                }
                            }
                            if (!imageUrl) {
                                imageUrl = result.full_response.result_url || result.full_response.ResultUrl || result.full_response.url || ''
                            }
                        }
                        
                        // 尝试从其他字段获取
                        if (!imageUrl) {
                            imageUrl = result.character_image_oss_url || result.result_url || result.ResultUrl || ''
                        }
                        
                        // 如果还是没有，尝试从 result 中直接获取 b64_json
                        if (!imageUrl && result.b64_json) {
                            const base64Str = result.b64_json.trim()
                            imageUrl = `data:image/jpeg;base64,${base64Str}`
                        }
                        
                        if (imageUrl) {
                            images.push(imageUrl)
                            console.log(`第 ${i + 1} 张图片生成成功:`, imageUrl.substring(0, 50) + '...')
                        } else {
                            const errorMsg = `第 ${i + 1} 张图片生成成功但未找到图片URL`
                            console.error(errorMsg, result)
                            throw new Error(errorMsg)
                        }
                    } else {
                        throw new Error(responseData.message || responseData.desc || '图片生成失败')
                    }
                } catch (error) {
                    console.error(`生成第 ${i + 1} 张图片失败:`, error)
                    let errorMessage = '图片生成失败'
                    if (error.response) {
                        const errorData = error.response.data
                        errorMessage = errorData?.message || errorData?.desc || errorMessage
                    } else if (error.message) {
                        errorMessage = error.message
                    }
                    console.error(errorMessage)
                    images.push(null)
                }
            }
            
            return images
        },
        
        // 收集插画（保存到"我的插画"）
        async collectIllustration(imageUrl, index) {
            if (!imageUrl) {
                ElMessage.warning('图片尚未生成，请稍候');
                return;
            }
            
            try {
                ElMessage.info(`正在保存第 ${index + 1} 张插画...`);
                
                // 处理URL格式
                let pictureValue = imageUrl;
                
                // 如果是相对路径，转换为完整URL
                if (pictureValue && !pictureValue.startsWith('http://') && !pictureValue.startsWith('https://') && !pictureValue.startsWith('data:')) {
                    pictureValue = `https://static.kidstory.cc/${pictureValue}`;
                }
                
                // 构建请求数据
                const requestData = {
                    picture: pictureValue, // 支持 URL 或 base64
                    title: `${this.bookData.title} - 第 ${index + 1} 页`,
                    description: `${this.bookData.title} 的第 ${index + 1} 页插画`,
                    type: 'others' // 默认类别为"其他"
                };
                
                // 获取token
                const token = localStorage.getItem('token') || '';
                if (!token) {
                    ElMessage.error('请先登录');
                    return;
                }
                
                // 发送请求到服务器
                const response = await this.$http.post('/ill/', requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                // 检查响应
                if (response.data && (response.data.desc === 'success' || response.data.code === 0 || response.data.code === '0')) {
                    ElMessage.success(`第 ${index + 1} 张插画已保存到"我的插画"`);
                } else {
                    throw new Error(response.data?.message || '保存失败');
                }
            } catch (error) {
                console.error('收集插画失败:', error);
                const errorMessage = error.response?.data?.message || error.message || '保存失败，请重试';
                ElMessage.error(`收集插画失败: ${errorMessage}`);
            }
        },
        
        // 下载所有图片（图片+文字组合）
        async downloadAllImages() {
            if (!this.bookData || !this.bookData.images || this.bookData.images.length === 0) {
                ElMessage.warning('没有可下载的图片');
                return;
            }
            
            if (this.downloading) {
                return;
            }
            
            this.downloading = true;
            ElMessage.info('正在准备下载，请稍候...');
            
            try {
                const images = this.bookData.images;
                const scenes = this.bookData.scenes || [];
                
                // 遍历每张图片，生成带文字的图片
                for (let i = 0; i < images.length; i++) {
                    if (!images[i]) {
                        console.warn(`第 ${i + 1} 张图片不存在，跳过`);
                        continue;
                    }
                    
                    try {
                        // 生成带文字的图片
                        const blob = await this.createImageWithText(images[i], scenes[i] || '');
                        
                        // 下载图片
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${this.bookData.title || '绘本'}_第${i + 1}页.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        // 每张图片之间稍作延迟，避免浏览器阻止多个下载
                        if (i < images.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    } catch (error) {
                        console.error(`处理第 ${i + 1} 张图片失败:`, error);
                        ElMessage.warning(`第 ${i + 1} 张图片处理失败，已跳过`);
                    }
                }
                
                ElMessage.success(`已成功下载 ${images.length} 张图片`);
            } catch (error) {
                console.error('下载图片失败:', error);
                ElMessage.error('下载失败，请重试');
            } finally {
                this.downloading = false;
            }
        },
        
        // 创建带文字的图片（图片在上，文字在下）
        async createImageWithText(imageUrl, text) {
            return new Promise((resolve, reject) => {
                // 创建图片对象
                const img = new Image();
                
                
                img.onload = () => {
                    try {
                        // 设置画布尺寸
                        // 图片高度占比 75%，文字高度占比 25%
                        const imageHeight = img.height;
                        const imageWidth = img.width;
                        
                        // 计算文字区域高度（图片高度的 25% / 75% = 1/3）
                        const textAreaHeight = Math.floor(imageHeight / 3);
                        const canvasHeight = imageHeight + textAreaHeight;
                        const canvasWidth = imageWidth;
                        
                        // 创建 canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = canvasWidth;
                        canvas.height = canvasHeight;
                        const ctx = canvas.getContext('2d');
                        
                        // 绘制图片（占 75% 高度）
                        const imageDrawHeight = imageHeight;
                        ctx.drawImage(img, 0, 0, imageWidth, imageDrawHeight);
                        
                        // 绘制文字区域背景（白色）
                        const textY = imageDrawHeight;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, textY, canvasWidth, textAreaHeight);
                        
                        // 设置文字样式
                        const padding = 40; // 页边距
                        const maxTextWidth = canvasWidth - padding * 2;
                        const fontSize = Math.max(24, Math.min(32, Math.floor(canvasWidth / 30))); // 根据画布宽度自适应字体大小
                        const lineHeight = fontSize * 1.6; // 行高
                        
                        ctx.fillStyle = '#333333';
                        ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        
                        // 处理文字换行
                        const words = text.split('');
                        const lines = [];
                        let currentLine = '';
                        
                        for (let i = 0; i < words.length; i++) {
                            const testLine = currentLine + words[i];
                            const metrics = ctx.measureText(testLine);
                            
                            if (metrics.width > maxTextWidth && currentLine !== '') {
                                lines.push(currentLine);
                                currentLine = words[i];
                            } else {
                                currentLine = testLine;
                            }
                        }
                        if (currentLine) {
                            lines.push(currentLine);
                        }
                        
                        // 限制最大行数，避免超出文字区域
                        const maxLines = Math.floor((textAreaHeight - padding * 2) / lineHeight);
                        const displayLines = lines.slice(0, maxLines);
                        
                        // 计算文字起始位置（垂直居中）
                        const totalTextHeight = displayLines.length * lineHeight;
                        const startY = textY + (textAreaHeight - totalTextHeight) / 2;
                        
                        // 绘制文字
                        displayLines.forEach((line, index) => {
                            const y = startY + index * lineHeight;
                            ctx.fillText(line, padding, y);
                        });
                        
                        // 如果文字被截断，在最后一行添加省略号
                        if (lines.length > maxLines) {
                            const lastLine = displayLines[displayLines.length - 1];
                            const lastLineY = startY + (displayLines.length - 1) * lineHeight;
                            const lastLineWidth = ctx.measureText(lastLine).width;
                            
                            // 如果最后一行还有空间，添加省略号
                            if (lastLineWidth + ctx.measureText('...').width < maxTextWidth) {
                                ctx.fillText('...', padding + lastLineWidth, lastLineY);
                            }
                        }
                        
                        // 转换为 Blob
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('生成图片失败'));
                            }
                        }, 'image/png', 0.95);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    // 如果跨域加载失败，尝试使用代理或直接使用原图
                    console.warn('图片加载失败，尝试备用方案:', imageUrl);
                    
                    // 创建一个新的图片对象，尝试不同的加载方式
                    const img2 = new Image();
                    img2.crossOrigin = 'anonymous';
                    
                    // 如果是 base64 或 data URL，直接使用
                    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
                        img2.src = imageUrl;
                    } else {
                        // 尝试添加时间戳避免缓存问题
                        img2.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
                    }
                    
                    img2.onload = () => {
                        // 使用相同的绘制逻辑
                        const imageHeight = img2.height;
                        const imageWidth = img2.width;
                        const textAreaHeight = Math.floor(imageHeight / 3);
                        const canvasHeight = imageHeight + textAreaHeight;
                        const canvasWidth = imageWidth;
                        
                        const canvas = document.createElement('canvas');
                        canvas.width = canvasWidth;
                        canvas.height = canvasHeight;
                        const ctx = canvas.getContext('2d');
                        
                        ctx.drawImage(img2, 0, 0, imageWidth, imageHeight);
                        
                        const textY = imageHeight;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, textY, canvasWidth, textAreaHeight);
                        
                        const padding = 40;
                        const maxTextWidth = canvasWidth - padding * 2;
                        const fontSize = Math.max(24, Math.min(32, Math.floor(canvasWidth / 30)));
                        const lineHeight = fontSize * 1.6;
                        
                        ctx.fillStyle = '#333333';
                        ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        
                        const words = text.split('');
                        const lines = [];
                        let currentLine = '';
                        
                        for (let i = 0; i < words.length; i++) {
                            const testLine = currentLine + words[i];
                            const metrics = ctx.measureText(testLine);
                            
                            if (metrics.width > maxTextWidth && currentLine !== '') {
                                lines.push(currentLine);
                                currentLine = words[i];
                            } else {
                                currentLine = testLine;
                            }
                        }
                        if (currentLine) {
                            lines.push(currentLine);
                        }
                        
                        const maxLines = Math.floor((textAreaHeight - padding * 2) / lineHeight);
                        const displayLines = lines.slice(0, maxLines);
                        const totalTextHeight = displayLines.length * lineHeight;
                        const startY = textY + (textAreaHeight - totalTextHeight) / 2;
                        
                        displayLines.forEach((line, index) => {
                            const y = startY + index * lineHeight;
                            ctx.fillText(line, padding, y);
                        });
                        
                        if (lines.length > maxLines) {
                            const lastLine = displayLines[displayLines.length - 1];
                            const lastLineY = startY + (displayLines.length - 1) * lineHeight;
                            const lastLineWidth = ctx.measureText(lastLine).width;
                            
                            if (lastLineWidth + ctx.measureText('...').width < maxTextWidth) {
                                ctx.fillText('...', padding + lastLineWidth, lastLineY);
                            }
                        }
                        
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('生成图片失败'));
                            }
                        }, 'image/png', 0.95);
                    };
                    
                    img2.onerror = () => {
                        reject(new Error('图片加载失败，可能是跨域问题'));
                    };
                };
                
                // 开始加载图片
                if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
                    img.src = imageUrl;
                } else {
                    img.src = imageUrl;
                }
            });
        },
        
        // 从本地存储恢复数据
        loadFromLocalStorage() {
            try {
                const savedData = localStorage.getItem('aibooks_data');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    
                    // 检查数据是否过期（7天内有效）
                    const now = Date.now();
                    const dataAge = now - (data.timestamp || 0);
                    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
                    
                    if (dataAge < maxAge) {
                        // 恢复用户输入
                        if (data.form) {
                            this.form = { ...this.form, ...data.form };
                        }
                        
                        // 恢复故事数据
                        if (data.storyData) {
                            this.storyData = data.storyData;
                        }
                        
                        // 恢复编辑后的提示词
                        if (data.imagePrompts && data.imagePrompts.length > 0) {
                            this.imagePrompts = data.imagePrompts;
                        }
                        
                        // 恢复生成的绘本数据
                        if (data.bookData) {
                            this.bookData = data.bookData;
                        }
                        
                        console.log('已从本地存储恢复AI绘本数据');
                    } else {
                        // 数据已过期，清除
                        localStorage.removeItem('aibooks_data');
                        console.log('本地存储的AI绘本数据已过期，已清除');
                    }
                }
            } catch (error) {
                console.error('从本地存储恢复AI绘本数据失败:', error);
            }
        },
        
        // 保存数据到本地存储
        saveToLocalStorage() {
            try {
                const dataToSave = {
                    form: {
                        prompt: this.form.prompt,
                        artStyle: this.form.artStyle
                    },
                    storyData: this.storyData,
                    imagePrompts: this.imagePrompts,
                    bookData: this.bookData,
                    timestamp: Date.now()
                };
                
                localStorage.setItem('aibooks_data', JSON.stringify(dataToSave));
            } catch (error) {
                console.error('保存AI绘本数据到本地存储失败:', error);
                // 如果存储失败（可能是存储空间不足），尝试清除旧数据
                try {
                    localStorage.removeItem('aibooks_data');
                    const dataToSave = {
                        form: {
                            prompt: this.form.prompt,
                            readerGroup: this.form.readerGroup
                        },
                        referenceImageUrl: this.referenceImageUrl,
                        storyData: this.storyData,
                        imagePrompts: this.imagePrompts,
                        bookData: this.bookData,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('aibooks_data', JSON.stringify(dataToSave));
                } catch (e) {
                    console.error('清除旧数据后重新保存失败:', e);
                }
            }
        },
        
        // 设置自动保存（使用防抖）
        setupAutoSave() {
            const debounceSave = () => {
                if (this.autoSaveTimer) {
                    clearTimeout(this.autoSaveTimer);
                }
                this.autoSaveTimer = setTimeout(() => {
                    this.saveToLocalStorage();
                }, 2000); // 2秒后保存
            };
            
            // 监听用户输入变化
            this.$watch('form', () => {
                debounceSave();
            }, { deep: true });
            
            // 监听参考图变化
            this.$watch('referenceImageUrl', () => {
                debounceSave();
            });
            
            // 监听提示词编辑变化
            this.$watch('imagePrompts', () => {
                debounceSave();
            }, { deep: true });
            
            // 监听故事数据变化
            this.$watch('storyData', () => {
                debounceSave();
            }, { deep: true });
            
            // 监听绘本数据变化
            this.$watch('bookData', () => {
                debounceSave();
            }, { deep: true });
        }
    }
}
</script>

<style scoped>
.inspiration-book {
    min-height: calc(100vh - 50px - 40px);
    background-color: #f5f7fa;
    display: flex;
    flex-direction: column;
}

.inspiration-main {
    flex: 1;
    max-width: 90vw;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    gap: 16px;
    width: 90vw;
    box-sizing: border-box;
}

.prompt-container {
    width: 30%;
    flex-shrink: 0;
    background-color: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 90px - 48px);
    max-height: calc(100vh - 90px - 48px);
    overflow: hidden;
}

.scrollbar-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.scrollbar-container :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
    overflow-y: auto;
}

.scrollbar-container :deep(.el-scrollbar__bar) {
    right: 0;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #ebeef5;
}

.book-form {
    margin-top: 20px;
}

.prompt-input {
    width: 100%;
}

.reference-upload {
    width: 100%;
}

.reference-preview {
    margin-top: 12px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 8px;
    text-align: center;
}

.generate-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
}

.prompts-editor {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 2px solid #ebeef5;
}

.prompts-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 20px 0;
}

.prompts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
}

.prompt-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prompt-label {
    font-size: 14px;
    font-weight: 500;
    color: #606266;
}

.prompt-textarea {
    width: 100%;
}

.generate-images-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    margin-top: 8px;
}

.progress-info {
    margin-top: 24px;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 8px;
}

.progress-text {
    margin-top: 12px;
    text-align: center;
    color: #606266;
    font-size: 14px;
}

.generated-book {
    width: 70%;
    flex-shrink: 0;
    background-color: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    min-height: calc(100vh - 90px - 48px);
    max-height: calc(100vh - 90px - 48px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-direction: column;
    overflow: hidden;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #c0c4cc;
    padding: 60px 20px;
}

.empty-state i {
    font-size: 64px;
    margin-bottom: 16px;
}

.empty-state p {
    font-size: 16px;
    margin: 0;
}

.book-content {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.book-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid #ebeef5;
    gap: 20px;
}

.book-header-content {
    flex: 1;
    text-align: left;
}

.book-title {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
    margin: 0 0 12px 0;
}

.book-summary {
    font-size: 14px;
    color: #606266;
    margin: 0;
    line-height: 1.6;
}

.download-btn {
    flex-shrink: 0;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.download-btn :deep(.el-icon) {
    font-size: 16px;
}

.story-pages {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 20px;
    padding: 20px 0;
    width: 100%;
    box-sizing: border-box;
    align-items: start;
}

.story-page-card {
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    width: 100%;
    min-width: 0;
    overflow: visible;
    height: auto;
}

.story-page-card :deep(.el-card__body) {
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    height: 100%;
    min-height: 0;
    overflow: visible;
}

.story-page-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.card-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background-color: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px 8px 0 0;
    flex-shrink: 0;
}

.story-image {
    width: 100%;
    height: 100%;
}

.image-slot,
.image-loading,
.image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #909399;
    background-color: #f5f7fa;
}

.image-slot i,
.image-loading i,
.image-placeholder i {
    font-size: 48px;
    margin-bottom: 12px;
}

.image-loading i {
    animation: rotating 2s linear infinite;
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.card-content {
    padding: 16px !important;
    flex: 1;
    display: flex !important;
    flex-direction: column !important;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    visibility: visible !important;
    opacity: 1 !important;
}

.card-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px 0;
}

.scene-text {
    font-size: 14px;
    line-height: 1.6;
    color: #606266;
    margin: 0 0 16px 0;
    text-align: left;
    flex: 1;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-clamp: 3;
    -webkit-line-clamp: 3;
}

.card-actions {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
}

@media (max-width: 1200px) {
    .story-pages {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}

@media (max-width: 1024px) {
    .inspiration-main {
        flex-direction: column;
    }

    .prompt-container,
    .generated-book {
        width: 100%;
    }
}

@media (max-width: 768px) {
    .story-pages {
        grid-template-columns: 1fr !important;
    }
}

/* 风格标签容器 */
.style-tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
}

.style-tag {
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
}

.style-tag:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
