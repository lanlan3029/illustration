<template>
  <div>
     
   
    <main>
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
           <div
               class="content"
               @drop="handleDrop"
               @dragover="handleDragOver"
               @mousedown="handleMouseDown"
               @mouseup="deselectCurComponent"
               @contextmenu="handleContextMenu"
           >
               <Editor />
           </div>
           <ContextMenu />
            <Toolbar @downLoad="downLoadImg" @uploadIllustration="uploadImg" @exportToStyleTransfer="exportToStyleTransfer" :draftid="draftid" :downloading="downloading"/>
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
    </main>
  </div>
</template>

<script>

import LeftMenu from "../components/LeftMenu.vue"
import {mapState} from 'vuex'

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
  name: 'Home',
  data(){
    return{
      userId:localStorage.getItem("id"),
      activeName:"attr",
      draftArr:[],
      draftid:'',
      downloading: false, // 下载状态
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
  computed:mapState([
    'componentData',
    'curComponent',
    'isClickComponent',
    'editor',
    "ifCropper",
    "imgUrl"
  ]),
  mounted(){
    this.getCollectIll();
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
        this.$message({
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
          scale: 1,
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
        this.$message.error('下载失败，请重试');
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
        scale: 1,
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
            scale: 1,
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
            this.$message.error('导出图片失败，请重试');
         });
       }
    }
  }
</script>
<style scoped>
    
 
  main{
    height: 90vh;
    width:100vw;
    display: flex;

  }
  .left{
    height: 90vh;
    width: 19.5vw;
    left: 0;
    top: 0;
  }
  .right{
    height: 90vh;
    width: 14vw;
    right: 0;
    top: 0;
  }
  .center{
    background-color: #f5f5f5; 
    width:66.5vw;
    height:88vh;  
    margin:auto;
    border-radius: 4px;
    overflow-y: scroll;
  }
  .content{
    margin:2vh auto 0 auto;
    width: 56vw;
    height:44vw;
    overflow: hidden;
    z-index:100;
  }
  .placeholder{
    text-align: center;
    color: #333;
    font-size: 14px;
  }
</style>
