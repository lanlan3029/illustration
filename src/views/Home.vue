<template>
    <div class="home-container">
        <div class="home-inner">
            <!-- Hero -->
            <header class="home-hero">
                <h1 class="hero-title">
                    {{ $t('home.welcomeTitle') || '让想象变成美丽的故事' }}
                </h1>
                <p class="hero-subtitle">{{ $t('home.welcomeSubtitle') || '选择您想要使用的创作功能' }}</p>
                <button class="hero-cta" type="button" @click="go('/AIbooks')">
                    {{ $t('home.startCreating') || '开始创作' }}
                    <span class="hero-cta-arrow">↗</span>
                </button>
            </header>

            <!-- 顶部四个功能卡片 -->
            <section class="feature-cards">
                <button
                    v-for="card in featureCards"
                    :key="card.key"
                    type="button"
                    class="feature-card"
                    :class="card.cls"
                    @click="go(card.to)"
                >
                    <span class="feature-rings"></span>
                    <div class="feature-text">
                        <h3 class="feature-name">{{ $t(card.titleKey) }}</h3>
                        <p class="feature-desc">{{ $t(card.descKey) }}</p>
                    </div>
                    <span class="feature-icon">
                        <img :src="card.img" :alt="$t(card.titleKey)" class="feature-icon-img" loading="lazy" />
                    </span>
                </button>
            </section>

            <!-- AI 创作工作台介绍 -->
            <section class="showcase showcase--workbench">
                <div class="showcase-inner">
                    <div class="showcase-content">
                        <span class="showcase-kicker">{{ $t('home.showcaseWorkbenchKicker') }}</span>
                        <h2 class="showcase-title">{{ $t('home.showcaseWorkbenchTitle') }}</h2>
                        <p class="showcase-desc">{{ $t('home.showcaseWorkbenchDesc') }}</p>
                        <ul class="showcase-points">
                            <li v-for="(point, idx) in workbenchPoints" :key="idx">{{ point }}</li>
                        </ul>
                        <button type="button" class="showcase-cta" @click="go('/creation-studio')">
                            {{ $t('home.showcaseWorkbenchCta') }}
                            <span class="showcase-cta-arrow">→</span>
                        </button>
                    </div>
                    <div class="showcase-visual" aria-hidden="true">
                        <div class="mock-workbench">
                            <div class="mock-rail">
                                <span class="mock-rail-item active"></span>
                                <span class="mock-rail-item"></span>
                                <span class="mock-rail-item"></span>
                            </div>
                            <div class="mock-subnav">
                                <span class="mock-line active"></span>
                                <span class="mock-line"></span>
                                <span class="mock-line"></span>
                            </div>
                            <div class="mock-main">
                                <div class="mock-card mock-card--new"></div>
                                <div class="mock-card">
                                    <img :src="workbenchPreview" alt="" />
                                </div>
                                <div class="mock-card">
                                    <img :src="styleImages[5].image" alt="" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- DIY 编辑插画介绍 -->
            <section class="showcase showcase--editor">
                <div class="showcase-inner showcase-inner--reverse">
                    <div class="showcase-content">
                        <span class="showcase-kicker">{{ $t('home.showcaseEditorKicker') }}</span>
                        <h2 class="showcase-title">{{ $t('home.showcaseEditorTitle') }}</h2>
                        <p class="showcase-desc">{{ $t('home.showcaseEditorDesc') }}</p>
                        <ul class="showcase-points">
                            <li v-for="(point, idx) in editorPoints" :key="idx">{{ point }}</li>
                        </ul>
                        <button type="button" class="showcase-cta" @click="go('/editorpro')">
                            {{ $t('home.showcaseEditorCta') }}
                            <span class="showcase-cta-arrow">→</span>
                        </button>
                    </div>
                    <div class="showcase-visual" aria-hidden="true">
                        <div class="mock-editor">
                            <div class="mock-toolbar">
                                <span></span><span></span><span></span>
                            </div>
                            <div class="mock-canvas">
                                <div class="mock-layer mock-layer--bg"></div>
                                <img class="mock-sticker mock-sticker--1" :src="editorStickerA" alt="" />
                                <img class="mock-sticker mock-sticker--2" :src="editorStickerB" alt="" />
                                <div class="mock-text-box">{{ $t('home.showcaseEditorMockText') }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 风格展示区 -->
            <section class="styles-section">
                <div class="styles-head">
                    <h2 class="styles-title">{{ $t('home.stylesTitle') || '丰富的插画风格' }}</h2>
                    <p class="styles-subtitle">{{ $t('home.stylesSubtitle') || '一键切换多种艺术风格' }}</p>
                </div>
                <div class="styles-grid">
                    <button
                        v-for="style in styleImages"
                        :key="style.id"
                        type="button"
                        class="style-tile"
                        @click="go('/ai-picture')"
                    >
                        <el-image :src="style.image" fit="cover" class="style-tile-img" :lazy="true" />
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Home',
    computed: {
        workbenchPoints() {
            return [
                this.$t('home.showcaseWorkbenchPoint1'),
                this.$t('home.showcaseWorkbenchPoint2'),
                this.$t('home.showcaseWorkbenchPoint3'),
            ];
        },
        editorPoints() {
            return [
                this.$t('home.showcaseEditorPoint1'),
                this.$t('home.showcaseEditorPoint2'),
                this.$t('home.showcaseEditorPoint3'),
            ];
        },
    },
    data() {
        return {
            workbenchPreview: require('@/assets/images/cards/reddit.png'),
            editorStickerA: require('@/assets/prompt/5.webp'),
            editorStickerB: require('@/assets/prompt/14.webp'),
            featureCards: [
                { key: 'book', titleKey: 'nav.aiBooks', descKey: 'home.aiBooksDesc', to: '/AIbooks', cls: 'ic-book', img: require('@/assets/images/cards/books.png') },
                { key: 'brush', titleKey: 'nav.aiIllustration', descKey: 'home.aiIllustrationDesc', to: '/ai-picture', cls: 'ic-brush', img: require('@/assets/images/cards/image (1).png') },
                { key: 'user', titleKey: 'nav.characterStudio', descKey: 'home.createCharacterDesc', to: '/creation-studio', cls: 'ic-user', img: require('@/assets/images/cards/reddit.png') },
                { key: 'mood', titleKey: 'nav.moodDiary', descKey: 'home.moodDiaryDesc', to: '/mood-diary', cls: 'ic-mood', img: require('@/assets/images/cards/daily-health-app.png') }
            ],
            // 风格图片（与 AIpicture.vue 中的 styleConfigs 保持一致）
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
                { key: 'oilPainting', id: 19, image: require('@/assets/prompt/19.webp') },
                { key: 'europeanComic', id: 20, image: require('@/assets/prompt/20.webp') },
                { key: 'gouacheChildrenBook', id: 21, image: require('@/assets/prompt/21.webp') }
            ]
        };
    },
    methods: {
        go(to) {
            this.$router.push(to);
        }
    }
}
</script>

