<template>
  <div class="newyear-container">
    <div class="style-detail-container">
      <el-scrollbar class="style-list-container-scroll">
        <h2 class="section-title">{{ $t('aiPicture.generateIllustration') }}</h2>
        <div class="style-detail">
          <div class="detail-content">
            <!-- 图片展示区域：空白框或生成结果 -->
            <div class="image-display-area">
              <!-- 生成进度提示 -->
              <div v-if="generating" class="generating-progress">
                <i class="el-icon-loading"></i>
                <p>{{ $t('aiPicture.generating') }}</p>
              </div>

              <!-- 生成结果展示 -->
              <div v-else-if="generatedImageUrl" class="generated-result">
                <el-image
                  :src="generatedImageUrl"
                  fit="contain"
                  class="result-image"
                >
                  <template #error>
                    <div class="image-slot">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </template>
                </el-image>
                <div class="result-actions">
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="collectIllustration"
                    :loading="collecting">
                    <i class="el-icon-star-on"></i> 收集插画
                  </el-button>
                  <el-button 
                    type="success" 
                    size="small"
                    @click="downloadIllustration"
                    :loading="downloading">
                    <i class="el-icon-download"></i> 下载插画
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="clearGeneratedImage">
                    <i class="el-icon-delete"></i> 清除
                  </el-button>
                </div>
              </div>

              <!-- 空白框（未生成时显示） -->
              <div v-else class="empty-image-box">
                <p>生成的图片将显示在这里</p>
              </div>
            </div>

            <div class="style-info">
              <div class="info-item">
                <label class="info-label">{{ $t('aiPicture.artStyle') }}</label>
                <el-input
                  v-model="editableArtStyle"
                  type="textarea"
                  :rows="1"
                  :placeholder="$t('aiPicture.artStylePlaceholder')"
                  class="info-input"
                />
              </div>
              <div class="info-item">
                <label class="info-label">{{ $t('aiPicture.elementDetails') }}</label>
                <el-input
                  v-model="editableElementDetails"
                  type="textarea"
                  :rows="2"
                  :placeholder="$t('aiPicture.elementDetailsPlaceholder')"
                  class="info-input"
                />
              </div>
            </div>

            <div class="input-section">
              <label class="input-label">{{ $t('aiPicture.subjectScene') }}</label>
              <el-input
                v-model="subjectScene"
                type="textarea"
                :rows="3"
                :placeholder="$t('aiPicture.subjectPlaceholder')"
                class="subject-input"
              />
            </div>

            <el-button
              type="primary"
              class="generate-button"
              @click="generateIllustration"
              :loading="generating"
              :disabled="!subjectScene || !subjectScene.trim() || generating"
            >
              {{ generating ? $t('aiPicture.generating') : $t('aiPicture.generate') }}
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { checkWebPSupport } from '@/utils/imageOptimizer'

