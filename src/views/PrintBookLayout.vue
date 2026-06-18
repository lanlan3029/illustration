<template>
  <div class="pbl-page">
    <!-- 顶栏 -->
    <header class="pbl-header">
      <div class="pbl-header-left">
        <router-link :to="{ name: 'compose-illustration' }" class="pbl-back">← {{ $t('printBookLayout.backStudio') }}</router-link>
        <h1>{{ $t('printBookLayout.title') }}</h1>
        <span class="pbl-stat">{{ $t('printBookLayout.pageStat', { filled: filledStoryCount, total: 28 }) }}</span>
      </div>
      <div class="pbl-header-actions">
        <div class="pbl-ratio">
          <span>{{ $t('printBookLayout.pageRatio') }}</span>
          <el-radio-group v-model="pageRatio" size="small" @change="saveSession">
            <el-radio-button label="1:1">1:1</el-radio-button>
            <el-radio-button label="3:4">3:4</el-radio-button>
          </el-radio-group>
        </div>
        <el-button type="primary" :disabled="!selectedIlls.length" @click="generateLayout">
          {{ $t('printBookLayout.generateLayout') }}
        </el-button>
        <el-button @click="trimEmptySpreads">{{ $t('printBookLayout.trimEmpty') }}</el-button>
        <el-button @click="resetLayout">{{ $t('printBookLayout.resetLayout') }}</el-button>
        <el-button v-if="viewMode === 'edit'" @click="viewMode = 'overview'">
          {{ $t('printBookLayout.backOverview') }}
        </el-button>
        <el-button :disabled="!hasAnyImage" @click="exportPdf">{{ $t('printBookLayout.exportPdf') }}</el-button>
      </div>
    </header>

    <div class="pbl-body">
      <!-- 左侧：插画选择（常驻） -->
      <aside class="pbl-picker">
        <div class="pbl-picker-head">
          <h3>{{ $t('printBookLayout.myIllustrations') }}</h3>
        </div>
        <p class="pbl-picker-hint">{{ $t('printBookLayout.selectHint') }}</p>
        <p class="pbl-picker-hint pbl-picker-hint--sub">{{ $t('printBookLayout.batchSelectHint') }}</p>

        <div v-if="activeIll" class="pbl-picker-brush">
          <img :src="illUrl(activeIll)" alt="" class="pbl-picker-brush-img" />
          <div class="pbl-picker-brush-text">
            <strong>{{ $t('printBookLayout.brushActive') }}</strong>
            <span>{{ $t('printBookLayout.brushHint') }}</span>
          </div>
          <button type="button" class="pbl-picker-brush-clear" @click="clearBrush">×</button>
        </div>

        <div v-if="selectedIlls.length" class="pbl-picker-selected">
          <div class="pbl-picker-selected-head">
            <span>{{ $t('printBookLayout.selectedCount', { count: selectedIlls.length }) }}</span>
            <el-button link type="danger" size="small" @click="clearSelected">{{ $t('printBookLayout.clear') }}</el-button>
          </div>
          <div class="pbl-picker-strip">
            <div
              v-for="(item, idx) in selectedIlls"
              :key="item._id"
              class="pbl-picker-thumb"
              draggable="true"
              @dragstart="onDragStartIll($event, item)"
              @dragend="onDragEndIll"
            >
              <img :src="illUrl(item)" alt="" />
              <span class="pbl-order">{{ idx + 1 }}</span>
            </div>
          </div>
        </div>

        <div
          class="pbl-picker-grid"
          v-infinite-scroll="loadMoreIlls"
          :infinite-scroll-disabled="!hasMoreIlls || loadingIll"
          :infinite-scroll-distance="120"
        >
          <button
            v-for="item in illList"
            :key="item._id"
            type="button"
            class="pbl-ill-btn"
            :class="{ 'is-selected': isIllSelected(item), 'is-active-pick': activeIllId === item._id }"
            @click="pickIll(item, $event)"
          >
            <img :src="illUrl(item)" alt="" />
            <span v-if="isIllSelected(item)" class="pbl-batch-mark">{{ $t('printBookLayout.batchMark') }}</span>
          </button>
          <p v-if="loadingIll" class="pbl-load-tip">{{ $t('common.loading') }}</p>
          <p v-else-if="!illList.length" class="pbl-load-tip">{{ $t('printBookLayout.noIllustrations') }}</p>
        </div>
      </aside>

      <!-- 右侧：排版主区域 -->
      <main class="pbl-stage" :class="{ 'pbl-stage--edit': viewMode === 'edit', 'pbl-stage--brush': !!activeIll }">
        <div v-if="viewMode === 'overview'" class="pbl-overview">
          <p class="pbl-overview-hint">{{ $t('printBookLayout.overviewHint') }}</p>
          <div class="pbl-matrix" :style="matrixStyle">
            <div
              v-for="block in layoutBlocks"
              :key="block.id"
              class="pbl-cell"
              :class="[
                `pbl-cell--${block.type}`,
                { 'pbl-cell--filled': !isBlockEmpty(block), 'pbl-cell--active': editingBlockId === block.id },
              ]"
            >
              <div class="pbl-cell-bar">
                <span>{{ blockLabel(block) }}</span>
                <div class="pbl-cell-bar-actions">
                  <button type="button" class="pbl-cell-edit" @click.stop="openEditBlock(block)">
                    {{ $t('printBookLayout.editBlock') }}
                  </button>
                  <button
                    v-if="block.deletable"
                    type="button"
                    class="pbl-cell-del"
                    @click.stop="deleteBlock(block.id)"
                  >×</button>
                </div>
              </div>

              <div class="pbl-cell-inner">
                <div class="pbl-sheet" :class="sheetClass(block)">
                  <template v-if="block.type === 'single'">
                    <div
                      class="pbl-face pbl-face--solo"
                      @click.stop="assignToPage(block.pages[0])"
                      @dragover.prevent
                      @drop.prevent="onDropPage(block.pages[0], $event)"
                    >
                      <img
                        v-if="block.pages[0].illustration"
                        :src="illUrl(block.pages[0].illustration)"
                        class="pbl-face-img"
                        alt=""
                      />
                      <div v-else class="pbl-face-empty">
                        <span class="pbl-face-label">{{ $t(block.pages[0].labelKey) }}</span>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div
                      v-for="(pg, pi) in block.pages"
                      :key="pg.id"
                      class="pbl-face"
                      @click.stop="assignToPage(pg)"
                      @dragover.prevent
                      @drop.prevent="onDropPage(pg, $event)"
                    >
                      <span v-if="pg.pageNum" class="pbl-face-num" :class="{ 'pbl-face-num--right': pi === 1 }">
                        {{ pg.pageNum }}
                      </span>
                      <img
                        v-if="pg.illustration"
                        :src="illUrl(pg.illustration)"
                        class="pbl-face-img"
                        alt=""
                      />
                      <div v-else class="pbl-face-empty">
                        <span v-if="pg.pageNum" class="pbl-face-num-inline">{{ pg.pageNum }}</span>
                        <span class="pbl-face-label">{{ $t(pg.labelKey) }}</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="editingBlock" class="pbl-editor">
          <div class="pbl-editor-head">
            <h2>{{ blockLabel(editingBlock) }}</h2>
            <button v-if="editingBlock.deletable" type="button" class="pbl-editor-del" @click="deleteBlock(editingBlock.id)">
              {{ $t('printBookLayout.deleteSpread') }}
            </button>
          </div>
          <div class="pbl-editor-canvas" :class="editorCanvasClass">
            <div
              v-for="pg in editingBlock.pages"
              :key="pg.id"
              class="pbl-editor-page"
              :class="{ 'is-active': activePageId === pg.id, 'has-image': !!pg.illustration }"
              :style="faceStyle"
              @click="assignToPage(pg)"
              @dragover.prevent
              @drop.prevent="onDropPage(pg, $event)"
            >
              <span v-if="pg.pageNum" class="pbl-pg-num">{{ pg.pageNum }}</span>
              <span class="pbl-pg-kind">{{ $t(pg.labelKey) }}</span>
              <img v-if="pg.illustration" :src="illUrl(pg.illustration)" alt="" class="pbl-pg-img" />
              <div v-else class="pbl-pg-empty">{{ $t('printBookLayout.clickToAssign') }}</div>
              <div v-if="pg.illustration" class="pbl-pg-actions" @click.stop>
                <button type="button" @click="zoomPage(pg)">{{ $t('printBookLayout.zoom') }}</button>
                <button type="button" @click="clearPage(pg)">{{ $t('printBookLayout.clearPage') }}</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <el-image-viewer v-if="zoomVisible && zoomUrl" :url-list="[zoomUrl]" teleported @close="zoomVisible = false" />
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
  isBlockEmpty,
  migrateRowsToBlocks,
} from '@/data/pictureBookPrintLayout';

