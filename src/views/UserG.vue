<template>
  <div class="container">
    <div class="left">
      <div class="info">
        <div class="info-left">
          <el-avatar
            :src="userDetails.avatar || userDetails.author_avatar"
            :size="120"
            class="avatar"
          ></el-avatar>
        </div>

        <div class="info-center">
            <div class="username">{{ userDetails.name || '用户' }}</div>
              <el-descriptions :column="1">
          
              <el-descriptions-item  :contentStyle="{'width': '100%'}" label="介绍">{{ userDetails.description || '暂无介绍' }}</el-descriptions-item>
              </el-descriptions>
          <el-descriptions :column="2">
            <el-descriptions-item label="关注">{{ userDetails.followingCount !== undefined ? userDetails.followingCount : (userDetails.attention_num || 0) }}</el-descriptions-item>
            <el-descriptions-item label="粉丝">{{ userDetails.fansCount !== undefined ? userDetails.fansCount : (userDetails.fans_num || 0) }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="info-right">
            <el-button 
              v-if="userDetails._id && userDetails._id != currentUserId"
              type="primary" 
              @click="handleFollow">
              {{ isFollowing ? '已关注' : '关注' }}
            </el-button>
        </div>
      </div>

      <div v-if="activeIndex == 1">


        <div class="books">
          <div class="title">
            <p>绘本作品</p>
          
          </div>
          <ul class="books-items" v-if="bookArry && bookArry.length > 0">
            <li
              class="books-item"
              v-for="(item, index) in bookArry.slice(0, 4)"
              :key="item._id || index"
              @click="goBookDetails(item._id)"
            >
              <el-image
                :src="getBookCover(item)"
                style="width: 100%; height: 100%"
                fit="cover"
              >
                <template #error>
                  <div class="image-slot">
                    <i class="el-icon-picture-outline"></i>
                  </div>
                </template>
              </el-image>
            </li>
          </ul>
          <div v-else class="empty-state">
            <p>暂无绘本作品</p>
          </div>
        </div>
      </div>

      <div v-if="activeIndex == 2" class="index2">
        <ul class="index2-items" v-if="illArry && illArry.length > 0">
          <li
            class="index2-item"
            v-for="(item, index) in illArry"
            :key="item._id || index"
            @click="goIllusDetails(item._id)"
          >
            <el-image
              :src="getIllImageUrl(item)"
              style="width: 250px; height: 176px"
              fit="contain"
            >
              <template #error>
                <div class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </template>
            </el-image>
          </li>
        </ul>
        <div v-else class="empty-state">
          <p>暂无插画作品</p>
        </div>
      </div>
      
      <div v-if="activeIndex == 3" class="index2">
        <ul class="index2-items" v-if="bookArry && bookArry.length > 0">
          <li
            class="index2-item"
            v-for="(item, index) in bookArry"
            :key="item._id || index"
            @click="goBookDetails(item._id)"
          >
            <el-image
              :src="getBookCover(item)"
              style="width: 250px; height: 176px"
              fit="contain"
            >
              <template #error>
                <div class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </template>
            </el-image>
          </li>
        </ul>
        <div v-else class="empty-state">
          <p>暂无绘本作品</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { mapState } from 'vuex'
import { getAttention } from '@/api/userCollect'

export default {
  props: {
    authorId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      id: '',
      activeIndex: "1",
      userDetails: {},
      illArry:[],
      bookArry:[],
      currentUserId: localStorage.getItem('id'),
    };
  },
  computed: {
    ...mapState([
      "attentionArr",
    ]),
    // 是否已关注
    isFollowing() {
      return this.attentionArr && this.attentionArr.includes(this.id);
    },
  },
  watch: {
    authorId: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.id = newVal;
        }
      }
    },
    '$route.params.authorId': {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.id = newVal;
        }
      }
    }
  },
  methods: {
    handleSelect(key, keyPath) {
      this.activeIndex = key;
      console.log(key, keyPath);
    },
    // 获取用户详情
    async getUserDetails() {
      try {
        let res = await this.$http.get(`/user/` + this.id);
        if (res.data && res.data.message) {
          this.userDetails = res.data.message;
          // 获取关注数和粉丝数
          await this.getUserFollowStats();
        }
      } catch(err) {
        console.error('获取用户信息失败:', err);
      }
    },
    // 获取用户关注数和粉丝数
    async getUserFollowStats() {
      try {
        // 获取关注数
        let resFollowing = await this.$http.get(`/user/number/fllow`, {
          params: { id: this.id }
        });
        if (resFollowing.data && resFollowing.data.desc === "success") {
          this.userDetails.followingCount = resFollowing.data.message || 0;
        }
        
        // 获取粉丝数
        let resFans = await this.$http.get(`/user/number/fllow`, {
          params: { id: this.id, sign: "item" }
        });
        if (resFans.data && resFans.data.desc === "success") {
          this.userDetails.fansCount = resFans.data.message || 0;
        }
      } catch(err) {
        console.error('获取关注/粉丝数失败:', err);
      }
    },
    //获取该用户的所有插画
    async getIlls(){ 
      try{
        let res = await this.$http.get(`/ill/`,{
          params:{
            ownerid:this.id
          }
        })
        if (res.data && res.data.message) {
          this.illArry = res.data.message;
        }
      } catch(err){
        console.error('获取插画列表失败:', err);
      }
    },
    //获取该用户的所有绘本
    async getbook(){ 
      try{
        let res = await this.$http.get(`/book/`,{
          params:{
            ownerid:this.id
          }
        })
        if (res.data && res.data.message) {
          this.bookArry = res.data.message;
          // 加载绘本封面图片URL
          await this.loadBookCovers();
        }
      } catch(err){
        console.error('获取绘本列表失败:', err);
      }
    },
    // 加载绘本封面图片URL
    async loadBookCovers() {
      if (!this.bookArry || this.bookArry.length === 0) {
        return;
      }
      
      for (let i = 0; i < this.bookArry.length; i++) {
        const book = this.bookArry[i];
        if (book.content && Array.isArray(book.content) && book.content.length > 0) {
          const firstContent = book.content[0];
          // 如果是图片ID（字符串且不包含/和upload），需要获取URL
          if (typeof firstContent === 'string' && !firstContent.includes('/') && !firstContent.includes('upload') && !firstContent.startsWith('http')) {
            try {
              let res = await this.$http.get(`/ill/` + firstContent);
              if (res.data && res.data.message && res.data.message.content) {
                this.bookArry[i].content[0] = res.data.message.content;
              }
            } catch (err) {
              console.error(`加载绘本封面失败 (ID: ${firstContent}):`, err);
            }
          }
        }
      }
    },
    // 获取绘本封面
    getBookCover(book) {
      if (!book || !book.content) {
        return '';
      }
      // 如果 content 是数组，取第一张图片
      if (Array.isArray(book.content) && book.content.length > 0) {
        const firstContent = book.content[0];
        if (!firstContent) {
          return '';
        }
        // 如果是完整URL
        if (typeof firstContent === 'string' && (firstContent.startsWith('http://') || firstContent.startsWith('https://'))) {
          return firstContent;
        }
        // 如果是相对路径（包含/或upload），添加静态资源前缀
        if (typeof firstContent === 'string' && (firstContent.includes('/') || firstContent.includes('upload'))) {
          return `https://static.kidstory.cc/${firstContent}`;
        }
        // 如果是图片ID（纯字符串，不包含/），尝试添加静态资源前缀
        if (typeof firstContent === 'string') {
          return `https://static.kidstory.cc/${firstContent}`;
        }
      }
      // 如果 content 是字符串
      if (typeof book.content === 'string') {
        if (book.content.startsWith('http://') || book.content.startsWith('https://')) {
          return book.content;
        }
        return `https://static.kidstory.cc/${book.content}`;
      }
      return '';
    },
    // 跳转到绘本详情
    goBookDetails(bookId) {
      if (bookId) {
        this.$router.push({ name: 'bookdetails', params: { bookId: bookId } });
      }
    },
    // 获取插画图片URL
    getIllImageUrl(ill) {
      if (!ill || !ill.content) {
        return '';
      }
      // 如果是完整URL
      if (typeof ill.content === 'string' && (ill.content.startsWith('http://') || ill.content.startsWith('https://'))) {
        return ill.content;
      }
      // 如果是相对路径或ID
      return `https://static.kidstory.cc/${ill.content}`;
    },
    // 处理关注
    async handleFollow() {
      if (!this.currentUserId) {
        ElMessage.warning('请先登录');
        return;
      }
      
      if (this.isFollowing) {
        // 取消关注
        await this.cancelAttention(this.id);
      } else {
        // 关注
        await this.newAttention(this.id);
      }
    },
    // 关注
    async newAttention(id) {
      try {
        let res = await this.$http.post(`/user/fllow/` + id, {}, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        });
        if (res.data && res.data.desc === "success") {
          this.$store.commit("myAttention", id);
          ElMessage.success('关注成功');
          // 更新粉丝数
          await this.getUserFollowStats();
        }
      } catch(err) {
        console.error('关注失败:', err);
        ElMessage.error('关注失败，请重试');
      }
    },
    // 取消关注
    async cancelAttention(id) {
      try {
        let res = await this.$http.delete(`/user/list/fllow?id=` + id, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        });
        if (res.data && res.data.desc === "success") {
          this.$store.commit("cancelAttention", id);
          ElMessage.success('取消关注成功');
          // 更新粉丝数
          await this.getUserFollowStats();
        }
      } catch(err) {
        console.error('取消关注失败:', err);
        ElMessage.error('取消关注失败，请重试');
      }
    },




    goPdf() {
      this.$router.push("/user/upload/compose-illustration/");
    },
    goCreation() {
      this.$router.push("/editorpro");
    },
    goMyIllu() {
      this.activeIndex = 2;
    },
  
    goIllusDetails(id) {
      this.$router.push({name:'illusdetails',params:{illId:id}});
    },
  },

  async mounted() {
    if (!this.id) {
      this.id = this.authorId || (this.$route ? this.$route.params.authorId : '')
    }
    const currentUserId = localStorage.getItem('id')
    if (currentUserId && localStorage.getItem('token')) {
      await getAttention(this.$http, this.$store)
    }
    if (this.id) {
      await this.getUserDetails()
      await this.getIlls()
      await this.getbook()
    }
  }
};
</script>

