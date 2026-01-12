<template>
    <div class="home-container">
        <div class="home-content-wrapper">
            <div class="home-main-content">
                <div class="home-header">
                    <h1 class="main-title">{{ $t('home.welcomeTitle') || '欢迎使用插画创作平台' }}</h1>
                    <p class="subtitle">{{ $t('home.welcomeSubtitle') || '选择您想要使用的创作功能' }}</p>
                </div>

                <div class="features-grid">
            <!-- AI插画 -->
                    <el-card
                class="feature-card icon-card-brush" 
                shadow="hover"
                @click="goToAIPicture">
               
                <h3 class="card-title">{{ $t('nav.aiIllustration') }}</h3>
                <p class="card-description">{{ $t('home.aiIllustrationDesc') || '使用AI技术快速生成精美插画' }}</p>
                    </el-card>
               
            <!-- AI绘本 -->
            <el-card 
                class="feature-card icon-card-book" 
                shadow="hover"
                @click="goToAIBooks">
               
                <h3 class="card-title">{{ $t('nav.aiBooks') }}</h3>
                <p class="card-description">{{ $t('home.aiBooksDesc') || 'AI智能生成绘本故事' }}</p>
            </el-card>

            <!-- 创作角色 -->
            <el-card 
                class="feature-card icon-card-user" 
                shadow="hover"
                @click="goToCreateCharacter">
               
                <h3 class="card-title">{{ $t('nav.createCharacter') }}</h3>
                <p class="card-description">{{ $t('home.createCharacterDesc') || '创作专属角色形象' }}</p>
            </el-card>
                            
            <!-- 创作组图 -->
            <el-card 
                class="feature-card icon-card-images" 
                shadow="hover"
                @click="goToCreateGroupImages">
               
                <h3 class="card-title">{{ $t('nav.createGroupImages') }}</h3>
                <p class="card-description">{{ $t('home.createGroupImagesDesc') || '为角色生成多张组图' }}</p>
            </el-card>

            <!-- 创作插画 -->
            <el-card 
                class="feature-card icon-card-edit" 
                shadow="hover"
                @click="goToCreation">
               
                <h3 class="card-title">{{ $t('nav.createIllustration') }}</h3>
                <p class="card-description">{{ $t('home.createIllustrationDesc') || '自由创作插画作品' }}</p>
            </el-card>

            <!-- 布局创作插画 -->
            <el-card 
                class="feature-card icon-card-layout" 
                shadow="hover"
                @click="goToCreateLayoutIllustration">
                
                <h3 class="card-title">{{ $t('nav.createLayoutIllustration') }}</h3>
                <p class="card-description">{{ $t('home.createLayoutIllustrationDesc') || '使用布局编辑器创作多角色插画' }}</p>
            </el-card>

            <!-- 合成绘本 -->
            <el-card 
                class="feature-card icon-card-compose" 
                shadow="hover"
                @click="goToComposeBook">
               
                <h3 class="card-title">{{ $t('nav.composeBook') }}</h3>
                <p class="card-description">{{ $t('home.composeBookDesc') || '将插画合成为绘本' }}</p>
            </el-card>
                </div>
                            </div>

            <!-- 风格图片滚动区域 - 右侧显示 -->
            <div class="style-images-sidebar">
                <div class="style-images-scroll">
                    <!-- 复制多组图片以确保无缝循环 -->
                    <template v-for="groupIndex in 3" :key="`group-${groupIndex}`">
                        <div 
                            v-for="(row, rowIndex) in imageRows" 
                            :key="`group-${groupIndex}-row-${rowIndex}`"
                            class="style-images-row">
                            <el-image
                                v-for="(style, imgIndex) in row"
                                :key="`group-${groupIndex}-row-${rowIndex}-img-${imgIndex}`"
                                :src="style.image"
                                fit="cover"
                                class="style-bg-image"
                                :lazy="true">
                            </el-image>
                        </div>
                    </template>
                </div>
            </div>
            </div>
    </div>
</template>

