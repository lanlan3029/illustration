<template>
  <div class="container">
    <div class="left">
     
      <el-menu
        :default-active="activeIndex"
        class="el-menu-demo"
        mode="horizontal"
        @select="handleSelect"
      >
       
        <el-menu-item index="2">我的角色</el-menu-item>
        <el-menu-item index="3">我的插画</el-menu-item>
        <el-menu-item index="4">我的绘本</el-menu-item>
        <el-menu-item index="6">收藏绘本</el-menu-item>
       
      </el-menu>

   

      <!-- 我的角色 -->
      <div v-if="activeIndex == 2" class="card-container">
        <!-- 加载中 -->
        <div v-if="loadingCharacters" class="empty-state">
          <p>正在加载...</p>
        </div>
        <!-- 有角色时显示卡片 -->
        <transition-group 
          v-else-if="characterArr.length > 0" 
          name="card-list" 
          tag="div" 
          class="card-grid">
          <el-card
            v-for="item in characterArr"
            :key="item.id || item._id"
            :class="['content-card', { 'card-deleting': deletingCharacterId === (item.id || item._id) }]"
            shadow="hover"
          >
            <div class="card-image" @click="goCharacterGroupImages(item.id || item._id)">
              <el-image
                :src="getImageUrl(item.image_url)"
                fit="cover"
                class="cover-image"
              >
                <div slot="error" class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </el-image>
            </div>
            <div class="card-content">
              <h3 class="card-title">{{item.character_name || '未命名角色'}}</h3>
              <p class="card-meta">创建时间：{{item.created_at || item.createdAt || '未知'}}</p>
              <div class="card-actions">
                <el-button size="small" type="primary" @click="goCreateGroupImages(item.id || item._id)">创作组图</el-button>
                <el-button size="small" type="info" @click="goCharacterGroupImages(item.id || item._id)">查看组图</el-button>
                <el-button size="small" type="danger" @click="handleDeleteCharacter(item)">删除</el-button>
              </div>
            </div>
          </el-card>
        </transition-group>
        <!-- 加载完成但没有角色 -->
        <div v-else class="empty-state">
          <p>还没有创建角色，快去创作吧！</p>
        </div>
      </div>
<!-- 我的插画 -->
      <div v-if="activeIndex == 3" class="card-container">
        <!-- 加载中 -->
        <div v-if="loadingIll" class="empty-state">
          <p>正在加载...</p>
        </div>
        <!-- 有插画时显示卡片 -->
        <transition-group 
          v-else-if="illArr.length > 0" 
          name="card-list" 
          tag="div" 
          class="card-grid">
          <el-card
            v-for="item in illArr"
            :key="item._id"
            :class="['content-card', { 'card-deleting': deletingIllId === item._id }]"
            shadow="hover"
          >
            <div class="card-image" @click="goIllusDetails(item._id)">
              <el-image
                :src="`https://static.kidstory.cc/${item.content}`"
                fit="cover"
                class="cover-image"
              >
                <div slot="error" class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </el-image>
            </div>
            <div class="card-content">
              <h3 class="card-title">{{item.title || '未命名插画'}}</h3>
              <p class="card-description">{{item.description || '暂无描述'}}</p>
           
              <div class="card-actions">
                <el-button size="small" type="primary" @click="goEdition(item)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteIll(item)">删除</el-button>
              </div>
            </div>
          </el-card>
        </transition-group>
        <!-- 加载完成但没有插画 -->
        <div v-else class="empty-state">
          <p>还没有创建插画，快去创作吧！</p>
        </div>
      </div>
