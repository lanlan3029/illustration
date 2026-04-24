<template>
    <div class="ai-picture-page">
        <main class="page-main">
            <div class="workspace-layout">
                <aside class="inspiration-column" aria-label="inspiration">
                    <!-- 浏览灵感（左侧） -->
                    <div class="inspiration-section">
                        <div class="inspiration-head">
                            <h2 class="inspiration-title">{{ $t('aiPicture.browseInspiration') || '浏览灵感' }}</h2>
                            <div class="inspiration-actions">
                                <button type="button" class="link-btn" @click="shuffleStyles">
                                    {{ $t('aiPicture.refresh') || '更新内容' }}
                                </button>
                            </div>
                        </div>

                        <div class="style-source-row" role="tablist" :aria-label="$t('aiPicture.inspirationType') || '灵感类型'">
                            <button
                                v-for="tab in sourceTabItems"
                                :key="tab.id"
                                type="button"
                                class="style-source-tab"
                                :class="{ active: inspirationSource === tab.id }"
                                role="tab"
                                :aria-selected="inspirationSource === tab.id"
                                @click="setInspirationSource(tab.id)"
                            >
                                {{ tab.label }}
                            </button>
                        </div>

                        <div
                            v-show="inspirationSource === 'illustration'"
                            class="style-tab-row"
                            role="tablist"
                            :aria-label="$t('aiPicture.illustrationSubTabs') || '插画分类'">
                            <button
                                v-for="tab in illustrationTabItems"
                                :key="tab.id"
                                type="button"
                                class="style-tab"
                                :class="{ active: activeIllustrationTab === tab.id }"
                                role="tab"
                                :aria-selected="activeIllustrationTab === tab.id"
                                @click="setIllustrationTab(tab.id)"
                            >
                                {{ tab.label }}
                            </button>
                        </div>

                        <div
                            v-show="inspirationSource === 'promptPack'"
                            class="style-tab-row style-tab-row--pack"
                            role="tablist"
                            :aria-label="$t('aiPicture.promptCategoryTabs') || '提示词分类'">
                            <button
                                v-for="tab in promptCategoryTabItems"
                                :key="tab.id"
                                type="button"
                                class="style-tab"
                                :class="{ active: activePromptCategory === tab.id }"
                                role="tab"
                                :aria-selected="activePromptCategory === tab.id"
                                @click="setPromptCategory(tab.id)"
                            >
                                {{ tab.label }}
                            </button>
                        </div>

                        <p v-if="inspirationSource === 'promptPack'" class="pack-attrib">
                            {{ $t('aiPicture.packAttribution') }}
                        </p>
                        <p v-if="inspirationSource === 'oaiTemplate'" class="pack-attrib oai-hint">
                            {{ $t('aiPicture.oaiTemplateHint') }}
                        </p>

                        <div class="style-list" ref="styleListRef">
                            <template v-if="inspirationSource === 'illustration'">
                                <button type="button" class="style-list-item style-list-item--upload" @click="triggerReferenceUpload">
                                    <div class="style-list-item-thumb style-list-item-thumb--add">
                                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </div>
                                    <span class="style-list-item-text">{{ $t('aiPicture.uploadPhoto') || '上传照片' }}</span>
                                </button>
                                <button
                                    v-for="style in displayedStyles"
                                    :key="style.id"
                                    type="button"
                                    class="style-list-item"
                                    :class="{ selected: selectedStyleId === style.id }"
                                    @click="selectStyle(style.id)"
                                >
                                    <div
                                        class="style-list-item-thumb"
                                        @mouseenter="enterStylePreview($event, style.image, style.artStyle)"
                                        @mouseleave="beginLeaveStylePreview"
                                    >
                                        <img
                                            :src="style.image"
                                            :alt="style.artStyle"
                                            class="style-list-item-img"
                                            loading="lazy"
                                        />
                                    </div>
                                    <span class="style-list-item-text">{{ style.artStyle }}</span>
                                </button>
                            </template>
                            <template v-else-if="inspirationSource === 'promptPack'">
                                <button
                                    v-for="item in displayedPackItems"
                                    :key="item.id"
                                    type="button"
                                    class="style-list-item style-list-item--pack"
                                    :class="{ selected: selectedPackItemId === item.id }"
                                    @click="selectPackItem(item)"
                                >
                                    <div
                                        v-if="item.image"
                                        class="style-list-item-thumb"
                                        @mouseenter="enterStylePreview($event, item.image, packItemDisplayTitle(item))"
                                        @mouseleave="beginLeaveStylePreview"
                                    >
                                        <img
                                            :src="item.image"
                                            :alt="packItemDisplayTitle(item)"
                                            class="style-list-item-img"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div
                                        v-else
                                        class="style-list-item-thumb"
                                    >
                                        <div class="style-list-item-img style-list-item-fallback" aria-hidden="true" />
                                    </div>
                                    <span class="style-list-item-text">{{ packItemDisplayTitle(item) }}</span>
                                </button>
                            </template>
                            <template v-else>
                                <button
                                    v-for="item in displayedOaiItems"
                                    :key="item.id"
                                    type="button"
                                    class="style-list-item style-list-item--oai"
                                    :class="{ selected: selectedOaiTemplateId === item.id }"
                                    :title="item.description || item.title"
                                    @click="selectOaiTemplate(item)"
                                >
                                    <div
                                        v-if="item.image"
                                        class="style-list-item-thumb"
                                        @mouseenter="enterStylePreview($event, item.image, item.title)"
                                        @mouseleave="beginLeaveStylePreview"
                                    >
                                        <img
                                            :src="item.image"
                                            :alt="item.title"
                                            class="style-list-item-img"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div
                                        v-else
                                        class="style-list-item-thumb"
                                    >
                                        <div class="style-list-item-img style-list-item-fallback" aria-hidden="true" />
                                    </div>
                                    <div class="style-list-item-body">
                                        <span class="style-list-item-text">{{ item.title }}</span>
                                        <span v-if="item.description" class="style-list-item-desc">{{ item.description }}</span>
                                    </div>
                                </button>
                            </template>
                        </div>
                    </div>
                </aside>

                <div class="editor-column">
            <!-- 主输入框 -->
            <div class="prompt-card" :class="{ 'is-focused': isFocused }">
                <textarea
                    ref="promptInput"
                    v-model="subjectScene"
                    class="prompt-textarea"
                    :placeholder="$t('aiPicture.heroPlaceholder') || '描述或编辑图片'"
                    rows="3"
                    @focus="isFocused = true"
                    @blur="isFocused = false"
                    @keydown.enter.exact.prevent="generateIllustration"
                ></textarea>

                <!-- 底部工具栏（基础操作） -->
                <div class="prompt-toolbar">
                    <div class="toolbar-left">
                        <!-- 添加参考图 -->
                        <button
                            type="button"
                            class="tool-btn icon-only"
                            :title="$t('aiPicture.addReference') || '添加参考图'"
                            @click="triggerReferenceUpload"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                        <input
                            ref="referenceUpload"
                            type="file"
                            accept="image/*"
                            class="hidden-file-input"
                            @change="handleReferenceUpload"
                        />

                        <!-- 尺寸（原「图片」位置） -->
                        <div class="size-select-wrap" ref="sizeSelectRef">
                            <button
                                type="button"
                                class="tool-btn pill"
                                :class="{ active: sizeMenuOpen }"
                                :title="$t('aiPicture.sizeLabel') || '尺寸'"
                                @click="toggleSizeMenu"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                </svg>
                                <span class="size-toolbar-text">{{ currentSizeLabel }}</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="caret">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            <div v-if="sizeMenuOpen" class="size-menu">
                                <template v-for="(group, gIdx) in sizeGroups" :key="group.label">
                                    <div v-if="gIdx > 0" class="size-menu-divider"></div>
                                    <div class="size-menu-group-label">{{ group.label }}</div>
                                    <button
                                        v-for="opt in group.items"
                                        :key="opt.value"
                                        type="button"
                                        class="size-menu-item"
                                        :class="{ active: opt.value === selectedSize }"
                                        @click="selectSize(opt.value)"
                                    >
                                        <span class="size-icon" :style="{ width: opt.iconW + 'px', height: opt.iconH + 'px' }"></span>
                                        <span class="size-label">{{ opt.label }}</span>
                                        <span class="size-dim">{{ opt.value === 'auto' ? '' : opt.value }}</span>
                                    </button>
                                </template>
                            </div>
                        </div>

                        <!-- 高级设置 折叠入口 -->
                        <button
                            type="button"
                            class="tool-btn pill"
                            :class="{ active: advancedSettingsOpen }"
                            @click="advancedSettingsOpen = !advancedSettingsOpen"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="caret" :class="{ 'caret-flip': advancedSettingsOpen }">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                            <span>{{ $t('aiPicture.advancedSettings') || '高级设置' }}</span>
                        </button>

                        <!-- 已选参考图缩略 -->
                        <div v-if="referenceImageUrl" class="ref-thumb-wrap">
                            <img :src="referenceImageUrl" alt="reference" class="ref-thumb" />
                            <button
                                type="button"
                                class="ref-thumb-clear"
                                @click="clearReferenceImage"
                                aria-label="remove reference"
                            >
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="toolbar-right">
                        <!-- 生成按钮 -->
                        <button
                            type="button"
                            class="send-btn"
                            :class="{ 'is-loading': generating }"
                            :disabled="!canGenerate || generating"
                            @click="generateIllustration"
                            :title="$t('aiPicture.generate') || '生成'"
                        >
                            <span v-if="generating" class="send-spinner"></span>
                            <svg
                                v-else
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="12" cy="12" r="4" />
                                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 高级设置：模型 / 画质 -->
                <div v-show="advancedSettingsOpen" class="advanced-panel" @click.stop>
                    <div class="advanced-panel-inner">
                        <div class="size-select-wrap" ref="modelSelectRef">
                            <span class="advanced-field-label">{{ $t('aiPicture.modelLabel') || '模型' }}</span>
                            <button
                                type="button"
                                class="tool-btn pill"
                                :class="{ active: modelMenuOpen }"
                                @click="toggleModelMenu"
                            >
                                <span class="toolbar-dropdown-label">{{ currentModelLabel }}</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="caret">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            <div v-if="modelMenuOpen" class="size-menu menu-model">
                                <button
                                    v-for="opt in modelMenuOptions"
                                    :key="opt.value"
                                    type="button"
                                    class="size-menu-item"
                                    :class="{ active: opt.value === selectedModel }"
                                    @click="selectModel(opt.value)"
                                >
                                    <span class="size-label">{{ opt.label }}</span>
                                    <span class="size-dim">{{ opt.value }}</span>
                                </button>
                            </div>
                        </div>

                        <div class="size-select-wrap" ref="qualitySelectRef">
                            <span class="advanced-field-label">{{ $t('aiPicture.qualityLabel') || '画质' }}</span>
                            <button
                                type="button"
                                class="tool-btn pill"
                                :class="{ active: qualityMenuOpen }"
                                @click="toggleQualityMenu"
                            >
                                <span class="toolbar-dropdown-label">{{ currentQualityLabel }}</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="caret">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            <div v-if="qualityMenuOpen" class="size-menu menu-quality">
                                <button
                                    v-for="opt in qualityMenuOptions"
                                    :key="opt.value"
                                    type="button"
                                    class="size-menu-item"
                                    :class="{ active: opt.value === selectedQuality }"
                                    @click="selectQuality(opt.value)"
                                >
                                    <span class="size-label">{{ opt.label }}</span>
                                    <span class="size-dim">{{ opt.hint || '' }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 生成进度 / 结果 -->
            <div v-if="generating || generatedImageUrl" class="result-section">
                <div v-if="generating" class="result-loading">
                    <span class="result-spinner"></span>
                    <p>{{ $t('aiPicture.generating') || '正在生成插画…' }}</p>
                </div>

                <div v-else class="result-card">
                    <img
                        :src="generatedImageUrl"
                        alt="generated"
                        class="result-image"
                        @load="handleImageLoad"
                        @error="handleImageError"
                    />
                    <div class="result-actions">
                        <button type="button" class="result-btn primary" :disabled="collecting" @click="collectIllustration">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>{{ collecting ? ($t('aiPicture.saving') || '收集中…') : ($t('aiPicture.collect') || '收集插画') }}</span>
                        </button>
                        <button type="button" class="result-btn ghost" :disabled="downloading" @click="downloadIllustration">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>{{ downloading ? ($t('aiPicture.downloading') || '下载中…') : ($t('aiPicture.download') || '下载到本地') }}</span>
                        </button>
                        <button type="button" class="result-btn ghost danger" @click="clearGeneratedImage">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                            </svg>
                            <span>{{ $t('aiPicture.clear') || '清除' }}</span>
                        </button>
                    </div>
                </div>
            </div>
                </div>
            </div>
        </main>
        <teleport to="body">
            <div
                v-if="stylePreview.show"
                class="style-image-preview-floater"
                :style="{
                    left: stylePreview.left + 'px',
                    top: stylePreview.top + 'px',
                }"
                @mouseenter="cancelLeaveStylePreview"
                @mouseleave="hideStyleImagePreview"
            >
                <img
                    :src="stylePreview.src"
                    :alt="stylePreview.alt"
                    class="style-image-preview-img"
                    :style="{
                        maxWidth: stylePreview.maxW + 'px',
                        maxHeight: stylePreview.maxH + 'px',
                    }"
                />
            </div>
        </teleport>
    </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { checkWebPSupport } from '@/utils/imageOptimizer'
