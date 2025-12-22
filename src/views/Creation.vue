<template>
  <div class="creation-container">
     
   
  
       <!-- 左侧组件列表 -->
       <section class="left">
         <left-menu />
         
       </section>
       <!-- 中间画布 -->
       <section class="center">
         <!-- 
           @drop是释放拖拽的元素
           @dragover是拖拽元素到某个地方
           @dragstart是拖拽哪一个元素：在ComponentList.vue中
          -->
           <div class="aspect-ratio-selector-top">
             <span class="aspect-label">画布比例：</span>
             <el-select 
               v-model="selectedAspectRatio" 
               @change="handleAspectRatioChange"
               size="small"
               style="width: 100px;"
             >
               <el-option label="4:3" value="4:3"></el-option>
               <el-option label="1:1" value="1:1"></el-option>
               <el-option label="3:4" value="3:4"></el-option>
               <el-option label="9:16" value="9:16"></el-option>
               <el-option label="16:9" value="16:9"></el-option>
             </el-select>
           </div>
           <div class="center-content-wrapper">
           <div
               class="content"
                   :style="contentStyle"
               @drop="handleDrop"
               @dragover="handleDragOver"
               @mousedown="handleMouseDown"
               @mouseup="deselectCurComponent"
               @contextmenu="handleContextMenu"
           >
               <Editor />
               </div>
               <Toolbar @downLoad="downLoadImg" @uploadIllustration="uploadImg" @exportToStyleTransfer="exportToStyleTransfer" :draftid="draftid" :downloading="downloading"/>
           </div>
           <ContextMenu />
           <Cropper v-if="ifCropper && curComponent != null" >
           </Cropper>
          
       </section>
       <!-- 右侧属性列表 -->
       <section class="right">
         <el-tabs v-model="activeName">
            <el-tab-pane label="属性" name="attr">
                <AttrList v-if="curComponent" />
                <p v-else class="placeholder">请选择一个元素</p>
            </el-tab-pane>
        
        </el-tabs>
        
       </section>
    
  </div>
</template>

<script>

import LeftMenu from "../components/LeftMenu.vue"
import {mapState} from 'vuex'
import { ElMessage } from 'element-plus'

import Toolbar from '@/components/Toolbar'
import Editor from '@/components/Editor/index'
import ContextMenu from '@/components/Editor/ContextMenu'
import Cropper from '@/components/Cropper/index'
import AttrList from '@/components/AttrList'

import componentList from '@/custom-component/component-list' // 左侧列表数据
import {deepCopy} from "@/utils/utils"
import generateID from "@/utils/generateID"
import html2Canvas from "html2canvas";


