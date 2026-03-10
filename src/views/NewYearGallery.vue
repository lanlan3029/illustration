<template>
  <div class="scrollmap-container">
    <!-- SVG 噪点滤镜 -->
    <svg class="noise-filter" xmlns="http://www.w3.org/2000/svg">
      <filter id="noise">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.9" 
          numOctaves="4" 
          stitchTiles="stitch"
          result="noise"/>
        <feColorMatrix 
          in="noise" 
          type="saturate" 
          values="0"
          result="noise"/>
        <feComponentTransfer in="noise" result="noise">
          <feFuncA type="discrete" tableValues="0 0.5 0 0.5 0 0.5 0 0.5 0 0.5 0 0.5 0 0.5 0 0.5"/>
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
      </filter>
    </svg>
    
    <!-- 背景装饰 -->
    <div class="decoration-lantern decoration-lantern-left">🏮</div>
    <div class="decoration-lantern decoration-lantern-right">🏮</div>
    <div class="decoration-fu decoration-fu-top-left">福</div>
    <div class="decoration-fu decoration-fu-top-right">福</div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <i class="el-icon-loading"></i>
      <p>正在加载画卷...</p>
    </div>

    <!-- 图片容器：垂直滚动 -->
    <div
      v-else
      class="gallery-viewport"
      ref="viewportRef"
      @scroll="handleScroll">
      <div class="gallery-list">
        <div
          v-for="(item, index) in visibleItems"
          :key="item._id || index"
          class="gallery-item"
          @click="openPreview(item, index)">
          <el-image
            :src="getImageUrl(item)"
            fit="cover"
            class="gallery-image">
            <template #error>
              <div class="image-error">
                <i class="el-icon-picture-outline"></i>
              </div>
            </template>
            <template #placeholder>
              <div class="image-placeholder">
                <i class="el-icon-loading"></i>
              </div>
            </template>
          </el-image>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="currentItem?.title || '新年插画'"
      width="90%"
      :before-close="closePreview"
      class="preview-dialog">
      <div class="preview-content">
        <el-image
          v-if="currentItem"
          :src="getImageUrl(currentItem)"
          fit="contain"
          class="preview-image">
        </el-image>
        <div class="preview-info" v-if="currentItem">
          <p><strong>标题：</strong>{{ currentItem.title || '新年插画' }}</p>
          <p v-if="currentItem.description"><strong>描述：</strong>{{ currentItem.description }}</p>
          <p v-if="currentItem.owner"><strong>作者：</strong>{{ currentItem.owner.name || '网友' }}</p>
          <p v-if="currentItem.createdAt"><strong>时间：</strong>{{ formatDate(currentItem.createdAt) }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'NewYearGallery',
  data() {
    return {
      // 数据相关
      allIllustrations: [], // 所有插画数据
      totalCount: 0,
      loading: true,
      page: 1,
      pageSize: 50, // 每次加载更多数据
      hasMore: true,
      
      // 当前索引
      currentIndex: 0,
      
      // 预览相关
      previewVisible: false,
      currentItem: null
    }
  },
  
  computed: {
    // 计算可见的图片项（简化：显示所有已加载的图片）
    visibleItems() {
      return this.allIllustrations
    }
  },
  
  mounted() {
    this.$store.commit('closeMask')
    this.loadIllustrations()
  },
  
  methods: {
    // 加载插画数据
    async loadIllustrations() {
      this.loading = true
      
      try {
        const response = await this.$http.get('/ill/', {
          params: {
            sort_param: 'createdAt',
            sort_num: 'desc',
            page: this.page,
            limit: this.pageSize,
            type: '春节' // 只请求类别为"春节"的插画
          }
        })

        if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
          const message = response.data.message || {}
          const newItems = message.data || message || response.data.data || []
          
          if (!Array.isArray(newItems)) {
            return
          }
          
          if (this.page === 1) {
            this.allIllustrations = newItems
          } else {
            this.allIllustrations = [...this.allIllustrations, ...newItems]
          }

          this.totalCount = message.total || response.data.total || this.allIllustrations.length
          this.hasMore = newItems.length === this.pageSize
          
          // 如果还有更多数据，继续加载
          if (this.hasMore && this.allIllustrations.length < 100) {
            this.page++
            await this.loadIllustrations()
          }
        }
      } catch (error) {
        ElMessage.error('出错啦，请稍后再试')
      } finally {
        this.loading = false
      }
    },
    
    // 处理滚动事件（垂直滚动加载更多）
    handleScroll() {
      if (!this.$refs.viewportRef) return
      
      const scrollTop = this.$refs.viewportRef.scrollTop
      const scrollHeight = this.$refs.viewportRef.scrollHeight
      const clientHeight = this.$refs.viewportRef.clientHeight
      
      // 检查是否需要加载更多
      if (scrollTop + clientHeight >= scrollHeight - 100 && this.hasMore && !this.loading) {
        this.page++
        this.loadIllustrations()
      }
    },
    
    // 获取图片URL
    getImageUrl(item) {
      if (!item) return ''
      
      // 尝试多种可能的字段名（优先使用 content）
      let picture = item.content || item.picture || item.image_url || item.url || item.image
      
      if (!picture) return ''
      
      if (typeof picture === 'string') {
        // 如果是完整URL，直接返回
        if (picture.startsWith('http://') || picture.startsWith('https://') || picture.startsWith('data:')) {
          return picture
        }
        // 如果是相对路径，添加域名前缀
        return `https://static.kidstory.cc/${picture}`
      }
      
      // 如果是对象，尝试获取其中的URL
      if (typeof picture === 'object' && picture.url) {
        return picture.url
      }
      
      return ''
    },
    
    // 打开预览
    openPreview(item, index) {
      this.currentItem = item
      this.currentIndex = index
      this.previewVisible = true
    },
    
    // 关闭预览
    closePreview() {
      this.previewVisible = false
      this.currentItem = null
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.scrollmap-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  /* 春节相关的柔和红色背景 */
  background-color: #ff4d4f;
  /* 放大一点的格纹 SVG 图案 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 4 4'%3E%3Cpath fill='%23ff6b9d' fill-opacity='0.5' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
}

/* SVG 噪点滤镜 */
.noise-filter {
  position: absolute;
  width: 0;
  height: 0;
  visibility: hidden;
}

/* 添加噪点纹理效果 */
.scrollmap-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* 使用 SVG 噪点纹理（放大一点，略微增强） */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E");
  background-size: 120px 120px;
  opacity: 0.22;
  pointer-events: none;
  z-index: 1;
  mix-blend-mode: overlay;
}

/* 添加额外的噪点层增强效果和光效装饰 */
.scrollmap-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  /* 光效装饰 - 更柔和的光晕 */
  background: 
    radial-gradient(circle at 30% 20%, rgba(255, 215, 0, 0.12) 0%, transparent 30%),
    radial-gradient(circle at 70% 80%, rgba(255, 182, 193, 0.15) 0%, transparent 30%),
    radial-gradient(circle at 50% 50%, rgba(255, 105, 180, 0.1) 0%, transparent 40%);
  /* 额外的噪点纹理层（放大噪点） */
  background-image: 
    repeating-radial-gradient(
      circle at 0 0,
      transparent 0,
      rgba(0, 0, 0, 0.03) 2px,
      transparent 4px,
      rgba(0, 0, 0, 0.02) 6px,
      transparent 8px
    ),
    repeating-radial-gradient(
      circle at 100px 100px,
      transparent 0,
      rgba(0, 0, 0, 0.025) 2px,
      transparent 4px,
      rgba(0, 0, 0, 0.03) 6px,
      transparent 8px
    );
  background-size: 
    100% 100%,
    100% 100%,
    100% 100%,
    90px 90px,
    120px 120px;
  background-position: 
    0 0,
    0 0,
    0 0,
    0 0,
    50px 50px;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: normal;
}

