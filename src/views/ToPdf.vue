<template>
  <div class="topdf">
    <section class="topdf-preview">
      <header class="topdf-preview-head">
        <button type="button" class="topdf-back" @click="handleBack">
          ← {{ $t('toPdf.backToSelect') }}
        </button>
        <div class="topdf-preview-tools">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="book">{{ $t('toPdf.viewBook') }}</el-radio-button>
            <el-radio-button label="pages">{{ $t('toPdf.viewPages') }}</el-radio-button>
          </el-radio-group>
          <span v-if="totalPages" class="topdf-page-count">
            {{ $t('toPdf.totalPages', { total: totalPages }) }}
          </span>
        </div>
      </header>

      <div v-if="!totalPages" class="topdf-empty" @click="handleBack">
        <span class="topdf-empty-icon">+</span>
        <span>{{ $t('toPdf.addIllustrations') }}</span>
      </div>

      <!-- 书册预览：封面 / 扉页 / 双页内页，点击翻页 -->
      <div v-else-if="viewMode === 'book'" class="book-stage">
        <p class="book-stage-hint">{{ sheetHint }}</p>
        <p class="book-stage-ratio">{{ bookRatioLabel }}</p>

        <div
          class="book-viewer"
          :class="{ 'is-spread': isSpreadView }"
          @click="onBookClick"
        >
          <button
            type="button"
            class="book-nav book-nav--prev"
            :disabled="sheetIndex <= 0 || isFlipping"
            @click.stop="prevSheet"
          >
            ‹
          </button>

          <div class="book-stage-frame" :style="bookFrameStyle">
            <!-- 封面 / 封底：静止单页（开合书时由 coverLeaf 接管） -->
            <div
              v-if="showSingleFace"
              :key="`sheet-${sheetIndex}-single`"
              class="book-face book-face--single"
            >
              <div class="book-face-spine" aria-hidden="true" />
              <div class="book-face-art">
                <img
                  v-if="currentSheet.page && !currentSheet.page.blank && currentSheet.page.src"
                  :src="currentSheet.page.src"
                  alt=""
                />
                <div v-else class="book-placeholder">
                  <strong>{{ currentSheet.type === 'cover' ? $t('toPdf.roleCover') : $t('toPdf.roleBack') }}</strong>
                  <span v-if="form.title">{{ form.title }}</span>
                </div>
              </div>
              <span class="book-face-badge">
                {{ currentSheet.type === 'cover' ? $t('toPdf.roleCover') : $t('toPdf.roleBack') }}
              </span>
            </div>

            <!-- 扉页 / 内页：左侧不动，右侧 3D 翻页 -->
            <div
              v-else-if="isSpreadView"
              class="book-face book-face--spread"
            >
              <div class="book-half book-half--left">
                <div :key="`sheet-${sheetIndex}-left`" class="book-face-art">
                  <img
                    v-if="currentSheet.left && !currentSheet.left.blank && currentSheet.left.src"
                    :src="currentSheet.left.src"
                    alt=""
                  />
                  <div v-else class="book-placeholder book-placeholder--muted">
                    <span>{{ currentSheet.leftLabel || $t('toPdf.blankPage') }}</span>
                  </div>
                </div>
              </div>
              <div class="book-half book-half--right">
                <div class="book-page-stack">
                  <!-- 下层：翻页后露出的右页 -->
                  <div class="book-face-art book-page-under">
                    <template v-if="rightUnderPage && !rightUnderPage.blank && rightUnderPage.src">
                      <img :src="rightUnderPage.src" alt="" />
                    </template>
                    <div
                      v-else-if="currentSheet.type === 'title' && !(rightUnderPage && rightUnderPage.src)"
                      class="book-placeholder book-placeholder--title"
                    >
                      <em>{{ $t('toPdf.roleTitle') }}</em>
                      <strong>{{ form.title || $t('toPdf.bookTitlePlaceholder') }}</strong>
                      <span v-if="form.desc" class="book-title-desc">{{ form.desc }}</span>
                    </div>
                    <div v-else class="book-placeholder book-placeholder--muted">
                      <span>{{ $t('toPdf.blankPage') }}</span>
                    </div>
                  </div>

                  <!-- 翻动页：绕书脊 rotateY；背面直接贴目标页，避免翻过中途露出灰纸 -->
                  <div
                    v-if="flipLeaf"
                    class="book-page-leaf"
                    :class="{ 'is-flipped': flipLeafFlipped }"
                  >
                    <div class="book-page-leaf__face book-page-leaf__front">
                      <div class="book-face-art">
                        <template v-if="flipLeaf.page && !flipLeaf.page.blank && flipLeaf.page.src">
                          <img :src="flipLeaf.page.src" alt="" />
                        </template>
                        <div
                          v-else-if="flipLeaf.sheetType === 'title'"
                          class="book-placeholder book-placeholder--title"
                        >
                          <em>{{ $t('toPdf.roleTitle') }}</em>
                          <strong>{{ form.title || $t('toPdf.bookTitlePlaceholder') }}</strong>
                        </div>
                        <div v-else class="book-placeholder book-placeholder--muted">
                          <span>{{ $t('toPdf.blankPage') }}</span>
                        </div>
                      </div>
                      <span class="book-page-leaf__gloss" aria-hidden="true" />
                    </div>
                    <div class="book-page-leaf__face book-page-leaf__back" aria-hidden="true">
                      <div class="book-face-art">
                        <template v-if="flipLeaf.backPage && !flipLeaf.backPage.blank && flipLeaf.backPage.src">
                          <img :src="flipLeaf.backPage.src" alt="" />
                        </template>
                        <div
                          v-else-if="flipLeaf.backSheetType === 'title'"
                          class="book-placeholder book-placeholder--title"
                        >
                          <em>{{ $t('toPdf.roleTitle') }}</em>
                          <strong>{{ form.title || $t('toPdf.bookTitlePlaceholder') }}</strong>
                        </div>
                        <div v-else class="book-placeholder book-placeholder--muted">
                          <span>{{ flipLeaf.backLabel || $t('toPdf.blankPage') }}</span>
                        </div>
                      </div>
                      <span class="book-page-leaf__gloss book-page-leaf__gloss--back" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
              <span class="book-face-badge">{{ sheetBadge }}</span>
            </div>

            <!-- 封面/封底开合：盖在右半（或左半）页上翻转 -->
            <div
              v-if="coverLeaf"
              class="book-cover-leaf"
              :class="{
                'is-flipped': coverLeafFlipped,
                'book-cover-leaf--left': coverLeaf.side === 'left',
              }"
            >
              <div class="book-cover-leaf__face book-cover-leaf__front">
                <div class="book-face-spine" aria-hidden="true" />
                <div class="book-face-art">
                  <img
                    v-if="coverLeaf.page && !coverLeaf.page.blank && coverLeaf.page.src"
                    :src="coverLeaf.page.src"
                    alt=""
                  />
                  <div v-else class="book-placeholder">
                    <strong>
                      {{
                        coverLeaf.sheetType === 'back'
                          ? $t('toPdf.roleBack')
                          : $t('toPdf.roleCover')
                      }}
                    </strong>
                    <span v-if="form.title">{{ form.title }}</span>
                  </div>
                </div>
              </div>
              <div class="book-cover-leaf__face book-cover-leaf__back" aria-hidden="true">
                <div class="book-face-art">
                  <img
                    v-if="coverLeaf.backPage && !coverLeaf.backPage.blank && coverLeaf.backPage.src"
                    :src="coverLeaf.backPage.src"
                    alt=""
                  />
                  <div v-else class="book-placeholder book-placeholder--muted">
                    <span>{{ coverLeaf.backLabel || $t('toPdf.blankPage') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="book-nav book-nav--next"
            :disabled="sheetIndex >= sheets.length - 1 || isFlipping"
            @click.stop="nextSheet"
          >
            ›
          </button>
        </div>

        <div class="book-pager">
          <button type="button" :disabled="sheetIndex <= 0 || isFlipping" @click="prevSheet">
            {{ $t('toPdf.prevPage') }}
          </button>
          <span>{{ $t('toPdf.sheetProgress', { current: sheetIndex + 1, total: sheets.length }) }}</span>
          <button type="button" :disabled="sheetIndex >= sheets.length - 1 || isFlipping" @click="nextSheet">
            {{ $t('toPdf.nextPage') }}
          </button>
        </div>

        <div class="book-thumbs" v-if="sheets.length">
          <button
            v-for="(sheet, idx) in sheets"
            :key="`sheet-thumb-${idx}`"
            type="button"
            class="book-thumb"
            :class="{ 'is-active': idx === sheetIndex }"
            @click="goSheet(idx)"
          >
            <span class="book-thumb-label">{{ thumbLabel(sheet, idx) }}</span>
          </button>
        </div>
      </div>

      <!-- 页面编辑：排序 / 增删 -->
      <div v-else class="topdf-scroll">
        <div class="topdf-pages-toolbar">
          <el-button size="small" @click="addBlankPage">{{ $t('toPdf.addBlankPage') }}</el-button>
          <el-button size="small" @click="handleBack">{{ $t('toPdf.addMoreArt') }}</el-button>
        </div>
        <div
          v-for="(page, index) in editablePages"
          :key="page.key"
          class="topdf-page-card"
          :class="{
            'is-dragging': dragIndex === index,
            'is-drag-over': dragOverIndex === index && dragIndex !== index,
          }"
          :style="pageCardStyle"
          draggable="true"
          @dragstart="onDragStart($event, index)"
          @dragover="onDragOver($event, index)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd"
        >
          <div class="topdf-page-toolbar">
            <span class="topdf-page-label">
              {{ roleLabel(index) }}
              <em>{{ $t('toPdf.pageLabel', { n: index + 1 }) }}</em>
            </span>
            <div class="topdf-page-actions">
              <button type="button" :disabled="index === 0" @click.stop="movePage(index, -1)">↑</button>
              <button type="button" :disabled="index === editablePages.length - 1" @click.stop="movePage(index, 1)">↓</button>
              <button type="button" class="is-danger" @click.stop="removePage(index)">{{ $t('toPdf.deletePage') }}</button>
            </div>
          </div>

          <div class="topdf-page-stage" :style="pageStageStyle">
            <div v-if="page.blank" class="topdf-page-blank">{{ $t('toPdf.blankPage') }}</div>
            <el-image v-else :src="page.src" fit="cover" class="topdf-page-img" />
          </div>
        </div>
      </div>
    </section>

    <aside class="topdf-sidebar">
      <h2 class="topdf-sidebar-title">{{ $t('toPdf.exportTitle') }}</h2>

      <div class="topdf-format-block">
        <div class="topdf-format-row">
          <div>
            <p class="topdf-format-value">{{ $t(activeFormat.nameKey) }}</p>
            <p class="topdf-format-meta">{{ formatMetaLabel }}</p>
          </div>
          <button type="button" class="topdf-format-change" @click="goChangeFormat">
            {{ $t('toPdf.changeFormat') }}
          </button>
        </div>
      </div>

      <el-form ref="form" :model="form" label-position="top" class="topdf-form">
        <el-form-item :label="$t('toPdf.bookTitle')">
          <el-input
            v-model="form.title"
            maxlength="24"
            show-word-limit
            :placeholder="$t('toPdf.bookTitlePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('toPdf.bookCategory')">
          <el-select v-model="form.category" :placeholder="$t('toPdf.categoryPlaceholder')">
            <el-option :label="$t('toPdf.catReading')" value="reading" />
            <el-option :label="$t('toPdf.catHabit')" value="habit" />
            <el-option :label="$t('toPdf.catEnglish')" value="english" />
            <el-option :label="$t('toPdf.catMath')" value="math" />
            <el-option :label="$t('toPdf.catKnowledge')" value="knowledge" />
            <el-option :label="$t('toPdf.catOthers')" value="others" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.authorizationConfirmed">
            {{ $t('toPdf.compliance') }}
          </el-checkbox>
        </el-form-item>

        <div class="topdf-actions">
          <el-button type="primary" :disabled="exporting || !totalPages" @click="downPDF">
            {{ $t('toPdf.downloadPdf') }}
          </el-button>
          <el-button :disabled="exporting || !totalPages" @click="downImages">
            {{ $t('toPdf.downloadImages') }}
          </el-button>
          <el-button type="primary" :disabled="!publishablePages.length" @click="submit">
            {{ $t('toPdf.publish') }}
          </el-button>
        </div>
      </el-form>
    </aside>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { ElMessage } from 'element-plus';
import {
  formatSizeLabel,
  getBookExportFormat,
  normalizeBookExportFormatId,
} from '@/data/bookExportFormats';
import {
  buildBookPdfFromPages,
  downloadBookPagesAsPng,
} from '@/utils/bookExport/renderBookPage';
import { getLayoutExportFormatId, readLayoutExportSession, writeLayoutExportSession } from '@/utils/layoutExportSession';

function pageKey(item, index) {
  if (item?.blank) return item._id || `blank-${index}`;
  return item?._id || `page-${index}`;
}

function toStorePage(item) {
  if (item?.blank) {
    return {
      blank: true,
      _id: item._id || `blank-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content: null,
      title: item.title || '',
    };
  }
  return {
    _id: item._id,
    content: item.content,
    title: item.title,
  };
}

export default {
  data() {
    return {
      exporting: false,
      viewMode: 'book',
      sheetIndex: 0,
      isFlipping: false,
      flipDirection: 'next',
      flipTimer: null,
      flipLeaf: null,
      flipLeafFlipped: false,
      /** 封面/封底开合叶 */
      coverLeaf: null,
      coverLeafFlipped: false,
      /** 翻页过程中强制下层右页（上一页），避免 prev 时闪成新图 */
      rightUnderOverride: null,
      dragIndex: null,
      dragOverIndex: null,
      form: {
        title: '',
        category: '',
        desc: '',
        authorizationConfirmed: false,
      },
      editablePages: [],
    };
  },
  computed: {
    ...mapState(['imgToPDF', 'bookExportFormatId']),
    activeFormat() {
      return getBookExportFormat(this.bookExportFormatId);
    },
    formatMetaLabel() {
      return formatSizeLabel(this.activeFormat);
    },
    pageCardStyle() {
      return { aspectRatio: this.activeFormat.aspectRatioCss };
    },
    pageStageStyle() {
      return { aspectRatio: this.pageCardStyle.aspectRatio };
    },
    /** 单页 trim 比例，来自印刷尺寸而非 CSS 预览字符串 */
    pageAspectValue() {
      const w = this.activeFormat.trimWidthIn || 1;
      const h = this.activeFormat.trimHeightIn || 1;
      return w / h;
    },
    bookRatioLabel() {
      const f = this.activeFormat;
      if (this.isSpreadView) {
        return this.$t('toPdf.bookRatioSpread', {
          w: f.trimWidthIn,
          h: f.trimHeightIn,
          sw: f.trimWidthIn * 2,
        });
      }
      return this.$t('toPdf.bookRatioSingle', { w: f.trimWidthIn, h: f.trimHeightIn });
    },
    /** 外框按高度锁定，宽度由单页/双页比例推导，避免被撑扁 */
    bookFrameStyle() {
      const isSpread = this.isSpreadView;
      const pageAr = this.pageAspectValue;
      const frameAr = isSpread ? pageAr * 2 : pageAr;
      return {
        '--frame-ar': String(frameAr),
      };
    },
    isSpreadView() {
      const t = this.currentSheet?.type;
      if (t === 'title' || t === 'spread') return true;
      return !!this.coverLeaf;
    },
    showSingleFace() {
      const t = this.currentSheet?.type;
      return (t === 'cover' || t === 'back') && !this.coverLeaf;
    },
    rightUnderPage() {
      if (this.rightUnderOverride) return this.rightUnderOverride;
      return this.currentSheet.right || null;
    },
    totalPages() {
      return this.editablePages.length;
    },
    publishablePages() {
      return this.editablePages.filter((p) => !p.blank && p.id);
    },
    /**
     * 书册结构：
     * 0 封面(pages[0])
     * 1 扉页展开：左空白 / 右扉页(pages[1] 或书名卡)
     * 2… 内页双页展开(pages[2] 起成对)
     * 末 封底(最后一页若 ≥3 页且未成对用空白，或单独用末页)
     */
    sheets() {
      const pages = this.editablePages;
      if (!pages.length) return [];

      const list = [
        { type: 'cover', page: pages[0] },
        {
          type: 'title',
          left: null,
          right: pages[1] || null,
          leftLabel: this.$t('toPdf.roleEndpaper'),
        },
      ];

      for (let i = 2; i < pages.length; i += 2) {
        list.push({
          type: 'spread',
          left: pages[i],
          right: pages[i + 1] || null,
        });
      }

      list.push({ type: 'back', page: null });
      return list;
    },
    currentSheet() {
      return this.sheets[this.sheetIndex] || { type: 'cover', page: null };
    },
    sheetHint() {
      const t = this.currentSheet.type;
      if (t === 'cover') return this.$t('toPdf.hintCover');
      if (t === 'title') return this.$t('toPdf.hintTitle');
      if (t === 'back') return this.$t('toPdf.hintBack');
      return this.$t('toPdf.hintSpread');
    },
    sheetBadge() {
      const t = this.currentSheet.type;
      if (t === 'title') return this.$t('toPdf.roleTitle');
      if (t === 'spread') return this.$t('toPdf.roleSpread');
      return '';
    },
  },
  watch: {
    imgToPDF: {
      immediate: true,
      handler(list) {
        this.hydratePages(list);
      },
    },
    sheets() {
      if (this.sheetIndex > this.sheets.length - 1) {
        this.sheetIndex = Math.max(0, this.sheets.length - 1);
      }
    },
    viewMode(mode) {
      if (mode === 'book') this.sheetIndex = 0;
    },
  },
  mounted() {
    readLayoutExportSession();
    const formatId = normalizeBookExportFormatId(getLayoutExportFormatId());
    this.$store.commit('setBookExportFormat', formatId);
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
    if (this.flipTimer) clearTimeout(this.flipTimer);
  },
  methods: {
    hydratePages(list) {
      const source = Array.isArray(list) && list.length
        ? list
        : (readLayoutExportSession().checkedImages || []);
      this.editablePages = source.map((item, index) => {
        if (item?.blank) {
          return {
            key: pageKey(item, index),
            blank: true,
            _id: item._id || pageKey(item, index),
            id: null,
            src: '',
            title: item.title || '',
          };
        }
        const content = item?.content;
        const src = !content
          ? ''
          : (String(content).startsWith('http') ? content : `https://static.kidstory.cc/${content}`);
        return {
          key: pageKey(item, index),
          blank: false,
          _id: item._id,
          id: item._id,
          src,
          content,
          title: item.title || '',
        };
      }).filter((p) => p.blank || p.src);
    },
    persistPages() {
      const pages = this.editablePages.map((p) => toStorePage(p));
      this.$store.commit('setBookIllustrations', pages);
      writeLayoutExportSession({ checkedImages: pages });
    },
    roleLabel(index) {
      if (index === 0) return this.$t('toPdf.roleCover');
      if (index === 1) return this.$t('toPdf.roleTitle');
      if (index === this.editablePages.length - 1 && this.editablePages.length >= 3) {
        return this.$t('toPdf.roleInterior');
      }
      return this.$t('toPdf.roleInterior');
    },
    thumbLabel(sheet) {
      if (sheet.type === 'cover') return this.$t('toPdf.roleCover');
      if (sheet.type === 'title') return this.$t('toPdf.roleTitle');
      if (sheet.type === 'back') return this.$t('toPdf.roleBack');
      return this.$t('toPdf.roleSpread');
    },
    goChangeFormat() {
      this.$router.push({ name: 'compose-illustration', query: { edit: 'format' } });
    },
    exportFileBaseName() {
      const title = (this.form.title || '').trim();
      const safe = title.replace(/[^\w\u4e00-\u9fa5-]+/g, '-').replace(/^-+|-+$/g, '');
      return safe || 'KidStory';
    },
    handleBack() {
      this.$router.push({ name: 'compose-illustration' });
    },
    validateCompliance() {
      if (!this.form.authorizationConfirmed) {
        ElMessage.warning(this.$t('toPdf.complianceRequired'));
        return false;
      }
      return true;
    },
    buildExportPages() {
      return this.editablePages.map((p) => (
        p.blank ? { blank: true } : { src: p.src }
      ));
    },
    addBlankPage() {
      const id = `blank-${Date.now()}`;
      this.editablePages.push({
        key: id,
        blank: true,
        _id: id,
        id: null,
        src: '',
        title: '',
      });
      this.persistPages();
      this.viewMode = 'pages';
    },
    removePage(index) {
      this.editablePages.splice(index, 1);
      this.persistPages();
    },
    reorderPages(from, to) {
      if (from === to || from < 0 || to < 0 || from >= this.editablePages.length || to >= this.editablePages.length) {
        return;
      }
      const list = [...this.editablePages];
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      this.editablePages = list;
      this.persistPages();
    },
    movePage(index, delta) {
      this.reorderPages(index, index + delta);
    },
    onDragStart(event, index) {
      this.dragIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver(event, index) {
      event.preventDefault();
      if (this.dragIndex !== null && this.dragIndex !== index) {
        this.dragOverIndex = index;
      }
    },
    onDragLeave() {
      this.dragOverIndex = null;
    },
    onDrop(event, dropIndex) {
      event.preventDefault();
      if (this.dragIndex === null || this.dragIndex === dropIndex) {
        this.dragOverIndex = null;
        return;
      }
      this.reorderPages(this.dragIndex, dropIndex);
      this.dragIndex = null;
      this.dragOverIndex = null;
    },
    onDragEnd() {
      this.dragIndex = null;
      this.dragOverIndex = null;
    },
    goSheet(idx) {
      if (idx === this.sheetIndex || this.isFlipping) return;
      const direction = idx > this.sheetIndex ? 'next' : 'prev';
      const fromSheet = this.sheets[this.sheetIndex];
      const toSheet = this.sheets[idx];
      const isSpread = (s) => s && (s.type === 'title' || s.type === 'spread');
      const isSingle = (s) => s && (s.type === 'cover' || s.type === 'back');

      this.flipDirection = direction;
      this.isFlipping = true;
      if (this.flipTimer) clearTimeout(this.flipTimer);

      if (isSpread(fromSheet) && isSpread(toSheet)) {
        // 同一张纸：正面=较早展的右页，背面=较晚展的左页；下层右页=较晚展的右页
        // 往前 A→B：正 from.right / 背 to.left / 下 to.right
        // 往后 B→A：正 to.right / 背 from.left / 下 from.right（起始 -180 先见背面）
        if (direction === 'next') {
          this.flipLeaf = {
            direction,
            page: fromSheet.right,
            sheetType: fromSheet.type,
            backPage: toSheet.left,
            backSheetType: toSheet.type,
            backLabel: toSheet.leftLabel,
          };
          this.flipLeafFlipped = false;
          this.rightUnderOverride = null;
          this.sheetIndex = idx;
          this.$nextTick(() => {
            requestAnimationFrame(() => {
              this.flipLeafFlipped = true;
            });
          });
        } else {
          this.rightUnderOverride = fromSheet.right || { blank: true };
          this.flipLeaf = {
            direction,
            page: toSheet.right,
            sheetType: toSheet.type,
            backPage: fromSheet.left,
            backSheetType: fromSheet.type,
            backLabel: fromSheet.leftLabel,
          };
          this.flipLeafFlipped = true;
          this.sheetIndex = idx;
          this.$nextTick(() => {
            requestAnimationFrame(() => {
              this.flipLeafFlipped = false;
            });
          });
        }

        this.flipTimer = setTimeout(() => {
          this.flipLeaf = null;
          this.flipLeafFlipped = false;
          this.rightUnderOverride = null;
          this.isFlipping = false;
          this.flipTimer = null;
        }, 920);
        return;
      }

      // 封面/封底 ↔ 双页：开合书动画
      if (isSingle(fromSheet) && isSpread(toSheet)) {
        const openFromBack = fromSheet.type === 'back';
        this.coverLeaf = {
          side: openFromBack ? 'left' : 'right',
          page: fromSheet.page,
          sheetType: fromSheet.type,
          backPage: openFromBack ? toSheet.right : toSheet.left,
          backSheetType: toSheet.type,
          backLabel: toSheet.leftLabel,
        };
        this.coverLeafFlipped = false;
        this.sheetIndex = idx;
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.coverLeafFlipped = true;
            });
          });
        });
        this.flipTimer = setTimeout(() => {
          this.coverLeaf = null;
          this.coverLeafFlipped = false;
          this.isFlipping = false;
          this.flipTimer = null;
        }, 980);
        return;
      }

      if (isSpread(fromSheet) && isSingle(toSheet)) {
        const closeToBack = toSheet.type === 'back';
        this.coverLeaf = {
          side: closeToBack ? 'left' : 'right',
          page: toSheet.page,
          sheetType: toSheet.type,
          backPage: closeToBack ? fromSheet.right : fromSheet.left,
          backSheetType: fromSheet.type,
          backLabel: fromSheet.leftLabel,
        };
        this.coverLeafFlipped = true;
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.coverLeafFlipped = false;
          });
        });
        this.flipTimer = setTimeout(() => {
          this.sheetIndex = idx;
          this.coverLeaf = null;
          this.coverLeafFlipped = false;
          this.isFlipping = false;
          this.flipTimer = null;
        }, 980);
        return;
      }

      this.flipLeaf = null;
      this.coverLeaf = null;
      this.rightUnderOverride = null;
      this.sheetIndex = idx;
      this.flipTimer = setTimeout(() => {
        this.isFlipping = false;
        this.flipTimer = null;
      }, 560);
    },
    prevSheet() {
      if (this.sheetIndex <= 0 || this.isFlipping) return;
      this.goSheet(this.sheetIndex - 1);
    },
    nextSheet() {
      if (this.sheetIndex >= this.sheets.length - 1 || this.isFlipping) return;
      this.goSheet(this.sheetIndex + 1);
    },
    onBookClick(event) {
      if (event.target.closest('.book-nav') || event.target.closest('.book-thumb')) return;
      const frame = event.currentTarget.querySelector('.book-stage-frame') || event.currentTarget;
      const rect = frame.getBoundingClientRect();
      const x = event.clientX - rect.left;
      if (x > rect.width / 2) this.nextSheet();
      else this.prevSheet();
    },
    onKeydown(event) {
      if (this.viewMode !== 'book') return;
      if (event.key === 'ArrowLeft') this.prevSheet();
      if (event.key === 'ArrowRight') this.nextSheet();
    },
    async submit() {
      if (!this.validateCompliance()) return;
      const content = this.publishablePages.map((p) => p.id).filter(Boolean);
      if (!content.length) {
        ElMessage.warning(this.$t('toPdf.publishNeedImages'));
        return;
      }

      try {
        const response = await this.$http.post(
          '/book/',
          {
            content,
            title: this.form.title,
            description: this.form.desc,
            type: this.form.category,
            compliance_checked: true,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (response.data.desc === 'success') {
          this.$router.push('/user/upload/submit-res/');
        } else {
          this.$router.push({ path: '/errorpage' });
        }
      } catch (error) {
        console.log(error);
        ElMessage.error(this.$t('toPdf.publishFailed'));
      }
    },
    downPDF() {
      if (!this.validateCompliance()) return;
      if (!this.editablePages.length) return;

      this.exporting = true;
      ElMessage.info(this.$t('toPdf.downloading'));

      buildBookPdfFromPages(this.buildExportPages(), this.activeFormat, 'digital')
        .then((pdf) => {
          pdf.save(`${this.exportFileBaseName()}-300dpi.pdf`);
          ElMessage.success(this.$t('toPdf.downloadDone'));
        })
        .catch((err) => {
          console.error(err);
          ElMessage.error(this.$t('toPdf.downloadFailed'));
        })
        .finally(() => {
          this.exporting = false;
        });
    },
    downImages() {
      if (!this.validateCompliance()) return;
      if (!this.editablePages.length) return;

      this.exporting = true;
      ElMessage.info(this.$t('toPdf.downloadingImages'));

      downloadBookPagesAsPng(
        this.buildExportPages(),
        this.activeFormat,
        this.exportFileBaseName(),
        'digital'
      )
        .then(() => {
          ElMessage.success(this.$t('toPdf.downloadImagesDone'));
        })
        .catch((err) => {
          console.error(err);
          ElMessage.error(this.$t('toPdf.downloadImagesFailed'));
        })
        .finally(() => {
          this.exporting = false;
        });
    },
  },
};
</script>

