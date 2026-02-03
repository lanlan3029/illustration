<template>
  <div class="newyear-container">
    <!-- 装饰性灯笼图标 -->
    <div class="decoration-lantern decoration-lantern-left">🏮</div>
    <div class="decoration-lantern decoration-lantern-right">🏮</div>
    <div class="decoration-fu decoration-fu-top-left">福</div>
    <div class="decoration-fu decoration-fu-top-right">福</div>
    
    <!-- 动态颗粒容器 -->
    <canvas ref="particlesCanvas" class="particles-canvas"></canvas>
    
    <div class="style-detail-container">
      <el-scrollbar class="style-list-container-scroll">
     
        <div class="gallery-link-wrapper">
          <router-link to="/newyear/gallery" class="gallery-link-button">
            <span class="button-icon"></span>
            <span class="button-text">2026幻彩新春</span>
            <span class="button-icon"></span>
          </router-link>
        </div>
        <div class="style-detail">
          <div class="detail-content">
            <!-- 图片展示区域：空白框或生成结果 -->
            <div class="image-display-area">
              <!-- 生成进度提示 -->
              <div v-if="generating" class="generating-progress">
                <i class="el-icon-loading"></i>
                <p>{{ $t('aiPicture.generating') }}</p>
              </div>

              <!-- 生成结果展示 -->
              <div v-else-if="generatedImageUrl" class="generated-result">
                <div class="result-image-wrapper">
                  <el-image
                    :src="generatedImageUrl"
                    fit="contain"
                    class="result-image"
                  >
                    <template #error>
                      <div class="image-slot">
                        <i class="el-icon-picture-outline"></i>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div class="result-actions">
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="collectIllustration"
                    :loading="collecting">
                    <i class="el-icon-star-on"></i> 收集插画
                  </el-button>
                  <el-button 
                    type="success" 
                    size="small"
                    @click="downloadIllustration"
                    :loading="downloading">
                    <i class="el-icon-download"></i> 下载插画
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="clearGeneratedImage">
                    <i class="el-icon-delete"></i> 清除
                  </el-button>
                </div>
              </div>

              <!-- 空白框（未生成时显示） -->
              <div v-else class="empty-image-box">
                <p>新年您想记录的美好瞬间</p>
              </div>
            </div>

            <div class="input-section">
              <label class="input-label">{{ $t('aiPicture.subjectScene') }}</label>
              <el-input
                v-model="subjectScene"
                type="textarea"
                :rows="4"
                :placeholder="$t('aiPicture.subjectPlaceholder')"
                class="subject-input"
              />
            </div>

            <el-button
              type="primary"
              class="generate-button"
              @click="generateIllustration"
              :loading="generating"
              :disabled="!subjectScene || !subjectScene.trim() || generating"
            >
              {{ generating ? $t('aiPicture.generating') : $t('aiPicture.generate') }}
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

