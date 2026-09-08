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

                        <!-- 优化描述 + 场景标签 -->
                        <el-form-item required>
                            <div class="upload-item">
                                <div class="upload-label">{{ $t('styleTransferPage.promptLabel') }}</div>
                                <el-input
                                    v-model="form.optimizationPrompt"
                                    type="textarea"
                                    :rows="3"
                                    :placeholder="$t('styleTransferPage.promptPlaceholder')"
                                    :disabled="processing"
                                    resize="none"
                                    @input="onPromptInput"
                                />
                                <p class="hint-text">{{ $t('styleTransferPage.scenarioHint') }}</p>
                                <div class="scenario-tags">
                                    <button
                                        v-for="s in scenarios"
                                        :key="s.id"
                                        type="button"
                                        class="scenario-tag"
                                        :class="{ active: selectedScenarioId === s.id }"
                                        :disabled="processing"
                                        @click="selectTag(s)"
                                    >
                                        {{ s.name }}
                                    </button>
                                </div>
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
                            <p>{{ $t('styleTransferPage.generating') || '正在生成中，请稍候…' }}</p>
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
import { SCENARIO_IDS } from '@/data/styleTransferPresets'
import { generateStyleTransfer } from '@/utils/styleTransfer/api'

export default {
    name: 'StyleTransfer',
    data() {
        return {
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
            uploadAction: '',
            contentFile: null,
            contentPreviewUrl: '',
            contentDialogVisible: false,
            contentFileList: [],
            contentClass: {
                uploadShow: true,
                uploadHide: false
            },
            selectedScenarioId: '',
            form: {
                optimizationPrompt: ''
            },
            processing: false,
            downloading: false,
            resultImageUrl: null,
            resultImageData: null
        };
    },
    computed: {
        scenarios() {
            return SCENARIO_IDS.map((id) => ({
                id,
                name: this.$t(`styleTransferPage.scenarios.${id}.name`),
                prompt: this.$t(`styleTransferPage.scenarios.${id}.prompt`),
            }))
        },
        canProcess() {
            return (
                this.contentFile &&
                this.form.optimizationPrompt.trim() &&
                !this.processing
            )
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
            const base64Image =
                localStorage.getItem('styleTransferContentImage') ||
                sessionStorage.getItem('styleTransferContentImage');
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
                    sessionStorage.removeItem('styleTransferContentImage');
                    
                    ElMessage.success('已自动加载画布内容图片');
                    this.applyDefaultScenarioIfNeeded();
                } catch (error) {
                    console.error('加载内容图片失败:', error);
                    localStorage.removeItem('styleTransferContentImage');
                    sessionStorage.removeItem('styleTransferContentImage');
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
            this.applyDefaultScenarioIfNeeded();
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

        applyDefaultScenarioIfNeeded() {
            if (!this.contentFile || this.form.optimizationPrompt.trim()) return
            const first = this.scenarios[0]
            if (first) this.selectTag(first)
        },

        onPromptInput() {
            const text = this.form.optimizationPrompt.trim()
            const match = this.scenarios.find((s) => s.prompt === text)
            this.selectedScenarioId = match ? match.id : ''
        },

        selectTag(scenario) {
            if (!scenario?.id) return
            this.selectedScenarioId = scenario.id
            this.form.optimizationPrompt = scenario.prompt
            ElMessage.success(
                this.$t('styleTransferPage.scenarioSelected', { name: scenario.name })
            )
        },

        normalizeApiError(raw) {
            if (raw == null || raw === '') return ''
            if (typeof raw === 'string') return raw
            if (typeof raw === 'object') {
                const nested = raw.message ?? raw.msg ?? raw.error ?? raw.desc
                if (nested != null && nested !== raw) {
                    const s = this.normalizeApiError(nested)
                    if (s) return s
                }
                try {
                    return JSON.stringify(raw)
                } catch (_) {
                    return '生成失败，请重试'
                }
            }
            return String(raw)
        },

        async handleProcess() {
            if (!this.canProcess) {
                ElMessage.warning(this.$t('styleTransferPage.needContentAndScenario'));
                return;
            }

            this.processing = true;
            this.resultImageUrl = null;
            this.resultImageData = null;

            try {
                const { imageUrl, message } = await generateStyleTransfer(
                    this.$http,
                    {
                        imageFile: this.contentFile,
                        prompt: this.form.optimizationPrompt.trim(),
                    },
                    { apiBaseUrl: this.apiBaseUrl }
                )

                if (message && typeof message === 'object' && message.points !== undefined && this.$store?.state) {
                    this.$store.commit('setUserInfo', {
                        ...(this.$store.state.userInfo || {}),
                        points: message.points,
                    })
                }

                this.resultImageUrl = imageUrl
                this.resultImageData = message
                ElMessage.success(this.$t('styleTransferPage.generateSuccess') || '优化成功！')
            } catch (error) {
                console.error('AI优化失败:', error)
                let errorMessage = this.$t('styleTransferPage.generateFailed') || '生成失败，请稍后重试'

                if (error.response) {
                    const status = error.response.status
                    const data = error.response.data
                    if (status === 401) errorMessage = '未授权，请先登录'
                    else if (status === 403) errorMessage = '无权限访问'
                    else if (status === 404) errorMessage = 'API接口不存在'
                    else {
                        errorMessage = this.normalizeApiError(data?.message ?? data?.error) || errorMessage
                    }
                } else if (error.code === 'ECONNABORTED') {
                    errorMessage = '生成超时，请稍后重试'
                } else if (error.message) {
                    errorMessage = error.message
                }

                ElMessage.error(errorMessage)
            } finally {
                this.processing = false;
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
            this.resultImageUrl = null;
            this.contentFileList = [];
            this.contentPreviewUrl = '';
            this.selectedScenarioId = '';
            this.form.optimizationPrompt = '';
            this.contentClass.uploadShow = true;
            this.contentClass.uploadHide = false;
            
            if (this.$refs['content-upload']) {
                this.$refs['content-upload'].clearFiles();
            }
            
            ElMessage.info(this.$t('styleTransferPage.resetDone'));
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
    margin: 0 0 8px;
    line-height: 1.5;
}

.scenario-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
}

.scenario-tag {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border: 1px solid #d0d5dd;
    border-radius: 999px;
    background: #fff;
    color: #344054;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
    font-family: inherit;
    line-height: 1.4;
}

.scenario-tag:hover:not(:disabled) {
    border-color: #019AD8;
    color: #019AD8;
    background: #f0f9ff;
}

.scenario-tag.active {
    border-color: #019AD8;
    background: #019AD8;
    color: #fff;
}

.scenario-tag:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.prompt-textarea :deep(.el-textarea__inner) {
    box-shadow: none !important;
}

.style-ref-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #f9fafb;
    border: 1px solid #e4e7ec;
}

.style-ref-preview img {
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
}

.style-ref-preview span {
    font-size: 13px;
    color: #475467;
}

.custom-style-row {
    margin-top: 10px;
}

.custom-style-input {
    display: none;
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

