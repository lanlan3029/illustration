<template>
  <div class="print-book-layout">
    <!-- 左侧：我的插画 -->
    <aside class="pbl-sidebar">
      <div class="pbl-sidebar-head">
        <h2>{{ $t('printBookLayout.myIllustrations') }}</h2>
        <p class="pbl-hint">{{ $t('printBookLayout.selectHint') }}</p>
      </div>

      <div v-if="selectedIlls.length" class="pbl-selected">
        <div class="pbl-selected-head">
          <span>{{ $t('printBookLayout.selectedCount', { count: selectedIlls.length }) }}</span>
          <el-button link type="danger" size="small" @click="clearSelected">
            {{ $t('printBookLayout.clear') }}
          </el-button>
        </div>
        <div class="pbl-selected-strip">
          <div
            v-for="(item, idx) in selectedIlls"
            :key="item._id"
            class="pbl-selected-thumb"
            draggable="true"
            @dragstart="onDragStartIll($event, item)"
            @dragend="onDragEndIll"
          >
            <img :src="illUrl(item)" :alt="item.title || ''" />
            <span class="pbl-order">{{ idx + 1 }}</span>
            <button type="button" class="pbl-remove" @click.stop="toggleIll(item)">×</button>
          </div>
        </div>
      </div>

      <div
        class="pbl-ill-grid"
        v-infinite-scroll="loadMoreIlls"
        :infinite-scroll-disabled="!hasMoreIlls || loadingIll"
        :infinite-scroll-distance="120"
      >
        <button
          v-for="item in illList"
          :key="item._id"
          type="button"
          class="pbl-ill-item"
          :class="{ 'is-selected': isIllSelected(item) }"
          @click="toggleIll(item)"
        >
          <img :src="illUrl(item)" :alt="item.title || ''" />
          <span v-if="isIllSelected(item)" class="pbl-check">✓</span>
        </button>
        <p v-if="loadingIll" class="pbl-load-tip">{{ $t('common.loading') }}</p>
        <p v-else-if="!illList.length" class="pbl-empty">{{ $t('printBookLayout.noIllustrations') }}</p>
      </div>
    </aside>

    <!-- 右侧：排版视图 -->
    <main class="pbl-main">
      <div class="pbl-toolbar">
        <div class="pbl-toolbar-left">
          <h1>{{ $t('printBookLayout.title') }}</h1>
          <span class="pbl-stat">
            {{ $t('printBookLayout.pageStat', { filled: filledStoryCount, total: 28 }) }}
          </span>
        </div>
        <div class="pbl-toolbar-actions">
          <el-button
            type="primary"
            :disabled="!selectedIlls.length"
            @click="generateLayout"
          >
            {{ $t('printBookLayout.generateLayout') }}
          </el-button>
          <el-button @click="trimEmptySpreads">
            {{ $t('printBookLayout.trimEmpty') }}
          </el-button>
          <el-button @click="openSpreadPreview(0)">
            {{ $t('printBookLayout.spreadPreview') }}
          </el-button>
          <el-button :disabled="!hasAnyImage" @click="exportPdf">
            {{ $t('printBookLayout.exportPdf') }}
          </el-button>
        </div>
      </div>

      <div ref="layoutGridRef" class="pbl-grid">
        <div
          v-for="row in layoutRows"
          :key="row.id"
          class="pbl-row"
          :class="[`pbl-row--${row.type}`, { 'pbl-row--empty': isRowEmpty(row) }]"
        >
          <div class="pbl-row-label">
            <span>{{ rowLabel(row) }}</span>
            <button
              v-if="row.deletable"
              type="button"
              class="pbl-row-delete"
              :title="$t('printBookLayout.deleteSpread')"
              @click="deleteRow(row.id)"
            >
              {{ $t('printBookLayout.deleteSpread') }}
            </button>
          </div>

          <div class="pbl-spread" :class="{ 'pbl-spread--single': row.type === 'single' }">
            <div
              v-for="page in row.pages"
              :key="page.id"
              class="pbl-page"
              :class="{ 'is-active': activePageId === page.id, 'has-image': !!page.illustration }"
              @click="onPageClick(page)"
              @dragover.prevent
              @drop.prevent="onDropPage(page, $event)"
            >
              <span v-if="page.pageNum" class="pbl-page-num">{{ page.pageNum }}</span>
              <span class="pbl-page-kind">{{ $t(page.labelKey) }}</span>

              <img
                v-if="page.illustration"
                :src="illUrl(page.illustration)"
                :alt="page.illustration.title || ''"
                class="pbl-page-img"
              />
              <div v-else class="pbl-page-placeholder">
                <span>{{ $t('printBookLayout.clickToAssign') }}</span>
              </div>

              <div v-if="page.illustration" class="pbl-page-actions" @click.stop>
                <button type="button" @click="zoomPage(page)">{{ $t('printBookLayout.zoom') }}</button>
                <button type="button" @click="clearPage(page)">{{ $t('printBookLayout.clearPage') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 放大预览：单页 -->
    <el-image-viewer
      v-if="zoomVisible && zoomUrl"
      :url-list="[zoomUrl]"
      teleported
      @close="zoomVisible = false"
    />

    <!-- 跨页预览 -->
    <el-dialog
      v-model="spreadPreviewVisible"
      :title="$t('printBookLayout.spreadPreview')"
      width="min(920px, 96vw)"
      class="pbl-spread-dialog"
      destroy-on-close
    >
      <div class="pbl-spread-nav">
        <el-button :disabled="spreadPreviewIndex <= 0" @click="spreadPreviewIndex -= 1">‹</el-button>
        <span>{{ spreadPreviewIndex + 1 }} / {{ layoutRows.length }}</span>
        <el-button
          :disabled="spreadPreviewIndex >= layoutRows.length - 1"
          @click="spreadPreviewIndex += 1"
        >›</el-button>
      </div>
      <div v-if="currentPreviewRow" class="pbl-spread-preview">
        <div
          v-for="page in currentPreviewRow.pages"
          :key="page.id"
          class="pbl-spread-preview-page"
        >
          <span v-if="page.pageNum" class="pbl-page-num">{{ page.pageNum }}</span>
          <img
            v-if="page.illustration"
            :src="illUrl(page.illustration)"
            :alt="page.illustration.title || ''"
          />
          <div v-else class="pbl-spread-preview-empty">
            <span>{{ $t(page.labelKey) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus';
import html2canvas from 'html2canvas';
import JsPDF from 'jspdf';
import {
  createDefaultPrintLayout,
  getIllustrationUrl,
  assignIllustrationsInOrder,
  trimEmptyStorySpreads,
  countFilledStoryPages,
  isRowEmpty,
} from '@/data/pictureBookPrintLayout';

const STORAGE_KEY = 'print_book_layout_v1';

export default {
  name: 'PrintBookLayout',
  components: { ElImageViewer },
  data() {
    return {
      illList: [],
      illPage: 1,
      hasMoreIlls: true,
      loadingIll: false,
      selectedIlls: [],
      layoutRows: createDefaultPrintLayout(),
      activePageId: null,
      dragIll: null,
      zoomVisible: false,
      zoomUrl: '',
      spreadPreviewVisible: false,
      spreadPreviewIndex: 0,
      exporting: false,
    };
  },
  computed: {
    filledStoryCount() {
      return countFilledStoryPages(this.layoutRows);
    },
    hasAnyImage() {
      return this.layoutRows.some((row) => row.pages.some((p) => p.illustration));
    },
    currentPreviewRow() {
      return this.layoutRows[this.spreadPreviewIndex] || null;
    },
  },
  mounted() {
    this.loadSession();
    this.fetchIllustrations(true);
  },
  methods: {
    illUrl(item) {
      return getIllustrationUrl(item);
    },
    isIllSelected(item) {
      return this.selectedIlls.some((x) => x._id === item._id);
    },
    toggleIll(item) {
      const idx = this.selectedIlls.findIndex((x) => x._id === item._id);
      if (idx >= 0) {
        this.selectedIlls.splice(idx, 1);
      } else {
        this.selectedIlls.push(item);
      }
      this.saveSession();
    },
    clearSelected() {
      this.selectedIlls = [];
      this.saveSession();
    },
    onDragStartIll(e, item) {
      this.dragIll = item;
      e.dataTransfer.effectAllowed = 'copy';
    },
    onDragEndIll() {
      this.dragIll = null;
    },
    onDropPage(page, e) {
      if (this.dragIll) {
        page.illustration = this.dragIll;
        this.saveSession();
        return;
      }
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const data = JSON.parse(raw);
          if (data?.item) {
            page.illustration = data.item;
            this.saveSession();
          }
        }
      } catch {
        /* ignore */
      }
    },
    onPageClick(page) {
      this.activePageId = page.id;
      if (this.selectedIlls.length === 1) {
        page.illustration = this.selectedIlls[0];
        this.saveSession();
      }
    },
    clearPage(page) {
      page.illustration = null;
      this.saveSession();
    },
    zoomPage(page) {
      if (!page.illustration) return;
      this.zoomUrl = this.illUrl(page.illustration);
      this.zoomVisible = true;
    },
    rowLabel(row) {
      if (row.spreadIndex != null) {
        return this.$t('printBookLayout.storySpreadNum', { num: row.spreadIndex });
      }
      if (row.labelKey) return this.$t(row.labelKey);
      return '';
    },
    isRowEmpty(row) {
      return isRowEmpty(row);
    },
    generateLayout() {
      if (!this.selectedIlls.length) {
        ElMessage.warning(this.$t('printBookLayout.pleaseSelect'));
        return;
      }
      assignIllustrationsInOrder(this.layoutRows, this.selectedIlls);
      this.layoutRows = trimEmptyStorySpreads(this.layoutRows);
      this.saveSession();
      ElMessage.success(this.$t('printBookLayout.layoutGenerated'));
    },
    trimEmptySpreads() {
      const before = this.layoutRows.length;
      this.layoutRows = trimEmptyStorySpreads(this.layoutRows);
      const removed = before - this.layoutRows.length;
      this.saveSession();
      if (removed > 0) {
        ElMessage.success(this.$t('printBookLayout.trimmed', { count: removed }));
      } else {
        ElMessage.info(this.$t('printBookLayout.nothingToTrim'));
      }
    },
    async deleteRow(rowId) {
      const row = this.layoutRows.find((r) => r.id === rowId);
      if (!row?.deletable) return;
      try {
        await ElMessageBox.confirm(
          this.$t('printBookLayout.confirmDeleteSpread'),
          this.$t('printBookLayout.deleteSpread'),
          { type: 'warning', confirmButtonText: this.$t('common.confirm'), cancelButtonText: this.$t('common.cancel') }
        );
        this.layoutRows = this.layoutRows.filter((r) => r.id !== rowId);
        this.saveSession();
      } catch {
        /* cancelled */
      }
    },
    openSpreadPreview(index) {
      this.spreadPreviewIndex = Math.max(0, Math.min(index, this.layoutRows.length - 1));
      this.spreadPreviewVisible = true;
    },
    async fetchIllustrations(reset = false) {
      if (this.loadingIll) return;
      if (reset) {
        this.illPage = 1;
        this.hasMoreIlls = true;
        this.illList = [];
      }
      if (!this.hasMoreIlls) return;

      this.loadingIll = true;
      try {
        const token = localStorage.getItem('token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await this.$http.get(
          `/ill/?page=${this.illPage}&sort_param=createdAt&sort_num=desc`,
          { headers }
        );
        const list = res.data?.message || res.data?.data || [];
        const items = Array.isArray(list) ? list : [];
        if (!items.length) {
          this.hasMoreIlls = false;
          return;
        }
        const existing = new Set(this.illList.map((i) => i._id));
        this.illList.push(...items.filter((i) => i._id && !existing.has(i._id)));
        this.illPage += 1;
      } catch (e) {
        console.warn('fetch illustrations failed', e);
        ElMessage.error(this.$t('printBookLayout.loadIllFailed'));
      } finally {
        this.loadingIll = false;
      }
    },
    loadMoreIlls() {
      this.fetchIllustrations(false);
    },
    saveSession() {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            layoutRows: this.layoutRows,
            selectedIlls: this.selectedIlls.map((i) => ({
              _id: i._id,
              content: i.content,
              title: i.title,
            })),
          })
        );
      } catch {
        /* quota */
      }
    },
    loadSession() {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (Array.isArray(data.layoutRows) && data.layoutRows.length) {
          this.layoutRows = data.layoutRows;
        }
        if (Array.isArray(data.selectedIlls) && data.selectedIlls.length) {
          this.selectedIlls = data.selectedIlls;
        }
      } catch {
        /* ignore */
      }
    },
    restoreSelectedFromList() {
      if (!this.selectedIdsCache?.length) return;
      this.selectedIlls = this.selectedIdsCache
        .map((id) => this.illList.find((i) => i._id === id))
        .filter(Boolean);
    },
    async exportPdf() {
      if (this.exporting || !this.hasAnyImage) return;
      this.exporting = true;
      ElMessage.info(this.$t('printBookLayout.exporting'));

      try {
        const pdf = new JsPDF('l', 'pt', [984.3, 699]);
        let first = true;

        for (const row of this.layoutRows) {
          const hasImage = row.pages.some((p) => p.illustration);
          if (!hasImage) continue;

          const el = document.createElement('div');
          el.style.cssText = 'position:fixed;left:-9999px;top:0;width:984px;height:699px;display:flex;background:#fff;';
          row.pages.forEach((page) => {
            const cell = document.createElement('div');
            cell.style.cssText = 'flex:1;height:100%;display:flex;align-items:center;justify-content:center;border:1px solid #eee;box-sizing:border-box;overflow:hidden;';
            if (page.illustration) {
              const img = document.createElement('img');
              img.src = this.illUrl(page.illustration);
              img.crossOrigin = 'anonymous';
              img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
              cell.appendChild(img);
            }
            el.appendChild(cell);
          });
          document.body.appendChild(el);

          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 300));
          // eslint-disable-next-line no-await-in-loop
          const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
          document.body.removeChild(el);

          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          if (!first) pdf.addPage([984.3, 699], 'l');
          first = false;
          pdf.addImage(imgData, 'JPEG', 0, 0, 984.3, 699);
        }

        pdf.save(`picture-book-layout-${Date.now()}.pdf`);
        ElMessage.success(this.$t('printBookLayout.exportDone'));
      } catch (e) {
        console.error(e);
        ElMessage.error(this.$t('printBookLayout.exportFailed'));
      } finally {
        this.exporting = false;
      }
    },
  },
};
</script>

