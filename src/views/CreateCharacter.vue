<template>
    <div class="container">
        <div class="main-layout">
            <!-- 左侧：上传照片、抠图结果和风格选择 -->
            <div class="left-panel">
                <!-- 上传孩子照片 -->
                <div class="panel-box">
                    <el-card class="panel-card" shadow="hover">
                        <div class="panel-content">
                            <!-- 步骤1：上传照片 -->
                            <div v-if="!photoPreviewUrl" class="upload-wrapper">
                                <el-upload
                                    ref="photo-upload"
                                    class="upload-demo"
                                    drag
                                    :action="uploadAction"
                                    :file-list="photoFileList"
                                    :show-file-list="false"
                                    :auto-upload="false"
                                    :on-change="handlePhotoChange"
                                    :on-remove="handlePhotoRemove"
                                    :limit="1"
                                    accept="image/jpeg,image/jpg,image/png">
                                    <div class="upload-step">1</div>
                                  
                                    <div class="el-upload__text-secondary">
                                        将文件拖到此处，或<em>点击上传</em>
                                    </div>
                                    <template #tip>
                                        <div class="el-upload__tip">
                                            支持 JPG、PNG 格式，建议大小不超过 5MB
                                        </div>
                                    </template>
                                </el-upload>
                            </div>

                            <!-- 上传后的内容 -->
                            <div v-if="photoPreviewUrl" class="uploaded-content">
                                <!-- 照片预览 -->
                                <div class="photo-preview">
                                    <div class="step-label">1：上传的照片</div>
                                    <el-image 
                                        :src="photoPreviewUrl" 
                                        alt="上传照片" 
                                        class="photo-image"
                                        fit="contain"
                                        :preview-src-list="[photoPreviewUrl]">
                                    </el-image>
                                    <div class="step-actions">
                                        <el-button 
                                            icon="el-icon-refresh" 
                                            @click="handleRemovePhoto"
                                            size="small">
                                            重新上传
                                        </el-button>
                                    </div>
                                </div>



                            
                            </div>

                                <!-- 步骤2：角色信息输入 -->
                                <div class="character-info-section">
                                    <div class="step-label">2：角色信息</div>
                                    <el-form :model="form" label-width="100px" size="medium">
                                        <el-form-item label="角色名称">
                                            <el-input 
                                                v-model="form.character_name" 
                                                placeholder="请输入角色名称（如：魔法师、骑士等）"
                                                clearable>
                                            </el-input>
                                        </el-form-item>
                                        <el-form-item label="或提示词">
                                            <el-input 
                                                v-model="form.prompt" 
                                                type="textarea"
                                                :rows="3"
                                                placeholder="穿背带裤的小男孩"
                                                clearable>
                                            </el-input>
                                        </el-form-item>
                                       
                                    </el-form>
                                </div>

                                <!-- 步骤3：风格选择 -->
                                <div class="style-selection-section">
                                    <div class="step-label">3：选择风格</div>
                                
                                    <div class="style-presets-container-horizontal" v-if="stylePresets && stylePresets.length > 0">
                                        <div 
                                            v-for="(preset, index) in stylePresets" 
                                            :key="index"
                                            class="style-preset-item-horizontal"
                                            :class="{ 'selected': selectedStyleIndex === index }"
                                            @click="selectStylePreset(preset, index)">
                                            <div class="preset-image-wrapper-horizontal">
                                                <img :src="preset.url" :alt="preset.name" class="preset-image-horizontal">
                                            </div>
                                            <div class="preset-overlay-horizontal">
                                                <i class="el-icon-check" v-if="selectedStyleIndex === index"></i>
                                            </div>
                                            <div class="preset-name-horizontal">{{ preset.name }}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 生成角色按钮 -->
                                <div class="generate-actions">
                                    <el-button 
                                        type="primary"
                                        size="medium"
                                        :loading="processing" 
                                        :disabled="!canGenerate"
                                        @click="handleCreateCharacter"
                                        class="btn-generate">
                                        <i class="el-icon-magic-stick"></i>
                                        {{ processing ? '正在生成中...' : '生成角色' }}
                                    </el-button>
                                    <el-button 
                                        @click="handleReset"
                                        :disabled="processing">
                                        <i class="el-icon-refresh"></i>
                                        重置
                                    </el-button>
                                </div>
                        </div>
                    </el-card>
                </div>
            </div>

            <!-- 右侧：生成的角色形象和风格选择（左右排列） -->
            <div class="right-panel">
                <div class="right-panel-content">
                    <!-- 风格选择区域（靠左侧） -->
                  
                    <!-- 生成的角色形象（靠右侧） -->
                    <el-card class="result-card">
                    
                        <div class="result-content">
                          
                            <div v-if="!resultImageUrl && !processing" class="result-placeholder">
                                <i class="el-icon-picture-outline"></i>
                                <p>生成的角色形象将显示在这里</p>
                            </div>
                            <div v-if="processing" class="result-loading">
                                <i class="el-icon-loading"></i>
                                <p>正在生成中，请稍候...</p>
                                <p class="loading-tip">AI正在对抠图结果进行风格迁移处理</p>
                            </div>
                            <div v-if="resultImageUrl && !processing" class="result-image-wrapper">
                                <el-image 
                                    :src="resultImageUrl" 
                                    alt="生成的角色形象" 
                                    class="result-image"
                                    fit="contain"
                                    :preview-src-list="[resultImageUrl]">
                                </el-image>
                                <div class="result-actions">
                                    <el-button 
                                        type="primary" 
                                        @click="downloadResult" 
                                        :loading="downloading">
                                        <i class="el-icon-download"></i> 下载角色
                                    </el-button>
                                    <el-button 
                                        @click="useInCreation">
                                        <i class="el-icon-edit"></i> 用于创作
                                    </el-button>
                                </div>
                            </div>
                        </div>
                    </el-card>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CreateCharacter',
    data() {
        return {
            // 上传相关
            uploadAction: '#', // 不使用自动上传
            photoFileList: [],
            photoFile: null,
            photoPreviewUrl: null,
            photoClass: 'photo-upload',
            
            // 抠图相关
            segmenting: false, // 抠图处理中
            segmentedImageUrl: null, // 抠图后的图片URL
            segmentedImageData: null, // 抠图后的图片数据（base64或File）
            
            // 风格图片（预设）
            selectedStyleIndex: null, // 当前选中的预设风格索引
            selectedStylePreset: null, // 当前选中的风格预设
            styleFile: null, // 当前选中的风格图片文件（用于预览）
            referenceImageId: null, // 当前选中的参考图ID（1、2或3，发送给后台）
            // 预设风格图片列表
            stylePresets: [
                {
                    name: '参考图1',
                    url: require('@/assets/images/reference1.jpg'), // 前端显示的图片
                    id: 'reference1',
                    preset: 'default'
                },
                {
                    name: '参考图2',
                    url: require('@/assets/images/reference2.jpg'), // 前端显示的图片
                    id: 'reference2',
                    preset: 'cartoon'
                },
                {
                    name: '参考图3',
                    url: require('@/assets/images/reference3.jpg'), // 前端显示的图片
                    id: 'reference3',
                    preset: 'watercolor'
                }
            ],
            
            // 表单数据
            form: {
                character_name: '', // 角色名称
                prompt: '', // 用户输入的自定义提示词
                stylePreset: 'default' // 默认风格
            },
            
            // 默认的系统提示词（不显示给用户，会与用户输入的提示词拼接）
            // 图一：用户上传的图片，图二：参考图
            defaultPrompt: '将图二的头部替换为图一，人物身体完整，图像风格保持不变，画面只保留人物，背景透明（删除背景）',
            
            // 处理状态
            processing: false, // 风格迁移处理中
            downloading: false,
            
            // 结果
            resultImageUrl: null,
            resultImageData: null,
            
            // API配置
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
        };
    },
    computed: {
        canGenerate() {
            // 需要：有上传的照片 + (角色名称或提示词) + 选择了风格 + 不在处理中
            const hasCharacterInfo = !!(this.form.character_name || this.form.prompt);
            return !!this.photoFile && hasCharacterInfo && this.selectedStyleIndex !== null && !this.processing;
        }
    },
    methods: {
        // 处理照片上传
        handlePhotoChange(file, fileList) {
            const isImage = file.raw.type.startsWith('image/');
            const isLt5M = file.raw.size / 1024 / 1024 < 5;
            
            if (!isImage) {
                this.$message.error('只能上传图片文件！');
                this.handlePhotoRemove();
                return;
            }
            
            if (!isLt5M) {
                this.$message.error('图片大小不能超过 5MB！');
                this.handlePhotoRemove();
                return;
            }
            
            this.photoFile = file.raw;
            this.photoFileList = fileList;
            
            // 生成预览URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.photoPreviewUrl = e.target.result;
                this.$nextTick(() => {
                    console.log('照片预览URL已设置:', this.photoPreviewUrl ? '已设置' : '未设置');
                });
            };
            reader.onerror = () => {
                this.$message.error('读取图片失败，请重试');
            };
            reader.readAsDataURL(file.raw);
        },
        
        handlePhotoRemove() {
            this.photoFile = null;
            this.photoFileList = [];
            this.photoPreviewUrl = null;
            if (this.$refs['photo-upload']) {
                this.$refs['photo-upload'].clearFiles();
            }
        },
        
        handleRemovePhoto() {
            this.handlePhotoRemove();
        },
        
        // 抠图处理
        async handleSegment() {
            if (!this.photoFile) {
                this.$message.warning('请先上传照片');
                return;
            }
            
            this.segmenting = true;
            this.segmentedImageUrl = null;
            this.segmentedImageData = null;
            
            try {
                // 构建FormData
                const formData = new FormData();
                formData.append('photo', this.photoFile);
                
                // 调用抠图API
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/create-character/segment`
                    : '/create-character/segment';
                
                const response = await this.$http.post(apiUrl, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    timeout: 120000 // 2分钟超时
                });
                
                // 处理响应
                const responseData = response.data;
                let imageUrl = null;
                
                if (responseData.code === 0 || responseData.desc === 'success') {
                    const result = responseData.message || responseData.data || responseData;
                    
                    // 优先使用OSS链接，其次使用本地URL，最后使用base64
                    if (result.segmented_image_oss_url) {
                        imageUrl = result.segmented_image_oss_url;
                    } else if (result.segmented_image_url) {
                        imageUrl = result.segmented_image_url;
                    } else if (result.segmented_image_base64) {
                        // 处理base64格式：检查是否已经包含data URI前缀
                        let base64Str = result.segmented_image_base64.trim();
                        if (base64Str.startsWith('data:')) {
                            // 已经包含data URI前缀，直接使用
                            imageUrl = base64Str;
                        } else {
                            // 纯base64字符串，添加前缀
                            // 清理base64字符串（去除空格、换行符等）
                            base64Str = base64Str.replace(/\s/g, '');
                            imageUrl = `data:image/jpeg;base64,${base64Str}`;
                        }
                    }
                    
                    if (imageUrl) {
                        this.segmentedImageUrl = imageUrl;
                        this.segmentedImageData = result;
                        this.$message.success('抠图成功！');
                    } else {
                        throw new Error('未找到抠图结果');
                    }
                } else {
                    const errorMsg = responseData.message || responseData.desc || '抠图失败，请重试';
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error('抠图失败:', error);
                
                let errorMessage = '抠图失败，请重试';
                
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    errorMessage = '请求超时，请检查网络连接或稍后重试';
                } else if (error.response) {
                    const errorData = error.response.data;
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                this.$message.error(errorMessage);
            } finally {
                this.segmenting = false;
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
                const response = await fetch(imageUrl);
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
                throw new Error('转换参考图为Base64失败');
            }
        },
        
        // 选择预设风格图片
        async selectStylePreset(preset, index) {
            try {
                this.selectedStyleIndex = index;
                this.selectedStylePreset = preset;
                this.form.stylePreset = preset.preset || 'default';
                
                // 从本地资源URL获取图片并转换为File对象（用于预览）
                // require() 返回的路径会被webpack处理，可以直接fetch
                const response = await fetch(preset.url);
                const blob = await response.blob();
                const file = new File([blob], `${preset.id}.png`, { type: 'image/png' });
                
                this.styleFile = file;
                
                // 设置参考图ID（1、2或3，对应参考图1、2、3）
                // 确保是数字类型，不是字符串
                this.referenceImageId = Number(index + 1); // index从0开始，所以+1得到1、2、3
                
                console.log('参考图ID已设置:', this.referenceImageId);
                
            } catch (error) {
                console.error('加载预设风格图片失败:', error);
                this.$message.error('加载风格图片失败，请重试');
            }
        },
        
        // 生成最终角色
        async handleCreateCharacter() {
            if (!this.canGenerate) {
                if (!this.photoFile) {
                    this.$message.warning('请先上传照片');
                } else if (!this.form.character_name && !this.form.prompt) {
                    this.$message.warning('请填写角色名称或提示词');
                } else if (this.selectedStyleIndex === null) {
                    this.$message.warning('请先选择风格参考图');
                }
                return;
            }
            
            this.processing = true;
            this.resultImageUrl = null;
            this.resultImageData = null;
            
            try {
                // 构建请求参数（JSON格式）
                const requestData = {};
                
                // character_name 和 prompt 至少提供一个
                if (this.form.character_name) {
                    requestData.character_name = this.form.character_name;
                }
                
                // 拼接用户输入的提示词和默认提示词
                let finalPrompt = '';
                if (this.form.prompt && this.form.prompt.trim()) {
                    // 如果用户输入了提示词，将默认提示词和用户提示词拼接
                    finalPrompt = `${this.defaultPrompt} ${this.form.prompt.trim()}`;
                } else {
                    // 如果用户没有输入提示词，只使用默认提示词
                    finalPrompt = this.defaultPrompt;
                }
                
                if (finalPrompt) {
                    requestData.prompt = finalPrompt;
                }
                
                // 将用户上传的照片转换为Base64（压缩以减小文件大小）
                if (!this.photoFile) {
                    throw new Error('请先上传照片');
                }
               
                const userImageBase64 = await this.fileToBase64(this.photoFile, true);
                
                // 将选中的参考图转换为Base64（压缩以减小文件大小）
                // 前端显示的是 reference1.jpg, reference2.jpg, reference3.jpg
                // 但发送到后端需要使用 r11.png, r22.png, r33.png
                if (this.selectedStyleIndex === null) {
                    throw new Error('请先选择风格参考图');
                }
                
                // 根据选中的索引，确定对应的后端图片路径
                const backendImageMap = {
                    0: require('@/assets/images/r11.png'), // 参考图1 -> r11.png
                    1: require('@/assets/images/r22.png'), // 参考图2 -> r22.png
                    2: require('@/assets/images/r33.png')  // 参考图3 -> r33.png
                };
                
                const backendImageUrl = backendImageMap[this.selectedStyleIndex];
                if (!backendImageUrl) {
                    throw new Error('无效的参考图索引');
                }
                
                const presetImageBase64 = await this.imageUrlToBase64(backendImageUrl, true);
                
                // 组合两张图片，传递给后端
                requestData.image = [
                    userImageBase64,      // 用户上传的图片（Base64）
                    presetImageBase64     // 脚本预设的图片（Base64）
                ];
                
                // 可选：角色类型
                if (this.form.character_type) {
                    requestData.character_type = this.form.character_type;
                }
                
                // 可选：图片尺寸
                requestData.size = '1024x1024';
                
                // 调用创建角色API
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/create-character`
                    : '/create-character';
                
                const response = await this.$http.post(apiUrl, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    timeout: 180000 // 3分钟超时
                });
                
                // 处理响应
                const responseData = response.data;
                
                // 检查成功响应：code === 0 或 desc === 'success' 或 statuscode === 'success'
                const isSuccess = (responseData.code === 0 || responseData.code === '0') 
                    || responseData.desc === 'success' 
                    || responseData.statuscode === 'success';
                
                if (isSuccess && responseData.message) {
                    // 成功响应
                    const result = responseData.message;
                    
                    // 保存角色信息
                    this.resultImageData = {
                        character_name: result.character_name,
                        character_type: result.character_type,
                        prompt: result.prompt,
                        size: result.size,
                        full_response: result.full_response
                    };
                    
                    // 显示成功消息
                    this.$message.success('角色创建成功！');
                    
                    // 优先使用 image_url，其次使用 character_image_url，最后使用 base64
                    if (result.image_url) {
                        this.resultImageUrl = result.image_url;
                    } else if (result.character_image_url) {
                        this.resultImageUrl = result.character_image_url;
                    } else if (result.image_base64) {
                        // 处理base64格式
                        let base64Str = result.image_base64.trim();
                        if (base64Str && !base64Str.startsWith('data:')) {
                            base64Str = base64Str.replace(/\s/g, '');
                            base64Str = `data:image/jpeg;base64,${base64Str}`;
                        }
                        if (base64Str) {
                            this.resultImageUrl = base64Str;
                        }
                    } else if (result.character_image_base64) {
                        // 处理character_image_base64格式
                        let base64Str = result.character_image_base64.trim();
                        if (base64Str && !base64Str.startsWith('data:')) {
                            base64Str = base64Str.replace(/\s/g, '');
                            base64Str = `data:image/jpeg;base64,${base64Str}`;
                        }
                        if (base64Str) {
                            this.resultImageUrl = base64Str;
                        }
                    }
                    
                    // 如果还是没有图片URL，尝试从 full_response.data 中获取
                    if (!this.resultImageUrl && result.full_response && result.full_response.data && result.full_response.data.length > 0) {
                        this.resultImageUrl = result.full_response.data[0].url;
                    }
                    
                    if (!this.resultImageUrl) {
                        console.warn('未找到图片URL，但角色创建成功');
                    }
                } else if (responseData.statuscode === 'lackOfParameters' || responseData.code !== 0) {
                    // 参数缺失错误或其他错误
                    const errorMsg = responseData.message || responseData.desc || '创作失败，请重试';
                    throw new Error(errorMsg);
                } else {
                    // 其他错误响应
                    const errorMsg = responseData.message || responseData.desc || '创作失败，请重试';
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error('创作角色失败:', error);
                
                // 处理特定错误
                let errorMessage = '创作角色失败，请重试';
                
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    errorMessage = '请求超时，请检查网络连接或稍后重试';
                } else if (error.message.includes('ECONNREFUSED') || error.message.includes('127.0.0.1')) {
                    errorMessage = '后端服务未启动，请检查服务是否运行';
                } else if (error.response) {
                    // 后端返回的错误
                    const errorData = error.response.data;
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    } else if (error.response.status === 413) {
                        errorMessage = '图片文件过大，请上传小于5MB的图片';
                    } else if (error.response.status === 400) {
                        errorMessage = '图片格式不正确，请上传JPG或PNG格式的图片';
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                this.$message.error(errorMessage);
            } finally {
                this.processing = false;
            }
        },
        
        // 下载结果
        async downloadResult() {
            if (!this.resultImageUrl) {
                this.$message.warning('没有可下载的图片');
                return;
            }
            
            this.downloading = true;
            try {
                // 如果结果是base64格式，需要特殊处理
                if (this.resultImageUrl.startsWith('data:')) {
                    // 从base64创建Blob
                    const base64Data = this.resultImageUrl.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'image/jpeg' });
                    
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `character_${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    // 普通URL下载，处理跨域问题
                    try {
                        const response = await fetch(this.resultImageUrl, {
                            mode: 'cors',
                            credentials: 'omit'
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `character_${Date.now()}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    } catch (fetchError) {
                        // 如果fetch失败（可能是CORS问题），尝试直接打开链接
                        console.warn('Fetch失败，尝试直接下载:', fetchError);
                        const link = document.createElement('a');
                        link.href = this.resultImageUrl;
                        link.download = `character_${Date.now()}.jpg`;
                        link.target = '_blank'; // 对于跨域URL，在新窗口打开
                        link.rel = 'noopener noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }
                
                this.$message.success('下载成功');
            } catch (error) {
                console.error('下载失败:', error);
                this.$message.error('下载失败: ' + (error.message || '请重试'));
            } finally {
                this.downloading = false;
            }
        },
        
        // 用于创作
        useInCreation() {
            if (!this.resultImageUrl) {
                this.$message.warning('没有可用的角色图片');
                return;
            }
            
            // 将角色图片存储到localStorage，供创作页面使用
            localStorage.setItem('characterImage', this.resultImageUrl);
            this.$message.success('角色图片已保存，可在创作页面使用');
            
            // 跳转到创作页面
            this.$router.push('/creation');
        },
        
        // 重置
        handleReset() {
            this.handlePhotoRemove();
            this.segmentedImageUrl = null;
            this.segmentedImageData = null;
            this.selectedStyleIndex = null;
            this.selectedStylePreset = null;
            this.styleFile = null;
            this.referenceImageId = null;
            this.form.character_name = '';
            this.form.prompt = '';
            this.form.character_type = '';
            this.form.stylePreset = 'default';
            this.resultImageUrl = null;
            this.resultImageData = null;
            this.processing = false;
            this.segmenting = false;
        }
    }
};
</script>

