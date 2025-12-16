<template>
  
   
    <div class="content">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <p>正在加载...</p>
      </div>
      <!-- 有数据时显示 -->
      <template v-else-if="bookDetails && bookDetails._id">
      <el-button class="btn" @click="gobookEdition(bookDetails._id)">编辑</el-button>
    
         <div class="book">
          <div class="desc">
            <h2>{{bookDetails.title || '未命名绘本'}}</h2>
            <p>{{bookDetails.description || '暂无描述'}}</p>
          </div>
          <div 
            v-for="(item, index) in bookDetails.content" 
            :key="index" 
            v-show="!failedImages.includes(index)"
            class="item">
            <el-image 
              :src="getImageUrl(item)" 
              style="width:984.3px;height:699px" 
              fit="cover"
              @error="handleImageError(index)">
            </el-image>
      </div>
        </div>
      </template>
      <!-- 无数据 -->
      <div v-else class="empty-state">
        <p>绘本不存在或加载失败</p>
      </div>  
    </div>
  
</template>

<script>
// @ is an alias to /src



import {mapState} from "vuex"
import { ElMessage } from 'element-plus'

export default {
  name: "MyBookDetails",
  components: {

   
  },
  data(){
    return{
      id: null,
      bookDetails: {},
      loading: false,
      failedImages: [] // 记录加载失败的图片索引
    }
  },
  computed: {
    ...mapState(["myBooks"])
  },

  methods:{
   attention(){
    console.log("关注作者")
   },
   // 获取绘本详情
   async getBookDetails(){
     // 重置失败图片列表
     this.failedImages = [];
     
     // 从路由参数获取 bookId
     this.id = this.$route.params.bookId;
     
     if (!this.id) {
       ElMessage.error('缺少绘本ID');
       return;
     }
     
     // 先尝试从 store 中获取（如果存在）
     if (this.myBooks && this.myBooks.length > 0) {
       const book = this.myBooks.find(item => item._id === this.id);
       if (book) {
         this.bookDetails = book;
         // 如果 content 中还有图片ID，需要加载图片URL
         await this.loadBookImages();
         return;
       }
     }
     
     // 如果 store 中没有，从 API 获取
     this.loading = true;
     try {
       const response = await this.$http.get(`/book/${this.id}`, {
         headers: {
           'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
         }
       });
       
       if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
         this.bookDetails = response.data.message || response.data.data || {};
         // 加载图片URL
         await this.loadBookImages();
       } else {
         ElMessage.error('获取绘本详情失败');
       }
     } catch (error) {
       console.error('获取绘本详情失败:', error);
       ElMessage.error('加载绘本失败，请稍后重试');
     } finally {
       this.loading = false;
     }
   },
   
   // 加载绘本图片URL（如果 content 是图片ID）
   async loadBookImages() {
     if (!this.bookDetails || !this.bookDetails.content || !Array.isArray(this.bookDetails.content)) {
       return;
     }
     
     // 检查是否需要加载图片URL
     const needLoad = this.bookDetails.content.some(item => 
       typeof item === 'string' && !item.includes('/') && !item.includes('upload')
     );
     
     if (!needLoad) {
       // 如果已经是URL格式，不需要加载
       return;
     }
     
     // 加载所有图片URL
     for (let i = 0; i < this.bookDetails.content.length; i++) {
       const item = this.bookDetails.content[i];
       if (typeof item === 'string' && !item.includes('/') && !item.includes('upload')) {
         // 是图片ID，需要获取URL
         try {
           const res = await this.$http.get(`/ill/${item}`);
           if (res.data && res.data.message && res.data.message.content) {
             this.$set(this.bookDetails.content, i, res.data.message.content);
           }
         } catch (err) {
           console.error(`加载图片失败 (ID: ${item}):`, err);
         }
       }
     }
   },
   
   // 获取图片URL（处理完整URL和相对路径）
   getImageUrl(url) {
     if (!url) return '';
     // 如果已经是完整URL，直接返回
     if (url.startsWith('http://') || url.startsWith('https://')) {
       return url;
     }
     // 否则添加静态资源前缀
     return `https://static.kidstory.cc/${url}`;
   },
   
   // 处理图片加载失败
   handleImageError(index) {
     // 将失败的图片索引添加到数组中，使用 v-show 隐藏
     if (!this.failedImages.includes(index)) {
       this.failedImages.push(index);
     }
   },
      //编辑绘本
     gobookEdition(id){
      this.$store.commit("editionBookFun",this.bookDetails)
        this.$router.push({name:'edition-book',params:id});
}
  },

  async mounted(){
    await this.getBookDetails();
  },
  
  // 监听路由变化，如果 bookId 改变，重新加载
  watch: {
    '$route'(to, from) {
      if (to.params.bookId !== from.params.bookId) {
        this.getBookDetails();
      }
    }
  }
};
</script>
<style scoped>
.content {
  width: 100vw; 
  height: 88vh;
  display: flex;
  flex-wrap: wrap;
  background-color: #f5f6fa;
  overflow: scroll;
}


.book{
  width: 984.3px;
  min-height: 200px;
  background-color: #fff;
  margin:auto;
  font-size:20px;
  font-weight: 600;
}
.book .desc{
  width:100%;
  min-height:116px;
  padding:48px;
  font-size: 20;
  letter-spacing: 2px;
  background-color: #fff;
  color:#1c345e;
  
}



.item{
  width: 984.3px;
  height: 699px;
}

.btn{
  position: fixed;
  right:5vw;
  bottom: 5vw;
  z-index: 10;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 18px;
  color: #909399;
}

.image-slot {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.image-slot p {
  margin-top: 10px;
  font-size: 14px;
}
</style>