<style scoped>
.topdf {
  display: flex;
  gap: 20px;
  min-height: calc(100vh - 50px);
  padding: 16px 20px 24px;
  box-sizing: border-box;
  background: #eef0f4;
  text-align: left;
}

.topdf-preview {
  flex: 1;
  min-width: 0;
  min-height: 0;
  max-height: calc(100vh - 50px - 40px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.topdf-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.topdf-preview-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.topdf-back {
  border: none;
  background: transparent;
  color: #8167a9;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
}

.topdf-page-count {
  font-size: 14px;
  color: #909399;
}

.topdf-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 24px;
  min-height: 360px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  color: #909399;
  cursor: pointer;
}

.topdf-empty-icon {
  font-size: 48px;
  line-height: 1;
  font-weight: 300;
}

/* —— 书册预览 —— */
.book-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 20px 20px;
  background:
    radial-gradient(ellipse at center, #f7f5fb 0%, #e8ebf1 70%);
  overflow: auto;
}

.book-stage-hint {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.book-stage-ratio {
  margin: 4px 0 14px;
  font-size: 12px;
  color: #909399;
}

.book-viewer {
  position: relative;
  width: 100%;
  max-width: 920px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  perspective: 1600px;
}

.book-stage-frame {
  position: relative;
  /* 同时受视口高度与宽度限制，始终保持 trim / 双页比例 */
  width: min(
    860px,
    calc(100% - 96px),
    calc(min(58vh, 560px) * var(--frame-ar, 1))
  );
  aspect-ratio: var(--frame-ar, 1);
  height: auto;
  margin: 0 auto;
  transition:
    width 0.55s cubic-bezier(0.645, 0.045, 0.355, 1),
    aspect-ratio 0.55s cubic-bezier(0.645, 0.045, 0.355, 1);
  transform-style: preserve-3d;
}

.book-viewer.is-spread .book-stage-frame {
  width: min(
    920px,
    calc(100% - 96px),
    calc(min(58vh, 560px) * var(--frame-ar, 1))
  );
}

.book-face {
  position: absolute;
  inset: 0;
  background: #fff;
  border-radius: 6px;
  box-shadow:
    0 18px 48px rgba(40, 30, 60, 0.22),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;
  overflow: hidden;
  transform-origin: center center;
  backface-visibility: hidden;
}

.book-face--single {
  border-radius: 4px 10px 10px 4px;
}

.book-face--single .book-face-art {
  position: absolute;
  inset: 0;
}

.book-face-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 12px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.14), transparent 70%);
  z-index: 2;
  pointer-events: none;
}