import gptimage2Data from '@/data/gptimage2Prompts.json'
import oaiImageData from '@/data/oaiImageTemplates.json'

export default {
    name: 'AIPicture',
    setup() {
        const { t, locale } = useI18n()

        const supportsWebP = ref(false)

        const styleConfigs = [
            { key: 'penLineArt', id: 1, image: require('@/assets/prompt/1.webp'), category: 'sketch' },
            { key: 'colorfulOutlineRomanticism', id: 6, image: require('@/assets/prompt/6.webp'), category: 'paint' },
            { key: 'crayonNoiseHandDrawn', id: 15, image: require('@/assets/prompt/15.webp'), category: 'sketch' },
            { key: 'vintageSketch', id: 17, image: require('@/assets/prompt/17.webp'), category: 'sketch' },
            { key: 'pixarStyle', id: 5, image: require('@/assets/prompt/5.webp'), category: 'toon' },
            { key: 'engravingLines', id: 7, image: require('@/assets/prompt/7.webp'), category: 'sketch' },
            { key: 'pencilSketch3D', id: 16, image: require('@/assets/prompt/16.webp'), category: 'sketch' },
            { key: 'feltCollage', id: 18, image: require('@/assets/prompt/18.webp'), category: 'paint' },
            { key: 'blackWhiteDoodle', id: 2, image: require('@/assets/prompt/2.webp'), category: 'sketch' },
            { key: 'collageIllustration', id: 4, image: require('@/assets/prompt/4.webp'), category: 'paint' },
            { key: 'rusticHandDrawn', id: 8, image: require('@/assets/prompt/8.webp'), category: 'sketch' },
            { key: 'maximalistCopperplate', id: 9, image: require('@/assets/prompt/9.webp'), category: 'sketch' },
            { key: 'doodleSoul', id: 10, image: require('@/assets/prompt/10.webp'), category: 'sketch' },
            { key: 'keithHaringDoodle', id: 11, image: require('@/assets/prompt/11.webp'), category: 'sketch' },
            { key: 'abstractFlatDesign', id: 12, image: require('@/assets/prompt/12.webp'), category: 'toon' },
            { key: 'simpleCartoon', id: 13, image: require('@/assets/prompt/13.webp'), category: 'toon' },
            { key: 'healingWatercolor', id: 14, image: require('@/assets/prompt/14.webp'), category: 'paint' },
            { key: 'oilPainting', id: 19, image: require('@/assets/prompt/19.webp'), category: 'paint' }
        ]

        onMounted(async () => {
            supportsWebP.value = await checkWebPSupport()
        })

        const styles = computed(() => {
            return styleConfigs.map(config => ({
                id: config.id,
                key: config.key,
                category: config.category,
                artStyle: t(`aibooks.styles.${config.key}.artStyle`),
                elementDetails: t(`aibooks.styles.${config.key}.elementDetails`),
                image: config.image
            }))
        })

        return {
            styles,
            locale
        }
    },
    data() {
        return {
            selectedStyleId: null,
            activeIllustrationTab: 'all',
            inspirationSource: 'illustration',
            activePromptCategory: 'ecommerce',
            selectedPackItemId: null,
            displayOrderPack: [],
            packCategories: gptimage2Data.categories,
            packItems: gptimage2Data.items,
            oaiItems: oaiImageData.items,
            selectedOaiTemplateId: null,
            displayOrderOai: [],
            advancedSettingsOpen: false,
            subjectScene: '',
            editableArtStyle: '',
            editableElementDetails: '',
            isFocused: false,

            sizeMenuOpen: false,
            modelMenuOpen: false,
            qualityMenuOpen: false,
            selectedSize: 'auto',
            sizeGroups: [
                {
                    label: '默认',
                    items: [
                        { value: 'auto', label: '自动', iconW: 16, iconH: 16 }
                    ]
                },
                {
                    label: '常用',
                    items: [
                        { value: '1024x1024', label: '方图', iconW: 16, iconH: 16 },
                        { value: '1536x1024', label: '横图', iconW: 20, iconH: 14 },
                        { value: '1024x1536', label: '竖图', iconW: 14, iconH: 20 }
                    ]
                },
                {
                    label: '2K',
                    items: [
                        { value: '2048x2048', label: '方图 2K', iconW: 18, iconH: 18 },
                        { value: '2048x1152', label: '横图 2K', iconW: 22, iconH: 12 }
                    ]
                },
                {
                    label: '4K',
                    items: [
                        { value: '3840x2160', label: '横图 4K', iconW: 22, iconH: 12 },
                        { value: '2160x3840', label: '竖图 4K', iconW: 12, iconH: 22 }
                    ]
                },
                {
                    label: '其他',
                    items: [
                        { value: '1792x1024', label: '宽屏', iconW: 22, iconH: 12 },
                        { value: '1024x1792', label: '长图', iconW: 12, iconH: 22 },
                        { value: '512x512', label: '预览 512', iconW: 12, iconH: 12 },
                        { value: '256x256', label: '缩略 256', iconW: 10, iconH: 10 }
                    ]
                }
            ],

            selectedModel: 'gpt-image-2',
            selectedQuality: 'auto',
            outputFormat: 'png',
            imageCount: 1,

            referenceImageUrl: '',

            displayOrder: [],

            generating: false,
            generatedImageUrl: null,
            collecting: false,
            downloading: false,
            imageLoading: false,
            imageLoadError: false,

            /** 最近一次成功「生成」时请求里的 prompt 快照，与 current generatedImageUrl 一致；重选风格后不会变。 */
            lastGeneratedPromptSnapshot: '',

            stylePreview: {
                show: false,
                left: 0,
                top: 0,
                maxW: 320,
                maxH: 420,
                src: '',
                alt: ''
            },

            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
        }
    },
    computed: {
        selectedStyle() {
            if (this.selectedStyleId == null) return null
            return this.styles.find(s => s.id === this.selectedStyleId) || null
        },
        sourceTabItems() {
            return [
                { id: 'illustration', label: this.$t('aiPicture.styleSourceIllustration') || '插画风格' },
                { id: 'promptPack', label: this.$t('aiPicture.styleSourcePromptPack') || '提示词合集' },
                { id: 'oaiTemplate', label: this.$t('aiPicture.styleSourceOai') || '创意模板' }
            ]
        },
        selectedOaiItem() {
            if (!this.selectedOaiTemplateId) return null
            return this.oaiItems.find((x) => x.id === this.selectedOaiTemplateId) || null
        },
        visibleOaiItems() {
            return this.oaiItems
        },
        displayedOaiItems() {
            const vis = this.visibleOaiItems
            const set = new Set(vis.map((x) => x.id))
            if (!this.displayOrderOai || !this.displayOrderOai.length) {
                return vis
            }
            return this.displayOrderOai
                .map((id) => this.oaiItems.find((x) => x.id === id))
                .filter((x) => x && set.has(x.id))
        },
        illustrationTabItems() {
            return [
                { id: 'all', label: this.$t('aiPicture.styleTabAll') || '全部' },
                { id: 'sketch', label: this.$t('aiPicture.styleTabSketch') || '线稿手绘' },
                { id: 'paint', label: this.$t('aiPicture.styleTabPaint') || '色彩综合' },
                { id: 'toon', label: this.$t('aiPicture.styleTabToon') || '卡通 / 3D' }
            ]
        },
        promptCategoryTabItems() {
            return this.packCategories.map(c => ({ id: c.id, label: c.name }))
        },
        selectedPackItem() {
            if (!this.selectedPackItemId) return null
            return this.packItems.find(p => p.id === this.selectedPackItemId) || null
        },
        visibleStyles() {
            if (this.activeIllustrationTab === 'all') return this.styles
            return this.styles.filter(s => s.category === this.activeIllustrationTab)
        },
        visiblePackItems() {
            return this.packItems.filter(p => p.categoryId === this.activePromptCategory)
        },
        displayedPackItems() {
            const vis = this.visiblePackItems
            const inTab = new Set(vis.map(p => p.id))
            if (!this.displayOrderPack || !this.displayOrderPack.length) {
                return vis
            }
            return this.displayOrderPack
                .map(id => this.packItems.find(p => p.id === id))
                .filter(p => p && inTab.has(p.id))
        },
        canGenerate() {
            return !!(this.subjectScene && this.subjectScene.trim())
        },
        currentSizeLabel() {
            for (const g of this.sizeGroups) {
                const hit = g.items.find(o => o.value === this.selectedSize)
                if (hit) return hit.label
            }
            return this.$t('aiPicture.sizeAuto') || '自动'
        },
        isDallE() {
            return typeof this.selectedModel === 'string' && this.selectedModel.startsWith('dall-e')
        },
        modelMenuOptions() {
            return [
                { value: 'gpt-image-2', label: this.$t('aiPicture.modelGptImage2') },
                { value: 'gpt-image-1.5', label: this.$t('aiPicture.modelGptImage15') },
                { value: 'gpt-image-1', label: this.$t('aiPicture.modelGptImage1') },
                { value: 'dall-e-3', label: this.$t('aiPicture.modelDallE3') }
            ]
        },
        currentModelLabel() {
            const hit = this.modelMenuOptions.find(o => o.value === this.selectedModel)
            return hit ? hit.label : (this.selectedModel || '—')
        },
        qualityMenuOptions() {
            if (this.isDallE) {
                return [
                    { value: 'auto', label: this.$t('aiPicture.qualityAuto'), hint: 'standard' },
                    { value: 'high', label: this.$t('aiPicture.qualityHd'), hint: 'hd' },
                    { value: 'medium', label: this.$t('aiPicture.qualityBalanced'), hint: 'standard' },
                    { value: 'low', label: this.$t('aiPicture.qualityFast'), hint: 'standard' }
                ]
            }
            return [
                { value: 'auto', label: this.$t('aiPicture.qualityAuto'), hint: '' },
                { value: 'high', label: this.$t('aiPicture.qualityHigh'), hint: '' },
                { value: 'medium', label: this.$t('aiPicture.qualityMedium'), hint: '' },
                { value: 'low', label: this.$t('aiPicture.qualityLow'), hint: '' }
            ]
        },
        currentQualityLabel() {
            const hit = this.qualityMenuOptions.find(o => o.value === this.selectedQuality)
            return hit ? hit.label : (this.$t('aiPicture.qualityAuto') || '自动')
        },
        displayedStyles() {
            const vis = this.visibleStyles
            const inTab = new Set(vis.map(s => s.id))
            if (!this.displayOrder || !this.displayOrder.length) {
                return vis
            }
            return this.displayOrder
                .map(id => this.styles.find(s => s.id === id))
                .filter(s => s && inTab.has(s.id))
        },
        generatedPrompt() {
            if (!this.subjectScene || !this.subjectScene.trim()) return ''
            let prompt = this.subjectScene.trim()
            if (this.isCharacterInput(prompt)) {
                const characterAccuracy = '每个角色严格保持2只手、2只脚，肢体数量准确，解剖结构正常，肢体形态自然连贯，无重复或多余肢体。'
                prompt = `${prompt}，${characterAccuracy}`
            }
            return prompt
        }
    },
    watch: {
        selectedStyle: {
            handler(newStyle) {
                if (newStyle && this.selectedStyleId !== null) {
                    this.editableArtStyle = newStyle.artStyle
                    this.editableElementDetails = newStyle.elementDetails
                }
            },
            immediate: false
        }
    },
    mounted() {
        if (this.styles.length > 0) {
            this.selectedStyleId = this.styles[0].id
            this.editableArtStyle = this.styles[0].artStyle
            this.editableElementDetails = this.styles[0].elementDetails
            this.displayOrder = this.styles.map(s => s.id)
            this.applyStylePromptToInput(this.styles[0])
        }
        this.restoreLatestGeneratedImage()
        document.addEventListener('click', this.handleDocClick)
        this._onStyleListScroll = () => {
            this.hideStyleImagePreview()
        }
        this.$nextTick(() => {
            const el = this.$refs.styleListRef
            this._styleListEl = el
            if (el) el.addEventListener('scroll', this._onStyleListScroll, { passive: true })
        })
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleDocClick)
        this.clearStylePreviewTimer()
        if (this._styleListEl && this._onStyleListScroll) {
            this._styleListEl.removeEventListener('scroll', this._onStyleListScroll)
        }
        this.stylePreview.show = false
    },
    methods: {
        setInspirationSource(src) {
            if (this.inspirationSource === src) return
            this.inspirationSource = src
            this.displayOrder = []
            this.displayOrderPack = []
            this.displayOrderOai = []
            if (src === 'illustration') {
                this.selectedPackItemId = null
                this.selectedOaiTemplateId = null
            } else if (src === 'promptPack') {
                this.selectedStyleId = null
                this.selectedOaiTemplateId = null
            } else {
                this.selectedStyleId = null
                this.selectedPackItemId = null
            }
            this.$nextTick(() => {
                const list = this.$refs.styleListRef
                if (list) list.scrollTo({ top: 0, behavior: 'auto' })
            })
        },
        setIllustrationTab(tabId) {
            if (this.activeIllustrationTab === tabId) return
            this.activeIllustrationTab = tabId
            this.displayOrder = []
            this.$nextTick(() => {
                const list = this.$refs.styleListRef
                if (list) list.scrollTo({ top: 0, behavior: 'auto' })
            })
        },
        setPromptCategory(catId) {
            if (this.activePromptCategory === catId) return
            this.activePromptCategory = catId
            this.displayOrderPack = []
            this.$nextTick(() => {
                const list = this.$refs.styleListRef
                if (list) list.scrollTo({ top: 0, behavior: 'auto' })
            })
        },

        applyStylePromptToInput(style) {
            if (!style) return
            const parts = [style.artStyle, style.elementDetails].filter(p => p && String(p).trim())
            this.subjectScene = parts.join('，')
        },

        clearSelectedStyle() {
            this.selectedStyleId = null
        },
        clearSelectedPack() {
            this.selectedPackItemId = null
        },
        clearSelectedOai() {
            this.selectedOaiTemplateId = null
        },

        selectStyle(styleId) {
            this.selectedStyleId = styleId
            this.selectedPackItemId = null
            this.selectedOaiTemplateId = null
            this.inspirationSource = 'illustration'
            const style = this.styles.find(s => s.id === styleId)
            if (style) {
                this.editableArtStyle = style.artStyle
                this.editableElementDetails = style.elementDetails
                this.applyStylePromptToInput(style)
            }
        },
        selectPackItem(item) {
            if (!item) return
            this.selectedPackItemId = item.id
            this.selectedStyleId = null
            this.selectedOaiTemplateId = null
            this.inspirationSource = 'promptPack'
            this.subjectScene = (item.prompt || '').trim()
        },
        selectOaiTemplate(item) {
            if (!item) return
            this.selectedOaiTemplateId = item.id
            this.selectedStyleId = null
            this.selectedPackItemId = null
            this.inspirationSource = 'oaiTemplate'
            this.subjectScene = (item.prompt || '').trim()
        },
        packItemDisplayTitle(item) {
            if (!item || !item.title) return ''
            return String(item.title).replace(/^\d+\.\d+\s*/, '')
        },

        toggleSizeMenu() {
            const next = !this.sizeMenuOpen
            this.sizeMenuOpen = next
            if (next) {
                this.modelMenuOpen = false
                this.qualityMenuOpen = false
            }
        },
        selectSize(value) {
            this.selectedSize = value
            this.sizeMenuOpen = false
        },
        toggleModelMenu() {
            const next = !this.modelMenuOpen
            this.modelMenuOpen = next
            if (next) {
                this.sizeMenuOpen = false
                this.qualityMenuOpen = false
            }
        },
        selectModel(value) {
            this.selectedModel = value
            this.modelMenuOpen = false
            const valid = this.qualityMenuOptions.some(o => o.value === this.selectedQuality)
            if (!valid) this.selectedQuality = 'auto'
        },
        toggleQualityMenu() {
            const next = !this.qualityMenuOpen
            this.qualityMenuOpen = next
            if (next) {
                this.sizeMenuOpen = false
                this.modelMenuOpen = false
            }
        },
        selectQuality(value) {
            this.selectedQuality = value
            this.qualityMenuOpen = false
        },
        enterStylePreview(e, src, alt) {
            if (!src) return
            this.clearStylePreviewTimer()
            this.openStyleImagePreviewAtThumb(e, src, alt)
        },
        openStyleImagePreviewAtThumb(e, src, alt) {
            if (!e || !e.currentTarget || !src) return
            const r = e.currentTarget.getBoundingClientRect()
            const maxW = Math.min(320, window.innerWidth - 16)
            const maxH = Math.min(420, window.innerHeight - 16)
            let left = r.right - 2
            let top = r.top
            if (left + maxW > window.innerWidth - 8) {
                left = r.left - maxW + 2
            }
            if (left < 8) {
                left = 8
            }
            if (left + maxW > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - 8 - maxW)
            }
            if (top + maxH > window.innerHeight - 8) {
                top = r.top - maxH - 6
            }
            if (top < 8) {
                top = 8
            }
            this.stylePreview.show = true
            this.stylePreview.left = left
            this.stylePreview.top = top
            this.stylePreview.maxW = maxW
            this.stylePreview.maxH = maxH
            this.stylePreview.src = src
            this.stylePreview.alt = alt != null ? String(alt) : ''
        },
        beginLeaveStylePreview() {
            this._stylePreviewTimer = window.setTimeout(() => {
                this.stylePreview.show = false
                this._stylePreviewTimer = null
            }, 250)
        },
        cancelLeaveStylePreview() {
            this.clearStylePreviewTimer()
        },
        clearStylePreviewTimer() {
            if (this._stylePreviewTimer) {
                clearTimeout(this._stylePreviewTimer)
                this._stylePreviewTimer = null
            }
        },
        hideStyleImagePreview() {
            this.clearStylePreviewTimer()
            this.stylePreview.show = false
        },
        handleDocClick(e) {
            this.hideStyleImagePreview()
            const sizeRef = this.$refs.sizeSelectRef
            const modelRef = this.$refs.modelSelectRef
            const qualityRef = this.$refs.qualitySelectRef
            if (this.sizeMenuOpen && sizeRef && !sizeRef.contains(e.target)) this.sizeMenuOpen = false
            if (this.modelMenuOpen && modelRef && !modelRef.contains(e.target)) this.modelMenuOpen = false
            if (this.qualityMenuOpen && qualityRef && !qualityRef.contains(e.target)) this.qualityMenuOpen = false
        },

        triggerReferenceUpload() {
            this.$refs.referenceUpload && this.$refs.referenceUpload.click()
        },
        async handleReferenceUpload(e) {
            const file = e.target.files && e.target.files[0]
            if (!file) return
            try {
                const dataUrl = await this.fileToDataUrl(file)
                const compressed = await this.compressDataUrlIfNeeded(dataUrl)
                this.referenceImageUrl = compressed
                ElMessage.success({ message: this.$t('aiPicture.referenceAdded') || '已添加参考图', offset: 200 })
            } catch (err) {
                console.error(err)
                ElMessage.error({ message: this.$t('aiPicture.referenceFailed') || '参考图加载失败', offset: 200 })
            } finally {
                e.target.value = ''
            }
        },
        clearReferenceImage() {
            this.referenceImageUrl = ''
        },
        fileToDataUrl(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })
        },

        shuffleStyles() {
            if (this.inspirationSource === 'illustration') {
                const arr = this.visibleStyles.map(s => s.id)
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1))
                    ;[arr[i], arr[j]] = [arr[j], arr[i]]
                }
                this.displayOrder = arr
            } else if (this.inspirationSource === 'promptPack') {
                const arr = this.visiblePackItems.map(p => p.id)
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1))
                    ;[arr[i], arr[j]] = [arr[j], arr[i]]
                }
                this.displayOrderPack = arr
            } else {
                const arr = this.visibleOaiItems.map(x => x.id)
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1))
                    ;[arr[i], arr[j]] = [arr[j], arr[i]]
                }
                this.displayOrderOai = arr
            }
            this.$nextTick(() => {
                const list = this.$refs.styleListRef
                if (list) list.scrollTo({ top: 0, behavior: 'smooth' })
            })
        },

        /**
         * KidStory 后端为 POST /create-character（与 CreateCharacter / AIBooks 一致），
         * 无 OpenAI 兼容路径 /v1/images/generations，勿改路径除非网关已部署该路由。
         */
        buildCreateCharacterRequest() {
            const prompt = (this.generatedPrompt || '').slice(0, 5000)
            const size = this.selectedSize && this.selectedSize !== 'auto'
                ? this.selectedSize
                : '1280x960'
            return {
                prompt,
                size,
                response_format: 'b64_json',
                watermark: false
            }
        },

        extractImageUrl(responseData) {
            if (!responseData) return ''
            const tryBase64 = (str, mime = 'image/png') => {
                if (!str) return ''
                const trimmed = String(str).trim()
                if (trimmed.startsWith('data:')) return trimmed
                return `data:${mime};base64,${trimmed.replace(/\s/g, '')}`
            }
            const mime = this.outputFormat === 'jpeg' ? 'image/jpeg'
                : this.outputFormat === 'webp' ? 'image/webp'
                : 'image/png'

            if (Array.isArray(responseData.data) && responseData.data.length > 0) {
                const first = responseData.data[0]
                if (first.b64_json) return tryBase64(first.b64_json, mime)
                if (first.url) return first.url
            }

            const result = responseData.message || responseData
            if (!result || typeof result !== 'object') return ''

            if (result.image_url) return result.image_url
            if (result.character_image_url) return result.character_image_url
            if (result.image_base64) return tryBase64(result.image_base64, mime)
            if (result.character_image_base64) return tryBase64(result.character_image_base64, mime)
            if (result.image) return result.image
            if (result.url) return result.url
            if (result.b64_json) return tryBase64(result.b64_json, mime)

            if (result.full_response) {
                const fr = result.full_response
                if (Array.isArray(fr.data) && fr.data.length > 0) {
                    const first = fr.data[0]
                    if (first.b64_json) return tryBase64(first.b64_json, mime)
                    if (first.url || first.ResultUrl) return first.url || first.ResultUrl
                }
                return fr.result_url || fr.ResultUrl || fr.url || ''
            }
            return result.character_image_oss_url || result.result_url || result.ResultUrl || ''
        },

        async generateIllustration() {
            if (!this.generatedPrompt) {
                ElMessage.warning({ message: this.$t('aiPicture.needPrompt') || '请先描述你想要的画面', offset: 200 })
                return
            }
            this.generatedImageUrl = null
            this.lastGeneratedPromptSnapshot = ''
            this.generating = true

            try {
                const requestData = this.buildCreateCharacterRequest()
                if (this.referenceImageUrl) {
                    requestData.image = this.referenceImageUrl
                }

                const apiUrl = this.apiBaseUrl
                    ? `${this.apiBaseUrl}/create-character`
                    : '/create-character'

                const response = await this.$http.post(apiUrl, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    timeout: 180000
                })

                const responseData = response.data
                const isWrappedFail = (responseData.code !== undefined || responseData.desc !== undefined || responseData.statuscode !== undefined)
                    && !(responseData.code === 0 || responseData.code === '0'
                        || responseData.desc === 'success'
                        || responseData.statuscode === 'success')

                if (isWrappedFail) {
                    const errorMsg = responseData.error?.message || responseData.message || responseData.desc || '生成失败，请重试'
                    throw new Error(errorMsg)
                }

                const message = responseData.message
                if (message && typeof message === 'object' && message.points !== undefined && this.$store && this.$store.state) {
                    this.$store.commit('setUserInfo', {
                        ...(this.$store.state.userInfo || {}),
                        points: message.points
                    })
                }

                const imageUrl = this.extractImageUrl(responseData)
                if (imageUrl) {
                    this.lastGeneratedPromptSnapshot = (requestData.prompt && String(requestData.prompt)) || ''
                    this.generatedImageUrl = imageUrl
                    this.imageLoading = true
                    this.imageLoadError = false
                    this.saveGeneratedImageToLocalStorage(imageUrl)
                    ElMessage.success({ message: this.$t('aiPicture.generateSuccess') || '插画生成成功！', offset: 200 })
                } else {
                    throw new Error('响应中未找到图片URL')
                }
            } catch (error) {
                console.error('生成插画失败:', error)
                let errorMessage = '生成失败，请重试'
                if (error.response) {
                    const status = error.response.status
                    const data = error.response.data
                    if (status === 401) errorMessage = '未授权，请先登录'
                    else if (status === 403) errorMessage = '无权限访问'
                    else if (status === 404) errorMessage = 'API接口不存在'
                    else if (status === 400) errorMessage = data?.message || data?.error || '请求参数错误'
                    else if (status === 500) errorMessage = '服务器错误，请稍后重试'
                    else errorMessage = data?.message || data?.error || `请求失败 (${status})`
                } else if (error.request) {
                    errorMessage = '网络错误，请检查网络连接'
                } else if (error.message) {
                    errorMessage = error.message
                }
                ElMessage.error({ message: errorMessage, offset: 200 })
            } finally {
                this.generating = false
            }
        },

        async compressDataUrlIfNeeded(dataUrl, maxBytes = 900 * 1024) {
            if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl
            try {
                const blob = await fetch(dataUrl).then(r => r.blob())
                if (blob.size <= maxBytes) return dataUrl
                return new Promise((resolve, reject) => {
                    const img = new Image()
                    img.onload = () => {
                        const canvas = document.createElement('canvas')
                        let w = img.width
                        let h = img.height
                        const maxDim = 1200
                        if (w > maxDim || h > maxDim) {
                            if (w >= h) {
                                h = Math.round((h * maxDim) / w)
                                w = maxDim
                            } else {
                                w = Math.round((w * maxDim) / h)
                                h = maxDim
                            }
                        }
                        canvas.width = w
                        canvas.height = h
                        const ctx = canvas.getContext('2d')
                        ctx.drawImage(img, 0, 0, w, h)
                        let quality = 0.82
                        const tryCanvas = () => {
                            canvas.toBlob(
                                (blob) => {
                                    if (blob.size <= maxBytes || quality <= 0.3) {
                                        const reader = new FileReader()
                                        reader.onload = () => resolve(reader.result)
                                        reader.onerror = reject
                                        reader.readAsDataURL(blob)
                                    } else {
                                        quality = Math.max(0.3, quality - 0.15)
                                        tryCanvas()
                                    }
                                },
                                'image/jpeg',
                                quality
                            )
                        }
                        tryCanvas()
                    }
                    img.onerror = () => resolve(dataUrl)
                    img.src = dataUrl
                })
            } catch (e) {
                console.warn('压缩插画失败，使用原图', e)
                return dataUrl
            }
        },

        async collectIllustration() {
            if (!this.generatedImageUrl) {
                ElMessage.warning({ message: '图片尚未生成，请稍候', offset: 200 })
                return
            }
            const token = localStorage.getItem('token') || ''
            if (!token) {
                ElMessage.error({ message: '请先登录', offset: 200 })
                return
            }
            this.collecting = true
            try {
                let pictureValue = this.generatedImageUrl
                if (pictureValue && !pictureValue.startsWith('http://') && !pictureValue.startsWith('https://') && !pictureValue.startsWith('data:')) {
                    pictureValue = `https://static.kidstory.cc/${pictureValue}`
                }
                const rawPrompt = (this.lastGeneratedPromptSnapshot || this.generatedPrompt || '').trim()
                const descMax = 10000
                const description = (rawPrompt || '从灵感库生成的插画').slice(0, descMax)
                let title = 'AI插画'
                if (rawPrompt) {
                    const trimmed = rawPrompt.replace(/\s+/g, ' ').trim()
                    if (trimmed) {
                        const maxLen = 8
                        title = trimmed.length > maxLen ? trimmed.slice(0, maxLen) + '…' : trimmed
                    }
                }
                // JSON + base64 整段易超过网关 1MB 限制，改为 multipart 上传，与 UploadIllustration 一致
                const form = new FormData()
                if (pictureValue && pictureValue.startsWith('data:')) {
                    // multipart 单图文件可接近 1MB；目标压在 1MB 内、尽量保画质，不再压到几百 KB
                    const underOneMb = 1000 * 1024
                    const targetBytes = 980 * 1024
                    let compact = await this.compressDataUrlIfNeeded(pictureValue, targetBytes)
                    let blob = await (await fetch(compact)).blob()
                    if (blob.size > underOneMb) {
                        compact = await this.compressDataUrlIfNeeded(compact, 900 * 1024)
                        blob = await (await fetch(compact)).blob()
                    }
                    form.append('picture', blob, 'illustration.jpg')
                } else {
                    form.append('picture', pictureValue)
                }
                form.append('title', title)
                form.append('description', description)
                form.append('type', 'others')

                const response = await this.$http.post('/ill/', form, {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                if (response.data && (response.data.desc === 'success' || response.data.code === 0 || response.data.code === '0')) {
                    ElMessage.success({ message: '收集插画成功，去我的创作中查看吧', offset: 200 })
                } else {
                    throw new Error(response.data?.message || '保存失败')
                }
            } catch (error) {
                console.error('收集插画失败:', error)
                const data = error.response?.data
                const inner = (typeof data?.message === 'object' && data?.message) ? data.message : null
                const reason = (inner && (inner.message || inner.Message)) || (typeof data?.message === 'string' ? data.message : '') || data?.error || error.message || '保存失败，请重试'
                let errorMessage = typeof reason === 'string' ? reason : String(reason)
                if (errorMessage === 'request entity too large' || inner?.limit || String(JSON.stringify(data || {})).includes('entity too large')) {
                    errorMessage = '内容超过大小限制。已用压缩后上传，若仍失败请先从本页「下载到本地」再到上传页提交'
                }
                ElMessage.error({ message: `收集插画失败: ${errorMessage}`, offset: 200 })
            } finally {
                this.collecting = false
            }
        },

        async downloadIllustration() {
            if (!this.generatedImageUrl) {
                ElMessage.warning({ message: '图片尚未生成，请稍候', offset: 200 })
                return
            }
            this.downloading = true
            try {
                const link = document.createElement('a')
                link.href = this.generatedImageUrl
                const timestamp = new Date().getTime()
                link.download = `illustration_${timestamp}.jpg`
                if (this.generatedImageUrl.startsWith('http://') || this.generatedImageUrl.startsWith('https://')) {
                    try {
                        const response = await fetch(this.generatedImageUrl)
                        const blob = await response.blob()
                        const blobUrl = window.URL.createObjectURL(blob)
                        link.href = blobUrl
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)
                        ElMessage.success({ message: '插画下载成功', offset: 200 })
                    } catch (fetchError) {
                        console.error('下载图片失败:', fetchError)
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        ElMessage.info({ message: '已在新窗口打开图片，请右键保存', offset: 200 })
                    }
                } else {
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    ElMessage.success({ message: '插画下载成功', offset: 200 })
                }
            } catch (error) {
                console.error('下载插画失败:', error)
                ElMessage.error({ message: '下载失败，请重试', offset: 200 })
            } finally {
                this.downloading = false
            }
        },

        saveGeneratedImageToLocalStorage(imageUrl) {
            try {
                const imageData = {
                    url: imageUrl,
                    prompt: this.lastGeneratedPromptSnapshot || this.generatedPrompt || '',
                    artStyle: this.selectedStyle?.artStyle
                        || (this.selectedPackItem ? this.packItemDisplayTitle(this.selectedPackItem) : '')
                        || (this.selectedOaiItem ? this.selectedOaiItem.title : '')
                        || '',
                    timestamp: Date.now()
                }
                localStorage.setItem('home_generated_image', JSON.stringify(imageData))
            } catch (error) {
                console.error('保存插画到 localStorage 失败:', error)
                try {
                    localStorage.removeItem('home_generated_image')
                    localStorage.setItem('home_generated_image', JSON.stringify({
                        url: imageUrl,
                        prompt: this.lastGeneratedPromptSnapshot || this.generatedPrompt || '',
                        artStyle: this.selectedStyle?.artStyle
                            || (this.selectedPackItem ? this.packItemDisplayTitle(this.selectedPackItem) : '')
                            || (this.selectedOaiItem ? this.selectedOaiItem.title : '')
                            || '',
                        timestamp: Date.now()
                    }))
                } catch (e) {
                    console.error('清除旧数据后重新保存失败:', e)
                }
            }
        },

        restoreLatestGeneratedImage() {
            try {
                const saved = localStorage.getItem('home_generated_image')
                if (saved) {
                    const imageData = JSON.parse(saved)
                    if (imageData && imageData.url) {
                        this.generatedImageUrl = imageData.url
                        this.lastGeneratedPromptSnapshot = imageData.prompt
                            ? String(imageData.prompt)
                            : ''
                    }
                }
            } catch (error) {
                console.error('恢复插画失败:', error)
            }
        },

        handleImageError() {
            this.imageLoadError = true
            this.imageLoading = false
            ElMessage.warning({ message: '图片加载失败，可能是网络问题或链接已过期', offset: 200 })
        },
        handleImageLoad() {
            this.imageLoading = false
            this.imageLoadError = false
        },

        clearGeneratedImage() {
            try {
                localStorage.removeItem('home_generated_image')
                this.generatedImageUrl = null
                this.lastGeneratedPromptSnapshot = ''
                this.imageLoading = false
                this.imageLoadError = false
                ElMessage.success({ message: '已清除插画数据', offset: 200 })
            } catch (error) {
                ElMessage.error({ message: '清除失败，请重试', offset: 200 })
            }
        },

        isCharacterInput(input) {
            if (!input || typeof input !== 'string') return false
            const trimmed = input.trim()
            if (!trimmed) return false
            const text = trimmed.toLowerCase()
            const characterKeywords = [
                '人', '人物', '角色',
                '男孩', '女孩', '男人', '女人', '小孩', '儿童', '孩子', '小朋友',
                '小动物', '小精灵', '小公主', '王子', '魔法师', '骑士',
                '老人', '老年', '青年', '少年', '少女',
                'baby', 'child', 'children', 'boy', 'girl', 'man', 'woman', 'person', 'people', 'character',
                'kid', 'kids', 'adult', 'elderly', 'teenager', 'teen'
            ]
            return characterKeywords.some(k => text.includes(k))
        }
    }
}
</script>