const STORAGE_KEY = 'print_book_layout_v2';

export default {
  name: 'PrintBookLayout',
  components: { ElImageViewer },
  data() {
    return {
      layoutBlocks: createDefaultPrintLayout(),
      pageRatio: '3:4',
      viewMode: 'overview',
      editingBlockId: null,
      activePageId: null,
      activeIllId: null,
      illList: [],
      illPage: 1,
      hasMoreIlls: true,
      loadingIll: false,
      selectedIlls: [],
      dragIll: null,
      zoomVisible: false,
      zoomUrl: '',
      exporting: false,
    };
  },
  computed: {
    filledStoryCount() {
      return countFilledStoryPages(this.layoutBlocks);
    },
    hasAnyImage() {
      return this.layoutBlocks.some((b) => b.pages.some((p) => p.illustration));
    },
    editingBlock() {
      return this.layoutBlocks.find((b) => b.id === this.editingBlockId) || null;
    },
    faceStyle() {
      const [w, h] = this.pageRatio.split(':').map(Number);
      return { aspectRatio: `${w} / ${h}` };
    },
    matrixStyle() {
      const [w, h] = this.pageRatio.split(':').map(Number);
      return { '--page-ar': `${w} / ${h}` };
    },
    activeIll() {
      if (!this.activeIllId) return null;
      return this.illList.find((i) => i._id === this.activeIllId)
        || this.selectedIlls.find((i) => i._id === this.activeIllId)
        || null;
    },
    editorCanvasClass() {
      if (!this.editingBlock) return '';
      if (this.editingBlock.type === 'spread') return 'pbl-editor-canvas--spread';
      const pg = this.editingBlock.pages[0];
      if (this.isCoverFront(pg, this.editingBlock)) {
        return 'pbl-editor-canvas--single pbl-editor-canvas--cover-front';
      }
      if (this.isCoverBack(pg, this.editingBlock)) {
        return 'pbl-editor-canvas--single pbl-editor-canvas--cover-back';
      }
      return 'pbl-editor-canvas--single';
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
    syncBlocks() {
      this.layoutBlocks = JSON.parse(JSON.stringify(this.layoutBlocks));
      this.saveSession();
    },
    blockLabel(block) {
      if (block.spreadIndex != null) {
        return this.$t('printBookLayout.storySpreadNum', { num: block.spreadIndex });
      }
      return block.labelKey ? this.$t(block.labelKey) : '';
    },
    isBlockEmpty(block) {
      return isBlockEmpty(block);
    },
    isCoverFront(page, block) {
      const label = page?.labelKey || block?.labelKey;
      return page?.id === 'fp' || label === 'printBookLayout.pastedownFront';
    },
    isCoverBack(page, block) {
      const label = page?.labelKey || block?.labelKey;
      return page?.id === 'bp' || label === 'printBookLayout.pastedownBack';
    },
    sheetClass(block) {
      if (block.type === 'spread') return 'pbl-sheet--spread';
      const pg = block.pages[0];
      if (this.isCoverFront(pg, block)) return 'pbl-sheet--single pbl-sheet--cover-front';
      if (this.isCoverBack(pg, block)) return 'pbl-sheet--single pbl-sheet--cover-back';
      return 'pbl-sheet--single';
    },
    openEditBlock(block) {
      this.editingBlockId = block.id;
      this.viewMode = 'edit';
      this.activePageId = block.pages[0]?.id || null;
    },
    pickIll(item, event) {
      const batchToggle = event?.shiftKey || event?.metaKey || event?.ctrlKey;
      if (batchToggle) {
        const idx = this.selectedIlls.findIndex((x) => x._id === item._id);
        if (idx >= 0) this.selectedIlls.splice(idx, 1);
        else this.selectedIlls.push(item);
        this.saveSession();
        return;
      }
      this.activeIllId = item._id;
    },
    isIllSelected(item) {
      return this.selectedIlls.some((x) => x._id === item._id);
    },
    clearBrush() {
      this.activeIllId = null;
    },
    clearSelected() {
      this.selectedIlls = [];
      this.saveSession();
    },
    assignToPage(page) {
      this.activePageId = page.id;
      const ill = this.activeIll;
      if (!ill) return;
      page.illustration = { _id: ill._id, content: ill.content, title: ill.title };
      this.syncBlocks();
    },
    onDragStartIll(e, item) {
      this.activeIllId = item._id;
      this.dragIll = item;
      e.dataTransfer.effectAllowed = 'copy';
    },
    onDragEndIll() {
      this.dragIll = null;
    },
    onDropPage(page, e) {
      const ill = this.dragIll || this.activeIll;
      if (ill) {
        page.illustration = { _id: ill._id, content: ill.content, title: ill.title };
        this.syncBlocks();
        return;
      }
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const data = JSON.parse(raw);
          if (data?.item) {
            page.illustration = data.item;
            this.syncBlocks();
          }
        }
      } catch {
        /* ignore */
      }
    },
    clearPage(page) {
      page.illustration = null;
      this.syncBlocks();
    },
    zoomPage(page) {
      if (!page.illustration) return;
      this.zoomUrl = this.illUrl(page.illustration);
      this.zoomVisible = true;
    },
    generateLayout() {
      if (!this.selectedIlls.length) {
        ElMessage.warning(this.$t('printBookLayout.pleaseSelect'));
        return;
      }
      const blocks = JSON.parse(JSON.stringify(this.layoutBlocks));
      assignIllustrationsInOrder(blocks, this.selectedIlls);
      this.layoutBlocks = blocks;
      this.saveSession();
      ElMessage.success(this.$t('printBookLayout.layoutGenerated'));
    },
    resetLayout() {
      this.layoutBlocks = createDefaultPrintLayout();
      this.viewMode = 'overview';
      this.editingBlockId = null;
      this.saveSession();
      ElMessage.success(this.$t('printBookLayout.layoutReset'));
    },
    trimEmptySpreads() {
      const before = this.layoutBlocks.length;
      this.layoutBlocks = trimEmptyStorySpreads(this.layoutBlocks);
      const removed = before - this.layoutBlocks.length;
      this.syncBlocks();
      if (removed > 0) {
        ElMessage.success(this.$t('printBookLayout.trimmed', { count: removed }));
      } else {
        ElMessage.info(this.$t('printBookLayout.nothingToTrim'));
      }
    },
    async deleteBlock(blockId) {
      const block = this.layoutBlocks.find((b) => b.id === blockId);
      if (!block?.deletable) return;
      try {
        await ElMessageBox.confirm(
          this.$t('printBookLayout.confirmDeleteSpread'),
          this.$t('printBookLayout.deleteSpread'),
          { type: 'warning', confirmButtonText: this.$t('common.confirm'), cancelButtonText: this.$t('common.cancel') }
        );
        this.layoutBlocks = this.layoutBlocks.filter((b) => b.id !== blockId);
        if (this.editingBlockId === blockId) {
          this.editingBlockId = null;
          this.viewMode = 'overview';
        }
        this.syncBlocks();
      } catch {
        /* cancelled */
      }
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
      } catch {
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
            layoutBlocks: this.layoutBlocks,
            pageRatio: this.pageRatio,
            selectedIlls: this.selectedIlls.map((i) => ({ _id: i._id, content: i.content, title: i.title })),
          })
        );
      } catch {
        /* quota */
      }
    },
    loadSession() {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data.layoutBlocks) && data.layoutBlocks.length) {
            this.layoutBlocks = data.layoutBlocks;
          }
          if (data.pageRatio) this.pageRatio = data.pageRatio;
          if (Array.isArray(data.selectedIlls)) this.selectedIlls = data.selectedIlls;
          return;
        }
        const legacy = sessionStorage.getItem('print_book_layout_v1');
        if (legacy) {
          const data = JSON.parse(legacy);
          const migrated = migrateRowsToBlocks(data.layoutRows);
          if (migrated) this.layoutBlocks = migrated;
          if (Array.isArray(data.selectedIlls)) this.selectedIlls = data.selectedIlls;
        }
      } catch {
        /* ignore */
      }
    },
    async exportPdf() {
      if (this.exporting || !this.hasAnyImage) return;
      this.exporting = true;
      ElMessage.info(this.$t('printBookLayout.exporting'));

      const [rw, rh] = this.pageRatio.split(':').map(Number);
      const singleW = 595;
      const singleH = Math.round((singleW * rh) / rw);

      try {
        let pdf = null;

        for (const block of this.layoutBlocks) {
          if (!block.pages.some((p) => p.illustration)) continue;

          if (block.type === 'single') {
            const pg = block.pages[0];
            if (!pg?.illustration) continue;
            if (!pdf) {
              pdf = new JsPDF('p', 'pt', [singleW, singleH]);
            } else {
              pdf.addPage([singleW, singleH], 'p');
            }
            // eslint-disable-next-line no-await-in-loop
            await this.renderPageImage(pdf, singleW, singleH, pg);
          } else {
            const spreadW = singleW * 2;
            const spreadH = singleH;
            if (!pdf) {
              pdf = new JsPDF('l', 'pt', [spreadW, spreadH]);
            } else {
              pdf.addPage([spreadW, spreadH], 'l');
            }
            const el = document.createElement('div');
            el.style.cssText = `position:fixed;left:-9999px;top:0;width:${spreadW}px;height:${spreadH}px;display:flex;background:#fff;`;
            block.pages.forEach((page) => {
              const cell = document.createElement('div');
              cell.style.cssText = 'flex:1;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;';
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
            await new Promise((r) => setTimeout(r, 200));
            // eslint-disable-next-line no-await-in-loop
            const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#fff' });
            document.body.removeChild(el);
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, spreadW, spreadH);
          }
        }

        if (pdf) {
          pdf.save(`picture-book-layout-${Date.now()}.pdf`);
          ElMessage.success(this.$t('printBookLayout.exportDone'));
        }
      } catch (e) {
        console.error(e);
        ElMessage.error(this.$t('printBookLayout.exportFailed'));
      } finally {
        this.exporting = false;
      }
    },
    async renderPageImage(pdf, pageW, pageH, pg) {
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;left:-9999px;top:0;width:${pageW}px;height:${pageH}px;display:flex;align-items:center;justify-content:center;background:#fff;`;
      if (pg?.illustration) {
        const img = document.createElement('img');
        img.src = this.illUrl(pg.illustration);
        img.crossOrigin = 'anonymous';
        img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
        el.appendChild(img);
      }
      document.body.appendChild(el);
      await new Promise((r) => setTimeout(r, 200));
      const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#fff' });
      document.body.removeChild(el);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, pageH);
    },
  },
};
</script>