<style scoped>
.print-book-layout {
  display: flex;
  gap: 0;
  min-height: calc(100vh - 50px);
  background: #f5f3f8;
}

.pbl-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #ece6f2;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 50px);
}

.pbl-sidebar-head {
  padding: 20px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.pbl-sidebar-head h2 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: #1f1f1f;
}

.pbl-hint {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.pbl-selected {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.pbl-selected-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #8167a9;
  margin-bottom: 8px;
}

.pbl-selected-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.pbl-selected-thumb {
  position: relative;
  width: 64px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #8167a9;
  cursor: grab;
}

.pbl-selected-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pbl-order {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8167a9;
  color: #fff;
  font-size: 10px;
  line-height: 18px;
  text-align: center;
}

.pbl-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(245, 108, 108, 0.95);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.pbl-ill-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  align-content: start;
}

.pbl-ill-item {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #fafafa;
  transition: border-color 0.2s, transform 0.2s;
}

.pbl-ill-item:hover {
  transform: translateY(-2px);
  border-color: #c4b5dc;
}

.pbl-ill-item.is-selected {
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.25);
}

.pbl-ill-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pbl-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(129, 103, 169, 0.55);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.pbl-load-tip,
.pbl-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 24px 0;
}

.pbl-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 50px);
}

.pbl-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #ece6f2;
}

