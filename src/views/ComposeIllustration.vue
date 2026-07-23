<template>
    <div class="container">
        <div class="page-head">
            <h2>{{ $t('layoutExport.title') }}</h2>
            <p>{{ $t('layoutExport.subtitle') }}</p>
        </div>

        <!-- 已选插画预览区域和操作栏 -->
        <div class="selected-section">
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
                        :data-index="index"
                        @dragstart="handleDragStart($event, index)"
                        @dragover="handleDragOver($event, index)"
                        @dragleave="handleDragLeave"
                        @drop="handleDrop($event, index)"
                        @dragend="handleDragEnd"
                        :class="{ 
                            'dragging': dragIndex === index,
                            'drag-over': dragOverIndex === index && dragIndex !== index
                        }">
                        <el-image 
                            :src="(`https://static.kidstory.cc/`+item.content)" 
                            style="width:100%; height:100%" 
                            fit="cover">
                        </el-image>
                        <div class="selected-order">{{ index + 1 }}</div>
                        <div class="selected-remove" @click.stop="removeSelected(index)">
                            <i class="el-icon-close"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 操作栏 -->
            <div class="action-bar">
                <span class="selected-info" v-if="checkedImage.length > 0">
                    {{ $t('composeIllustration.selectedInfo', { count: checkedImage.length }) }}
                </span>
                <span class="selected-info" v-else>
                    {{ $t('composeIllustration.pleaseSelect') }}
                </span>
            </div>

            <div class="format-section">
                <h3 class="format-section-title">{{ $t('bookExport.formatTitle') }}</h3>
                <p class="format-section-hint">{{ $t('bookExport.formatHint') }}</p>
                <div class="format-grid">
                    <button
                        v-for="fmt in exportFormats"
                        :key="fmt.id"
                        type="button"
                        class="format-card"
                        :class="{ 'is-active': bookExportFormatId === fmt.id }"
                        @click="selectFormat(fmt.id)"
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

            <div class="mode-actions" :class="{ 'is-disabled': checkedImage.length === 0 }">
                <button
                    type="button"
                    class="mode-card mode-card--primary"
                    :disabled="checkedImage.length === 0"
                    @click="toQuickCompose"
                >
                    <span class="mode-card-title">{{ $t('layoutExport.quickCompose') }}</span>
                    <span class="mode-card-desc">{{ $t('layoutExport.quickComposeDesc') }}</span>
                </button>
                <button
                    type="button"
                    class="mode-card"
                    :disabled="checkedImage.length === 0"
                    @click="toPrintLayout"
                >
                    <span class="mode-card-title">{{ $t('layoutExport.printLayout') }}</span>
                    <span class="mode-card-desc">{{ $t('layoutExport.printLayoutDesc') }}</span>
                </button>
            </div>
        </div>

        <!-- 插画列表区域 -->
        <div class="images-section">
            <ul class="items" v-infinite-scroll="getMore">
                <li 
                    v-for="(item, index) in illusArr" 
                    :key="item._id || index" 
                    @click="handleAdd(item)"
                    :class="{ 'selected': isSelected(item) }">
                    <el-image 
                        :src="(`https://static.kidstory.cc/`+item.content)" 
                        fit="cover"
                        class="illus-thumb">
                    </el-image>
                    <span v-if="isSelected(item)" class="check-mark">
                        <i class="el-icon-check"></i>
                    </span>
                </li>
            </ul>
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

const LAYOUT_FROM_PICK_KEY = 'book_layout_from_pick';
const FORMAT_STORAGE_KEY = 'book_export_format_id';

