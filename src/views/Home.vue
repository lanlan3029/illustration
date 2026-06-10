<template>
    <div class="home-container">
        <div class="home-content-wrapper">
            <div class="home-main-content">
                <div class="home-header">
                    <h1 class="main-title">{{ $t('home.welcomeTitle') || '欢迎使用插画创作平台' }}</h1>
                    <p class="subtitle">{{ $t('home.welcomeSubtitle') || '选择您想要使用的创作功能' }}</p>
                </div>

                <div class="features-grid">
            <!-- AI绘本 -->
            <el-card 
                class="feature-card icon-card-book" 
                shadow="hover"
                @click="goToAIBooks">
               
                <h3 class="card-title">{{ $t('nav.aiBooks') }}</h3>
                <p class="card-description">{{ $t('home.aiBooksDesc') || 'AI智能生成绘本故事' }}</p>
            </el-card>

            <!-- AI插画 -->
                    <el-card
                class="feature-card icon-card-brush" 
                shadow="hover"
                @click="goToAIPicture">
               
                <h3 class="card-title">{{ $t('nav.aiIllustration') }}</h3>
                <p class="card-description">{{ $t('home.aiIllustrationDesc') || '使用AI技术快速生成精美插画' }}</p>
                    </el-card>

            <!-- 创作角色 -->
            <el-card 
                class="feature-card icon-card-user" 
                shadow="hover"
                @click="goToCreateCharacter">
               
                <h3 class="card-title">{{ $t('nav.createCharacter') }}</h3>
                <p class="card-description">{{ $t('home.createCharacterDesc') || '创作专属角色形象' }}</p>
            </el-card>

            <!-- 心情日记 -->
            <el-card 
                class="feature-card icon-card-mood" 
                shadow="hover"
                @click="goToMoodDiary">
               
                <h3 class="card-title">{{ $t('nav.moodDiary') || '心情日记' }}</h3>
                <p class="card-description">{{ $t('home.moodDiaryDesc') || '记录心情，生成专属绘本' }}</p>
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
                { key: 'minimalPopArt', id: 3, image: require('@/assets/prompt/3.webp') },
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
        goToMoodDiary() {
            this.$router.push('/mood-diary');
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
    overflow: visible;
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

/* 心情日记 - 笑脸图标 */
.feature-card.icon-card-mood :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23409eff' d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8M8.5 11a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 8.5 11m7 0a1.5 1.5 0 1 0-1.5-1.5a1.5 1.5 0 0 0 1.5 1.5m.34 3a4 4 0 0 1-7.68 0a1 1 0 0 0-1.92.54a6 6 0 0 0 11.52 0a1 1 0 1 0-1.92-.54'/%3E%3C/svg%3E");
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
        padding: 16px 14px;
        background: var(--kid-bg, #f5f6fb);
        overflow: auto;
    }

    .home-content-wrapper {
        gap: 20px;
    }

    /* Hero 渐变卡片 */
    .home-header {
        margin-bottom: 18px;
        padding: 22px 18px 24px;
        border-radius: var(--kid-radius-lg, 22px);
        background: var(--kid-grad-hero, linear-gradient(135deg, #6a5af9 0%, #b79cf2 100%));
        text-align: left;
        box-shadow: var(--kid-shadow-card, 0 6px 20px -8px rgba(49, 35, 82, 0.18));
    }

    .main-title {
        font-size: 24px;
        line-height: 1.3;
        margin-bottom: 8px;
        color: #fff;
        background: none;
        -webkit-text-fill-color: #fff;
    }

    .subtitle {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.92);
    }

    /* 卡片两列网格 */
    .features-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .feature-card {
        border-radius: var(--kid-radius, 16px);
        border: none;
        background: var(--kid-card, #fff);
        box-shadow: var(--kid-shadow-soft, 0 2px 10px rgba(24, 24, 40, 0.06));
    }

    .feature-card:hover {
        transform: none;
        border-color: transparent;
        box-shadow: var(--kid-shadow-card, 0 6px 20px -8px rgba(49, 35, 82, 0.18));
    }

    .feature-card :deep(.el-card__body) {
        padding: 16px 14px 18px;
    }

    .card-title {
        font-size: 15px;
        text-align: left;
        padding: 0;
        margin-bottom: 6px;
    }

    .card-description {
        font-size: 12px;
        text-align: left;
        padding: 0;
        margin: 0;
        line-height: 1.5;
        color: var(--kid-text-sub, #8a8aa3);
    }

    /* 卡片角标图标更清晰、摆正 */
    .feature-card[class*="icon-card-"] :deep(.el-card__body)::after {
        width: 56px;
        height: 56px;
        bottom: 8px;
        right: 8px;
        opacity: 0.16;
        transform: rotate(0deg);
    }
}
</style>

