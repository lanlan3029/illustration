<template>
    <div class="container">
        <div class="page-head">
            <h2>{{ $t('layoutExport.title') }}</h2>
            <p>{{ pageSubtitle }}</p>
        </div>

        <nav class="step-bar" :aria-label="$t('layoutExport.stepBarAria')">
            <div
                v-for="item in stepItems"
                :key="item.id"
                class="step-bar-item"
                :class="stepBarItemClass(item.id)"
            >
                <span class="step-bar-marker">{{ stepMarker(item.id) }}</span>
                <span class="step-bar-label">{{ $t(item.labelKey) }}</span>
            </div>
        </nav>

        <!-- 第一步：印刷尺寸 -->
        <div v-if="step === 'format'" class="format-step">
            <div v-if="canResume" class="resume-banner">
                <div class="resume-banner-text">
                    <strong>{{ $t('layoutExport.resumeLast') }}</strong>
                    <span>{{ resumeSummary }}</span>
                </div>
                <el-button type="primary" plain size="small" @click="resumeLastSettings">
                    {{ $t('layoutExport.resumeLastAction') }}
                </el-button>
            </div>
            <div class="format-section format-section--solo">
                <h3 class="format-section-title">{{ $t('bookExport.formatTitle') }}</h3>
                <p class="format-section-hint">{{ $t('bookExport.formatHint') }}</p>
                <div class="format-grid">
                    <button
                        v-for="fmt in exportFormats"
                        :key="fmt.id"
                        type="button"
                        class="format-card"
                        :class="{ 'is-active': bookExportFormatId === fmt.id }"
                        @click="confirmFormat(fmt.id)"
                    >
                        <span class="format-preview" :style="{ aspectRatio: fmt.aspectRatioCss }">
                            <span class="format-preview-fill"></span>
                            <span class="format-preview-safe-ring"></span>
                        </span>
                        <span class="format-card-title">{{ $t(fmt.nameKey) }}</span>
                        <span class="format-card-desc">{{ $t(fmt.descKey) }}</span>
                        <span class="format-card-meta">{{ formatMeta(fmt) }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 第二步：选插画 -->
        <div v-else-if="step === 'pick'" class="pick-step">
            <div class="selected-section">
                <div class="pick-toolbar">
                    <div class="pick-crumb">
                        <span class="pick-crumb-item">
                            <span class="pick-crumb-label">{{ $t('bookExport.formatTitle') }}</span>
                            <span class="pick-crumb-value">{{ $t(activeFormat.nameKey) }}</span>
                        </span>
                    </div>
                    <div class="pick-crumb-actions">
                        <el-button size="small" link type="primary" @click="backToFormat">
                            {{ $t('layoutExport.changeFormat') }}
                        </el-button>
                    </div>
                </div>

                <p class="pick-purpose-hint">{{ $t('layoutExport.pickHint') }}</p>

                <div v-if="checkedImage.length > 0">
                    <div class="selected-header">
                        <span class="selected-count">{{ $t('composeIllustration.selectedCount', { count: checkedImage.length }) }}</span>
                        <el-button size="small" type="text" @click="clearSelected">{{ $t('composeIllustration.clear') }}</el-button>
                    </div>
                    <div class="selected-preview" @dragover.prevent @drop.prevent>
                        <div
                            v-for="(item, index) in checkedImage"
                            :key="item._id || index"
                            class="selected-item"
                            :draggable="true"
                            @dragstart="handleDragStart($event, index)"
                            @dragover="handleDragOver($event, index)"
                            @dragleave="handleDragLeave"
                            @drop="handleDrop($event, index)"
                            @dragend="handleDragEnd"
                            :class="{
                                dragging: dragIndex === index,
                                'drag-over': dragOverIndex === index && dragIndex !== index,
                            }"
                        >
                            <el-image
                                :src="illThumbUrl(item)"
                                style="width:100%; height:100%"
                                fit="cover"
                            />
                            <div class="selected-order">{{ index + 1 }}</div>
                            <div class="selected-remove" @click.stop="removeSelected(index)">
                                <i class="el-icon-close"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="images-section"
                v-infinite-scroll="loadMoreIlls"
                :infinite-scroll-disabled="loadingIll || !hasMoreIlls"
                :infinite-scroll-distance="160"
            >
                <ul class="items">
                    <li
                        v-for="(item, index) in illusArr"
                        :key="item._id || index"
                        @click="handleAdd(item)"
                        :class="{ selected: isSelected(item) }"
                    >
                        <el-image :src="illThumbUrl(item)" fit="cover" class="illus-thumb" loading="lazy" />
                        <span v-if="isSelected(item)" class="check-mark">
                            <i class="el-icon-check"></i>
                        </span>
                    </li>
                </ul>
                <p v-if="loadingIll" class="illus-load-tip">{{ $t('common.loading') }}</p>
                <p v-else-if="!illusArr.length" class="illus-load-tip">{{ $t('layoutExport.noIllustrations') }}</p>
                <p v-else-if="!hasMoreIlls" class="illus-load-tip illus-load-tip--muted">{{ $t('layoutExport.allIllustrationsLoaded') }}</p>
            </div>

            <footer class="pick-sticky-bar">
                <p class="pick-sticky-status">
                    {{
                        checkedImage.length > 0
                            ? $t('layoutExport.pickSelectedInfo', { count: checkedImage.length })
                            : $t('layoutExport.pickPleaseSelect')
                    }}
                </p>
                <el-button
                    type="primary"
                    size="large"
                    class="pick-sticky-btn"
                    :disabled="checkedImage.length === 0"
                    @click="enterFlow"
                >
                    {{ $t('layoutExport.continueToExport') }}
                </el-button>
            </footer>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import {
  BOOK_EXPORT_FORMATS,
  formatSizeLabel,
  getBookExportFormat,
  normalizeBookExportFormatId,
} from '@/data/bookExportFormats';
import {
  canResumeLayoutExport,
  readLayoutExportSession,
  writeLayoutExportSession,
} from '@/utils/layoutExportSession';