<style scoped>
.pbl-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eceae4;
  color: #1f1f1f;
}

.pbl-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 20;
}

.pbl-header-left {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
}

.pbl-back {
  font-size: 13px;
  color: #8167a9;
  text-decoration: none;
}

.pbl-back:hover {
  text-decoration: underline;
}

.pbl-header-left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.pbl-stat {
  font-size: 12px;
  color: #909399;
}

.pbl-header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.pbl-ratio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
  margin-right: 4px;
}

.pbl-header-actions :deep(.el-button--primary) {
  --el-button-bg-color: #8167a9;
  --el-button-border-color: #8167a9;
}

.pbl-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.pbl-stage {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 20px 24px 40px;
}

.pbl-overview-hint {
  text-align: center;
  font-size: 13px;
  color: #606266;
  margin: 0 0 16px;
}

/* 10 列底层网格：每块占 2 列（= 1 跨页宽）；单页内容宽 = 1 列 */
.pbl-matrix {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;
  max-width: 1200px;
  margin: 0 auto;
}

.pbl-cell {
  grid-column: span 2;
  background: #fff;
  border: 2px solid #1f1f1f;
  border-radius: 2px;
  overflow: hidden;
  transition: box-shadow 0.15s;
  min-width: 0;
  align-self: start;
}