export default {
  name: 'NewYear',
  setup() {
    const { locale } = useI18n()

    return {
      locale
    }
  },
  data() {
    return {
      subjectScene: '',
      editableArtStyle: '',
      editableElementDetails: '',
      generating: false,
      generatedImageUrl: null,
      collecting: false,
      downloading: false,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '',
      particlesAnimationId: null,
      particles: [],
      resizeHandler: null
    }
  },
  computed: {
    generatedPrompt() {
      if (!this.subjectScene || !this.subjectScene.trim()) {
        return ''
      }
      // 使用固定的默认风格提示词
      const defaultArtStyle = '梦幻童话风格，彩色轮廓插图，纯色、喜庆红色背景，无拘无束的氛围，浪漫、生动的色彩和宽松的笔触，春节喜庆、嬉戏和无忧无虑的场景。'
      let prompt = `${this.subjectScene.trim()}，${defaultArtStyle}`
      return prompt
    }
  },
  mounted() {
    // 关闭登录弹窗（此页面不需要登录）
    this.$store.commit('closeMask')
    
    // 从 localStorage 恢复之前生成的插画
    const savedImage = localStorage.getItem('newyear_generated_image')
    if (savedImage) {
      this.generatedImageUrl = savedImage
    }
    
    // 初始化动态颗粒效果
    this.initParticles()
  },
  
  beforeUnmount() {
    // 清理动画
    if (this.particlesAnimationId) {
      cancelAnimationFrame(this.particlesAnimationId)
    }
    // 清理 resize 事件监听器
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  },
  methods: {
    async generateIllustration() {
      if (!this.generatedPrompt) {
        ElMessage.warning('请先输入主体场景')
        return
      }

      this.generatedImageUrl = null
      this.generating = true

      try {
        const requestData = {
          prompt: this.generatedPrompt,
          size: '1024x1024'
        }

        const apiUrl = this.apiBaseUrl 
          ? `${this.apiBaseUrl}/create-character`
          : '/create-character'

        const response = await this.$http.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 180000
        })

        const responseData = response.data
        
        // 检查是否是限流错误（后端返回 allowed: false）
        if (responseData.allowed === false) {
          const errorMessage = responseData.type === 'create-character' 
            ? '免费次数已用完，登录解锁更多免费次数吧！'
            : (responseData.type && responseData.maxCount 
              ? `同一IP地址最多只能免费创建 ${responseData.maxCount} 张${responseData.type}主题的插画`
              : (responseData.message || '免费次数已用完，登录解锁更多免费次数吧！'))
          
          ElMessage({
            message: errorMessage,
            type: 'error',
            offset: Math.floor(window.innerHeight / 2 - 30) // 页面中间位置，减去消息框高度的一半
          })
          return
        }
        
        const isSuccess = (responseData.code === 0 || responseData.code === '0') 
          || responseData.desc === 'success' 
          || responseData.statuscode === 'success'

        if (isSuccess && responseData.message) {
          const result = responseData.message
          
          // 如果后端返回了最新积分，更新全局用户信息，TopBar 会自动刷新显示
          if (result && typeof result === 'object' && result.points !== undefined && this.$store && this.$store.state) {
            this.$store.commit('setUserInfo', {
              ...(this.$store.state.userInfo || {}),
              points: result.points
            })
          }
          let imageUrl = null
          if (result.image_url) {
            imageUrl = result.image_url
          } else if (result.character_image_url) {
            imageUrl = result.character_image_url
          } else if (result.image) {
            imageUrl = result.image
          } else if (result.url) {
            imageUrl = result.url
          }

          if (imageUrl) {
            this.generatedImageUrl = imageUrl
            
            // 保存到 localStorage，防止刷新后丢失
            localStorage.setItem('newyear_generated_image', imageUrl)
            
            ElMessage.success('插画生成成功！')
            
            // 自动保存到"我的插画"，类别为"春节"
            await this.autoSaveIllustration(imageUrl)
          } else {
            throw new Error('响应中未找到图片URL')
          }
        } else {
          // 检查响应中是否有错误信息
          const errorMsg = responseData.message || responseData.desc || responseData.error
          if (errorMsg) {
            ElMessage({
              message: errorMsg,
              type: 'error'
            })
          } else {
            ElMessage.error('出错啦，请稍后再试')
          }
        }
      } catch (error) {
        // 检查错误响应中是否有限流信息
        if (error.response && error.response.data) {
          const errorData = error.response.data
          
          if (errorData.allowed === false) {
            const errorMessage = errorData.type === 'create-character' 
              ? '免费次数已用完，登录解锁更多免费次数吧！'
              : (errorData.type && errorData.maxCount 
                ? `同一IP地址最多只能免费创建 ${errorData.maxCount} 张${errorData.type}主题的插画`
                : (errorData.message || '免费次数已用完，登录解锁更多免费次数吧！'))
            
            ElMessage({
              message: errorMessage,
              type: 'error',
              offset: Math.floor(window.innerHeight / 2 - 30) // 页面中间位置，减去消息框高度的一半
            })
          } else if (errorData.message) {
            ElMessage({
              message: errorData.message,
              type: 'error',
              offset: Math.floor(window.innerHeight / 2 - 30) // 页面中间位置，减去消息框高度的一半
            })
          } else {
            ElMessage({
              message: '出错啦，请稍后再试',
              type: 'error',
              offset: Math.floor(window.innerHeight / 2 - 30) // 页面中间位置，减去消息框高度的一半
            })
          }
        } else {
          ElMessage({
            message: '出错啦，请稍后再试',
            type: 'error',
            offset: Math.floor(window.innerHeight / 2 - 30) // 页面中间位置，减去消息框高度的一半
          })
        }
      } finally {
        this.generating = false
      }
    },
    clearGeneratedImage() {
      this.generatedImageUrl = null
      // 清除 localStorage 中保存的插画
      localStorage.removeItem('newyear_generated_image')
    },
    // 自动保存插画到"我的插画"
    async autoSaveIllustration(imageUrl) {
      try {
        // 处理URL格式
        let pictureValue = imageUrl
        
        // 如果是相对路径，转换为完整URL
        if (pictureValue && !pictureValue.startsWith('http://') && !pictureValue.startsWith('https://') && !pictureValue.startsWith('data:')) {
          pictureValue = `https://static.kidstory.cc/${pictureValue}`
        }
        
        // 构建请求数据
        const requestData = {
          picture: pictureValue, // 支持 URL 或 base64
          title: this.subjectScene || '新年插画',
          description: this.generatedPrompt || '新年主题插画',
          type: '春节' // 类别设置为"春节"
        }
        
        // 发送请求到服务器（不需要登录，静默处理）
        await this.$http.post('/ill/', requestData, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        // 静默失败，不显示错误提示
      }
    },
    
    // 手动收集插画（如果用户想再次保存）
    async collectIllustration() {
      if (!this.generatedImageUrl) {
        ElMessage.warning('图片尚未生成，请稍候')
        return
      }
      
      this.collecting = true
      
      try {
        // 处理URL格式
        let pictureValue = this.generatedImageUrl
        
        // 如果是相对路径，转换为完整URL
        if (pictureValue && !pictureValue.startsWith('http://') && !pictureValue.startsWith('https://') && !pictureValue.startsWith('data:')) {
          pictureValue = `https://static.kidstory.cc/${pictureValue}`
        }
        
        // 构建请求数据
        const requestData = {
          picture: pictureValue, // 支持 URL 或 base64
          title: this.subjectScene || '新年插画',
          description: this.generatedPrompt || '新年主题插画',
          type: '春节' // 类别设置为"春节"
        }
        
        // 发送请求到服务器（不需要登录）
        const response = await this.$http.post('/ill/', requestData, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        // 检查响应
        if (response.data && (response.data.desc === 'success' || response.data.code === 0 || response.data.code === '0')) {
          ElMessage.success('插画已保存')
        } else {
         ElMessage({
          message: '出错啦，请稍后再试',
          type: 'error',
          offset: Math.floor(window.innerHeight / 2 - 30) // 页面中间位置，减去消息框高度的一半
         })
        }
        } catch (error) {
         ElMessage({
           message: '出错啦，请稍后再试',
           type: 'error',
           offset: Math.floor(window.innerHeight / 2 - 30) // 页面中间位置，减去消息框高度的一半
         })
        } finally {
        this.collecting = false
      }
    },
    downloadIllustration() {
      if (!this.generatedImageUrl) return
      const link = document.createElement('a')
      link.href = this.generatedImageUrl
      link.download = 'illustration.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    
    // 初始化动态颗粒效果
    initParticles() {
      this.$nextTick(() => {
        const canvas = this.$refs.particlesCanvas
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        
        // 创建颗粒数组
        const particleCount = 50
        this.particles = []
        
        for (let i = 0; i < particleCount; i++) {
          this.particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 200, // 从底部开始
            size: Math.random() * 3 + 1,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3,
            glow: Math.random() * 0.3 + 0.2
          })
        }
        
        // 动画循环
        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          this.particles.forEach(particle => {
            // 更新位置（向上移动）
            particle.y -= particle.speed
            
            // 如果颗粒超出顶部，重新从底部开始
            if (particle.y < -10) {
              particle.y = canvas.height + Math.random() * 100
              particle.x = Math.random() * canvas.width
            }
            
            // 绘制颗粒（金色星光效果）
            ctx.save()
            ctx.globalAlpha = particle.opacity
            
            // 外发光
            const gradient = ctx.createRadialGradient(
              particle.x, particle.y, 0,
              particle.x, particle.y, particle.size * 3
            )
            gradient.addColorStop(0, `rgba(255, 215, 0, ${particle.glow})`)
            gradient.addColorStop(0.5, `rgba(255, 193, 7, ${particle.glow * 0.5})`)
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
            
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
            ctx.fill()
            
            // 核心亮点
            ctx.fillStyle = `rgba(255, 215, 0, ${particle.opacity})`
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fill()
            
            // 十字星光效果
            ctx.strokeStyle = `rgba(255, 215, 0, ${particle.opacity * 0.6})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particle.x - particle.size * 2, particle.y)
            ctx.lineTo(particle.x + particle.size * 2, particle.y)
            ctx.moveTo(particle.x, particle.y - particle.size * 2)
            ctx.lineTo(particle.x, particle.y + particle.size * 2)
            ctx.stroke()
            
            ctx.restore()
          })
          
          this.particlesAnimationId = requestAnimationFrame(animate)
        }
        
        animate()
        
        // 监听窗口大小变化
        this.resizeHandler = () => {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
        }
        window.addEventListener('resize', this.resizeHandler)
      })
    }
  }
}
</script>

<style scoped>
/* 新年红色主题背景 */
.newyear-container {
  min-height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #dc143c 0%, #c41e3a 50%, #b22222 100%);
  position: relative;
  overflow: hidden;
}

/* 微光感：背景中心径向渐变光晕 */
.newyear-container::before {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80vw;
  height: 80vh;
  background: radial-gradient(
    circle at center,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(255, 193, 7, 0.1) 30%,
    rgba(220, 20, 60, 0.05) 60%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* 装饰性灯笼 */
.decoration-lantern {
  position: fixed;
  font-size: 60px;
  opacity: 0.25;
  z-index: 0;
  animation: float 3s ease-in-out infinite;
  pointer-events: none;
}

.decoration-lantern-left {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.decoration-lantern-right {
  top: 15%;
  right: 5%;
  animation-delay: 1.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* 装饰性福字 */
.decoration-fu {
  position: fixed;
  font-size: 80px;
  font-weight: bold;
  color: rgba(255, 215, 0, 0.2);
  font-family: 'KaiTi', '楷体', serif;
  z-index: 0;
  pointer-events: none;
  transform: rotate(-15deg);
}

.decoration-fu-top-left {
  top: 5%;
  left: 8%;
}

.decoration-fu-top-right {
  top: 8%;
  right: 8%;
  transform: rotate(15deg);
}

/* 背景装饰图案 - 灯笼和福字 */
.newyear-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    /* 灯笼图案 */
    radial-gradient(circle at 10% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 25%),
    radial-gradient(circle at 90% 30%, rgba(255, 215, 0, 0.1) 0%, transparent 25%),
    radial-gradient(circle at 15% 80%, rgba(255, 215, 0, 0.08) 0%, transparent 25%),
    radial-gradient(circle at 85% 70%, rgba(255, 215, 0, 0.08) 0%, transparent 25%),
    /* 福字装饰 */
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 215, 0, 0.02) 10px,
      rgba(255, 215, 0, 0.02) 20px
    );
  pointer-events: none;
  z-index: 0;
}

/* 动态颗粒 Canvas */
.particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

/* 磨砂玻璃效果 - 画板容器 */
.style-detail-container {
  max-width: 600px;
  height: calc(100vh - 80px);
  margin: 0 auto;
  /* 更暗的背景色，带纹理 */
  background: 
    /* 噪点纹理 */
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.1) 0px,
      transparent 1px,
      transparent 2px,
      rgba(0, 0, 0, 0.05) 2px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.1) 0px,
      transparent 1px,
      transparent 2px,
      rgba(0, 0, 0, 0.05) 2px
    ),
    /* 渐变纹理 */
    radial-gradient(
      circle at 20% 30%,
      rgba(220, 20, 60, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(255, 215, 0, 0.1) 0%,
      transparent 50%
    ),
    /* 基础背景 */
    rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 0 3px rgba(255, 215, 0, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 灯笼装饰 */
.style-detail-container::before {
  content: '🏮';
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 40px;
  opacity: 0.3;
  z-index: 0;
  animation: lanternSwing 3s ease-in-out infinite;
}

.style-detail-container::after {
  content: '🏮';
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 40px;
  opacity: 0.3;
  z-index: 0;
  animation: lanternSwing 3s ease-in-out infinite;
  animation-delay: 1.5s;
}

@keyframes lanternSwing {
  0%, 100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

.style-list-container-scroll {
  max-height: calc(100vh - 80px);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  padding: 20px 16px 12px;
  color: #fff;
  text-align: center;
  position: relative;

 
  z-index: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.section-title::before {
  content: '🎊';
  margin-right: 8px;
  font-size: 24px;
}

.section-title::after {
  content: '🎊';
  margin-left: 8px;
  font-size: 24px;
}

/* 2026幻彩新春按钮样式 */
.gallery-link-wrapper {
  padding: 12px 16px;
  text-align: center;

}

.gallery-link-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(180, 30, 50, 0.9) 0%, rgba(150, 20, 40, 0.95) 50%, rgba(120, 15, 30, 1) 100%);
  color: #fff;
  text-decoration: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(220, 20, 60, 0.4);
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 215, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.gallery-link-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.gallery-link-button:hover::before {
  left: 100%;
}

.gallery-link-button:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(200, 40, 60, 0.95) 0%, rgba(170, 30, 50, 1) 50%, rgba(140, 20, 40, 1) 100%);
  box-shadow: 0 6px 20px rgba(150, 20, 40, 0.6);
  border-color: rgba(255, 215, 0, 0.9);
}

.gallery-link-button:active {
  transform: translateY(0);
}

.button-icon {
  font-size: 20px;
  animation: sparkle 2s ease-in-out infinite;
}

.button-icon:last-child {
  animation-delay: 1s;
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 0.8;
  }
}

.button-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.style-detail {
  padding: 0 16px 16px;
  background: transparent;
  position: relative;
  z-index: 1;
}

.image-display-area {
  border-radius: 12px;
  border: 2px dashed rgba(255, 215, 0, 0.5);
  padding: 16px;
  margin: 0 auto 16px;
  background: rgba(248, 241, 241, 0.106);
  backdrop-filter: blur(5px);
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  width: 80%;
}

/* 顶部居中的 new year 图标 */
.image-display-area::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  background-image: url('@/assets/images/newyear/newyear.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

/* 左下角的 horse 图标 */
.image-display-area::after {
  content: '';
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 100px;
  height: 100px;
  background-image: url('@/assets/images/newyear/horse.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

.generating-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.generating-progress i {
  font-size: 32px;
  color: rgba(255, 215, 0, 0.9);
  animation: rotate 1s linear infinite;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.generated-result {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  z-index: 1;
}

.result-image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(220, 20, 60, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding-top: 12px;
  flex-shrink: 0;
}

.empty-image-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  z-index: 1;
  width: 100%;
  height: 100%;
}

.empty-image-box::before {
  content: '✨';
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 20px;
  opacity: 0.3;
}

.empty-image-box::after {
  content: '✨';
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 20px;
  opacity: 0.3;
}

.input-section {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 6px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.subject-input :deep(.el-textarea__inner) {
  font-size: 13px;
  border-color: rgba(220, 20, 60, 0.3);
  transition: all 0.3s;
}

.subject-input :deep(.el-textarea__inner):focus {
  border-color: #dc143c;
  box-shadow: 0 0 0 2px rgba(220, 20, 60, 0.1);
}

.generate-button {
  width: 100%;
  margin-top: 8px;
  background: linear-gradient(135deg, rgba(180, 30, 50, 0.9) 0%, rgba(150, 20, 40, 0.95) 50%, rgba(120, 15, 30, 1) 100%);
  border: 2px solid rgba(255, 215, 0, 0.5);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  height: 48px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(150, 20, 40, 0.4);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.generate-button::before {
  content: '🎉';
  margin-right: 8px;
}

.generate-button:hover {
  background: linear-gradient(135deg, rgba(200, 40, 60, 0.95) 0%, rgba(170, 30, 50, 1) 50%, rgba(140, 20, 40, 1) 100%);
  border-color: rgba(255, 215, 0, 0.9);
  box-shadow: 0 6px 20px rgba(150, 20, 40, 0.5);
  transform: translateY(-2px);
}

.generate-button:active {
  transform: translateY(0);
}

.generate-button:disabled {
  background: #f1b8b8;
  box-shadow: none;
  cursor: not-allowed;
}

/* 按钮样式覆盖 */
.generate-button :deep(.el-button__inner) {
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .newyear-container {
    padding: 8px;
  }

  .style-detail-container {
    border-radius: 12px;
  }

  .newyear-container::after {
    font-size: 60px;
  }

  .section-title {
    font-size: 18px;
    padding: 16px 12px 10px;
  }

  .decoration-lantern {
    font-size: 40px;
    opacity: 0.15;
  }

  .decoration-fu {
    font-size: 50px;
    opacity: 0.15;
  }

  .gallery-link-wrapper {
    padding: 10px 12px;
  }

  .gallery-link-button {
    padding: 10px 20px;
    font-size: 14px;
    gap: 6px;
  }

  .button-icon {
    font-size: 18px;
  }

  .button-text {
    font-size: 14px;
    letter-spacing: 0.5px;
  }
}
</style>


