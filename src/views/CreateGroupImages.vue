<template>
    <div class="container">
        <div class="main-layout">
            <!-- 左侧：参考图和prompt输入 -->
            <div class="left-panel">
                <el-card class="panel-card" shadow="hover">
                    <div slot="header" class="card-header">
                        <span>创作组图</span>
                    </div>
                    <div class="panel-content-wrapper">
                    <div class="panel-content">
                        <!-- 参考图上传/导入 -->
                        <div class="reference-section">
                         
                            
                            <!-- 如果还没有参考图，显示上传和导入选项 -->
                            <div v-if="!referenceImageUrl" class="reference-upload">
                                <!-- 上传图片 -->
                                <el-upload
                                    ref="reference-upload"
                                    class="upload-demo"
                                    drag
                                    :action="uploadAction"
                                    :file-list="referenceFileList"
                                    :show-file-list="false"
                                    :auto-upload="false"
                                    :on-change="handleReferenceChange"
                                    :on-remove="handleReferenceRemove"
                                    :limit="1"
                                    accept="image/jpeg,image/jpg,image/png">
                                    <i class="el-icon-upload"></i>
                                    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                                    <template #tip>
                                        <div class="el-upload__tip">
                                            支持 JPG、PNG 格式，建议大小不超过 5MB
                                        </div>
                                    </template>
                                </el-upload>
                                
                                <!-- 从我的角色页面导入 -->
                                <div class="import-section">
                                    <el-button 
                                        type="primary" 
                                        plain
                                            @click="goToMyCharacters">
                                           从我的角色页面导入
                                    </el-button>
                                    <div v-if="!hasCharacterImage" class="import-tip">
                                        还没有角色，快去创作吧！
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 如果已有参考图，显示预览和操作 -->
                            <div v-else class="reference-preview">
                                <el-image 
                                    :src="referenceImageUrl" 
                                    fit="contain"
                                    class="reference-image"
                                    :preview-src-list="[referenceImageUrl]"
                                    @error="handleImageLoadError">
                                    <div slot="error" class="image-slot">
                                        <i class="el-icon-picture-outline"></i>
                                    </div>
                                </el-image>
                                <div class="reference-actions">
                                    <el-button 
                                        size="small" 
                                        @click="handleReferenceRemove">
                                        <i class="el-icon-delete"></i> 删除
                                    </el-button>
                                </div>
                            </div>
                        </div>

                        <!-- Prompt输入框 -->
                        <div class="prompt-section">
                            
                            <div class="prompt-inputs">
                                <el-input
                                    v-for="(prompt, index) in prompts"
                                    :key="index"
                                    v-model="prompts[index]"
                                    type="textarea"
                                    :rows="3"
                                    :placeholder="`请描述第 ${index + 1} 页的画面内容`"
                                    class="prompt-input"
                                    maxlength="500"
                                    show-word-limit>
                                </el-input>
                                </div>
                            </div>
                        </div>

                        <!-- 提交按钮 - 固定在底部 -->
                        <div class="submit-section">
                            <el-button 
                                type="primary" 
                                size="large"
                                @click="handleSubmit"
                                :loading="processing"
                                :disabled="!canSubmit">
                                <i class="el-icon-magic-stick"></i> 开始生成
                            </el-button>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 右侧：生成结果展示 -->
            <div class="right-panel">
                <el-card class="result-card" shadow="hover">
                    <div slot="header" class="card-header">
                        <span>生成结果</span>
                    </div>
                    <div class="result-content">
                        <div v-if="!resultImages.length && !processing" class="result-placeholder">
                            <i class="el-icon-picture-outline"></i>
                            <p>生成的组图将显示在这里</p>
                        </div>
                        <div v-if="processing" class="result-loading">
                            <i class="el-icon-loading"></i>
                            <p>正在生成中，请稍候...</p>
                        </div>
                        <el-scrollbar v-if="resultImages.length > 0 && !processing" class="result-scrollbar">
                            <div class="result-images">
                                <el-card 
                                v-for="(image, index) in resultImages" 
                                :key="index"
                                    class="content-card"
                                    shadow="hover">
                                    <div class="card-image">
                                <el-image 
                                    :src="image" 
                                            fit="cover"
                                            class="cover-image"
                                    :preview-src-list="resultImages">
                                            <div slot="error" class="image-slot">
                                                <i class="el-icon-picture-outline"></i>
                                            </div>
                                </el-image>
                            </div>
                                    <div class="card-content">
                                        <h3 class="card-title"> 第 {{ index + 1 }} 张</h3>
                                        <div class="card-actions">
                                            <el-button 
                                                v-if="!collectedImages.includes(index)"
                                                type="primary" 
                                                size="small" 
                                                @click="collectIllustration(image, index)">
                                                收集插画
                                            </el-button>
                                            <span v-else class="collected-text">已添加到我的插画</span>
                        </div>
                    </div>
                </el-card>
            </div>
                        </el-scrollbar>
                    </div>
                </el-card>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CreateGroupImages',
    data() {
        return {
            // 参考图相关
            referenceImageUrl: null,
            referenceFile: null,
            referenceFileList: [],
            uploadAction: '#', // 不需要实际上传，只是用于组件
            
            // 10个prompt输入框
            prompts: Array(10).fill(''),
            
            // 处理状态
            processing: false,
            
            // 生成结果
            resultImages: [],
            
            // 已收集的图片索引（用于跟踪哪些图片已经保存）
            collectedImages: [],
            
            // API配置
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
        };
    },
    computed: {
        canSubmit() {
            // 至少有一个参考图和一个prompt
            return this.referenceImageUrl && this.prompts.some(p => p && p.trim());
        },
        hasCharacterImage() {
            // 检查localStorage中是否有创作角色的图片
            const characterImage = localStorage.getItem('characterImage');
            console.log('检查是否有角色图片:', characterImage ? '存在' : '不存在');
            return !!characterImage;
        }
    },
    mounted() {
        // 页面加载时检查是否有创作角色的图片，如果有则自动导入
        this.checkCharacterImage();
        
        // 检查是否从"我的角色"页面跳转过来，如果是则自动加载角色信息
        this.loadCharacterFromMyCharacters();
        
        // 从localStorage恢复生成的组图数据
        this.loadGroupImagesFromLocalStorage();
    },
    methods: {
        // 检查创作角色页面的图片，如果有则自动导入
        checkCharacterImage() {
            const characterImage = localStorage.getItem('characterImage');
            if (characterImage && !this.referenceImageUrl) {
                // 自动导入创作角色的图片
                // characterImage 可能是 base64 格式（data:image/...）或外部URL
                console.log('从localStorage导入的图片格式:', characterImage.startsWith('data:') ? 'Base64' : 'URL', characterImage.substring(0, 50) + '...');
                this.$set(this, 'referenceImageUrl', characterImage);
                this.referenceFile = null; // 导入的图片没有文件对象
            }
        },
        
        // 跳转到"我的角色"页面
        goToMyCharacters() {
            this.$router.push('/user');
        },
        
        // 从"我的角色"页面加载角色信息
        loadCharacterFromMyCharacters() {
            // 检查是否有从"我的角色"页面传递过来的角色信息
            const characterDataStr = localStorage.getItem('selectedCharacterForGroupImages');
            
            if (characterDataStr) {
                try {
                    const characterData = JSON.parse(characterDataStr);
                    
                    // 清除标记，避免重复加载
                    localStorage.removeItem('selectedCharacterForGroupImages');
                    
                    // 加载角色图片
                    if (characterData.image_url) {
                        let imageUrl = characterData.image_url;
                        // 如果是相对路径，转换为完整URL
                        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
                            imageUrl = `https://static.kidstory.cc/${imageUrl}`;
                        }
                        
                        this.$set(this, 'referenceImageUrl', imageUrl);
                        this.referenceFile = null;
                        
                        // 保存角色ID，用于后续保存组图
                        if (characterData.id) {
                            localStorage.setItem('lastCharacterId', String(characterData.id));
                        }
                        
                      
                    }
                } catch (error) {
                    console.error('解析角色信息失败:', error);
                }
            }
        },
        
        // 保存生成的组图到localStorage
        saveGroupImagesToLocalStorage(images) {
            try {
                if (images && images.length > 0) {
                    localStorage.setItem('groupImages', JSON.stringify(images));
                    console.log('组图已保存到localStorage，共', images.length, '张');
                }
            } catch (error) {
                console.error('保存组图到localStorage失败:', error);
            }
        },
        
        // 从localStorage恢复生成的组图
        loadGroupImagesFromLocalStorage() {
            try {
                const savedImages = localStorage.getItem('groupImages');
                if (savedImages) {
                    const images = JSON.parse(savedImages);
                    if (Array.isArray(images) && images.length > 0) {
                        this.resultImages = images;
                        console.log('从localStorage恢复组图，共', images.length, '张');
                    }
                }
            } catch (error) {
                console.error('从localStorage恢复组图失败:', error);
            }
        },
        
        // 从创作角色页面导入图片
        importFromCreateCharacter() {
            const characterImage = localStorage.getItem('characterImage');
            console.log('尝试导入角色图片，localStorage中的characterImage:', characterImage ? '存在' : '不存在');
            
            if (characterImage) {
                // 使用 Vue.set 确保响应式更新
                this.$set(this, 'referenceImageUrl', characterImage);
                this.referenceFile = null; // 导入的图片没有文件对象
                
                // 等待下一个 tick 确保视图更新
                this.$nextTick(() => {
                    console.log('导入后的 referenceImageUrl:', this.referenceImageUrl ? '已设置' : '未设置');
                    console.log('导入的图片格式:', characterImage.startsWith('data:') ? 'Base64' : 'URL');
                    console.log('导入的图片预览:', characterImage.substring(0, 100) + '...');
                    this.$message.success('已成功导入角色图片');
                });
            } else {
                this.$message.warning('未找到角色图片，请先在创作角色页面点击"创作插画"或"创作组图"按钮');
                console.warn('localStorage中没有characterImage，请检查是否已生成角色并保存');
            }
        },
        
        // 处理参考图上传
        handleReferenceChange(file, fileList) {
            const isImage = file.raw.type.startsWith('image/');
            const isLt5M = file.raw.size / 1024 / 1024 < 5;
            
            if (!isImage) {
                this.handleReferenceRemove();
                return;
            }
            
            if (!isLt5M) {
                this.handleReferenceRemove();
                return;
            }
            
            this.referenceFile = file.raw;
            this.referenceFileList = fileList;
            
            // 生成预览URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.referenceImageUrl = e.target.result;
            };
            reader.onerror = () => {
                // 读取图片失败
            };
            reader.readAsDataURL(file.raw);
        },
        
        // 删除参考图
        handleReferenceRemove() {
            this.referenceFile = null;
            this.referenceFileList = [];
            this.referenceImageUrl = null;
            if (this.$refs['reference-upload']) {
                this.$refs['reference-upload'].clearFiles();
            }
        },
        
        // 处理图片加载错误
        handleImageLoadError() {
            // 图片加载失败时，直接删除参考图并显示上传框
            this.handleReferenceRemove();
        },
        
        // 提交生成
        async handleSubmit() {
            if (!this.canSubmit) {
                return;
            }
            
            this.processing = true;
            this.resultImages = [];
            this.collectedImages = []; // 清空已收集状态
            
            try {
                // 过滤掉空的prompt，并在每个prompt前拼接前缀
                const prefix = '填充简约背景，卡通风格，温馨可爱，大师级作品，人物不要出现畸形，同时将人物做如下修改，';
                const validPrompts = this.prompts
                    .filter(p => p && p.trim())
                    .map(p => `${prefix}，${p.trim()}`);
                
                // 将参考图转换为Base64（带压缩）
                let referenceImageBase64 = null;
                
                if (this.referenceImageUrl) {
                    if (this.referenceImageUrl.startsWith('data:')) {
                        // 已经是base64格式（从localStorage导入的通常是这种格式），需要压缩
                        // 先转换为blob再压缩
                        const response = await fetch(this.referenceImageUrl);
                        const blob = await response.blob();
                        const file = new File([blob], 'image.jpg', { type: blob.type });
                        
                        const compressedBlob = await this.compressImage(file);
                        const reader = new FileReader();
                        referenceImageBase64 = await new Promise((resolve, reject) => {
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(compressedBlob);
                        });
                    } else if (this.referenceFile) {
                        // 上传的文件，转换为base64（带压缩）
                        referenceImageBase64 = await this.fileToBase64(this.referenceFile, true);
                    } else {
                        // 从URL获取的图片（可能是外部URL），需要转换为base64（带压缩）
                        referenceImageBase64 = await this.imageUrlToBase64(this.referenceImageUrl, true);
                    }
                }
                
                // 构建请求数据
                const requestData = {
                    prompts: validPrompts,
                    size: '1280x960', // 固定使用 1280x960 尺寸
                    reference_image: referenceImageBase64, // base64格式的参考图
                };
                
                // 不再使用参考图的原始尺寸，始终使用固定的 1280x960
                
                // 调用API（这里需要根据实际后端API调整）
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/create-group-images`
                    : '/create-group-images';
                
                const response = await this.$http.post(apiUrl, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    timeout: 300000 // 5分钟超时
                });
                
                // 处理响应
                const responseData = response.data;
                
                if (responseData.code === 0 || responseData.desc === 'success') {
                    const result = responseData.message || responseData.data || responseData;
                    
                    // 提取图片URL数组
                    if (result.images && Array.isArray(result.images)) {
                        this.resultImages = result.images;
                    } else if (result.image_urls && Array.isArray(result.image_urls)) {
                        this.resultImages = result.image_urls;
                    }
                    
                    // 保存生成的组图到localStorage
                    this.saveGroupImagesToLocalStorage(this.resultImages);
                } else {
                    const errorMsg = responseData.message || responseData.desc || '生成失败，请重试';
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error('生成组图失败:', error);
            } finally {
                this.processing = false;
            }
        },
        
        // 获取图片尺寸（从URL或Base64）
        getImageSize(imageUrl) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        width: img.width,
                        height: img.height
                    });
                };
                img.onerror = () => {
                    // 图片加载失败时，清除参考图并显示上传框
                    this.handleReferenceRemove();
                  
                    reject(new Error('无法获取图片尺寸'));
                };
                img.src = imageUrl;
            });
        },
        
        // 从文件获取图片尺寸
        getImageSizeFromFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            width: img.width,
                            height: img.height
                        });
                    };
                    img.onerror = () => {
                        // 图片加载失败时，清除参考图并显示上传框
                        this.handleReferenceRemove();
                       
                        reject(new Error('无法获取图片尺寸'));
                    };
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    // 文件读取失败时，清除参考图并显示上传框
                    this.handleReferenceRemove();
                   
                    reject(new Error('读取文件失败'));
                };
                reader.readAsDataURL(file);
            });
        },
        
        // 压缩图片
        compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.7, maxSizeKB = 800) {
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
                    img.onerror = () => {
                        // 图片加载失败时，清除参考图并显示上传框
                        this.handleReferenceRemove();
                      
                        reject(new Error('图片加载失败'));
                    };
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    // 文件读取失败时，清除参考图并显示上传框
                    this.handleReferenceRemove();
                  
                    reject(new Error('文件读取失败'));
                };
                reader.readAsDataURL(file);
            });
        },
        
        // 将文件转换为Base64（带压缩）
        async fileToBase64(file, compress = true) {
            try {
                let fileToConvert = file;
                
                // 如果需要压缩且文件是图片
                if (compress && file.type && file.type.startsWith('image/')) {
                    const compressedBlob = await this.compressImage(file);
                    fileToConvert = compressedBlob;
                }
                
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result); // 结果已经是 data:image/xxx;base64, 格式
                    reader.onerror = reject;
                    reader.readAsDataURL(fileToConvert);
                });
            } catch (error) {
                console.error('转换文件为Base64失败:', error);
                // 如果压缩失败，尝试不压缩直接转换
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
        },
        
        // 将图片URL转换为Base64（带压缩）
        async imageUrlToBase64(imageUrl, compress = true) {
            try {
                // 如果已经是base64格式，需要压缩
                if (imageUrl.startsWith('data:')) {
                    if (compress) {
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const file = new File([blob], 'image.jpg', { type: blob.type });
                        const compressedBlob = await this.compressImage(file);
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(compressedBlob);
                        });
                    }
                    return imageUrl;
                }
                
                // 使用fetch获取图片
                const response = await fetch(imageUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                
                // 如果需要压缩
                if (compress && blob.type && blob.type.startsWith('image/')) {
                    const file = new File([blob], 'image.jpg', { type: blob.type });
                    const compressedBlob = await this.compressImage(file);
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve(reader.result); // 结果已经是 data:image/xxx;base64, 格式
                        };
                        reader.onerror = (error) => {
                            console.error('FileReader错误:', error);
                            reject(new Error('读取图片数据失败'));
                        };
                        reader.readAsDataURL(compressedBlob);
                    });
                }
                
                // 不压缩直接转换
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result); // 结果已经是 data:image/xxx;base64, 格式
                    };
                    reader.onerror = (error) => {
                        console.error('FileReader错误:', error);
                        reject(new Error('读取图片数据失败'));
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('转换图片URL为Base64失败:', error);
                console.error('图片URL:', imageUrl);
                
                // 如果是CORS错误，尝试使用Canvas方式转换（绕过CORS限制）
                if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                    try {
                        return await this.imageUrlToBase64WithCanvas(imageUrl, compress);
                    } catch (canvasError) {
                        console.error('Canvas方式转换也失败:', canvasError);
                        // 图片加载失败时，清除参考图并显示上传框
                        this.handleReferenceRemove();
                      
                        throw new Error('图片跨域访问失败，请确保图片URL可访问或使用base64格式');
                    }
                }
                
                // 图片加载失败时，清除参考图并显示上传框
                this.handleReferenceRemove();
                throw new Error('转换参考图为Base64失败: ' + error.message);
            }
        },
        
        // 使用Canvas方式转换图片URL为Base64（可以绕过部分CORS限制，带压缩）
        async imageUrlToBase64WithCanvas(imageUrl, compress = true) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = async () => {
                    try {
                        const canvas = document.createElement('canvas');
                        
                        // 如果需要压缩，调整尺寸
                        if (compress) {
                            let width = img.width;
                            let height = img.height;
                            const maxWidth = 1024;
                            const maxHeight = 1024;
                            
                            if (width > maxWidth || height > maxHeight) {
                                if (width > height) {
                                    height = (height * maxWidth) / width;
                                    width = maxWidth;
                                } else {
                                    width = (width * maxHeight) / height;
                                    height = maxHeight;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                        } else {
                            canvas.width = img.width;
                            canvas.height = img.height;
                        }
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // 如果需要压缩，使用JPEG格式和质量
                        if (compress) {
                            // 使用toBlob获取压缩后的blob，然后转换为base64
                            canvas.toBlob((blob) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result);
                                reader.onerror = () => reject(new Error('读取压缩图片失败'));
                                reader.readAsDataURL(blob);
                            }, 'image/jpeg', 0.7);
                        } else {
                            const base64 = canvas.toDataURL('image/png');
                            resolve(base64);
                        }
                    } catch (error) {
                        reject(new Error('Canvas转换失败: ' + error.message));
                    }
                };
                
                img.onerror = () => {
                    // 图片加载失败时，清除参考图并显示上传框
                    this.handleReferenceRemove();
                    reject(new Error('图片加载失败'));
                };
                
                img.src = imageUrl;
            });
        },
        
        // 收集插画（发送URL给后端，由后端下载并保存）
        async collectIllustration(imageUrl, index) {
            try {
                this.$message.info(`正在保存第 ${index + 1} 张插画...`);
                
                // 处理URL格式
                let pictureValue = imageUrl;
                
                // 如果是相对路径，转换为完整URL
                if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
                    pictureValue = `https://static.kidstory.cc/${imageUrl}`;
                }
                
                // 构建请求数据
                // 后端支持三种方式：
                // 1. 文件上传（FormData）- picture 字段为 File 对象
                // 2. Base64 - picture 字段为 base64 字符串（data:image/...;base64,... 格式）
                // 3. URL（新增）- picture 字段为 URL 字符串（自动下载并保存）
                const requestData = {
                    picture: pictureValue, // 使用 picture 字段，支持 URL 或 base64
                    title: `组图插画 - 第 ${index + 1} 张`,
                    description: `从组图创作中收集的第 ${index + 1} 张插画`,
                    type: 'others' // 默认类别为"其他"
                };
                
                // 获取token
                const token = localStorage.getItem('token') || '';
                if (!token) {
                    this.$message.error('请先登录');
                    return;
                }
                
                // 发送JSON请求到服务器（后端负责下载图片并保存）
                // 使用 application/json Content-Type
                const response = await this.$http.post('/ill/', requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                // 检查响应
                if (response.data && (response.data.desc === 'success' || response.data.code === 0 || response.data.code === '0')) {
                    // 获取保存的插画ID
                    const illustrationId = response.data.message?.id || response.data.message?._id || response.data.id || response.data.message;
                    
                    // 标记为已收集
                    if (!this.collectedImages.includes(index)) {
                        this.collectedImages.push(index);
                    }
                    
                    // 将插画ID添加到角色组图数组中
                    if (illustrationId) {
                        await this.addIllustrationToCharacterGroup(illustrationId);
                    }
                    
                    this.$message.success(`第 ${index + 1} 张插画已保存到"我的插画"`);
                } else {
                    throw new Error(response.data?.message || '保存失败');
                }
            } catch (error) {
                console.error('收集插画失败:', error);
                const errorMessage = error.response?.data?.message || error.message || '保存失败，请重试';
                this.$message.error(`收集插画失败: ${errorMessage}`);
            }
        },
        
        // 将插画ID添加到角色组图数组中
        async addIllustrationToCharacterGroup(illustrationId) {
            try {
                // 获取角色ID
                const characterId = localStorage.getItem('lastCharacterId') || localStorage.getItem('viewCharacterId');
                if (!characterId) {
                    console.warn('未找到角色ID，无法将插画添加到角色组图');
                    return;
                }
                
                // 调用后端接口，将插画ID添加到角色的组图数组中
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/character/${characterId}/group-images`
                    : `/character/${characterId}/group-images`;
                
                const response = await this.$http.post(apiUrl, {
                    illustration_id: illustrationId
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    }
                });
                
                if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
                    console.log('插画已添加到角色组图');
                } else {
                    console.warn('添加插画到角色组图失败:', response.data?.message);
                }
            } catch (error) {
                console.error('添加插画到角色组图失败:', error);
                // 失败不影响主流程，只记录错误
            }
        },
        
        // 保存组图到后台（保留方法，但不再自动调用）
        async saveGroupImage(prompts, imageUrls) {
            try {
                // 获取角色ID（从localStorage或从最近保存的角色获取）
                const characterId = localStorage.getItem('lastCharacterId');
                if (!characterId) {
                    console.warn('未找到角色ID，无法保存组图');
                    return;
                }
                
                // 合并所有prompts为combined_prompt
                const combinedPrompt = prompts.join('；');
                
                const saveData = {
                    character_id: characterId,
                    title: `组图 - ${new Date().toLocaleString()}`,
                    prompts: prompts,
                    image_urls: imageUrls,
                    combined_prompt: combinedPrompt
                };
                
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/character/group-image`
                    : '/character/group-image';
                
                const response = await this.$http.post(apiUrl, saveData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    }
                });
                
                if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
                    console.log('组图保存成功');
                }
            } catch (error) {
                console.error('保存组图失败:', error);
                // 保存失败不影响主流程，只记录错误
            }
        }
    }
};
</script>

