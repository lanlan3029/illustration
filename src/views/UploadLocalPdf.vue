<template>
<div class="container">
<div class="box">

<el-form ref="form" :model="form" label-width="100px">
    <el-form-item label="上传作品">
    <el-upload
     action="https://jsonplaceholder.typicode.com/posts/"
  class="upload-demo"
  accept=".pdf"
  drag
   :on-change="handleChange"
  multiple
  :limit="1" :show-file-list="true"
  :file-list="fileList">
  <i class="el-icon-upload"></i>
  <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
  <div class="el-upload__tip" slot="tip">只能上传PDF文件，且不超过10M。</div>
</el-upload>
  </el-form-item>
  <el-form-item label="作品名称">
    <el-input v-model="form.name"></el-input>
  </el-form-item>
   <el-form-item label="类别">
    <el-select v-model="form.category" placeholder="请选择绘本类别">
      <el-option label="情绪管理" value="shanghai"></el-option>
      <el-option label="科普百科" value="beijing"></el-option>
       <el-option label="认真学习" value="beijing"></el-option>
        <el-option label="品格习惯" value="beijing"></el-option>
    </el-select>
  </el-form-item>
  <el-form-item label="作品描述">
    <el-input type="textarea" v-model="form.desc"></el-input>
  </el-form-item>
   <el-form-item>
    <el-button type="primary" @click="onSubmit" class="btn">上传</el-button>
  </el-form-item>

</el-form>

</div>
</div>
</template>

<script>
export default {
   data() {
      return {
        fileList: [],
        form: {
          name: '',
          category:'',
          desc: ''
        }
      };
    },
    methods: {
     handleChange(file,fileList) { 
        this.fileList=fileList
        console.log(this.fileList)
        
      },
    
      onSubmit() {
        console.log('submit!');
      }
    }
}
</script>

<style scoped>
.container{
    width:100vw;
    height:90vh;
    padding:2vw 20vw;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.box{
    width:60vw;
}
.box>>>.el-input__inner{
    box-shadow:none;
}
.btn{
  width:360px;
}
</style>