const STEP_ITEMS = [
  { id: 'format', labelKey: 'layoutExport.stepFormat' },
  { id: 'pick', labelKey: 'layoutExport.stepPick' },
];

export default {
  data() {
    return {
      step: 'format',
      illusArr: [],
      illusPage: 1,
      hasMoreIlls: true,
      loadingIll: false,
      checkedImage: [],
      userid: localStorage.getItem('id'),
      dragIndex: null,
      dragOverIndex: null,
    };
  },
  computed: {
    ...mapState(['imgToPDF', 'bookExportFormatId']),
    exportFormats() {
      return BOOK_EXPORT_FORMATS;
    },
    stepItems() {
      return STEP_ITEMS;
    },
    stepOrder() {
      return STEP_ITEMS.map((item) => item.id);
    },
    canResume() {
      return this.step === 'format' && canResumeLayoutExport();
    },
    resumeSummary() {
      const session = readLayoutExportSession();
      const format = getBookExportFormat(session.formatId);
      const formatName = format ? this.$t(format.nameKey) : '';
      const count = session.checkedImages?.length || 0;
      return this.$t('layoutExport.resumeLastDesc', { format: formatName, count });
    },
    activeFormat() {
      return getBookExportFormat(this.bookExportFormatId);
    },
    pageSubtitle() {
      if (this.step === 'format') return this.$t('layoutExport.subtitleStepFormat');
      return this.$t('layoutExport.subtitleStepPick');
    },
  },
  methods: {
    stepBarItemClass(id) {
      const current = this.stepOrder.indexOf(this.step);
      const index = this.stepOrder.indexOf(id);
      if (index < 0) return '';
      if (index === current) return 'is-active';
      if (index < current) return 'is-done';
      return 'is-pending';
    },
    stepMarker(id) {
      const current = this.stepOrder.indexOf(this.step);
      const index = this.stepOrder.indexOf(id);
      if (index < 0) return '•';
      if (index < current) return '✓';
      return String(index + 1);
    },
    applySessionToState(session = readLayoutExportSession()) {
      const formatId = normalizeBookExportFormatId(session.formatId);
      if (formatId && getBookExportFormat(formatId)) {
        this.$store.commit('setBookExportFormat', formatId);
      }
      if (session.checkedImages?.length) {
        this.checkedImage = session.checkedImages.filter((i) => i && !i.blank && i._id);
      }
    },
    persistSession(patch) {
      writeLayoutExportSession(patch);
    },
    persistCheckedImages() {
      this.persistSession({ checkedImages: this.checkedImage });
    },
    illThumbUrl(item) {
      if (!item?.content) return '';
      const c = String(item.content).trim();
      if (c.startsWith('http://') || c.startsWith('https://') || c.startsWith('data:')) return c;
      return `https://static.kidstory.cc/${c}`;
    },
    formatMeta(fmt) {
      return formatSizeLabel(fmt);
    },
    persistFormat(id) {
      const formatId = normalizeBookExportFormatId(id);
      this.$store.commit('setBookExportFormat', formatId);
      this.persistSession({ formatId });
    },
    confirmFormat(id) {
      this.persistFormat(id);
      this.persistSession({ formatConfirmed: true, purpose: 'digital' });
      this.step = 'pick';
      this.fetchIllustrations(true);
    },
    backToFormat() {
      this.step = 'format';
    },
    resumeLastSettings() {
      const session = readLayoutExportSession();
      if (!canResumeLayoutExport(session)) return;
      this.applySessionToState(session);
      this.step = 'pick';
      this.fetchIllustrations(true);
    },
    enterFlow() {
      if (!this.commitSelected()) return;
      this.$router.push({ name: 'topdf' });
    },
    async fetchIllustrations(reset = false) {
      if (this.loadingIll) return;
      if (!reset && !this.hasMoreIlls) return;

      if (reset) {
        this.illusPage = 1;
        this.hasMoreIlls = true;
        this.illusArr = [];
      }

      this.loadingIll = true;
      try {
        const res = await this.$http.get(
          `/ill/?sort_param=createdAt&sort_num=desc&ownerid=${this.userid}&page=${this.illusPage}`
        );
        const list = res.data?.message || res.data?.data || [];
        const items = Array.isArray(list) ? list : [];

        if (!items.length) {
          this.hasMoreIlls = false;
          return;
        }

        const existing = new Set(this.illusArr.map((i) => i._id));
        const fresh = items.filter((i) => i?._id && !existing.has(i._id));
        this.illusArr.push(...fresh);
        this.illusPage += 1;

        if (fresh.length === 0) {
          this.hasMoreIlls = false;
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingIll = false;
      }
    },
    loadMoreIlls() {
      this.fetchIllustrations(false);
    },
    isSelected(item) {
      return this.checkedImage.some((img) => img._id === item._id);
    },
    handleAdd(item) {
      const index = this.checkedImage.findIndex((img) => img._id === item._id);
      if (index > -1) {
        this.checkedImage.splice(index, 1);
      } else {
        this.checkedImage.push(item);
      }
      this.persistCheckedImages();
    },
    removeSelected(index) {
      this.checkedImage.splice(index, 1);
      this.persistCheckedImages();
    },
    clearSelected() {
      this.checkedImage = [];
      this.persistCheckedImages();
    },
    handleDragStart(event, index) {
      this.dragIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', event.target.outerHTML);
      event.target.style.opacity = '0.5';
    },
    handleDragOver(event, index) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (this.dragIndex !== null && this.dragIndex !== index) {
        this.dragOverIndex = index;
      }
      return false;
    },
    handleDragLeave(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.dragOverIndex = null;
      }
    },
    handleDrop(event, dropIndex) {
      event.preventDefault();
      event.stopPropagation();

      if (this.dragIndex === null || this.dragIndex === dropIndex) {
        this.dragOverIndex = null;
        return false;
      }

      const draggedItem = this.checkedImage[this.dragIndex];
      this.checkedImage.splice(this.dragIndex, 1);
      this.checkedImage.splice(dropIndex, 0, draggedItem);

      this.dragIndex = null;
      this.dragOverIndex = null;
      this.persistCheckedImages();
      return false;
    },
    handleDragEnd(event) {
      event.target.style.opacity = '';
      this.dragIndex = null;
      this.dragOverIndex = null;
    },
    commitSelected() {
      if (!this.checkedImage.length) return false;
      this.persistCheckedImages();
      this.$store.commit('setBookIllustrations', [...this.checkedImage]);
      return true;
    },
    restoreFromStore() {
      if (this.imgToPDF?.length) {
        this.checkedImage = this.imgToPDF.filter((i) => i && !i.blank);
      }
    },
    resolveInitialStep() {
      const edit = this.$route.query.edit;
      if (edit === 'format') {
        this.restoreFromSession();
        this.step = 'format';
        return false;
      }

      this.restoreFromStore();
      const session = readLayoutExportSession();
      this.applySessionToState(session);

      if (session.formatConfirmed) {
        this.step = 'pick';
        return true;
      }
      this.step = 'format';
      return false;
    },
    restoreFromSession() {
      this.applySessionToState();
    },
  },
  mounted() {
    const enterPick = this.resolveInitialStep();
    if (enterPick) {
      this.fetchIllustrations(true);
    }
  },
};
</script>

