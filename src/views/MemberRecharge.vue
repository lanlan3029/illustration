<template>
  <div class="member-recharge-container">
 

   

      <!-- 主要内容区域：左侧（当前积分+说明）和右侧（充值套餐） -->
      <div class="main-content">
        <!-- 左侧容器：当前积分和积分使用说明 -->
        <div class="left-section">
          <el-card class="points-card" shadow="hover">
            <div class="points-info">
              <div class="points-icon">
                <i class="el-icon-coin"></i>
              </div>
              <div class="points-details">
                <h3>当前积分</h3>
                <p class="points-value">
                  {{ userPoints || 0 }}
                  <img src="@/assets/logo/count.png" alt="积分" class="points-icon-img" />
                </p>
                <p class="points-tip">生成一次图片消耗 2 <img src="@/assets/logo/count.png" alt="积分" class="points-icon-small" /></p>
              </div>
            </div>
          </el-card>

          <el-card class="info-card" shadow="hover">
            <div slot="header" class="card-header">
              <span>积分使用说明</span>
            </div>
            <ul class="info-list">
              <li>
                <i class="el-icon-info"></i>
                <span>充值 9.9 元可获得 100 <img src="@/assets/logo/count.png" alt="积分" class="points-icon-small" /></span>
              </li>
              <li>
                <i class="el-icon-info"></i>
                <span>生成一次图片消耗 2 <img src="@/assets/logo/count.png" alt="积分" class="points-icon-small" /></span>
              </li>
              <li>
                <i class="el-icon-info"></i>
                <span><img src="@/assets/logo/count.png" alt="积分" class="points-icon-small" /> 永久有效，不会过期</span>
              </li>
              <li>
                <i class="el-icon-info"></i>
                <span>如有问题，请联系客服</span>
              </li>
            </ul>
          </el-card>
        </div>

        <!-- 右侧：充值套餐 -->
        <el-card class="recharge-card" shadow="hover">
          <div slot="header" class="card-header">
            <span>充值套餐</span>
          </div>
          <div class="recharge-packages">
            <div 
              class="package-item" 
              :class="{ 'active': selectedPackage === 'basic' }"
              @click="selectPackage('basic')">
              <div class="package-header">
                <h3>基础套餐</h3>
                
              </div>
              <div class="package-content">
                <div class="package-top-row">
                  <div class="package-points">
                    <img src="@/assets/logo/count.png" alt="积分" class="points-icon-img" />
                    <span>100</span>
                  </div>
                  <div class="package-price">¥9.9</div>
                </div>
                <div class="package-desc">可生成 50 张图片</div>
              </div>
              <div class="package-badge" v-if="selectedPackage === 'basic'">
                <i class="el-icon-check"></i>
              </div>
            </div>
          </div>

          <!-- 支付方式 -->
          <div class="payment-section">
            <h3 class="section-title">选择支付方式</h3>
            <div class="payment-methods">
              <div 
                class="payment-method-item" 
                :class="{ 'active': paymentMethod === 'alipay' }"
                @click="paymentMethod = 'alipay'">
                <div class="payment-radio">
                  <i class="el-icon-check" v-if="paymentMethod === 'alipay'"></i>
                </div>
                <img src="@/assets/logo/alipay.png" alt="支付宝" class="payment-logo" />
                <span>支付宝</span>
              </div>
              <div 
                class="payment-method-item" 
                :class="{ 'active': paymentMethod === 'wxpay' }"
                @click="paymentMethod = 'wxpay'">
                <div class="payment-radio">
                  <i class="el-icon-check" v-if="paymentMethod === 'wxpay'"></i>
                </div>
                <img src="@/assets/logo/wepay.png" alt="微信支付" class="payment-logo" />
                <span>微信支付</span>
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="submit-section">
            <el-button 
              type="primary" 
              size="large"
              :loading="processing"
              :disabled="!selectedPackage || !paymentMethod"
              @click="handleRecharge"
              class="recharge-btn">
              <i class="el-icon-wallet"></i>
              立即充值 ¥9.9
            </el-button>
          </div>
        </el-card>

        <!-- 右侧：积分使用说明 -->
       
      </div>

      <!-- 二维码支付弹窗 -->
      <el-dialog
        title="扫码支付"
        :visible.sync="showQRCode"
        width="400px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false">
        <div class="qrcode-container">
          <div class="qrcode-wrapper">
            <img :src="qrCodeUrl" alt="支付二维码" class="qrcode-image" />
          </div>
          <p class="qrcode-tip">请使用{{ paymentMethod === 'alipay' ? '支付宝' : '微信' }}扫描二维码完成支付</p>
          <p class="qrcode-order">订单号：{{ currentOrderNo }}</p>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="cancelPayment">取消支付</el-button>
        </div>
      </el-dialog>
    
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'MemberRecharge',
  data() {
    return {
      selectedPackage: 'basic', // 当前选中的套餐
      paymentMethod: 'alipay', // 支付方式：alipay 或 wepay
      processing: false, // 是否正在处理
      userPoints: 0, // 用户当前积分
      currentOrderNo: null, // 当前订单号
      pollingInterval: null, // 订单状态轮询定时器
      showQRCode: false, // 是否显示二维码
      qrCodeUrl: '', // 二维码URL
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
    }
  },
  beforeDestroy() {
    // 组件销毁前清除轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  },
  computed: {
    ...mapState(['userInfo', 'isLogin'])
  },
  async mounted() {
    if (!this.isLogin) {
      this.$message.warning('请先登录');
      this.$router.push('/');
      return;
    }
    await this.getUserPoints();
  },
  methods: {
    // 选择套餐
    selectPackage(packageType) {
      this.selectedPackage = packageType;
    },

    // 获取用户积分
    async getUserPoints() {
      try {
        const userId = localStorage.getItem('id');
        if (!userId) return;

        const response = await this.$http.get(`/user/${userId}`, {
          headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
          }
        });

        if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
          const userData = response.data.data || response.data.message || response.data;
          this.userPoints = userData.points || userData.credits || 0;
          // 更新store中的用户信息
          if (this.userInfo) {
            this.$store.commit('setUserInfo', { ...this.userInfo, points: this.userPoints });
          }
        }
      } catch (error) {
        console.error('获取用户积分失败:', error);
      }
    },

    // 处理充值
    async handleRecharge() {
      if (!this.selectedPackage || !this.paymentMethod) {
        this.$message.warning('请选择套餐和支付方式');
        return;
      }

      this.processing = true;

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          this.$message.error('请先登录');
          this.$router.push('/');
          return;
        }

        // 步骤1：创建订单
        const orderData = {
          amount: 9.9, // 充值金额
          points: 100, // 充值积分
          payment_type: this.paymentMethod === 'alipay' ? 'alipay' : 'wepay' // 支付方式：alipay 或 wepay
        };

        const apiUrl = this.apiBaseUrl 
          ? `${this.apiBaseUrl}/payment/create-order`
          : '/payment/create-order';

        const createResponse = await this.$http.post(apiUrl, orderData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        });

        if (!createResponse.data || (createResponse.data.code !== 0 && createResponse.data.code !== '0')) {
          throw new Error(createResponse.data?.message || '创建订单失败');
        }

        const orderInfo = createResponse.data.message || createResponse.data.data || createResponse.data;
        const orderNo = orderInfo.order_no || orderInfo.order_id;

        if (!orderNo) {
          throw new Error('订单创建失败，未返回订单号');
        }

        this.currentOrderNo = orderNo;
        this.$message.success('订单创建成功，正在跳转支付...');

        // 步骤2：获取支付URL
        await this.getPayUrlAndProcess(orderNo);

      } catch (error) {
        console.error('充值失败:', error);
        this.$message.error(error.response?.data?.message || error.message || '充值失败，请稍后重试');
        this.processing = false;
      }
    },

    // 获取支付URL并处理支付
    async getPayUrlAndProcess(orderNo) {
      try {
        const token = localStorage.getItem('token');
        
        // 检测设备类型
        const device = this.detectDevice();
        
        const apiUrl = this.apiBaseUrl 
          ? `${this.apiBaseUrl}/payment/get-pay-url`
          : '/payment/get-pay-url';

        const response = await this.$http.post(apiUrl, {
          order_no: orderNo,
          method: 'web', // 使用web方式，后端会根据device自动判断
          device: device
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        });

        if (!response.data || (response.data.code !== 0 && response.data.code !== '0')) {
          throw new Error(response.data?.message || '获取支付链接失败');
        }

        const payInfo = response.data.message || response.data.data || response.data;
        const payType = payInfo.pay_type;
        const payInfoUrl = payInfo.pay_info;

        // 根据支付类型处理
        if (payType === 'jump') {
          // 跳转支付：直接跳转到支付页面
          window.location.href = payInfoUrl;
          // 开始轮询订单状态
          this.startPollingOrderStatus(orderNo);
        } else if (payType === 'qrcode') {
          // 二维码支付：显示二维码
          this.qrCodeUrl = payInfoUrl;
          this.showQRCode = true;
          this.processing = false;
          // 开始轮询订单状态
          this.startPollingOrderStatus(orderNo);
        } else {
          // 其他支付类型
          this.$message.warning(`不支持的支付类型: ${payType}`);
          this.processing = false;
        }

      } catch (error) {
        console.error('获取支付URL失败:', error);
        this.$message.error(error.response?.data?.message || error.message || '获取支付链接失败');
        this.processing = false;
      }
    },

    // 检测设备类型
    detectDevice() {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('micromessenger')) {
        return 'wepay'; // 微信内浏览器
      } else if (ua.includes('alipay')) {
        return 'alipay'; // 支付宝客户端
      } else if (ua.includes('qq/')) {
        return 'qq'; // 手机QQ内浏览器
      } else if (/mobile|android|iphone|ipad/.test(ua)) {
        return 'mobile'; // 手机浏览器
      } else {
        return 'pc'; // 电脑浏览器
      }
    },

    // 开始轮询订单状态
    startPollingOrderStatus(orderNo) {
      // 清除之前的轮询
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      let pollCount = 0;
      const maxPolls = 100; // 最多轮询100次（5分钟）

      this.pollingInterval = setInterval(async () => {
        pollCount++;
        
        if (pollCount > maxPolls) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
          return;
        }

        try {
          const token = localStorage.getItem('token');
          const apiUrl = this.apiBaseUrl 
            ? `${this.apiBaseUrl}/payment/order/${orderNo}?sync=true`
            : `/payment/order/${orderNo}?sync=true`;

          const response = await this.$http.get(apiUrl, {
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });

          if (response.data && (response.data.code === 0 || response.data.code === '0')) {
            const order = response.data.message || response.data.data || response.data;
            
            if (order.status === 1) {
              // 支付成功
              clearInterval(this.pollingInterval);
              this.pollingInterval = null;
              this.showQRCode = false;
              this.processing = false;
              
              // 更新用户积分
              await this.getUserPoints();
              
              this.$message.success('支付成功！积分已到账');
              
              // 跳转到成功页面或刷新
              setTimeout(() => {
                this.$router.push('/member/recharge/success');
              }, 1500);
            } else if (order.status === 2 || order.status === 3) {
              // 已退款或已冻结
              clearInterval(this.pollingInterval);
              this.pollingInterval = null;
              this.showQRCode = false;
              this.processing = false;
              this.$message.warning(`订单状态：${order.status_text || '异常'}`);
            }
          }
        } catch (error) {
          console.error('查询订单状态失败:', error);
          // 查询失败不中断轮询，继续尝试
        }
      }, 3000); // 每3秒查询一次
    },

    // 取消支付
    cancelPayment() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      this.showQRCode = false;
      this.processing = false;
      this.currentOrderNo = null;
      this.qrCodeUrl = '';
    }
  }
}
</script>