export default {
  name: 'NewYear',
  setup() {
    const { t, locale } = useI18n()

    const supportsWebP = ref(false)

    const styleConfigs = [
      { key: 'penLineArt', id: 1, image: require('@/assets/prompt/1.webp') },
      { key: 'colorfulOutlineRomanticism', id: 6, image: require('@/assets/prompt/6.webp') },
      { key: 'crayonNoiseHandDrawn', id: 15, image: require('@/assets/prompt/15.webp') },
      { key: 'vintageSketch', id: 17, image: require('@/assets/prompt/17.webp') },
      { key: 'pixarStyle', id: 5, image: require('@/assets/prompt/5.webp') },
      { key: 'engravingLines', id: 7, image: require('@/assets/prompt/7.webp') },
      { key: 'pencilSketch3D', id: 16, image: require('@/assets/prompt/16.webp') },
      { key: 'feltCollage', id: 18, image: require('@/assets/prompt/18.webp') },
      { key: 'blackWhiteDoodle', id: 2, image: require('@/assets/prompt/2.webp') },
      { key: 'collageIllustration', id: 4, image: require('@/assets/prompt/4.webp') },
      { key: 'rusticHandDrawn', id: 8, image: require('@/assets/prompt/8.webp') },
      { key: 'maximalistCopperplate', id: 9, image: require('@/assets/prompt/9.webp') },
      { key: 'doodleSoul', id: 10, image: require('@/assets/prompt/10.webp') },
      { key: 'keithHaringDoodle', id: 11, image: require('@/assets/prompt/11.webp') },
      { key: 'abstractFlatDesign', id: 12, image: require('@/assets/prompt/12.webp') },
      { key: 'simpleCartoon', id: 13, image: require('@/assets/prompt/13.webp') },
      { key: 'healingWatercolor', id: 14, image: require('@/assets/prompt/14.webp') },
      { key: 'oilPainting', id: 19, image: require('@/assets/prompt/19.webp') }
    ]

    onMounted(async () => {
      supportsWebP.value = await checkWebPSupport()
    })

    const styles = computed(() => {
      return styleConfigs.map(config => ({
        id: config.id,
        key: config.key,
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
      subjectScene: '',
      editableArtStyle: '',
      editableElementDetails: '',
      generating: false,
      generatedImageUrl: null,
      collecting: false,
      downloading: false,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
    }
  },
  computed: {
    selectedStyle() {
      return this.styles.find(s => s.id === this.selectedStyleId)
    },
    generatedPrompt() {
      if (!this.subjectScene || !this.subjectScene.trim()) {
        return ''
      }
      const artStyle = this.editableArtStyle.trim() || (this.selectedStyle ? this.selectedStyle.artStyle : '')
      const elementDetails = this.editableElementDetails.trim() || (this.selectedStyle ? this.selectedStyle.elementDetails : '')
      let prompt = `${this.subjectScene.trim()}，${artStyle}，${elementDetails}`
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
    }
  },
  methods: {
    async generateIllustration() {
      if (!this.generatedPrompt) {
        ElMessage.warning('请先输入主体场景')
        return
      }

      this.generatedImageUrl = null
      this.generating = true

      try {
        const requestData = {
          prompt: this.generatedPrompt,
          size: '1280x960'
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
        const isSuccess = (responseData.code === 0 || responseData.code === '0') 
          || responseData.desc === 'success' 
          || responseData.statuscode === 'success'

        if (isSuccess && responseData.message) {
          const result = responseData.message
          let imageUrl = null
          if (result.image_url) {
            imageUrl = result.image_url
          } else if (result.character_image_url) {
            imageUrl = result.character_image_url
          } else if (result.image) {
            imageUrl = result.image
          } else if (result.url) {
            imageUrl = result.url
          }

          if (imageUrl) {
            this.generatedImageUrl = imageUrl
            ElMessage.success('插画生成成功！')
          } else {
            throw new Error('响应中未找到图片URL')
          }
        } else {
          const errorMsg = responseData.message || responseData.desc || responseData.error || '生成失败，请重试'
          throw new Error(errorMsg)
        }
      } catch (error) {
        console.error('生成插画失败:', error)
        let errorMessage = '生成失败，请重试'
        if (error.response) {
          const status = error.response.status
          const data = error.response.data
          if (status === 401) {
            errorMessage = '未授权，请先登录'
          } else if (status === 403) {
            errorMessage = '无权限访问'
          } else if (status === 404) {
            errorMessage = 'API接口不存在，请检查后端配置'
          } else if (status === 400) {
            errorMessage = data?.message || data?.error || '请求参数错误'
          } else if (status === 500) {
            errorMessage = '服务器错误，请稍后重试'
          } else {
            errorMessage = data?.message || data?.error || `请求失败 (${status})`
          }
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = '请求超时，请稍后重试'
        } else if (error.message) {
          errorMessage = error.message
        }
        ElMessage.error(errorMessage)
      } finally {
        this.generating = false
      }
    },
    clearGeneratedImage() {
      this.generatedImageUrl = null
    },
    collectIllustration() {
      ElMessage.success('已收集插画')
    },
    downloadIllustration() {
      if (!this.generatedImageUrl) return
      const link = document.createElement('a')
      link.href = this.generatedImageUrl
      link.download = 'illustration.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
</script>

<style scoped>
.newyear-container {
  min-height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  background: #f5f7fa;
}

.style-detail-container {
  max-width: 600px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.style-list-container-scroll {
  max-height: calc(100vh - 80px);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  padding: 16px 16px 8px;
  color: #303133;
}

.style-detail {
  padding: 0 16px 16px;
}

.image-display-area {
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  padding: 12px;
  margin-bottom: 16px;
  background: #fafafa;
}

.generating-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: #606266;
}

.generated-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-image {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.empty-image-box {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.style-info {
  margin-bottom: 16px;
}

.info-item {
  margin-bottom: 12px;
}

.info-label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.info-input :deep(.el-textarea__inner) {
  font-size: 13px;
}

.input-section {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.subject-input :deep(.el-textarea__inner) {
  font-size: 13px;
}

.generate-button {
  width: 100%;
  margin-top: 4px;
}

@media (max-width: 480px) {
  .newyear-container {
    padding: 8px;
  }

  .style-detail-container {
    border-radius: 8px;
  }
}
</style>


