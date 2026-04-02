<template>
   <div class="container">
    <div class="search">
     <el-input size="default" v-model="searchInput" prefix-icon="el-icon-search" placeholder="Enter something..." @input="loadSearch(searchInput)"/></div>
   <!--  显示搜索结果 -->
    <div v-if="(searchInput !='')" class="classify">
    <div
      ref="scrollContainerSearch"
      class="menu-right"
      :key="`search-${searchInput}`"
      v-infinite-scroll="searchLoad"
      :infinite-scroll-disabled="searchLoading || !searchHasMore"
      :infinite-scroll-distance="80"
    >
        <ul class="elements">
          <li class="element" v-for="(item,index) in searchArr" :key="`search-${item._id || index}-${index}`" @click="handleImageChange(getImageContent(item))">
              <el-image
                fit="contain"
                style="width:6vw; height:8vh; display: block; margin: 0 auto;"
                :src="getImageSrc(item)"
                :lazy="true"
                loading="lazy"
                decoding="async"
                :preview-src-list="[]"
                :scroll-container="$refs.scrollContainerSearch"
              >
                <template #placeholder>
                  <div class="img-ph"><i class="el-icon-loading"></i></div>
                </template>
                <template #error>
                  <div class="img-ph"><i class="el-icon-picture-outline"></i></div>
                </template>
              </el-image>
          </li>
        </ul>
        <div v-if="searchLoading && searchArr.length > 0" class="load-more-tip">加载中...</div>
        <div v-else-if="!searchHasMore && searchArr.length > 0" class="load-more-tip">没有更多了</div>
      </div>
    </div>
     <!-- 显示全部图元 -->
     <!-- infinite-scroll-disabled是控制是否允许无限滚动加载数据，而:disabled是控制是否禁用当前组件。
        在使用v-infinite-scroll指令时，如果infinite-scroll-disabled返回true，则该指令会被禁用，不再监听滚动事件。
        而:disabled则是在元素上添加或移除disabled属性，从而控制该元素是否可以被交互。 -->
     <div v-else class="classify">
    <ul class="menu">
        <li class="menu-item" v-for="item in icons" :key="item.id" @click="select(item.id,item.type)"  :class="{'active':item.id===selectIndex }">
          <el-tooltip :content="getTypeLabel(item.type)" placement="right" effect="dark">
            <i :class="item.icon"></i>
          </el-tooltip>
        </li>
    </ul>
    <div
      ref="scrollContainer"
      class="menu-right"
      :key="`menu-${selectType}`"
      v-infinite-scroll="load"
      :infinite-scroll-disabled="loading || !hasMore"
      :infinite-scroll-distance="80"
    >
        <ul class="elements" :key="`elements-${selectType}-${selectIndex}`">
        <li class="element" v-for="(item,index) in pictureArr" :key="`${selectType}-${selectIndex}-${item._id || item.content || index}-${index}`" @click="handleImageChange(getImageContent(item))">
            <el-image
              fit="contain"
              style="width:6vw; height:8vh; display: block; margin: 0 auto;"
              :src="getImageSrc(item)"
              :key="`img-${selectType}-${selectIndex}-${item._id || item.content || index}-${index}`"
              :lazy="true"
              loading="lazy"
              decoding="async"
              :preview-src-list="[]"
              :scroll-container="$refs.scrollContainer"
            >
              <template #placeholder>
                <div class="img-ph"><i class="el-icon-loading"></i></div>
              </template>
              <template #error>
                <div class="img-ph"><i class="el-icon-picture-outline"></i></div>
              </template>
            </el-image>
        </li>
        </ul>
        <div v-if="loading && pictureArr.length > 0" class="load-more-tip">加载中...</div>
        <div v-else-if="!hasMore && pictureArr.length > 0" class="load-more-tip">没有更多了</div>
    </div>
</div>
    
    <class-chart />
    </div> 

</template>

<script>
import {mapState} from "vuex"
import { ElMessage } from 'element-plus'
import ClassChart from './ClassChart.vue'
// 导入generateID
import generateID from "@/utils/generateID"
// 导入自定义样式的包
import {commonStyle,commonAttr} from "@/custom-component/component-list"


