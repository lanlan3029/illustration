<template>
    <div class="container">
      
        <!-- 已选插画预览区域和操作栏 -->
        <div class="selected-section">
            <div v-if="checkedImage.length > 0">
                <div class="selected-header">
                    <span class="selected-count">已选择 {{ checkedImage.length }} 张插画</span>
                    <el-button size="small" type="text" @click="clearSelected">清空</el-button>
                </div>
                <div class="selected-preview" @dragover.prevent @drop.prevent>
                    <div 
                        v-for="(item, index) in checkedImage" 
                        :key="index" 
                        class="selected-item"
                        :draggable="true"
                        :data-index="index"
                        @dragstart="handleDragStart($event, index)"
                        @dragover="handleDragOver($event, index)"
                        @dragleave="handleDragLeave"
                        @drop="handleDrop($event, index)"
                        @dragend="handleDragEnd"
                        :class="{ 
                            'dragging': dragIndex === index,
                            'drag-over': dragOverIndex === index && dragIndex !== index
                        }">
                        <el-image 
                            :src="(`https://static.kidstory.cc/`+item.content)" 
                            style="width:100%; height:100%" 
                            fit="cover">
                        </el-image>
                        <div class="selected-order">{{ index + 1 }}</div>
                        <div class="selected-remove" @click.stop="removeSelected(index)">
                            <i class="el-icon-close"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 操作栏 -->
            <div class="action-bar">
                <span class="selected-info" v-if="checkedImage.length > 0">
                    已选择 {{ checkedImage.length }} 张，点击合成按钮继续
                </span>
                <span class="selected-info" v-else>
                    请选择要合成的插画
                </span>
                <el-button 
                    @click="toPDF" 
                    type="primary" 
                    size="medium"
                    :disabled="checkedImage.length === 0"
                    class="compose-btn">
                    <i class="el-icon-document"></i>
                    合成绘本
                </el-button>
            </div>
        </div>

        <!-- 插画列表区域 -->
        <div class="images-section">
            <ul class="items" v-infinite-scroll="getMore">
                <li 
                    v-for="(item, index) in illusArr" 
                    :key="index" 
                    @click="handleAdd(item)"
                    :class="{ 'selected': checkedImage.includes(item) }">
                    <el-image 
                        :src="(`https://static.kidstory.cc/`+item.content)" 
                        style="width:12vw; height: 8.448vw" 
                        fit="contain">
                    </el-image>
                    <span v-if="checkedImage.includes(item)" class="check-mark">
                        <i class="el-icon-check"></i>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {mapState} from "vuex"

export default {
     data() {
    return {
      illusArr:[],
      num:1,
      checkedImage:[],
      checkedId:[],
      userid:localStorage.getItem("id"),
      dragIndex: null, // 当前拖拽的元素索引
      dragOverIndex: null, // 当前拖拽经过的元素索引
    };
  },
    computed:mapState([
        "imgToPDF",      
    ]),
  methods:{
    //获取我的插画
    async getIll(){
      try{
          let res=await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=`+this.userid+`&page=1`)
          this.illusArr=res.data.message
        } catch(err){
          console.log(err)
        }
    },
    handleAdd(item){
      // 如果已选中，则移除；否则添加
      const index = this.checkedImage.findIndex(img => img._id === item._id);
      if (index > -1) {
        this.checkedImage.splice(index, 1);
      } else {
        this.checkedImage.push(item);
      }
    },
    removeSelected(index){
      this.checkedImage.splice(index, 1);
    },
    clearSelected(){
      this.checkedImage = [];
    },
    // 拖拽开始
    handleDragStart(event, index) {
      this.dragIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', event.target.outerHTML);
      event.target.style.opacity = '0.5';
    },
    // 拖拽经过
    handleDragOver(event, index) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (this.dragIndex !== null && this.dragIndex !== index) {
        this.dragOverIndex = index;
      }
      return false;
    },
    // 拖拽离开
    handleDragLeave(event) {
      // 只有当离开整个预览区域时才清除，避免在子元素间移动时频繁触发
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.dragOverIndex = null;
      }
    },
    // 拖拽放下
    handleDrop(event, dropIndex) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.dragIndex === null || this.dragIndex === dropIndex) {
        this.dragOverIndex = null;
        return false;
      }
      
      // 重新排序数组
      const draggedItem = this.checkedImage[this.dragIndex];
      this.checkedImage.splice(this.dragIndex, 1);
      this.checkedImage.splice(dropIndex, 0, draggedItem);
      
      // 重置拖拽状态
      this.dragIndex = null;
      this.dragOverIndex = null;
      return false;
    },
    // 拖拽结束
    handleDragEnd(event) {
      event.target.style.opacity = '';
      this.dragIndex = null;
      this.dragOverIndex = null;
    },
    toPDF(){
      this.checkedImage.push()
      this.$store.commit("removeImages")
      this.$router.push('/user/upload/compose-illustration/topdf');
       this.$store.commit("addImages",this.checkedImage)
       
    },
    async getMore(){
      this.num++
      try{
          let res=await this.$http.get(`/ill/?sort_param=createdAt&sort_num=desc&ownerid=`+this.userid+`&page=`+this.num)
          this.illusArr=this.illusArr.concat(res.data.message)
        } catch(err){
          console.log(err)
        }
    }

  },
  async mounted(){
    await this.getIll(); 
  }
}
</script>

<style scoped>
.container{
    width:100vw;
    min-height:90vh;
    padding:0 5vw;
    background-color: #f5f5f5;
    overflow-y: auto;
    position: relative;
}



/* 已选插画预览区域 */
.selected-section{
    margin: 1vw;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 操作栏 */
.action-bar{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
}

.selected-header{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
}

.selected-count{
    font-size: 16px;
    font-weight: 600;
    color: #409eff;
}

.selected-preview{
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 5px 0;
}

.selected-item{
    position: relative;
    width: 120px;
    height: 90px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    border: 2px solid #409eff;
    cursor: move;
    transition: all 0.3s;
    user-select: none;
}

.selected-item:hover{
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.selected-item.dragging{
    opacity: 0.5;
    cursor: grabbing;
}

.selected-item.drag-over{
    border-color: #67c23a;
    box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.3);
    transform: scale(1.1);
}

.selected-item:active{
    cursor: grabbing;
}

.selected-order{
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    background-color: #409eff;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
}

.selected-remove{
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background-color: rgba(245, 108, 108, 0.9);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
}

.selected-item:hover .selected-remove{
    opacity: 1;
}

/* 插画列表区域 */
.images-section{
    margin: 1vw;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.container .items{
    width:100%;
    display: flex;
    flex-wrap:wrap;
    gap: 1vw;
}

.container .items li{
    width:13vw;
    height:9.448vw;
    padding:0.5vw;
    border-radius: 4px;
    background-color: #fff;
    cursor:pointer;
    position: relative;
    transition: all 0.3s;
    border: 2px solid transparent;
}

.container .items li:hover{
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.container .items li.selected{
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.check-mark{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(64, 158, 255, 0.8);
    border-radius: 4px;
    color: #fff;
    font-size: 40px;
}

.selected-info{
    font-size: 16px;
    color: #606266;
}

.compose-btn{
    padding: 12px 32px;
    font-size: 16px;
}

.compose-btn i{
    margin-right: 8px;
}

</style>