<style scoped>
.ai-picture-page {
    min-height: calc(100vh - 50px);
    background: #ffffff;
    padding: 24px 16px 80px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.page-main {
    max-width: 1350px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-height: 0;
    flex: 1;
}

.workspace-layout {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 24px;
    width: 100%;
    min-height: min(70vh, 720px);
    max-height: calc(100vh - 120px);
}

.inspiration-column {
    flex: 0 0 520px;
    width: 520px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid #e6e8ec;
    border-radius: 20px;
    background: #fafbfc;
    padding: 14px 12px 12px;
    box-sizing: border-box;
    overflow: hidden;
}

.editor-column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 28px;
    min-height: 0;
}

/* 输入框卡片 */
.prompt-card {
    background: #ffffff;
    border: 1px solid #e6e8ec;
    border-radius: 24px;
    padding: 18px 18px 12px;
    box-shadow: 0 6px 24px rgba(15, 23, 42, 0.04);
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.prompt-card.is-focused {
    border-color: #c9c4ff;
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.12);
}

.prompt-textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    font-size: 15px;
    line-height: 1.6;
    color: #1f1f1f;
    font-family: inherit;
    padding: 0 4px;
    min-height: 44px;
}

.prompt-textarea::placeholder {
    color: #b5b8be;
}