<style scoped>
.container {
    width: 100%;
    height: calc(100vh - 60px - 51.5px); /* 72px顶部栏 + 50px footer高度（14px*2 padding + 23px内容） */
    min-height: calc(100vh - 60px - 51.5px);
    padding: 24px;
    box-sizing: border-box;
    background: #f7f8fa;
    display: flex;
    flex-direction: column;
}

.main-layout {
    display: flex;
    gap: 24px;
    width: 100%;
    margin: 0 auto;
    align-items: stretch;
    flex-shrink: 1;
    min-height: 0;
    height: 100%;
}

/* 左侧面板：上传照片和抠图结果 */
.left-panel {
    flex: 0 0 30%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    height: 100%;
}

/* 右侧面板：生成角色和风格选择 */
.right-panel {
    flex: 0 0 70%;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background-color: #fff;
    padding:20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.right-panel-content {
    display: flex;
    gap: 16px;
    align-items: flex-end;
    height: 100%;
}

.result-card {
    flex: 1;
    min-width: 0;
    min-height: 100%;
    border:none !important;
    box-shadow: none !important;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.result-card >>> .el-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
}

/* 面板框的布局 */
.panel-box {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: calc((100% - 16px) / 2);
}

/* 左侧面板的第一个和第二个card各占一半高度 */
.left-panel .panel-box:first-child {
    height: calc((100% - 16px) / 2);
}

.left-panel .panel-box:last-child {
    height: calc((100% - 16px) / 2);
}

.panel-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

/* 右侧面板的卡片需要包含风格选择区域 */
.right-panel .panel-card {
    overflow-y: auto;
}

.panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    min-height: 0;
    padding: 20px;
    padding-bottom: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
    box-sizing: border-box;
}