<script>
export default {
    name: 'Home',
    data() {
        return {
            // 风格图片配置（与 AIpicture.vue 中的 styleConfigs 保持一致）
            styleImages: [
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
        };
    },
    computed: {
        // 将图片按每行3个分组
        imageRows() {
            const rows = [];
            const imagesPerRow = 3;
            for (let i = 0; i < this.styleImages.length; i += imagesPerRow) {
                rows.push(this.styleImages.slice(i, i + imagesPerRow));
        }
            return rows;
        }
    },
    methods: {
        goToAIPicture() {
            this.$router.push('/ai-picture');
        },
        goToAIBooks() {
            this.$router.push('/AIbooks');
        },
        goToCreateCharacter() {
            this.$router.push('/create-character');
        },
        goToCreateGroupImages() {
            this.$router.push('/create-group-images');
        },
        goToCreation() {
            this.$router.push('/creation');
        },
        goToCreateLayoutIllustration() {
            this.$router.push('/create-layout-illustration');
        },
        goToComposeBook() {
            this.$router.push('/user/upload/compose-illustration');
            }
    }
}
</script>

<style scoped>
.home-container {
    min-height: calc(100vh - 90px);
    padding: 60px 40px;
    position: relative;
    overflow: hidden;
}

.home-content-wrapper {
    display: flex;
    gap: 40px;
    max-width: 1600px;
    margin: 0 auto;
    position: relative;
}

.home-main-content {
    flex: 1;
    min-width: 0;
}

/* 风格图片右侧滚动区域 */
.style-images-sidebar {
    width: 480px;
    flex-shrink: 0;
    position: sticky;
    top: 90px;
    height: calc(100vh - 180px);
    overflow: hidden;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.style-images-scroll {
    display: flex;
    flex-direction: column;
    animation: scrollUp 60s linear infinite;
    will-change: transform;
}

.style-images-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    flex-shrink: 0;
    margin-bottom: 12px;
}

.style-bg-image {
    width: 100%;
    height: 80px;
    border-radius: 8px;
    opacity: 0.6;
    transition: opacity 0.3s ease, transform 0.3s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.style-bg-image:hover {
    opacity: 0.9;
    transform: scale(1.05);
}

@keyframes scrollUp {
    0% {
        transform: translateY(0);
    }
    100% {
        /* 3组图片，动画移动1/3，这样当第一组移出时，第二组正好接上，形成无缝循环 */
        transform: translateY(-33.333%);
    }
}

.home-header {
    text-align: center;
    margin-bottom: 60px;
    position: relative;
    z-index: 1;
}

.main-title {
    font-size: 48px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.subtitle {
    font-size: 18px;
    color: #606266;
    margin: 0;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 30px;
    position: relative;
    z-index: 1;
}

.feature-card {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid #e4e7ed;
    position: relative;
    z-index: 1;
}

.feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
}

/* 使用伪元素添加背景图标 - 通用样式 */
.feature-card[class*="icon-card-"] {
    position: relative;
    overflow: hidden;
}

.feature-card[class*="icon-card-"] :deep(.el-card__body) {
    position: relative;
    z-index: 1;
}

.feature-card[class*="icon-card-"] :deep(.el-card__body)::after {
    content: '';
    position: absolute;
    bottom: -10px;
    right: -10px;
    width: 100px;
    height: 100px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.1;
    pointer-events: none;
    transform: rotate(-15deg);
    z-index: 0;
}

/* AI插画 - 图片图标 */
.feature-card.icon-card-brush :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M864 256H160a32 32 0 0 0-32 32v448a32 32 0 0 0 32 32h704a32 32 0 0 0 32-32V288a32 32 0 0 0-32-32zM160 832a96 96 0 0 1-96-96V288a96 96 0 0 1 96-96h704a96 96 0 0 1 96 96v448a96 96 0 0 1-96 96H160z'/%3E%3Cpath fill='%23409eff' d='M256 320a64 64 0 1 1 0 128 64 64 0 0 1 0-128zm569.92 155.904L512 768 323.392 475.904a32 32 0 0 0-52.736 0L128 640v128h768V640l-86.08-164.096a32 32 0 0 0-52.736 0z'/%3E%3C/svg%3E");
}

/* AI绘本 - 书本图标 */
.feature-card.icon-card-book :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23409eff' d='M21.17 2.06A13 13 0 0 0 19 1.87a12.94 12.94 0 0 0-7 2.05a12.94 12.94 0 0 0-7-2a13 13 0 0 0-2.17.19a1 1 0 0 0-.83 1v12a1 1 0 0 0 1.17 1a10.9 10.9 0 0 1 8.25 1.91l.12.07h.11a.9.9 0 0 0 .7 0h.11l.12-.07A10.9 10.9 0 0 1 20.83 16A1 1 0 0 0 22 15V3a1 1 0 0 0-.83-.94M11 15.35a12.9 12.9 0 0 0-6-1.48H4v-10a9 9 0 0 1 1 0a10.86 10.86 0 0 1 6 1.8Zm9-1.44h-1a12.9 12.9 0 0 0-6 1.48V5.67a10.86 10.86 0 0 1 6-1.8a9 9 0 0 1 1 0Zm1.17 4.15a13 13 0 0 0-2.17-.19a12.94 12.94 0 0 0-7 2.05a12.94 12.94 0 0 0-7-2.05a13 13 0 0 0-2.17.19A1 1 0 0 0 2 19.21a1 1 0 0 0 1.17.79a10.9 10.9 0 0 1 8.25 1.91a1 1 0 0 0 1.16 0A10.9 10.9 0 0 1 20.83 20a1 1 0 0 0 1.17-.79a1 1 0 0 0-.83-1.15'/%3E%3C/svg%3E");
}

