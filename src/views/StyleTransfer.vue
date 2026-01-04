<template>
    <div class="container">
      

        <div class="main-layout">
            <!-- 左侧：上传和控制区域 -->
            <div class="left-panel">
                <el-card class="panel-card" shadow="hover">
                    <el-form ref="form" :model="form" label-width="0">
                        <!-- 内容图片上传 -->
                        <el-form-item required>
                            <div class="upload-item">
                                <div class="upload-label">上传图片</div>
                             
                                <div class="upload-section">
                                    <!-- 已上传则显示原比例预览图，隐藏上传框 -->
                                    <div v-if="contentPreviewUrl" class="content-preview-inline">
                                        <el-image 
                                            :src="contentPreviewUrl" 
                                            alt="内容图片" 
                                            class="content-image-inline"
                                            fit="contain"
                                            :preview-src-list="[contentPreviewUrl]">
                                        </el-image>
                                    </div>
                                    <el-upload
                                        v-else
                                        ref="content-upload"
                                        :action="uploadAction"
                                        list-type="picture-card"
                                        :file-list="contentFileList"
                                        :show-file-list="false"
                                        :on-preview="handleContentPreview"
                                        :auto-upload="false"
                                        :on-change="handleContentChange"
                                        :on-remove="handleContentRemove"
                                        :limit="1"
                                        accept="image/jpeg,image/jpg,image/png"
                                        :class="contentClass">
                                        <i class="el-icon-plus"></i>
                                    </el-upload>
                                </div>
                            </div>
                            <el-dialog v-model="contentDialogVisible" width="520px">
                                <img width="100%" :src="contentPreviewUrl" alt="内容图片预览">
                            </el-dialog>
                        </el-form-item>

                        <!-- 风格图片选择 -->
                        <el-form-item required>
                            <div class="upload-item">
                                <div class="upload-label">选择参考图</div>
                                <div class="style-presets-container">
                                    <div 
                                        v-for="(preset, index) in stylePresets" 
                                        :key="index"
                                        class="style-preset-item-inline"
                                        :class="{ 'selected': selectedStyleIndex === index }"
                                        @click="selectStylePreset(preset, index)">
                                        <div class="preset-image-wrapper">
                                            <img :src="preset.url" :alt="preset.name" class="preset-image-inline">
                                        </div>
                                        <div class="preset-overlay-inline">
                                            <i class="el-icon-check" v-if="selectedStyleIndex === index"></i>
                                        </div>
                                        <div class="preset-name-inline">{{ preset.name }}</div>
                                    </div>
                                </div>
                            </div>
                            <!-- 预览弹窗 -->
                            <el-dialog v-model="styleDialogVisible" width="520px">
                                <img width="100%" :src="stylePreviewUrl" alt="风格图片预览">
                            </el-dialog>
                        </el-form-item>

                        <!-- 处理参数 -->
                        <el-form-item>
                            <div class="params-row">
                                <div class="param-label">风格强度</div>
                                <el-slider
                                    v-model="form.styleStrength"
                                    :min="0.1"
                                    :max="1.0"
                                    :step="0.1"
                                    show-input
                                    :format-tooltip="formatTooltip">
                                </el-slider>
                            </div>
                        </el-form-item>

                        <!-- 操作按钮 -->
                        <el-form-item>
                            <div class="actions">
                                <el-button 
                                    type="primary" 
                                    :loading="processing" 
                                    :disabled="!canProcess"
                                    @click="handleProcess"
                                    class="btn-process">
                                    <i class="el-icon-magic-stick"></i>
                                    <span>{{ processing ? '处理中...' : '开始生成' }}</span>
                                </el-button>
                                <el-button @click="handleReset" :disabled="processing">重置</el-button>
                            </div>
                        </el-form-item>
                    </el-form>
                </el-card>
            </div>

            <!-- 右侧：结果显示区域 -->
            <div class="right-panel">
                <el-card class="panel-card result-card" shadow="hover">
                    <div class="result-header">
                        <h3>告别不可控，只为你的创意锦上添花。</h3>
                    </div>
                    <div class="result-content">
                        <div v-if="!resultImageUrl && !processing" class="result-placeholder">
                            <i class="el-icon-picture-outline"></i>
                            <p>生成的结果将显示在这里</p>
                        </div>
                        <div v-if="processing" class="result-loading">
                            <i class="el-icon-loading"></i>
                            <p>正在处理中，请稍候...</p>
                        </div>
                        <div v-if="resultImageUrl && !processing" class="result-image-wrapper">
                            <img :src="resultImageUrl" alt="风格迁移结果" class="result-image">
                            <div class="result-actions">
                                <el-button type="primary" @click="downloadResult" :loading="downloading">
                                    <i class="el-icon-download"></i> 下载结果
                                </el-button>
                            </div>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>
    </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
    name: 'StyleTransfer',
    data() {
        return {
            // 后端API配置
            // 如果后端API和前端在同一域名（通过nginx代理），设置为空字符串使用相对路径
            // 如果后端API在不同域名，设置为完整的后端地址，例如：'http://your-backend-url:3000'
            apiBaseUrl: '', // 空字符串表示使用相对路径，通过axios的baseURL配置
            uploadAction: '', // Element UI upload组件不需要action
            // 内容图片
            contentFile: null,
            contentPreviewUrl: '',
            contentDialogVisible: false,
            contentFileList: [], // Element UI upload组件的文件列表
            contentClass: {
                uploadShow: true,
                uploadHide: false
            },
            // 风格图片（预设）
            styleFile: null,
            stylePreviewUrl: '',
            styleDialogVisible: false,
            selectedStyleIndex: null, // 当前选中的预设风格索引
            // 预设风格图片列表 - 使用占位符或移除
            stylePresets: [
                // 如果图片文件不存在，可以移除这些预设或使用占位符
                // {
                //     name: '参考图1',
                //     url: require('@/assets/images/reference1.jpg'),
                //     id: 'reference1'
                // },
                // {
                //     name: '参考图2',
                //     url: require('@/assets/images/reference2.jpg'),
                //     id: 'reference2'
                // },
                // {
                //     name: '参考图3',
                //     url: require('@/assets/images/reference3.jpg'),
                //     id: 'reference3'
                // }
            ],
            // 表单数据
            form: {
                styleStrength: 0.5, // 风格强度，0.1-1.0
                useOss: false // 是否使用OSS存储（如果后端未安装ali-oss，请设置为false）
            },
            // 处理状态
            processing: false,
            downloading: false,
            // 结果
            resultImageUrl: null,
            resultImageData: null // 存储完整的响应数据
        };
    },
    computed: {
        canProcess() {
            return this.contentFile && this.styleFile && !this.processing;
        }
    },
    mounted() {
        // 检查是否有从Creation页面传递的内容图片
        this.loadContentImageFromStorage();
        
        // 可选：检查服务状态
        // this.checkServiceStatus().then(status => {
        //     if (!status.available) {
        //         console.warn('风格迁移服务可能不可用');
        //     }
        // });
    },
    methods: {
        // 从localStorage加载内容图片
        loadContentImageFromStorage() {
            const base64Image = localStorage.getItem('styleTransferContentImage');
            if (base64Image) {
                try {
                    // 将base64转换为File对象
                    const file = this.base64ToFile(base64Image, 'content-image.jpg');
                    
                    // 创建预览URL（用于显示）
                    this.contentPreviewUrl = base64Image;
                    
                    // 设置文件对象
                    this.contentFile = file;
                    this.contentClass.uploadHide = true;
                    this.contentClass.uploadShow = false;
                    
                    // 创建Element UI upload组件需要的文件对象格式
                    const uploadFile = {
                        uid: Date.now(),
                        name: 'content-image.jpg',
                        status: 'success',
                        url: base64Image,
                        raw: file
                    };
                    
                    // 添加到文件列表
                    this.contentFileList = [uploadFile];
                    
                    // 清除localStorage
                    localStorage.removeItem('styleTransferContentImage');
                    
                    ElMessage.success('已自动加载画布内容图片');
                } catch (error) {
                    console.error('加载内容图片失败:', error);
                    localStorage.removeItem('styleTransferContentImage');
                    ElMessage.warning('加载画布图片失败');
                }
            }
        },
        
        // 将base64转换为File对象
        base64ToFile(base64, filename) {
            // 提取base64数据部分（去掉data:image/jpeg;base64,前缀）
            const arr = base64.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            return new File([u8arr], filename, { type: mime });
        },
        
        // 内容图片处理
        handleContentChange(file, fileList) {
            // 更新文件列表
            this.contentFileList = fileList;
            
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                ElMessage.error('内容图片大小不能超过 5MB!');
                this.$refs['content-upload'].clearFiles();
                this.contentFileList = [];
                return false;
            }
            this.contentClass.uploadHide = true;
            this.contentClass.uploadShow = false;
            this.contentFile = file.raw;
            // 生成预览地址，显示原比例图片
            try {
                if (file && file.raw) {
                    this.contentPreviewUrl = URL.createObjectURL(file.raw);
                }
            } catch (e) {
                // 兜底：使用已有的url或response
                this.contentPreviewUrl = file.url || this.contentPreviewUrl;
            }
            return true;
        },
        handleContentRemove(file, fileList) {
            this.contentClass.uploadShow = true;
            this.contentClass.uploadHide = false;
            this.contentFile = null;
            this.contentFileList = fileList;
            this.contentPreviewUrl = '';
        },
        handleContentPreview(file) {
            this.contentPreviewUrl = file.url;
            this.contentDialogVisible = true;
        },
        
        // 选择预设风格图片
        async selectStylePreset(preset, index) {
            this.selectedStyleIndex = index;
            
            try {
                this.stylePreviewUrl = preset.url;
                
                // 从本地资源URL获取图片并转换为File对象
                // require() 返回的路径会被webpack处理，可以直接fetch
                const response = await fetch(preset.url);
                const blob = await response.blob();
                const file = new File([blob], `${preset.id}.jpg`, { type: 'image/jpeg' });
                
                this.styleFile = file;
                ElMessage.success(`已选择：${preset.name}`);
            } catch (error) {
                console.error('加载预设风格图片失败:', error);
                ElMessage.error('加载风格图片失败，请重试');
            }
        },
        
        // 预览风格图片（保留用于可能的预览功能）
        handleStylePreview() {
            if (this.stylePreviewUrl) {
                this.styleDialogVisible = true;
            }
        },

        // 格式化工具提示
        formatTooltip(val) {
            return `风格强度: ${val}`;
        },

        // 处理风格迁移 - 调用后端API
        async handleProcess() {
            if (!this.canProcess) {
                ElMessage.warning('请先上传内容图片和风格图片');
                return;
            }

            this.processing = true;
            this.resultImageUrl = null;
            this.resultImageData = null;

            try {
                // 构建FormData - 参照阿里云视觉开放平台API文档
                const formData = new FormData();
                formData.append('content_image', this.contentFile);
                formData.append('style_image', this.styleFile);
                // 添加风格强度参数（阿里云API支持）
                formData.append('style_strength', this.form.styleStrength.toString());
                
                // 可选：如果后端支持use_oss参数
                if (this.form.useOss) {
                    formData.append('use_oss', 'true');
                }

                // 调用后端API（后端会调用阿里云视觉开放平台API）
                // 如果apiBaseUrl为空，使用相对路径（通过axios的baseURL配置）
                // 如果apiBaseUrl不为空，使用完整URL
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/style-transfer`
                    : '/style-transfer';

                const response = await this.$http.post(apiUrl, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    timeout: 120000 // 2分钟超时，风格迁移可能需要较长时间
                });

                // 处理响应 - 支持两种格式：
                // 1. 标准格式：{ code: 0, message: {...} }
                // 2. 阿里云格式：{ desc: "success", result_url: "...", data: { ResultUrl: "..." } }
                const responseData = response.data;
                let imageUrl = null;
                
                // 检查标准格式（code === 0）
                if (responseData && responseData.code === 0) {
                    const resultMessage = responseData.message || responseData.data;
                    
                    // 优先级：OSS URL > 本地URL > base64 > 阿里云ResultUrl
                    if (resultMessage && resultMessage.result_image_oss_url) {
                        imageUrl = resultMessage.result_image_oss_url;
                    } else if (resultMessage && resultMessage.result_image_url) {
                        const baseUrl = this.apiBaseUrl || '';
                        imageUrl = baseUrl + resultMessage.result_image_url;
                    } else if (resultMessage && resultMessage.result_image_base64) {
                        if (resultMessage.result_image_base64.startsWith('data:')) {
                            imageUrl = resultMessage.result_image_base64;
                        } else {
                            imageUrl = `data:image/jpeg;base64,${resultMessage.result_image_base64}`;
                        }
                    } else if (resultMessage && resultMessage.ResultUrl) {
                        // 阿里云API返回的ResultUrl
                        imageUrl = resultMessage.ResultUrl;
                    }
                    
                    if (imageUrl) {
                        this.resultImageUrl = imageUrl;
                        this.resultImageData = resultMessage;
                        ElMessage.success('风格迁移成功！');
                    } else {
                        throw new Error('未获取到结果图片');
                    }
                }
                // 检查阿里云格式（desc === "success"）
                else if (responseData && responseData.desc === 'success') {
                    // 阿里云API响应格式：{ desc: "success", result_url: "...", data: { ResultUrl: "..." } }
                    imageUrl = responseData.result_url || (responseData.data && responseData.data.ResultUrl);
                    
                    if (imageUrl) {
                        this.resultImageUrl = imageUrl;
                        this.resultImageData = responseData.data || responseData;
                        ElMessage.success('风格迁移成功！');
                    } else {
                        throw new Error('未获取到结果图片');
                    }
                }
                // 处理错误
                else {
                    const errorMsg = responseData?.message || responseData?.desc || '处理失败';
                    
                    // 如果错误与OSS相关，自动禁用OSS并重试
                    if (errorMsg.includes('ali-oss') || errorMsg.includes('OSS')) {
                        console.warn('检测到OSS错误，自动禁用OSS并重试...');
                        this.form.useOss = false;
                        ElMessage.warning('OSS服务不可用，已自动切换到本地存储模式');
                        setTimeout(() => {
                            this.handleProcess();
                        }, 500);
                        return;
                    }
                    
                    // 检查是否是服务连接错误
                    let userFriendlyMsg = errorMsg;
                    if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('127.0.0.1:5000') || errorMsg.includes('connect')) {
                        userFriendlyMsg = '风格迁移服务未启动，请检查后端服务是否运行在 5000 端口';
                    } else if (errorMsg.includes('InvalidParameter') || errorMsg.includes('InvalidImage')) {
                        userFriendlyMsg = '图片参数错误，请检查图片格式和大小';
                    } else if (errorMsg.includes('QuotaExceeded')) {
                        userFriendlyMsg = 'API调用配额已用完，请稍后再试';
                    }
                    
                    ElMessage.error(userFriendlyMsg);
                    console.error('风格迁移失败:', responseData);
                }
            } catch (error) {
                console.error('风格迁移错误:', error);
                
                let errorMessage = '处理失败，请稍后重试';
                
                if (error.response) {
                    // 后端返回的错误
                    const errorData = error.response.data;
                    const errorMsg = errorData?.message || errorData?.desc || '';
                    
                    // 如果错误与OSS相关，自动禁用OSS并重试
                    if (errorMsg.includes('ali-oss') || errorMsg.includes('OSS')) {
                        console.warn('检测到OSS错误，自动禁用OSS并重试...');
                        this.form.useOss = false;
                        // 自动重试（不发送use_oss参数）
                        ElMessage.warning('OSS服务不可用，已自动切换到本地存储模式');
                        // 重新调用处理函数
                        setTimeout(() => {
                            this.handleProcess();
                        }, 500);
                        return;
                    }
                    
                    // 检查是否是服务连接错误
                    if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('127.0.0.1:5000') || errorMsg.includes('connect')) {
                        errorMessage = '风格迁移服务未启动，请检查后端服务是否运行在 5000 端口';
                    } else if (errorMsg.includes('InvalidParameter') || errorMsg.includes('InvalidImage')) {
                        errorMessage = '图片参数错误，请检查图片格式和大小';
                    } else if (errorMsg.includes('QuotaExceeded')) {
                        errorMessage = 'API调用配额已用完，请稍后再试';
                    } else if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData && errorData.desc) {
                        errorMessage = errorData.desc;
                    }
                } else if (error.code === 'ECONNABORTED') {
                    errorMessage = '处理超时，请稍后重试';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                ElMessage.error(errorMessage);
            } finally {
                this.processing = false;
            }
        },
        
        // 检查服务状态（可选功能）
        async checkServiceStatus() {
            try {
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/style-transfer/status`
                    : '/style-transfer/status';
                
                const response = await this.$http.get(apiUrl);
                
                if (response.data && response.data.code === 0) {
                    return response.data.message;
                } else {
                    console.warn('服务状态检查失败:', response.data);
                    return { available: false };
                }
            } catch (error) {
                console.error('检查服务状态失败:', error);
                return { available: false };
            }
        },

        // 下载结果
        async downloadResult() {
            if (!this.resultImageUrl) return;

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
                    link.download = `style_transfer_${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    // 普通URL下载
                    const link = document.createElement('a');
                    link.href = this.resultImageUrl;
                    link.download = `style_transfer_${Date.now()}.jpg`;
                    link.target = '_blank'; // 对于跨域URL，在新窗口打开
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                
                ElMessage.success('下载成功');
            } catch (error) {
                console.error('下载错误:', error);
                ElMessage.error('下载失败，请重试');
            } finally {
                this.downloading = false;
            }
        },

        // 重置
        handleReset() {
            this.contentFile = null;
            this.styleFile = null;
            this.resultImageUrl = null;
            this.contentFileList = [];
            this.contentPreviewUrl = '';
            this.stylePreviewUrl = '';
            this.selectedStyleIndex = null;
            this.contentClass.uploadShow = true;
            this.contentClass.uploadHide = false;
            this.form.styleStrength = 0.5;
            
            // 清空上传列表
            if (this.$refs['content-upload']) {
                this.$refs['content-upload'].clearFiles();
            }
            
            ElMessage.info('已重置');
        }
    }
};
</script>

<style scoped>
.container {
    width: 100%;
    height: calc(100vh - 72px - 80px);
    min-height: calc(100vh - 72px - 80px);
    padding: 24px;
    box-sizing: border-box;
    background: #f7f8fa;
    display: flex;
    flex-direction: column;
}


.main-layout {
    display: flex;
    gap: 24px;
    width:100%;
    margin: 0 auto;
    align-items: stretch;
    height: 100%;
    min-height: calc(100vh - 152px);
    flex: 1;
}

/* 左侧面板 - 窄一些 */
.left-panel {
    flex: 0 0 320px;
    min-width: 380px;
    max-width: 380px;
    height: 100%;
}

/* 右侧面板 - 宽一些 */
.right-panel {
    flex: 1;
    min-width: 1080px;
    height: 100%;
    min-height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
}

.panel-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
}

.result-card {
    height: 100%;
    min-height: 100%;
    flex: 1;
}

.result-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ec;
}

.result-header h3 {
    margin: 0;
    font-size: 18px;
    color: #1c345e;
    font-weight: 600;
}

.result-content {
    flex: 1;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.result-placeholder {
    text-align: center;
    color: #98a2b3;
}

.result-placeholder i {
    font-size: 64px;
    margin-bottom: 16px;
    display: block;
}

.result-placeholder p {
    margin: 0;
    font-size: 14px;
}

.result-loading {
    text-align: center;
    color: #019AD8;
}

.result-loading i {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
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

.result-loading p {
    margin: 0;
    font-size: 14px;
}

.result-image-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.result-image {
    max-width: 100%;
    max-height: 70vh;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    object-fit: contain;
}

.result-actions {
    display: flex;
    gap: 12px;
}

.upload-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
    margin: 0;
}

.upload-label {
    font-weight: 600;
    color: #344054;
    font-size: 14px;
    margin-bottom: 4px;
}

.upload-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
}

/* 原比例预览渲染 */
.content-preview-inline {
    width: 100%;
    max-width: 20rem; /* 不超过上传框宽度 */
    height: 15rem; /* 固定高度，与上传框一致 */
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #fafafa;
}

.content-image-inline {
    width: 100%;
    height: 100%;
    max-width: 20rem;
    max-height: 15rem;
}

/* 确保上传组件占满容器宽度 - 使用更具体的选择器 */
.left-panel .upload-section  :deep( .el-upload,)
.left-panel .upload-section  :deep(.el-upload--picture-card) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 100% !important;
    box-sizing: border-box !important;
}

.left-panel .upload-section  :deep(.el-upload-list--picture-card) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 100% !important;
    display: block !important;
    box-sizing: border-box !important;
}

.left-panel .upload-section  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 100% !important;
    box-sizing: border-box !important;
}

/* 确保上传组件左对齐，移除默认margin */
.left-panel .upload-section  :deep( .el-upload,)
.left-panel .upload-section  :deep(.el-upload-list--picture-card) {
    margin: 0 !important;
}

.left-panel .upload-section  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    margin: 0 !important;
}

.upload-hint {
    width: 100%;
    text-align: left;
    margin-bottom: 8px;
}

.hint-text {
    color: #98a2b3;
    font-size: 12px;
    margin: 0;
}


/* 风格选择器 - 单张预览卡片 */
.style-selector {
    width: 100%;
}

.style-preview-card {
    width: 100%;
    height: 12rem;
    border: 2px solid #dcdfe6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.style-preview-card:hover {
    border-color: #019AD8;
    box-shadow: 0 2px 8px rgba(1, 154, 216, 0.2);
}

.style-preview-card.selected {
    border-color: #019AD8;
    border-width: 3px;
}

.style-placeholder {
    text-align: center;
    color: #98a2b3;
}

.style-placeholder i {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
}

.style-placeholder p {
    margin: 0;
    font-size: 14px;
}

.style-selected {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.selected-style-image {
    width: 100%;
    height: calc(12rem - 40px);
    object-fit: cover;
}

.selected-style-name {
    padding: 8px;
    text-align: center;
    font-size: 14px;
    color: #344054;
    font-weight: 500;
    background-color: #f9fafb;
    border-top: 1px solid #e4e7ec;
}

/* 行内风格选择器样式 */
.style-presets-container {
    display: flex;
    gap: 16px;
    width: 100%;
    margin-top: 12px;
}

.style-preset-item-inline {
    position: relative;
    cursor: pointer;
    border: 2px solid #dcdfe6;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    background-color: #fff;
    width: 5rem;
    height: 5rem;
    display: block;
    padding: 0;
    margin: 0;
}

.style-preset-item-inline:hover {
    border-color: #019AD8;
    box-shadow: 0 2px 8px rgba(1, 154, 216, 0.2);
    transform: translateY(-2px);
}

.style-preset-item-inline.selected {
    border-color: #019AD8;
    border-width: 3px;
    box-shadow: 0 4px 12px rgba(1, 154, 216, 0.3);
}

.preset-image-wrapper {
    position: relative;
    width: 5rem;
    height: 5rem; /* 固定高度 */
}

.preset-image-inline {
    position: absolute;
    top: 0;
    left: 0;
    width: 5rem;
    height: 5rem;
    object-fit: cover;
}

.preset-overlay-inline {
    position: absolute;
    top: 0;
    left: 0;
    width: 5rem;
    height: 5rem;
    background-color: rgba(1, 154, 216, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
}

.style-preset-item-inline.selected .preset-overlay-inline {
    opacity: 1;
}

.preset-overlay-inline i {
    font-size: 32px;
    color: #019AD8;
    font-weight: bold;
}

.preset-name-inline {
    padding: 10px;
    text-align: center;
    font-size: 13px;
    color: #344054;
    font-weight: 500;
    background-color: #f9fafb;
    margin-top: auto;
}

.params-row {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.param-label {
    font-weight: 600;
    color: #344054;
    font-size: 14px;
    margin-bottom: 4px;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.btn-process {
    width: 100%;
}

/* 确保上传区域容器占满宽度 */
.upload-section {
    width: 100% !important;
    display: block !important;
    box-sizing: border-box !important;
}

/* 上传框样式 - 增大尺寸，宽高比4:3，宽度100% */
.left-panel  :deep( .el-upload,)
.left-panel  :deep( .el-upload--picture-card,)
.left-panel  :deep(.el-upload-list--picture-card .el-upload) {
    width: 20rem !important;
    max-width: 20rem !important;
    min-width: 20rem !important;
    height: 15rem !important;
    line-height: 15rem !important;
    box-sizing: border-box !important;
    display: block !important;
}

/* 修复上传列表项宽度 */
.left-panel  :deep(.el-upload-list--picture-card) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 100% !important;
    display: block !important;
    box-sizing: border-box !important;
}

.left-panel  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 100% !important;
    height: 12rem !important;
    line-height: 12rem !important;
    box-sizing: border-box !important;
    margin: 0 !important;
}

.left-panel  :deep(.uploadHide .el-upload) {
    display: none;
}

/* 移除输入框阴影 */
.panel-card  :deep( .el-input__inner,)
.panel-card  :deep( .el-textarea__inner,)
.panel-card  :deep(.el-select .el-input__inner) {
    box-shadow: none !important;
}

/* 表单项样式调整 */
.left-panel  :deep(.el-form-item) {
    margin-bottom: 24px;
}

.left-panel  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #344054;
}

/* 确保表单项内容左对齐，统一左右边距 */
.left-panel  :deep(.el-form-item__content) {
    margin-left: 0 !important;
    padding: 0;
}

.left-panel  :deep(.el-card__body) {
    padding: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .main-layout {
        flex-direction: column;
    }
    
    .left-panel {
        flex: 1;
        width: 100%;
        min-width: 0;
        height: auto;
    }
    
    .right-panel {
        width: 100%;
        height: 100%;
    }
}

@media (max-width: 768px) {
    .content-preview-inline {
        max-width: 100%;
        height: 10.5rem; /* 移动端上传框高度 */
    }
    
    .content-image-inline {
        max-height: 10.5rem;
    }
    
    .header h1 {
        font-size: 20px;
    }
    
    .left-panel  :deep( .uploadShow .el-upload,)
    .left-panel  :deep(.uploadHide .el-upload-list--picture-card .el-upload-list__item) {
        width: 100% !important;
        height: 10.5rem !important;
        line-height: 10.5rem !important;
    }
    
    .style-preview-card {
        height: 10.5rem;
    }
    
    .selected-style-image {
        height: calc(10.5rem - 40px);
    }
    
    .result-image {
        max-height: 50vh;
    }
}
</style>