.selected-style-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    padding: 8px 10px;
    background: linear-gradient(135deg, rgba(129, 103, 169, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%);
    border: 1px solid rgba(129, 103, 169, 0.2);
    border-radius: 14px;
}

.selected-style-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.selected-style-thumb {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.selected-style-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.selected-style-eyebrow {
    font-size: 11px;
    color: #8167a9;
    font-weight: 500;
    letter-spacing: 0.3px;
}

.selected-style-name {
    font-size: 14px;
    color: #1f1f1f;
    font-weight: 500;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.selected-style-clear {
    flex-shrink: 0;
    border: none;
    background: #fff;
    color: #5f6368;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 10px;
    cursor: pointer;
    border: 1px solid #e4e7ed;
}

.selected-style-clear:hover {
    color: #8167a9;
    border-color: #c9c4ff;
}

.caret-flip {
    transform: rotate(180deg);
}

/* 工具栏 */
.prompt-toolbar {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 10px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #5f6368;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.tool-btn:hover {
    background: #f3f4f6;
    color: #1f1f1f;
}

.tool-btn.icon-only {
    width: 32px;
    padding: 0;
    justify-content: center;
}

.tool-btn.pill {
    background: #f5f6f8;
    border-radius: 999px;
    padding: 0 12px;
}

.tool-btn.pill:hover {
    background: #ebedf0;
}

.tool-btn.pill.active {
    background: #ebedf0;
}

.caret {
    opacity: 0.7;
    margin-left: 2px;
    flex-shrink: 0;
}

.toolbar-dropdown-label {
    max-width: 112px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.menu-model {
    min-width: 260px;
}

.menu-quality {
    min-width: 200px;
}

.hidden-file-input {
    display: none;
}

.advanced-panel {
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid #eef0f3;
}

.advanced-panel-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px 20px;
}

.advanced-field-label {
    display: block;
    font-size: 11px;
    color: #9aa0a6;
    margin-bottom: 4px;
    letter-spacing: 0.2px;
}

.advanced-panel .size-select-wrap {
    min-width: 0;
}

/* 尺寸下拉 */
.size-select-wrap {
    position: relative;
}

/* 下拉面版：向下展开，避免与固定 TopBar(z-index:10000) 重叠；置于顶栏之上 */
.size-menu {
    position: absolute;
    top: calc(100% + 6px);
    bottom: auto;
    left: 0;
    right: auto;
    background: #fff;
    border: 1px solid #ececf0;
    border-radius: 14px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
    padding: 6px;
    min-width: 220px;
    max-height: min(60vh, 400px);
    overflow-y: auto;
    z-index: 10020;
}

.size-menu-group-label {
    padding: 6px 10px 2px;
    font-size: 11px;
    color: #9aa0a6;
    letter-spacing: 0.4px;
    text-transform: uppercase;
}

.size-menu-divider {
    height: 1px;
    background: #f1f2f5;
    margin: 4px 6px;
}

.size-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: none;
    background: transparent;
    border-radius: 10px;
    cursor: pointer;
    color: #1f1f1f;
    font-size: 13px;
    text-align: left;
    transition: background 0.15s ease;
}

.size-menu-item:hover {
    background: #f5f6f8;
}

.size-menu-item.active {
    background: rgba(99, 102, 241, 0.08);
    color: #5b5bd6;
}

.size-icon {
    display: inline-block;
    border: 1.5px solid currentColor;
    border-radius: 3px;
    flex-shrink: 0;
    opacity: 0.85;
}

.size-label {
    flex: 1;
    font-weight: 500;
}

.size-dim {
    font-size: 11px;
    color: #9aa0a6;
}

/* 参考图缩略 */
.ref-thumb-wrap {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    overflow: visible;
    flex-shrink: 0;
}

.ref-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e6e8ec;
}