export default {
    components:{
        ClassChart
    },
    
    data(){
        return{
          icons:[
          {type:"charcter",icon:'iconfont icon-ren1',id:0,num:2},
            {type:"scene",icon:'iconfont icon-tupian',id:1,num:2},
          {type:"people",icon:'iconfont icon-renti',id:2,num:2},
          {type:"animal",icon:'iconfont icon--panda',id:3,num:2},
          {type:"plant",icon:'iconfont icon-shu3',id:4,num:2},
          {type:"food",icon:'iconfont icon-shiwu-2',id:5,num:2},
          {type:"toy",icon:'iconfont icon-jimu2',id:6,num:2},
          {type:"vehicle",icon:'iconfont icon-qichepiao',id:7,num:2},
          {type:"decoration",icon:'iconfont icon-zhuangshipin',id:8,num:2},
          {type:"furniture",icon:'iconfont icon-shafa1',id:9,num:2},
          {type:"others",icon:'iconfont icon-other',id:10,num:2}],
          pictureArr:[],
          page:1,
          hasMore:true,
          loading:false,
          selectType:'charcter',
          selectIndex:0,
          searchInput:'',
          searchArr:[],
          searchPage:1,
          searchHasMore:true,
          searchLoading:false,
          searchDebounceTimer:null
        }
    },
     computed:mapState([
        "componentData",
        "canvasStyleData",
        "curComponent"
    ]),
    methods:{
        // 获取类型的国际化标签
        getTypeLabel(type) {
            return this.$t(`leftMenu.${type}`);
        },
        // 请求第一页数据（初始化/切换类型时调用）
        async getPictures(){
            try{
                this.loading = true
                if (this.selectType === 'charcter') {
                    return await this.getMyCharacters()
                }
                const res = await this.$http.get(`/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=1`)
                const data = res.data || {}
                const list = data.message || data.data || data.list || data.items || []
                const items = Array.isArray(list) ? list : []
                this.pictureArr = items.slice()
                this.page = 2
                this.hasMore = items.length > 0
                this.loading = false
            } catch(error){
                console.error('加载图元失败:', error)
                this.pictureArr = []
                this.hasMore = false
                this.loading = false
                ElMessage.error('加载图元失败，请重试')
            }
        },
        
        // 获取"我的角色"（无分页，hasMore=false）
        async getMyCharacters(){
            try {
                this.loading = true
                const userId = localStorage.getItem('id')
                if (!userId) {
                    this.pictureArr = []
                    this.hasMore = false
                    this.loading = false
                    return
                }
                const apiUrl = process.env.VUE_APP_API_BASE_URL 
                    ? `${process.env.VUE_APP_API_BASE_URL}/character/`
                    : '/character/';
                const response = await this.$http.get(apiUrl, {
                    params: { ownerid: userId },
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
                });
                let characterList = []
                if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
                    characterList = response.data.data || response.data.message || response.data.list || []
                }
                const formattedList = (characterList || []).map(char => {
                    const imageUrl = char.image_url || char.character_image_url || ''
                    return { _id: char.id || char._id, content: imageUrl, ...char }
                })
                this.pictureArr = formattedList.slice()
                this.hasMore = false
                this.loading = false
            } catch (error) {
                console.error('获取我的角色失败:', error)
                this.pictureArr = []
                this.hasMore = false
                this.loading = false
            }
        },

       // 选择左侧类别
       async select(index, type){
            this.selectIndex = index
            this.selectType = type
            this.page = 1
            this.pictureArr = []
            this.hasMore = true
            this.$nextTick(() => {
              const container = this.$refs.scrollContainer
              if (container) container.scrollTop = 0
            })
            await this.getPictures()
        },
        
        // 无限加载下一页
        async load() {
            if (this.loading || !this.hasMore || this.selectType === 'charcter') return
            this.loading = true
            try {
                const res = await this.$http.get(
                    `/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=`+ this.page
                )
                const data = res.data || {}
                const newItems = data.message || data.data || data.list || data.items || []
                const list = Array.isArray(newItems) ? newItems : []
                if (list.length === 0) {
                    this.hasMore = false
                } else {
                    this.pictureArr.push(...list)
                    this.page += 1
                }
            } catch (err) {
                console.error('加载更多图元失败:', err)
                this.hasMore = false
            } finally {
                this.loading = false
            }
        },
 
 

              //转Base64
          getBase64(file){
             return new Promise(function(resolve,reject){
              let reader=new FileReader();
              let imgResult="";
              reader.readAsDataURL(file);
              reader.onload=function(){
                imgResult=reader.result
              };
              reader.onerror=function(error){
                reject(error)
              };
              reader.onloadend = function() {
                        resolve(imgResult);
                    };
             })
          },

          theImage(i){
             let IMAGE=new Image()
             IMAGE.src=('https://api.kidstory.cc/'+i)
             return [IMAGE.width,IMAGE.height]
          },
      
        // 获取图片显示URL
        getImageSrc(item) {
            if (!item) return ''
            let content = item.content
            // 如果content是数组，取第一个元素
            if (Array.isArray(content)) {
                content = content[0]
            }
            // 如果已经是完整URL，直接返回
            if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
                return content
            }
            // 否则添加静态资源前缀
            return `https://static.kidstory.cc/${content || ''}`
        },
        
        // 获取图片内容（用于点击处理）
        getImageContent(item) {
            if (!item) return ''
            let content = item.content
            // 如果content是数组，取第一个元素
            if (Array.isArray(content)) {
                content = content[0]
            }
            return content || ''
        },

        //把小图片添加到中间面板
       async handleImageChange(item){
        console.log(this.componentData)
        
        // 处理图片URL：如果是完整URL就直接使用，否则添加前缀
        let imageUrl = item
        if (typeof item === 'string') {
            if (!item.startsWith('http://') && !item.startsWith('https://') && !item.startsWith('data:')) {
                imageUrl = 'https://api.kidstory.cc/' + item
            }
        } else if (item && item.content) {
            // 如果item是对象，取content字段
            imageUrl = item.content
            if (typeof imageUrl === 'string' && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
                imageUrl = 'https://api.kidstory.cc/' + imageUrl
            }
        }
           
                      let IMAGE= new Image()
                      const self=this
                      IMAGE.onload=function(){
                        // 检查图片尺寸，如果超过600*450，按比例缩小到600*450以内
                        let finalWidth = IMAGE.width
                        let finalHeight = IMAGE.height
                        const maxWidth = 600
                        const maxHeight = 450
                        const targetWidth = 600
                        const targetHeight = 450
                        
                        // 如果宽度或高度超过限制，需要缩小
                        if (finalWidth > maxWidth || finalHeight > maxHeight) {
                            // 计算缩放比例：取宽度比例和高度比例中的较大值
                            const widthRatio = finalWidth / targetWidth
                            const heightRatio = finalHeight / targetHeight
                            const scaleRatio = Math.max(widthRatio, heightRatio)
                            
                            // 按比例缩小
                            finalWidth = Math.round(finalWidth / scaleRatio)
                            finalHeight = Math.round(finalHeight / scaleRatio)
                            
                            console.log(`图片尺寸 ${IMAGE.width}x${IMAGE.height} 超过限制，已缩小为 ${finalWidth}x${finalHeight}`)
                        }
                        
                        self.$store.commit("addComponent",{
                        component:{
                            ...commonAttr,
                            id:generateID(),
                            // 组件种类
                            component:"Picture",
                            label:"图片",
                            icon:"",
                            // 图片路径
                            propValue: imageUrl,
                            // 图片样式
                            style:{
                                ...commonStyle,
                                top:0,
                                left:0,
                                width:finalWidth,
                                height:finalHeight,
                            }
                        }
                    })
                      }
                      
                      IMAGE.src = imageUrl
                    
              
                    
                     
        },
        // 搜索关键字：初始化 page=1, list=[], hasMore=true，请求第 1 页
        loadSearch(value){
            clearTimeout(this.searchDebounceTimer)
            this.searchDebounceTimer = setTimeout(async () => {
              this.searchPage = 1
              this.searchArr = []
              this.searchHasMore = true
              try {
                const res = await this.$http.get(
                  `/picture/?sort_param=heat&sort_num=desc&keyword=`+ encodeURIComponent(value || '') +`&page=1`
                )
                const list = res.data.message || res.data.data || []
                const items = Array.isArray(list) ? list : []
                this.searchArr = items.slice()
                this.searchPage = 2
                this.searchHasMore = items.length > 0
              } catch (err) {
                console.log(err)
              }
            }, 300)
        },
        // 搜索结果无限加载
        async searchLoad() {
            if (this.searchLoading || !this.searchHasMore) return
            this.searchLoading = true
            try {
                const res = await this.$http.get(
                    `/picture/?sort_param=heat&sort_num=desc&keyword=`+ encodeURIComponent(this.searchInput || '') +`&page=`+ this.searchPage
                )
                const list = res.data.message || res.data.data || []
                const newItems = Array.isArray(list) ? list : []
                if (newItems.length === 0) {
                    this.searchHasMore = false
                } else {
                    this.searchArr.push(...newItems)
                    this.searchPage += 1
                }
            } catch (err) {
                console.log(err)
                this.searchHasMore = false
            } finally {
                this.searchLoading = false
            }
        },


    },
    mounted(){
        // 默认选中第一个类别（charcter）并加载"我的角色"
        this.select(0, 'charcter')
    },
    beforeDestory(){
       window.removeEventListener('scroll',this.load)
    },
    
    
}
</script>

