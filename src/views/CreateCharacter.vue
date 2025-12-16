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
                                    <div class="upload-step">1：上传照片（可选）</div>
                                  
                                    <div class="el-upload__text-secondary">
                                        将文件拖到此处，或<em>点击上传</em>
                                    </div>
                                    <template #tip>
                                        <div class="el-upload__tip">
                                            支持 JPG、PNG 格式，建议大小不超过 5MB
                                            <br />
                                            为保证生成效果，请上传半身照，确保人物面部清晰完整。
                                            <br />
                                            <span style="color: #909399;">提示：也可以不上传照片，仅使用提示词生成角色</span>
                                        </div>
                                    </template>
                                </el-upload>
                            </div>

                            <!-- 上传后的内容 -->
                            <div v-if="photoPreviewUrl" class="uploaded-content">
                                <!-- 照片预览 -->
                                <div class="photo-preview-wrapper">
                                    <div class="step-label">1：上传的照片</div>
                                    <div class="photo-preview">
                                        <el-image 
                                            :src="photoPreviewUrl" 
                                            alt="上传照片" 
                                            class="photo-image"
                                            fit="contain"
                                            :preview-src-list="[photoPreviewUrl]">
                                        </el-image>
                                    </div>
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
                                    <prompt-fill 
                                        v-model="form.prompt"
                                        template-id="character-detail"
                                        :show-template-selector="true"
                                        :allow-custom="true">
                                    </prompt-fill>
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
                           
                        </div>
                        <div v-if="resultImageUrl && !processing" class="result-image-wrapper">
                            <el-image 
                                :src="displayImageUrl" 
                                alt="生成的角色形象" 
                                class="result-image"
                                fit="contain"
                                :preview-src-list="[displayImageUrl]">
                            </el-image>
                            <div class="result-actions">
                                <el-button 
                                    type="primary" 
                                    @click="collectCharacter">
                                    <i class="el-icon-star-on"></i> 收集角色
                                </el-button>
                                <el-button 
                                    @click="downloadResult" 
                                    :loading="downloading">
                                    <i class="el-icon-download"></i> 下载角色
                                </el-button>
                    <el-button 
                                        @click="useInIllustration">
                                        <i class="el-icon-edit"></i> 创作插画
                    </el-button>
                    <el-button 
                                        @click="useInCreation">
                                        <i class="el-icon-edit"></i> 创作组图
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
import PromptFill from '@/components/PromptFill.vue';

