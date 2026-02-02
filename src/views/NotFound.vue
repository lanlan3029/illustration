<template>
    <div class="not-found-container">
        <div class="not-found-content">
            
           
            <div class="error-image-wrapper">
                <el-image 
                    :src="errorImg" 
                    fit="contain" 
                    class="error-image"
                    :lazy="true">
                    <template #error>
                        <div class="image-placeholder">
                            <el-icon :size="120" color="#c0c4cc">
                                <PictureFilled />
                            </el-icon>
                        </div>
                    </template>
                </el-image>
               
            </div>
            <p class="error-description">{{ $t('notFound.description') }}</p>
            <div class="action-buttons">

                <el-button 
                plain 
                    size="large"
                    @click="goHome"
                    class="home-button">
                    <el-icon><HomeFilled /></el-icon>
                    {{ $t('notFound.backHome') }}
                </el-button>
                <el-button 
                    size="large"
                    @click="goBack"
                    class="back-button">
                    <el-icon><ArrowLeftBold /></el-icon>
                    {{ $t('notFound.goBack') }}
                </el-button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { HomeFilled, PictureFilled, ArrowLeftBold } from '@element-plus/icons-vue'

export default {
    name: 'NotFound',
    components: {
        HomeFilled,
        PictureFilled,
        ArrowLeftBold
    },
    setup() {
        const router = useRouter()
        const errorImg = ref(require('../assets/images/error.webp'))
        
        const goHome = () => {
            router.push({ name: 'Home' })
        }
        
        const goBack = () => {
            router.go(-1)
        }
        
        return {
            errorImg,
            goHome,
            goBack
        }
    }
}
</script>

<style scoped>
.not-found-container {
    min-height: calc(100vh - 50px - 40px);
    background: #fafbfc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
}

.not-found-content {
    text-align: center;
    max-width: 500px;
    width: 100%;
    animation: fadeIn 0.5s ease-out;
}



.error-description {
    font-size: 14px;
    color: #909399;
    margin: 0 0 48px 0;
    line-height: 1.6;
}

.error-image-wrapper {
    margin: 32px 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.error-image {
    max-width: 240px;
    max-height: 240px;
    width: 100%;
    height: auto;
    opacity: 0.6;
    transition: opacity 0.3s ease;
}

.error-image:hover {
    opacity: 0.8;
}

.image-placeholder {
    width: 240px;
    height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    border-radius: 8px;
}

.action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 32px;
    flex-wrap: wrap;
}

.home-button,
.back-button {
    min-width: 140px;
    height: 44px;
    font-size: 14px;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.home-button:hover {
    transform: translateY(-1px);
}

.back-button:hover {
    transform: translateY(-1px);
}

.action-buttons :deep(.el-icon) {
    margin-right: 6px;
    font-size: 16px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .not-found-container {
        padding: 40px 20px;
    }
    
    .error-code {
        font-size: 72px;
        margin-bottom: 20px;
    }
    
    .error-title {
        font-size: 20px;
    }
    
    .error-description {
        font-size: 13px;
        margin-bottom: 36px;
    }
    
    .error-image {
        max-width: 180px;
        max-height: 180px;
    }
    
    .image-placeholder {
        width: 180px;
        height: 180px;
    }
    
    .action-buttons {
        flex-direction: column;
        align-items: stretch;
        margin-top: 24px;
    }
    
    .home-button,
    .back-button {
        width: 100%;
    }
}
</style>