/* 左侧面板的滚动条样式 */
.left-panel .panel-card {
    overflow: hidden;
    min-height: 0;
}

.left-panel .panel-card >>> .el-card__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
}

.left-panel .panel-content {
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    flex: 1;
}

.left-panel .panel-content::-webkit-scrollbar {
    width: 8px;
}

.left-panel .panel-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.left-panel .panel-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.left-panel .panel-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 右侧面板的内容区域 */
.right-panel .panel-content {
    min-height: 200px;
}

.card-header {
    margin-bottom: 8px;
}

.card-header h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.subtitle {
    margin: 0;
    font-size: 14px;
    color: #909399;
}


.result-header {
    margin-bottom: 24px;
}

.result-header h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.result-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.segmented-preview {
    width: 100%;
    text-align: center;
}

.segmented-image {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-placeholder,
.result-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #909399;
    width: 100%;
    flex: 1;
}

.result-placeholder i,
.result-loading i {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
    display: block;
}

.result-placeholder p {
    margin: 0;
    text-align: center;
}

.result-loading i {
    animation: rotating 2s linear infinite;
}

.loading-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #c0c4cc;
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.result-image-wrapper {
    width: 100%;
    flex: 1;
    height:100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    padding: 20px;
    box-sizing: border-box;
    overflow: auto;
}

