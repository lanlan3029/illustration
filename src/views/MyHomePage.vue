<template>
  <div class="container">
    <div class="left">

      <!-- 手机端个人头部卡（对齐设计稿「我的」） -->
      <div class="mobile-profile only-mobile">
        <div class="mp-card">
          <img class="mp-avatar" :src="(userInfo && userInfo.avatar) ? userInfo.avatar : defaultAvatar" alt="avatar" />
          <div class="mp-meta">
            <div class="mp-name">
              <span class="mp-name-text">{{ (userInfo && userInfo.name) || $t('myHomePage.unknown') }}</span>
              <span class="mp-vip">VIP</span>
            </div>
            <div class="mp-points">
              <img src="@/assets/logo/count.png" alt="积分" class="mp-points-icon" />
              <span>{{ (userInfo && (userInfo.points || userInfo.credits)) || 0 }}</span>
            </div>
          </div>
          <button type="button" class="mp-action" @click="goProfile">{{ $t('nav.accountSettings') || '设置' }}</button>
        </div>
        <div class="mp-quick">
          <button type="button" class="mp-quick-item" @click="goRecharge">
            <span class="mp-quick-ico mp-quick-ico--vip">★</span>
            <span>{{ $t('nav.subscription') || '会员' }}</span>
          </button>
          <button type="button" class="mp-quick-item" @click="goHome">
            <span class="mp-quick-ico mp-quick-ico--home">⌂</span>
            <span>{{ $t('nav.home') || '首页' }}</span>
          </button>
          <button type="button" class="mp-quick-item" @click="goProfile">
            <span class="mp-quick-ico mp-quick-ico--set">⚙</span>
            <span>{{ $t('nav.accountSettings') || '设置' }}</span>
          </button>
        </div>
      </div>

      <el-menu
        :default-active="activeIndex"
        class="el-menu-demo"
        mode="horizontal"
        @select="handleSelect"
      >
       
        <el-menu-item index="2">{{ $t('myHomePage.myCharacters') }}</el-menu-item>
        <el-menu-item index="3">{{ $t('myHomePage.myIllustrations') }}</el-menu-item>
        <el-menu-item index="4">{{ $t('myHomePage.myBooks') }}</el-menu-item>
        <el-menu-item index="6">{{ $t('myHomePage.collectedBooks') }}</el-menu-item>
       
      </el-menu>

   

      <!-- 我的角色 -->
      <div v-if="activeIndex == 2" class="card-container">
        <!-- 加载中 -->
        <div v-if="loadingCharacters" class="empty-state">
          <p>{{ $t('myHomePage.loading') }}</p>
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
                fit="contain"
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
              <h3 class="card-title">{{item.character_name || $t('myHomePage.unnamedCharacter')}}</h3>
              <p class="card-meta">{{ $t('myHomePage.createTime') }}{{item.created_at || item.createdAt || $t('myHomePage.unknown')}}</p>
              <div class="card-actions">
                <el-button size="small" type="primary" @click="goEditCharacter(item)">{{ $t('myHomePage.edit') }}</el-button>
                <el-button size="small" @click="goCreateGroupImages(item.id || item._id)">{{ $t('myHomePage.createGroupImages') }}</el-button>
                <el-button size="small" color="#626aef" @click="goCharacterGroupImages(item.id || item._id)">{{ $t('myHomePage.viewGroupImages') }}</el-button>
                <el-button size="small" type="danger" @click="handleDeleteCharacter(item)">{{ $t('myHomePage.delete') }}</el-button>
              </div>
            </div>
          </el-card>
        </transition-group>
        <!-- 加载完成但没有角色 -->
        <div v-else class="empty-state">
          <p>{{ $t('myHomePage.noCharacters') }}</p>
        </div>
      </div>
