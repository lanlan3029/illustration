<template>
  <div>
    <div class="content">
      <div class="content-left">
        <div class="books-toolbar">
          <div class="toolbar-row toolbar-row--sort">
            <span class="toolbar-label">{{ $t('books.sortLabel') }}</span>
            <el-radio-group v-model="sortType" size="small" @change="handleSortChange">
              <el-radio-button
                v-for="item in sortList"
                :key="item.value"
                :label="item.value"
              >
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="toolbar-row toolbar-row--cats">
            <span class="toolbar-label">{{ $t('books.categoryLabel') }}</span>
            <div class="category-scroll">
              <button
                v-for="option in categoryOptions"
                :key="option.value || 'all'"
                type="button"
                class="category-chip"
                :class="{ active: button2 === option.value }"
                @click="selectCategory(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="box">
          <div v-if="loading" class="loading">
            <book-loading :text="$t('books.loading')" />
          </div>
          <div
            v-show="(!loading)"
            class="items"
            v-infinite-scroll="loadMore"
            :infinite-scroll-disabled="scrollDisabled || loadControl || !initialLoaded"
            :infinite-scroll-immediate="false"
            :infinite-scroll-distance="120"
          >
            <article
              class="book-card"
              v-for="(item, index) in books"
              :key="item._id || index"
              @click="toDetail(item._id)"
            >
              <div class="book-cover">
                <el-image
                  v-if="item.cover"
                  :src="coverUrl(item.cover)"
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
                <div v-else class="img-placeholder">
                  <div class="shimmer" />
                </div>
                <div class="cover-overlay">
                  <span class="cover-chip">{{ getCategoryLabel(item.type) }}</span>
                  <button
                    class="cover-fab"
                    :class="{
                      active: collectBookArr.includes(item._id),
                      pulse: collectingIds.includes(item._id),
                      visible: collectBookArr.includes(item._id),
                    }"
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
              </div>
              <div class="book-meta">
                <h3 class="book-title">{{ item.title }}</h3>
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
      initialLoaded: false,
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
        story: this.$t('upload.categoryStory'),
        nature: this.$t('upload.categoryNature'),
        history: this.$t('upload.categoryHistory'),
        art: this.$t('upload.categoryArt'),
        emotion: this.$t('upload.categoryEmotion'),
        others: this.$t('upload.categoryOthers')
      }
      return map[type] || this.$t('upload.categoryOthers')
    },
    coverUrl(path) {
      if (!path) return ''
      if (/^https?:\/\//i.test(path)) return path
      return `https://static.kidstory.cc/${path}`
    },
    selectCategory(value) {
      if (this.button2 === value) return
      this.button2 = value
      this.handleCategoryChange()
    },
    toDetail(id) {
      this.$router.push({ name: 'bookdetails', params: { bookId: id } })
    },

    getSortParams() {
      if (this.sortType === 'time') {
        return { sort_param: 'createdAt', sort_num: 'desc' }
      }
      return { sort_param: 'heat', sort_num: 'desc' }
    },

    getAuthHeaders() {
      const token = localStorage.getItem('token')
      return token && token !== 'undefined'
        ? { Authorization: `Bearer ${token}` }
        : {}
    },

    buildBookListUrl(page) {
      const { sort_param, sort_num } = this.getSortParams()
      let url = `/book/?sort_param=${sort_param}&sort_num=${sort_num}&page=${page}`
      if (this.button2 && this.button2.trim() !== '') {
        url += `&type=${this.button2}`
      }
      return url
    },

    async getBooks() {
      try {
        const res = await this.$http.get(this.buildBookListUrl(1), { headers: this.getAuthHeaders() })
        const raw = Array.isArray(res.data && res.data.message) ? res.data.message : []
        this.toolArry = this.dedupById(raw)
      } catch (err) {
        this.loading = false
        ElMessage({ message: this.$t('books.errorOccurred'), type: 'error' })
      }
    },

    dedupById(list) {
      if (!Array.isArray(list)) return []
      const seen = new Set()
      const out = []
      for (const item of list) {
        if (!item || !item._id) continue
        if (seen.has(item._id)) continue
        seen.add(item._id)
        out.push(item)
      }
      return out
    },

    setBooks() {
      this.$store.commit('addBooks', this.toolArry)
      this.loading = false
    },

    async loadMore() {
      if (this.loadControl || this.scrollDisabled || !this.initialLoaded) return
      this.loadControl = true
      try {
        const nextPage = this.num + 1
        const res = await this.$http.get(this.buildBookListUrl(nextPage), { headers: this.getAuthHeaders() })
        const books = Array.isArray(res.data && res.data.message)
          ? res.data.message
          : (Array.isArray(res.data && res.data.data) ? res.data.data : [])

        if (!books.length) {
          this.scrollDisabled = true
          return
        }

        const existingIds = new Set()
        this.toolArry.forEach((b) => b && b._id && existingIds.add(b._id))
        this.$store.state.books.forEach((b) => b && b._id && existingIds.add(b._id))

        const newBooks = []
        for (const item of books) {
          if (!item || !item._id) continue
          if (existingIds.has(item._id)) continue
          existingIds.add(item._id)
          newBooks.push(item)
        }

        // 本页全部重复：跳过这页，继续向后翻。连续多页都重复时判定没有更多数据。
        if (!newBooks.length) {
          this.num = nextPage
          this.emptyPageStreak = (this.emptyPageStreak || 0) + 1
          if (this.emptyPageStreak >= 2) this.scrollDisabled = true
          return
        }
        this.emptyPageStreak = 0

        const currentLength = this.toolArry.length
        this.toolArry = this.toolArry.concat(newBooks)
        await this.fetchCoversForRange(currentLength, newBooks.length)
        this.$store.commit('addBooks', newBooks)
        this.num = nextPage
      } catch (err) {
        // 网络异常不禁用滚动，允许后续重试
      } finally {
        this.loadControl = false
      }
    },

    async fetchCoversForRange(startIndex, count) {
      const headers = this.getAuthHeaders()
      const endIndex = startIndex + (count == null ? this.toolArry.length - startIndex : count)
      const promises = []
      for (let idx = startIndex; idx < endIndex; idx++) {
        const book = this.toolArry[idx]
        if (!book) continue
        const firstId = Array.isArray(book.content) ? book.content[0] : null
        if (!firstId) {
          this.toolArry[idx].cover = ''
          continue
        }
        promises.push(
          this.$http.get(`/ill/${firstId}`, { headers })
            .then((res) => {
              const content = res && res.data && res.data.message && res.data.message.content
              this.toolArry[idx].cover = content || ''
            })
            .catch(() => {
              this.toolArry[idx].cover = ''
            })
        )
      }
      await Promise.allSettled(promises)
    },

    handleCollectClick(id) {
      if (!id) {
        ElMessage.error(this.$t('books.invalidBookId'))
        return
      }
      if (!this.collectingIds.includes(id)) this.collectingIds.push(id)

      if (this.collectBookArr.includes(id)) {
        this.cancelCollectBook(id)
      } else {
        this.collectBookFun(id)
      }

      setTimeout(() => {
        const index = this.collectingIds.indexOf(id)
        if (index > -1) this.collectingIds.splice(index, 1)
      }, 600)
    },

    collectBookFun(id) {
      if (!id) {
        ElMessage.error(this.$t('books.invalidBookId'))
        return
      }
      const token = localStorage.getItem('token')
      if (!token) {
        ElMessage.warning(this.$t('books.pleaseLogin'))
        return
      }

      this.$http
        .post(`/user/collect/${id}`, { type: 'book' }, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          if (response.data.desc === 'success' || response.data.code === 0) {
            this.$store.commit('collectBook', [id])
            if (response.data.message && response.data.message._id) {
              this.collectIdMap[id] = response.data.message._id
            } else {
              this.loadCollectIdMap()
            }
            ElMessage.success(this.$t('books.collectSuccess'))
          } else {
            ElMessage.warning(response.data.message || this.$t('books.collectFailed'))
          }
        })
        .catch(() => {
          ElMessage.error(this.$t('books.collectFailedRetry'))
        })
    },

    cancelCollectBook(bookId) {
      const collectRecordId = this.collectIdMap[bookId]
      if (!collectRecordId) {
        this.loadCollectIdMap().then(() => {
          const recordId = this.collectIdMap[bookId]
          if (recordId) {
            this.performCancelCollect(bookId, recordId)
          } else {
            ElMessage.error(this.$t('books.collectRecordNotFound'))
          }
        })
        return
      }
      this.performCancelCollect(bookId, collectRecordId)
    },

    performCancelCollect(bookId, collectRecordId) {
      this.$http
        .delete(`/user/list/collect?id=${collectRecordId}`, { headers: this.getAuthHeaders() })
        .then((response) => {
          if (response.data.desc === 'success' || response.data.code === 0) {
            this.$store.commit('cancelCoBook', bookId)
            delete this.collectIdMap[bookId]
            ElMessage.success(this.$t('books.cancelCollectSuccess'))
          } else {
            ElMessage.warning(response.data.message || this.$t('books.cancelCollectFailed'))
          }
        })
        .catch(() => {
          ElMessage.error(this.$t('books.cancelCollectFailedRetry'))
        })
    },

    async loadCollectIdMap() {
      try {
        const userId = localStorage.getItem('id')
        const token = localStorage.getItem('token')
        if (!userId || !token) return
        const res = await this.$http.get(`/user/list/collect?id=${userId}&category=book`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.desc === 'success' || res.data.code === 0) {
          const collectRecords = res.data.message || []
          this.collectIdMap = {}
          collectRecords.forEach((record) => {
            if (record.collectid) this.collectIdMap[record.collectid] = record._id
          })
        }
      } catch (error) {
        // 静默失败
      }
    },

    resetListState() {
      this.num = 1
      this.scrollDisabled = false
      this.loadControl = false
      this.initialLoaded = false
      this.toolArry = []
      this.emptyPageStreak = 0
    },

    async reloadBooks() {
      this.loading = true
      this.resetListState()
      this.$store.commit('removeBooks')
      await this.getBooks()
      await this.fetchCoversForRange(0, this.toolArry.length)
      this.setBooks()
      this.initialLoaded = true
    },

    async getAllBooks() {
      this.$router.push({ name: 'books' })
      await this.reloadBooks()
    },

    handleSortChange() {
      return this.reloadBooks()
    },

    handleCategoryChange() {
      return this.reloadBooks()
    }
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
  width: 100%;
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
  margin-top: 8px;
  padding: 0 4px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 24px 18px;
  align-items: stretch;
  justify-items: stretch;
}