.ref-thumb-clear {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1f1f1f;
    color: #fff;
    border: 2px solid #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
}

/* 发送按钮 */
.send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #1f1f1f;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
}

.send-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #111;
}

.send-btn:disabled {
    background: #d8dade;
    color: #fff;
    cursor: not-allowed;
    box-shadow: none;
}

.send-btn.is-loading {
    background: #5b5bd6;
}

.send-spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.45);
    border-top-color: #fff;
    animation: ai-spin 0.8s linear infinite;
}

@keyframes ai-spin {
    to { transform: rotate(360deg); }
}

.style-tab-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 2px;
    padding-bottom: 2px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.style-tab-row::-webkit-scrollbar {
    display: none;
}

.style-tab {
    border: 1px solid #e6e8ec;
    background: #fff;
    color: #5f6368;
    font-size: 13px;
    padding: 6px 14px;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.style-tab:hover {
    border-color: #c9c4ff;
    color: #4a4f57;
}

.style-tab.active {
    background: linear-gradient(135deg, rgba(129, 103, 169, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%);
    border-color: #8167a9;
    color: #3d3550;
    font-weight: 500;
}

.style-source-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 4px;
}

.style-source-tab {
    border: 1px solid #d8dbe0;
    background: #fafbfc;
    color: #3c4043;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.style-source-tab:hover {
    border-color: #b8b3e8;
    background: #f3f0ff;
}

.style-source-tab.active {
    background: #8167a9;
    border-color: #8167a9;
    color: #fff;
}

.style-tab-row--pack {
    max-height: none;
}

.style-tab-row--pack .style-tab {
    font-size: 12px;
    padding: 5px 10px;
}

.pack-attrib {
    margin: 0 0 4px;
    font-size: 11px;
    color: #9aa0a6;
    line-height: 1.4;
}

.style-list-item--pack .style-list-item-text {
    -webkit-line-clamp: 2;
    line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.style-item-fallback,
.selected-style-thumb--empty {
    background: linear-gradient(145deg, #eceef2 0%, #e0e3ea 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.style-item-fallback::after,
.selected-style-thumb--empty::after {
    content: 'GPT';
    font-size: 10px;
    font-weight: 700;
    color: #9aa0a6;
    letter-spacing: 0.5px;
}

.selected-style-thumb--empty {
    min-width: 40px;
}

/* 浏览灵感 */
.inspiration-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    flex: 1;
}

.inspiration-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.inspiration-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f1f1f;
    margin: 0;
}

.inspiration-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.link-btn {
    border: none;
    background: transparent;
    color: #5f6368;
    font-size: 13px;
    cursor: pointer;
    padding: 0 6px;
    height: 28px;
}

.link-btn:hover {
    color: #1f1f1f;
}

.arrow-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid #e6e8ec;
    background: #fff;
    color: #5f6368;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.arrow-btn:hover:not(:disabled) {
    background: #f5f6f8;
    color: #1f1f1f;
}

.arrow-btn:disabled {
    color: #c9ccd2;
    cursor: not-allowed;
}

/* 风格列表（纵向滚轴） */
.style-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 8px;
    align-content: start;
    padding: 4px 2px 8px 0;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
}