.pbl-cell:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pbl-cell--active {
  box-shadow: 0 0 0 3px #8167a9;
}

.pbl-cell--empty {
  opacity: 0.85;
}

.pbl-cell--filled {
  border-color: #8167a9;
}

.pbl-cell-bar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.pbl-cell-edit {
  border: none;
  background: rgba(255, 255, 255, 0.7);
  color: #8167a9;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 3px;
  cursor: pointer;
}

.pbl-cell-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  background: #d8d8d8;
  border-bottom: 1px solid #1f1f1f;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.2;
  min-height: 22px;
}

.pbl-cell-bar span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pbl-cell-del {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #f56c6c;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.pbl-cell-inner {
  padding: 4px;
  background: #f5f5f5;
}

.pbl-sheet {
  display: flex;
  width: 100%;
  align-items: stretch;
}

/* 封面/封底：占 2 列宽，单页占 1 列 — 封面居右、封底居左 */
.pbl-sheet--single .pbl-face--solo {
  width: 50%;
  flex: none;
}

.pbl-sheet--single.pbl-sheet--cover-front {
  justify-content: flex-end;
}

.pbl-sheet--single.pbl-sheet--cover-back {
  justify-content: flex-start;
}

/* 跨页：左右各 1 列 */
.pbl-sheet--spread {
  gap: 0;
  border: 1px solid #999;
}

