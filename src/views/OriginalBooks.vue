<template>
  <div>
    <div class="content">
      <div class="content-left">
        <div class="el-select">
          <el-radio-group v-model="sortType" size="small" @change="handleSortChange">
            <el-radio-button
              v-for="item in sortList"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
          <el-radio-group v-model="button2"  size="small" @change="handleCategoryChange">
            <el-radio-button 
              v-for="option in categoryOptions" 
              :key="option.value"
              :label="option.value">
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="box">
          <div v-if="loading" class="loading">
            <book-loading :text="$t('books.loading')" />
          </div>
          <div v-show="(!loading)" class="items" v-infinite-scroll="loadMore" infinite-scroll-disabled="scrollDisabled" :disabled="loadControl">
            <div class="item" v-for="(item, index) in books" :key="item._id || index">
              <el-card class="card" shadow="hover">
                <el-image
                  :src="(`https://static.kidstory.cc/`+item.cover)"
                  class="image"
                  fit="contain"
                  :lazy="true"
                  loading="lazy"
                  :preview-src-list="[]"
                  @click="toDetail(item._id)"
                >
                  <template #placeholder>
                    <div class="img-placeholder">
                      <i class="el-icon-loading"></i>
                    </div>
                  </template>
                  <template #error>
                    <div class="img-error">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </template>
                </el-image>
                <div class="data">
                  <span class="name">{{item.title}}</span>
                  <div class="icon">
                    <span 
                      v-if="collectBookArr.includes(item._id)" 
                      class="iconfont icon-shoucang1 collect-icon"
                      :class="{ 'collect-animate': collectingIds.includes(item._id) }"
                      @click="handleCollectClick(item._id)"
                      style="color:#FFd301; cursor: pointer;">
                    </span>
                    <span 
                      v-else 
                      class="iconfont icon-shoucang collect-icon"
                      :class="{ 'collect-animate': collectingIds.includes(item._id) }"
                      @click="handleCollectClick(item._id)" 
                      style="cursor: pointer;">
                    </span>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BookLoading from '@/components/BookLoading.vue'
import {mapState} from "vuex"
import { ElMessage } from 'element-plus'

