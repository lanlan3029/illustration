<template>
    <div class="inspiration-library">
        <!-- 头部导航栏 -->
   

        <!-- 主内容区域 -->
        <main class="library-main">
            <!-- 左侧：风格列表 -->
            <div class="style-list-container">
                 <el-scrollbar class="style-list-container-scroll">
                <h2 class="section-title">艺术风格列表</h2>
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
                                class="style-image">
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
                <h2 class="section-title">生成插画</h2>
                <div class="style-detail">
                    <div v-if="!selectedStyle" class="placeholder">
                        <i class="el-icon-mouse"></i>
                        <p>请从左侧选择一个艺术风格</p>
                    </div>

                    <div v-else class="detail-content">
                        <!-- 风格示意图预览 - 生成时隐藏 -->
                        <div v-if="!generating && !generatedImageUrl" class="style-preview">
                            <el-image
                                :src="selectedStyle.image"
                                :alt="selectedStyle.artStyle"
                                fit="contain"
                                class="preview-image">
                                <template #error>
                                    <div class="image-slot">
                                        <i class="el-icon-picture-outline"></i>
                                    </div>
                                </template>
                            </el-image>
                        </div>
                        
                        <!-- 生成进度提示 -->
                        <div v-if="generating" class="generating-progress">
                            <div class="progress-container">
                                <el-progress
                                    :percentage="100"
                                    status="active"
                                    :stroke-width="12"
                                    class="progress-bar">
                                </el-progress>
                                <p class="progress-text">
                                    <i class="el-icon-loading"></i>
                                    正在生成插画，请稍候...
                                </p>
                            </div>
                        </div>
                        
                        <!-- 生成结果展示 - 显示在进度条位置 -->
                        <div v-if="generatedImageUrl && !generating" class="generated-result">
                            <h3 class="result-title">生成结果</h3>
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
                        </div>
                        
                        <div class="style-info">
                            <div class="info-item">
                                <label class="info-label">艺术风格：</label>
                                <el-input
                                    v-model="editableArtStyle"
                                    type="textarea"
                                    :rows="1"
                                    placeholder="请输入艺术风格"
                                    class="info-input">
                                </el-input>
                            </div>
                            <div class="info-item">
                                <label class="info-label">元素细节：</label>
                                <el-input
                                    v-model="editableElementDetails"
                                    type="textarea"
                                    :rows="2"
                                    placeholder="请输入元素细节"
                                    class="info-input">
                                </el-input>
                            </div>
                        </div>

                        <div class="input-section">
                            <label class="input-label">主体场景（请输入您想要生成的内容）：</label>
                            <el-input
                                v-model="subjectScene"
                                type="textarea"
                                :rows="2"
                                placeholder="例如：戴着探险帽的小狐狸，坐在一个红色斑点蘑菇上，手里拿着一个精致的提灯"
                                class="subject-input">
                            </el-input>
                        </div>

                  
                        <el-button
                            type="primary"
                            class="generate-button"
                            @click="generateIllustration"
                            :loading="generating"
                            :disabled="!subjectScene || !subjectScene.trim() || generating">
                            {{ generating ? '生成中...' : '生成' }}
                        </el-button>
                    </div>
                </div>
                </el-scrollbar>
            </div>


        </main>
    </div>
</template>