export default {
  name: 'CreationPage',
  data(){
    return{
      userId:localStorage.getItem("id"),
      activeName:"attr",
      draftArr:[],
      draftid:'',
      downloading: false, // 下载状态
      selectedAspectRatio: '4:3' // 默认宽高比
    }
  },
  components: {
    Toolbar,
    Editor,
    AttrList,
    Cropper,
    LeftMenu,
    ContextMenu
  },
  computed:{
    ...mapState([
    'componentData',
    'curComponent',
    'isClickComponent',
    'editor',
    "ifCropper",
      "imgUrl",
      "canvasStyleData"
  ]),
    // 动态计算内容容器样式
    contentStyle() {
      const canvasWidth = this.canvasStyleData?.width || 42;
      const canvasHeight = this.canvasStyleData?.height || 31.5;
      // 给容器留一些边距，高度稍微大一点
      const contentHeight = canvasHeight + 2;
      return {
        width: canvasWidth + 'vw',
        height: contentHeight + 'vw'
      };
    }
  },
  mounted(){
    // 先从服务器获取草稿（优先使用服务器草稿）
    this.getCollectIll().then(() => {
      // 如果服务器没有草稿，再从本地存储恢复数据
      if (!this.componentData || this.componentData.length === 0) {
        this.loadFromLocalStorage();
      }
    }).catch(() => {
      // 如果服务器请求失败，使用本地存储的数据
      this.loadFromLocalStorage();
    });
    // 根据当前画布尺寸计算宽高比
    this.calculateCurrentAspectRatio();
    // 监听组件数据变化，自动保存到本地
    this.setupAutoSave();
  },
  methods:{
    //获取草稿
    async getCollectIll(){
      try{
          let res=await this.$http.post(`/ill/draft/list`,{}, { headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }}
          )
          console.log(res)
          if(res.data.message){
            this.draftid=res.data.message._id
            this.draftArr=res.data.message.content
            if(this.draftArr.length>0){
              this.$store.commit('setComponentData',this.draftArr)
            }
          }
        } catch(err){
          console.log(err)
          throw err; // 重新抛出错误，让调用者处理
        }
    },

    handleMouseDown(){
      this.$store.commit('setClickComponentStatus',false)
    },
    deselectCurComponent(e){
      if(!this.isClickComponent){
        this.$store.commit('setCurComponent',{
          component:null,
          index:null
        })
      }
      // 0 左击 1 滚轮 2 右击
      if(e.button != 2){
        this.$store.commit('hideContextMenu')
      }
    },
    handleContextMenu(e){
      e.stopPropagation()
      e.preventDefault()
      // 使用固定定位，计算相对于视口的坐标
      // 这样可以确保菜单始终显示在最上层，不会被overflow:hidden裁剪
      const top = e.clientY
      const left = e.clientX
      this.$store.commit('showContextMenu', { top, left })
    },
    handleDrop(e){
      e.preventDefault()
      e.stopPropagation()
      const index = e.dataTransfer.getData("index")
      const rectInfo = this.editor.getBoundingClientRect()
      if(index){
        const component = deepCopy(componentList[index])
        component.style.top = e.clientY - rectInfo.y
        component.style.left = e.clientX - rectInfo.x
        component.id = generateID()
        this.$store.commit("addComponent",{component})
      }
    },
    handleDragOver(e){
      e.preventDefault()
      // dataTransfer.dropEffect 获取当前选定的拖放操作类型或者设置的为一个新的类型。值必须为  none, copy, link 或 move。
      e.dataTransfer.dropEffect = "copy"
    },
    saveBase64(base64,name=new Date().valueOf()){
      const a=document.createElement("a")
      a.href=base64;
      a.download=`${name}.png`
      a.click()
    },
    // 预加载所有图片，并将图片转换为base64缓存，避免html2canvas重新加载
    async preloadImages(container) {
      const images = container.querySelectorAll('img');
      const imagePromises = Array.from(images).map(async (img) => {
        // 如果图片已经加载完成
        if (img.complete && img.naturalWidth > 0) {
          // 如果图片还没有data-cached属性，将其转换为base64并缓存
          if (!img.dataset.cached) {
            try {
              // 将图片转换为base64并存储在data属性中
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              ctx.drawImage(img, 0, 0);
              const base64 = canvas.toDataURL('image/png');
              img.dataset.cached = base64;
              img.dataset.originalSrc = img.src;
            } catch (e) {
              // 如果转换失败（可能是跨域），标记为已处理
              img.dataset.cached = 'skip';
            }
          }
          return Promise.resolve();
        }
        // 否则等待图片加载
        return new Promise((resolve) => {
          if (img.src) {
            img.onload = async () => {
              // 图片加载完成后，转换为base64缓存
              if (!img.dataset.cached) {
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  ctx.drawImage(img, 0, 0);
                  const base64 = canvas.toDataURL('image/png');
                  img.dataset.cached = base64;
                  img.dataset.originalSrc = img.src;
                } catch (e) {
                  img.dataset.cached = 'skip';
                }
              }
              resolve();
            };
            img.onerror = () => resolve();
            if (img.complete) {
              resolve();
            }
          } else {
            resolve();
          }
        });
      });
      await Promise.all(imagePromises);
    },

    async downLoadImg(){
      // 如果正在下载，直接返回
      if (this.downloading) {
        return;
      }
      
      // 设置下载状态为true，禁用按钮
      this.downloading = true;
      
      try {
        // 取消选中组件
        this.$store.commit('setCurComponent',{
            component:null,
            index:null
          });
        // 隐藏右键菜单
        this.$store.commit('hideContextMenu')

        // 等待 DOM 更新完成，确保选中状态的旋转图标等元素已移除
        await this.$nextTick()
        // 再等待一小段时间，确保所有样式更新完成
        await new Promise(resolve => setTimeout(resolve, 100))

        // 显示提示信息，持续1秒
        ElMessage({
          message: "正在下载,请勿重复点击",
          duration: 1000
        });
        
        let target = document.getElementsByClassName("content");
        
        // 预加载所有图片，确保图片已缓存，避免截图时重新加载
        await this.preloadImages(target[0]);
        
        console.log(target)
        console.time('html2canvas')
        const canvas = await html2Canvas(target[0], {
          dpi: 96,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 15000,
          scale: 2,
          logging: false,
          removeContainer: true,
          cacheBust: false,
          // 在克隆DOM时，使用缓存的base64图片，避免重新加载
          onclone: (clonedDoc) => {
            const clonedImages = clonedDoc.querySelectorAll('img');
            const originalImages = target[0].querySelectorAll('img');
            clonedImages.forEach((clonedImg, index) => {
              const originalImg = originalImages[index];
              if (originalImg && originalImg.dataset.cached && originalImg.dataset.cached !== 'skip') {
                // 使用缓存的base64数据，避免重新加载
                clonedImg.src = originalImg.dataset.cached;
              }
            });
          }
        });
        console.timeEnd('html2canvas')
        let url = canvas.toDataURL("image/jpeg", 0.92);
        this.saveBase64(url)
      } catch (error) {
        console.error('下载失败:', error);
        ElMessage.error('下载失败，请重试');
      } finally {
        // 下载完成，恢复按钮状态
        this.downloading = false;
      }
    },

    async getCanvas(){
        // 取消选中组件
        this.$store.commit('setCurComponent', {component:null,index:null})
        // 隐藏右键菜单
        this.$store.commit('hideContextMenu')
        
        // 等待 DOM 更新完成，确保选中状态的旋转图标等元素已移除
        await this.$nextTick()
        // 再等待一小段时间，确保所有样式更新完成
        await new Promise(resolve => setTimeout(resolve, 100))
        
        let target = document.getElementsByClassName("content");
        
        // 预加载所有图片，确保图片已缓存，避免截图时重新加载
        await this.preloadImages(target[0]);
        
        console.log(target)
        html2Canvas(target[0], {
        dpi: 96,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        scale: 2,
        logging: false,
        removeContainer: true,
        cacheBust: false,
        // 在克隆DOM时，使用缓存的base64图片，避免重新加载
        onclone: (clonedDoc) => {
          const clonedImages = clonedDoc.querySelectorAll('img');
          const originalImages = target[0].querySelectorAll('img');
          clonedImages.forEach((clonedImg, index) => {
            const originalImg = originalImages[index];
            if (originalImg && originalImg.dataset.cached && originalImg.dataset.cached !== 'skip') {
              clonedImg.src = originalImg.dataset.cached;
            }
          });
        }
      }).then((canvas) => {
      let url = canvas.toDataURL("image/jpeg", 0.92);
       this.$store.commit('uploadIllustration', url)
       console.log(url)
      this.$router.push('/user/upload/upload-illustration');
    })},

    async uploadImg(){
         this.$store.commit('setCurComponent', {component:null,index:null})  
         await this.getCanvas()
       },
    
    async exportToStyleTransfer(){
         // 取消选中组件
         this.$store.commit('setCurComponent', {component:null,index:null})
         // 隐藏右键菜单
         this.$store.commit('hideContextMenu')
         
         // 等待 DOM 更新完成，确保选中状态的旋转图标等元素已移除
         await this.$nextTick()
         // 再等待一小段时间，确保所有样式更新完成
         await new Promise(resolve => setTimeout(resolve, 100))
         
         // 导出画布为base64
         let target = document.getElementsByClassName("content");
         
         // 预加载所有图片，确保图片已缓存，避免截图时重新加载
         await this.preloadImages(target[0]);
         
         html2Canvas(target[0], {
            dpi: 96,
            useCORS: true,
            allowTaint: false,
            imageTimeout: 15000,
            scale: 2,
            logging: false,
            removeContainer: true,
            cacheBust: false,
            // 在克隆DOM时，使用缓存的base64图片，避免重新加载
            onclone: (clonedDoc) => {
              const clonedImages = clonedDoc.querySelectorAll('img');
              const originalImages = target[0].querySelectorAll('img');
              clonedImages.forEach((clonedImg, index) => {
                const originalImg = originalImages[index];
                if (originalImg && originalImg.dataset.cached && originalImg.dataset.cached !== 'skip') {
                  clonedImg.src = originalImg.dataset.cached;
                }
              });
            }
         }).then((canvas) => {
            let base64Url = canvas.toDataURL("image/jpeg", 0.92);
            
            // 将base64存储到localStorage，供style_transfer页面使用
            localStorage.setItem('styleTransferContentImage', base64Url);
            
            // 跳转到风格迁移页面
            this.$router.push('/user/upload/style-transfer');
         }).catch((error) => {
            console.error('导出图片失败:', error);
            ElMessage.error('导出图片失败，请重试');
         });
       },
       
       // 计算当前画布的宽高比
       calculateCurrentAspectRatio() {
           const width = this.canvasStyleData.width || 48;
           const height = this.canvasStyleData.height || 36;
           const ratio = width / height;
           
           // 根据比例匹配最接近的选项（允许一定误差）
           const ratios = {
               '4:3': 4/3,      // 48/36 = 1.333...
               '1:1': 1,        // 36/36 = 1
               '3:4': 3/4,      // 27/36 = 0.75
               '9:16': 9/16,    // 20.25/36 = 0.5625
               '16:9': 16/9     // 64/36 = 1.777...
           };
           
           let closestRatio = '4:3';
           let minDiff = Math.abs(ratio - ratios['4:3']);
           
           Object.keys(ratios).forEach(key => {
               const diff = Math.abs(ratio - ratios[key]);
               if (diff < minDiff) {
                   minDiff = diff;
                   closestRatio = key;
               }
           });
           
           this.selectedAspectRatio = closestRatio;
       },
       
       // 从本地存储恢复画布数据
       loadFromLocalStorage() {
           try {
               const savedData = localStorage.getItem('creation_canvas_data');
               if (savedData) {
                   const canvasData = JSON.parse(savedData);
                   
                   // 检查数据是否过期（7天内有效）
                   const now = Date.now();
                   const dataAge = now - (canvasData.timestamp || 0);
                   const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
                   
                   if (dataAge < maxAge && canvasData.componentData && canvasData.componentData.length > 0) {
                       // 恢复组件数据
                       this.$store.commit('setComponentData', canvasData.componentData);
                       
                       // 恢复画布样式（如果有）
                       if (canvasData.canvasStyle) {
                           this.$store.commit('setCanvasStyle', canvasData.canvasStyle);
                       }
                       
                       console.log('已从本地存储恢复画布数据');
                   } else if (dataAge >= maxAge) {
                       // 数据已过期，清除
                       localStorage.removeItem('creation_canvas_data');
                       console.log('本地存储的画布数据已过期，已清除');
                   }
               }
           } catch (error) {
               console.error('从本地存储恢复画布数据失败:', error);
           }
       },
       
       // 保存画布数据到本地存储
       saveToLocalStorage() {
           try {
               const canvasData = {
                   componentData: this.componentData,
                   canvasStyle: this.canvasStyleData,
                   timestamp: Date.now()
               };
               localStorage.setItem('creation_canvas_data', JSON.stringify(canvasData));
           } catch (error) {
               console.error('保存画布数据到本地存储失败:', error);
               // 如果存储失败（可能是存储空间不足），尝试清除旧数据
               try {
                   localStorage.removeItem('creation_canvas_data');
                   localStorage.setItem('creation_canvas_data', JSON.stringify({
                       componentData: this.componentData,
                       canvasStyle: this.canvasStyleData,
                       timestamp: Date.now()
                   }));
               } catch (e) {
                   console.error('清除旧数据后重新保存失败:', e);
               }
           }
       },
       
       // 设置自动保存
       setupAutoSave() {
           // 使用防抖，避免频繁保存
           let saveTimer = null;
           const debounceSave = () => {
               if (saveTimer) {
                   clearTimeout(saveTimer);
               }
               saveTimer = setTimeout(() => {
                   this.saveToLocalStorage();
               }, 1000); // 1秒后保存
           };
           
           // 监听 Vuex store 中 componentData 的变化
           this.$store.watch(
               (state) => state.componentData,
               () => {
                   debounceSave();
               },
               { deep: true }
           );
           
           // 监听画布样式变化
           this.$store.watch(
               (state) => state.canvasStyleData,
               () => {
                   debounceSave();
               },
               { deep: true }
           );
       },
       
       // 处理宽高比变化
       handleAspectRatioChange(value) {
           // 固定高度为 36vw
           const fixedHeight = 36;
           let width;
           
           // 根据选择的宽高比计算宽度
           // 宽高比格式为 width:height，所以 width = height * (width/height)
           switch(value) {
               case '4:3':
                   // 4:3 表示宽:高 = 4:3，所以 width = height * 4/3
                   width = fixedHeight * 4 / 3; // 36 * 4/3 = 48vw
                   break;
               case '1:1':
                   // 1:1 表示宽:高 = 1:1，所以 width = height
                   width = fixedHeight; // 36vw
                   break;
               case '3:4':
                   // 3:4 表示宽:高 = 3:4，所以 width = height * 3/4
                   width = fixedHeight * 3 / 4; // 36 * 3/4 = 27vw
                   break;
               case '9:16':
                   // 9:16 表示宽:高 = 9:16，所以 width = height * 9/16
                   width = fixedHeight * 9 / 16; // 36 * 9/16 = 20.25vw
                   break;
               case '16:9':
                   // 16:9 表示宽:高 = 16:9，所以 width = height * 16/9
                   width = fixedHeight * 16 / 9; // 36 * 16/9 = 64vw
                   break;
               default:
                   width = fixedHeight * 4 / 3; // 默认 4:3
           }
           
           // 更新画布尺寸
           this.$store.commit('setCanvasStyle', {
               ...this.canvasStyleData,
               width: width,
               height: fixedHeight
         });
       }
    }
  }
