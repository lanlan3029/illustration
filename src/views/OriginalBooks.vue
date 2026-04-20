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
            <article
              class="book-card"
              v-for="(item, index) in books"
              :key="item._id || index"
              @click="toDetail(item._id)"
            >
              <div class="book-cover">
                <el-image
                  :src="(`https://static.kidstory.cc/`+item.cover)"
                  class="book-image"
                  fit="cover"
                  :lazy="true"
                  loading="lazy"
                  :preview-src-list="[]"
                >
                  <template #placeholder>
                    <div class="img-placeholder">
                      <div class="shimmer" />
                    </div>
                  </template>
                  <template #error>
                    <div class="img-error">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </template>
                </el-image>
                <span class="cover-chip">{{ getCategoryLabel(item.type) }}</span>
                <button
                  class="cover-fab"
                  :class="{ active: collectBookArr.includes(item._id), pulse: collectingIds.includes(item._id) }"
                  type="button"
                  :aria-label="collectBookArr.includes(item._id) ? $t('books.cancelCollect') || 'uncollect' : $t('books.collect') || 'collect'"
                  @click.stop="handleCollectClick(item._id)"
                >
                  <span
                    class="iconfont"
                    :class="collectBookArr.includes(item._id) ? 'icon-shoucang1' : 'icon-shoucang'"
                  />
                </button>
              </div>
              <div class="book-meta">
                <h3 class="book-title">{{ item.title }}</h3>
                <span class="book-subtype">{{ getCategoryLabel(item.type) }}</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BookLoading from '@/components/BookLoading.vue'
import { mapState } from 'vuex'
import { ElMessage } from 'element-plus'
import { getCollectionBook } from '@/api/userCollect'

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
    getCategoryLabel(type) {
      const map = {
        reading: this.$t('upload.categoryReading'),
        habit: this.$t('upload.categoryHabit'),
        english: this.$t('upload.categoryEnglish'),
        math: this.$t('upload.categoryMath'),
        knowledge: this.$t('upload.categoryKnowledge'),
        puzzle: this.$t('upload.categoryPuzzle'),
        story: this.$t('upload.categoryStory'),
        nature: this.$t('upload.categoryNature'),
        history: this.$t('upload.categoryHistory'),
        art: this.$t('upload.categoryArt'),
        emotion: this.$t('upload.categoryEmotion'),
        others: this.$t('upload.categoryOthers')
      }
      return map[type] || this.$t('upload.categoryOthers')
    },
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



  async mounted() {
    if (this.userid && localStorage.getItem('token')) {
      await getCollectionBook(this.$http, this.$store)
    }
    await this.getAllBooks()
    await this.loadCollectIdMap()
  },
};
</script>
<style scoped>
/* =========================================================
   2026 Book List — soft-light / glass-chip / ambient-shadow
   ========================================================= */
.content {
  width: 100vw;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(129, 103, 169, 0.12), transparent 60%),
    radial-gradient(1000px 500px at 100% 0%, rgba(255, 180, 170, 0.12), transparent 55%),
    #f6f6fb;
  margin: auto;
  display: flex;
  justify-content: center;
}

.content-left {
  width: 86vw;
  max-width: 1280px;
  height: 88vh;
  overflow-y: auto;
  margin: 0 auto;
  padding-bottom: 24px;
}

.items {
  width: 100%;
  margin-top: 2vh;
  padding: 0 4px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(236px, 1fr));
  gap: 22px 20px;
  align-items: start;
  justify-items: stretch;
}

/* ---------- Card ---------- */
.book-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  isolation: isolate;
  box-shadow:
    0 1px 2px rgba(24, 24, 40, 0.04),
    0 12px 28px -12px rgba(24, 24, 40, 0.10);
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.book-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(129, 103, 169, 0), rgba(129, 103, 169, 0.25));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
          mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
  z-index: 2;
}

.book-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 2px 4px rgba(24, 24, 40, 0.05),
    0 30px 44px -18px rgba(49, 35, 82, 0.22);
}