.result-image {
    width: 100%;
    max-width: 100%;
    height: 100%;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    display: block;
}

.result-image >>> .el-image {
    width: 100%;
    display: block;
}

.result-image >>> .el-image__inner {
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    display: block !important;
}

.result-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.upload-item {
    width: 100%;
}

.upload-label {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
}

.upload-hint {
    margin: 0;
    text-align: center;
    width: 100%;
    flex-shrink: 0;
}

.hint-text {
    margin: 0;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
}

.upload-section {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
}

.step-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.step-label {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #409eff;
    display: inline-block;
}

.photo-preview {
    width: 100%;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 12px;
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
}

.segmented-preview {
    width: 100%;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 12px;
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
}

.photo-image,
.segmented-image {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 400px !important;
    display: block;
    flex-shrink: 1;
    min-height: 0;
    box-sizing: border-box;
    border-radius: 6px;
}

.photo-image >>> .el-image,
.segmented-image >>> .el-image {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: 400px !important;
    display: block !important;
}

.photo-image >>> .el-image__inner,
.segmented-image >>> .el-image__inner {
    max-width: 100% !important;
    max-height: 400px !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
    display: block !important;
}

.photo-image >>> img,
.segmented-image >>> img {
    max-width: 100% !important;
    max-height: 400px !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
    display: block !important;
}

