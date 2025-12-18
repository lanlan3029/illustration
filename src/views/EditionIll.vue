<template>
    <div class="container">
<div class="box">
      <h2 class="page-title">编辑插画</h2>
      <el-form label-width="120px" ref="form" :model="form" :rules="rules">
        <el-form-item label="作品预览">
          <div class="image-wrapper">
            <el-image 
              :src="imageUrl" 
              fit="contain"
              class="preview-image"
              :preview-src-list="[imageUrl]">
              <template #error>
                <div class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                  <p>图片加载失败</p>
                </div>
              </template>
            </el-image>
          </div>
  </el-form-item>
        
        <el-form-item label="作品名称" prop="name">
          <el-input 
            v-model="form.name" 
            placeholder="请输入作品名称"
            maxlength="50"
            show-word-limit>
          </el-input>
  </el-form-item>
        
        <el-form-item label="类别" prop="category">
          <el-select 
            v-model="form.category" 
            placeholder="请选择插画类别"
            style="width: 100%">
     <el-option label="生活日常" value="daily"></el-option>
        <el-option label="欢庆节日" value="festival"></el-option>
         <el-option label="校园生活" value="school"></el-option>
          <el-option label="动物世界" value="animal"></el-option>
          <el-option label="奇幻想象" value="fantasy"></el-option>
          <el-option label="数学知识" value="math"></el-option> 
          <el-option label="文学知识" value="literature"></el-option>
          <el-option label="英语学习" value="english"></el-option>
          <el-option label="其他" value="others"></el-option>
    </el-select>
  </el-form-item>
        
        <el-form-item label="作品描述" prop="desc">
          <el-input 
            type="textarea" 
            v-model="form.desc" 
            placeholder="请输入作品描述"
            :rows="4"
            maxlength="500"
            show-word-limit>
          </el-input>
  </el-form-item>
        
   <el-form-item>
          <el-button 
            type="primary" 
            @click="onSubmit" 
            :loading="submitting"
            icon="el-icon-upload">
            保存修改
          </el-button>
          <el-button 
            type="danger" 
            @click="handleDelete" 
            :loading="deleting"
            icon="el-icon-delete">
            删除作品
          </el-button>
          <el-button 
            @click="handleCancel"
            icon="el-icon-back">
            返回
          </el-button>
  </el-form-item>
</el-form>
</div>
    </div>
</template>

<script>
import {mapState} from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'EditionIll',
  data(){
    return{
      form: {
        name: '',
        desc: '',
        category: '',
      },
      rules: {
        name: [
          { required: true, message: '请输入作品名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择插画类别', trigger: 'change' }
        ]
      },
      submitting: false,
      deleting: false
    }
  },
  computed: {
    ...mapState(['editionIllus']),
    imageUrl() {
      if (!this.editionIllus || !this.editionIllus.content) {
        return '';
      }
      return `https://static.kidstory.cc/${this.editionIllus.content}`;
    },
    illustrationId() {
      return this.editionIllus?._id || '';
    }
  },
  
  mounted(){
    if (this.editionIllus) {
      this.form.name = this.editionIllus.title || '';
      this.form.desc = this.editionIllus.description || '';
      this.form.category = this.editionIllus.type || '';
    }
  },
  
  methods: {
    // 提交表单
    onSubmit(){
      this.$refs.form.validate((valid) => {
        if (!valid) {
          ElMessage.warning('请完善表单信息');
          return false;
        }
        
        if (!this.illustrationId) {
          ElMessage.error('缺少作品ID，无法保存');
          return;
        }
        
        this.submitting = true;
        this.$http.put(`/ill/${this.illustrationId}`,
          {
            title: this.form.name,
            description: this.form.desc,
            type: this.form.category
          },
      {
            headers: {
              "Authorization": "Bearer " + localStorage.getItem("token")
            }
          })
          .then((response) => {
            if (response.data.desc === "success" || response.data.code === 0) {
              ElMessage({
                message: '保存成功',
                type: 'success'
              });
              // 延迟跳转，让用户看到成功提示
              setTimeout(() => {
                this.$router.push('/user/upload/edition-success');
              }, 1000);
            } else {
              ElMessage.error(response.data.message || '保存失败，请重试');
            }
          })
          .catch((error) => {
            console.error('保存失败:', error);
            ElMessage.error(error.response?.data?.message || '保存失败，请稍后重试');
          })
          .finally(() => {
            this.submitting = false;
          });
      });
    },
    
    // 处理删除（显示确认弹窗）
    handleDelete(){
      if (!this.illustrationId) {
        ElMessage.error('缺少作品ID，无法删除');
        return;
      }
      
      const illustrationName = this.form.name || '该作品';
      
      this.$confirm(
        `确定要删除"${illustrationName}"吗？。`,
        '确认删除',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      ).then(() => {
        this.deleteIll(this.illustrationId);
      }).catch(() => {
        // 用户取消删除
      });
    },
    
    // 执行删除操作
    deleteIll(id){
      this.deleting = true;
      this.$http
        .delete(`/ill/${id}`, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          }
        })
        .then((response) => {
          if (response.data.desc === "success" || response.data.code === 0) {
            ElMessage({
              message: '删除成功',
          type: 'success'
        });
            // 跳转到我的主页，并显示"我的插画"标签（tab=3）
            setTimeout(() => {
              this.$router.push({ path: '/user', query: { tab: '3' } });
            }, 1000);
          } else {
            ElMessage.error(response.data.message || '删除失败，请重试');
          }
        })
        .catch((error) => {
          console.error('删除失败:', error);
          ElMessage.error(error.response?.data?.message || '删除失败，请稍后重试');
        })
        .finally(() => {
          this.deleting = false;
        });
   },
 
    // 取消/返回
    handleCancel(){
      this.$confirm('确定要返回吗？未保存的修改将丢失。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$router.go(-1);
      }).catch(() => {
        // 用户取消
      });
    }
  }
}
</script>

<style scoped>
.container {
  width: 100vw;
  height: 90vh;
  padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  background-color: #f5f6fa;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.box {
  width: 100%;
  max-width: 800px;
  background-color: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
  box-sizing: border-box;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 30px 0;
  padding-bottom: 15px;
  border-bottom: 2px solid #409eff;
}

.image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 10px;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s;
}

.preview-image:hover {
  transform: scale(1.02);
}

.image-slot {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 300px;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.image-slot p {
  margin-top: 10px;
  font-size: 14px;
}

.el-form-item {
  margin-bottom: 25px;
}

.el-form-item:last-child {
  margin-bottom: 0;
  margin-top: 30px;
}

.el-button {
  margin-right: 10px;
}

.el-button:last-child {
  margin-right: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 20px 10px;
  }
  
  .box {
    padding: 20px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .preview-image {
    max-height: 250px;
  }
  
  .el-form-item {
    margin-bottom: 20px;
  }
  
  .el-button {
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .el-button:last-child {
    margin-bottom: 0;
  }
}
</style>