/* 背景装饰 */
.decoration-lantern {
  position: fixed;
  font-size: 60px;
  opacity: 0.2;
  z-index: 0;
  animation: float 3s ease-in-out infinite;
  pointer-events: none;
}

.decoration-lantern-left {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.decoration-lantern-right {
  top: 15%;
  right: 5%;
  animation-delay: 1.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.decoration-fu {
  position: fixed;
  font-size: 80px;
  font-weight: bold;
  color: rgba(255, 215, 0, 0.2);
  font-family: 'KaiTi', '楷体', serif;
  z-index: 2;
  pointer-events: none;
  transform: rotate(-15deg);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.decoration-fu-top-left {
  top: 5%;
  left: 8%;
}

.decoration-fu-top-right {
  top: 8%;
  right: 8%;
  transform: rotate(15deg);
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #fff;
  font-size: 18px;
}

.loading-container i {
  font-size: 48px;
  margin-bottom: 20px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 图片容器：垂直滚动 */
.gallery-viewport {
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* 图片列表：响应式多列，垂直排布 */
.gallery-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding: 16px;
  max-width: 98vh;
  margin: 0 auto;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.06);
}

.gallery-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.image-error,
.image-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.35);
  font-size: 32px;
}

.image-placeholder i {
  animation: rotate 1s linear infinite;
}


/* 预览对话框 */
.preview-dialog :deep(.el-dialog) {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe4e1 100%);
  border: 3px solid rgba(220, 20, 60, 0.3);
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-image {
  --size: min(60vh, 80vw);
  width: var(--size);
  height: var(--size);
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-info {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
}

.preview-info p {
  margin: 10px 0;
  color: #333;
  line-height: 1.6;
}

.preview-info strong {
  color: #dc143c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .scrollmap-item {
    padding: 15px;
  }

  .scrollmap-image-wrapper {
    max-width: 95vw;
  }

  .scrollmap-index-badge {
    width: 35px;
    height: 35px;
    font-size: 12px;
    top: 20px;
    right: 20px;
  }
}

@media (max-width: 480px) {
  .decoration-lantern {
    font-size: 40px;
  }

  .decoration-fu {
    font-size: 50px;
  }
}
</style>