.step-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-shrink: 0;
}

.generate-actions {
    display: flex !important;
    gap: 12px;
    justify-content: center;
    margin-top: 20px;
    padding-top: 20px;
    padding-bottom: 20px;
    border-top: 1px solid #ebeef5;
    flex-shrink: 0;
    width: 100%;
    visibility: visible !important;
    opacity: 1 !important;
}

.style-selection-section {
    width: 100%;
    flex-shrink: 0;
    display: block;
    margin-top: 20px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
}

.uploaded-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 0;
    flex: 1;
}

.photo-preview {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.photo-image {
    width: 100%;
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    overflow: hidden;
}

.step-actions {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 8px;
}

.character-info-section {
    width: 100%;
    flex-shrink: 0;
    display: block;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
}

.character-info-section >>> .el-form-item {
    margin-bottom: 18px;
}

.style-subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0 0 16px 0;
    text-align: center;
}

.style-empty {
    text-align: center;
    padding: 20px;
    color: #909399;
}

.style-selection-section .style-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 20px;
}

/* 上传包装器 */
.upload-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-shrink: 0;
}

.upload-header {
    width: 100%;
    text-align: center;
    margin-bottom: 8px;
}

.upload-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.photo-header {
    width: 100%;
    text-align: center;
    margin-bottom: 12px;
}