.book-card:hover::before { opacity: 1; }

/* ---------- Cover ---------- */
.book-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(140deg, #f3eefb, #eaf0ff);
}

.book-image {
  width: 100%;
  height: 100%;
  display: block;
}

.book-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.book-image :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.45s ease;
}

.book-card:hover .book-image :deep(.el-image__inner) {
  transform: scale(1.06);
  filter: saturate(1.05);
}

/* soft gradient wash for legibility of the chip without covering the image */
.book-cover::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 38%;
  background: linear-gradient(to top, rgba(24, 18, 44, 0.18), transparent);
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.book-card:hover .book-cover::after { opacity: 1; }

/* ---------- Floating chip (category) ---------- */
.cover-chip {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #2d2640;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  -webkit-backdrop-filter: blur(10px) saturate(160%);
          backdrop-filter: blur(10px) saturate(160%);
  box-shadow: 0 4px 12px rgba(24, 24, 40, 0.08);
}

/* ---------- Floating FAB (collect) ---------- */
.cover-fab {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
          backdrop-filter: blur(10px) saturate(160%);
  color: #8a8a9a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(24, 24, 40, 0.08);
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.2s ease,
    background 0.2s ease;
}

.cover-fab .iconfont {
  font-size: 16px;
  line-height: 1;
}

.cover-fab:hover {
  transform: scale(1.08);
  color: #8167a9;
  background: rgba(255, 255, 255, 0.9);
}

.cover-fab.active {
  color: #f7b500;
  background: rgba(255, 248, 224, 0.92);
  border-color: rgba(255, 211, 1, 0.45);
}

.cover-fab.pulse {
  animation: collectPulse 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes collectPulse {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.35) rotate(-8deg); }
  70%  { transform: scale(0.94) rotate(6deg); }
  100% { transform: scale(1) rotate(0); }
}

/* ---------- Meta ---------- */
.book-meta {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
}

.book-title {
  margin: 0;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: #1c1b29;
  letter-spacing: -0.005em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(14px * 1.4 * 2);
}

.book-subtype {
  font-size: 12px;
  color: #9298aa;
  text-align: left;
  letter-spacing: 0.01em;
}

/* ---------- Placeholders ---------- */
.img-placeholder,
.img-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  background: linear-gradient(140deg, #f3eefb, #eaf0ff);
}

.img-placeholder {
  overflow: hidden;
  position: relative;
}

.img-placeholder .shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.55) 45%,
    rgba(255, 255, 255, 0) 90%
  );
  background-size: 220% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 120% 0; }
  100% { background-position: -20% 0; }
}

.img-error i {
  font-size: 26px;
}

/* ---------- Filters / top bar ---------- */
.el-select {
  margin-top: 2vh;
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 30px;
  padding: 0 1vw;
}

.el-select :deep(.el-select) {
  width: 200px;
  min-width: 200px;
}

.box {
  margin-bottom: 32px;
}

.loading {
  position: absolute;
  top: 50%;
  left: 40%;
  color: #c0c4cc;
  font-size: 18px;
}

.loading .text { display: block; }

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

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .content-left { width: 92vw; }
  .items { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
}

@media (max-width: 640px) {
  .content-left { width: 100vw; padding: 0 10px 24px; }
  .items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
  }
  .book-card { border-radius: 18px; }
  .cover-chip { font-size: 10px; padding: 4px 8px; }
  .cover-fab { width: 30px; height: 30px; }
  .cover-fab .iconfont { font-size: 14px; }
  .book-meta { padding: 10px 12px 12px; }
  .book-title { font-size: 13px; min-height: calc(13px * 1.4 * 2); }
}

/* Respect users who dislike motion */
@media (prefers-reduced-motion: reduce) {
  .book-card,
  .book-image :deep(.el-image__inner),
  .cover-fab { transition: none; }
  .cover-fab.pulse { animation: none; }
  .img-placeholder .shimmer { animation: none; }
}
</style>