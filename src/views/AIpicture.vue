<template>
    <div class="inspiration-library">
        <!-- 头部导航栏 -->
   

        <!-- 主内容区域 -->
        <main class="library-main">
            <!-- 左侧：风格列表 -->
            <div class="style-list-container">
                 <el-scrollbar class="style-list-container-scroll">
                <h2 class="section-title">{{ $t('aiPicture.title') }}</h2>
                <div class="style-list">
                    <el-card
                        v-for="style in styles"
                        :key="style.id"
                        class="style-card"
                        :class="{ 'selected': selectedStyleId === style.id }"
                        @click="selectStyle(style.id)"
                        :body-style="{ padding: '0' }">
                        <template #header>
                            <div class="style-header">
                                <span class="style-title">{{ style.artStyle }}</span>
                            </div>
                        </template>
                        <div class="style-image-wrapper">
                            <el-image
                                :src="style.image"
                                :alt="style.artStyle"
                                fit="cover"
                                class="style-image"
                                :lazy="true">
                                <template #placeholder>
                                    <div class="image-loading">
                                        <i class="el-icon-loading"></i>
                                    </div>
                                </template>
                                <template #error>
                                    <div class="image-slot">
                                        <i class="el-icon-picture-outline"></i>
                                    </div>
                                </template>
                            </el-image>
                           
                        </div>
                    </el-card>
               
                </div>
                 </el-scrollbar>
            </div>

            <!-- 右侧：风格详情和 Prompt 生成 -->
            <div class="style-detail-container">
                <el-scrollbar class="style-list-container-scroll">
                <h2 class="section-title">{{ $t('aiPicture.generateIllustration') }}</h2>
                <div class="style-detail">
                    <div v-if="!selectedStyle" class="placeholder">
                        <i class="el-icon-mouse"></i>
                        <p>请从左侧选择一个艺术风格</p>
                    </div>

                    <div v-else class="detail-content">
                        <!-- 图片展示区域：空白框或生成结果 -->
                        <div class="image-display-area">
                            <!-- 生成进度提示 -->
                            <div v-if="generating" class="generating-progress">
                                        <i class="el-icon-loading"></i>
                                <p>{{ $t('aiPicture.generating') }}</p>
                            </div>
                            
                            <!-- 生成结果展示 -->
                            <div v-else-if="generatedImageUrl" class="generated-result">
                                <el-image
                                    :src="generatedImageUrl"
                                    fit="contain"
                                    class="result-image">
                                    <template #error>
                                        <div class="image-slot">
                                            <i class="el-icon-picture-outline"></i>
                                        </div>
                                    </template>
                                </el-image>
                                <div class="result-actions">
                                    <el-button 
                                        type="primary" 
                                        size="small"
                                        @click="collectIllustration"
                                        :loading="collecting">
                                        <i class="el-icon-star-on"></i> 收集插画
                                    </el-button>
                                    <el-button 
                                        type="success" 
                                        size="small"
                                        @click="downloadIllustration"
                                        :loading="downloading">
                                        <i class="el-icon-download"></i> 下载插画
                                    </el-button>
                                    <el-button 
                                        type="danger" 
                                        size="small"
                                        @click="clearGeneratedImage">
                                        <i class="el-icon-delete"></i> 清除
                                    </el-button>
                                </div>
                            </div>
                            
                            <!-- 空白框（未生成时显示） -->
                            <div v-else class="empty-image-box">
                                
                                <p>生成的图片将显示在这里</p>
                            </div>
                        </div>
                        
                        <div class="style-info">
                            <div class="info-item">
                                <label class="info-label">{{ $t('aiPicture.artStyle') }}</label>
                                <el-input
                                    v-model="editableArtStyle"
                                    type="textarea"
                                    :rows="1"
                                    :placeholder="$t('aiPicture.artStylePlaceholder')"
                                    class="info-input">
                                </el-input>
                            </div>
                            <div class="info-item">
                                <label class="info-label">{{ $t('aiPicture.elementDetails') }}</label>
                                <el-input
                                    v-model="editableElementDetails"
                                    type="textarea"
                                    :rows="2"
                                    :placeholder="$t('aiPicture.elementDetailsPlaceholder')"
                                    class="info-input">
                                </el-input>
                            </div>
                        </div>

                        <div class="input-section">
                            <label class="input-label">{{ $t('aiPicture.subjectScene') }}</label>
                            <el-input
                                v-model="subjectScene"
                                type="textarea"
                                :rows="3"
                                :placeholder="$t('aiPicture.subjectPlaceholder')"
                                class="subject-input">
                            </el-input>
                        </div>

                  
                        <el-button
                            type="primary"
                            class="generate-button"
                            @click="generateIllustration"
                            :loading="generating"
                            :disabled="!subjectScene || !subjectScene.trim() || generating">
                            {{ generating ? $t('aiPicture.generating') : $t('aiPicture.generate') }}
                        </el-button>
                    </div>
                </div>
                </el-scrollbar>
            </div>


        </main>
    </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { checkWebPSupport } from '@/utils/imageOptimizer'