<!-- 我的插画 -->
      <div
        v-if="activeIndex == 3"
        class="card-container"
        v-infinite-scroll="loadMoreIllus"
        :infinite-scroll-disabled="illScrollDisabled"
        :infinite-scroll-distance="120">
        <!-- 加载中（首次） -->
        <div v-if="loadingIll && illArr.length === 0" class="empty-state">
          <p>{{ $t('myHomePage.loading') }}</p>
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
            <div class="card-image" @click="showImagePreview(`https://static.kidstory.cc/${item.content}`)">
              <el-image
                :src="`https://static.kidstory.cc/${item.content}`"
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
              <h3 class="card-title">{{item.title || $t('myHomePage.unnamedIllustration')}}</h3>
             

              <div class="card-actions">
                <el-button size="small" type="primary" @click="goEdition(item)">{{ $t('myHomePage.edit') }}</el-button>
                <el-button
                  size="small"
                  :loading="downloadingIllId === item._id"
                  @click="downloadIll(item)"
                >{{ $t('myHomePage.download') }}</el-button>
                <el-button size="small" type="danger" @click="handleDeleteIll(item)">{{ $t('myHomePage.delete') }}</el-button>
              </div>
            </div>
          </el-card>
        </transition-group>
        <!-- 加载完成但没有插画 -->
        <div v-else-if="!loadingIll" class="empty-state">
          <p>{{ $t('myHomePage.noIllustrations') }}</p>
        </div>
        <!-- 加载更多时底部提示 -->
        <div v-if="loadingIll && illArr.length > 0" class="load-more-tip">
          <p>{{ $t('myHomePage.loading') }}</p>
        </div>
        <div v-else-if="hasMoreIllus === false && illArr.length > 0" class="load-more-tip">
          <p>{{ $t('myHomePage.noMore') }}</p>
        </div>
      </div>
<!-- 我的绘本 -->
      <div
        v-if="activeIndex == 4"
        class="card-container"
        v-infinite-scroll="loadMoreBooks"
        :infinite-scroll-disabled="bookScrollDisabled"
        :infinite-scroll-distance="120">
        <!-- 加载中（首次） -->
        <div v-if="loadingBooks && (!myBooks || myBooks.length === 0)" class="empty-state">
          <p>{{ $t('myHomePage.loading') }}</p>
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
            <div class="card-image" @click="goReadBook(item._id)">
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
              <div class="card-header">
                <h3 class="card-title">{{item.title || $t('myHomePage.unnamedBook')}}</h3>
                <el-tag 
                  :type="getBookStatusType(item.status)" 
                  size="small" 
                  class="book-status-tag"
                >
                  {{ getBookStatusLabel(item.status) }}
                </el-tag>
              </div>
              <p class="card-description">{{item.description || $t('myHomePage.noDescription')}}</p>
              
             
              <div class="card-actions">
                <el-button size="small" type="primary" @click="goEditBook(item._id)">{{ $t('myHomePage.edit') }}</el-button>
                <el-button size="small" type="danger" @click="handleDeleteBook(item)">{{ $t('myHomePage.delete') }}</el-button>
              </div>
            </div>
          </el-card>
        </transition-group>
        <!-- 加载完成但没有绘本 -->
        <div v-else-if="!loadingBooks" class="empty-state">
          <p>{{ $t('myHomePage.noBooks') }}</p>
        </div>
        <!-- 加载更多时底部提示 -->
        <div v-if="loadingBooks && myBooks && myBooks.length > 0" class="load-more-tip">
          <p>{{ $t('myHomePage.loading') }}</p>
        </div>
        <div v-else-if="hasMoreBooks === false && myBooks && myBooks.length > 0" class="load-more-tip">
          <p>{{ $t('myHomePage.noMore') }}</p>
        </div>
      </div>

<!-- 已收藏插画 -->
      <div v-if="activeIndex == 5" class="card-container">
       <my-collection-ill/>
      </div>

<!-- 已收藏绘本 -->
      <div v-if="activeIndex == 6" class="card-container">
       <my-collection-book />
      </div>

<!-- 我的关注 -->
      <div v-if="activeIndex == 7" class="card-container">
       <my-attention />    
      </div>

<!-- 我的粉丝 -->
      <div v-if="activeIndex == 8" class="card-container">
       <my-fans />    
      </div>

    </div>
 
  </div>

  <!-- 图片预览遮罩层 -->
  <transition name="fade">
    <div v-if="showImagePreviewModal" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-container" @click.stop>
        <img
          :src="previewImageUrl"
          class="preview-image"
          :alt="$t('myHomePage.previewImage')"
          @error="handleImageError"
        />
        <div class="preview-close" @click="closeImagePreview">
          <el-icon class="preview-close-icon">
            <CloseBold />
          </el-icon>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import {mapState} from "vuex"