.pbl-toolbar-left h1 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
}

.pbl-stat {
  font-size: 12px;
  color: #909399;
}

.pbl-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pbl-toolbar-actions :deep(.el-button--primary) {
  --el-button-bg-color: #8167a9;
  --el-button-border-color: #8167a9;
}

.pbl-grid {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-content: start;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.pbl-row {
  background: #fff;
  border-radius: 12px;
  border: 2px solid #e8e0f0;
  padding: 12px 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  width: 100%;
}

.pbl-row--empty {
  opacity: 0.72;
}

.pbl-row-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #606266;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pbl-row-delete {
  border: none;
  background: transparent;
  color: #f56c6c;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.pbl-row-delete:hover {
  background: #fef0f0;
}

.pbl-spread {
  display: flex;
  gap: 8px;
}

.pbl-spread--single .pbl-page {
  flex: 1;
}

.pbl-page {
  position: relative;
  flex: 1;
  aspect-ratio: 4 / 3;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #fafafa;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.pbl-page:hover,
.pbl-page.is-active {
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.15);
}

.pbl-page.has-image {
  border-style: solid;
  border-color: #8167a9;
}

.pbl-page-num {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: rgba(31, 31, 31, 0.75);
  color: #fff;
  font-size: 11px;
  line-height: 22px;
  text-align: center;
}

.pbl-page-kind {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  max-width: 55%;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: #606266;
  font-size: 10px;
  font-weight: 600;
  text-align: right;
  line-height: 1.3;
}

.pbl-page-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
  display: block;
}

.pbl-page-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
}

.pbl-page-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 6px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  opacity: 0;
  transition: opacity 0.2s;
}

.pbl-page:hover .pbl-page-actions {
  opacity: 1;
}

.pbl-page-actions button {
  flex: 1;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.95);
  color: #303133;
  font-size: 11px;
  padding: 4px 0;
  cursor: pointer;
}

.pbl-spread-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  font-weight: 600;
}

.pbl-spread-preview {
  display: flex;
  gap: 12px;
  min-height: 320px;
}

.pbl-spread-preview-page {
  flex: 1;
  position: relative;
  aspect-ratio: 4 / 3;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}

.pbl-spread-preview-page img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.pbl-spread-preview-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

@media (max-width: 960px) {
  .print-book-layout {
    flex-direction: column;
  }

  .pbl-sidebar {
    width: 100%;
    max-height: 40vh;
    border-right: none;
    border-bottom: 1px solid #ece6f2;
  }

  .pbl-main {
    max-height: none;
  }
}
</style>
