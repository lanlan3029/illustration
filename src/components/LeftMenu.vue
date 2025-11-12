<template>
   <div class="container">
    <div class="search">
     <el-input  size="medium" v-model="searchInput" prefix-icon="el-icon-search" placeholder="Enter something..." @input="loadSearch(searchInput)"/></div>
   <!--  显示搜索结果 -->
    <div v-if="(searchInput !='')" class="classify">
    <div
      ref="scrollContainer"
      class="menu-right"
      :key="`search-${searchInput}`"
      v-infinite-scroll="searchLoad"
      infinite-scroll-disabled="searchScrollDisabled"
      :disabled="searchLoading"
      :infinite-scroll-immediate="true"
    >
        <ul class="elements">
          <li class="element" v-for="(item,index) in searchArr" :key="`search-${item._id || index}-${index}`" @click="handleImageChange(item.content[0])">
              <el-image
                fit="cover"
                style="width:6vw; height:8vh"
                :src="`https://static.kidstory.cc/` + item.content"
                lazy
                :scroll-container="$refs.scrollContainer"
              >
                <div slot="placeholder" class="img-ph"><i class="el-icon-picture-outline"></i></div>
                <div slot="error" class="img-ph"><i class="el-icon-picture-outline"></i></div>
              </el-image>
          </li>
        </ul>
      </div>
    </div>
     <!-- 显示全部图元 -->
     <!-- infinite-scroll-disabled是控制是否允许无限滚动加载数据，而:disabled是控制是否禁用当前组件。
        在使用v-infinite-scroll指令时，如果infinite-scroll-disabled返回true，则该指令会被禁用，不再监听滚动事件。
        而:disabled则是在元素上添加或移除disabled属性，从而控制该元素是否可以被交互。 -->
     <div v-else class="classify">
    <ul class="menu">
        <li class="menu-item" v-for="item in icons" :key="item.id" @click="select(item.id,item.type,item.num)"  :class="{'active':item.id===selectIndex }"><i :class="item.icon"></i></li>
    </ul>
    <div
      ref="scrollContainer"
      class="menu-right"
      :key="`menu-${selectType}`"
      v-infinite-scroll="load"
      infinite-scroll-disabled="scrollDisabled"
      :disabled="loading"
      :infinite-scroll-immediate="true"
    >
        <ul class="elements">
        <li class="element" v-for="(item,index) in pictureArr" :key="`${selectType}-${item._id || item.content || index}-${index}`" @click="handleImageChange(item.content[0])">
            <el-image
              fit="contain"
              style="width:6vw; height:8vh"
              :src="`https://static.kidstory.cc/` + item.content"
              lazy
              :scroll-container="$refs.scrollContainer"
            >
              <div slot="placeholder" class="img-ph"><i class="el-icon-picture-outline"></i></div>
              <div slot="error" class="img-ph"><i class="el-icon-picture-outline"></i></div>
            </el-image>
        </li>

    </ul>
    </div>
</div>
    
    <class-chart />
    </div> 

</template>