<style scoped>
.container {
    width: 100%;
    height: calc(100vh - 72px - 50px);
    padding: 20px;
    box-sizing: border-box;
    background-color: #f5f7fa;
}

.main-layout {
    display: flex;
    gap: 20px;
    height: 100%;
}

.left-panel {
    flex: 0 0 40%;
    min-width: 0;
}

.right-panel {
    flex: 0 0 60%;
    min-width: 0;
}

.panel-card,
.result-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.panel-card >>> .el-card__body,
.result-card >>> .el-card__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.card-header {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.panel-content-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 20px;
}

.panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 0;
    min-height: 0;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
}

/* 参考图选择 */
.reference-section {
    margin-bottom: 32px;
}

.reference-upload {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.upload-demo {
    width: 100%;
}

.upload-demo >>> .el-upload {
    width: 100%;
}

.upload-demo >>> .el-upload-dragger {
    width: 240px;
    height: 180px;
    margin: 0 auto;
}

.import-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.import-tip {
    font-size: 12px;
    color: #909399;
}

.reference-preview {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reference-image {
    width: 240px;
    height: 180px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ebeef5;
    margin: 0 auto;
    display: block;
}

.reference-image >>> .el-image {
    width: 100%;
    height: 100%;
}

.reference-image >>> .el-image__inner {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.reference-actions {
    display: flex;
    justify-content: center;
}

/* Prompt输入 */
.prompt-section {
    margin-bottom: 32px;
}




.prompt-inputs {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.prompt-input {
    width: 100%;
}

/* 提交按钮 */
.submit-section {
    display: flex;
    justify-content: center;
    padding: 20px 0;
    border-top: 1px solid #ebeef5;
    background-color: #fff;
    flex-shrink: 0;
}

/* 结果展示 */
.result-content {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.result-scrollbar {
    flex: 1;
    min-height: 0;
}

.result-scrollbar >>> .el-scrollbar__wrap {
    overflow-x: hidden;
}

.result-placeholder,
.result-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
}

.result-placeholder i,
.result-loading i {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
}

.result-loading i {
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

.result-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    width: 100%;
}

/* 单个卡片样式 */
.content-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
    transition: transform 0.2s, opacity 0.3s, scale 0.3s;
}

.content-card:hover {
    transform: translateY(-4px);
}

/* 卡片图片区域 */
.card-image {
    width: 100%;
    height: 200px;
    overflow: hidden;
    border-radius: 4px 4px 0 0;
    background-color: #f5f6fa;
    cursor: pointer;
}

.cover-image {
    width: 100%;
    height: 100%;
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
    font-size: 30px;
}

/* 卡片内容区域 */
.card-content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-actions {
    margin-top: auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.collected-text {
    color: #67c23a;
    font-size: 14px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.collected-text::before {
    content: '✓';
    color: #67c23a;
    font-weight: bold;
    margin-right: 4px;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar,
.result-content::-webkit-scrollbar {
    width: 6px;
}

.panel-content::-webkit-scrollbar-track,
.result-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb,
.result-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover,
.result-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>