<style scoped>
.home-container {
    height: calc(100vh - 50px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 36px 32px 72px;
    background:
        radial-gradient(ellipse 70% 50% at 8% 0%, rgba(139, 124, 240, 0.14), transparent 55%),
        radial-gradient(ellipse 60% 45% at 92% 4%, rgba(88, 166, 240, 0.1), transparent 50%),
        radial-gradient(ellipse 50% 40% at 50% 100%, rgba(244, 169, 172, 0.08), transparent 55%),
        #eef0f8;
}

.home-inner {
    max-width: 1160px;
    margin: 0 auto;
}

/* ===== Hero（与功能卡片同系的柔和渐变氛围） ===== */
.home-hero {
    text-align: center;
    padding: 20px 0 36px;
}

.hero-title {
    font-size: 40px;
    line-height: 1.3;
    font-weight: 700;
    color: #3d3d56;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
}

.hero-subtitle {
    font-size: 16px;
    line-height: 1.6;
    color: #7a7a94;
    margin: 0 0 22px;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
}

.hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    cursor: pointer;
    padding: 11px 24px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #8b7cf0, #a99bf5);
    box-shadow: 0 12px 28px -14px rgba(124, 108, 240, 0.65);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hero-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px -12px rgba(124, 108, 240, 0.7);
}

.hero-cta-arrow {
    font-size: 14px;
    opacity: 0.95;
}

/* ===== 四个功能卡片 ===== */
.feature-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 56px;
}

.feature-card {
    position: relative;
    display: block;
    border: none;
    cursor: pointer;
    text-align: left;
    min-height: 176px;
    border-radius: 28px;
    padding: 24px 26px 22px;
    color: #fff;
    overflow: hidden;
    isolation: isolate;
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
}

/* 顶部高光，减少平板呆板感 */
.feature-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(135% 95% at 6% -12%, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0) 55%);
    z-index: 0;
    pointer-events: none;
}

.feature-card:hover {
    transform: translateY(-8px);
}