.photo-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

/* Element UI Upload 拖拽样式 */
.upload-demo {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.upload-demo >>> .el-upload {
    width: 100%;
    display: block;
    position: relative;
}

.upload-demo >>> .el-upload-dragger {
    width: 100%;
    padding-top: 75%; /* 4:3 宽高比 (3/4 = 0.75) */
    position: relative;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    overflow: hidden;
    background-color: #fafafa;
    transition: all 0.3s;
    box-sizing: border-box;
}

.upload-demo >>> .el-upload-dragger > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
}

.upload-demo >>> .el-upload-dragger:hover {
    border-color: #409eff;
    background-color: #f5f7fa;
}

.upload-demo >>> .upload-step {
    font-size: 20px;
    font-weight: 600;
    color: #409eff;
    margin: 20px 0 8px;
    line-height: 1;
    display: block;
    letter-spacing: 1px;
}

.upload-demo >>> .el-upload__text {
    color: #303133;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
    margin-top: 16px;
}

.upload-demo >>> .el-upload__text-secondary {
    color: #606266;
    font-size: 14px;
    text-align: center;
    margin-top: 8px;
}

.upload-demo >>> .el-upload__text-secondary em {
    color: #409eff;
    font-style: normal;
    font-weight: 500;
}

.upload-demo >>> .el-upload__text em {
    color: #409eff;
    font-style: normal;
}

