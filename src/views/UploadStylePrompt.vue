<template>
  <div class="style-upload-page">
    <header class="page-header">
      <h1>{{ $t('uploadStylePrompt.title') }}</h1>
      <p class="page-desc">{{ $t('uploadStylePrompt.subtitle') }}</p>
    </header>

    <el-card class="main-card" shadow="never">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px" class="style-form">
        <el-form-item :label="$t('uploadStylePrompt.styleImage')" prop="imageFile">
          <div class="upload-zone">
            <el-upload
              drag
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/jpeg,image/png,image/webp,image/gif"
              :on-change="handleFileChange"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">{{ $t('uploadStylePrompt.dropHint') }}</div>
              <template #tip>
                <div class="upload-tip">{{ $t('uploadStylePrompt.formatHint') }}</div>
              </template>
            </el-upload>

            <div v-if="processing" class="preview-panel preview-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>{{ $t('uploadStylePrompt.processing') }}</span>
            </div>

            <div v-else-if="previewSrc" class="preview-panel">
              <img :src="previewSrc" :alt="form.artStyle" class="preview-img" />
              <div v-if="processed" class="preview-meta">
                <span>{{ processed.width }} × {{ processed.height }}</span>
                <span>{{ processed.sizeKB }} KB</span>
                <span>{{ processed.mimeType === 'image/webp' ? 'WebP' : 'JPEG' }}</span>
              </div>
              <el-button v-if="processed" type="danger" link @click="clearImage">
                {{ $t('uploadStylePrompt.removeImage') }}
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item :label="$t('uploadStylePrompt.styleId')" prop="id">
              <el-input-number
                v-model="form.id"
                :min="1"
                :max="999"
                :disabled="Boolean(editingId)"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item :label="$t('uploadStylePrompt.styleKey')" prop="key">
              <el-input
                v-model="form.key"
                :disabled="Boolean(editingId)"
                :placeholder="$t('uploadStylePrompt.styleKeyPlaceholder')"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('uploadStylePrompt.category')" prop="category">
          <el-select v-model="form.category" style="width: 100%">
            <el-option
              v-for="cat in backendCategories"
              :key="cat"
              :label="$t(`uploadStylePrompt.backendCategory.${cat}`)"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('uploadStylePrompt.artStyle')" prop="artStyle">
          <el-input v-model="form.artStyle" :placeholder="$t('uploadStylePrompt.artStylePlaceholder')" />
        </el-form-item>

        <el-form-item :label="$t('uploadStylePrompt.elementDetails')" prop="elementDetails">
          <el-input
            v-model="form.elementDetails"
            type="textarea"
            :rows="5"
            :placeholder="$t('uploadStylePrompt.elementDetailsPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('uploadStylePrompt.artStyleEn')">
          <el-input v-model="form.artStyleEn" :placeholder="$t('uploadStylePrompt.artStyleEnPlaceholder')" />
        </el-form-item>

        <el-form-item :label="$t('uploadStylePrompt.elementDetailsEn')">
          <el-input
            v-model="form.elementDetailsEn"
            type="textarea"
            :rows="4"
            :placeholder="$t('uploadStylePrompt.elementDetailsEnPlaceholder')"
          />
        </el-form-item>

        <el-form-item>
          <div class="action-row">
            <el-button
              type="primary"
              :loading="uploading"
              :disabled="!canSubmit"
              @click="submitToServer"
            >
              {{ editingId ? $t('uploadStylePrompt.updateServer') : $t('uploadStylePrompt.uploadServer') }}
            </el-button>
            <el-button v-if="editingId" @click="resetForm">
              {{ $t('uploadStylePrompt.createNew') }}
            </el-button>
            <el-button :disabled="!processed" @click="downloadWebp">
              {{ $t('uploadStylePrompt.downloadWebp') }}
            </el-button>
          </div>
          <p v-if="lastUploadedUrl" class="upload-result">
            {{ $t('uploadStylePrompt.uploadedUrl') }}:
            <a :href="lastUploadedUrl" target="_blank" rel="noopener">{{ lastUploadedUrl }}</a>
          </p>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="listLoading" class="existing-card" shadow="never">
      <template #header>
        <div class="existing-header">
          <span>{{ $t('uploadStylePrompt.existingTitle') }}</span>
          <span class="existing-count">{{ existingStyles.length }}</span>
          <el-button size="small" link @click="loadExistingStyles">
            {{ $t('uploadStylePrompt.refreshList') }}
          </el-button>
        </div>
      </template>
      <div v-if="existingStyles.length" class="existing-grid">
        <button
          v-for="style in existingStyles"
          :key="style.key"
          type="button"
          class="existing-item"
          :class="{ 'is-active': editingId === style.id }"
          @click="loadExistingStyle(style)"
        >
          <img :src="style.image" :alt="style.artStyle || styleLabel(style)" class="existing-thumb" />
          <span class="existing-name">{{ style.artStyle || styleLabel(style) }}</span>
          <span class="existing-id">#{{ style.id }}</span>
        </button>
      </div>
      <el-empty v-else :description="$t('uploadStylePrompt.noStyles')" />
    </el-card>
  </div>