.pbl-sheet--spread .pbl-face {
  flex: 1;
  min-width: 0;
  width: 50%;
  border: none;
  border-right: 1px solid #999;
}

.pbl-sheet--spread .pbl-face:last-child {
  border-right: none;
}

.pbl-face {
  position: relative;
  aspect-ratio: var(--page-ar, 3 / 4);
  height: auto;
  background: #fff;
  border: 1px solid #bbb;
  overflow: hidden;
  cursor: pointer;
  min-height: 0;
}

.pbl-face:hover {
  border-color: #8167a9;
}

.pbl-face-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fff;
}

.pbl-face-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  text-align: center;
  gap: 2px;
}

.pbl-face-num {
  position: absolute;
  top: 3px;
  left: 4px;
  z-index: 2;
  font-size: 9px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1;
}

.pbl-face-num--right {
  left: auto;
  right: 4px;
}

.pbl-face-num-inline {
  font-size: 10px;
  font-weight: 700;
  color: #1f1f1f;
}

.pbl-face-label {
  font-size: 8px;
  color: #606266;
  line-height: 1.15;
  word-break: break-word;
}

/* 单独编辑 */
.pbl-editor {
  max-width: 1100px;
  margin: 0 auto;
}

.pbl-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.pbl-editor-head h2 {
  margin: 0;
  font-size: 20px;
}