.upload-demo >>> .el-upload__tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
    text-align: center;
}

.segment-button {
    width: 100%;
    margin-top: 16px;
    height: 40px;
    font-size: 16px;
}

.actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
}

.btn-process {
    flex: 1;
    height: 40px;
    font-size: 16px;
}

/* 风格选择器样式（横向） */
.style-presets-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
    justify-content: center;
}

.style-preset-item-inline {
    position: relative;
    width: calc(25% - 6px);
    max-width: 100px;
    min-width: 70px;
    cursor: pointer;
    border: 2px solid #dcdfe6;
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.3s ease;
    background-color: #fff;
}

/* 风格选择器样式（横向，一行三个） */
.style-presets-container-horizontal {
    display: flex !important;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 16px;
    width: 100%;
    justify-content: flex-start;
    visibility: visible !important;
    opacity: 1 !important;
    min-height: 100px;
}

.style-preset-item-horizontal {
    position: relative;
    width: calc(33.333% - 11px);
    min-width: 100px;
    cursor: pointer;
    border: 2px solid #dcdfe6;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    box-sizing: border-box;
}

.style-preset-item-horizontal:hover {
    border-color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.style-preset-item-horizontal.selected {
    border-color: #409eff;
    border-width: 3px;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    background-color: #f0f9ff;
}

.preset-image-wrapper-horizontal {
    width: 100%;
    padding-top: 100%; /* 1:1 宽高比，保持正方形 */
    position: relative;
    overflow: hidden;
    background-color: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 6px;
}

.preset-image-horizontal {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preset-overlay-horizontal {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(64, 158, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 4px;
    z-index: 1;
}

.style-preset-item-horizontal.selected .preset-overlay-horizontal {
    opacity: 1;
}

.preset-overlay-horizontal i {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
}

.preset-name-horizontal {
    width: 100%;
    text-align: center;
    font-size: 12px;
    color: #606266;
    font-weight: 500;
    padding-top: 4px;
}

.style-preset-item-horizontal.selected .preset-name-horizontal {
    color: #409eff;
    font-weight: 600;
}

/* 风格选择器样式（竖向） */
.style-presets-container-vertical {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
    width: 100%;
    align-items: center;
}

.style-preset-item-vertical {
    position: relative;
    width: 100%;
    max-width: 100%;
    cursor: pointer;
    border: 2px solid #dcdfe6;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    box-sizing: border-box;
}

.style-preset-item-vertical:hover {
    border-color: #409eff;
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.style-preset-item-vertical.selected {
    border-color: #409eff;
    border-width: 3px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
    background-color: #f0f9ff;
}

.preset-image-wrapper-vertical {
    width: 100%;
    padding-top: 100%; /* 1:1 宽高比，保持正方形 */
    position: relative;
    overflow: hidden;
    background-color: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 6px;
}

.preset-image-vertical {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preset-overlay-vertical {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(64, 158, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 4px;
}

.style-preset-item-vertical.selected .preset-overlay-vertical {
    opacity: 1;
}

.preset-overlay-vertical i {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
}

.preset-name-vertical {
    width: 100%;
    text-align: center;
    font-size: 11px;
    color: #606266;
    font-weight: 500;
    padding-top: 4px;
}

.style-preset-item-vertical.selected .preset-name-vertical {
    color: #409eff;
    font-weight: 600;
}

/* 左侧风格选择区域 */
.style-selection-left {
    padding: 12px;
}

.style-header-inner {
    margin-bottom: 12px;
    text-align: center;
    width: 100%;
    display: block !important;
    visibility: visible !important;
}

.style-header-inner h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.style-header-inner .subtitle-inner {
    margin: 0;
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
}

.preset-image-wrapper {
    width: 100%;
    padding-top: 100%; /* 1:1 宽高比 */
    position: relative;
    overflow: hidden;
    background-color: #f5f7fa;
}

.preset-image-inline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preset-overlay-inline {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(64, 158, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.style-preset-item-inline.selected .preset-overlay-inline {
    opacity: 1;
}

.preset-overlay-inline i {
    color: #fff;
    font-size: 16px;
    font-weight: bold;
}

.preset-name-inline {
    padding: 4px 2px;
    text-align: center;
    font-size: 10px;
    color: #606266;
    background-color: #fff;
    border-top: 1px solid #ebeef5;
}

.style-preset-item-inline.selected .preset-name-inline {
    color: #409eff;
    font-weight: 500;
}

/* 风格选择区域（靠左侧，与生成角色左右排列） */
.style-selection-inner {
    flex-shrink: 0;
    width: 160px;
    background-color: #fff;
    border-radius: 8px;
   
    padding: 16px 12px;
    height: fit-content;
    box-sizing: border-box;
}

.style-header-inner {
    margin-bottom: 12px;
}

.style-header-inner h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.style-header-inner .subtitle-inner {
    margin: 0;
    font-size: 11px;
    color: #909399;
}

.style-actions {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.style-actions .el-button {
    width: 100%;
    font-size: 12px;
    padding: 8px 12px;
}

.btn-generate {
    min-width: 150px;
    height: 40px;
    font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .main-layout {
        flex-direction: column;
    }
    
    .left-panel,
    .right-panel {
        flex: 1;
        width: 100%;
    }
    
    .panel-box {
        width: 100%;
        margin-bottom: 16px;
    }
    
    .style-preset-item-inline {
        width: calc(25% - 6px);
        max-width: 100px;
    }
}

@media (max-width: 768px) {
    .style-preset-item-inline {
        width: calc(33.333% - 6px);
        max-width: 90px;
    }
    
    .preview-actions {
        flex-direction: column;
    }
    
    .preview-actions .el-button {
        width: 100%;
    }
    
    .style-header-inner h4 {
        font-size: 13px;
    }
    
    .style-header-inner .subtitle-inner {
        font-size: 10px;
    }
}
</style>

