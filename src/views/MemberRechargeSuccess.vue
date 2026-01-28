<template>
  <div class="recharge-success-container">
    <div class="success-card">
      <div class="success-icon">
        <i class="el-icon-success"></i>
      </div>
      <h1 class="title">支付成功</h1>
      <p class="subtitle">积分已到账，感谢您的支持！</p>

      <div class="info-box" v-if="orderNo || points">
        <p v-if="orderNo">
          <span class="label">订单号：</span>
          <span class="value">{{ orderNo }}</span>
        </p>
        <p v-if="points">
          <span class="label">本次获得：</span>
          <span class="value">{{ points }} 积分</span>
        </p>
        <p>
          <span class="label">当前积分：</span>
          <span class="value">{{ userPoints }} 积分</span>
        </p>
      </div>

      <div class="button-group">
        <el-button type="primary" @click="goToCreatePicture">
          去生成图片
        </el-button>
        <el-button @click="goToHome">
          返回首页
        </el-button>
        <el-button type="text" @click="goToRecharge">
          继续充值
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'MemberRechargeSuccess',
  data() {
    return {
      userPoints: 0, // 当前积分
      loading: false
    }
  },
  computed: {
    ...mapState(['userInfo']),
    // 从路由 query 中获取订单号和本次积分（如果有传）
    orderNo() {
      return this.$route.query.orderNo || this.$route.query.out_trade_no || ''
    },
    points() {
      // 本次获得的积分，可以按产品固定值展示
      return 100
    }
  },
  async mounted() {
    // 页面加载时获取最新的用户积分
    await this.getUserPoints()
  },
  methods: {
    // 获取用户积分
    async getUserPoints() {
      try {
        const userId = localStorage.getItem('id')
        if (!userId) {
          // 如果没有用户ID，尝试从 store 中获取
          if (this.userInfo && (this.userInfo.points || this.userInfo.credits)) {
            this.userPoints = this.userInfo.points || this.userInfo.credits || 0
          }
          return
        }

        const token = localStorage.getItem('token')
        if (!token) {
          return
        }

        const response = await this.$http.get(`/user/${userId}`, {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        })

        if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
          const userData = response.data.data || response.data.message || response.data
          const points = userData.points || userData.credits || 0
          
          // 更新本地数据
          this.userPoints = points
          
          // 更新 store 中的用户信息，这样 TopBar 也会自动更新
          if (userData) {
            this.$store.commit('setUserInfo', {
              ...this.userInfo,
              ...userData,
              points: points,
              credits: points
            })
          }
        }
      } catch (error) {
        console.error('获取用户积分失败:', error)
        // 如果获取失败，尝试从 store 中获取
        if (this.userInfo && (this.userInfo.points || this.userInfo.credits)) {
          this.userPoints = this.userInfo.points || this.userInfo.credits || 0
        }
      }
    },
    goToHome() {
      this.$router.push('/')
    },
    goToCreatePicture() {
      this.$router.push('/ai-picture')
    },
    goToRecharge() {
      this.$router.push('/member/recharge')
    }
  }
}
</script>

<style scoped>
.recharge-success-container {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f8f0 100%);
}

.success-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #07c160 0%, #10b981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 40px;
}

.title {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.subtitle {
  font-size: 14px;
  color: #606266;
  margin-bottom: 24px;
}

.info-box {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 16px 20px;
  text-align: left;
  margin-bottom: 24px;
}

.info-box p {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}

.label {
  color: #909399;
}

.value {
  color: #303133;
  font-weight: 500;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.button-group .el-button {
  min-width: 120px;
}

@media (max-width: 768px) {
  .success-card {
    padding: 30px 20px;
  }

  .title {
    font-size: 22px;
  }
}
</style>