.pbl-editor-del {
  border: none;
  background: #fef0f0;
  color: #f56c6c;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.pbl-editor-canvas {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid #e8e0f0;
  min-height: 420px;
}

.pbl-editor-canvas--single {
  max-width: 560px;
  margin: 0 auto;
}

.pbl-editor-canvas--single .pbl-editor-page {
  width: 50%;
  max-width: 280px;
  margin: 0;
}

.pbl-editor-canvas--single.pbl-editor-canvas--cover-front {
  justify-content: flex-end;
}

.pbl-editor-canvas--single.pbl-editor-canvas--cover-back {
  justify-content: flex-start;
}

.pbl-editor-canvas--spread {
  max-width: 560px;
  margin: 0 auto;
  padding: 16px;
  gap: 0;
  border: 1px solid #999;
}

.pbl-editor-canvas--spread .pbl-editor-page {
  flex: 1;
  max-width: none;
  width: 50%;
  border-radius: 0;
  border: none;
  border-right: 1px solid #999;
}

.pbl-editor-canvas--spread .pbl-editor-page:last-child {
  border-right: none;
}

.pbl-editor-page {
  position: relative;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #fafafa;
  width: 100%;
}

.pbl-editor-page.has-image {
  border-style: solid;
  border-color: #8167a9;
}

