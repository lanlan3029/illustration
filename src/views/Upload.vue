<template>
    <div class="container">
    <div class="upload-container">
        <router-link to="/user/upload/upload-illustration" class="upload-card upload-card-illustration">
            <div class="card-content">
                <div class="icon-wrapper">
                    <el-icon class="card-icon"><UploadPictureIcon /></el-icon>
                </div>
                <h3 class="card-title">{{ $t('upload.uploadIllustration') }}</h3>
                <p class="card-desc">{{ $t('upload.uploadIllustrationDesc') }}</p>
            </div>
            <div class="card-overlay"></div>
        </router-link>
        <router-link to="/user/upload/upload-local-book" class="upload-card upload-card-book">
            <div class="card-content">
                <div class="icon-wrapper">
                    <el-icon class="card-icon"><UploadReadingIcon /></el-icon>
                </div>
                <h3 class="card-title">{{ $t('upload.uploadBook') }}</h3>
                <p class="card-desc">{{ $t('upload.uploadBookDesc') }}</p>
            </div>
            <div class="card-overlay"></div>
        </router-link>
    </div> 
    </div>
</template>

<script>
import { Picture as UploadPictureIcon, Reading as UploadReadingIcon } from '@element-plus/icons-vue'

export default {
  name: 'UploadPage',
  components: {
    UploadPictureIcon,
    UploadReadingIcon,
  },
  data() {
    return {
    }
  },
  methods: {
  },
  mounted() {
  },
}
</script>

<style scoped>
.container{
    width:100vw;
    min-height:calc(100vh - 90px);
    padding: 60px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
   
}

.upload-container{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 32px;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

.upload-card{
    position: relative;
    text-decoration: none;
    display: block;
    height: 280px;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.upload-card::before{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
    z-index: 1;
    transition: all 0.4s;
}

.upload-card-illustration{
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.upload-card-book{
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-content{
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    color: #fff;
}

.icon-wrapper{
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-icon{
    font-size: 40px;
    color: #fff;
    transition: all 0.4s;
}

.card-title{
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 12px 0;
    color: #fff;
    text-align: center;
    transition: all 0.4s;
}

.card-desc{
    font-size: 14px;
    margin: 0;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    line-height: 1.6;
    opacity: 0.9;
    transition: all 0.4s;
}

.card-overlay{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 1;
    transition: all 0.4s;
}

/* Hover Effects */
.upload-card:hover{
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.upload-card:hover::before{
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
}

.upload-card:hover .icon-wrapper{
    transform: scale(1.1) rotate(5deg);
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.upload-card:hover .card-icon{
    transform: scale(1.1);
}

.upload-card:hover .card-title{
    transform: translateY(-4px);
}

.upload-card:hover .card-desc{
    opacity: 1;
    transform: translateY(-2px);
}

.upload-card:hover .card-overlay{
    background: rgba(0, 0, 0, 0.05);
}

/* Active State */
.upload-card:active{
    transform: translateY(-4px) scale(0.98);
}

/* Responsive */
@media (max-width: 768px) {
    .upload-container{
        grid-template-columns: 1fr;
        gap: 24px;
        padding: 0 16px;
    }
    
    .upload-card{
        height: 240px;
    }
    
    .icon-wrapper{
        width: 64px;
        height: 64px;
        margin-bottom: 20px;
    }
    
    .card-icon{
        font-size: 32px;
    }
    
    .card-title{
        font-size: 20px;
    }
    
    .card-desc{
        font-size: 13px;
    }
}

</style>