export default {
    name: 'InspirationLibrary',
    setup() {
        const { t, locale } = useI18n()
        
        // WebP 支持检测
        const supportsWebP = ref(false)
        
        // 风格配置：包含 key、id 和对应的图片路径
        // 使用压缩后的 PNG 图片（已从 76MB 压缩到约 8MB）
        // 通过 el-image 的 lazy 属性实现懒加载
        const styleConfigs = [
            { key: 'penLineArt', id: 1, image: require('@/assets/prompt/1.webp') },
            { key: 'colorfulOutlineRomanticism', id: 6, image: require('@/assets/prompt/6.webp') },
            { key: 'crayonNoiseHandDrawn', id: 15, image: require('@/assets/prompt/15.webp') },
            { key: 'vintageSketch', id: 17, image: require('@/assets/prompt/17.webp') },
            { key: 'pixarStyle', id: 5, image: require('@/assets/prompt/5.webp') },
            { key: 'engravingLines', id: 7, image: require('@/assets/prompt/7.webp') },
            { key: 'pencilSketch3D', id: 16, image: require('@/assets/prompt/16.webp') },
            { key: 'feltCollage', id: 18, image: require('@/assets/prompt/18.webp') },
            { key: 'blackWhiteDoodle', id: 2, image: require('@/assets/prompt/2.webp') },
            { key: 'collageIllustration', id: 4, image: require('@/assets/prompt/4.webp') },
            { key: 'rusticHandDrawn', id: 8, image: require('@/assets/prompt/8.webp') },
            { key: 'maximalistCopperplate', id: 9, image: require('@/assets/prompt/9.webp') },
            { key: 'doodleSoul', id: 10, image: require('@/assets/prompt/10.webp') },
            { key: 'keithHaringDoodle', id: 11, image: require('@/assets/prompt/11.webp') },
            { key: 'abstractFlatDesign', id: 12, image: require('@/assets/prompt/12.webp') },
            { key: 'simpleCartoon', id: 13, image: require('@/assets/prompt/13.webp') },
            { key: 'healingWatercolor', id: 14, image: require('@/assets/prompt/14.webp') },
            { key: 'oilPainting', id: 19, image: require('@/assets/prompt/19.webp') }
        ]
        
        // 检测 WebP 支持
        onMounted(async () => {
            supportsWebP.value = await checkWebPSupport()
        })
        
        // 根据当前语言动态获取风格列表
        const styles = computed(() => {
            return styleConfigs.map(config => ({
                id: config.id,
                key: config.key,
                artStyle: t(`aibooks.styles.${config.key}.artStyle`),
                elementDetails: t(`aibooks.styles.${config.key}.elementDetails`),
                image: config.image
            }))
        })
        
        return {
            styles,
            locale
        }
    },
    data() {
        return {
            selectedStyleId: null,
            subjectScene: '',
            editableArtStyle: '',
            editableElementDetails: '',
            copySuccess: false,
            generating: false,
            generatedImageUrl: null,
            collecting: false,
            downloading: false,
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
        };
    },
    computed: {
        selectedStyle() {
            return this.styles.find(s => s.id === this.selectedStyleId);
        },
        generatedPrompt() {
            if (!this.subjectScene || !this.subjectScene.trim()) {
                return '';
            }
            // 组合：主体场景 + 艺术风格 + 元素细节
            const artStyle = this.editableArtStyle.trim() || (this.selectedStyle ? this.selectedStyle.artStyle : '');
            const elementDetails = this.editableElementDetails.trim() || (this.selectedStyle ? this.selectedStyle.elementDetails : '');
            let prompt = `${this.subjectScene.trim()}，${artStyle}，${elementDetails}`;
            
            // 判断用户输入是否包含人物相关关键词
            const subjectSceneStr = this.subjectScene ? String(this.subjectScene) : '';
            if (subjectSceneStr && this.isCharacterInput(subjectSceneStr)) {
                // 如果是人物，添加肢体准确性描述
                const characterAccuracy = '每个角色严格保持2只手、2只脚，肢体数量准确，解剖结构正常，肢体形态自然连贯，无重复或多余肢体。';
                prompt = `${prompt}，${characterAccuracy}`;
            }
            
            return prompt;
        },
    },
    watch: {
        // 监听 selectedStyle 变化（当语言切换时，styles 会重新计算，selectedStyle 也会更新）
        selectedStyle: {
            handler(newStyle) {
                // 如果已选择风格且风格数据更新，同步更新编辑字段
                if (newStyle && this.selectedStyleId !== null) {
                    // 只有当编辑字段与当前风格值不同时才更新（避免覆盖用户手动编辑的内容）
                    // 但如果用户没有手动编辑，则应该更新为新语言的值
                    // 这里我们总是更新，因为语言切换时应该显示新语言的内容
                    this.editableArtStyle = newStyle.artStyle;
                    this.editableElementDetails = newStyle.elementDetails;
                }
            },
            immediate: false
        }
    },
    mounted() {
        // 默认选中第一个风格
        if (this.styles.length > 0) {
            this.selectedStyleId = this.styles[0].id;
            this.editableArtStyle = this.styles[0].artStyle;
            this.editableElementDetails = this.styles[0].elementDetails;
        }
        
        // 恢复最近生成的插画
        this.restoreLatestGeneratedImage();
    },
    methods: {
        selectStyle(styleId) {
            this.selectedStyleId = styleId;
            const style = this.styles.find(s => s.id === styleId);
            if (style) {
                this.editableArtStyle = style.artStyle;
                this.editableElementDetails = style.elementDetails;
            }
            this.copySuccess = false;
        },
        async copyPrompt() {
            if (!this.generatedPrompt) {
                ElMessage.warning('请先输入主体场景');
                return;
            }

            try {
                // 使用现代 Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(this.generatedPrompt);
                } else {
                    // 降级方案：使用传统方法
                    const tempInput = document.createElement('textarea');
                    tempInput.value = this.generatedPrompt;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                }

                this.copySuccess = true;
                ElMessage.success('复制成功！');

                // 2秒后恢复按钮状态
                setTimeout(() => {
                    this.copySuccess = false;
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                ElMessage.error('复制失败，请手动复制');
            }
        },
        
        // 生成插画 - 使用与创建角色相同的API（文生图）
        async generateIllustration() {
            if (!this.generatedPrompt) {
                ElMessage.warning('请先输入主体场景');
                return;
            }
            
            // 清除之前的生成结果
            this.generatedImageUrl = null;
            this.generating = true;
            
            try {
                // 构建请求数据 - 文生图，不传图片
                const requestData = {
                    prompt: this.generatedPrompt,
                    size: '1280x960' // 图片尺寸
                };
                
                // 调用创建角色API（与CreateCharacter.vue使用相同的API）
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/create-character`
                    : '/create-character';
                
                const response = await this.$http.post(apiUrl, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    timeout: 180000 // 3分钟超时（与CreateCharacter.vue相同）
                });
                
                // 处理响应
                const responseData = response.data;
                
                // 检查成功响应：code === 0 或 desc === 'success' 或 statuscode === 'success'
                const isSuccess = (responseData.code === 0 || responseData.code === '0') 
                    || responseData.desc === 'success' 
                    || responseData.statuscode === 'success';
                
                if (isSuccess && responseData.message) {
                    const result = responseData.message;
                    
                    // 提取图片URL（与CreateCharacter.vue相同的处理方式）
                    let imageUrl = null;
                    if (result.image_url) {
                        imageUrl = result.image_url;
                    } else if (result.character_image_url) {
                        imageUrl = result.character_image_url;
                    } else if (result.image) {
                        imageUrl = result.image;
                    } else if (result.url) {
                        imageUrl = result.url;
                    }
                    
                    if (imageUrl) {
                        this.generatedImageUrl = imageUrl;
                        // 保存到 localStorage
                        this.saveGeneratedImageToLocalStorage(imageUrl);
                        ElMessage.success('插画生成成功！');
                    } else {
                        throw new Error('响应中未找到图片URL');
                    }
                } else {
                    const errorMsg = responseData.message || responseData.desc || responseData.error || '生成失败，请重试';
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error('生成插画失败:', error);
                let errorMessage = '生成失败，请重试';
                
                if (error.response) {
                    // 服务器返回了错误响应
                    const status = error.response.status;
                    const data = error.response.data;
                    
                    if (status === 401) {
                        errorMessage = '未授权，请先登录';
                    } else if (status === 403) {
                        errorMessage = '无权限访问';
                    } else if (status === 404) {
                        errorMessage = 'API接口不存在，请检查后端配置';
                    } else if (status === 400) {
                        errorMessage = data?.message || data?.error || '请求参数错误';
                    } else if (status === 500) {
                        errorMessage = '服务器错误，请稍后重试';
                    } else {
                        errorMessage = data?.message || data?.error || `请求失败 (${status})`;
                    }
                } else if (error.request) {
                    // 请求已发出但没有收到响应
                    errorMessage = '网络错误，请检查网络连接';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                ElMessage.error(errorMessage);
            } finally {
                this.generating = false;
            }
        },
        
        // 收集插画到"我的插画"
        async collectIllustration() {
            if (!this.generatedImageUrl) {
                ElMessage.warning('图片尚未生成，请稍候');
                return;
            }
            
            // 检查登录状态
            const token = localStorage.getItem('token') || '';
            if (!token) {
                ElMessage.error('请先登录');
                return;
            }
            
            this.collecting = true;
            
            try {
                // 处理URL格式
                let pictureValue = this.generatedImageUrl;
                
                // 如果是相对路径，转换为完整URL
                if (pictureValue && !pictureValue.startsWith('http://') && !pictureValue.startsWith('https://') && !pictureValue.startsWith('data:')) {
                    pictureValue = `https://static.kidstory.cc/${pictureValue}`;
                }
                
                // 构建请求数据
                const requestData = {
                    picture: pictureValue, // 支持 URL 或 base64
                    title: this.generatedPrompt || '生成的插画',
                    description: this.generatedPrompt || '从灵感库生成的插画',
                    type: 'others' // 默认类别为"其他"
                };
                
                // 发送请求到服务器
                const response = await this.$http.post('/ill/', requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                // 检查响应
                if (response.data && (response.data.desc === 'success' || response.data.code === 0 || response.data.code === '0')) {
                    ElMessage.success('插画已保存到"我的插画"');
                } else {
                    throw new Error(response.data?.message || '保存失败');
                }
            } catch (error) {
                console.error('收集插画失败:', error);
                const errorMessage = error.response?.data?.message || error.message || '保存失败，请重试';
                ElMessage.error(`收集插画失败: ${errorMessage}`);
            } finally {
                this.collecting = false;
            }
        },
        
        // 下载插画
        async downloadIllustration() {
            if (!this.generatedImageUrl) {
                ElMessage.warning('图片尚未生成，请稍候');
                return;
            }
            
            this.downloading = true;
            
            try {
                // 创建一个临时的 a 标签用于下载
                const link = document.createElement('a');
                link.href = this.generatedImageUrl;
                
                // 设置下载文件名
                const timestamp = new Date().getTime();
                const filename = `illustration_${timestamp}.jpg`;
                link.download = filename;
                
                // 如果是跨域图片，需要先转换为 blob
                if (this.generatedImageUrl.startsWith('http://') || this.generatedImageUrl.startsWith('https://')) {
                    try {
                        const response = await fetch(this.generatedImageUrl);
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        link.href = blobUrl;
                        
                        // 触发下载
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // 清理 blob URL
                        setTimeout(() => {
                            window.URL.revokeObjectURL(blobUrl);
                        }, 100);
                        
                        ElMessage.success('插画下载成功');
                    } catch (fetchError) {
                        console.error('下载图片失败:', fetchError);
                        // 如果 fetch 失败，尝试直接打开链接
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        ElMessage.info('已在新窗口打开图片，请右键保存');
                    }
                } else {
                    // 本地图片或 base64 图片，直接下载
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    ElMessage.success('插画下载成功');
                }
            } catch (error) {
                console.error('下载插画失败:', error);
                ElMessage.error('下载失败，请重试');
            } finally {
                this.downloading = false;
            }
        },
        
        // 保存生成的插画到 localStorage（只保存最新的一张，覆盖之前的）
        saveGeneratedImageToLocalStorage(imageUrl) {
            try {
                const imageData = {
                    url: imageUrl,
                    prompt: this.generatedPrompt || '',
                    artStyle: this.selectedStyle?.artStyle || '',
                    timestamp: Date.now()
                };
                
                // 直接保存最新的一张插画，覆盖之前的
                localStorage.setItem('home_generated_image', JSON.stringify(imageData));
                console.log('插画已保存到 localStorage');
            } catch (error) {
                console.error('保存插画到 localStorage 失败:', error);
                // 如果存储失败（可能是存储空间不足），尝试清除旧数据
                try {
                    localStorage.removeItem('home_generated_image');
                    const imageData = {
                        url: imageUrl,
                        prompt: this.generatedPrompt || '',
                        artStyle: this.selectedStyle?.artStyle || '',
                        timestamp: Date.now()
                    };
                    localStorage.setItem('home_generated_image', JSON.stringify(imageData));
                } catch (e) {
                    console.error('清除旧数据后重新保存失败:', e);
                }
            }
        },
        
        // 恢复最近生成的插画
        restoreLatestGeneratedImage() {
            try {
                const saved = localStorage.getItem('home_generated_image');
                if (saved) {
                    const imageData = JSON.parse(saved);
                    if (imageData && imageData.url) {
                        this.generatedImageUrl = imageData.url;
                        console.log('已恢复最近生成的插画');
                    }
                }
            } catch (error) {
                console.error('恢复插画失败:', error);
            }
        },
        
        // 清除生成的插画（删除 localStorage 中的数据并清空显示）
        clearGeneratedImage() {
            try {
                // 删除 localStorage 中的数据
                localStorage.removeItem('home_generated_image');
                // 清空当前显示的图片
                this.generatedImageUrl = null;
                ElMessage.success('已清除插画数据');
                console.log('已清除插画数据');
            } catch (error) {
                console.error('清除插画数据失败:', error);
                ElMessage.error('清除失败，请重试');
            }
        },
        
        // 判断输入内容是否包含人物相关关键词
        isCharacterInput(input) {
            // 检查输入是否为字符串类型
            if (!input || typeof input !== 'string') {
                return false;
            }
            
            const trimmed = input.trim();
            if (!trimmed) {
                return false;
            }
            
            const text = trimmed.toLowerCase();
            
            // 人物相关关键词列表
            const characterKeywords = [
                '人', '人物', '角色', '角色', '角色',
                '男孩', '女孩', '男人', '女人', '小孩', '儿童', '孩子', '小朋友',
                '小动物', '小精灵', '小公主', '王子', '魔法师', '骑士',
                '老人', '老人', '老年', '青年', '少年', '少女',
                'baby', 'child', 'children', 'boy', 'girl', 'man', 'woman', 'person', 'people', 'character',
                'kid', 'kids', 'adult', 'elderly', 'teenager', 'teen'
            ];
            
            // 检查是否包含人物关键词
            return characterKeywords.some(keyword => text.includes(keyword));
        },
        
        // 压缩图片
        compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8, maxSizeKB = 500) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        // 计算新尺寸
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > maxWidth || height > maxHeight) {
                            if (width > height) {
                                height = (height * maxWidth) / width;
                                width = maxWidth;
                            } else {
                                width = (width * maxHeight) / height;
                                height = maxHeight;
                            }
                        }
                        
                        // 创建canvas进行压缩
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // 转换为blob，并检查大小
                        canvas.toBlob((blob) => {
                            const sizeKB = blob.size / 1024;
                            if (sizeKB <= maxSizeKB) {
                                // 如果已经小于限制，直接返回
                                resolve(blob);
                            } else {
                                // 如果还是太大，降低质量继续压缩
                                let currentQuality = quality;
                                const compressRecursive = () => {
                                    canvas.toBlob((compressedBlob) => {
                                        const compressedSizeKB = compressedBlob.size / 1024;
                                        if (compressedSizeKB <= maxSizeKB || currentQuality <= 0.1) {
                                            resolve(compressedBlob);
                                        } else {
                                            currentQuality -= 0.1;
                                            compressRecursive();
                                        }
                                    }, 'image/jpeg', currentQuality);
                                };
                                compressRecursive();
                            }
                        }, 'image/jpeg', quality);
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        
        // 将图片URL转换为Base64（带压缩）
        async imageUrlToBase64(imageUrl, compress = true) {
            try {
                // 如果是require导入的模块，需要先获取其default或直接使用
                let url = imageUrl;
                if (typeof imageUrl === 'object' && imageUrl.default) {
                    url = imageUrl.default;
                }
                
                // 如果已经是base64格式，直接返回
                if (typeof url === 'string' && url.startsWith('data:')) {
                    return url;
                }
                
                const response = await fetch(url);
                const blob = await response.blob();
                
                // 如果需要压缩
                if (compress && blob.type && blob.type.startsWith('image/')) {
                    const file = new File([blob], 'image.jpg', { type: blob.type });
                    const compressedBlob = await this.compressImage(file);
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result); // 结果已经是 data:image/xxx;base64, 格式
                        reader.onerror = reject;
                        reader.readAsDataURL(compressedBlob);
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result); // 结果已经是 data:image/xxx;base64, 格式
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (error) {
                console.error('转换图片URL为Base64失败:', error);
                console.error('图片URL:', imageUrl);
                throw new Error('转换参考图为Base64失败: ' + error.message);
            }
        },
    },
};
</script>