<script>
import {mapState} from "vuex"
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
            {type:"scene",icon:'iconfont icon-tupian',id:0,num:2},
          {type:"people",icon:'iconfont icon-ren1',id:1,num:2},
          {type:"animal",icon:'iconfont icon--panda',id:2,num:2},
          {type:"plant",icon:'iconfont icon-shu3',id:3,num:2},
          {type:"food",icon:'iconfont icon-shiwu-2',id:4,num:2},
          {type:"toy",icon:'iconfont icon-jimu2',id:5,num:2},
          {type:"vehicle",icon:'iconfont icon-qichepiao',id:6,num:2},
          {type:"decoration",icon:'iconfont icon-zhuangshipin',id:7,num:2},
          {type:"furniture",icon:'iconfont icon-shafa1',id:8,num:2},
          {type:"others",icon:'iconfont icon-other',id:9,num:2}],
          pictureArr:[],
          num:2,
          searchNum:2,
          selectType:'scene',
          selectIndex:0,
          searchInput:'',
          searchArr:[],
          searchPage:1,
          scrollDisabled:false,
          loading:false,
          searchLoading:false,
          searchScrollDisabled:false,
          // client side cache: { [type]: { items: Array, nextPage: Number, noMore: Boolean } }
          cacheMap:{},
          searchDebounceTimer:null
        }
    },
     computed:mapState([
        "componentData",
        "canvasStyleData",
        "curComponent"
    ]),
    methods:{
        // 确保滚动容器在内容不足时也能触发加载，直到出现滚动条或无更多数据
        ensureScrollable(containerSelector, loadMethod, disabledFlag){
          const container = this.$el.querySelector(containerSelector)
          if(!container) return
          
          // 等待一段时间，确保图片加载完成后再检查
          setTimeout(() => {
            const checkAndLoad = () => {
              if (!container) return
              const canScroll = container.scrollHeight > container.clientHeight
              const disabled = this[disabledFlag]
              const loading = this.loading || this.searchLoading
              
              // 如果已经可以滚动、已禁用加载或正在加载中，则停止
              if (canScroll || disabled || loading) {
                return
              }
              
              // 触发一次加载
              if (typeof this[loadMethod] === 'function') {
                const loadPromise = this[loadMethod]()
                if (loadPromise && typeof loadPromise.then === 'function') {
                  loadPromise.then(() => {
                    // 加载完成后，再次检查是否还需要更多内容
                    setTimeout(() => {
                      this.$nextTick(() => {
                        if (container.scrollHeight <= container.clientHeight && !this[disabledFlag]) {
                          checkAndLoad()
                        }
                      })
                    }, 300)
                  }).catch(() => {})
                } else {
                  // 如果不是 Promise，等待一下再检查
                  setTimeout(() => {
                    this.$nextTick(() => checkAndLoad())
                  }, 300)
                }
              }
            }
            
            this.$nextTick(() => checkAndLoad())
          }, 200) // 等待图片开始加载
        },
        
        //请求数据库数据
        async getPictures(){
            try{
                // if cached, use cache immediately
                const cached = this.cacheMap[this.selectType]
                if (cached && Array.isArray(cached.items)) {
                  // 从缓存恢复时也进行去重，确保数据唯一
                  const uniqueMap = new Map()
                  cached.items.forEach(item => {
                    const key = item._id || item.content || JSON.stringify(item)
                    if (!uniqueMap.has(key)) {
                      uniqueMap.set(key, item)
                    }
                  })
                  this.pictureArr = Array.from(uniqueMap.values())
                  this.num = cached.nextPage || 2
                  this.scrollDisabled = !!cached.noMore
                  this.loading = false
                  this.$nextTick(()=>{
                    this.ensureScrollable('.menu-right', 'load', 'scrollDisabled')
                  })
                  return
                }

                // fetch page 1, and prefetch page 2 in parallel when possible
                const page1 = this.$http.get(`/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=1`)
                const page2 = this.$http.get(`/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=2`)
                const [r1, r2] = await Promise.allSettled([page1, page2])

                const list1 = r1.status === 'fulfilled' ? (r1.value.data.message || []) : []
                const list2 = r2.status === 'fulfilled' ? (r2.value.data.message || []) : []
                
                // 去重：使用 _id 或 content 作为唯一标识
                const combined = list1.concat(list2)
                const uniqueMap = new Map()
                combined.forEach(item => {
                  const key = item._id || item.content || JSON.stringify(item)
                  if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item)
                  }
                })
                const uniqueList = Array.from(uniqueMap.values())
                
                const noMore = list1.length === 0 && list2.length === 0
                this.cacheMap[this.selectType] = {
                  items: uniqueList,
                  nextPage: 3,
                  noMore
                }
                this.pictureArr = uniqueList.slice()
                this.num = 3
                this.scrollDisabled = noMore
                this.scrollDisabled = false
                this.loading = false
                // 确保在更新数据后检查滚动状态，多次检查确保滚动条出现
                this.$nextTick(() => {
                  this.ensureScrollable('.menu-right', 'load', 'scrollDisabled')
                })
                // 再次延迟检查，等待图片加载
                setTimeout(() => {
                  this.$nextTick(() => {
                    this.ensureScrollable('.menu-right', 'load', 'scrollDisabled')
                  })
                }, 500)
            }
            catch(error){
                console.log(error)
            }
        },

       //选择左侧类别
       select(index,type,num){
            // 重置所有状态
            this.scrollDisabled = true // 暂停监听，避免清空时触发
            this.loading = false
            this.selectIndex = index
            this.selectType = type
            this.pictureArr = []
            this.num = num || 2 // 设置为2，因为getPictures会加载第一页

            // 重置滚动位置
            this.$nextTick(() => {
              const container = this.$refs.scrollContainer
              if (container) container.scrollTop = 0
            })

            // 加载第一页数据
            this.getPictures()
            
            // 恢复监听，允许后续滚动加载
            this.scrollDisabled = false
        },
        
        //无限加载
        async load() {
      if(!this.loading){
        this.loading=true
        try {
        let res = await this.$http.get(
            `/picture/?sort_param=heat&sort_num=desc&type=`+ this.selectType +`&page=`+this.num);
        if(res.data.message.length==0){ 
            this.scrollDisabled=true   
        }else{
            const newItems = res.data.message || []
            // 去重：检查新数据是否已存在
            const existingIds = new Set(this.pictureArr.map(item => item._id || item.content || JSON.stringify(item)))
            const uniqueNewItems = newItems.filter(item => {
              const key = item._id || item.content || JSON.stringify(item)
              return !existingIds.has(key)
            })
            
            if (uniqueNewItems.length > 0) {
              this.pictureArr = this.pictureArr.concat(uniqueNewItems)
              this.num++
              // update cache
              const cached = this.cacheMap[this.selectType] || { items: [], nextPage: this.num, noMore: false }
              cached.items = this.pictureArr.slice()
              cached.nextPage = this.num
              cached.noMore = false
              this.cacheMap[this.selectType] = cached
            } else {
              // 如果没有新数据，说明已经加载完所有数据
              this.scrollDisabled = true
            }
            // 等待图片加载后检查滚动条
            setTimeout(() => {
              this.$nextTick(() => {
                this.ensureScrollable('.menu-right', 'load', 'scrollDisabled')
              })
            }, 300)
        }  
      } catch (err) {
        console.log(err);
      } finally {
        // 无论成功失败，都要重置loading状态
        this.loading=false
      }
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
      

        //把小图片添加到中间面板
       async handleImageChange(item){
        console.log(this.componentData)
           
                      let IMAGE= new Image()
                      const self=this
                      IMAGE.onload=function(){
                        // 检查图片尺寸，如果超过1200*900，按比例缩小到800*600以内
                        let finalWidth = IMAGE.width
                        let finalHeight = IMAGE.height
                        const maxWidth = 1200
                        const maxHeight = 900
                        const targetWidth = 800
                        const targetHeight = 600
                        
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
                            propValue:('https://api.kidstory.cc/'+item),
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
                      
                      IMAGE.src=('https://api.kidstory.cc/'+item)
                    
              
                    
                     
        },
        //搜索关键字
        async loadSearch(value){
            clearTimeout(this.searchDebounceTimer)
            this.searchDebounceTimer = setTimeout(async () => {
              this.searchArr = []
              this.searchNum = 2
              this.searchScrollDisabled = false
              try {
                let res = await this.$http.get(
                  `/picture/?sort_param=heat&sort_num=desc&keyword=`+ value +`&page=1`
                );
                this.searchArr = (res.data.message || []).slice()
                // 预取第二页
                try {
                  const res2 = await this.$http.get(`/picture/?sort_param=heat&sort_num=desc&keyword=`+ value +`&page=2`)
                  this.searchArr = this.searchArr.concat(res2.data.message || [])
                  this.searchNum = 3
                } catch(e){
                  console.log(e)
                }
                this.$nextTick(()=>{
                  this.ensureScrollable('.menu-right', 'searchLoad', 'searchScrollDisabled')
                })
              } catch (err) {
                console.log(err);
              }
            }, 300)
        },
//搜索结果无限加载
        async searchLoad() {
      if(!this.searchLoading){
        this.searchLoading=true
             try {
                    let res = await this.$http.get(
                        `/picture/?sort_param=heat&sort_num=desc&keyword=` + this.searchInput + `&page=` + this.searchNum
                    );
                    if (res.data.message.length == 0) {
                        this.searchScrollDisabled = true

                    } else {
                        this.searchArr = this.searchArr.concat(res.data.message);
                        this.searchNum++;
                        // 确保搜索结果也有足够内容
                        this.$nextTick(() => {
                          this.ensureScrollable('.menu-right', 'searchLoad', 'searchScrollDisabled')
                        })
                    }

                } catch (err) {
                    console.log(err);
                } finally {
                    // 确保重置loading状态
                    this.searchLoading = false
                }
      }

    },


    },
    mounted(){
        this.getPictures()
      
    },
    beforeDestory(){
       window.removeEventListener('scroll',this.load)
    },
    
    
}
</script>

<style scoped>
.container{
    width:19.5vw;
    height:90vh;
    
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
    height:8vh;
    line-height:8vh;
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
}
.element:hover{
    background-color:#fafafa ;
}
.img-ph{
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#fafafa;
    color:#c0c4cc;
}
.emptyResult{
    width:19.5vw;
    display: flex;  
    justify-content: center;
    align-content: center;
}
</style>