export default {
  data() {
    return {
      illusArr: [],
      num: 1,
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
  },
  methods: {
    formatMeta(fmt) {
      return formatSizeLabel(fmt);
    },
    selectFormat(id) {
      this.$store.commit('setBookExportFormat', id);
      try {
        sessionStorage.setItem(FORMAT_STORAGE_KEY, id);
      } catch {
        /* ignore */
      }
    },
    restoreFormat() {
      try {
        const saved = sessionStorage.getItem(FORMAT_STORAGE_KEY);
        if (saved && getBookExportFormat(saved)) {
          this.$store.commit('setBookExportFormat', saved);
        }
      } catch {
        /* ignore */
      }
    },
    async getIll() {
      try {
        const res = await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=${this.userid}&page=1`);
        this.illusArr = res.data.message;
      } catch (err) {
        console.log(err);
      }
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
    },
    removeSelected(index) {
      this.checkedImage.splice(index, 1);
    },
    clearSelected() {
      this.checkedImage = [];
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
      return false;
    },
    handleDragEnd(event) {
      event.target.style.opacity = '';
      this.dragIndex = null;
      this.dragOverIndex = null;
    },
    commitSelected() {
      if (!this.checkedImage.length) return false;
      this.$store.commit('setBookIllustrations', [...this.checkedImage]);
      return true;
    },
    toQuickCompose() {
      if (!this.commitSelected()) return;
      this.$router.push({ name: 'topdf' });
    },
    toPrintLayout() {
      if (!this.commitSelected()) return;
      sessionStorage.setItem(LAYOUT_FROM_PICK_KEY, '1');
      this.$router.push({ name: 'print-book-layout' });
    },
    async getMore() {
      this.num += 1;
      try {
        const res = await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=${this.userid}&page=${this.num}`);
        this.illusArr = this.illusArr.concat(res.data.message);
      } catch (err) {
        console.log(err);
      }
    },
    restoreFromStore() {
      if (this.imgToPDF?.length) {
        this.checkedImage = [...this.imgToPDF];
      }
    },
  },
  async mounted() {
    this.restoreFormat();
    this.restoreFromStore();
    await this.getIll();
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

.selected-section {
    margin: 0 1vw 1vw;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.action-bar {
    display: flex;
    align-items: center;
    margin-top: 4px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
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

.format-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
}

.format-section-title {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.format-section-hint {
    margin: 0 0 14px;
    font-size: 13px;
    color: #909399;
    line-height: 1.45;
}

.format-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.format-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 12px 14px;
    border: 2px solid #ebeef5;
    border-radius: 10px;
    background: #fafafa;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.format-card:hover {
    border-color: #b7a6d6;
    background: #f9f8fc;
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
    margin: 0 auto 4px;
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
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    line-height: 1.35;
}

.format-card-desc {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
}

.format-card-meta {
    font-size: 11px;
    color: #a8abb2;
    font-variant-numeric: tabular-nums;
}

.mode-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 20px;
}

.mode-actions.is-disabled {
    opacity: 0.55;
}

.mode-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 18px 20px;
    border: 2px solid #ebeef5;
    border-radius: 10px;
    background: #fafafa;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.mode-card:hover:not(:disabled) {
    border-color: #b7a6d6;
    background: #f9f8fc;
    box-shadow: 0 4px 12px rgba(129, 103, 169, 0.12);
}

.mode-card:disabled {
    cursor: not-allowed;
}

.mode-card--primary {
    border-color: #8167a9;
    background: #f3f0f8;
}

.mode-card--primary:hover:not(:disabled) {
    background: #ede8f5;
}

.mode-card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.mode-card-desc {
    font-size: 13px;
    color: #909399;
    line-height: 1.45;
}

.images-section {
    margin: 0 1vw 1vw;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.container .items {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5%;
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
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

.selected-info {
    font-size: 16px;
    color: #606266;
}

.illus-thumb {
    width: 100%;
    aspect-ratio: 4 / 3;
    display: block;
    border-radius: 4px;
}

@media (max-width: 768px) {
    .format-grid {
        grid-template-columns: 1fr;
    }

    .mode-actions {
        grid-template-columns: 1fr;
    }

    .container .items li {
        width: 31%;
    }
}
</style>