.style-list::-webkit-scrollbar {
    width: 6px;
}

.style-list::-webkit-scrollbar-track {
    background: transparent;
}

.style-list::-webkit-scrollbar-thumb {
    background: #e1e3e8;
    border-radius: 3px;
}

.style-list::-webkit-scrollbar-thumb:hover {
    background: #c9ccd2;
}

.style-list-item {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding: 6px 4px 8px;
    border-radius: 12px;
    border: 1px solid #ececf0;
    background: #fff;
    cursor: pointer;
    text-align: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.style-list-item:hover {
    border-color: #d6d9df;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
    transform: translateY(-1px);
}

.style-list-item.selected {
    border-color: #5b5bd6;
    box-shadow: 0 0 0 2px rgba(91, 91, 214, 0.35);
    background: #f7f7ff;
}

.style-list-item-thumb {
    width: 100%;
    aspect-ratio: 1;
    min-height: 0;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    background: #f0f1f3;
    border: 1px solid rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
}

.style-list-item-thumb--add {
    background: #f5f6f8;
    color: #8a8e95;
    border: 1.5px dashed #d6d9df;
}

.style-list-item--upload:hover .style-list-item-thumb--add {
    border-color: #5b5bd6;
    color: #5b5bd6;
    background: #f9f9ff;
}

.style-list-item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.style-list-item-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    width: 100%;
    align-items: center;
    text-align: center;
}

