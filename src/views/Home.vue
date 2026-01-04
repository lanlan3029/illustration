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
                { key: 'penLineArt', id: 1, image: require('@/assets/prompt/1.png') },
                { key: 'colorfulOutlineRomanticism', id: 6, image: require('@/assets/prompt/6.png') },
                { key: 'crayonNoiseHandDrawn', id: 15, image: require('@/assets/prompt/15.png') },
                { key: 'vintageSketch', id: 17, image: require('@/assets/prompt/17.png') },
                { key: 'pixarStyle', id: 5, image: require('@/assets/prompt/5.png') },
                { key: 'engravingLines', id: 7, image: require('@/assets/prompt/7.png') },
                { key: 'pencilSketch3D', id: 16, image: require('@/assets/prompt/16.png') },
                { key: 'feltCollage', id: 18, image: require('@/assets/prompt/18.png') },
                { key: 'blackWhiteDoodle', id: 2, image: require('@/assets/prompt/2.png') },
                { key: 'collageIllustration', id: 4, image: require('@/assets/prompt/4.png') },
                { key: 'rusticHandDrawn', id: 8, image: require('@/assets/prompt/8.png') },
                { key: 'maximalistCopperplate', id: 9, image: require('@/assets/prompt/9.png') },
                { key: 'doodleSoul', id: 10, image: require('@/assets/prompt/10.png') },
                { key: 'keithHaringDoodle', id: 11, image: require('@/assets/prompt/11.png') },
                { key: 'abstractFlatDesign', id: 12, image: require('@/assets/prompt/12.png') },
                { key: 'simpleCartoon', id: 13, image: require('@/assets/prompt/13.png') },
                { key: 'healingWatercolor', id: 14, image: require('@/assets/prompt/14.png') },
                { key: 'oilPainting', id: 19, image: require('@/assets/prompt/19.png') }
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
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M832 384H576V128H192v768h640V384zm-26.496-64L640 154.496V320h165.504zM160 64h448l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32zm160 448h384v64H320v-64zm0-192h192v64H320v-64zm0 384h384v64H320v-64z'/%3E%3C/svg%3E");
}

/* 创作角色 - 用户图标 */
.feature-card.icon-card-user :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M512 512a192 192 0 1 0 0-384 192 192 0 0 0 0 384zm0 64a256 256 0 1 1 0-512 256 256 0 0 1 0 512zm320 320v-96a96 96 0 0 0-96-96H288a96 96 0 0 0-96 96v96a32 32 0 1 1-64 0v-96a160 160 0 0 1 160-160h448a160 160 0 0 1 160 160v96a32 32 0 1 1-64 0z'/%3E%3C/svg%3E");
}

/* 创作组图 - 图片组图标 */
.feature-card.icon-card-images :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64zm384-578.304V704h-64V247.296L237.248 490.944 188.608 442.24 512 128.896l323.392 313.344-48.64 48.704L544 253.696zM352 192a32 32 0 1 1 0 64 32 32 0 0 1 0-64z'/%3E%3C/svg%3E");
}

/* 创作插画 - 画板图标 */
.feature-card.icon-card-edit :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M832 64H192a96 96 0 0 0-96 96v704a96 96 0 0 0 96 96h640a96 96 0 0 0 96-96V160a96 96 0 0 0-96-96zM192 128h640a32 32 0 0 1 32 32v704a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32z'/%3E%3Cpath fill='%23409eff' d='M256 256h512v512H256V256zm64 64v384h384V320H320z'/%3E%3Cpath fill='%23409eff' d='M128 896h768a32 32 0 1 1 0 64H128a32 32 0 1 1 0-64z'/%3E%3C/svg%3E");
}

/* 布局创作插画 - 网格布局图标 */
.feature-card.icon-card-layout :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M149.333 149.333h213.334v213.334H149.333V149.333zM405.333 149.333h469.334v213.334H405.333V149.333zM149.333 405.333h213.334v469.334H149.333V405.333zM405.333 405.333h469.334v213.334H405.333V405.333zM405.333 661.333h469.334v213.334H405.333V661.333z'/%3E%3C/svg%3E");
}

/* 合成绘本 - 组合/合成图标 */
.feature-card.icon-card-compose :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%23409eff' d='M832 384H576V128H192v768h640V384zm-26.496-64L640 154.496V320h165.504zM160 64h448l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32zm160 448h384v64H320v-64zm0-192h192v64H320v-64zm0 384h384v64H320v-64z'/%3E%3Cpath fill='%23409eff' d='M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640V512z'/%3E%3C/svg%3E");
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