<style scoped>
.container{
    width:19.5vw;
    height:calc(100vh - 90px);
    
}
.search{
    width:17.5vw;
    height:5vh;
    margin:1vh 0.5vw;
}
.classify{
    margin:0;
    padding:0;
    width:19.5vw;
    height:83vh;  
    display: flex;
    justify-content: space-between; 
    overflow-y: hidden; /* 避免与内层滚动容器竞争滚动 */
    position: relative;
}
.container .classify .menu{
    width:4vw;
    height:80vh;
    list-style: none;
    display: block;
    position: fixed;
}

.container .classify .menu li{
    height:7vh;
    line-height:7vh;
    cursor: pointer;
    font-size:24px; 
   text-align: center;
   border-radius: 0 4vh 4vh 0;
}
.menu-item .iconfont{
    font-size: 22px;
}

.menu-item:hover{
    background-color: #f5f6fa;
}
.active{
    background-color: #f5f6fa;
}
.menu-right{
    height:80vh;
    overflow-y: auto;
    width:16vw;
    position: relative;
    left:4vw;
    /* 保证滚动条可见区域 */
    overscroll-behavior: contain;
    /* 始终显示滚动条槽，确保布局稳定 */
    scrollbar-gutter: stable both-edges;
    -webkit-overflow-scrolling: touch;
    /* 确保在所有浏览器中表现一致 */
    min-height: 1px; /* 确保即使没有内容也能应用滚动条样式 */
    box-sizing: border-box;
}
.elements{
    width:15.5vw;
    display: flex;
    background-color: #fff;
    list-style: none;
    flex-wrap: wrap;
    align-content:flex-start;
    justify-content: flex-start;
    /* 让内容自然撑开，由父容器 menu-right 负责滚动 */
}

.element{
    width:6.5vw;
    height:8vh;
    background-color: #f5f6fa;
    border-radius: 4px;
    margin-right:0.5vw;
    margin-bottom: 1vh;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    /* 防止布局偏移 */
    min-height: 8vh;
    aspect-ratio: 6.5 / 8;
    position: relative;
    overflow: hidden;
}
.element:hover{
    background-color:#fafafa ;
}
.img-ph{
    width:100%;
    height:100%;
    min-height: 8vh;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#fafafa;
    color:#c0c4cc;
    position: absolute;
    top: 0;
    left: 0;
}
.img-ph i {
    font-size: 20px;
}
.img-ph .el-icon-loading {
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
.element :deep(.el-image) {
    width: 100%;
    height: 100%;
    background-color: #f5f6fa;
}
.element :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: opacity 0.3s ease;
}
.element :deep(.el-image__placeholder) {
    background-color: #fafafa;
}
.emptyResult{
    width:19.5vw;
    display: flex;  
    justify-content: center;
    align-content: center;
}
.load-more-tip {
    width: 100%;
    padding: 8px 0;
    text-align: center;
    font-size: 12px;
    color: #909399;
}
</style>