/* 右上角柔光，增加层次 */
.feature-rings {
    position: absolute;
    right: -28px;
    top: -28px;
    width: 132px;
    height: 132px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0) 70%);
    z-index: 0;
    pointer-events: none;
}

.feature-text {
    position: relative;
    z-index: 2;
}

.feature-name {
    font-size: 20px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 6px;
    letter-spacing: 0.3px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.feature-desc {
    font-size: 13px;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    max-width: 58%;
}

/* 统一的磨砂圆形徽章，让风格各异的图标观感一致 */
.feature-icon {
    position: absolute;
    right: 16px;
    bottom: 14px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 96px;
    height: 96px;
    transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.feature-card:hover .feature-icon {
    transform: translateY(-5px) scale(1.08);
}

.feature-icon-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.22));
    transition: transform 0.28s ease;
}

/* 各图标轻微倾斜不同角度，更灵动、不死板 */
.ic-book .feature-icon-img { transform: rotate(-8deg); }
.ic-brush .feature-icon-img { transform: rotate(7deg); }
.ic-user .feature-icon-img { transform: rotate(-5deg); }
.ic-mood .feature-icon-img { transform: rotate(10deg); }

/* 每张卡片的渐变主题色与配套阴影 */
.ic-book {
    background: linear-gradient(135deg, #8b7cf0, #a99bf5);
    box-shadow: 0 16px 32px -16px rgba(124, 108, 240, 0.7);
}
.ic-brush {
    background: linear-gradient(135deg, #58a6f0, #84c2f7);
    box-shadow: 0 16px 32px -16px rgba(74, 141, 240, 0.65);
}
.ic-user {
    background: linear-gradient(135deg, #f1858f, #f4a9ac);
    box-shadow: 0 16px 32px -16px rgba(240, 120, 130, 0.6);
}
.ic-mood {
    background: linear-gradient(135deg, #74cf86, #9bd97f);
    box-shadow: 0 16px 32px -16px rgba(90, 190, 120, 0.6);
}

/* ===== 产品介绍区块 ===== */
.showcase {
    margin-bottom: 56px;
}

.showcase-inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 40px;
    align-items: center;
    background: rgba(255, 255, 255, 0.62);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 28px;
    padding: 36px 36px 36px 40px;
    box-shadow: 0 20px 48px -28px rgba(100, 90, 160, 0.35);
}

.showcase-inner--reverse {
    direction: rtl;
}

.showcase-inner--reverse > * {
    direction: ltr;
}

.showcase-kicker {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8167a9;
    background: #ede8f5;
    padding: 5px 12px;
    border-radius: 999px;
    margin-bottom: 14px;
}

.showcase-title {
    font-size: 28px;
    line-height: 1.25;
    font-weight: 800;
    color: #3d3d56;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
}

.showcase-desc {
    font-size: 15px;
    line-height: 1.65;
    color: #6b6b84;
    margin: 0 0 18px;
}

.showcase-points {
    margin: 0 0 24px;
    padding: 0;
    list-style: none;
}

.showcase-points li {
    position: relative;
    padding-left: 22px;
    margin-bottom: 10px;
    font-size: 14px;
    line-height: 1.5;
    color: #4a4a62;
}

.showcase-points li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8167a9, #9d8bb8);
}

.showcase-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    cursor: pointer;
    padding: 12px 22px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #8167a9, #9d8bb8);
    box-shadow: 0 12px 28px -14px rgba(129, 103, 169, 0.65);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.showcase-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px -12px rgba(129, 103, 169, 0.72);
}

.showcase-cta-arrow {
    font-size: 16px;
}

.showcase-visual {
    min-width: 0;
}

.mock-workbench {
    display: flex;
    height: 280px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #ececf0;
    background: #f5f6f8;
    box-shadow: 0 12px 32px -20px rgba(60, 50, 90, 0.35);
}

.mock-rail {
    width: 52px;
    background: #fff;
    border-right: 1px solid #ececf0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 14px 0;
}

.mock-rail-item {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #f0f0f4;
}

.mock-rail-item.active {
    background: #ede8f5;
    box-shadow: inset 0 0 0 2px #8167a9;
}

.mock-subnav {
    width: 88px;
    background: #fff;
    border-right: 1px solid #ececf0;
    padding: 16px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.mock-line {
    height: 10px;
    border-radius: 6px;
    background: #f0f0f4;
}

.mock-line.active {
    background: #ede8f5;
    width: 80%;
}

.mock-main {
    flex: 1;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    align-content: start;
}

.mock-card {
    aspect-ratio: 1;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #ececf0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
}

.mock-card--new {
    border-style: dashed;
    background: #fafbfc;
}

.mock-card img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.mock-editor {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #ececf0;
    background: #fff;
    box-shadow: 0 12px 32px -20px rgba(60, 50, 90, 0.35);
}

.mock-toolbar {
    display: flex;
    gap: 8px;
    padding: 12px 14px;
    background: #fafbfc;
    border-bottom: 1px solid #ececf0;
}

.mock-toolbar span {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #ede8f5;
}

.mock-canvas {
    position: relative;
    height: 240px;
    background: linear-gradient(180deg, #e8f4fc 0%, #f5f0fa 100%);
    overflow: hidden;
}

.mock-layer--bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.6), transparent 50%);
}

