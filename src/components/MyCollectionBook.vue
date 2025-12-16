<template>
    <div>
      <!-- 空状态 -->
      <div v-if="!collectBookDetails || collectBookDetails.length === 0" class="empty-state">
        <p>还没有收藏的绘本</p>
      </div>
      <!-- 有数据时显示列表 -->
      <ul v-else class="index2-items">
          <li
            class="index2-item"
            v-for="(item, index) in collectBookDetails"
            :key="index"
          >
            <div class="index2-avatar">
              <el-image 
                :src="getBookCoverUrl(item)" 
                class="image" 
                fit="cover" 
                @click="goBookDetails(item._id)"
              >
                <template #error>
                  <div class="image-slot">
                    <i class="el-icon-picture-outline"></i>
                  </div>
                </template>
              </el-image>
            </div>
   <el-descriptions :column="2" :colon="false">
    <template #title>{{item.title || '未命名绘本'}}</template>
    <template #extra>
      <el-button size="small" @click="cancelCollectBook(item._id)">取消收藏</el-button>
    </template>
   <el-descriptions-item span="2" label="描述">{{item.description || '暂无描述'}}</el-descriptions-item>
   
    <el-descriptions-item label="获赞">{{item.like_num || 0}}</el-descriptions-item>
     <el-descriptions-item label="收藏">{{item.collection_num || 0}}</el-descriptions-item>
  </el-descriptions> 
          </li>
        </ul>
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
            
          }
      },
      computed:mapState(["collectBookArr","collectBookDetails"]),

  async mounted(){
    await this.getCollectBook();
  },
  methods: {
    async getCollectBook() {
      try {
        // 使用新接口获取所有收藏的绘本数据
        const res = await this.$http.get(`/user/list/collect?id=${this.id}&category=book`, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        });
        if (res.data.desc === "success") {
          this.toolArr = res.data.message || [];
          // 加载图片URL
          await this.getImgUrl();
          // 保存到store
          this.setBooks();
        }
      } catch(err) {
        console.error('获取收藏绘本失败:', err);
        this.toolArr = [];
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
cancelCollectBook(id){
  this.$http
        .delete(`/user/list/collect?id=`+id,
        {
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        },
    )
        .then((response) => {
          if (response.data.desc === "success") {
             // 重新加载收藏绘本数据
             this.getCollectBook();
             ElMessage.success('已取消收藏');
          } 
        })
        .catch((error) => {
          console.error('取消收藏失败:', error);
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
  
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
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

.index2-items {
    list-style: none;
    width: 68vw;
  }
 .index2-items .index2-item {
    height: 208px;
    padding:16px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
     
      border-bottom: 1px solid rgb(238, 238, 238);
  }
 .index2-items .index2-item .index2-avatar {
    width: 250px;
    height: 176px;
    margin-right: 16px;
  }
  .index2-items .index2-item .index2-avatar .el-image{
    width: 250px;
    height: 176px;
    cursor: pointer;
  }
.index2-items .index2-item .index2-center {
    width: 500px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 144px;
  }
.index2-items .index2-item .index2-center .index2-name p:nth-child(2) {
    font-size: 14px;
  }
  
.index2-items .index2-item .index2-center.index2-icon {
    display: flex;
    height:18px;
    justify-content: space-between;
    font-size: 14px;
    width:500px;
  }
.index2-items .index2-item .index2-center.index2-icon div {
    display: inline-block;
    width: 60px;
  }
  
  </style>