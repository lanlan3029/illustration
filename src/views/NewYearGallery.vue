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
        2026幻彩新春 · 长卷
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

    <!-- 长卷容器 -->
    <div 
      v-else
      class="scrollmap-viewport"
      ref="viewportRef"
      @scroll="handleScroll"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd">
      
      <!-- 虚拟轨道 -->
      <div 
        class="scrollmap-track"
        :style="{ width: trackWidth + 'px' }">
        
        <!-- 动态渲染的图片 -->
        <div
          v-for="item in visibleItems"
          :key="item._id || item.index"
          class="scrollmap-item"
          :style="getItemStyle(item.index)"
          @click="openPreview(item.data, item.index)">
          
          <!-- 图片容器 -->
          <div class="scrollmap-image-wrapper">
            <el-image
              :src="getImageUrl(item.data.picture)"
              fit="cover"
              class="scrollmap-image"
              :loading="item.loading"
              @load="onImageLoad(item.index)"
              @error="onImageError(item.index)">
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
            
            <!-- 图片信息遮罩 -->
            <div class="scrollmap-overlay">
              <div class="overlay-content">
                <p class="overlay-title">{{ item.data.title || '新年插画' }}</p>
                <p class="overlay-author" v-if="item.data.owner">
                  by {{ item.data.owner.name || '网友' }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- 序号标签 -->
          <div class="scrollmap-index-badge">
            {{ item.index + 1 }}
          </div>
        </div>
      </div>
    </div>

    <!-- 滚动提示 -->
    <div v-if="!loading && showScrollHint" class="scroll-hint">
      <div class="hint-content">
        <i class="el-icon-d-arrow-right"></i>
        <span>左右滑动浏览长卷</span>
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
          :src="getImageUrl(currentItem.picture)"
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
      
      // 虚拟滚动相关
      viewportRef: null,
      viewportWidth: 0, // 视口宽度（手机屏宽）
      viewportHeight: 0, // 视口高度
      rowsPerView: 4, // 每屏显示的行数
      colsPerRow: 2, // 每行显示的列数（图片数）
      itemWidth: 0, // 每张图片的宽度
      itemHeight: 0, // 每张图片的高度
      trackWidth: 0, // 虚拟轨道总宽度
      scrollLeft: 0, // 当前滚动位置
      
      // 可见区域计算
      visibleStartIndex: 0, // 可见区域起始索引
      visibleEndIndex: 0, // 可见区域结束索引
      bufferSize: 1, // 左右各缓冲1列
      
      // 当前索引
      currentIndex: 0,
      
      // 预览相关
      previewVisible: false,
      currentItem: null,
      
      // 触摸相关
      touchStartX: 0,
      touchStartTime: 0,
      
      // UI 提示
      showScrollHint: true
    }
  },
  
  computed: {
    // 计算可见的图片项
    visibleItems() {
      const items = []
      // 计算缓冲范围（左右各缓冲1列）
      const bufferCols = this.bufferSize
      const startCol = Math.max(0, Math.floor(this.visibleStartIndex / this.colsPerRow) - bufferCols)
      const endCol = Math.ceil(this.visibleEndIndex / this.colsPerRow) + bufferCols
      
      // 计算需要渲染的图片范围（考虑所有行）
      const start = Math.max(0, startCol * this.colsPerRow)
      const end = Math.min(
        this.allIllustrations.length,
        (endCol + 1) * this.colsPerRow + (this.rowsPerView - 1) * this.colsPerRow
      )
      
      for (let i = start; i < end; i++) {
        if (this.allIllustrations[i]) {
          items.push({
            index: i,
            data: this.allIllustrations[i],
            loading: false
          })
        }
      }
      
      return items
    }
  },
  
  mounted() {
    this.initViewport()
    this.loadIllustrations()
    
    // 隐藏滚动提示
    setTimeout(() => {
      this.showScrollHint = false
    }, 3000)
    
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
          
          // 计算每行显示的列数（根据屏幕宽度自适应）
          if (this.viewportWidth < 480) {
            this.colsPerRow = 2 // 小屏幕每行2张
          } else if (this.viewportWidth < 768) {
            this.colsPerRow = 3 // 中等屏幕每行3张
          } else {
            this.colsPerRow = 4 // 大屏幕每行4张
          }
          
          // 每张图片的宽度 = 视口宽度 / 每行列数（留出间距）
          this.itemWidth = (this.viewportWidth - 40) / this.colsPerRow // 减去左右padding
          
          // 每张图片的高度 = (视口高度 - 标题高度) / 行数（留出间距）
          const availableHeight = this.viewportHeight - 120 // 减去标题高度
          this.itemHeight = (availableHeight - 40) / this.rowsPerView // 减去上下padding
          
          this.updateTrackWidth()
        }
      })
    },
    
    // 更新轨道总宽度和高度
    updateTrackWidth() {
      // 总列数 = 总图片数 / 每行列数（向上取整）
      const totalCols = Math.ceil(this.totalCount / this.colsPerRow)
      // 轨道宽度 = 总列数 × 每张图片宽度
      this.trackWidth = totalCols * this.itemWidth + 40 // 加上左右padding
      
      // 计算轨道高度（总行数 × 每行高度）
      const totalRows = Math.ceil(this.totalCount / this.colsPerRow)
      const trackHeight = totalRows * this.itemHeight + 40
      // 更新轨道高度
      if (this.$refs.viewportRef) {
        const track = this.$refs.viewportRef.querySelector('.scrollmap-track')
        if (track) {
          track.style.height = `${Math.max(trackHeight, this.viewportHeight - 120)}px`
        }
      }
    },
    
    // 处理窗口大小变化
    handleResize() {
      this.initViewport()
      this.handleScroll()
    },
    
    // 加载插画数据
    async loadIllustrations() {
      this.loading = true
      
      try {
        const token = localStorage.getItem('token') || ''
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        
        const response = await this.$http.get('/ill/', {
          params: {
            sort_param: 'createdAt',
            sort_num: 'desc',
            page: this.page,
            limit: this.pageSize
          },
          headers
        })

        if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
          const newItems = response.data.message || response.data.data || []
          
          if (this.page === 1) {
            this.allIllustrations = newItems
          } else {
            this.allIllustrations = [...this.allIllustrations, ...newItems]
          }

          this.totalCount = response.data.total || this.allIllustrations.length
          this.hasMore = newItems.length === this.pageSize
          
          // 更新轨道宽度
          this.updateTrackWidth()
          
          // 初始化可见区域
          this.updateVisibleRange()
          
          // 如果还有更多数据，继续加载
          if (this.hasMore && this.allIllustrations.length < 100) {
            this.page++
            await this.loadIllustrations()
          }
        } else {
          ElMessage.warning('获取插画列表失败')
        }
      } catch (error) {
        console.error('加载插画失败:', error)
        ElMessage.error('加载插画失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    
    // 处理滚动事件
    handleScroll() {
      if (!this.$refs.viewportRef) return
      
      this.scrollLeft = this.$refs.viewportRef.scrollLeft
      this.updateVisibleRange()
      this.updateCurrentIndex()
      
      // 检查是否需要加载更多
      this.checkLoadMore()
    },
    
    // 更新可见区域
    updateVisibleRange() {
      if (this.itemWidth === 0) return
      
      // 计算可见的列范围
      const startCol = Math.floor(this.scrollLeft / this.itemWidth)
      const endCol = Math.ceil((this.scrollLeft + this.viewportWidth) / this.itemWidth)
      
      // 计算可见的图片索引范围（考虑4行）
      // 起始索引 = 起始列 × 每行列数
      // 结束索引 = (结束列 + 1) × 每行列数 + (行数 - 1) × 每行列数
      this.visibleStartIndex = Math.max(0, startCol * this.colsPerRow)
      this.visibleEndIndex = Math.min(
        this.totalCount - 1,
        (endCol + 1) * this.colsPerRow + (this.rowsPerView - 1) * this.colsPerRow
      )
    },
    
    // 更新当前索引
    updateCurrentIndex() {
      if (this.itemWidth === 0) return
      const currentCol = Math.round(this.scrollLeft / this.itemWidth)
      // 当前索引可以设置为当前列的第一张图片
      this.currentIndex = currentCol * this.colsPerRow
    },
    
    // 检查是否需要加载更多
    checkLoadMore() {
      // 如果滚动到接近末尾，加载更多
      const scrollRatio = this.scrollLeft / (this.trackWidth - this.viewportWidth)
      if (scrollRatio > 0.8 && this.hasMore && !this.loading) {
        this.page++
        this.loadIllustrations()
      }
    },
    
    // 获取图片项样式
    getItemStyle(index) {
      // 计算图片所在的行和列
      const row = Math.floor(index / this.colsPerRow)
      const col = index % this.colsPerRow
      
      return {
        left: `${col * this.itemWidth + 20}px`, // 加上左边距
        top: `${row * this.itemHeight + 20}px`, // 加上上边距
        width: `${this.itemWidth - 10}px`, // 减去间距
        height: `${this.itemHeight - 10}px` // 减去间距
      }
    },
    
    // 触摸开始
    handleTouchStart(e) {
      this.touchStartX = e.touches[0].clientX
      this.touchStartTime = Date.now()
    },
    
    // 触摸移动
    handleTouchMove(e) {
      // 可以在这里添加触摸反馈
    },
    
    // 触摸结束
    handleTouchEnd(e) {
      // 可以在这里添加滑动结束的处理
    },
    
    // 图片加载完成
    onImageLoad(index) {
      // 可以在这里添加加载完成的处理
    },
    
    // 图片加载错误
    onImageError(index) {
      console.error(`图片 ${index} 加载失败`)
    },
    
    // 获取图片URL
    getImageUrl(picture) {
      if (!picture) return ''
      if (picture.startsWith('http://') || picture.startsWith('https://') || picture.startsWith('data:')) {
        return picture
      }
      return `https://static.kidstory.cc/${picture}`
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

/* 长卷视口 */
.scrollmap-viewport {
  width: 100vw;
  height: 100vh;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  padding-top: 120px; /* 为标题留出空间 */
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
  scroll-behavior: smooth;
}

/* 隐藏滚动条但保持滚动功能 */
.scrollmap-viewport::-webkit-scrollbar {
  display: none;
}

.scrollmap-viewport {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 虚拟轨道 */
.scrollmap-track {
  min-height: calc(100vh - 120px);
  position: relative;
  display: block;
}

/* 图片项 */
.scrollmap-item {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.scrollmap-image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 215, 0, 0.6);
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.scrollmap-image-wrapper:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 215, 0, 1);
}

.scrollmap-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
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

/* 图片信息遮罩 */
.scrollmap-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 20px;
  opacity: 0;
  transition: opacity 0.3s;
}

.scrollmap-image-wrapper:hover .scrollmap-overlay {
  opacity: 1;
}

.overlay-content {
  color: #fff;
}

.overlay-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.overlay-author {
  font-size: 12px;
  margin: 0;
  opacity: 0.9;
}

/* 序号标签 */
.scrollmap-index-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(220, 20, 60, 0.9);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.8);
  z-index: 10;
}

/* 滚动提示 */
.scroll-hint {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  animation: fadeOut 3s ease-out forwards;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    pointer-events: none;
  }
}

.hint-content {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 12px 24px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 215, 0, 0.5);
}

.hint-content i {
  font-size: 18px;
  animation: slideRight 1.5s ease-in-out infinite;
}

@keyframes slideRight {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
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