.style-list-item--oai .style-list-item-desc {
    display: none;
}

.style-list-item-text {
    font-size: 11px;
    line-height: 1.4;
    color: #1f1f1f;
    font-weight: 500;
    min-width: 0;
    width: 100%;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.style-list-item--oai .style-list-item-text {
    font-size: 12px;
    font-weight: 600;
}

.style-list-item-desc {
    font-size: 11px;
    line-height: 1.3;
    color: #6b7280;
    text-align: center;
    width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 上传项 */
.style-list-item--upload {
    background: #fff;
    border-style: dashed;
}

/* 悬停放大预览（挂到 body，避免在滚动层被裁切） */
.style-image-preview-floater {
    position: fixed;
    z-index: 10050;
    pointer-events: auto;
    line-height: 0;
    background: #fff;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.2);
    overflow: hidden;
}

.style-image-preview-img {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

/* 结果区 */
.result-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.result-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 0;
    color: #6b7280;
}

.result-spinner {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid #e6e8ec;
    border-top-color: #5b5bd6;
    animation: ai-spin 0.8s linear infinite;
}

.result-card {
    width: 100%;
    background: #fff;
    border: 1px solid #ececf0;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.result-image {
    display: block;
    width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 14px;
    background: #f5f6f8;
}

.result-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
}

.result-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    border: 1px solid #e6e8ec;
    background: #fff;
    color: #1f1f1f;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.result-btn:hover:not(:disabled) {
    transform: translateY(-1px);
}