.book-face--spread {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  border-radius: 10px;
  background: #ebe7f2;
  box-shadow:
    0 18px 48px rgba(40, 30, 60, 0.22);
  overflow: visible;
  padding: 0;
  transform-style: preserve-3d;
}

.book-half {
  position: relative;
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.book-half--left {
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: inset -10px 0 14px -12px rgba(0, 0, 0, 0.28);
  border-radius: 10px 0 0 10px;
  z-index: 1;
}

.book-half--right {
  box-shadow: inset 10px 0 14px -12px rgba(0, 0, 0, 0.28);
  border-radius: 0 10px 10px 0;
  perspective: 2200px;
  overflow: visible;
  z-index: 2;
}

.book-page-stack {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.book-page-under {
  z-index: 1;
}

.book-page-leaf {
  position: absolute;
  inset: 0;
  z-index: 4;
  transform-origin: left center;
  transform-style: preserve-3d;
  transform: rotateY(0deg);
  transition: transform 0.85s cubic-bezier(0.645, 0.045, 0.355, 1);
  will-change: transform;
  pointer-events: none;
}

.book-page-leaf.is-flipped {
  transform: rotateY(-180deg);
}

.book-page-leaf__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  background: #fff;
}

.book-page-leaf__front {
  box-shadow:
    8px 0 24px rgba(0, 0, 0, 0.18),
    inset -1px 0 0 rgba(255, 255, 255, 0.65);
}

.book-page-leaf__back {
  transform: rotateY(180deg);
  background: #fff;
  box-shadow: inset 12px 0 18px rgba(0, 0, 0, 0.1);
}

.book-page-leaf__gloss {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.22) 0%,
    rgba(0, 0, 0, 0.05) 14%,
    transparent 42%
  );
  opacity: 0;
  transition: opacity 0.85s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.book-page-leaf.is-flipped .book-page-leaf__gloss:not(.book-page-leaf__gloss--back) {
  opacity: 1;
}