<!-- 我的绘本 -->
      <div v-if="activeIndex == 4" class="card-container">
        <!-- 加载中 -->
        <div v-if="loadingBooks" class="empty-state">
          <p>正在加载...</p>
        </div>
        <!-- 有绘本时显示卡片 -->
        <transition-group 
          v-else-if="myBooks && myBooks.length > 0" 
          name="card-list" 
          tag="div" 
          class="card-grid">
          <el-card
            v-for="item in myBooks"
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
                <div slot="error" class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </el-image>
            </div>
            <div class="card-content">
              <h3 class="card-title">{{item.title || '未命名绘本'}}</h3>
              <p class="card-description">{{item.description || '暂无描述'}}</p>
              
             
              <div class="card-actions">
                <el-button size="small" type="primary" @click="goBookEdition(item)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteBook(item)">删除</el-button>
              </div>
            </div>
          </el-card>
        </transition-group>
        <!-- 加载完成但没有绘本 -->
        <div v-else class="empty-state">
          <p>还没有创建绘本，快去创作吧！</p>
        </div>
      </div>

<!-- 已收藏插画 -->
      <div v-if="activeIndex == 5" class="index2">
       <my-collection-ill/>
      </div>

<!-- 已收藏绘本 -->
      <div v-if="activeIndex == 6" class="index5">
       <my-collection-book />
      </div>

<!-- 我的关注 -->
      <div v-if="activeIndex == 7" class="index2">
       <my-attention />    
      </div>

<!-- 我的粉丝 -->
      <div v-if="activeIndex == 8" class="index2">
       <my-fans />    
      </div>

    </div>
 
  </div>
</template>