import { ElMessage } from 'element-plus'
import { CloseBold } from '@element-plus/icons-vue'
import MyCollectionIll from '../components/MyCollectionIll.vue'
import MyCollectionBook from '../components/MyCollectionBook.vue'
import MyAttention from '../components/MyAttention.vue'
import MyFans from '../components/MyFans.vue'
import { setEditorproPendingImage } from '@/utils/editorproPendingImage'
export default {
  components:{
MyCollectionIll,MyCollectionBook,MyAttention,MyFans,CloseBold
  },
  data() {
    return {
      id:localStorage.getItem("id"),
      defaultAvatar: require('@/assets/images/magic 2.svg'),
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
      downloadingIllId: null, // 正在下载的插画ID
      deletingBookId: null, // 正在删除的绘本ID
      showImagePreviewModal: false, // 是否显示图片预览遮罩
      previewImageUrl: '', // 预览的图片URL

      // 我的插画 - 分页/滚动加载
      illPage: 1,
      illPerPage: 20,
      illScrollDisabled: false,
      hasMoreIllus: true,

      // 我的绘本 - 分页/滚动加载
      bookPage: 1,
      bookPerPage: 20,
      bookScrollDisabled: false,
      hasMoreBooks: true,
    };
  },
  computed:mapState([
        "myBooks",
        "userInfo"
    ]),
  methods: {
    goProfile() {
      this.$router.push("/user/profile");
    },
    goRecharge() {
      this.$router.push("/member/recharge");
    },
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
      this.$router.push("/editorpro");
    },
   goLocalIllus(){
       this.$router.push("/user/upload/upload-local-book");
   },
   goHome(){
       this.$router.push("/");
   },
    showImagePreview(imageUrl) {
      this.previewImageUrl = imageUrl
      this.showImagePreviewModal = true
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    },
    closeImagePreview() {
      this.showImagePreviewModal = false
      this.previewImageUrl = ''
      // 恢复背景滚动
      document.body.style.overflow = ''
    },
    handleImageError(e) {
      console.error('图片加载失败:', e)
      ElMessage.error(this.$t('myHomePage.imageLoadFailed'))
    },
    // 查看我的绘本：进入阅读页
    goReadBook(id){
      this.$router.push({
        name: 'user-bookdetails',
        params: { bookId: id }
      });
    },
    // 编辑我的绘本：进入本地绘本上传编辑页
    goEditBook(id){
      this.$router.push({
        name: 'upload-local-book',
        query: { bookId: id, mode: 'edit' }
      });
    },
    
    // 获取绘本状态标签文本
    getBookStatusLabel(status) {
      // 如果 status 未定义或为 null，默认为 1（待审核）
      const bookStatus = status !== undefined && status !== null ? status : 1;
      
      if (bookStatus === 0) {
        return this.$t('myHomePage.bookStatus.published');
      } else if (bookStatus === 1) {
        return this.$t('myHomePage.bookStatus.pending');
      } else if (bookStatus === -1) {
        return this.$t('myHomePage.bookStatus.rejected');
      }
      // 默认返回待审核
      return this.$t('myHomePage.bookStatus.pending');
    },
    
    // 获取绘本状态标签类型（用于 el-tag 的 type 属性）
    getBookStatusType(status) {
      // 如果 status 未定义或为 null，默认为 1（待审核）
      const bookStatus = status !== undefined && status !== null ? status : 1;
      
      if (bookStatus === 0) {
        return 'success'; // 已发布 - 绿色
      } else if (bookStatus === 1) {
        return 'warning'; // 待审核 - 橙色
      } else if (bookStatus === -1) {
        return 'danger'; // 审核未通过 - 红色
      }
      // 默认返回 warning
      return 'warning';
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
                    ElMessage.error(this.$t('myHomePage.getIllustrationInfoFailed'));
                    return;
                }
            }

            if (!imageUrl) {
                ElMessage.error(this.$t('myHomePage.cannotGetIllustrationImage'));
                return;
            }

            setEditorproPendingImage(imageUrl, {
                illId: item._id,
                title: item.title || ''
            });
            this.$router.push('/editorpro');
        } catch (error) {
            console.error('编辑插画失败:', error);
            ElMessage.error(this.$t('myHomePage.editIllustrationFailed'));
        }
    },
    async downloadIll(item) {
      const illId = item._id;
      if (this.downloadingIllId === illId) return;

      const imageUrl = this.getImageUrl(item.content);
      if (!imageUrl) {
        ElMessage.error(this.$t('myHomePage.cannotGetIllustrationImage'));
        return;
      }

      this.downloadingIllId = illId;
      try {
        const ext = this.getIllDownloadExt(imageUrl, item.content);
        const baseName = (item.title || this.$t('myHomePage.unnamedIllustration'))
          .replace(/[\\/:*?"<>|]/g, '_');
        const filename = `${baseName}.${ext}`;

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        ElMessage.success(this.$t('myHomePage.downloadSuccess'));
      } catch (error) {
        console.error('下载插画失败:', error);
        try {
          const link = document.createElement('a');
          link.href = imageUrl;
          link.target = '_blank';
          link.rel = 'noopener';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          ElMessage.info(this.$t('myHomePage.downloadFallback'));
        } catch {
          ElMessage.error(this.$t('myHomePage.downloadFailed'));
        }
      } finally {
        this.downloadingIllId = null;
      }
    },
    getIllDownloadExt(url, content) {
      const src = (content || url || '').split('?')[0];
      const match = src.match(/\.(jpe?g|png|webp|gif)$/i);
      if (!match) return 'png';
      const ext = match[1].toLowerCase();
      return ext === 'jpeg' ? 'jpg' : ext;
    },
    // 处理删除插画（显示确认弹窗）
    handleDeleteIll(item) {
      const illustrationId = item._id;
      const illustrationName = item.title || this.$t('myHomePage.unnamedIllustration');

      this.$confirm(
        this.$t('myHomePage.confirmDeleteIllustration', { name: illustrationName }),
        this.$t('myHomePage.confirmDelete'),
        {
          confirmButtonText: this.$t('myHomePage.confirmDeleteButton'),
          cancelButtonText: this.$t('myHomePage.cancel'),
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
              ElMessage({
                message: this.$t('myHomePage.deleteSuccess'),
                type: 'success',
                duration: 2000
              });
            }, 400); // 等待缩小动画完成（300ms + 100ms缓冲）
          } else {
            this.deletingIllId = null;
            ElMessage({
              message: response.data.message || this.$t('myHomePage.deleteFailed'),
              type: 'error'
            });
          }
        })
        .catch((error) => {
          console.error('删除插画失败:', error);
          this.deletingIllId = null;
          ElMessage({
            message: error.response?.data?.message || this.$t('myHomePage.deleteFailedRetry'),
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
      const bookName = item.title || this.$t('myHomePage.unnamedBook');
      
      this.$confirm(
        this.$t('myHomePage.confirmDeleteBook', { name: bookName }),
        this.$t('myHomePage.confirmDelete'),
        {
          confirmButtonText: this.$t('myHomePage.confirmDeleteButton'),
          cancelButtonText: this.$t('myHomePage.cancel'),
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
              // 从 store 的 myBooks 中移除（通过 mutation）
              const currentBooks = [...this.myBooks];
              const index = currentBooks.findIndex(item => item._id === bookId);
              if (index !== -1) {
                currentBooks.splice(index, 1);
                // 更新 store
                this.$store.commit("addMyBooks", currentBooks);
                // 同时更新 toolArr 保持同步
                const toolArrIndex = this.toolArr.findIndex(item => item._id === bookId);
                if (toolArrIndex !== -1) {
                  this.toolArr.splice(toolArrIndex, 1);
                }
              }
              this.deletingBookId = null;
              ElMessage({
                message: this.$t('myHomePage.deleteSuccess'),
                type: 'success',
                duration: 2000
              });
            }, 400); // 等待缩小动画完成（300ms + 100ms缓冲）
          } else {
            this.deletingBookId = null;
            ElMessage({
              message: response.data.message || this.$t('myHomePage.deleteFailed'),
              type: 'error'
            });
          }
        })
        .catch((error) => {
          console.error('删除绘本失败:', error);
          this.deletingBookId = null;
          ElMessage({
            message: error.response?.data?.message || this.$t('myHomePage.deleteFailedRetry'),
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
    goEditCharacter(character) {
      const imageUrl = this.getImageUrl(character.image_url || character.character_image_url);
      if (!imageUrl) {
        ElMessage.error(this.$t('myHomePage.cannotGetIllustrationImage'));
        return;
      }
      setEditorproPendingImage(imageUrl, {
        characterId: character.id || character._id,
        title: character.character_name || ''
      });
      this.$router.push('/editorpro');
    },
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
        ElMessage.warning(this.$t('myHomePage.characterNotFound'));
      }
    },
    
    // 预拉取角色下的插画，再跳转到角色组图页
    async goCharacterGroupImages(characterId) {
      // 将角色ID保存到localStorage，供组图页面使用
      localStorage.setItem('viewCharacterId', String(characterId));

      // 预先拉取 character_id 对应的插画，便于组图页直接使用
      try {
        const token = localStorage.getItem('token') || '';
        const res = await this.$http.get(`/ill`, {
          params: {
            character_id: characterId,
            sort_param: 'createdAt',
            sort_num: 'desc'
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data && (res.data.code === 0 || res.data.code === '0' || res.data.desc === 'success')) {
          const illustrations = res.data.message || res.data.data || [];
          localStorage.setItem('characterIllustrationsForView', JSON.stringify({
            characterId,
            illustrations
          }));
        } else {
          // 若接口返回异常，仍然继续跳转
          console.warn('获取角色关联插画失败:', res.data);
        }
      } catch (error) {
        console.error('预拉取角色关联插画失败:', error);
        // 不阻断导航
      }

      // 跳转到组图页面（复用 character-group-images 页面）
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
            ownerid: this.id
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
      const characterName = character.character_name || this.$t('myHomePage.unnamedCharacter');

      this.$confirm(this.$t('myHomePage.confirmDeleteCharacter', { name: characterName }), this.$t('myHomePage.confirmDelete'), {
        confirmButtonText: this.$t('myHomePage.confirmDeleteButton'),
        cancelButtonText: this.$t('myHomePage.cancel'),
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
              ElMessage({
                message: this.$t('myHomePage.deleteSuccess'),
                type: 'success',
                duration: 2000
              });
            }, 400); // 等待缩小动画完成（300ms + 100ms缓冲）
          } else {
            this.deletingCharacterId = null;
            ElMessage({
              message: response.data.message || this.$t('myHomePage.deleteFailed'),
              type: 'error'
            });
          }
        })
        .catch((error) => {
          console.error('删除角色失败:', error);
          this.deletingCharacterId = null;
          ElMessage({
            message: error.response?.data?.message || this.$t('myHomePage.deleteFailedRetry'),
            type: 'error'
          });
        });
    },
    //获取我的插画（第 1 页）
    async getIll(){
      this.illPage = 1
      this.hasMoreIllus = true
      this.illScrollDisabled = false
      this.loadingIll = true
      try{
          const token = localStorage.getItem('token')
          const headers = {}
          if (token && token !== 'undefined') {
            headers['Authorization'] = `Bearer ${token}`
          }

          const res = await this.$http.get(
            `/ill/?page=1&sort_param=createdAt&sort_num=desc`,
            { headers }
          )
          if (res.data && (res.data.code === 0 || res.data.code === '0' || res.data.desc === 'success')) {
            const list = res.data.message || []
            this.illArr = Array.isArray(list) ? list : []
            // 后端未明确 perPage 时，避免用条数误判“没有更多”
            // 仅当后续某页返回空数组时再判定没有更多
          } else {
            this.illArr = []
            this.hasMoreIllus = false
            console.warn('获取插画数据格式异常:', res.data)
          }
        } catch(err){
          console.error('获取我的插画失败:', err)
          this.illArr = []
          this.hasMoreIllus = false
          ElMessage.error(this.$t('myHomePage.loadIllustrationsFailed'))
        } finally {
          this.loadingIll = false
        }
    },

    // 滚动加载更多插画
    async loadMoreIllus() {
      if (this.loadingIll || this.illScrollDisabled || !this.hasMoreIllus) return
      if (this.activeIndex !== '3') return

      const nextPage = this.illPage + 1
      this.illScrollDisabled = true
      this.loadingIll = true
      try {
        const token = localStorage.getItem('token')
        const headers = {}
        if (token && token !== 'undefined') {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await this.$http.get(
          `/ill/?page=${nextPage}&sort_param=createdAt&sort_num=desc`,
          { headers }
        )
        const list = res.data?.message || res.data?.data || []
        const newIllus = Array.isArray(list) ? list : []
        if (newIllus.length === 0) {
          this.hasMoreIllus = false
          return
        }

        const existing = new Set(this.illArr.map(i => i?._id).filter(Boolean))
        const merged = newIllus.filter(i => !i?._id || !existing.has(i._id))
        this.illArr.push(...merged)
        this.illPage = nextPage

        // 同上：不使用返回条数 < perPage 来判断是否结束
      } catch (err) {
        console.error('加载更多插画失败:', err)
        this.illScrollDisabled = false
      } finally {
        this.loadingIll = false
        this.illScrollDisabled = false
      }
    },

   // 获取我的绘本（第 1 页）
    async getBook(){
      this.bookPage = 1
      this.hasMoreBooks = true
      this.bookScrollDisabled = false
      this.loadingBooks = true
      try{
          const token = localStorage.getItem('token')
          const headers = {}
          if (token && token !== 'undefined') {
            headers['Authorization'] = `Bearer ${token}`
          }
          
          const res = await this.$http.get(
            `/book/?page=1&sort_param=createdAt&sort_num=desc&ownerid=${this.id}`,
            { headers }
          )
          if (res.data && (res.data.code === 0 || res.data.code === '0' || res.data.desc === 'success')) {
            const list = res.data.message || []
            this.toolArr = Array.isArray(list) ? list : []
            // 后端未明确 perPage 时，避免用条数误判“没有更多”
            // 仅当后续某页返回空数组时再判定没有更多

            await this.loadBookCovers()
            this.setBooks()
            this.loadAllBookImages()
          } else {
            this.toolArr = []
            this.hasMoreBooks = false
            console.warn('获取绘本数据格式异常:', res.data)
          }
        } catch(err){
          console.error('获取我的绘本失败:', err)
          this.toolArr = []
          this.hasMoreBooks = false
          ElMessage.error(this.$t('myHomePage.loadBooksFailed'))
        } finally {
          this.loadingBooks = false
        }
    },

    // 滚动加载更多绘本
    async loadMoreBooks(){
      if (this.loadingBooks || this.bookScrollDisabled || !this.hasMoreBooks) return
      if (this.activeIndex !== '4') return

      const nextPage = this.bookPage + 1
      this.bookScrollDisabled = true
      this.loadingBooks = true
      try {
        const token = localStorage.getItem('token')
        const headers = {}
        if (token && token !== 'undefined') {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await this.$http.get(
          `/book/?page=${nextPage}&sort_param=createdAt&sort_num=desc&ownerid=${this.id}`,
          { headers }
        )
        const list = res.data?.message || res.data?.data || []
        const newBooks = Array.isArray(list) ? list : []
        if (newBooks.length === 0) {
          this.hasMoreBooks = false
          return
        }

        this.toolArr.push(...newBooks)
        this.bookPage = nextPage

        await this.loadBookCovers()
        this.setBooks()
        this.loadAllBookImages()

        // 同上：不使用返回条数 < perPage 来判断是否结束
      } catch (err) {
        console.error('加载更多绘本失败:', err)
        this.bookScrollDisabled = false
      } finally {
        this.loadingBooks = false
        this.bookScrollDisabled = false
      }
    },
    
    // 只加载绘本封面（第一张图片），快速显示
    async loadBookCovers(){
      this.loadingBookCovers = true;
      const coverPromises = [];
      
      // 获取 token 并添加到请求头
      const token = localStorage.getItem('token');
      const headers = {};
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      for(let i = 0; i < this.toolArr.length; i++){
        const book = this.toolArr[i];
        if(book.content && book.content.length > 0 && typeof book.content[0] === 'string'){
          // 如果第一项是图片ID（字符串），需要获取URL
          const coverId = book.content[0];
          coverPromises.push(
            this.$http.get(`/ill/${coverId}`, { headers })
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
      // 获取 token 并添加到请求头
      const token = localStorage.getItem('token');
      const headers = {};
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      for(let i = 0; i < this.toolArr.length; i++){
        const book = this.toolArr[i];
        if(book.content && Array.isArray(book.content)){
          // 从第二张图片开始加载（第一张封面已经加载了）
          for(let j = 1; j < book.content.length; j++){
            if(typeof book.content[j] === 'string'){
              // 如果是图片ID（字符串），需要获取URL
              try{
                const res = await this.$http.get(`/ill/${book.content[j]}`, { headers });
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
      // 获取 token 并添加到请求头
      const token = localStorage.getItem('token');
      const headers = {};
      if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      for(var i=0;i<this.toolArr.length;i++){
        //获取绘本图片ID
        let tool=this.toolArr[i].content
        //遍历绘本图片ID，替换成图片URL
        for(var j=0;j<tool.length;j++){
          if(typeof tool[j] === 'string'){
            // 如果是图片ID（字符串），需要获取URL
            try{
              let res=await this.$http.get(`/ill/`+tool[j], { headers })
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
  width: 100%;
  background-color: #f5f6fa;
  color: #333;
  margin: 0;
  min-height: 90vh;
  display: flex;
  box-sizing: border-box;
}
/* 内容区改为「居中 + 最大宽度」，不再用 80vw/10vw 的视口比例布局 */
.container .left {
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  margin: 0 auto;
  box-sizing: border-box;
}
.el-menu.el-menu--horizontal {
  border: none;
  border-radius: 4px;
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
  width: 100%;
  height: calc(100vh - 140px);
  background-color: #fff;
  margin-top: 8px;
  padding: 20px;
  margin-bottom: 8px;
  border-radius: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 卡片网格布局 - 一行三个 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  width: calc((100% - 72px) / 4); /* 4列布局：3个gap共72px */
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

/* 图片预览遮罩层 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.image-preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10000;
}

.preview-close:hover {
  background-color: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.preview-close-icon {
  font-size: 20px;
  color: #303133;
}

/* 卡片内容区域 */
.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #303133;
  overflow: hidden;
  flex: 1;
  line-height: 1.4;
}

.book-status-tag {
  flex-shrink: 0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
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
  gap: 8px;
}

.card-actions :deep(.el-button) {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  padding: 8px 12px;
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

/* 响应式设计 - 平板改为两列（断点统一 1024） */
@media (max-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 手机端个人头部卡片（默认隐藏，only-mobile 控制显隐） */
.mobile-profile {
  margin-bottom: 12px;
}

.mp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: var(--kid-radius-lg, 22px);
  background: var(--kid-grad-hero, linear-gradient(135deg, #6a5af9 0%, #b79cf2 100%));
  box-shadow: var(--kid-shadow-card, 0 6px 20px -8px rgba(49, 35, 82, 0.18));
}

.mp-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  background: #fff;
}

.mp-meta {
  flex: 1;
  min-width: 0;
  text-align: left;
  color: #fff;
}

.mp-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
}

.mp-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.mp-vip {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #6a4f00;
  background: linear-gradient(135deg, #ffe08a, #ffc83d);
  padding: 2px 8px;
  border-radius: 999px;
}

.mp-points {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
}

.mp-points-icon {
  width: 15px;
  height: 15px;
}

.mp-action {
  flex-shrink: 0;
  border: none;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 999px;
  cursor: pointer;
}

.mp-action:active {
  transform: scale(0.96);
}

.mp-quick {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.mp-quick-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  border: none;
  border-radius: var(--kid-radius, 16px);
  background: var(--kid-card, #fff);
  box-shadow: var(--kid-shadow-soft, 0 2px 10px rgba(24, 24, 40, 0.06));
  color: var(--kid-text, #2b2b40);
  font-size: 12px;
  cursor: pointer;
}

.mp-quick-ico {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 18px;
  line-height: 1;
}

.mp-quick-ico--vip { background: #fff4d6; color: #e8a300; }
.mp-quick-ico--home { background: var(--kid-primary-soft, #efeaff); color: var(--kid-primary, #6c5ce7); }
.mp-quick-ico--set { background: #e7f6f1; color: #2bb894; }

/* 响应式设计 - 移动端改为单列（断点统一 768） */
@media (max-width: 768px) {
  .container {
    background: var(--kid-bg, #f5f6fb);
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .container .left {
    height: auto;
    min-height: 90vh;
    padding: 12px;
  }

  /* Tab 改为可横向滚动的胶囊条 */
  .el-menu.el-menu--horizontal {
    background: transparent;
    border-radius: var(--kid-radius, 16px);
    overflow-x: auto;
    flex-wrap: nowrap;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .el-menu.el-menu--horizontal :deep(.el-menu-item) {
    flex-shrink: 0;
  }

  .card-container {
    width: 100%;
    padding: 14px;
    height: auto;
    max-height: none;
    overflow: visible;
    border-radius: var(--kid-radius, 16px);
    box-shadow: var(--kid-shadow-soft, 0 2px 10px rgba(24, 24, 40, 0.06));
  }

  .active-scrollbar {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .content-card {
    border-radius: var(--kid-radius, 16px);
    overflow: hidden;
  }

  .card-image {
    height: 180px;
    border-radius: var(--kid-radius, 16px) var(--kid-radius, 16px) 0 0;
  }
}

.active-scrollbar{
  height:calc(100vh-140px)
}
</style>