<style scoped>
.inspiration-library {
    min-height: calc(100vh - 50px - 40px);
    background-color: #f5f7fa;
    display: flex;
    flex-direction: column;
}






/* 主内容区域 */
.library-main {
    flex: 1;
    max-width: 80vw;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
}

/* 风格列表容器 */
.style-list-container {
    width: 50%;
    flex-shrink: 0;
    background-color: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 50px - 40px - 80px);
    
}
.style-list-container-scroll{
    height: calc(100vh - 50px - 40px - 80px);
}
.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #ebeef5;
    flex-shrink: 0;
}

.style-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 4px;
    align-content: start;
    max-height: 100%;
}

.style-card {
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-width: 320px;
}

.style-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-2px);
}

.style-card.selected {
    border-color: #409eff !important;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2) !important;
}

.style-header {
    text-align: center;
    padding: 0;
}

.style-card :deep(.el-card__header) {
    padding: 12px 8px;
    border-bottom: 1px solid #ebeef5;
}

.style-card :deep(.el-card__body) {
    padding: 0;
}

.style-image-wrapper {
    position: relative;
    width: 100%;
    height: 240px;
    overflow: hidden;
    background-color: #f5f7fa;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.style-image {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
}

.style-image :deep(.el-image) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.style-image :deep(.el-image__inner) {
    width: auto;
    height: 100%;
    max-width: 100%;
    object-fit: contain;
    aspect-ratio: 4 / 3;
}