.mock-sticker {
    position: absolute;
    border-radius: 12px;
    box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.25);
    border: 3px solid #fff;
}

.mock-sticker--1 {
    width: 88px;
    height: 88px;
    object-fit: cover;
    left: 12%;
    top: 18%;
    transform: rotate(-6deg);
}

.mock-sticker--2 {
    width: 72px;
    height: 72px;
    object-fit: cover;
    right: 14%;
    bottom: 22%;
    transform: rotate(8deg);
}

.mock-text-box {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.92);
    border: 2px dashed #8167a9;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #8167a9;
    white-space: nowrap;
}

/* ===== 风格展示区（轻量玻璃质感，与卡片圆角/阴影体系一致） ===== */
.styles-section {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 28px;
    padding: 28px 24px 32px;
    box-shadow: 0 16px 40px -24px rgba(100, 90, 160, 0.35);
}

.styles-head {
    text-align: center;
    margin-bottom: 22px;
}

.styles-title {
    font-size: 22px;
    font-weight: 700;
    color: #3d3d56;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
}

.styles-subtitle {
    font-size: 14px;
    color: #7a7a94;
    margin: 0;
}

.styles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 14px;
}

.style-tile {
    border: 2px solid rgba(255, 255, 255, 0.85);
    cursor: pointer;
    padding: 0;
    border-radius: 20px;
    overflow: hidden;
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.4);
    box-shadow: 0 8px 20px -14px rgba(80, 70, 120, 0.35);
    transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.style-tile:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 28px -12px rgba(100, 90, 160, 0.4);
}

.style-tile-img {
    width: 100%;
    height: 100%;
    display: block;
}

/* ===== 平板 ===== */
@media (max-width: 1024px) {
    .hero-title {
        font-size: 34px;
    }

    .feature-cards {
        grid-template-columns: repeat(2, 1fr);
    }

    .showcase-inner {
        grid-template-columns: 1fr;
        gap: 28px;
        padding: 28px 24px;
    }

    .showcase-inner--reverse {
        direction: ltr;
    }

    .showcase-title {
        font-size: 24px;
    }
}

/* ===== 手机 ===== */
@media (max-width: 768px) {
    .home-container {
        /* 手机端无固定页脚，交给 .app-main 滚动（底部已为 TabBar 预留留白） */
        height: auto;
        overflow: visible;
        padding: 20px 14px 32px;
    }

    .home-hero {
        padding: 8px 0 24px;
    }

    .hero-title {
        font-size: 27px;
        margin-bottom: 12px;
    }

    .hero-subtitle {
        font-size: 14px;
        margin-bottom: 18px;
    }

    .feature-cards {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 32px;
    }

    .showcase {
        margin-bottom: 32px;
    }

    .showcase-inner {
        padding: 22px 18px;
        border-radius: 20px;
    }

    .showcase-title {
        font-size: 22px;
    }

    .mock-workbench {
        height: 220px;
    }

    .mock-main {
        grid-template-columns: repeat(2, 1fr);
    }

    .mock-canvas {
        height: 200px;
    }

    .feature-card {
        min-height: 132px;
        border-radius: 20px;
        padding: 16px 16px 14px;
    }

    .feature-icon {
        right: 10px;
        bottom: 10px;
        width: 66px;
        height: 66px;
    }

    .feature-rings {
        right: -20px;
        top: -20px;
        width: 92px;
        height: 92px;
    }

    .feature-name {
        font-size: 16px;
    }

    .feature-desc {
        font-size: 12px;
        max-width: 70%;
    }

    .styles-section {
        border-radius: 20px;
        padding: 20px 16px 24px;
    }

    .styles-title {
        font-size: 20px;
    }

    .styles-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }
}

@media (max-width: 420px) {
    .styles-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