export default {
  name: "OriginalBooks",
  components: {
    BookLoading
  },
  computed: {
    ...mapState(["books", "collectBookArr"]),
    sortList() {
      return [
        { value: "default", label: this.$t('books.sortDefault') },
        { value: "hot", label: this.$t('books.sortHot') },
        { value: "time", label: this.$t('books.sortTime') },
      ]
    },
    categoryOptions() {
      return [
        { label: this.$t('books.categoryAll'), value: "" },
        { label: this.$t('upload.categoryReading'), value: "reading" },
        { label: this.$t('upload.categoryHabit'), value: "habit" },
        { label: this.$t('upload.categoryEnglish'), value: "english" },
        { label: this.$t('upload.categoryMath'), value: "math" },
        { label: this.$t('upload.categoryKnowledge'), value: "knowledge" },
        { label: this.$t('upload.categoryOthers'), value: "others" },
      ]
    }
  },
  data() {
    return {
      userid:localStorage.getItem("id"),
      toolArry:[],
      num:1,
      loading:true,
      loadControl:false,
      scrollDisabled:false,
      sortType: "default",
      button2: "",
      collectingIds: [],
      collectIdMap: {},
    };
  },
  methods: {
    //去绘本详情页
    toDetail(id) {
      this.$router.push({name:'bookdetails',params:{bookId:id}});
    },

    // 当前排序参数
    getSortParams() {
      // 默认和“热度”都按热度倒序
      if (this.sortType === 'time') {
        return { sort_param: 'createdAt', sort_num: 'desc' };
      }
      return { sort_param: 'heat', sort_num: 'desc' };
    },

    //获取后台返回的绘本数据（18）
   async getBooks(){
      try{
        const { sort_param, sort_num } = this.getSortParams();
        let url = `/book/?sort_param=${sort_param}&sort_num=${sort_num}&page=1`;
        // 只有当 button2 有值且不为空字符串时，才添加 type 参数
        // "不限"对应的 value 是空字符串，此时不添加 type 参数，显示所有绘本
        if (this.button2 && this.button2.trim() !== '') {
          url += `&type=${this.button2}`;
        }
        
        // 获取 token 并添加到请求头
        const token = localStorage.getItem('token');
        const headers = {};
        if (token && token !== 'undefined') {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        let res=await this.$http.get(url, { headers })
        //对象数组，对象包含绘本的name\id\content\description等
        this.toolArry=res.data.message || []
        
      }catch(err){
        this.loading=false 
        console.log(err)
        ElMessage({
          message: this.$t('books.errorOccurred'),
          type: 'error'
        });
      }

    },

//获取绘本的封面图片（优化：批量请求，使用 Promise.allSettled 避免单个失败影响整体）
   async getImgUrl(){
    // 获取 token 并添加到请求头
    const token = localStorage.getItem('token');
    const headers = {};
    if (token && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const promises = this.toolArry.map((book, idx) => {
      const firstId = Array.isArray(book.content) ? book.content[0] : null;
      if (!firstId) {
        // 如果没有封面ID，设置默认占位符
        this.toolArry[idx].cover = '';
        return Promise.resolve();
      }
      return this.$http.get(`/ill/` + firstId, { headers })
        .then(res => {
          if (res.data && res.data.message && res.data.message.content) {
            this.toolArry[idx].cover = res.data.message.content;
          }
        })
        .catch(err => {
          console.log(`获取封面失败 (idx: ${idx}):`, err);
          // 失败时设置空字符串，显示占位符
          this.toolArry[idx].cover = '';
        });
    });
    // 使用 allSettled 确保所有请求都完成，即使部分失败
    await Promise.allSettled(promises);
   },
    setBooks(){
      this.$store.commit("addBooks",this.toolArry)
      this.loading=false  
    },

    async loadMore(){
      if(!this.loadControl) {
        this.loadControl=true
        try {
          const { sort_param, sort_num } = this.getSortParams();
          const nextPage = this.num + 1;
          let url = `/book/?sort_param=${sort_param}&sort_num=${sort_num}&page=` + nextPage;
          if (this.button2 && this.button2.trim() !== '') {
            url += `&type=${this.button2}`;
          }
          
          // 获取 token 并添加到请求头
          const token = localStorage.getItem('token');
          const headers = {};
          if (token && token !== 'undefined') {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          let res = await this.$http.get(url, { headers })
          const books = res.data?.message || res.data?.data || [];
          if (!Array.isArray(books) || books.length === 0) {
            this.scrollDisabled = true
            this.loadControl = false
          } else {
            // 追加到现有数组，而不是替换（无限滚动）
            const currentLength = this.toolArry.length
            this.toolArry = [...this.toolArry, ...books]
            // 只获取新加载的图片URL，避免重复请求
            await this.getImgUrlForRange(currentLength, books.length);
            await this.setBooks();
            this.num = nextPage;
            this.loadControl=false
          }
        } catch (err) {
          this.loadControl = false
        }
      }
    },
    
    // 获取指定范围的图片URL（优化：只加载新数据）
    async getImgUrlForRange(startIndex, count) {
      // 获取 token 并添加到请求头
      const token = localStorage.getItem('token');
      const headers = {};
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const endIndex = startIndex + count
      const promises = this.toolArry.slice(startIndex, endIndex).map((book, relativeIdx) => {
        const idx = startIndex + relativeIdx
        const firstId = Array.isArray(book.content) ? book.content[0] : null;
        if (!firstId) {
          this.toolArry[idx].cover = '';
          return Promise.resolve();
        }
        return this.$http.get(`/ill/` + firstId, { headers })
          .then(res => {
            if (res.data && res.data.message && res.data.message.content) {
              this.toolArry[idx].cover = res.data.message.content;
            }
          })
          .catch(err => {
            console.log(`获取封面失败 (idx: ${idx}):`, err);
            this.toolArry[idx].cover = '';
          });
      });
      await Promise.allSettled(promises);
    },

    handleCollectClick(id) {
      if (!id) {
        ElMessage.error(this.$t('books.invalidBookId'));
        return;
      }
      
      if (!this.collectingIds.includes(id)) {
        this.collectingIds.push(id);
      }
      
      if (this.collectBookArr.includes(id)) {
        this.cancelCollectBook(id);
      } else {
        this.collectBookFun(id);
      }
      
      setTimeout(() => {
        const index = this.collectingIds.indexOf(id);
        if (index > -1) {
          this.collectingIds.splice(index, 1);
        }
      }, 600);
    },

    collectBookFun(id) {
      if (!id) {
        ElMessage.error(this.$t('books.invalidBookId'));
        return;
      }
      
      const token = localStorage.getItem("token");
      if (!token) {
        ElMessage.warning(this.$t('books.pleaseLogin'));
        return;
      }
      
      this.$http.post(`/user/collect/${id}`, {
        type: "book"
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((response) => {
        if (response.data.desc === "success" || response.data.code === 0) {
          this.$store.commit("collectBook", [id])
          if (response.data.message && response.data.message._id) {
            this.collectIdMap[id] = response.data.message._id;
          } else {
            this.loadCollectIdMap();
          }
          ElMessage.success(this.$t('books.collectSuccess'));
        } else {
          ElMessage.warning(response.data.message || this.$t('books.collectFailed'));
        }
      })
      .catch(() => {
        ElMessage.error(this.$t('books.collectFailedRetry'));
      });
    },

    cancelCollectBook(bookId) {
      const collectRecordId = this.collectIdMap[bookId];
      if (!collectRecordId) {
        this.loadCollectIdMap().then(() => {
          const recordId = this.collectIdMap[bookId];
          if (recordId) {
            this.performCancelCollect(bookId, recordId);
          } else {
            ElMessage.error(this.$t('books.collectRecordNotFound'));
          }
        });
        return;
      }
      
      this.performCancelCollect(bookId, collectRecordId);
    },

    performCancelCollect(bookId, collectRecordId) {
      const token = localStorage.getItem('token');
      this.$http.delete(`/user/list/collect?id=${collectRecordId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((response) => {
        if (response.data.desc === "success" || response.data.code === 0) {
          this.$store.commit("cancelCoBook", bookId);
          delete this.collectIdMap[bookId];
          ElMessage.success(this.$t('books.cancelCollectSuccess'));
        } else {
          ElMessage.warning(response.data.message || this.$t('books.cancelCollectFailed'));
        }
      })
      .catch(() => {
        ElMessage.error(this.$t('books.cancelCollectFailedRetry'));
      });
    },

    async loadCollectIdMap() {
      try {
        const userId = localStorage.getItem("id");
        const token = localStorage.getItem("token");
        if (!userId || !token) {
          return;
        }
        const res = await this.$http.get(`/user/list/collect?id=${userId}&category=book`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.data.desc === "success" || res.data.code === 0) {
          const collectRecords = res.data.message || [];
          this.collectIdMap = {};
          collectRecords.forEach(record => {
            if (record.collectid) {
              this.collectIdMap[record.collectid] = record._id;
            }
          });
        }
      } catch (error) {
        // 静默失败
      }
    },

    async getAllBooks(){
      this.$store.commit("removeBooks")
      this.num = 1;
      this.scrollDisabled = false;
      this.loadControl = false;
      if(this.searchInput==''){
        this.$router.push({
          name: "books"
        });
        await this.getBooks();
        await this.getImgUrl();
        await this.setBooks();
      }
    },

    async handleSortChange() {
      this.num = 1;
      this.scrollDisabled = false;
      this.loadControl = false;
      this.loading = true;
      this.$store.commit("removeBooks");
      await this.getBooks();
      await this.getImgUrl();
      await this.setBooks();
    },

    async handleCategoryChange() {
      this.num = 1;
      this.scrollDisabled = false;
      this.loadControl = false;
      this.loading = true;
      this.$store.commit("removeBooks");
      await this.getBooks();
      await this.getImgUrl();
      await this.setBooks();
    },
  },



  async mounted(){
    await this.getAllBooks();
    await this.loadCollectIdMap();
  },
};
</script>
<style scoped>
.content {
  width:100vw;
  background-color: #f5f6fa;
  margin: auto;
  display: flex;
  justify-content: center;
}
.content-left {
  width: 80vw;
  max-width: 80vw;
  height: 88vh;
  overflow-y: auto;
  margin: 0 auto;
}
.items{
  width:100%;
  height:auto;
  padding: 0 12px;
  margin-top:2vh;
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 四列网格 */
  gap: 24px; /* 行列间距 */
  align-items: start; /* 顶部对齐 */
}
.item {
  box-sizing: border-box;
  width: 100%;
  height: 320px; /* 固定高度：图片区域 240px + 数据区域 40px + padding 24px + 边距 16px */
  border-radius: 8px;
  user-select: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.item:hover {
  transform: scale(1.02);
}
.card{ 
  width: 100%; 
  height: 100%; /* 占满 item 的固定高度 */
  display: flex;
  flex-direction: column; /* 垂直布局 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.card :deep(.el-card__body) {
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; /* 允许 flex 子元素收缩 */
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}
.image {
  width: 100%;
  height: 240px; /* 固定高度，确保所有图片区域相同 */
  flex-shrink: 0; /* 防止被压缩 */
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #f5f6fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为 contain，完整显示图片 */
  transition: opacity 0.3s ease;
}

.image :deep(.el-image__placeholder) {
  background-color: #f5f6fa;
}

.item:hover .image {
  transform: scale(1.05);
}
.img-placeholder, .img-error{
  width: 100%;
  height: 240px; /* 固定高度，与图片区域一致 */
  display:flex;
  align-items:center;
  justify-content:center;
  background:#f5f6fa;
  color:#c0c4cc;
}

.img-placeholder i {
  font-size: 24px;
  animation: rotating 1.5s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.text {
  margin:1vh 0;
}
.el-select {
  margin-top: 2vh;
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 30px;
  padding: 0 1vw;
}
/* 固定内部 el-select 组件宽度 */
.el-select :deep(.el-select) {
  width: 240px;
  min-width: 240px;
}
.el-input__inner{
  height:28px;
  line-height:28px;
}
.data{
  display: flex;
  height: 40px; /* 固定高度，确保所有卡片一致 */
  min-height: 40px; /* 最小高度 */
  max-height: 40px; /* 最大高度，防止内容溢出 */
  justify-content: space-between;
  color:#606266;
  align-items: center;
  overflow: hidden;
  margin-top: 12px; /* 固定间距，确保标题位置一致 */
  flex-shrink: 0; /* 防止被压缩 */
}
.data .name{
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 允许文本截断 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 修复拼写错误 */
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  margin-right: 8px; /* 添加右边距 */
}
.data .icon{
  width: 32px; /* 固定宽度，使用 px 而不是 vw */
  flex-shrink: 0; /* 防止被压缩 */
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
}

.data .icon .collect-icon {
  cursor: pointer;
  padding: 4px;
  display: inline-block;
  font-size: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
}

.data .icon .collect-icon:hover {
  transform: scale(1.15);
}

.data .icon .collect-icon.collect-animate {
  animation: collectPulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

@keyframes collectPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.6) rotate(15deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}
.box{
  margin-bottom: 32px;
}
.loading{
  position: absolute;
  top:50%;
  left:40%;
  color:#C0C4CC;
  font-size:18px;
}
.loading .text{
  display: block;
}

/* 自定义类别选择按钮的选中颜色 */
:deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: #8167a9 !important;
  border-color: #8167a9 !important;
  color: #fff !important;
  box-shadow: -1px 0 0 0 #8167a9 !important;
}

:deep(.el-radio-button__inner:hover) {
  color: #8167a9;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-left: 1px solid #dcdfe6;
}
</style>