export default {
    name: 'CreateCharacter',
    components: {
        PromptFill
    },
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
            
            // 默认参考图（固定使用 r11.png）
            defaultReferenceImage: require('@/assets/images/r11.png'),
            
            // 角色分类选项（中文）
       
            
            // 表单数据
            form: {
                character_name: '', // 角色名称
                prompt: '', // 用户输入的自定义提示词
                character_type: '', // 角色类型
               
            },
            
            // 默认的系统提示词（不显示给用户，会与用户输入的提示词拼接）
            // 图一：用户上传的图片，图二：参考图
            defaultPrompt: '将图二的头部替换为图一，“完整呈现角色从头到脚”，全身像，不要影子，图像风格保持不变，画面只保留人物，白色背景，大师级作品',
            
            // 处理状态
            processing: false, // 风格迁移处理中
            downloading: false,
            
            // 结果
            resultImageUrl: null,
            resultImageData: null,
            savedCharacterId: null, // 已保存的角色ID，用于避免重复保存
            
            // API配置
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
        };
    },
    mounted() {
        // 页面加载时，从 localStorage 恢复角色信息
        this.loadCharacterFromLocalStorage();
    },
    computed: {
        canGenerate() {
            // 需要：(角色名称或提示词) + 不在处理中
            // 照片是可选的，可以只用提示词生成
            const hasCharacterInfo = !!(this.form.character_name || this.form.prompt);
            return hasCharacterInfo && !this.processing;
        },
        // 获取正确的图片显示URL
        displayImageUrl() {
            if (!this.resultImageUrl) {
                return '';
            }
            // 如果是 base64 格式，直接返回
            if (this.resultImageUrl.startsWith('data:')) {
                return this.resultImageUrl;
            }
            // 如果是完整的 URL，直接返回
            if (this.resultImageUrl.startsWith('http://') || this.resultImageUrl.startsWith('https://')) {
                return this.resultImageUrl;
            }
            // 如果是相对路径，添加前缀
            return `https://static.kidstory.cc/${this.resultImageUrl}`;
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
              
            }
        },
        
        // 生成最终角色
        async handleCreateCharacter() {
            if (!this.canGenerate) {
                if (!this.form.character_name && !this.form.prompt) {
                    this.$message.warning('请填写角色名称或提示词');
                }
                return;
            }
            
            this.processing = true;
            this.resultImageUrl = null;
            this.resultImageData = null;
            this.savedCharacterId = null; // 重置已保存的角色ID
            // 清理旧的角色数据
            this.clearCharacterFromLocalStorage();
            
            try {
                // 构建请求参数（JSON格式）
                const requestData = {};
                
                // character_name 和 prompt 至少提供一个
                if (this.form.character_name) {
                    requestData.character_name = this.form.character_name;
                }
                
                // 拼接用户输入的提示词
                let finalPrompt = '';
                if (this.photoFile) {
                    // 如果有照片，使用默认提示词（用于图片替换）
                    if (this.form.prompt && this.form.prompt.trim()) {
                        finalPrompt = `${this.defaultPrompt} ${this.form.prompt.trim()}`;
                    } else {
                        finalPrompt = this.defaultPrompt;
                    }
                } else {
                    // 如果没有照片，直接使用用户输入的提示词（纯文本生成）
                    if (this.form.prompt && this.form.prompt.trim()) {
                        finalPrompt = this.form.prompt.trim();
                    } else {
                        throw new Error('请填写提示词');
                    }
                }
                
                if (finalPrompt) {
                    requestData.prompt = finalPrompt;
                }
                
                // 如果有照片，处理图片上传
                if (this.photoFile) {
                    // 将用户上传的照片转换为Base64（压缩以减小文件大小）
                    const userImageBase64 = await this.fileToBase64(this.photoFile, true);
                    
                    // 使用默认参考图 r11.png
                    const presetImageBase64 = await this.imageUrlToBase64(this.defaultReferenceImage, true);
                    
                    // 组合两张图片，传递给后端
                    requestData.image = [
                        userImageBase64,      // 用户上传的图片（Base64）
                        presetImageBase64     // 脚本预设的图片（Base64）
                    ];
                }
                // 如果没有照片，不传递 image 参数，后端将根据提示词直接生成
                
                // 可选：角色类型
                if (this.form.character_type) {
                    requestData.character_type = this.form.character_type;
                }
                
                // 可选：图片尺寸
                requestData.size = '1280x960';
                
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
                    
                    // 保存角色信息（包括base64数据，用于后续导入到创作组图）
                    this.resultImageData = {
                        character_name: result.character_name,
                        character_type: result.character_type,
                        prompt: result.prompt,
                        size: '1280x960',
                        full_response: result.full_response,
                        // 保存base64数据，优先使用 character_image_base64
                        character_image_base64: result.character_image_base64 || result.image_base64 || null,
                        image_base64: result.image_base64 || result.character_image_base64 || null
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
                    
                    // 如果还是没有图片URL，尝试从 full_response 中获取
                    if (!this.resultImageUrl && result.full_response) {
                        // 检查 full_response.data 数组
                        if (result.full_response.data && Array.isArray(result.full_response.data) && result.full_response.data.length > 0) {
                            this.resultImageUrl = result.full_response.data[0].url || result.full_response.data[0].ResultUrl || '';
                        }
                        // 检查 full_response 的直接属性
                        if (!this.resultImageUrl) {
                            this.resultImageUrl = result.full_response.result_url || result.full_response.ResultUrl || result.full_response.url || '';
                        }
                    }
                    
                    // 尝试从其他字段获取
                    if (!this.resultImageUrl) {
                        this.resultImageUrl = result.character_image_oss_url || result.result_url || result.ResultUrl || '';
                    }
                    
                    // 保存完整的结果数据，包括 full_response，供保存时使用
                    if (result.full_response) {
                        this.resultImageData.full_response = result.full_response;
                    }
                    
                    // 如果 resultImageUrl 是外部URL，也保存到 resultImageData 中
                    if (this.resultImageUrl && !this.resultImageUrl.startsWith('data:')) {
                        this.resultImageData.image_url = this.resultImageUrl;
                        this.resultImageData.character_image_url = this.resultImageUrl;
                    }
                    
                    if (!this.resultImageUrl) {
                        console.warn('未找到图片URL，但角色创建成功');
                    }
                    
                    // 保存角色信息到 localStorage，以便页面切换后恢复
                    this.saveCharacterToLocalStorage();
                } else if (responseData.statuscode === 'lackOfParameters' || responseData.code !== 0) {
                    // 参数缺失错误或其他错误
                    const errorMsg = responseData.message || responseData.desc || '创作失败，请重试';
                    throw new Error(errorMsg);
                } else {
                    // 其他错误响应
                    const errorMsg = responseData.message || responseData.desc || '创建失败，请重试';
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error('创建角色失败:', error);
                
                // 处理特定错误
                let errorMessage = '创建角色失败，请重试';
                
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
        
        // 将base64转换为File对象
        base64ToFile(base64String, filename = 'image.png') {
            try {
                // 处理data URI格式
                let base64Data = base64String;
                let mimeType = 'image/png';
                
                if (base64String.startsWith('data:')) {
                    const parts = base64String.split(',');
                    base64Data = parts[1];
                    const mimeMatch = parts[0].match(/data:([^;]+)/);
                    if (mimeMatch && mimeMatch[1]) {
                        mimeType = mimeMatch[1];
                    }
                }
                
                // 将base64转换为二进制
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                
                // 创建File对象
                return new File([byteArray], filename, { type: mimeType });
            } catch (error) {
                console.error('Base64转File失败:', error);
                throw error;
            }
        },
        
        // 图像分割：抠图只保留主体
        // 支持角色相关参数：character_id, character_name, character_type, description, tags, is_public
        async segmentImage(imageUrl, characterParams = {}) {
            const token = localStorage.getItem('token') || '';
            
            let response;
            
            // 构建角色相关参数
            const params = {};
            if (characterParams.character_id) {
                params.character_id = characterParams.character_id;
            }
            if (characterParams.character_name) {
                params.character_name = characterParams.character_name;
            }
            if (characterParams.character_type) {
                params.character_type = characterParams.character_type;
            }
            if (characterParams.description) {
                params.description = characterParams.description;
            }
            if (characterParams.tags && Array.isArray(characterParams.tags)) {
                params.tags = characterParams.tags;
            }
            if (characterParams.is_public !== undefined) {
                params.is_public = characterParams.is_public;
            }
            
            // 判断是base64、URL还是File
            if (imageUrl.startsWith('data:')) {
                // Base64格式：优先使用文件上传方式，失败则使用JSON方式
                try {
                    const file = this.base64ToFile(imageUrl, 'character.png');
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    // 添加角色相关参数到 FormData
                    Object.keys(params).forEach(key => {
                        if (Array.isArray(params[key])) {
                            params[key].forEach((item, index) => {
                                formData.append(`${key}[${index}]`, item);
                            });
                        } else {
                            formData.append(key, params[key]);
                        }
                    });
                    
                    response = await this.$http.post('/image-segmentation/general', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': 'Bearer ' + token
                        }
                    });
                } catch (fileError) {
                    // 如果File转换失败，使用JSON方式发送base64
                    console.warn('File转换失败，使用JSON方式发送base64:', fileError);
                    
                    // 提取base64数据（去掉data:image/xxx;base64,前缀）
                    let base64Data = imageUrl;
                    if (imageUrl.includes(',')) {
                        base64Data = imageUrl.split(',')[1];
                    }
                    
                    response = await this.$http.post('/image-segmentation/general', {
                        image_base64: base64Data,
                        ...params
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        }
                    });
                }
            } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                // URL格式：使用JSON方式
                response = await this.$http.post('/image-segmentation/general', {
                    image_url: imageUrl,
                    ...params
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
            } else {
                // 相对路径，转换为完整URL
                const fullUrl = `https://static.kidstory.cc/${imageUrl}`;
                response = await this.$http.post('/image-segmentation/general', {
                    image_url: fullUrl,
                    ...params
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
            }
            
            if (response.data && response.data.code === 0) {
                const message = response.data.message || {};
                
                // 新接口返回格式：imageURL 或 foreground_image
                const imageURL = message.imageURL || message.foreground_image || message.image_url;
                
                if (imageURL) {
                    // 如果是完整的URL，直接返回
                    if (imageURL.startsWith('http://') || imageURL.startsWith('https://')) {
                        return imageURL;
                    }
                    // 如果是base64，转换为data URI格式
                    if (imageURL.startsWith('data:')) {
                        return imageURL;
                    }
                    // 如果是相对路径，拼接完整URL
                    if (!imageURL.startsWith('/')) {
                        return `https://static.kidstory.cc/${imageURL}`;
                    }
                    return `https://static.kidstory.cc${imageURL}`;
                } else {
                    throw new Error(response.data?.message || '未获取到分割后的图片');
                }
            } else {
                throw new Error(response.data?.message || '图像分割失败');
            }
        },
        
        // 收集角色：跳转到上传页面确认信息后保存
        async collectCharacter() {
            if (!this.resultImageUrl) {
                this.$message.warning('没有可收集的角色图片');
                return;
            }
            
            try {
                // 获取当前的角色数据
                const result = this.resultImageData || {};
                const characterName = this.form.character_name || result.character_name || '';
                const characterType = this.form.character_type || result.character_type || '';
                const description = this.form.prompt || result.prompt || result.description || '';
                
                // 先进行图像分割（不传递角色参数，因为会在上传页面确认后再创建/更新角色）
                const segmentedImageUrl = await this.segmentImage(this.resultImageUrl);
                
                // 将角色数据存储到 localStorage，供 UploadElement.vue 使用
                const characterDataForUpload = {
                    mode: 'character', // 标识这是角色模式
                    image_url: segmentedImageUrl, // 使用分割后的图片
                    character_name: characterName,
                    character_type: characterType,
                    description: description,
                    full_response: result.full_response,
                    resultImageData: this.resultImageData,
                    segmentedImageUrl: segmentedImageUrl // 保存分割后的图片URL
                };
                localStorage.setItem('pendingCharacterData', JSON.stringify(characterDataForUpload));
                
                // 跳转到上传页面
                this.$router.push({
                    path: '/user/upload/upload-element',
                    query: { mode: 'character' }
                });
            } catch (error) {
                console.error('收集角色失败:', error);
                this.$message.error('收集角色失败: ' + (error.message || '请重试'));
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
                    const parts = this.resultImageUrl.split(',');
                    const base64Data = parts[1];
                    
                    // 从data URI中提取MIME类型
                    let mimeType = 'image/jpeg'; // 默认值
                    let fileExtension = 'jpg'; // 默认扩展名
                    
                    if (parts[0]) {
                        const mimeMatch = parts[0].match(/data:([^;]+)/);
                        if (mimeMatch && mimeMatch[1]) {
                            mimeType = mimeMatch[1];
                            // 根据MIME类型确定文件扩展名
                            if (mimeType.includes('png')) {
                                fileExtension = 'png';
                            } else if (mimeType.includes('gif')) {
                                fileExtension = 'gif';
                            } else if (mimeType.includes('webp')) {
                                fileExtension = 'webp';
                            } else {
                                fileExtension = 'jpg';
                            }
                        }
                    }
                    
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimeType });
                    
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `character_${Date.now()}.${fileExtension}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    // 处理URL下载
                    // 如果resultImageUrl是相对路径，需要拼接完整URL
                    let imageUrl = this.resultImageUrl;
                    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
                        // 相对路径，拼接完整URL
                        imageUrl = `https://static.kidstory.cc/${imageUrl}`;
                    }
                    
                    // 普通URL下载，处理跨域问题
                    try {
                        const response = await fetch(imageUrl, {
                            mode: 'cors',
                            credentials: 'omit'
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const blob = await response.blob();
                        
                        // 从响应头或blob中获取MIME类型
                        const contentType = response.headers.get('content-type') || blob.type || 'image/jpeg';
                        let fileExtension = 'jpg';
                        if (contentType.includes('png')) {
                            fileExtension = 'png';
                        } else if (contentType.includes('gif')) {
                            fileExtension = 'gif';
                        } else if (contentType.includes('webp')) {
                            fileExtension = 'webp';
                        }
                        
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `character_${Date.now()}.${fileExtension}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                    } catch (fetchError) {
                        // 如果fetch失败（可能是CORS问题），尝试直接打开链接
                        console.warn('Fetch失败，尝试直接下载:', fetchError);
                        const link = document.createElement('a');
                        link.href = imageUrl;
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
        
        // 用于创作插画
        async useInIllustration() {
            if (!this.resultImageUrl) {
                this.$message.warning('没有可用的角色图片');
                return;
            }
            
            try {
                this.$message.info('正在处理角色图片...');
                
                // 获取角色信息
                const result = this.resultImageData || {};
                const characterName = this.form.character_name || result.character_name || '未命名角色';
                const characterType = this.form.character_type || result.character_type || '通用';
                const description = this.form.prompt || result.prompt || result.description || '';
                
                let characterId = this.savedCharacterId;
                
                // 如果角色还未保存，先创建角色（使用占位图或原图）
                if (!characterId) {
                    try {
                        const token = localStorage.getItem('token') || '';
                        const createResponse = await this.$http.post('/character', {
                            character_name: characterName,
                            character_type: characterType,
                            description: description,
                            image_url: this.resultImageUrl, // 先使用原图作为占位
                            is_public: 1
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            }
                        });
                        
                        if (createResponse.data && (createResponse.data.code === 0 || createResponse.data.code === '0')) {
                            const characterData = createResponse.data.data || createResponse.data.message || createResponse.data;
                            characterId = characterData.id || characterData._id || createResponse.data.id;
                            if (characterId) {
                                this.savedCharacterId = characterId;
                                localStorage.setItem('lastCharacterId', String(characterId));
                            }
                        } else {
                            throw new Error(createResponse.data?.message || '创建角色失败');
                        }
                    } catch (error) {
                        console.error('创建角色失败:', error);
                        this.$message.error('创建角色失败: ' + (error.response?.data?.message || error.message || '请重试'));
                        return;
                    }
                }
                
                // 调用图像分割接口，传递角色ID和相关参数（会更新该角色）
                const characterParams = {
                    character_name: characterName,
                    character_type: characterType,
                    description: description,
                    is_public: 1
                };
                if (characterId) {
                    characterParams.character_id = characterId;
                }
                
                const segmentedImageUrl = await this.segmentImage(this.resultImageUrl, characterParams);
                
                // 保存分割后的图片到localStorage
                localStorage.setItem('characterImage', segmentedImageUrl);
                
                // 提示角色已保存
                this.$message.success('角色已保存到"我的角色"');
                
                // 跳转到创作插画页面
                this.$router.push('/creation');
            } catch (error) {
                console.error('创作插画失败:', error);
                this.$message.error('处理失败: ' + (error.response?.data?.message || error.message || '请重试'));
            }
        },
        
        // 用于创作组图
        async useInCreation() {
            if (!this.resultImageUrl) {
                this.$message.warning('没有可用的角色图片');
                return;
            }
            
            try {
                this.$message.info('正在处理角色图片...');
                
                // 获取角色信息
                const result = this.resultImageData || {};
                const characterName = this.form.character_name || result.character_name || '未命名角色';
                const characterType = this.form.character_type || result.character_type || '通用';
                const description = this.form.prompt || result.prompt || result.description || '';
                
                let characterId = this.savedCharacterId;
                
                // 如果角色还未保存，先创建角色（使用占位图或原图）
                if (!characterId) {
                    try {
                        const token = localStorage.getItem('token') || '';
                        const createResponse = await this.$http.post('/character', {
                            character_name: characterName,
                            character_type: characterType,
                            description: description,
                            image_url: this.resultImageUrl, // 先使用原图作为占位
                            is_public: 1
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            }
                        });
                        
                        if (createResponse.data && (createResponse.data.code === 0 || createResponse.data.code === '0')) {
                            const characterData = createResponse.data.data || createResponse.data.message || createResponse.data;
                            characterId = characterData.id || characterData._id || createResponse.data.id;
                            if (characterId) {
                                this.savedCharacterId = characterId;
                                localStorage.setItem('lastCharacterId', String(characterId));
                            }
                        } else {
                            throw new Error(createResponse.data?.message || '创建角色失败');
                        }
                    } catch (error) {
                        console.error('创建角色失败:', error);
                        this.$message.error('创建角色失败: ' + (error.response?.data?.message || error.message || '请重试'));
                        return;
                    }
                }
                
                // 调用图像分割接口，传递角色ID和相关参数（会更新该角色）
                const characterParams = {
                    character_name: characterName,
                    character_type: characterType,
                    description: description,
                    is_public: 1
                };
                if (characterId) {
                    characterParams.character_id = characterId;
                }
                
                const segmentedImageUrl = await this.segmentImage(this.resultImageUrl, characterParams);
                
                // 保存分割后的图片到localStorage
                localStorage.setItem('characterImage', segmentedImageUrl);
                
                // 提示角色已保存
                this.$message.success('角色已保存到"我的角色"');
                
                // 跳转到创作组图页面
                this.$router.push('/create-group-images');
            } catch (error) {
                console.error('创作组图失败:', error);
                this.$message.error('处理失败: ' + (error.response?.data?.message || error.message || '请重试'));
            }
        },
        
        // 保存角色到后台
        async saveCharacter(result) {
            try {
                // 获取图片URL，优先使用外部URL（API要求必需参数）
                let imageUrl = result.image_url || result.character_image_url || this.resultImageUrl || '';
                
                // 如果 image_url 是 base64，尝试从多个地方获取外部URL
                if (!imageUrl || imageUrl.startsWith('data:')) {
                    // 1. 尝试从 result.full_response 中获取
                    if (result.full_response) {
                        // 检查 full_response.data 数组
                        if (result.full_response.data && Array.isArray(result.full_response.data) && result.full_response.data.length > 0) {
                            imageUrl = result.full_response.data[0].url || result.full_response.data[0].ResultUrl || '';
                        }
                        // 检查 full_response 的直接属性
                        if (!imageUrl || imageUrl.startsWith('data:')) {
                            imageUrl = result.full_response.result_url || result.full_response.ResultUrl || result.full_response.url || '';
                        }
                    }
                    
                    // 2. 尝试从 resultImageData.full_response 中获取
                    if ((!imageUrl || imageUrl.startsWith('data:')) && this.resultImageData && this.resultImageData.full_response) {
                        if (this.resultImageData.full_response.data && Array.isArray(this.resultImageData.full_response.data) && this.resultImageData.full_response.data.length > 0) {
                            imageUrl = this.resultImageData.full_response.data[0].url || this.resultImageData.full_response.data[0].ResultUrl || '';
                        }
                        if (!imageUrl || imageUrl.startsWith('data:')) {
                            imageUrl = this.resultImageData.full_response.result_url || this.resultImageData.full_response.ResultUrl || this.resultImageData.full_response.url || '';
                        }
                    }
                    
                    // 3. 尝试从 result 的其他字段获取
                    if (!imageUrl || imageUrl.startsWith('data:')) {
                        imageUrl = result.character_image_oss_url || result.result_url || result.ResultUrl || '';
                    }
                }
                
                // 如果还是没有外部URL，尝试使用 base64（某些后端可能支持）
                // 但优先记录警告
                if (!imageUrl || imageUrl.startsWith('data:')) {
                    console.warn('未找到外部URL，尝试使用base64格式保存');
                    // 如果确实只有 base64，使用 base64
                    if (this.resultImageUrl && this.resultImageUrl.startsWith('data:')) {
                        imageUrl = this.resultImageUrl;
                    } else if (result.character_image_base64 || result.image_base64) {
                        imageUrl = result.character_image_base64 || result.image_base64;
                        if (!imageUrl.startsWith('data:')) {
                            imageUrl = `data:image/jpeg;base64,${imageUrl}`;
                        }
                    }
                }
                
                // 验证必需参数
                if (!imageUrl) {
                    console.error('保存角色失败：无法获取图片URL');
                    console.error('result:', result);
                    console.error('resultImageData:', this.resultImageData);
                    console.error('resultImageUrl:', this.resultImageUrl);
                    throw new Error('无法获取角色图片URL，请确保图片已成功生成');
                }
                
                // 检查是否是 base64 格式
                const isBase64 = imageUrl.startsWith('data:');
                if (isBase64) {
                    console.warn('保存角色：使用 base64 格式的图片URL（后端可能不支持）');
                    console.warn('imageUrl 长度:', imageUrl.length);
                } else {
                    console.log('保存角色：使用外部URL:', imageUrl.substring(0, 100) + '...');
                }
                
                const characterName = result.character_name || this.form.character_name;
                if (!characterName) {
                    throw new Error('角色名称不能为空');
                }
                
                // 构建请求数据（符合API规范）
                const saveData = {
                    // 必需参数
                    character_name: characterName,
                    image_url: imageUrl,
                    
                    // 可选参数
                    character_type: result.character_type || this.form.character_type || undefined,
                    description: result.character_description || result.description || undefined,
                    prompt: result.prompt || this.form.prompt || undefined,
                    tags: result.tags || [],
                    is_public: result.is_public !== undefined ? result.is_public : 1 // 默认公开
                };
                
                // 注意：不保存 reference_image 信息
                
                // 移除 undefined 的字段
                Object.keys(saveData).forEach(key => {
                    if (saveData[key] === undefined) {
                        delete saveData[key];
                    }
                });
                
                // 注意：如果后端路径不同，请修改这里的路径
                // 当前使用的路径：/character
                // 如果后端返回404，可能需要使用其他路径，如：
                // - /create-character/save
                // - /user/character
                // - /api/character
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/character`
                    : '/character';
                
                console.log('保存角色请求URL:', apiUrl);
                console.log('保存角色请求数据:', {
                    ...saveData,
                    image_url: isBase64 ? `[Base64, 长度: ${imageUrl.length}]` : saveData.image_url
                });
                
                const response = await this.$http.post(apiUrl, saveData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    }
                });
                
                if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
                    // 保存角色ID，用于后续保存组图
                    const savedCharacter = response.data.data || response.data.message || response.data;
                    const characterId = savedCharacter.id || savedCharacter._id || response.data.id;
                    
                    if (characterId) {
                        localStorage.setItem('lastCharacterId', String(characterId));
                        // 记录已保存的角色ID，避免重复保存
                        this.savedCharacterId = characterId;
                        console.log('角色保存成功，ID:', characterId);
                    }
                    
                    // 如果后端返回了保存后的角色信息（包括 image_url），使用后端返回的URL
                    if (savedCharacter.image_url && !savedCharacter.image_url.startsWith('data:')) {
                        console.log('使用后端返回的图片URL:', savedCharacter.image_url.substring(0, 100) + '...');
                        // 更新 resultImageData 和 resultImageUrl，确保后续使用正确的URL
                        if (this.resultImageData) {
                            this.resultImageData.image_url = savedCharacter.image_url;
                            this.resultImageData.character_image_url = savedCharacter.image_url;
                        }
                        this.resultImageUrl = savedCharacter.image_url;
                    }
                    
                    return true; // 保存成功，返回 true
                } else {
                    throw new Error(response.data?.message || '保存角色失败');
                }
            } catch (error) {
                console.error('保存角色失败:', error);
                
                
            }
        },
        
        // 保存角色信息到 localStorage
        saveCharacterToLocalStorage() {
            try {
                const characterData = {
                    resultImageUrl: this.resultImageUrl,
                    resultImageData: this.resultImageData,
                    savedCharacterId: this.savedCharacterId, // 保存已保存的角色ID
                    form: {
                        character_name: this.form.character_name,
                        prompt: this.form.prompt,
                        character_type: this.form.character_type
                    },
                    timestamp: Date.now() // 添加时间戳，用于判断数据是否过期
                };
                localStorage.setItem('createCharacter_data', JSON.stringify(characterData));
            } catch (error) {
                console.error('保存角色信息到 localStorage 失败:', error);
            }
        },
        
        // 从 localStorage 恢复角色信息
        loadCharacterFromLocalStorage() {
            try {
                const savedData = localStorage.getItem('createCharacter_data');
                if (savedData) {
                    const characterData = JSON.parse(savedData);
                    
                    // 检查数据是否过期（24小时内有效）
                    const now = Date.now();
                    const dataAge = now - (characterData.timestamp || 0);
                    const maxAge = 24 * 60 * 60 * 1000; // 24小时
                    
                    if (dataAge < maxAge && characterData.resultImageUrl) {
                        // 恢复角色信息
                        this.resultImageUrl = characterData.resultImageUrl;
                        this.resultImageData = characterData.resultImageData || null;
                        
                        // 恢复表单数据（如果存在）
                        if (characterData.form) {
                            if (characterData.form.character_name) {
                                this.form.character_name = characterData.form.character_name;
                            }
                            if (characterData.form.prompt) {
                                this.form.prompt = characterData.form.prompt;
                            }
                            if (characterData.form.character_type) {
                                this.form.character_type = characterData.form.character_type;
                            }
                        }
                        
                        // 恢复已保存的角色ID，避免重复保存
                        // 优先使用 localStorage 中保存的 savedCharacterId
                        if (characterData.savedCharacterId) {
                            this.savedCharacterId = characterData.savedCharacterId;
                            console.log('已恢复已保存的角色ID:', characterData.savedCharacterId);
                        } else {
                            // 如果没有，检查 lastCharacterId（向后兼容）
                            const lastCharacterId = localStorage.getItem('lastCharacterId');
                            if (lastCharacterId) {
                                this.savedCharacterId = lastCharacterId;
                                console.log('已恢复已保存的角色ID (从lastCharacterId):', lastCharacterId);
                            }
                        }
                        
                        console.log('已从 localStorage 恢复角色信息');
                    } else {
                        // 数据过期，清理
                        localStorage.removeItem('createCharacter_data');
                    }
                }
            } catch (error) {
                console.error('从 localStorage 恢复角色信息失败:', error);
                // 如果解析失败，清理损坏的数据
                localStorage.removeItem('createCharacter_data');
            }
        },
        
        // 清理 localStorage 中的角色信息
        clearCharacterFromLocalStorage() {
            try {
                localStorage.removeItem('createCharacter_data');
            } catch (error) {
                console.error('清理 localStorage 中的角色信息失败:', error);
            }
        },
        
        // 重置
        handleReset() {
            this.handlePhotoRemove();
            this.segmentedImageUrl = null;
            this.segmentedImageData = null;
            this.form.character_name = '';
            this.form.prompt = '';
            this.form.character_type = '';
            this.form.stylePreset = 'default';
            this.resultImageUrl = null;
            this.resultImageData = null;
            this.savedCharacterId = null; // 重置已保存的角色ID
            this.processing = false;
            this.segmenting = false;
            
            // 清理 localStorage
            this.clearCharacterFromLocalStorage();
        }
    }
};
</script>

