<template>
  <div class="topdf">
    <!-- 左侧：大预览 -->
    <section class="topdf-preview">
      <header class="topdf-preview-head">
        <button type="button" class="topdf-back" @click="handleBack">
          ← {{ $t('toPdf.backToSelect') }}
        </button>
        <span v-if="totalPages" class="topdf-page-count">
          {{ $t('toPdf.totalPages', { total: totalPages }) }}
        </span>
      </header>

      <div v-if="!totalPages" class="topdf-empty" @click="handleBack">
        <span class="topdf-empty-icon">+</span>
        <span>{{ $t('toPdf.addIllustrations') }}</span>
      </div>

      <div v-else class="topdf-scroll">
        <div
          v-for="(page, index) in previewPages"
          :key="page.id || `code-${index}`"
          class="topdf-page-card"
        >
          <span class="topdf-page-label">{{ $t('toPdf.pageLabel', { n: index + 1 }) }}</span>
          <el-image :src="page.src" fit="contain" class="topdf-page-img" />
        </div>
      </div>
    </section>

    <!-- 右侧：表单 -->
    <aside class="topdf-sidebar">
      <h2 class="topdf-sidebar-title">{{ $t('toPdf.publishTitle') }}</h2>
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
        <el-form-item :label="$t('toPdf.bookDesc')">
          <el-input
            v-model="form.desc"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 8 }"
            maxlength="500"
            show-word-limit
            :placeholder="$t('toPdf.descPlaceholder')"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.authorizationConfirmed">
            {{ $t('toPdf.compliance') }}
          </el-checkbox>
        </el-form-item>
        <div class="topdf-actions">
          <el-button :disabled="disabled || !totalPages" @click="downPDF">
            {{ $t('toPdf.downloadPdf') }}
          </el-button>
          <el-button type="primary" :disabled="!totalPages" @click="submit">
            {{ $t('toPdf.publish') }}
          </el-button>
        </div>
      </el-form>
    </aside>
  </div>
</template>

<script>
import JsPDF from 'jspdf';
import { mapState } from 'vuex';
import { ElMessage } from 'element-plus';

const PDF_W = 984.3;
const PDF_H = 699;
const PDF_RENDER_SCALE = 2;

export default {
  data() {
    return {
      disabled: false,
      checkedId: [],
      form: {
        title: '',
        category: '',
        desc: '',
        authorizationConfirmed: false,
      },
      codeImg: require('../assets/images/pdfCode.webp'),
      pdfBase64: '',
    };
  },
  computed: {
    ...mapState(['imgToPDF']),
    previewPages() {
      const pages = this.imgToPDF.map((item) => ({
        type: 'ill',
        id: item._id,
        src: `https://static.kidstory.cc/${item.content}`,
      }));
      if (pages.length) {
        pages.push({ type: 'code', id: 'code', src: this.codeImg });
      }
      return pages;
    },
    totalPages() {
      return this.previewPages.length;
    },
  },
  methods: {
    handleBack() {
      this.$router.push({ name: 'compose-illustration' });
    },
    getcheckedId() {
      this.checkedId = [];
      for (let i = 0; i < this.imgToPDF.length; i += 1) {
        this.checkedId.push(this.imgToPDF[i]._id);
      }
    },
    validateCompliance() {
      if (!this.form.authorizationConfirmed) {
        ElMessage.warning(this.$t('toPdf.complianceRequired'));
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validateCompliance()) return;

      await this.getcheckedId();
      this.$http
        .post(
          '/book/',
          {
            content: this.checkedId,
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
        )
        .then((response) => {
          if (response.data.desc === 'success') {
            this.$router.push('/user/upload/submit-res/');
          } else {
            this.$router.push({ path: '/errorpage' });
          }
        })
        .catch((error) => console.log(error));
    },
    downPDF() {
      if (!this.validateCompliance()) return;
      if (!this.previewPages.length) return;

      this.disabled = true;
      ElMessage(this.$t('toPdf.downloading'));

      this.buildPdfFromPages()
        .then((pdf) => {
          pdf.save('StoryTime.pdf');
          this.pdfBase64 = pdf.output('dataurlstring');
        })
        .catch((err) => {
          console.error(err);
          ElMessage.error(this.$t('toPdf.downloadFailed'));
        })
        .finally(() => {
          this.disabled = false;
        });
    },
    loadImageElement(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const isLocal = src.startsWith('data:')
          || src.startsWith('blob:')
          || src.startsWith('/')
          || src.startsWith(window.location.origin);
        if (!isLocal) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`image load failed: ${src}`));
        img.src = src;
      });
    },
    findPreviewImage(src) {
      const imgs = document.querySelectorAll('.topdf-scroll img');
      for (let i = 0; i < imgs.length; i += 1) {
        const el = imgs[i];
        if (el.src === src || el.currentSrc === src) {
          return el;
        }
      }
      return null;
    },
    async pageToDataUrl(src) {
      let img;
      try {
        img = await this.loadImageElement(src);
      } catch (firstErr) {
        const previewImg = this.findPreviewImage(src);
        if (previewImg?.complete && previewImg.naturalWidth > 0) {
          img = previewImg;
        } else {
          throw firstErr;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = PDF_W * PDF_RENDER_SCALE;
      canvas.height = PDF_H * PDF_RENDER_SCALE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const fit = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * fit;
      const h = img.naturalHeight * fit;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      return canvas.toDataURL('image/jpeg', 0.92);
    },
    async buildPdfFromPages() {
      const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: [PDF_W, PDF_H] });
      for (let i = 0; i < this.previewPages.length; i += 1) {
        const dataUrl = await this.pageToDataUrl(this.previewPages[i].src);
        if (i > 0) {
          pdf.addPage([PDF_W, PDF_H], 'l');
        }
        pdf.addImage(dataUrl, 'JPEG', 0, 0, PDF_W, PDF_H);
      }
      return pdf;
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

/* —— 预览区 —— */
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
  padding: 14px 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.topdf-back {
  border: none;
  background: transparent;
  color: #8167a9;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
}

.topdf-back:hover {
  color: #6e5494;
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
  transition: background 0.2s, border-color 0.2s;
}

.topdf-empty:hover {
  background: #f9f8fc;
  border-color: #b7a6d6;
  color: #8167a9;
}

.topdf-empty-icon {
  font-size: 48px;
  line-height: 1;
  font-weight: 300;
}

.topdf-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 32px 32px;
  background: linear-gradient(180deg, #f0f2f6 0%, #e4e7ed 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.topdf-page-card {
  position: relative;
  width: 100%;
  max-width: min(720px, 100%);
  aspect-ratio: 4 / 3;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  flex-shrink: 0;
}

.topdf-page-label {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 1;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.topdf-page-img {
  width: 100%;
  height: 100%;
}

.topdf-page-img :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* —— 右侧表单 —— */
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

.topdf-form {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.topdf-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.topdf-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  padding-bottom: 6px;
  line-height: 1.4;
}

.topdf-form :deep(.el-select) {
  width: 100%;
}

.topdf-form :deep(.el-input__wrapper),
.topdf-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}

.topdf-form :deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.6;
  color: #606266;
  font-size: 13px;
}

.topdf-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #8167a9;
  border-color: #8167a9;
}

.topdf-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.topdf-actions :deep(.el-button) {
  width: 100%;
  height: 44px;
  margin: 0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
}

.topdf-actions :deep(.el-button--primary) {
  background-color: #8167a9;
  border-color: #8167a9;
}

.topdf-actions :deep(.el-button--primary:hover) {
  background-color: #6e5494;
  border-color: #6e5494;
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
}
</style>
