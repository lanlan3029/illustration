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
            <Toolbar @downLoad="downLoadImg" @uploadIllustration="uploadImg" :draftid="draftid"/>
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
    }
  },
  components: {
    Toolbar,
    Editor,
    AttrList,
    Cropper,
    LeftMenu
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
          this.draftid=res.data.message._id
          this.draftArr=res.data.message.content
          if(this.draftArr.length>0){
            this.$store.commit('setComponentData',this.draftArr)
          }
         console.log(this.draftArr)
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
      // 计算菜单相对于编辑器的位移
      let target = e.target
      let top = e.offsetY
      let left = e.offsetX
      // 判断是否是在svg上右击鼠标
      while (target instanceof SVGElement) {
          target = target.parentNode
      }
      // 判断是否右击在图片上
      while (!target.className.includes('editor')) {
          left += target.offsetLeft
          top += target.offsetTop
          target = target.parentNode
      }
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
    downLoadImg(){
      this.$store.commit('setCurComponent',{
          component:null,
          index:null
        });

       this.$message("正在下载,请勿重复点击");
      let target = document.getElementsByClassName("content");
        html2Canvas(target[0], {
        dpi: 96,
        useCORS: true,
      }).then((canvas) => {
      let url = canvas.toDataURL("image/jpeg");
      this.saveBase64(url)
      });
    },

    getCanvas(){
        let target = document.getElementsByClassName("content");
        console.log(target)
        html2Canvas(target[0], {
        dpi: 96,
        useCORS: true,
      }).then((canvas) => {
      let url = canvas.toDataURL("image/jpeg");
       this.$store.commit('uploadIllustration', url)
       console.log(url)
      this.$router.push('/user/upload/upload-illustration');
    })},

    async uploadImg(){
         this.$store.commit('setCurComponent', {component:null,index:null})  
         await this.getCanvas()
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
    width: 10vw;
    right: 0;
    top: 0;
  }
  .center{
    background-color: #f5f5f5; 
    width:70.5vw;
    height:88vh;  
    margin:auto;
    border-radius: 4px;
    overflow-y: scroll;
  }
  .content{
    margin:2vh auto;
    width: 66vw;
    height:43vw;
    overflow: hidden;
    z-index:100;
  }
  .placeholder{
    text-align: center;
    color: #333;
    font-size: 14px;
  }
</style>