</template>

<script>
import { UploadFilled, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import enMessages from '@/i18n/locales/en.json'
import { ILLUSTRATION_STYLE_BACKEND_CATEGORIES } from '@/data/illustrationStyleCategories'
import {
  invalidateIllustrationStylesCache,
  loadIllustrationStyles,
  nextIllustrationStyleId,
} from '@/utils/illustrationStyles'
import { ILLUSTRATION_STYLE_CONFIGS } from '@/data/illustrationStyleConfigs'
import {
  createIllustrationStyle,
  fetchAdminIllustrationStyles,
  updateIllustrationStyle,
} from '@/utils/illustrationStylesApi'
import {
  compressImageToWebp,
  downloadBlob,
  revokePreviewUrl,
} from '@/utils/compressToWebp'

export default {
  name: 'UploadStylePrompt',
  components: {
    UploadFilled,
    Loading,
  },
  data() {
    return {
      form: this.emptyForm(),
      processed: null,
      processing: false,
      uploading: false,
      listLoading: false,
      editingId: null,
      existingStyles: [],
      existingImageUrl: '',
      lastUploadedUrl: '',
      rules: {
        id: [{ required: true, message: '必填', trigger: 'blur' }],
        key: [
          { required: true, message: '必填', trigger: 'blur' },
          { pattern: /^[a-z][a-zA-Z0-9]*$/, message: 'camelCase，如 penLineArt', trigger: 'blur' },
        ],
        category: [{ required: true, message: '必选', trigger: 'change' }],
        artStyle: [{ required: true, message: '必填', trigger: 'blur' }],
        elementDetails: [{ required: true, message: '必填', trigger: 'blur' }],
      },
    }
  },
  computed: {
    backendCategories() {
      return ILLUSTRATION_STYLE_BACKEND_CATEGORIES
    },
    previewSrc() {
      if (this.processed?.previewUrl) return this.processed.previewUrl
      if (this.existingImageUrl) return this.existingImageUrl
      return ''
    },
    canSubmit() {
      const hasText = this.form.key && this.form.artStyle && this.form.elementDetails
      const hasImage = Boolean(this.processed?.blob) || Boolean(this.editingId && this.existingImageUrl)
      return hasText && hasImage && !this.uploading
    },
  },
  mounted() {
    this.loadExistingStyles()
  },
  beforeUnmount() {
    this.revokeProcessedPreview()
  },
  methods: {
    emptyForm() {
      return {
        id: nextIllustrationStyleId(),
        key: '',
        category: 'sketch',
        artStyle: '',
        elementDetails: '',
        artStyleEn: '',
        elementDetailsEn: '',
        imageFile: null,
      }
    },
    styleLabel(style) {
      if (style.artStyle) return style.artStyle
      return this.$t(`aibooks.styles.${style.key}.artStyle`)
    },
    revokeProcessedPreview() {
      if (this.processed?.previewUrl) {
        revokePreviewUrl(this.processed.previewUrl)
      }
    },
    resetForm() {
      this.revokeProcessedPreview()
      this.processed = null
      this.editingId = null
      this.existingImageUrl = ''
      this.lastUploadedUrl = ''
      this.form = this.emptyForm()
    },
    clearImage() {
      this.revokeProcessedPreview()
      this.processed = null
      this.form.imageFile = null
      if (!this.editingId) {
        this.existingImageUrl = ''
      }
    },
    async loadExistingStyles() {
      this.listLoading = true
      try {
        const adminItems = await fetchAdminIllustrationStyles()
        if (adminItems.length) {
          this.existingStyles = adminItems.map((item) => ({
            id: item.id,
            key: item.key,
            category: item.category,
            artStyle: item.artStyle,
            elementDetails: item.elementDetails,
            image: item.imageUrl,
          }))
          return
        }
      } catch {
        // 非管理员或未部署 API 时回退公开列表
      }

      try {
        const locale = this.$i18n?.locale === 'en' ? 'en' : 'zh'
        const items = await loadIllustrationStyles({ locale, t: this.$t.bind(this), force: true })
        this.existingStyles = items
      } catch {
        this.existingStyles = ILLUSTRATION_STYLE_CONFIGS.map((config) => ({
          id: config.id,
          key: config.key,
          category: config.category,
          image: config.image,
          artStyle: this.$t(`aibooks.styles.${config.key}.artStyle`),
          elementDetails: this.$t(`aibooks.styles.${config.key}.elementDetails`),
        }))
      } finally {
        this.listLoading = false
      }
    },
    async handleFileChange(uploadFile) {
      const file = uploadFile?.raw
      if (!file || !file.type.startsWith('image/')) {
        ElMessage.warning(this.$t('uploadStylePrompt.invalidImage'))
        return
      }

      this.processing = true
      this.revokeProcessedPreview()
      this.processed = null

      try {
        const result = await compressImageToWebp(file)
        this.form.imageFile = file
        this.processed = result
        if (result.mimeType !== 'image/webp') {
          ElMessage.warning(this.$t('uploadStylePrompt.webpFallback'))
        }
      } catch (err) {
        ElMessage.error(err?.message || this.$t('uploadStylePrompt.processFailed'))
      } finally {
        this.processing = false
      }
    },
    loadExistingStyle(style) {
      this.revokeProcessedPreview()
      this.processed = null
      this.form.imageFile = null
      this.editingId = style.id
      this.form.id = style.id
      this.form.key = style.key
      this.form.category = style.category || 'sketch'
      this.form.artStyle = style.artStyle || this.$t(`aibooks.styles.${style.key}.artStyle`)
      this.form.elementDetails = style.elementDetails || this.$t(`aibooks.styles.${style.key}.elementDetails`)
      const enEntry = enMessages.aibooks?.styles?.[style.key]
      this.form.artStyleEn = enEntry?.artStyle || ''
      this.form.elementDetailsEn = enEntry?.elementDetails || ''
      this.existingImageUrl = typeof style.image === 'string' ? style.image : ''
      this.lastUploadedUrl = this.existingImageUrl
      ElMessage.success(this.$t('uploadStylePrompt.loadedExisting', { name: this.form.artStyle }))
    },
    buildFormData() {
      const formData = new FormData()
      if (this.processed?.blob) {
        const ext = this.processed.mimeType === 'image/webp' ? 'webp' : 'jpg'
        formData.append('picture', this.processed.blob, `${this.form.id}.${ext}`)
      }
      formData.append('key', this.form.key)
      formData.append('category', this.form.category)
      if (!this.editingId) {
        formData.append('id', String(this.form.id))
      }
      formData.append('art_style_zh', this.form.artStyle)
      formData.append('element_details_zh', this.form.elementDetails)
      if (this.form.artStyleEn) formData.append('art_style_en', this.form.artStyleEn)
      if (this.form.elementDetailsEn) formData.append('element_details_en', this.form.elementDetailsEn)
      return formData
    },
    async submitToServer() {
      const token = localStorage.getItem('token')
      if (!token) {
        ElMessage.error(this.$t('uploadStylePrompt.loginRequired'))
        return
      }

      try {
        await this.$refs.formRef.validate()
      } catch {
        return
      }

      this.uploading = true
      try {
        const formData = this.buildFormData()
        const result = this.editingId
          ? await updateIllustrationStyle(this.editingId, formData)
          : await createIllustrationStyle(formData)

        const imageUrl = result?.imageUrl || result?.image_url || this.lastUploadedUrl
        if (imageUrl) {
          this.lastUploadedUrl = imageUrl
          this.existingImageUrl = imageUrl
        }

        invalidateIllustrationStylesCache()
        await this.loadExistingStyles()

        if (!this.editingId && result?.id) {
          this.editingId = result.id
        }

        ElMessage.success(
          this.editingId
            ? this.$t('uploadStylePrompt.updateSuccess')
            : this.$t('uploadStylePrompt.uploadSuccess')
        )
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || this.$t('uploadStylePrompt.uploadFailed')
        ElMessage.error(msg)
      } finally {
        this.uploading = false
      }
    },
    downloadWebp() {
      if (!this.processed?.blob) return
      const ext = this.processed.mimeType === 'image/webp' ? 'webp' : 'jpg'
      downloadBlob(this.processed.blob, `${this.form.id}.${ext}`)
      ElMessage.success(this.$t('uploadStylePrompt.downloaded'))
    },
  },
}
</script>

<style scoped>
.style-upload-page {
  min-height: calc(100vh - 64px);
  background: #f5f7fa;
  padding: 32px 20px 48px;
}

.page-header {
  max-width: 960px;
  margin: 0 auto 24px;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-desc {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.main-card,
.existing-card {
  max-width: 960px;
  margin: 0 auto 24px;
  border-radius: 12px;
}

.upload-zone {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
}

.upload-zone :deep(.el-upload) {
  width: 280px;
}

.upload-zone :deep(.el-upload-dragger) {
  width: 280px;
  padding: 28px 16px;
}

.upload-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 8px;
}

.upload-text {
  color: #374151;
  font-size: 14px;
}

.upload-tip {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.preview-panel {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-loading {
  min-height: 200px;
  justify-content: center;
  color: #6b7280;
}

.preview-img {
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.upload-result {
  margin: 12px 0 0;
  font-size: 13px;
  color: #374151;
  word-break: break-all;
}

.upload-result a {
  color: #409eff;
}

.existing-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.existing-count {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

.existing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.existing-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.existing-item:hover,
.existing-item.is-active {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
}

.existing-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  margin: 0 auto 6px;
}

.existing-name {
  display: block;
  font-size: 11px;
  line-height: 1.3;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.existing-id {
  display: block;
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
}

@media (max-width: 640px) {
  .upload-zone :deep(.el-upload),
  .upload-zone :deep(.el-upload-dragger) {
    width: 100%;
  }
}
</style>