.result-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.result-btn.primary {
    background: #1f1f1f;
    color: #fff;
    border-color: #1f1f1f;
}

.result-btn.primary:hover:not(:disabled) {
    background: #111;
}

.result-btn.ghost.danger {
    color: #c0394a;
    border-color: rgba(192, 57, 74, 0.3);
}

.result-btn.ghost.danger:hover:not(:disabled) {
    background: rgba(192, 57, 74, 0.08);
}

/* 移动端适配 */
@media (max-width: 640px) {
    .ai-picture-page {
        padding: 12px 12px 60px;
    }

    .prompt-card {
        padding: 14px 14px 10px;
        border-radius: 20px;
    }

    .prompt-textarea {
        font-size: 14px;
    }

    .tool-btn.pill {
        height: 30px;
        padding: 0 10px;
        font-size: 12px;
    }

    .tool-btn.pill span {
        display: inline;
    }

    .workspace-layout {
        flex-direction: column;
        max-height: none;
        min-height: 0;
        gap: 16px;
    }

    .inspiration-column {
        flex: 0 0 auto;
        width: 100%;
        max-width: 100%;
        max-height: 52vh;
    }

    .style-list {
        max-height: 38vh;
        grid-template-columns: repeat(2, 1fr);
    }

    .result-image {
        max-height: 50vh;
    }
}

@media (max-width: 380px) {
    .toolbar-left {
        gap: 6px;
    }

    .size-toolbar-text {
        max-width: 72px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

}
</style>