.book-page-leaf__gloss--back {
  background: linear-gradient(
    270deg,
    rgba(0, 0, 0, 0.18) 0%,
    rgba(0, 0, 0, 0.04) 16%,
    transparent 44%
  );
  opacity: 1;
}

.book-page-leaf.is-flipped .book-page-leaf__gloss--back {
  opacity: 0;
}

/* 封面/封底开合叶：贴在展开后的右半（封面）或左半（封底） */
.book-cover-leaf {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 50%;
  z-index: 8;
  transform-origin: left center;
  transform-style: preserve-3d;
  transform: rotateY(0deg);
  transition: transform 0.85s cubic-bezier(0.645, 0.045, 0.355, 1);
  will-change: transform;
  pointer-events: none;
  border-radius: 0 10px 10px 0;
}

.book-cover-leaf.is-flipped {
  transform: rotateY(-180deg);
}

.book-cover-leaf--left {
  right: auto;
  left: 0;
  transform-origin: right center;
  border-radius: 10px 0 0 10px;
}

.book-cover-leaf--left.is-flipped {
  transform: rotateY(180deg);
}

.book-cover-leaf__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 18px 48px rgba(40, 30, 60, 0.22),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;
}

.book-cover-leaf__front {
  border-radius: inherit;
}

.book-cover-leaf__back {
  transform: rotateY(180deg);
  background: #fff;
}