<style scoped>
/* 布局尺寸由 vw 改为 100%/px/grid + 居中最大宽度，避免手机端等比压缩崩坏 */
.container {
  width: 100%;
  background-color: #f5f6fa;
  color: #333;
  margin: 0;
  height: 90vh;
  overflow: auto;
  display: flex;
  box-sizing: border-box;
}
.container .left {
  width: 100%;
  max-width: 1200px;
  min-height: 90vh;
  margin: 0 auto;
  padding: 0 12px;
  box-sizing: border-box;
}
.container .left .info{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    background-color: #fff;
    padding:20px;
    justify-content: space-between;
}

.container .left .info .info-center{
    flex: 1;
    min-width: 0;
}
.container .left .info .info-center .username{
  text-align: left;
    font-size: 28px;
    font-weight:500;
}
.container .left .books {
  background-color: #fff;
  margin-top: 8px;
  padding: 20px;
  font-size: 18px;
}
.container .left .books .title {
  display: flex;
  justify-content: space-between;
}
.container .left .books ul {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  /* 自适应网格替代 vw 固定宽度 */
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.container .left .books ul li {
  width: 100%;
  aspect-ratio: 16 / 11.26;
  background-color: #f5f6fa;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
}

.books-item {
  transition: transform 0.3s ease;
}

.books-item:hover {
  transform: scale(1.05);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 16px;
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

.index2 {
  min-height: 60vh;
  background-color: #fff;
  margin-top: 8px;
  padding: 24px;
  font-size: 18px;
}
.index2 .index2-items {
  list-style: none;
  margin: 0;
  padding: 0;
}
.index2 .index2-items .index2-item {
  min-height: 176px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}

/* 平板：绘本网格降为三列（断点统一 1024） */
@media (max-width: 1024px) {
  .container .left .books ul {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 手机端：信息区与列表竖排，绘本两列（断点统一 768） */
@media (max-width: 768px) {
  .container .left .info {
    flex-direction: column;
    align-items: flex-start;
  }
  .container .left .books ul {
    grid-template-columns: repeat(2, 1fr);
  }
  .index2 .index2-items .index2-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>