<script>
import {mapState} from "vuex"
import MyCollectionIll from '../components/MyCollectionIll.vue'
import MyCollectionBook from '../components/MyCollectionBook.vue'
import MyAttention from '../components/MyAttention.vue'
import MyFans from '../components/MyFans.vue'
import generateID from '@/utils/generateID'
import { commonStyle, commonAttr } from '@/custom-component/component-list'
export default {
  components:{
MyCollectionIll,MyCollectionBook,MyAttention,MyFans
  },
  data() {
    return {
      id:localStorage.getItem("id"),
      activeIndex: "2", // 默认显示"我的角色"标签
      illArr:[],
      toolArr:[],
      characterArr: [], // 我的角色列表
      loadingCharacters: false, // 角色加载状态（初始为false，避免阻止首次加载）
      loadingIll: false, // 插画加载状态
      loadingBooks: false, // 绘本加载状态
      loadingBookCovers: false, // 绘本封面加载状态
      deletingCharacterId: null, // 正在删除的角色ID
      deletingIllId: null, // 正在删除的插画ID
      deletingBookId: null, // 正在删除的绘本ID
     
    };
  },
  computed:mapState([
        "myBooks"
    ]),
  methods: {
    handleSelect(key) {
      this.activeIndex = key;
      // 根据选中的标签加载对应的数据
      if (key === '2') {
        // 切换到"我的角色"标签，获取角色列表
        if (this.characterArr.length === 0 && !this.loadingCharacters) {
          this.getCharacters();
        }
      } else if (key === '3') {
        // 切换到"我的插画"标签，获取插画列表
        if (this.illArr.length === 0 && !this.loadingIll) {
          this.getIll();
        }
      } else if (key === '4') {
        // 切换到"我的绘本"标签，获取绘本列表
        if ((!this.myBooks || this.myBooks.length === 0) && !this.loadingBooks) {
          this.getBook();
        }
      }
    },
    goCompose() {
      this.$router.push("/user/upload/compose-illustration/");
    },
    goCreation() {
      this.$router.push("/creation");
    },
   goLocalIllus(){
       this.$router.push("/user/upload/upload-local-illustration");
   },
   goHome(){
       this.$router.push("/");
   },
    goIllusDetails(id) {
      this.$router.push({name:'user-illusdetails',params:{illId:id}});
    },
    goBookDetails(id){
      this.$router.push({name:'user-bookdetails',params:{bookId:id}});
    },
    async goEdition(item){
        try {
            // 获取插画的完整信息（包括图片URL）
            let imageUrl = '';
            if (item.content) {
                // 如果是相对路径，转换为完整URL
                if (item.content.startsWith('http://') || item.content.startsWith('https://')) {
                    imageUrl = item.content;
                } else {
                    imageUrl = `https://static.kidstory.cc/${item.content}`;
                }
            } else {
                // 如果没有content，尝试从API获取
                try {
                    const res = await this.$http.get(`/ill/${item._id}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    if (res.data && res.data.message && res.data.message.content) {
                        const content = res.data.message.content;
                        if (content.startsWith('http://') || content.startsWith('https://')) {
                            imageUrl = content;
                        } else {
                            imageUrl = `https://static.kidstory.cc/${content}`;
                        }
                    }
                } catch (err) {
                    console.error('获取插画详情失败:', err);
                    this.$message.error('获取插画信息失败，请重试');
                    return;
                }
            }
            
            if (!imageUrl) {
                this.$message.error('无法获取插画图片');
                return;
            }
            
            // 将插画图片转换为组件数据
            // 创建图片组件
            const img = new Image();
            img.crossOrigin = 'anonymous'; // 允许跨域
            
            img.onload = () => {
                // 获取画布尺寸（从store获取，单位是vw，需要转换为px）
                // 假设屏幕宽度为1920px，1vw = 19.2px
                const vwToPx = window.innerWidth / 100;
                const canvasWidth = 56 * vwToPx; // 56vw 转换为 px
                const canvasHeight = 42 * vwToPx; // 42vw 转换为 px（从store获取）
                
                // 计算图片尺寸，确保不超过画布大小，同时保持宽高比
                let displayWidth = img.width;
                let displayHeight = img.height;
                
                // 如果图片超过画布，按比例缩放
                if (displayWidth > canvasWidth || displayHeight > canvasHeight) {
                    const scale = Math.min(canvasWidth / displayWidth, canvasHeight / displayHeight);
                    displayWidth = Math.floor(displayWidth * scale);
                    displayHeight = Math.floor(displayHeight * scale);
                }
                
                // 居中显示
                const top = Math.max(0, (canvasHeight - displayHeight) / 2);
                const left = Math.max(0, (canvasWidth - displayWidth) / 2);
                
                // 创建组件数据
                const componentData = {
                    ...commonAttr,
                    id: generateID(),
                    component: 'Picture',
                    label: '图片',
                    icon: '',
                    propValue: imageUrl,
                    style: {
                        ...commonStyle,
                        top: top,
                        left: left,
                        width: displayWidth,
                        height: displayHeight,
                    }
                };
                
                // 将组件数据设置到 store
                this.$store.commit('setComponentData', [componentData]);
                
                // 跳转到创作页面
                this.$router.push('/creation');
            };
            
            img.onerror = () => {
                this.$message.error('图片加载失败，请检查图片URL');
            };
            
            img.src = imageUrl;
        } catch (error) {
            console.error('编辑插画失败:', error);
            this.$message.error('编辑插画失败，请重试');
        }
    },
    // 处理删除插画（显示确认弹窗）
    handleDeleteIll(item) {
      const illustrationId = item._id;
      const illustrationName = item.title || '未命名插画';
      
      this.$confirm(
        `确定要删除"${illustrationName}"吗？删除后无法恢复。`,
        '确认删除',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      ).then(() => {
        this.deleteIllById(illustrationId);
      }).catch(() => {
        // 用户取消删除
      });
    },
    // 执行删除插画操作
    deleteIllById(illustrationId) {
      // 先标记为删除中，触发动画
      this.deletingIllId = illustrationId;
      
      this.$http
        .delete(`/ill/${illustrationId}`, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0') {
            // 等待动画完成后再从数组中移除
            setTimeout(() => {
              const index = this.illArr.findIndex(item => item._id === illustrationId);
              if (index !== -1) {
                this.illArr.splice(index, 1);
              }
              this.deletingIllId = null;
              this.$message({
                message: '删除成功',
                type: 'success',
                duration: 2000
              });
            }, 400); // 等待缩小动画完成（300ms + 100ms缓冲）
          } else {
            this.deletingIllId = null;
            this.$message({
              message: response.data.message || '删除失败',
              type: 'error'
            });
          }
        })
        .catch((error) => {
          console.error('删除插画失败:', error);
          this.deletingIllId = null;
          this.$message({
            message: error.response?.data?.message || '删除失败，请稍后重试',
            type: 'error'
          });
        });
    },
    goBookEdition(item){
      this.$store.commit("editionBookFun",item)
        this.$router.push({name:'edition-book',params:item._id});
    },
    // 处理删除绘本（显示确认弹窗）
    handleDeleteBook(item) {
      const bookId = item._id;
      const bookName = item.title || '未命名绘本';
      
      this.$confirm(
        `确定要删除"${bookName}"吗？删除后无法恢复。`,
        '确认删除',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      ).then(() => {
        this.deleteBookById(bookId);
      }).catch(() => {
        // 用户取消删除
      });
    },
    // 执行删除绘本操作
    deleteBookById(bookId) {
      // 先标记为删除中，触发动画
      this.deletingBookId = bookId;
      
      this.$http
        .delete(`/book/${bookId}`, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0') {
            // 等待动画完成后再从数组中移除
            setTimeout(() => {
              // 从 toolArr 中移除
              const index = this.toolArr.findIndex(item => item._id === bookId);
              if (index !== -1) {
                this.toolArr.splice(index, 1);
                // 更新 store
                this.setBooks();
              }
              this.deletingBookId = null;
              this.$message({
                message: '删除成功',
                type: 'success',
                duration: 2000
              });
            }, 400); // 等待缩小动画完成（300ms + 100ms缓冲）
          } else {
            this.deletingBookId = null;
            this.$message({
              message: response.data.message || '删除失败',
              type: 'error'
            });
          }
        })
        .catch((error) => {
          console.error('删除绘本失败:', error);
          this.deletingBookId = null;
          this.$message({
            message: error.response?.data?.message || '删除失败，请稍后重试',
            type: 'error'
          });
        });
    },
    goMyIllu(){
      this.activeIndex=2
    },
    goMybooks(){
      this.activeIndex=4
    },
    // 跳转到创作组图页面
    goCreateGroupImages(characterId) {
      // 找到对应的角色对象
      const character = this.characterArr.find(item => (item.id || item._id) === characterId);
      if (character) {
        // 将角色信息保存到localStorage，供组图页面使用
        const characterData = {
          id: characterId,
          image_url: character.image_url,
          character_name: character.character_name,
          character_type: character.character_type,
          description: character.description
        };
        localStorage.setItem('selectedCharacterForGroupImages', JSON.stringify(characterData));
        
        // 跳转到创作组图页面
        this.$router.push('/create-group-images');
      } else {
        this.$message.warning('未找到角色信息');
      }
    },
    
    // 跳转到角色组图页面（查看已有组图）
    goCharacterGroupImages(characterId) {
      // 将角色ID保存到localStorage，供组图页面使用
      localStorage.setItem('viewCharacterId', String(characterId));
      // 跳转到组图页面（可以创建一个新的页面，或者复用CreateGroupImages页面）
      this.$router.push({ 
        name: 'character-group-images', 
        params: { characterId: characterId } 
      });
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
    // 获取绘本封面URL
    getBookCoverUrl(item) {
      if (!item || !item.content || !item.content[0]) {
        return '';
      }
      const cover = item.content[0];
      // 如果已经是完整URL，直接返回
      if (cover.startsWith('http://') || cover.startsWith('https://')) {
        return cover;
      }
      // 如果已经是路径格式（包含 upload/ 或 /），直接拼接
      if (cover.includes('/') || cover.includes('upload')) {
        return `https://static.kidstory.cc/${cover}`;
      }
      // 否则可能是图片ID，返回空（等待加载）
      return '';
    },
    // 获取我的角色
    async getCharacters() {
      this.loadingCharacters = true; // 开始加载
      try {
        const apiUrl = process.env.VUE_APP_API_BASE_URL 
          ? `${process.env.VUE_APP_API_BASE_URL}/character`
          : '/character';
        
        const response = await this.$http.get(apiUrl, {
          params: {
            user_id: this.id
          },
          headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
          }
        });
        
        if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
          this.characterArr = response.data.data || response.data.message || response.data.list || [];
        }
      } catch (err) {
        console.error('获取我的角色失败:', err);
        this.characterArr = []; // 出错时设置为空数组
      } finally {
        this.loadingCharacters = false; // 加载完成
      }
    },
    // 删除角色
    handleDeleteCharacter(character) {
      const characterId = character.id || character._id;
      const characterName = character.character_name || '未命名角色';
      
      this.$confirm(`确定要删除角色"${characterName}"吗？删除后无法恢复。`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteCharacter(characterId);
      }).catch(() => {
        // 用户取消删除
      });
    },
    // 执行删除操作
    deleteCharacter(characterId) {
      // 先标记为删除中，触发动画
      this.deletingCharacterId = characterId;
      
      this.$http
        .delete(`/character/` + characterId, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success" || response.data.code === 0 || response.data.code === '0') {
            // 等待动画完成后再从数组中移除
            setTimeout(() => {
              const index = this.characterArr.findIndex(item => (item.id || item._id) === characterId);
              if (index !== -1) {
                this.characterArr.splice(index, 1);
              }
              this.deletingCharacterId = null;
              this.$message({
                message: '删除成功',
                type: 'success',
                duration: 2000
              });
            }, 400); // 等待缩小动画完成（300ms + 100ms缓冲）
          } else {
            this.deletingCharacterId = null;
            this.$message({
              message: response.data.message || '删除失败',
              type: 'error'
            });
          }
        })
        .catch((error) => {
          console.error('删除角色失败:', error);
          this.deletingCharacterId = null;
          this.$message({
            message: error.response?.data?.message || '删除失败，请稍后重试',
            type: 'error'
          });
        });
    },
    //获取我的插画
    async getIll(){
      this.loadingIll = true; // 开始加载
      try{
          let res=await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=`+this.id)
          // 根据API响应格式处理数据
          if (res.data && (res.data.code === 0 || res.data.code === '0' || res.data.desc === 'success')) {
            this.illArr = res.data.message || [];
          } else {
            this.illArr = [];
            console.warn('获取插画数据格式异常:', res.data);
          }
          console.log('我的插画数据:', this.illArr)
        } catch(err){
          console.error('获取我的插画失败:', err);
          this.illArr = []; // 出错时设置为空数组
          this.$message.error('加载插画失败，请稍后重试');
        } finally {
          this.loadingIll = false; // 加载完成
        }
    },
   // 获取我的绘本
    async getBook(){
      this.loadingBooks = true; // 开始加载
      try{
          let res=await this.$http.get(`/book/?sort_param=createdAt&sort_num=desc&ownerid=`+this.id)
          // 根据API响应格式处理数据
          if (res.data && (res.data.code === 0 || res.data.code === '0' || res.data.desc === 'success')) {
            this.toolArr = res.data.message || [];
            
            // 先只加载封面图片（第一张），快速显示
            await this.loadBookCovers();
            
            // 保存到store，让页面先显示出来
            this.setBooks();
            
            // 然后在后台异步加载所有图片URL（不阻塞显示）
            this.loadAllBookImages();
          } else {
            this.toolArr = [];
            console.warn('获取绘本数据格式异常:', res.data);
          }
          console.log('我的绘本数据:', this.toolArr)
        } catch(err){
          console.error('获取我的绘本失败:', err);
          this.toolArr = []; // 出错时设置为空数组
          this.$message.error('加载绘本失败，请稍后重试');
        } finally {
          this.loadingBooks = false; // 加载完成
        }
    },
    
    // 只加载绘本封面（第一张图片），快速显示
    async loadBookCovers(){
      this.loadingBookCovers = true;
      const coverPromises = [];
      
      for(let i = 0; i < this.toolArr.length; i++){
        const book = this.toolArr[i];
        if(book.content && book.content.length > 0 && typeof book.content[0] === 'string'){
          // 如果第一项是图片ID（字符串），需要获取URL
          const coverId = book.content[0];
          coverPromises.push(
            this.$http.get(`/ill/${coverId}`)
              .then(res => {
                if(res.data && res.data.message && res.data.message.content){
                  // 只更新封面（第一张图片）
                  this.toolArr[i].content[0] = res.data.message.content;
                }
              })
              .catch(err => {
                console.error(`加载绘本封面失败 (ID: ${coverId}):`, err);
              })
          );
        }
      }
      
      // 并行加载所有封面
      await Promise.allSettled(coverPromises);
      this.loadingBookCovers = false;
    },
    
    // 后台加载所有图片URL（不阻塞显示）
    async loadAllBookImages(){
      for(let i = 0; i < this.toolArr.length; i++){
        const book = this.toolArr[i];
        if(book.content && Array.isArray(book.content)){
          // 从第二张图片开始加载（第一张封面已经加载了）
          for(let j = 1; j < book.content.length; j++){
            if(typeof book.content[j] === 'string'){
              // 如果是图片ID（字符串），需要获取URL
              try{
                const res = await this.$http.get(`/ill/${book.content[j]}`);
                if(res.data && res.data.message && res.data.message.content){
                  this.toolArr[i].content[j] = res.data.message.content;
                  // 更新store中的数据
                  this.setBooks();
                }
              } catch(err){
                console.error(`加载绘本图片失败 (ID: ${book.content[j]}):`, err);
              }
            }
          }
        }
      }
    },
    
    //获取我的绘本的图片（保留原方法，以防需要）
    async getImgUrl(){
      for(var i=0;i<this.toolArr.length;i++){
        //获取绘本图片ID
        let tool=this.toolArr[i].content
        //遍历绘本图片ID，替换成图片URL
        for(var j=0;j<tool.length;j++){
          if(typeof tool[j] === 'string'){
            // 如果是图片ID（字符串），需要获取URL
            try{
              let res=await this.$http.get(`/ill/`+tool[j])
              this.toolArr[i].content[j]=res.data.message.content
            } catch(err){
              console.log(err)
            }
          }
        } 
      }  
    },
    
    setBooks(){
      this.$store.commit("addMyBooks",this.toolArr)  
    },

 

  },
  async mounted(){
    // 检查路由参数，如果有 tab 参数，切换到对应的标签
    const tab = this.$route.query.tab;
    if (tab) {
      this.activeIndex = String(tab);
      // 直接加载对应标签的数据
      if (tab === '2') {
        // 我的角色
        await this.getCharacters();
      } else if (tab === '3') {
        // 我的插画
        await this.getIll();
      } else if (tab === '4') {
        // 我的绘本
        await this.getBook();
      }
    } else {
      // 默认显示"我的角色"标签，加载角色数据
      this.activeIndex = "2";
      await this.getCharacters();
    }
  }
};
</script>

<style scoped>
.container {
  width: 100vw;
  background-color: #f5f6fa;
  color: #333;
  margin: 0;
  min-height: 90vh;
  display: flex;

}
.container .left {
  width: 80vw;
  height: 90vh;
  margin-left: 10vw;
  
}
.el-menu.el-menu--horizontal {
  border: none;
  border-radius: 4px;
}
.container .left .illustration,
.books {
  width:100%;
  padding:2vw;
  min-height: 38vh;
  background-color: #fff;
  margin-top: 8px;
  font-size: 18px;
  border-radius: 4px;
}
.container .left .illustration .title {
  margin-bottom: 4vh;
  display: flex;
  justify-content: space-between;
}
.container .left .books .title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4vh;
}
.container .left .illustration ul {
  list-style: none;
  display: flex;
  justify-content: space-between;
}
.container .left .illustration ul li {
  width: 14vw;
  height: 9.85vw;
  background-color: #f5f6fa;
  cursor: pointer;
 border-radius: 4px;
}
.container .left .books ul {
  list-style: none;
  
  display: flex;
  justify-content: space-between;
}
.container .left .books ul li {
  width: 14vw;
  height: 9.85vw;
  background-color: #f5f6fa;
  cursor: pointer;
  border-radius: 4px;
}
.container .right {
  width: 20vw;
  min-height: 90vh;
}
.container .right .message {
  width: 20vw;
  height: 12vw;
  margin-bottom: 8px;
  background-color: #fff;
  border-radius: 4px;
}
.container .right .message li {
  height: 3vw;
  line-height: 3vw;
  padding-left: 2vw;
  font-size: 14px;
  display: flex;
justify-content: flex-start;
align-items: center;

}
.container .right .message li span{
  height:18px;
  font-size:12px;
  background-color: #f56c6c;
  color:#fff;
  display: block;
  min-width:24px;
  line-height:18px;
  margin-left: 8px;
  padding:0 8px;
  border-radius: 18px;
  text-align: center;
}
.container .right .create {
  width: 20vw;
  background-color: #fff;
  list-style: none;
  display: flex;
 
  padding: 2vw 2vw 0 2vw;
  flex-wrap: wrap;
  border-radius: 4px;
}
.container .right .create li {
  width: 240px;
  height: 80px;
  font-size: 18px;
  line-height: 80px;
  padding: 0 16px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 2vw;
  font-weight: 500;
}
.container .right .create li:first-child {
  background-color: #b8E2b1;
}
.container .right .create li span {
  margin-left: 8px;
}
.container .right .create li:hover {
  background-color: #f5f6fa;
}
/* 我的插画页面样式 */
.index2 {
  width: calc(72vw - 8px);;
  height: calc(100vh - 140px);
  background-color: #fff;
  margin-top: 8px;
  padding: 2vw;
  margin-bottom: 8px;
  font-size: 18px;
  border-radius: 4px;
  overflow-y: scroll;
  overflow-x: hidden;
}
.index2 .index2-items {
  list-style: none;
  width: 68vw;
}
.index2 .index2-items .index2-item {
  height: 208px;
  padding:16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
   
    border-bottom: 1px solid rgb(238, 238, 238);
}
.index2 .index2-items .index2-item .index2-avatar {
  width: 250px;
  height: 176px;
  margin-right: 16px;
}
.index2 .index2-items .index2-item .index2-center {
  width: 500px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 144px;
}
.index2 .index2-items .index2-item .index2-center .index2-name p:nth-child(2) {
  font-size: 14px;
}

.index2 .index2-items .index2-item .index2-center.index2-icon {
  display: flex;
  height:18px;
  justify-content: space-between;
  font-size: 14px;
  width:500px;
}
.index2 .index2-items .index2-item .index2-center.index2-icon div {
  display: inline-block;
  width: 60px;
}
/* 我的关注页面样式 */

.index5 {
  width: 72vw;
  height: 90vh;
  background-color: #fff;
  margin-top: 8px;
  padding: 2vw;
  font-size: 18px;
  border-radius: 4px;
  overflow-y: scroll; 
}
.index5-focus{
    display: flex;
    height:152px;
    padding:16px 0 ;
    justify-content: space-between;
    box-sizing: border-box;
   
    border-bottom: 1px solid rgb(238, 238, 238);
   
}
.index5-info{
    width:55vw;
     
}
.el-descriptions-item__label {
display: -webkit-box!important;
-webkit-box-orient: vertical;
-webkit-line-clamp: 2;
line-clamp: 2;
overflow: hidden;
}
/* 卡片容器样式 */
.card-container {
  width: 80vw;
  height: calc(100vh - 140px);
  background-color: #fff;
  margin-top: 8px;
  padding: 2vw;
  margin-bottom: 8px;
  border-radius: 4px;
  overflow-y: auto;
  overflow-x: hidden;
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

.card-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  gap: 16px;
}

.card-status {
  margin-bottom: 12px;
}

.card-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #909399;
  font-size: 16px;
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
  
  .card-container {
    width: calc(100vw - 16px);
    padding: 16px;
  }
}

.active-scrollbar{
  height:calc(100vh-140px)
}
</style>