.book-cover-leaf--left .book-cover-leaf__back {
  transform: rotateY(-180deg);
}

.book-cover-leaf .book-face-art {
  border-radius: inherit;
}

.book-face-art {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.book-face-art--flip {
  transform-origin: left center;
  backface-visibility: hidden;
}

.book-face-art img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fff;
}

.book-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
  color: #606266;
  background:
    repeating-linear-gradient(-45deg, #fff, #fff 10px, #f7f8fa 10px, #f7f8fa 20px);
}

.book-placeholder strong {
  font-size: 22px;
  color: #303133;
}

.book-placeholder em {
  font-style: normal;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #8167a9;
  text-transform: uppercase;
}

.book-placeholder--muted {
  color: #c0c4cc;
  /* 环衬等空白页：纯白，不要灰白斜纹 */
  background: #fff;
}

.book-placeholder--title {
  background: linear-gradient(160deg, #f9f7fc, #efeaf8);
}

.book-title-desc {
  max-width: 80%;
  font-size: 13px;
  line-height: 1.5;
  color: #909399;
}

.book-face-badge {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 3;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}

.book-face--spread .book-face-badge {
  left: 52%;
}

/* 翻页过渡：封面/封底整页（3D 翻书） */
.book-flip-next-enter-active,
.book-flip-next-leave-active,
.book-flip-prev-enter-active,
.book-flip-prev-leave-active {
  transition:
    transform 0.7s cubic-bezier(0.645, 0.045, 0.355, 1),
    opacity 0.45s ease;
  transform-origin: left center;
}

.book-flip-next-enter-from {
  transform: perspective(2000px) rotateY(70deg);
  opacity: 0;
}

.book-flip-next-leave-to {
  transform: perspective(2000px) rotateY(-90deg);
  opacity: 0.2;
}

.book-flip-prev-enter-from {
  transform: perspective(2000px) rotateY(-70deg);
  opacity: 0;
}

.book-flip-prev-leave-to {
  transform: perspective(2000px) rotateY(90deg);
  opacity: 0.2;
}

.book-nav {
  position: relative;
  flex: 0 0 auto;
  z-index: 5;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  color: #8167a9;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.book-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.book-pager {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  font-size: 13px;
  color: #606266;
}

.book-pager button {
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  color: #606266;
}

.book-pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.book-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;
  max-width: 920px;
}