</script>
<style scoped>
    
 
  .creation-container{
    height: calc(100vh - 90px); /* 减去 TopBar(50px) 和 Footer(40px) 的高度 */
    width:100%;
    display: flex;
    margin-top: 0; /* 确保没有额外的 margin */
    position: relative;
    overflow: hidden;
  }
  .left{
    height: 100%;
    width: 19.5vw;
    position: relative;
    flex-shrink: 0;
    overflow: visible;
  }
  .right{
    height: 100%;
    width: 14vw;
    right: 0;
    top: 0;
  }
  .center{
    background-color: #f5f5f5; 
    width:66.5vw;
    height: 100%;  
    margin:0 auto;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .aspect-ratio-selector-top{
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 200;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 6px 16px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .aspect-label {
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
  }
  .center-content-wrapper{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100%;
    padding-top: 100px; /* 为顶部的比例选择器留出空间 */
    box-sizing: border-box; /* 确保padding不会增加总高度 */
  }
  .content{
    position: relative;
    margin: 0 auto;
    width: 56vw;
    /* height 由 contentStyle 动态设置 */
    overflow: hidden;
    z-index:100;
    flex-shrink: 0; /* 防止被压缩 */
  }
  .placeholder{
    text-align: center;
    color: #333;
    font-size: 14px;
  }
</style>