<script>
import { getCurrentInstance } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
    name: 'InspirationLibrary',
    setup() {
        const { proxy } = getCurrentInstance()
        return {
            $http: proxy?.$http || axios,
            $message: proxy?.$message || ElMessage
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
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
            styles: [
                {
                    id: 1,
                    artStyle: '钢笔线稿插画',
                    elementDetails: '细节丰富，黑白线条，饱满构图，明亮的光线。',
                    image: require('@/assets/prompt/1.png'),
                },
                {
                    id: 6,
                    artStyle: '彩色轮廓浪漫主义',
                    elementDetails: '彩色轮廓插图，无拘无束的氛围，生动的色彩和宽松的笔触，嬉戏和无忧无虑的场景。',
                    image: require('@/assets/prompt/6.png'),
                },
                {
                    id: 15,
                    artStyle: '蜡笔噪点手绘',
                    elementDetails: '采用蜡笔笔触风格，粗糙颗粒质感与不规则边缘，简约手绘感。暖柔色调为基础，画面添加噪点效果，以颗粒密度替代渐变。',
                    image: require('@/assets/prompt/15.png'),
                },
                {
                    id: 17,
                    artStyle: '复古绘本草图',
                    elementDetails: '手绘彩色草图，粗略的线条，粗重质感笔触，米黄色暖调背景，复古儿童读物风格。',
                    image: require('@/assets/prompt/17.png'),
                },
                {
                    id: 5,
                    artStyle: '皮克斯风格动画',
                    elementDetails: '高质量3D渲染，柔和的材质，影棚效果，生动的表情和动作。',
                    image: require('@/assets/prompt/5.png'),
                },
              
                {
                    id: 7,
                    artStyle: '凹版印刷线条',
                    elementDetails: '彩色图片，精致的线条，0.01毫米线条，以点线表现明暗关系，大师级排线，细致的细节，高清画质。',
                    image: require('@/assets/prompt/7.png'),
                },
                {
                    id: 16,
                    artStyle: '铅笔素描3D图',
                    elementDetails: '手绘铅笔素描风格，3D 设计图视角，主体居中构图。',
                    image: require('@/assets/prompt/16.png'),
                },
               
                {
                    id: 18,
                    artStyle: '薄片毛毡拼贴画',
                    elementDetails: '手工质感，色彩鲜艳，带有波点、条纹等装饰性图案，黄色带白色波点的背景，材质呈现毛毡的纹理与厚度，角色造型卡通夸张。',
                    image: require('@/assets/prompt/18.png'),
                },
                {
                    id: 2,
                    artStyle: '黑白涂鸦风',
                    elementDetails: '一张密集的涂鸦插画，充满各种卡通风格的黑色线条绘制的图像。这些元素以随机和重复的方式排列，营造出一种混乱但充满活力的氛围。 角色具有简单的线条，圆润的轮廓和各种表情，展现出天真和幽默感。 构图是紧凑的，没有明显的留白。 整个图像只有黑白两色，对比鲜明，线条粗细一致，风格统一。 照明均匀，没有阴影，呈现出一种平面的视觉效果。 整体风格是卡通、涂鸦，带有童趣和创意。 营造出一种随意而又充满想象力的感觉。',
                    image: require('@/assets/prompt/2.png'),
                },
        
                {
                    id: 4,
                    artStyle: '拼贴风格插画',
                    elementDetails: '纸张拼贴画风格，通过使用清晰的形状和色块来展现平面的透视感和纹理。整体氛围欢快愉悦，色彩明亮，风格活泼俏皮。',
                    image: require('@/assets/prompt/4.png'),
                },
              
                {
                    id: 8,
                    artStyle: '质朴手绘风格',
                    elementDetails: '背景白色，极简，九宫格，灵魂画手，手绘线稿，涂鸦风格，普鲁士蓝色线勾勒，小女孩，趣味，绘本风，雷蒙德·布里格斯（Raymond Briggs）和马蒂亚斯·阿道夫松（Mattias Adolfsson）风格的插画，彩铅与水彩混合创作，手稿，大师杰作。',
                    image: require('@/assets/prompt/8.png'),
                },
                {
                    id: 9,
                    artStyle: '极繁铜版印刷',
                    elementDetails: '铜版画风格，满画幅，极繁主义，黑色粗线条勾线清晰，高饱和色，高对比度，以蓝色为主色调营造宁静氛围，搭配橙色、白色，纹理细腻，层次丰富，塑造优雅自然的画面。借精致笔触与色彩层次，营造宁静清新、诗意浪漫的氛围，展现浪漫美好与艺术价值，让观者沉浸于宁静美好视觉体验 ，极繁主义，丰富的细节、装饰图案、层次感，空间感，呈现出一种神圣感，令人震撼的画面画面，高清，高细节。',
                    image: require('@/assets/prompt/9.png'),
                },
                {
                    id: 10,
                    artStyle: '绘本涂鸦/灵魂画手',
                    elementDetails: '背景白色，极简，九宫格布局，手绘线稿，涂鸦风格，普鲁士蓝色线勾勒，彩铅与水彩混合创作，手稿质感，趣味，雷蒙德·布里格斯风格。',
                    image: require('@/assets/prompt/10.png'),
                },
                {
                    id: 11,
                    artStyle: 'Keith Haring 涂鸦',
                    elementDetails: '粗线条记号笔插图，黑白配色，白色背景，装饰性涂鸦图案。',
                    image: require('@/assets/prompt/11.png'),
                },
                {
                    id: 12,
                    artStyle: '抽象平面设计',
                    elementDetails: '风格化的形状，色彩鲜艳，卡通般的视觉效果，柔和的米色天空，光线均匀分布，平静温馨的氛围，简约风格。',
                    image: require('@/assets/prompt/12.png'),
                },
                {
                    id: 13,
                    artStyle: '简洁卡通插画',
                    elementDetails: '简洁明快，色彩柔和，纯白色背景，物体/角色拥有圆润的身形和短小的四肢。',
                    image: require('@/assets/prompt/13.png'),
                },
                {
                    id: 14,
                    artStyle: '治愈系水彩',
                    elementDetails: '水彩质感，清新柔和的色调，营造平静、治愈的氛围。',
                    image: require('@/assets/prompt/14.png'),
                },
                {
                    id: 19,
                    artStyle: '油画风格',
                    elementDetails: '浓厚笔触的油画风格，童趣绘本，炫彩光影，清晰的笔触，复杂的画面，极致的细节，超高清，32k。',
                    image: require('@/assets/prompt/19.png'),
                },


               
              

            ],
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
            return `${this.subjectScene.trim()}，${artStyle}，${elementDetails}`;
        },
    },
    mounted() {
        // 默认选中第一个风格
        if (this.styles.length > 0) {
            this.selectedStyleId = this.styles[0].id;
            this.editableArtStyle = this.styles[0].artStyle;
            this.editableElementDetails = this.styles[0].elementDetails;
        }
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
    max-width: 1400px;
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
    min-height: calc(100vh - 72px - 50px - 48px - 64px);
    
}
.style-list-container-scroll{
    height: calc(100vh - 72px - 50px - 48px - 64px);
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
    word-break: break-word;
    overflow-wrap: break-word;
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

.style-preview {
    width: 100%;
    background-color: #f5f7fa;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ebeef5;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-image {
    width: 100%;
    max-height: 300px;
}

.preview-image :deep(.el-image__inner) {
    width: 100%;
    height: auto;
    max-height: 300px;
    object-fit: contain;
}

.generating-progress {
    width: 100%;
    background-color: #f5f7fa;
    border-radius: 8px;
    padding: 40px 20px;
    border: 1px solid #ebeef5;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-container {
    width: 100%;
    max-width: 400px;
}

.progress-bar {
    margin-bottom: 20px;
}

.progress-text {
    text-align: center;
    color: #606266;
    font-size: 14px;
    margin: 0;
}

.progress-text i {
    margin-right: 8px;
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
    margin-top: 20px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #ebeef5;
}

.result-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px 0;
}

.result-image {
    width: 100%;
    max-height: 500px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
}

.result-image :deep(.el-image__inner) {
    width: 100%;
    height: auto;
    max-height: 500px;
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