.book-thumb {
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
}

.book-thumb.is-active {
  border-color: #8167a9;
  background: #f3eef9;
  color: #8167a9;
  font-weight: 600;
}

/* —— 页面列表编辑 —— */
.topdf-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 32px 32px;
  background: linear-gradient(180deg, #f0f2f6 0%, #e4e7ed 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.topdf-page-card {
  position: relative;
  width: 100%;
  max-width: min(720px, 100%);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid transparent;
}

.topdf-page-card.is-drag-over { border-color: #8167a9; }
.topdf-page-card.is-dragging { opacity: 0.55; }

.topdf-page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

.topdf-page-label {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.topdf-page-label em {
  margin-left: 8px;
  font-style: normal;
  font-weight: 500;
  color: #909399;
}

.topdf-page-actions {
  display: flex;
  gap: 6px;
}

.topdf-page-actions button {
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  color: #606266;
}

.topdf-page-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.topdf-page-actions button.is-danger {
  color: #f56c6c;
  border-color: #f5c6c6;
}

.topdf-page-stage {
  position: relative;
  width: 100%;
  background: #fff;
  overflow: hidden;
}

.topdf-page-img {
  width: 100%;
  height: 100%;
}

.topdf-page-img :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topdf-page-blank {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 14px;
  background: #fff;
}

.topdf-sidebar {
  width: 340px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 24px 22px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 50px - 40px);
  overflow-y: auto;
}

.topdf-sidebar-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.topdf-format-block {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #ebeef5;
}

.topdf-format-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.topdf-format-value {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.topdf-format-meta {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.45;
}

.topdf-format-change {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8167a9;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
}

.topdf-pages-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.topdf-form :deep(.el-form-item) { margin-bottom: 16px; }
.topdf-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  padding-bottom: 6px;
}
.topdf-form :deep(.el-select) { width: 100%; }
.topdf-form :deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.6;
  color: #606266;
  font-size: 13px;
}

