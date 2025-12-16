<template>
    <div>
        <div class="toolbar">
            <!-- <el-button>撤销</el-button> -->
            <!-- <el-button>重做</el-button> -->
            <div class="left">
            <label for="input" class="insert">插入本地图片</label>
            <input
                id="input"
                type="file"
                hidden
                @change="handleFileChange"
            />
            <ComponentList />
            <label 
              class="insert" 
              :class="{ 'disabled': downloading }"
              @click.prevent.stop="exportImg"
              :style="downloading ? { cursor: 'not-allowed', opacity: 0.6 } : {}"
            >下载图片</label>
            </div>
       
            <label class="insert" @click="saveToMyIll">保存</label>
            <label class="insert" @click="deleteDraft">清空</label>
            <label class="export" @click="AICompose">智能优化</label>
              
           
                          
        </div>
    </div>
</template>
<script>
import {mapState} from "vuex"
import { ElMessage } from 'element-plus'

import toast from '@/utils/toast'
import html2Canvas from "html2canvas"

import ComponentList from '@/components/ComponentList' // 左侧列表组件
// 导入generateID
import generateID from "@/utils/generateID"
// 导入自定义样式的包
import {commonStyle,commonAttr} from "@/custom-component/component-list"
export default {
    name: 'EditorToolbar',
    data(){
        return{
            id:localStorage.getItem('id'),  
            needToChange: [
                'top',
                'left',
                'width',
                'height',
                'fontSize',
                'borderWidth',
            ],
            draftArry:[]
        }
    },
    components:{
       ComponentList
    },
    props:{
        draftid:{type:String,default:''},
        downloading:{type:Boolean,default:false}
    },
    computed:mapState([
        "componentData",
        "canvasStyleData",
        "curComponent"
    ]),
    created(){
    },
    methods:{
        // 点击导入图片
        handleFileChange(e){
            // 获取图片信息
            const file = e.target.files[0]
            // 查看是否是图片样式
            if(!file.type.includes("image")){
                toast("只能放图片","error")
                return
            }

            const reader = new FileReader()
            reader.onload = (res) =>{
                // 图片路径
                const fileResult = res.target.result
                // console.log(res,"Res")
                // console.log(fileResult,"fileResult")
                const img = new Image()
                
                img.onload = () => {
                    // 将图片数据传输到vuex中
                    this.$store.commit("addComponent",{
                        component:{
                            ...commonAttr,
                            id:generateID(),
                            // 组件种类
                            component:"Picture",
                            label:"图片",
                            icon:"",
                            // 图片路径
                            propValue:fileResult,
                            // 图片样式
                            style:{
                                ...commonStyle,
                                top:0,
                                left:0,
                                width:img.width,
                                height:img.height,
                            }
                        }
                    })
                    document.querySelector('#input').setAttribute('type', 'text')
                    document.querySelector('#input').setAttribute('type', 'file')
                }
                img.src = fileResult
            }
            reader.readAsDataURL(file)
        },      
       exportImg(){
        // 如果正在下载，不执行
        if (this.downloading) {
          return;
        }
        console.log('download')
        this.$emit('downLoad')
       },
    
       async AICompose(){
        // 调用火山引擎的生图接口进行AI智能合成
        try {
            // 取消选中组件
            this.$store.commit('setCurComponent', {component:null,index:null});
            // 隐藏右键菜单
            this.$store.commit('hideContextMenu');
            
            // 等待 DOM 更新完成
            await this.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 获取画布元素
            let target = document.getElementsByClassName("content");
            if (!target || !target[0]) {
                ElMessage.warning('未找到画布内容，请先添加元素到画布');
                return;
            }

            // 显示加载提示
            const loading = ElMessage({
                message: '正在获取画布内容...',
                type: 'info',
                duration: 0
            });
            
            // 预加载所有图片，确保图片已缓存
            await this.preloadImages(target[0]);
            
            // 使用html2canvas将画布转换为图片
            const canvas = await html2Canvas(target[0], {
                dpi: 96,
                useCORS: true,
                allowTaint: false,
                imageTimeout: 15000,
                scale: 2,
                logging: false,
                removeContainer: true,
                cacheBust: false,
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
            });
            
            // 将canvas转换为base64
            const canvasBase64 = canvas.toDataURL("image/jpeg", 0.92);
            
            // 提示词
            const prompt = "高清修复，4K 分辨率，绘图精细度 30，保留各图元原始特征；统一风格：儿童彩铅插画风格，色调柔和清新；智能优化：边缘过渡自然，消除拼接痕迹，比例协调，画面整体统一；negative prompt: 元素错位，边缘生硬，风格割裂，拼接痕迹明显，比例失衡";
            
            // 更新加载提示
            loading.message = 'AI智能合成中，请稍候...';
            
            // 构建请求数据
            const requestData = {
                prompt: prompt,
                image: canvasBase64, // 画布图片的base64
                size: '1280x960' // 图片尺寸
            };
            
            // 调用火山引擎生图接口（通过后端）
            const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/create-character`
                    : '/create-character';
            
            const response = await this.$http.post(apiUrl, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                },
                timeout: 180000 // 3分钟超时
            });
            
            // 关闭加载提示
            loading.close();
            
            // 处理响应
            const responseData = response.data;
            
            // 检查成功响应：code === 0 或 desc === 'success' 或 statuscode === 'success'
            const isSuccess = (responseData.code === 0 || responseData.code === '0') 
                || responseData.desc === 'success' 
                || responseData.statuscode === 'success';
            
            if (isSuccess) {
                // 提取图片URL或base64
                const result = responseData.message || responseData.data || responseData;
                let imageUrl = null;
                
                if (result.image_url) {
                    imageUrl = result.image_url;
                } else if (result.image) {
                    imageUrl = result.image;
                } else if (result.url) {
                    imageUrl = result.url;
                } else if (result.result_url) {
                    imageUrl = result.result_url;
                } else if (typeof result === 'string') {
                    // 可能是base64或URL
                    imageUrl = result;
                }
                
                if (imageUrl) {
                    // 将生成的图片添加到画布中
                    const img = new Image();
                    img.onload = () => {
                        // 将图片数据传输到vuex中
                        this.$store.commit("addComponent", {
                            component: {
                                ...commonAttr,
                                id: generateID(),
                                component: "Picture",
                                label: "AI合成图片",
                                icon: "",
                                propValue: imageUrl,
                                style: {
                                    ...commonStyle,
                                    top: 0,
                                    left: 0,
                                    width: img.width,
                                    height: img.height,
                                }
                            }
                        });
                        ElMessage.success('AI智能合成成功！图片已添加到画布');
                    };
                    img.onerror = () => {
                        ElMessage.error('图片加载失败，请检查图片数据');
                    };
                    img.src = imageUrl;
                } else {
                    throw new Error('响应中未找到图片数据');
                }
            } else {
                const errorMsg = responseData.message || responseData.desc || responseData.error || 'AI智能合成失败，请重试';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('AI智能合成失败:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.desc || error.message || 'AI智能合成失败，请重试';
            ElMessage.error(errorMessage);
        }
       },
       
       // 预加载所有图片，并将图片转换为base64缓存
       async preloadImages(container) {
           const images = container.querySelectorAll('img');
           const imagePromises = Array.from(images).map(async (img) => {
               if (img.complete && img.naturalWidth > 0) {
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
                   return Promise.resolve();
               }
               return new Promise((resolve) => {
                   img.onload = async () => {
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
               });
           });
           await Promise.all(imagePromises);
       },
    
       
       // 保存画布图片到"我的插画"
       async saveToMyIll(){
           try {
               // 取消选中组件
               this.$store.commit('setCurComponent', {component:null,index:null});
               // 隐藏右键菜单
               this.$store.commit('hideContextMenu');
               
               // 等待 DOM 更新完成
               await this.$nextTick();
               await new Promise(resolve => setTimeout(resolve, 100));
               
               // 获取画布元素
               let target = document.getElementsByClassName("content");
               if (!target || !target[0]) {
                   ElMessage.warning('未找到画布内容，请先添加元素到画布');
                   return;
               }

               // 显示加载提示
               const loading = ElMessage({
                   message: '正在保存画布图片...',
                   type: 'info',
                   duration: 0
               });
               
               // 预加载所有图片，确保图片已缓存
               await this.preloadImages(target[0]);
               
               // 使用html2canvas将画布转换为图片
               const canvas = await html2Canvas(target[0], {
                   dpi: 96,
                   useCORS: true,
                   allowTaint: false,
                   imageTimeout: 15000,
                   scale: 2,
                   logging: false,
                   removeContainer: true,
                   cacheBust: false,
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
               });
               
               // 将canvas转换为base64
               const canvasBase64 = canvas.toDataURL("image/jpeg", 0.92);
               
               // 获取token
               const token = localStorage.getItem('token') || '';
               if (!token) {
                   loading.close();
                   ElMessage.warning('请先登录');
                   return;
               }
               
               // 构建请求数据
               const requestData = {
                   picture: canvasBase64, // base64 格式的图片
                   title: '创作插画',
                   description: '从画布保存的插画',
                   type: 'others' // 默认类别为"其他"
               };
               
               // 调用保存插画接口
               const response = await this.$http.post('/ill/', requestData, {
                   headers: {
                       'Content-Type': 'application/json',
                       'Authorization': 'Bearer ' + token
                   }
               });
               
               // 关闭加载提示
               loading.close();
               
               // 检查响应
               if (response.data && (response.data.desc === 'success' || response.data.code === 0 || response.data.code === '0')) {
                   ElMessage.success('已保存到"我的插画"');
               } else {
                   throw new Error(response.data?.message || '保存失败');
               }
           } catch (error) {
               console.error('保存画布图片失败:', error);
               const errorMessage = error.response?.data?.message || error.message || '保存失败，请重试';
               ElMessage.error(`保存失败: ${errorMessage}`);
           }
       },
       deleteDraft(){
        // 清空画布中的所有图元
        this.$store.commit('setComponentData', []);
        // 取消选中组件
        this.$store.commit('setCurComponent', {component: null, index: null});
        // 隐藏右键菜单
        this.$store.commit('hideContextMenu');
        ElMessage.success('画布已清空');
       }
    }
}
</script>
<style scoped>
.toolbar{
    padding: 8px;
    display: flex;
    width:60vw;
    margin: 16px auto 0 auto;
    justify-content: space-between;
}
.left{
    width:50%;
    display: flex;
    justify-content: space-between;
}

.insert{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    padding: 6px 16px;
    font-size: 14px;
    transition: all 0.3s ease;
    border-radius: 6px;
    font-weight: 500;
    min-height: 30px;
    min-width: 100px;
    color: #1d1d1f;
    text-align: center;
    background-color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.insert:hover{
    background-color: #f5f7fa;
    color: #019AD8;
    border-color: #019AD8;
    box-shadow: 0 2px 4px rgba(1, 154, 216, 0.15);
    transform: translateY(-1px);
}

.insert:active{
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.export{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid #71c563;
    padding: 6px 16px;
    font-size: 14px;
    margin-left: 10px;
    transition: all 0.3s ease;
    border-radius: 6px;
    font-weight: 500;
    min-height: 30px;
    min-width: 100px;
    color: #fff;
    text-align: center;
    background-color: #71c563;
    box-shadow: 0 1px 2px rgba(113, 197, 99, 0.2);
}

.export:hover{
    background-color: #5fb34f;
    border-color: #5fb34f;
    box-shadow: 0 2px 6px rgba(113, 197, 99, 0.3);
    transform: translateY(-1px);
}

.export:active{
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(113, 197, 99, 0.2);
}

</style>