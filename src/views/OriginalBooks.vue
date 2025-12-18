<template>
  <div>
    <div class="content">
      <div class="content-left">
        <div class="el-select">
          <!-- 排序方式：改为单选按钮组 -->
          <el-radio-group v-model="sortType" size="mini" @change="handleSortChange">
            <el-radio-button
              v-for="item in sortList"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
          <!-- 类别筛选 -->
          <el-radio-group v-model="button2"  size="mini" @change="handleCategoryChange">
            <el-radio-button 
              v-for="option in categoryOptions" 
              :key="option.value"
              :label="option.value">
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

  <!-- 不搜索时显示全部绘本 -->
      <div  class="box">
      <div v-if="loading" class="loading"><span class="text">故事正在加载</span><i class="el-icon-loading" :size="32" ></i></div>
        <div v-show="(!loading)" class="items" v-infinite-scroll="loadMore" infinite-scroll-disabled="scrollDisabled" :disabled="loadControl">
        <div class="item" v-for="(item, index) in books" :key="item._id || index">
          <el-card class="card" shadow="hover">
            <div>
              <el-image
                :src="(`https://static.kidstory.cc/`+item.cover)"
                class="image"
                fit="cover"
                lazy
                @click="toDetail(item._id)"
              >
                <template #placeholder>
                  <div class="img-placeholder">
                    <i class="el-icon-picture-outline"></i>
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
                <span v-if="collectBookArr.includes(item._id)"><i style="color:#FFd301" class="iconfont icon-shoucang1"></i></span>
                <span v-else class="iconfont icon-shoucang"><i @click="collectBookFun(item._id)" ></i></span></div>
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
// @ is an alias to /src

import {mapState} from "vuex"
import { ElMessage } from 'element-plus'