.topdf-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
}

.topdf-actions :deep(.el-button) {
  width: 100%;
  height: 42px;
  margin: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.topdf-actions :deep(.el-button--primary) {
  --el-button-text-color: #ffffff;
  --el-button-hover-text-color: #ffffff;
  --el-button-active-text-color: #ffffff;
  --el-button-disabled-text-color: rgba(255, 255, 255, 0.75);
  background-color: #8167a9;
  border-color: #8167a9;
  color: #ffffff;
}

.topdf-actions :deep(.el-button--primary:hover),
.topdf-actions :deep(.el-button--primary:focus) {
  background-color: #6f5698;
  border-color: #6f5698;
  color: #ffffff;
}

.topdf-actions :deep(.el-button--primary.is-disabled),
.topdf-actions :deep(.el-button--primary.is-disabled:hover) {
  background-color: #b7a8d1;
  border-color: #b7a8d1;
  color: #ffffff;
}

@media (max-width: 960px) {
  .topdf {
    flex-direction: column;
    padding: 12px;
  }

  .topdf-sidebar {
    width: 100%;
    max-height: none;
  }

  .book-stage-frame {
    width: min(100%, calc(100% - 72px));
    max-height: min(50vh, 420px);
  }

  .book-nav {
    width: 36px;
    height: 36px;
  }
}
</style>
