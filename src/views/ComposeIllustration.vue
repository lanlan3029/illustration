<template>
    <div class="container">
        <div class="page-head">
            <h2>{{ $t('layoutExport.title') }}</h2>
            <p>{{ pageSubtitle }}</p>
        </div>

        <nav class="step-bar" :aria-label="$t('layoutExport.stepBarAria')">
            <div
                v-for="(item, index) in stepItems"
                :key="item.id"
                class="step-bar-item"
                :class="stepBarItemClass(item.id, index)"
            >
                <span class="step-bar-marker">{{ stepMarker(item.id, index) }}</span>
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
                            <span v-if="fmt.bleed" class="format-preview-fill"></span>
                            <span v-else class="format-preview-safe"></span>
                        </span>
                        <span class="format-card-title">{{ $t(fmt.nameKey) }}</span>
                        <span class="format-card-desc">{{ $t(fmt.descKey) }}</span>
                        <span class="format-card-meta">{{ formatMeta(fmt) }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 第二步：选用途 -->
        <div v-else-if="step === 'purpose'" class="purpose-step">
            <div class="purpose-toolbar">
                <span class="purpose-toolbar-label">{{ $t('bookExport.formatTitle') }}</span>
                <span class="purpose-toolbar-value">{{ $t(activeFormat.nameKey) }}</span>
                <el-button size="small" link type="primary" @click="backToFormat">
                    {{ $t('layoutExport.changeFormat') }}
                </el-button>
            </div>
            <div class="purpose-section">
                <h3 class="purpose-section-title">{{ $t('layoutExport.purposeTitle') }}</h3>
                <p class="purpose-section-hint">{{ $t('layoutExport.purposeHint') }}</p>
                <div class="purpose-grid">
                    <button
                        type="button"
                        class="purpose-card"
                        @click="confirmPurpose('digital')"
                    >
                        <span class="purpose-card-icon purpose-card-icon--digital">📱</span>
                        <span class="purpose-card-title">{{ $t('layoutExport.purposeDigitalTitle') }}</span>
                        <span class="purpose-card-desc">{{ $t('layoutExport.purposeDigitalDesc') }}</span>
                        <ul class="purpose-card-list">
                            <li>{{ $t('layoutExport.purposeDigitalPoint1') }}</li>
                            <li>{{ $t('layoutExport.purposeDigitalPoint2') }}</li>
                            <li>{{ $t('layoutExport.purposeDigitalPoint3') }}</li>
                        </ul>
                    </button>
                    <button
                        type="button"
                        class="purpose-card"
                        @click="confirmPurpose('print')"
                    >
                        <span class="purpose-card-icon purpose-card-icon--print">🖨</span>
                        <span class="purpose-card-title">{{ $t('layoutExport.purposePrintTitle') }}</span>
                        <span class="purpose-card-desc">{{ $t('layoutExport.purposePrintDesc') }}</span>
                        <ul class="purpose-card-list">
                            <li>{{ $t('layoutExport.purposePrintPoint1') }}</li>
                            <li>{{ $t('layoutExport.purposePrintPoint2') }}</li>
                            <li>{{ $t('layoutExport.purposePrintPoint3') }}</li>
                        </ul>
                    </button>
                </div>
            </div>
        </div>

        <!-- 第三步：选插画（仅数字绘本） -->
        <div v-else-if="step === 'pick'" class="pick-step">
            <div class="selected-section">
                <div class="pick-toolbar">
                    <div class="pick-crumb">
                        <span class="pick-crumb-item">
                            <span class="pick-crumb-label">{{ $t('bookExport.formatTitle') }}</span>
                            <span class="pick-crumb-value">{{ $t(activeFormat.nameKey) }}</span>
                        </span>
                        <span class="pick-crumb-sep">·</span>
                        <span class="pick-crumb-item">
                            <span class="pick-crumb-label">{{ $t('layoutExport.purposeShort') }}</span>
                            <span class="pick-crumb-value">{{ purposeLabel }}</span>
                        </span>
                    </div>
                    <div class="pick-crumb-actions">
                        <el-button size="small" link type="primary" @click="backToPurpose">
                            {{ $t('layoutExport.changePurpose') }}
                        </el-button>
                        <el-button size="small" link type="primary" @click="backToFormat">
                            {{ $t('layoutExport.changeFormat') }}
                        </el-button>
                    </div>
                </div>

                <p class="pick-purpose-hint">{{ pickHint }}</p>

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
                    {{ checkedImage.length > 0 ? pickSelectedInfo : pickPleaseSelect }}
                </p>
                <el-button
                    type="primary"
                    size="large"
                    class="pick-sticky-btn"
                    :disabled="checkedImage.length === 0"
                    @click="enterFlow"
                >
                    {{ continueLabel }}
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
} from '@/data/bookExportFormats';
import {
  canResumeLayoutExport,
  readLayoutExportSession,
  writeLayoutExportSession,
} from '@/utils/layoutExportSession';