/* ---------- Card ---------- */
.book-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(24, 24, 40, 0.06);
  box-shadow: 0 8px 24px -16px rgba(24, 24, 40, 0.18);
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px -14px rgba(49, 35, 82, 0.2);
}

/* ---------- Cover：竖版 3:4，第一页居中裁剪 ---------- */
.book-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #f0ebe3;
  flex-shrink: 0;
}

.book-cover::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  z-index: 1;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.08), transparent);
  pointer-events: none;
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
  object-position: center center;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.book-card:hover .book-image :deep(.el-image__inner) {
  transform: scale(1.04);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.28) 0%,
    transparent 32%,
    transparent 68%,
    rgba(0, 0, 0, 0.12) 100%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
}

.book-card:hover .cover-overlay,
.book-card:focus-within .cover-overlay {
  opacity: 1;
}

/* ---------- Floating chip (category, hover) ---------- */
.cover-chip {
  align-self: flex-start;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.42);
  border-radius: 999px;
  backdrop-filter: blur(6px);
}

/* ---------- Floating FAB (collect, hover) ---------- */
.cover-fab {
  align-self: flex-end;
  margin-left: auto;
  pointer-events: auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  color: #8a8a9a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.book-card:hover .cover-fab,
.book-card:focus-within .cover-fab,
.cover-fab.visible {
  opacity: 1;
  transform: translateY(0);
}

.cover-fab .iconfont {
  font-size: 16px;
  line-height: 1;
}

.cover-fab:hover {
  color: #8167a9;
}

.cover-fab.active {
  color: #f7b500;
  background: #fff8e0;
  opacity: 1;
  transform: translateY(0);
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
  flex: 1;
  padding: 12px 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #fff;
  min-height: 68px;
}

.book-title {
  margin: 0;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  color: #2c2a38;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  background: #f0ebe3;
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
.books-toolbar {
  margin-top: 16px;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.toolbar-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #6b6578;
  min-width: 36px;
}

.toolbar-row--cats {
  align-items: flex-start;
}

.category-scroll {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.category-scroll::-webkit-scrollbar {
  height: 4px;
}

.category-scroll::-webkit-scrollbar-thumb {
  background: rgba(129, 103, 169, 0.25);
  border-radius: 4px;
}

.category-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid #e4e0ec;
  border-radius: 999px;
  background: #fff;
  color: #5a5568;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.category-chip:hover {
  border-color: #8167a9;
  color: #8167a9;
}

.category-chip.active {
  background: #8167a9;
  border-color: #8167a9;
  color: #fff;
}

.box {
  position: relative;
  margin-bottom: 32px;
  min-height: 200px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
  color: #c0c4cc;
  font-size: 18px;
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

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .content-left { width: 92vw; }
  .items { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); }
}

@media (max-width: 640px) {
  .content-left { width: 100%; padding: 0 10px 24px; box-sizing: border-box; }
  .books-toolbar { padding: 0 4px; }
  .toolbar-label { display: none; }
  .items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 12px;
  }
  .book-card { border-radius: 14px; }
  .book-meta { padding: 10px 8px 12px; min-height: 60px; }
  .book-title { font-size: 12px; }
  .cover-overlay { opacity: 1; }
  .cover-fab { opacity: 1; transform: none; }
}

/* Respect users who dislike motion */
@media (prefers-reduced-motion: reduce) {
  .book-card,
  .book-image :deep(.el-image__inner),
  .cover-fab,
  .cover-overlay { transition: none; }
  .cover-fab.pulse { animation: none; }
  .img-placeholder .shimmer { animation: none; }
}
</style>