<style scoped>
.container {
    padding: 0 24px 32px;
    text-align: left;
    box-sizing: border-box;
}

.page-head {
    margin: 1vw 1vw 0;
    padding-top: 8px;
}

.page-head h2 {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 700;
    color: #303133;
}

.page-head p {
    margin: 0;
    font-size: 14px;
    color: #909399;
    line-height: 1.5;
}

.step-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 0 1vw 16px;
    padding: 12px 0 4px;
}

.step-bar-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: #f0f2f5;
    color: #909399;
    font-size: 13px;
}

.step-bar-item.is-active {
    background: #efeaf8;
    color: #8167a9;
    font-weight: 600;
}

.step-bar-item.is-done {
    background: #e8f5e9;
    color: #67c23a;
}

.step-bar-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.85);
    font-size: 12px;
    font-weight: 700;
}

.resume-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #f7f5fb;
    border: 1px solid #e4dcf3;
}

.resume-banner-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    color: #606266;
}

.resume-banner-text strong {
    color: #8167a9;
}

.format-step {
    margin: 0 1vw 1vw;
}

.format-section--solo {
    margin: 0;
    padding: 28px 24px 32px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.format-section-title {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 700;
    color: #303133;
}

.format-section-hint {
    margin: 0 0 20px;
    font-size: 13px;
    color: #909399;
    line-height: 1.5;
}

.format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
}