<style scoped>
.container {
    width: 100%;
    height: calc(100vh - 50px - 40px); /* 72px顶部栏 + 50px footer高度（14px*2 padding + 23px内容） */
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
    padding-right: 24px;
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

.save-success-message {
    margin: 16px 0;
    width: 100%;
}

.save-success-message >>> .el-alert {
    padding: 12px 16px;
}

.result-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 16px;
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

.photo-preview-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.photo-preview {
    width: 400px;
    height: 240px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 12px;
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    flex-shrink: 0;
    margin: 0 auto;
}

.segmented-preview {
    width: 100%;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
  
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
}

.photo-image,
.segmented-image {
    width: 376px !important;
    height: 216px !important;
    max-width: 376px !important;
    max-height: 216px !important;
    min-width: 376px !important;
    min-height: 216px !important;
    display: block;
    flex-shrink: 0;
    box-sizing: border-box;
    border-radius: 6px;
    overflow: hidden;
}

.photo-image >>> .el-image,
.segmented-image >>> .el-image {
    width: 376px !important;
    height: 216px !important;
    max-width: 376px !important;
    max-height: 216px !important;
    display: block !important;
}

.photo-image >>> .el-image__inner,
.segmented-image >>> .el-image__inner {
    width: 376px !important;
    height: 216px !important;
    max-width: 376px !important;
    max-height: 216px !important;
    object-fit: contain !important;
    display: block !important;
}

.photo-image >>> img,
.segmented-image >>> img {
    width: 376px !important;
    height: 216px !important;
    max-width: 376px !important;
    max-height: 216px !important;
    object-fit: contain !important;
    display: block !important;
}

.step-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
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
    width: 400px;
    flex-shrink: 0;
    display: block;
    margin-top: 20px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
}

.uploaded-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-shrink: 0;
}

/* 重复定义已删除，使用上面的统一样式 */

.step-actions {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 8px;
}

.character-info-section {
    width: 400px;
    flex-shrink: 0;
    display: block;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    margin-top: 24px;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
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
    min-height: 240px;
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
    width: 400px !important;
    height: 240px !important;
    min-width: 400px !important;
    min-height: 240px !important;
    max-width: 400px !important;
    max-height: 240px !important;
    padding-top: 0 !important;
    position: relative;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    overflow: hidden;
    background-color: #fafafa;
    transition: all 0.3s;
    box-sizing: border-box;
    margin: 0 auto;
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