export default {
  name: "OriginalBooks",
  components: {
  },
  computed:mapState([
        "books", "collectBookArr",
        "likeBookArr",
    ]),
  data() {
    return {
      userid:localStorage.getItem("id"),
      bookArry:[],
     toolArry:[],
     num:1,
     imgUrl:[],
     loading:true,
     loadControl:false,
     scrollDisabled:false,
      sortList: [
        {
          value: "default",
          label: "默认",
        },
        {
          value: "hot",
          label: "热度",
        },
        {
          value: "time",
          label: "时间",
        },
      ],
      sortType: "default",
      button1: "不限",
      button2: "", // 使用空字符串表示"不限"
      categoryOptions: [
        { label: "不限", value: "" },
        { label: "儿童读物", value: "reading" },
        { label: "习惯养成", value: "habit" },
        { label: "英语启蒙", value: "english" },
        { label: "数学启蒙", value: "math" },
        { label: "科普百科", value: "knowledge" },
        { label: "其他", value: "others" },
      ],
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
        // 如果选择了类别，添加 type 参数
        if (this.button2) {
          url += `&type=${this.button2}`;
        }
        let res=await this.$http.get(url)
        //对象数组，对象包含绘本的name\id\content\description等
        this.toolArry=res.data.message
        
      }catch(err){
        this.loading=false 
        console.log(err)
        ElMessage({
          message: '抱歉，出错了！',
          type: 'error'
        });
      }

    },

//获取绘本的封面图片
   async getImgUrl(){
    const promises = this.toolArry.map((book, idx) => {
      const firstId = Array.isArray(book.content) ? book.content[0] : null;
      if (!firstId) return Promise.resolve();
      return this.$http.get(`/ill/` + firstId)
        .then(res => {
          this.toolArry[idx].cover = res.data.message.content;
        })
        .catch(err => {
          console.log(err);
        });
    });
    await Promise.all(promises);
   },
   setBooks(){
    this.$store.commit("addBooks",this.toolArry)
    this.loading=false  
   },
  //下一页
   async loadMore(){
    if(!this.loadControl) {
      this.loadControl=true
        try {
          const { sort_param, sort_num } = this.getSortParams();
          let url = `/book/?sort_param=${sort_param}&sort_num=${sort_num}&page=` + this.num;
          // 如果选择了类别，添加 type 参数
          if (this.button2) {
            url += `&type=${this.button2}`;
          }
          let res = await this.$http.get(url)
          if (res.data.message.length == 0) {
            this.scrollDisabled = true
          } else {
            this.toolArry = res.data.message
            await this.getImgUrl();
            await this.setBooks();
            this.num++
            this.loadControl=false
          }
        } catch (err) {
          console.log(err)
        }
    }
  
    },

 

    //点击收藏绘本
    collectBookFun(id) {
      this.$http
        .post(`/user/like/`+id,{ownerid:this.userid,type:"book",likeid:id}
        ,{
          headers:{
            "Authorization":"Bearer "+localStorage.getItem("token")
          }
        })
        .then((response) => {
          console.log(response)
          if (response.data.desc === "success") {
              //把该绘本ID添加到用户已收藏绘本数组
              this.$store.commit("collectBook",id)
              ElMessage.success('收藏成功');
          } 
        })
        .catch((error) => {
          console.error('收藏失败:', error);
          ElMessage.error('收藏失败，请重试');
        });
    },

    //搜索绘本
    async searchFun(){
      this.$store.commit("removeBooks")
      if(this.searchInput!= ''){
        this.$router.push({
        name: "books",
        query: { keyWord: this.searchInput },
      });
        await this.getSearchBooks()
        await this.getImgUrl()
        await this.setBooks()
      }else{
        return
      }
    },

    async getAllBooks(){
      this.$store.commit("removeBooks")
      if(this.searchInput==''){
        this.$router.push({
        name: "books"
      });
      //获取第一页的18本绘本
        await this.getBooks();
    //获取图片
    await this.getImgUrl();
    
   await this.setBooks();
      }else{
        return
      }
    },
    // 处理排序变化
    async handleSortChange() {
      // 重置分页
      this.num = 1;
      this.scrollDisabled = false;
      this.loading = true;
      // 清空当前列表
      this.$store.commit("removeBooks");
      // 重新获取数据
      await this.getBooks();
      await this.getImgUrl();
      await this.setBooks();
    },
    // 处理类别变化
    async handleCategoryChange() {
      // 重置分页
      this.num = 1;
      this.scrollDisabled = false;
      this.loading = true;
      // 清空当前列表
      this.$store.commit("removeBooks");
      // 重新获取数据
      await this.getBooks();
      await this.getImgUrl();
      await this.setBooks();
    },
    //跳转到books
    async toBooks(){
      if(this.searchInput==''){
        this.$router.push({
        name: "books"
      });
       
    }


  }},



  async mounted(){
      await this.getAllBooks()  
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
  display: flex;
  flex-wrap: wrap;
  align-content:flex-start;  
  gap: 24px; /* 列间距 */
}
.item {
  box-sizing: border-box;
  flex: 0 0 calc((100% - 72px) / 4); /* 五列：四处gap共96px */
  margin: 0; /* 通过 gap 控制间距 */
  border-radius: 8px;
  user-select: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item:hover {
  transform: scale(1.02);
}
.card{ 
  width: 100%; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}
.image {
  width: 100%;
  aspect-ratio: 3 / 2; /* 稳定比例，避免高度不一致 */
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item:hover .image {
  transform: scale(1.05);
}
.img-placeholder, .img-error{
  width: 100%;
  height: 100%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#f5f6fa;
  color:#c0c4cc;
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
  height:18px;
justify-content: space-between;
color:#606266;
align-items: center;
overflow: hidden;
margin-top:8px;
  
}
.data .name{
  width:11vw;
  white-space:nowrap;
overflow:hidden;
text-overflow:ellipse;
font-size:14px;
font-weight: 500;
text-align: left;
}
.data .icon{
  width:4vw;
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  font-size:14px;
  cursor:pointer;
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