const STEP_ITEMS = [
  { id: 'format', labelKey: 'layoutExport.stepFormat' },
  { id: 'purpose', labelKey: 'layoutExport.stepPurpose' },
  { id: 'pick', labelKey: 'layoutExport.stepPick' },
];

export default {
  data() {
    return {
      step: 'format',
      exportPurpose: null,
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
      const purposeName = session.purpose === 'print'
        ? this.$t('layoutExport.purposePrintTitle')
        : session.purpose === 'digital'
          ? this.$t('layoutExport.purposeDigitalTitle')
          : '';
      return this.$t('layoutExport.resumeLastDesc', { format: formatName, purpose: purposeName });
    },
    activeFormat() {
      return getBookExportFormat(this.bookExportFormatId);
    },
    pageSubtitle() {
      if (this.step === 'format') return this.$t('layoutExport.subtitleStepFormat');
      if (this.step === 'purpose') return this.$t('layoutExport.subtitleStepPurpose');
      return this.$t('layoutExport.subtitleStepPickDigital');
    },
    purposeLabel() {
      if (this.exportPurpose === 'print') return this.$t('layoutExport.purposePrintTitle');
      if (this.exportPurpose === 'digital') return this.$t('layoutExport.purposeDigitalTitle');
      return '';
    },
    pickHint() {
      return this.$t('layoutExport.pickHintDigital');
    },
    pickPleaseSelect() {
      return this.$t('layoutExport.pickPleaseSelectDigital');
    },
    continueLabel() {
      return this.$t('layoutExport.continueDigital');
    },
    pickSelectedInfo() {
      return this.$t('layoutExport.pickSelectedInfo', { count: this.checkedImage.length });
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
      if (session.formatId && getBookExportFormat(session.formatId)) {
        this.$store.commit('setBookExportFormat', session.formatId);
      }
      if (session.purpose === 'digital' || session.purpose === 'print') {
        this.exportPurpose = session.purpose;
      }
      if (session.checkedImages?.length) {
        this.checkedImage = [...session.checkedImages];
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
      this.$store.commit('setBookExportFormat', id);
      this.persistSession({ formatId: id });
    },
    confirmFormat(id) {
      this.persistFormat(id);
      this.persistSession({ formatConfirmed: true });
      this.step = 'purpose';
    },
    confirmPurpose(purpose) {
      this.exportPurpose = purpose;
      this.persistSession({ purpose });
      if (purpose === 'print') {
        this.goPrintLayout();
        return;
      }
      this.step = 'pick';
      this.fetchIllustrations(true);
    },
    backToFormat() {
      this.step = 'format';
    },
    backToPurpose() {
      this.step = 'purpose';
    },
    resumeLastSettings() {
      const session = readLayoutExportSession();
      if (!canResumeLayoutExport(session)) return;
      this.applySessionToState(session);
      if (session.purpose === 'print') {
        this.goPrintLayout();
        return;
      }
      this.step = 'pick';
      this.fetchIllustrations(true);
    },
    enterFlow() {
      this.toQuickCompose();
    },
    restoreFromSession() {
      this.applySessionToState();
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
    toQuickCompose() {
      if (!this.commitSelected()) return;
      this.$router.push({ name: 'topdf' });
    },
    goPrintLayout() {
      this.$router.push({ name: 'print-book-layout' });
    },
    restoreFromStore() {
      if (this.imgToPDF?.length) {
        this.checkedImage = [...this.imgToPDF];
      }
    },
    resolveInitialStep() {
      const edit = this.$route.query.edit;
      if (edit === 'format') {
        this.restoreFromSession();
        this.step = 'format';
        return false;
      }
      if (edit === 'purpose') {
        this.restoreFromSession();
        this.step = 'purpose';
        return false;
      }

      this.restoreFromStore();
      const session = readLayoutExportSession();
      this.applySessionToState(session);

      if (session.formatConfirmed && session.purpose === 'digital') {
        this.step = 'pick';
        return true;
      }
      if (session.formatConfirmed) {
        this.step = 'purpose';
        return false;
      }
      this.step = 'format';
      return false;
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
    width: 100%;
    min-height: 100%;
    padding: 0 24px 32px;
    background-color: #f5f5f5;
    overflow-y: visible;
    overflow-x: hidden;
    position: relative;
    box-sizing: border-box;
    text-align: left;
}

.page-head {
    margin: 1vw 1vw 0;
    padding: 8px 4px 16px;
}

.page-head h2 {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 600;
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
    align-items: center;
    gap: 8px;
    margin: 0 1vw 16px;
    padding: 14px 18px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.step-bar-item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: #a8abb2;
    font-size: 13px;
}

.step-bar-item.is-active {
    color: #8167a9;
    font-weight: 600;
}

.step-bar-item.is-done {
    color: #67c23a;
}

.step-bar-marker {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    background: #f0f2f5;
    color: inherit;
}

.step-bar-item.is-active .step-bar-marker {
    background: #8167a9;
    color: #fff;
}

.step-bar-item.is-done .step-bar-marker {
    background: #e8f7e8;
    color: #67c23a;
}

.step-bar-label {
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.resume-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 16px;
    margin-bottom: 14px;
    padding: 14px 16px;
    border-radius: 10px;
    background: linear-gradient(90deg, #f3f0f8 0%, #faf8fd 100%);
    border: 1px solid #e8e0f0;
}

.resume-banner-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.resume-banner-text strong {
    font-size: 14px;
    color: #303133;
}

.resume-banner-text span {
    font-size: 13px;
    color: #606266;
    line-height: 1.45;
}

.format-step {
    margin: 0 1vw 1vw;
}

.purpose-step {
    margin: 0 1vw 1vw;
}

.purpose-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-bottom: 12px;
    padding: 12px 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.purpose-toolbar-label {
    font-size: 13px;
    color: #909399;
}

.purpose-toolbar-value {
    font-size: 14px;
    font-weight: 600;
    color: #8167a9;
}

.purpose-section {
    padding: 28px 24px 32px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.purpose-section-title {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.purpose-section-hint {
    margin: 0 0 20px;
    font-size: 13px;
    color: #909399;
    line-height: 1.45;
}

.purpose-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    max-width: 920px;
}

.purpose-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 22px 20px 18px;
    border: 2px solid #ebeef5;
    border-radius: 12px;
    background: #fafafa;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s, transform 0.15s;
}

.purpose-card:hover {
    border-color: #8167a9;
    background: #f9f8fc;
    box-shadow: 0 6px 20px rgba(129, 103, 169, 0.12);
    transform: translateY(-2px);
}

.purpose-card-icon {
    font-size: 28px;
    line-height: 1;
    margin-bottom: 4px;
}

.purpose-card-title {
    font-size: 17px;
    font-weight: 700;
    color: #303133;
    line-height: 1.3;
}

.purpose-card-desc {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
}

.purpose-card-list {
    margin: 8px 0 0;
    padding-left: 18px;
    font-size: 12px;
    color: #909399;
    line-height: 1.6;
}

.purpose-card-list li {
    margin-bottom: 2px;
}

.format-section--solo {
    margin: 0;
    padding: 28px 24px 32px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.format-section-title {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.format-section-hint {
    margin: 0 0 20px;
    font-size: 13px;
    color: #909399;
    line-height: 1.45;
}

.format-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.format-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 14px 12px 12px;
    border: 2px solid #ebeef5;
    border-radius: 10px;
    background: #fafafa;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s, transform 0.15s;
}

.format-card:hover {
    border-color: #b7a6d6;
    background: #f9f8fc;
    transform: translateY(-1px);
}

.format-card.is-active {
    border-color: #8167a9;
    background: #f3f0f8;
    box-shadow: 0 0 0 1px rgba(129, 103, 169, 0.25);
}

.format-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 72px;
    margin: 0 auto 6px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
    min-height: 48px;
}

.format-preview-fill {
    width: 100%;
    height: 100%;
    min-height: 48px;
    background: linear-gradient(135deg, #b7d4f0 0%, #9ec5eb 100%);
}

.format-preview-safe {
    width: 72%;
    height: 72%;
    min-height: 36px;
    background: linear-gradient(135deg, #b7d4f0 0%, #9ec5eb 100%);
    border-radius: 2px;
}

.format-card-title {
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    line-height: 1.35;
}

.format-card-desc {
    font-size: 11px;
    color: #909399;
    line-height: 1.4;
}

.format-card-meta {
    font-size: 10px;
    color: #a8abb2;
    font-variant-numeric: tabular-nums;
}

.selected-section {
    margin: 0 1vw 1vw;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pick-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px 16px;
    margin-bottom: 12px;
    padding-bottom: 14px;
    border-bottom: 1px solid #ebeef5;
}

.pick-crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
}

.pick-crumb-item {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
}

.pick-crumb-label {
    font-size: 12px;
    color: #909399;
}

.pick-crumb-value {
    font-size: 14px;
    font-weight: 600;
    color: #8167a9;
}

.pick-crumb-sep {
    color: #dcdfe6;
    user-select: none;
}

.pick-crumb-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
}

.pick-purpose-hint {
    margin: 0 0 16px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
    color: #606266;
    background: #f9f8fc;
    border-radius: 8px;
    border-left: 3px solid #8167a9;
}

.pick-step {
    padding-bottom: 88px;
}

.pick-sticky-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 24px calc(12px + env(safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.96);
    border-top: 1px solid #ebeef5;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(8px);
}

.pick-sticky-status {
    margin: 0;
    flex: 1;
    min-width: 0;
    font-size: 14px;
    color: #606266;
    line-height: 1.4;
}

.pick-sticky-btn {
    flex-shrink: 0;
    min-width: 200px;
    height: 44px;
    font-size: 15px;
    font-weight: 600;
    --el-button-bg-color: #8167a9;
    --el-button-border-color: #8167a9;
    --el-button-hover-bg-color: #6e5494;
    --el-button-hover-border-color: #6e5494;
}

.selected-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
}

.selected-count {
    font-size: 16px;
    font-weight: 600;
    color: #8167a9;
}

.selected-preview {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 5px 0;
}

.selected-item {
    position: relative;
    width: 120px;
    height: 90px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    border: 2px solid #8167a9;
    cursor: move;
    transition: all 0.3s;
    user-select: none;
}

.selected-item:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(129, 103, 169, 0.3);
}

.selected-item.dragging {
    opacity: 0.5;
    cursor: grabbing;
}

.selected-item.drag-over {
    border-color: #67c23a;
    box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.3);
    transform: scale(1.1);
}

.selected-order {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    background-color: #8167a9;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
}

.selected-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background-color: rgba(245, 108, 108, 0.9);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
}

.selected-item:hover .selected-remove {
    opacity: 1;
}

.mode-actions {
    display: none;
}

@media (max-width: 1100px) {
    .format-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .step-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .step-bar-item {
        flex: none;
    }

    .format-grid {
        grid-template-columns: 1fr;
    }

    .purpose-grid {
        grid-template-columns: 1fr;
    }

    .pick-sticky-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .pick-sticky-btn {
        width: 100%;
        min-width: 0;
    }

    .container .items li {
        width: 31%;
    }
}

.images-section {
    margin: 0 1vw 1vw;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.container .items {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5%;
    list-style: none;
    margin: 0;
    padding: 0;
}

.container .items li {
    width: 18%;
    position: relative;
    padding: 0.5vw;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
}

.container .items li:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.container .items li.selected {
    border-color: #8167a9;
    box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.2);
}

.check-mark {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(129, 103, 169, 0.75);
    border-radius: 4px;
    color: #fff;
    font-size: 40px;
}

.illus-thumb {
    width: 100%;
    aspect-ratio: 4 / 3;
    display: block;
    border-radius: 4px;
}

.illus-load-tip {
    text-align: center;
    padding: 16px 0 4px;
    font-size: 13px;
    color: #606266;
}

.illus-load-tip--muted {
    color: #a8abb2;
}
</style>