.format-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    border: 2px solid #ebeef5;
    border-radius: 12px;
    background: #fafbfc;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.format-card:hover {
    border-color: #c5b6df;
    background: #fff;
}

.format-card.is-active {
    border-color: #8167a9;
    background: #f9f7fc;
    box-shadow: 0 0 0 1px #8167a9;
}

.format-preview {
    position: relative;
    width: 72%;
    margin: 0 auto 6px;
    border-radius: 6px;
    background: #eef0f4;
    overflow: hidden;
}

.format-preview-fill {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #c5b6df, #8167a9);
    opacity: 0.55;
}

.format-preview-safe-ring {
    position: absolute;
    inset: 12%;
    border: 1.5px dashed rgba(255, 255, 255, 0.9);
    border-radius: 3px;
    pointer-events: none;
}

.format-card-title {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
}

.format-card-desc {
    font-size: 12px;
    color: #606266;
    line-height: 1.4;
}

.format-card-meta {
    font-size: 11px;
    color: #909399;
    line-height: 1.35;
}

.pick-step {
    margin: 0 1vw 1vw;
    padding-bottom: 88px;
}

.selected-section {
    margin-bottom: 12px;
    padding: 16px 18px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.pick-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

.pick-crumb {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 13px;
}

.pick-crumb-label {
    color: #909399;
}

.pick-crumb-value {
    color: #303133;
    font-weight: 600;
}

.pick-purpose-hint {
    margin: 0 0 12px;
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
}

.selected-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.selected-count {
    font-size: 13px;
    font-weight: 600;
    color: #8167a9;
}

.selected-preview {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
}

.selected-item {
    position: relative;
    flex: 0 0 88px;
    width: 88px;
    height: 88px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid transparent;
    background: #f0f2f5;
    cursor: grab;
}

.selected-item.dragging {
    opacity: 0.5;
}

.selected-item.drag-over {
    border-color: #8167a9;
}

.selected-order {
    position: absolute;
    left: 4px;
    top: 4px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.selected-remove {
    position: absolute;
    right: 4px;
    top: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(245, 108, 108, 0.95);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
}

.images-section {
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.items li {
    position: relative;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    background: #f5f7fa;
}

.items li.selected {
    border-color: #8167a9;
}

.illus-thumb {
    width: 100%;
    height: 100%;
}

.check-mark {
    position: absolute;
    right: 8px;
    top: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #8167a9;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.illus-load-tip {
    margin: 16px 0 0;
    text-align: center;
    color: #909399;
    font-size: 13px;
}

.illus-load-tip--muted {
    opacity: 0.75;
}

.pick-sticky-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 24px calc(12px + env(safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.96);
    border-top: 1px solid #ebeef5;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}

.pick-sticky-status {
    margin: 0;
    font-size: 14px;
    color: #606266;
}

.pick-sticky-btn {
    flex-shrink: 0;
    min-width: 180px;
}

@media (max-width: 720px) {
    .format-grid {
        grid-template-columns: 1fr;
    }

    .pick-sticky-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .pick-sticky-btn {
        width: 100%;
    }
}
</style>
