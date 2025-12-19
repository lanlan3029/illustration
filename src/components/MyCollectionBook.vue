<template>
  <div>
    <!-- 加载中 -->
    <div v-if="loading" class="empty-state">
      <p>正在加载...</p>
    </div>
    <!-- 空状态 -->
    <div v-else-if="!collectBookDetails || collectBookDetails.length === 0" class="empty-state">
      <p>还没有收藏的绘本</p>
    </div>
    <!-- 有数据时显示卡片网格 -->
    <transition-group 
      v-else
      name="card-list" 
      tag="div" 
      class="card-grid">
      <el-card
        v-for="item in collectBookDetails"
        :key="item._id"
        :class="['content-card', { 'card-deleting': deletingBookId === item._id }]"
        shadow="hover"
      >
        <div class="card-image" @click="goBookDetails(item._id)">
          <el-image
            :src="getBookCoverUrl(item)"
            fit="cover"
            class="cover-image"
          >
            <template #error>
              <div class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </template>
          </el-image>
        </div>
        <div class="card-content">
          <h3 class="card-title">{{item.title || '未命名绘本'}}</h3>
          <p class="card-description">{{item.description || '暂无描述'}}</p>
          <div class="card-actions">
            <el-button size="small" @click="cancelCollectBook(item._id)">取消收藏</el-button>
          </div>
        </div>
      </el-card>
    </transition-group>
  </div>
</template>
  
  <script>
  import {mapState} from "vuex"
  import { ElMessage } from 'element-plus'

  export default {
      data(){
          return{
            id:localStorage.getItem("id"),
            toolArr:[],
            deletingBookId: null,
            collectIdMap: {}, // 保存绘本ID到收藏记录ID的映射
            loading: true, // 加载状态
          }
      },
      computed:mapState(["collectBookArr","collectBookDetails"]),

  async mounted(){
    await this.getCollectBook();
  },
  methods: {
    async getCollectBook() {
      this.loading = true;
      try {
        // 使用新接口获取所有收藏记录
        const res = await this.$http.get(`/user/list/collect?id=${this.id}&category=book`, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        });
        if (res.data.desc === "success" || res.data.code === 0) {
          const collectRecords = res.data.message || [];
          // 建立绘本ID到收藏记录ID的映射
          this.collectIdMap = {};
          collectRecords.forEach(record => {
            if (record.collectid) {
              this.collectIdMap[record.collectid] = record._id;
            }
          });
          
          // 提取所有收藏的绘本ID
          const bookIds = collectRecords.map(record => record.collectid).filter(id => id);
          
          if (bookIds.length === 0) {
            this.toolArr = [];
            this.setBooks();
            this.loading = false;
            return;
          }
          
          // 根据绘本ID获取实际的绘本数据
          const bookPromises = bookIds.map(bookId => 
            this.$http.get(`/book/${bookId}`).catch(err => {
              console.error(`获取绘本失败 (ID: ${bookId}):`, err);
              return null;
            })
          );
          
          const bookResponses = await Promise.all(bookPromises);
          // 过滤掉失败的请求，提取绘本数据
          this.toolArr = bookResponses
            .filter(res => res && res.data && res.data.message)
            .map(res => res.data.message);
          
          // 加载图片URL
          await this.getImgUrl();
          // 保存到store
          this.setBooks();
        }
      } catch(err) {
        console.error('获取收藏绘本失败:', err);
        this.toolArr = [];
        this.setBooks();
      } finally {
        this.loading = false;
      }
    },

    // 获取绘本图片URL
    async getImgUrl() {
      for (let i = 0; i < this.toolArr.length; i++) {
        // 获取绘本图片ID
        let tool = this.toolArr[i].content;
        if (!tool || !Array.isArray(tool)) {
          continue;
        }
        // 遍历绘本图片ID，替换成图片URL
        for (let j = 0; j < tool.length; j++) {
          if (typeof tool[j] === 'string') {
            // 如果已经是完整URL，跳过
            if (tool[j].startsWith('http://') || tool[j].startsWith('https://')) {
              continue;
            }
            // 如果是图片ID（字符串），需要获取URL
            try {
              const res = await this.$http.get(`/ill/` + tool[j]);
              if (res.data && res.data.message && res.data.message.content) {
                this.toolArr[i].content[j] = res.data.message.content;
              }
            } catch(err) {
              console.error(`加载图片失败 (ID: ${tool[j]}):`, err);
            }
          }
        }
      }
    },

    setBooks() {
      this.$store.commit("getCollectBook", this.toolArr);
    },
cancelCollectBook(bookId){
  // 通过绘本ID找到对应的收藏记录ID
  const collectRecordId = this.collectIdMap[bookId];
  if (!collectRecordId) {
    ElMessage.error('找不到收藏记录');
    return;
  }
  
  this.deletingBookId = bookId;
  this.$http
        .delete(`/user/list/collect?id=`+collectRecordId,
        {
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        },
    )
        .then((response) => {
          if (response.data.desc === "success") {
             // 延迟一下让删除动画完成
             setTimeout(() => {
               // 从本地数据中移除该项
               this.toolArr = this.toolArr.filter(item => item._id !== bookId);
               // 从映射中移除
               delete this.collectIdMap[bookId];
               // 更新store
               this.setBooks();
               this.deletingBookId = null;
             }, 400);
             ElMessage.success('已取消收藏');
          } else {
            this.deletingBookId = null;
          }
        })
        .catch((error) => {
          console.error('取消收藏失败:', error);
          this.deletingBookId = null;
          ElMessage.error('取消收藏失败，请重试');
        });
},
   goBookDetails(id){
    this.$router.push({name:'collect-bookdetails',params:{bookId:id}});
   },

   // 获取绘本封面URL
   getBookCoverUrl(item) {
     if (!item || !item.content || !Array.isArray(item.content) || item.content.length === 0) {
       return '';
     }
     const cover = item.content[0];
     if (!cover) {
       return '';
     }
     // 如果已经是完整URL，直接返回
     if (cover.startsWith('http://') || cover.startsWith('https://')) {
       return cover;
     }
     // 否则添加静态资源前缀
     return `https://static.kidstory.cc/${cover}`;
   }

      }
  }
  </script>
  
<style scoped>
/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #909399;
  font-size: 16px;
}

/* 卡片网格布局 - 一行三个 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  position: relative;
}

/* 单个卡片样式 */
.content-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.3s, scale 0.3s;
}

.content-card:hover {
  transform: translateY(-4px);
}

/* 删除动画 */
.card-deleting {
  animation: cardDelete 0.4s ease-out forwards;
  pointer-events: none;
}

@keyframes cardDelete {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* transition-group 动画 */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.3s ease;
}

.card-list-enter {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

.card-list-leave-active {
  position: absolute;
  width: calc(33.333% - 16px);
  transition: all 0.3s ease;
}

.card-list-leave-to {
  opacity: 0;
  transform: scale(0);
}

.card-list-move {
  transition: transform 0.3s ease;
}

/* 卡片图片区域 */
.card-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
  background-color: #f5f6fa;
  cursor: pointer;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

/* 卡片内容区域 */
.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  flex: 1;
}

.card-actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 响应式设计 - 小屏幕时改为两列 */
@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 响应式设计 - 移动端改为单列 */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}

</style>