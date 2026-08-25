<template>
  <div class="reco-admin">
    <header class="page-header">
      <h1>{{ $t('websiteRecoAdmin.title') }}</h1>
      <p>{{ $t('websiteRecoAdmin.subtitle') }}</p>
    </header>

    <el-card class="form-card" shadow="never">
      <el-form label-width="100px" @submit.prevent>
        <el-form-item :label="$t('websiteRecoAdmin.image')">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="onFileChange"
          >
            <div class="upload-hint">{{ $t('websiteRecoAdmin.dropHint') }}</div>
          </el-upload>
          <div v-if="previewUrl" class="preview">
            <img :src="previewUrl" alt="" />
            <el-button link type="danger" @click="clearFile">{{ $t('websiteRecoAdmin.removeImage') }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="$t('websiteRecoAdmin.name')">
          <el-input v-model="form.name" :placeholder="$t('websiteRecoAdmin.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('websiteRecoAdmin.intro')">
          <el-input
            v-model="form.intro"
            type="textarea"
            :rows="3"
            :placeholder="$t('websiteRecoAdmin.introPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('websiteRecoAdmin.link')">
          <el-input v-model="form.linkUrl" :placeholder="$t('websiteRecoAdmin.linkPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('websiteRecoAdmin.flags')">
          <el-checkbox v-model="form.isNew">{{ $t('websiteRecoAdmin.isNew') }}</el-checkbox>
          <el-checkbox v-model="form.isFeatured">{{ $t('websiteRecoAdmin.isFeatured') }}</el-checkbox>
          <el-checkbox v-model="form.isEnabled">{{ $t('websiteRecoAdmin.isEnabled') }}</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSubmit">
            {{ editingId ? $t('websiteRecoAdmin.update') : $t('websiteRecoAdmin.create') }}
          </el-button>
          <el-button v-if="editingId" @click="resetForm">{{ $t('websiteRecoAdmin.cancelEdit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card" shadow="never">
      <div class="list-head">
        <h2>{{ $t('websiteRecoAdmin.listTitle') }}</h2>
        <el-button link @click="loadList">{{ $t('websiteRecoAdmin.refresh') }}</el-button>
      </div>
      <div v-if="loading" class="muted">{{ $t('websiteRecoAdmin.loading') }}</div>
      <div v-else class="admin-grid">
        <article v-for="item in list" :key="item.id" class="admin-item">
          <img :src="item.imageUrl" :alt="item.name" />
          <div class="admin-meta">
            <h3>#{{ item.id }} {{ item.name }}</h3>
            <p>{{ item.intro }}</p>
            <a :href="item.linkUrl" target="_blank" rel="noopener">{{ item.linkUrl }}</a>
            <div class="admin-actions">
              <el-button size="small" @click="startEdit(item)">{{ $t('websiteRecoAdmin.edit') }}</el-button>
              <el-button size="small" type="danger" @click="onDelete(item)">{{ $t('websiteRecoAdmin.delete') }}</el-button>
            </div>
          </div>
        </article>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  adminListWebsiteRecommendations,
  adminCreateWebsiteRecommendation,
  adminUpdateWebsiteRecommendation,
  adminDeleteWebsiteRecommendation,
} from '@/utils/websiteRecommendationsApi'

export default {
  name: 'UploadWebsiteRecommendation',
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      editingId: null,
      file: null,
      previewUrl: '',
      form: {
        name: '',
        intro: '',
        linkUrl: '',
        isNew: true,
        isFeatured: false,
        isEnabled: true,
      },
    }
  },
  created() {
    this.loadList()
  },
  beforeUnmount() {
    this.clearPreviewUrl()
  },
  methods: {
    clearPreviewUrl() {
      if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.previewUrl = ''
    },
    onFileChange(uploadFile) {
      const raw = uploadFile?.raw
      if (!raw) return
      this.clearPreviewUrl()
      this.file = raw
      this.previewUrl = URL.createObjectURL(raw)
    },
    clearFile() {
      this.file = null
      this.clearPreviewUrl()
    },
    resetForm() {
      this.editingId = null
      this.file = null
      this.clearPreviewUrl()
      this.form = {
        name: '',
        intro: '',
        linkUrl: '',
        isNew: true,
        isFeatured: false,
        isEnabled: true,
      }
    },
    startEdit(item) {
      this.editingId = item.id
      this.form = {
        name: item.name || '',
        intro: item.intro || '',
        linkUrl: item.linkUrl || item.link_url || '',
        isNew: !!item.isNew || !!item.is_new,
        isFeatured: !!item.isFeatured || !!item.is_featured,
        isEnabled: item.is_enabled !== false && item.isEnabled !== false,
      }
      this.file = null
      this.clearPreviewUrl()
      this.previewUrl = item.imageUrl || ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    buildFormData() {
      const fd = new FormData()
      fd.append('name', this.form.name.trim())
      fd.append('intro', this.form.intro.trim())
      fd.append('link_url', this.form.linkUrl.trim())
      fd.append('is_new', this.form.isNew ? '1' : '0')
      fd.append('is_featured', this.form.isFeatured ? '1' : '0')
      fd.append('is_enabled', this.form.isEnabled ? '1' : '0')
      if (this.file) fd.append('picture', this.file)
      return fd
    },
    async loadList() {
      this.loading = true
      try {
        this.list = await adminListWebsiteRecommendations(this.$http)
      } catch (e) {
        ElMessage.error(e?.message || this.$t('websiteRecoAdmin.loadFailed'))
      } finally {
        this.loading = false
      }
    },
    async onSubmit() {
      if (!this.form.name.trim()) {
        ElMessage.warning(this.$t('websiteRecoAdmin.nameRequired'))
        return
      }
      if (!this.form.linkUrl.trim()) {
        ElMessage.warning(this.$t('websiteRecoAdmin.linkRequired'))
        return
      }
      if (!this.editingId && !this.file) {
        ElMessage.warning(this.$t('websiteRecoAdmin.imageRequired'))
        return
      }
      this.saving = true
      try {
        const fd = this.buildFormData()
        if (this.editingId) {
          await adminUpdateWebsiteRecommendation(this.$http, this.editingId, fd)
          ElMessage.success(this.$t('websiteRecoAdmin.updateOk'))
        } else {
          await adminCreateWebsiteRecommendation(this.$http, fd)
          ElMessage.success(this.$t('websiteRecoAdmin.createOk'))
        }
        this.resetForm()
        await this.loadList()
      } catch (e) {
        ElMessage.error(e?.message || this.$t('websiteRecoAdmin.saveFailed'))
      } finally {
        this.saving = false
      }
    },
    async onDelete(item) {
      try {
        await ElMessageBox.confirm(
          this.$t('websiteRecoAdmin.deleteConfirm', { name: item.name }),
          this.$t('websiteRecoAdmin.delete'),
          { type: 'warning' }
        )
        await adminDeleteWebsiteRecommendation(this.$http, item.id)
        ElMessage.success(this.$t('websiteRecoAdmin.deleteOk'))
        if (this.editingId === item.id) this.resetForm()
        await this.loadList()
      } catch (e) {
        if (e === 'cancel' || e === 'close') return
        ElMessage.error(e?.message || this.$t('websiteRecoAdmin.deleteFailed'))
      }
    },
  },
}
</script>

<style scoped>
.reco-admin {
  max-width: 920px;
  margin: 0 auto;
  padding: 28px 16px 64px;
  text-align: left;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.page-header p {
  margin: 0 0 20px;
  color: #6b7280;
}

.form-card,
.list-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.upload-hint {
  padding: 18px;
  color: #6b7280;
}

.preview {
  margin-top: 12px;
}

.preview img {
  width: 100%;
  max-width: 420px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  display: block;
  margin-bottom: 6px;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.list-head h2 {
  margin: 0;
  font-size: 16px;
}

.admin-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-item {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 14px;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  padding: 10px;
}

.admin-item img {
  width: 160px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f4f6;
}

.admin-meta h3 {
  margin: 0 0 6px;
  font-size: 15px;
}

.admin-meta p {
  margin: 0 0 6px;
  color: #6b7280;
  font-size: 13px;
}

.admin-meta a {
  font-size: 12px;
  color: #4f46e5;
  word-break: break-all;
}

.admin-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.muted {
  color: #9ca3af;
}

@media (max-width: 640px) {
  .admin-item {
    grid-template-columns: 1fr;
  }
  .admin-item img {
    width: 100%;
    height: 160px;
  }
}
</style>