<style scoped>
.member-recharge-container {
  min-height: calc(100vh - 72px);
  padding: 40px 20px;

}

.header {
  text-align: center;
  margin-bottom: 40px;
  color: #fff;
}

.page-title {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #fff;
}

.page-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100vh - 200px); /* 确保有足够高度用于垂直居中 */
  justify-content: center; /* 垂直居中 */
  align-items: center; /* 水平居中 */
}

.main-content {
  display: flex;
  gap: 20px;
  align-items: stretch; /* 使子元素高度相同 */
  width: 60%;
  margin: 0 auto; /* 水平居中 */
}

.main-content .left-section {
  flex: 1; /* 宽度比为 1 */
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-content .recharge-card {
  flex: 3; /* 宽度比为 3 */
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.points-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.points-card >>> .el-card__body {
  padding: 30px;
}

.points-info {
  display: flex;
  align-items: center;
  gap: 30px;
  color: #fff;
}

.points-icon {
  font-size: 64px;
  opacity: 0.9;
}

.points-icon-img {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-left: 4px;
}

.points-icon-small {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin: 0 2px;
  display: inline-block;
}

.points-details h3 {
  font-size: 18px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.points-value {
  font-size: 48px;
  font-weight: 600;
  margin: 10px 0;
}

.points-tip {
  font-size: 14px;
  opacity: 0.8;
}

.recharge-card {
  background: #fff;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.recharge-packages {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.package-item {
  flex: 1;
  min-width: 250px;
  padding: 24px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  background: #fff;
}

.package-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.package-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.package-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.package-price {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.package-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.package-points {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.package-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.package-points img {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}

.package-desc {
  font-size: 14px;
  color: #909399;
}

.package-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.payment-section {
  margin: 30px 0;
  padding-top: 30px;
  border-top: 1px solid #e4e7ed;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.payment-methods {
  display: flex;
  gap: 20px;
  justify-content: center; /* 水平居中 */
}

.payment-method-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  background: #fff;
}

.payment-method-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.payment-method-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.payment-radio {
  width: 18px;
  height: 18px;
  border: 2px solid #dcdfe6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.payment-method-item.active .payment-radio {
  border-color: #409eff;
  background: #409eff;
}

.payment-method-item.active .payment-radio i {
  color: #fff;
  font-size: 12px;
}

.payment-method-item i.el-icon-wallet {
  color: #606266;
  font-size: 18px;
}

.payment-logo {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

/* 二维码支付弹窗 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.qrcode-wrapper {
  width: 300px;
  height: 300px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.qrcode-image {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.qrcode-tip {
  font-size: 16px;
  color: #303133;
  margin: 10px 0;
  text-align: center;
}

.qrcode-order {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
  text-align: center;
}

.submit-section {
  margin-top: 30px;
  text-align: center;
}

.recharge-btn {
  width: 100%;
  max-width: 400px;
  height: 50px;
  font-size: 18px;
}

.info-card {
  background: #fff;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  font-size: 14px;
  color: #606266;
  border-bottom: 1px solid #f0f0f0;
}

.info-list li:last-child {
  border-bottom: none;
}

.info-list li i {
  color: #409eff;
  font-size: 16px;
}

.info-list li span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .member-recharge-container {
    padding: 20px 10px;
  }

  .page-title {
    font-size: 28px;
  }

  .points-info {
    flex-direction: column;
    text-align: center;
  }

  .main-content {
    flex-direction: column;
  }

  .main-content .info-card {
    flex: 1;
    width: 100%;
  }

  .recharge-packages {
    flex-direction: column;
  }

  .package-item {
    min-width: 100%;
  }
}
</style>