.pbl-editor-page.is-active {
  box-shadow: 0 0 0 3px rgba(129, 103, 169, 0.35);
}

.pbl-pg-num {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 14px;
  background: rgba(31, 31, 31, 0.8);
  color: #fff;
  font-size: 13px;
  line-height: 28px;
  text-align: center;
}

.pbl-pg-kind {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.pbl-pg-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
  display: block;
  min-height: 200px;
}

.pbl-pg-empty {
  width: 100%;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 14px;
}

.pbl-pg-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  opacity: 0;
  transition: opacity 0.2s;
}

.pbl-editor-page:hover .pbl-pg-actions {
  opacity: 1;
}

.pbl-pg-actions button {
  flex: 1;
  border: none;
  border-radius: 6px;
  background: #fff;
  padding: 8px;
  font-size: 13px;
  cursor: pointer;
}

/* 左侧插画选择 */
.pbl-picker {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100vh - 57px);
  order: -1;
}

.pbl-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
}

.pbl-picker-head h3 {
  margin: 0;
  font-size: 15px;
}

.pbl-picker-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #909399;
}

.pbl-picker-hint {
  margin: 0;
  padding: 0 16px 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.pbl-picker-selected {
  padding: 0 16px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.pbl-picker-selected-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #8167a9;
  margin-bottom: 6px;
}

.pbl-picker-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.pbl-picker-thumb {
  position: relative;
  width: 56px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid #8167a9;
  cursor: grab;
  background: #f5f5f5;
  line-height: 0;
}

.pbl-picker-thumb img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.pbl-order {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8167a9;
  color: #fff;
  font-size: 9px;
  line-height: 16px;
  text-align: center;
}

.pbl-picker-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-content: flex-start;
}

.pbl-ill-btn {
  position: relative;
  display: block;
  width: 100%;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #f5f5f5;
  line-height: 0;
  flex-shrink: 0;
}

.pbl-ill-btn.is-active-pick {
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.35);
}

.pbl-ill-btn.is-selected {
  border-color: #409eff;
}

.pbl-picker-hint--sub {
  margin-top: -6px;
  font-size: 11px;
  color: #a8abb2;
}

.pbl-ill-btn img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  vertical-align: top;
}

.pbl-stage--brush .pbl-face,
.pbl-stage--brush .pbl-editor-page {
  cursor: copy;
}

.pbl-picker-brush {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 12px 10px;
  padding: 8px 10px;
  background: #ede8f5;
  border: 2px solid #8167a9;
  border-radius: 8px;
}

.pbl-picker-brush-img {
  width: 48px;
  max-height: 64px;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
  background: #fff;
}

.pbl-picker-brush-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #606266;
  line-height: 1.3;
}

.pbl-picker-brush-text strong {
  font-size: 12px;
  color: #8167a9;
}

.pbl-picker-brush-clear {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  color: #909399;
  cursor: pointer;
  padding: 0 4px;
}

.pbl-batch-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(64, 158, 255, 0.9);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.3;
}

.pbl-load-tip {
  text-align: center;
  color: #909399;
  font-size: 12px;
  padding: 12px 0;
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .pbl-matrix {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .pbl-cell {
    grid-column: span 2;
  }
}

@media (max-width: 720px) {
  .pbl-matrix {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pbl-cell {
    grid-column: span 2;
  }

  .pbl-body {
    flex-direction: column;
  }

  .pbl-picker {
    width: 100%;
    max-height: 45vh;
    border-left: none;
    border-top: 1px solid #ddd;
  }

  .pbl-editor-canvas {
    flex-direction: column;
    align-items: center;
  }
}
</style>
