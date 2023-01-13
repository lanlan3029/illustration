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
             <label class="insert" @click="exportImg">保存图片到本地</label></div>
              <label class="insert" @click="saveDraft">保存草稿</label> <label class="insert" @click="deleteDraft">删除草稿</label>
              <label class="export" @click="uploadIllu">上传作品</label>
              
           
                          
        </div>
    </div>
</template>
<script>
import {mapState} from "vuex"

import toast from '@/utils/toast'

import ComponentList from '@/components/ComponentList' // 左侧列表组件
// 导入generateID
import generateID from "@/utils/generateID"
// 导入自定义样式的包
import {commonStyle,commonAttr} from "@/custom-component/component-list"
export default {
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
        draftid:{type:String,default:''}
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
        this.$emit('downLoad')
       },
       uploadIllu(){
        this.$emit('uploadIllustration')
       },
    saveDraft(){
        this.draftArry=this.componentData
       console.log(this.draftArry)
        this.$http.post(`/ill/draft`,{content:this.draftArry},
        {  headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }} ).then((response) => {
          if (response.data.desc === "success") {
            this.$message('草稿已保存');     
          } else {
             this.$router.push({path:'/errorpage'});   
          }
        })
        .catch((error) => console.log(error));
       },
       deleteDraft(){
        this.$http.delete(`/ill/draft/`+this.draftid,{ headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }}).then((response) => {
          if (response.data.desc === "success") {
            this.$store.commit('setComponentData',[])
            this.$message('草稿已删除');        
          } else {
             this.$router.push({path:'/errorpage'});   
          }
        })
        .catch((error) => console.log(error));
       }
       
 
    }
}
</script>
<style scoped>
.toolbar{
    padding: 8px;
   margin-bottom: auto;
    display: flex;
    width:60vw;
    margin:auto;
    justify-content: space-between;
}
.left{
    width:50%;
    display: flex;
    justify-content: space-between;
}


.insert{
    display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    padding: 12px 2px;
    font-size: 14px;
    transition: .1s;
    border-radius: 4px;
    font-weight: 500;
    height:14px;
    min-width: 80px;
    color:#1d1d1f;
    text-align: center;
   
}

.insert:hover{
    background-color: #ecf5ff;
    color: #3a8ee6;
}
.export{
   display: inline-block;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    padding: 12px 20px;
    font-size: 14px;
    margin-left: 10px;
    transition: .1s;
    border-radius: 4px;
    font-weight: 500;
    height:14px;
    width: 56px;
    color:#fff;
    text-align: center;
    background-color:#71c563;
}
.export:hover{
    background-color: #a99bd6;
}

</style>