<template>
  <div class="cropper-content">
    <div class="cropper_area">
     <div class="top-btn">
          <!-- 裁剪框 -->
          
      <div class="cropper">
        <img id="image" ref="image" :src="curComponent.propValue" alt="" />
      </div>
      <!-- 预览框 -->
      <div class="show-preview" style="{
          overflow:'hidden',
          margin:'0 25px',
          display:'flex',
          alignItem:'center'
      }">
        <div class="preview before"></div>
        <div>预览图</div>
     
      </div>
     </div>
     <div class="footer-btn">
         <el-tooltip class="item" effect="dark" content="放大" placement="top">
            <el-button icon="el-icon-zoom-in" @click="cropperzoom(0.05)"/>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="缩小" placement="top">
          <el-button icon="el-icon-zoom-out" @click="cropperzoom(-0.05)"/>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="向右移动" placement="top">
          <el-button icon="el-icon-right" @click="croppermove(5,0)"/>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="向左移动" placement="top">
          <el-button icon="el-icon-back" @click="croppermove(-5,0)"/>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="向上移动" placement="top">
          <el-button icon="el-icon-top" @click="croppermove(0,5)"/>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="向下移动" placement="top">
          <el-button icon="el-icon-bottom" @click="croppermove(0,-5)"/>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="沿着x轴镜像图片" placement="top">
          <el-button icon="el-icon-caret-bottom" @click="cropperScaleX"/>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="沿着y轴镜像图片" placement="top">
          <el-button icon="el-icon-caret-right" @click="cropperScaleY"/>
        </el-tooltip>
        <el-tooltip
          class="item"
          effect="dark"
          content="逆时针旋转"
          placement="top"
        >
          <el-button
            icon="el-icon-refresh-left"
            @click="cropperRotate(-45)"
          />
        </el-tooltip>
        <el-tooltip
          class="item"
          effect="dark"
          content="顺时针旋转"
          placement="top"
        >
          <el-button
            icon="el-icon-refresh-right"
            @click="cropperRotate(45)"
          />
        </el-tooltip>
        <el-button @click="closeCropper">取消</el-button>
            <el-button
            type="primary"
            :disabled="isDisabled"
            @click="sureSave()"
            >确定</el-button>
        <!-- <el-button type="success" @click="upload">下载</el-button> -->
     </div>
    </div>
  </div>
</template>
<script>
import toast from '@/utils/toast'
import Cropper from "cropperjs"
import "cropperjs/dist/cropper.css"
import {mapState} from "vuex"
export default {
    name:'VueCropper',
    data(){
        return{
            myCropper:null,
            afterImg:"",
            ScaleX:1,
            ScaleY:1,
            fixed:false,
            fiexdBox:false,
            isDisabled:false,
            formInline:{
              inputRotate:0,
            }
        }
    },
    computed:mapState([
      "ifCropper",
      "curComponent"
    ]),
    mounted(){
      if(this.curComponent != null){
        this.init()
      }
    },
    methods:{
        init(){
            this.myCropper = new Cropper(document.getElementById("image"),{
                // 0 无限制
                // 1 限制裁剪框不能超出图片的范围
                // 2 限制裁剪框不能超出图片的范围 且图片填充模式为 cover 最长边填充
                // 3 限制裁剪框不能超出图片的范围 且图片填充模式为 contain 最短边填充
                viewMode:1,
                // crop 形成新的裁剪框
                // move 图片可移动
                // none 什么也没有
                dragMode:"move",
                // initialAspectRatio 裁剪框宽高比的初始值 默认与图片宽高比相同 只有在aspectRatio没有设置的情况下可用
                // initialAspectRatio:1,
                // 设置一个区域容器预览裁剪后的结果
                preview:'.before',
                // 是否在容器内显示网格状的背景 默认true
                background:false,
                // 设置裁剪区域占图片的大小 值为 0-1 默认 0.8 表示 80%的区域
                autoCropArea:1,
                // 是否可以通过鼠标滚轮缩放图片 默认true
                zoomOnWheel:true,
                // 设置裁剪框为固定的宽高比
                
                cropBoxResizable:true,
                // 手动显示裁剪框
                // crop(event) {
                //     console.log(event.detail.x);
                //     console.log(event.detail.y);
                //     console.log(event.detail.width);
                //     console.log(event.detail.height);
                //     console.log(event.detail.rotate);
                //     console.log(event.detail.scaleX);
                //     console.log(event.detail.scaleY);
                // },
            })
        },
        // 放大缩小
        cropperzoom(val){
          this.myCropper.zoom(val)
        },
        // 旋转
        cropperRotate(val){
          this.myCropper.rotate(val)
          console.log(this.myCropper);
        },
        // input旋转
        cropperRotateTo(val){
          if(val == ""){
            this.formInline.inputRotate = 0
          }else{
            this.myCropper.rotateTo(val)
          }
        },
        // 移动
        croppermove(val1,val2){
          this.myCropper.move(val1,val2)
        },
        sureSave(){
          this.afterImg = this.myCropper
            .getCroppedCanvas({
              fillColor:"transparent",
              imageSmoothingQuality:"high"
            })
            .toDataURL("png")
          toast("编辑成功","success")
          this.$store.commit("setComponentImage",this.afterImg)
          this.$store.commit("changeCropper",false)
          
        },
        // 下载
        upload(){
          this.afterImg = this.myCropper
            .getCroppedCanvas({
              fillColor:"#fff",
              imageSmoothingQuality:"high"
            })
            .toDataURL("image/jpeg")
            console.log(this.myCropper.getCanvasData());
          this.base64ToBlob(this.afterImg)
        },
        // 如何下载
        base64ToBlob(code){
           const parts = code.split(';base64,')
          const contentType = parts[0].split(':')[1]
          const raw = window.atob(parts[1])
          const rawLength = raw.length

          const uInt8Array = new Uint8Array(rawLength)

          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i)
          }
          return new Blob([uInt8Array], {
            type: contentType
          })
        },
        cropperScaleX(){
          this.ScaleX = -this.ScaleX
          if (this.myCropper.getImageData().rotate === -90 || this.myCropper.getImageData().rotate === 90) {
            this.myCropper.scaleY(this.ScaleX)
          } else {
            this.myCropper.scaleX(this.ScaleX)
          }
        },
        cropperScaleY(){
          this.ScaleY = -this.ScaleY
          if (this.myCropper.getImageData().rotate === -90 || this.myCropper.getImageData().rotate === 90) {
            this.myCropper.scaleX(this.ScaleY)
          } else {
            this.myCropper.scaleY(this.ScaleY)
          }
        },
        closeCropper(){
          toast("取消编辑","error")
          this.$store.commit("changeCropper",false)
        }
    }
}
</script>
<style scoped>
.cropper-content {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}
.cropper_area {
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  display: flex;
  flex-direction: column;
}
.top-btn{
    flex: 4;
    display: flex;
    max-height: 417px;
}
.footer-btn{
    flex: 1;
    margin-top: 20px;
    min-height: 50px;
}
.cropper {
  flex: 4;
  overflow: hidden;
  background: skyblue;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAArrAAAK6wGCiw1aAAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M26LyyjAAAABFJREFUCJlj+M/AgBVhF/0PAH6/D/HkDxOGAAAAAElFTkSuQmCC);
}
 
.show-preview {
  flex: 1;
  background-color: #f5f5f5;
  text-align: center;
  font-size: 16px;
}
.before{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.preview{
  overflow: hidden;
  border: 1px solid #468ac8;
  background: #cccccc;
}
</style>