/* 创作角色 - 用户图标 */
.feature-card.icon-card-user :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M512 512a192 192 0 1 0 0-384 192 192 0 0 0 0 384zm0 64a256 256 0 1 1 0-512 256 256 0 0 1 0 512zm320 320v-96a96 96 0 0 0-96-96H288a96 96 0 0 0-96 96v96a32 32 0 1 1-64 0v-96a160 160 0 0 1 160-160h448a160 160 0 0 1 160 160v96a32 32 0 1 1-64 0z'/%3E%3C/svg%3E");
}

/* 创作组图 - 图片组图标 */
.feature-card.icon-card-images :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23409eff' d='M10 13H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1m-1 6H5v-4h4ZM20 3h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1m-1 6h-4V5h4Zm1 7h-2v-2a1 1 0 0 0-2 0v2h-2a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2M10 3H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1M9 9H5V5h4Z'/%3E%3C/svg%3E");
}

/* 创作插画 - 画板图标 */
.feature-card.icon-card-edit :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23409eff' d='M7.42 15.54a1 1 0 0 0 0 1.41a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.41a1 1 0 0 0-1.42 0m0-8.49a1 1 0 0 0 0 1.41a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.41a1 1 0 0 0-1.42 0m4.95 10a1 1 0 1 0 1 1a1 1 0 0 0-1-1.05Zm-6-6a1 1 0 1 0 1 1a1 1 0 0 0-1-1.05Zm6-6a1 1 0 1 0 1 1a1 1 0 0 0-1-1.05Zm3.54 2.05a1 1 0 1 0 1.41 0a1 1 0 0 0-1.41-.05Zm6.3 0a11 11 0 1 0-7.85 15.74a3.87 3.87 0 0 0 2.5-1.65a4.2 4.2 0 0 0 .61-3.19a5.7 5.7 0 0 1-.1-1a5 5 0 0 1 3-4.56a3.84 3.84 0 0 0 2.06-2.25a4 4 0 0 0-.22-3.11Zm-1.7 2.44a1.9 1.9 0 0 1-1 1.09A7 7 0 0 0 15.37 17a7.3 7.3 0 0 0 .14 1.4a2.16 2.16 0 0 1-.31 1.65a1.8 1.8 0 0 1-1.21.8a8.7 8.7 0 0 1-1.62.15a9 9 0 0 1-9-9.28A9.05 9.05 0 0 1 11.85 3h.51a9 9 0 0 1 8.06 5a2 2 0 0 1 .09 1.52ZM12.37 11a1 1 0 1 0 1 1a1 1 0 0 0-1-1'/%3E%3C/svg%3E");
    }

/* 布局创作插画 - 网格布局图标 */
.feature-card.icon-card-layout :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M149.333 149.333h213.334v213.334H149.333V149.333zM405.333 149.333h469.334v213.334H405.333V149.333zM149.333 405.333h213.334v469.334H149.333V405.333zM405.333 405.333h469.334v213.334H405.333V405.333zM405.333 661.333h469.334v213.334H405.333V661.333z'/%3E%3C/svg%3E");
}

/* 合成绘本 - 组合/合成图标 */
.feature-card.icon-card-compose :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23409eff' d='M13 9h-2V7a1 1 0 0 0-2 0v2H7a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2m5 6V5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3M4 15V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1m17-9a1 1 0 0 0-1 1v10a3 3 0 0 1-3 3H7a1 1 0 0 0 0 2h10a5 5 0 0 0 5-5V7a1 1 0 0 0-1-1'/%3E%3C/svg%3E");
}


.card-title {
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px;
    padding: 0 20px;
}

.card-description {
    text-align: center;
    font-size: 14px;
    color: #909399;
    margin: 0 0 30px;
    padding: 0 20px;
    line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .style-images-sidebar {
        display: none;
}

    .home-content-wrapper {
        flex-direction: column;
    }
}

@media (max-width: 768px) {
    .home-container {
        padding: 40px 20px;
    }

    .main-title {
        font-size: 32px;
    }

    .subtitle {
        font-size: 16px;
}

    .features-grid {
        grid-template-columns: 1fr;
        gap: 20px;
}

    .card-icon {
        font-size: 48px;
        padding: 20px 0 15px;
}

    .card-title {
        font-size: 18px;
    }
}
</style>

