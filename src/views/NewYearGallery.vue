<template>
  <div class="scrollmap-container">
    <!-- 背景装饰 -->
    <div class="decoration-lantern decoration-lantern-left">🏮</div>
    <div class="decoration-lantern decoration-lantern-right">🏮</div>
    <div class="decoration-fu decoration-fu-top-left">福</div>
    <div class="decoration-fu decoration-fu-top-right">福</div>
    
    <!-- 标题区域 -->
    <div class="scrollmap-header">
      <h1 class="scrollmap-title">
        <span class="title-icon">🎊</span>
        2026幻彩新春
        <span class="title-icon">🎊</span>
      </h1>
      <p class="scrollmap-subtitle">汇聚所有网友的创意，共同绘制新年画卷</p>
      <div class="scrollmap-stats">
        <span class="stat-item">共 {{ totalCount }} 幅作品</span>
        <span class="stat-divider">|</span>
        <span class="stat-item">已浏览 {{ currentIndex + 1 }} / {{ totalCount }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <i class="el-icon-loading"></i>
      <p>正在加载画卷...</p>
    </div>

    <!-- 图片容器 -->
    <div 
      v-else
      class="gallery-viewport"
      ref="viewportRef"
      @scroll="handleScroll">
      
      <!-- 图片网格 -->
      <div class="gallery-grid">
        <!-- 图片项 -->
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
      
      // 布局相关
      viewportRef: null,
      viewportWidth: 0,
      viewportHeight: 0,
      rowsPerView: 4, // 固定4行
      colsPerRow: 0, // 每行图片数（根据屏幕宽度计算）
      itemSize: 0, // 图片尺寸（宽高相同，1:1）
      
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
    // 关闭登录弹窗（此页面不需要登录）
    this.$store.commit('closeMask')
    
    this.initViewport()
    this.loadIllustrations()
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  
  methods: {
    // 初始化视口
    initViewport() {
      this.$nextTick(() => {
        if (this.$refs.viewportRef) {
          this.viewportWidth = this.$refs.viewportRef.clientWidth || window.innerWidth
          this.viewportHeight = this.$refs.viewportRef.clientHeight || window.innerHeight
          
          // 每张图片的高度 = 视口高度的1/4（减去标题高度后）
          const availableHeight = this.viewportHeight - 120 // 减去标题高度
          this.itemSize = availableHeight / this.rowsPerView // 固定4行，每行高度为可用高度的1/4
          
          // 根据图片尺寸计算每行能放多少张（无间距）
          this.colsPerRow = Math.floor(this.viewportWidth / this.itemSize)
          this.colsPerRow = Math.max(1, this.colsPerRow) // 至少1列
          
          // 设置CSS变量
          const grid = this.$refs.viewportRef?.querySelector('.gallery-grid')
          if (grid) {
            grid.style.setProperty('--cols-per-row', this.colsPerRow)
            grid.style.setProperty('--item-size', `${this.itemSize}px`)
          }
        }
      })
    },
    
    // 处理窗口大小变化
    handleResize() {
      this.initViewport()
    },
    
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
  background: linear-gradient(135deg, #dc143c 0%, #c41e3a 50%, #b22222 100%);
  position: relative;
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
  color: rgba(255, 215, 0, 0.15);
  font-family: 'KaiTi', '楷体', serif;
  z-index: 0;
  pointer-events: none;
  transform: rotate(-15deg);
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

/* 标题区域 */
.scrollmap-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 100;
  text-align: center;
}

.scrollmap-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-family: 'LiSu', 'STLiti', '隶书', 'KaiTi', serif;
}

.title-icon {
  font-size: 28px;
  margin: 0 8px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.scrollmap-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 8px;
}

.scrollmap-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.stat-divider {
  opacity: 0.5;
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

/* 图片容器 */
.gallery-viewport {
  width: 100vw;
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding-top: 120px; /* 为标题留出空间 */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* 图片网格 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols-per-row), 1fr);
  grid-auto-rows: var(--item-size);
  gap: 0;
  width: 100%;
}

/* 图片项 */
.gallery-item {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}

.gallery-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.image-error,
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.6);
  font-size: 48px;
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
  max-width: 100%;
  max-height: 60vh;
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
  .scrollmap-title {
    font-size: 20px;
  }

  .title-icon {
    font-size: 24px;
  }

  .scrollmap-header {
    padding: 12px 16px;
  }

  .scrollmap-viewport {
    padding-top: 110px;
  }

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
  .scrollmap-title {
    font-size: 18px;
  }

  .scrollmap-subtitle {
    font-size: 12px;
  }

  .scrollmap-stats {
    font-size: 11px;
    gap: 8px;
  }

  .decoration-lantern {
    font-size: 40px;
  }

  .decoration-fu {
    font-size: 50px;
  }
}
</style>