.image-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: #f5f7fa;
    color: #909399;
}

.image-loading i {
    font-size: 24px;
    animation: rotating 2s linear infinite;
}

@keyframes rotating {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: #f5f7fa;
    color: #c0c4cc;
    font-size: 24px;
}





.style-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    display: block;
}

.empty-state {
    text-align: center;
    color: #909399;
    padding: 40px 20px;
}

/* 风格详情容器 */
.style-detail-container {
    width: 50%;
    flex-shrink: 0;
    background-color: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    min-height: calc(100vh - 72px - 50px - 48px - 64px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.style-detail {
    flex: 1;
    overflow-y: auto;
}

.placeholder {
    text-align: center;
    color: #c0c4cc;
    padding: 60px 20px;
}

.placeholder i {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.image-display-area {
    width: 100%;
    height: 400px;
    background-color: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.empty-image-box {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
    gap: 12px;
}

.empty-image-box i {
    font-size: 48px;
    color: #c0c4cc;
}

.empty-image-box p {
    margin: 0;
    font-size: 14px;
    color: #909399;
}

.generating-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #909399;
    width: 100%;
    flex: 1;
}

.generating-progress i {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
    display: block;
    animation: rotating 2s linear infinite;
}

.generating-progress p {
    margin: 0;
    text-align: center;
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.style-info {
    background-color: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
}

.info-item {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    min-width: 80px;
    flex-shrink: 0;
}

.info-value {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    flex: 1;
}

.info-input {
    flex: 1;
}

.info-input :deep(.el-textarea__inner) {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
}

.input-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.input-label {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
}

.subject-input {
    width: 100%;
}

.prompt-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prompt-label {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
}

.prompt-textarea {
    width: 100%;
}

.prompt-textarea :deep(.el-textarea__inner) {
    background-color: #f5f7fa;
    color: #303133;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
}

.copy-button,
.generate-button {
    width: 100%;
    margin: 8px auto 0;
    
}

.generated-result {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    gap: 16px;
}

.result-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
}

.result-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px 0;
}

.result-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 8px;
    overflow: hidden;
}

.result-image :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .library-main {
        flex-direction: column;
    }

    .style-list {
        grid-template-columns: repeat(2, 1fr);
    }

    .style-list-container,
    .style-detail-container {
        width: 100%;
        height: 400px;
    }
}

@media (max-width: 768px) {
    .style-list {
        grid-template-columns: 1fr;
    }
}

/* 滚动条样式 */
.style-list::-webkit-scrollbar,
.style-detail::-webkit-scrollbar {
    width: 6px;
}

.style-list::-webkit-scrollbar-track,
.style-detail::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.style-list::-webkit-scrollbar-thumb,
.style-detail::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.style-list::-webkit-scrollbar-thumb:hover,
.style-detail::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>


