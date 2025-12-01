# 支付接口文档

## 接口说明

支付流程分为两步：
1. 创建订单 - 生成订单记录
2. 获取支付URL - 调用易支付接口，获取支付链接

---

## 1. 创建订单

**接口地址：** `POST /payment/create-order`

**请求头：**
```
Authorization: Bearer {token}  // 需要JWT认证
Content-Type: application/json
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| amount | Number | 是 | 订单金额（元），必须大于0 | 10.00 |
| points | Number | 是 | 购买的积分数量，必须大于0 | 100 |
| payment_type | String | 是 | 支付方式 | alipay, wechat, qq 等 |

**支付方式列表：**
- `alipay` - 支付宝
- `wechat` - 微信支付
- `qq` - QQ钱包
- 其他易支付支持的支付方式

**请求示例：**
```json
{
  "amount": 10.00,
  "points": 100,
  "payment_type": "alipay"
}
```

**返回示例：**
```json
{
  "code": 0,
  "message": {
    "order_no": "ORDER17212060721234",
    "order_id": "507f1f77bcf86cd799439011",
    "amount": 10.00,
    "points": 100,
    "payment_type": "alipay"
  }
}
```

---

## 2. 获取支付URL

**接口地址：** `POST /payment/get-pay-url`

**请求头：**
```
Authorization: Bearer {token}  // 需要JWT认证
Content-Type: application/json
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| order_no | String | 是 | 订单号（从创建订单接口获取） | ORDER17212060721234 |
| method | String | 否 | 接口类型，默认：web | web, jump, jsapi, app, scan, applet |
| device | String | 否 | 设备类型，默认：pc（仅method=web时需要） | pc, mobile, qq, wechat, alipay |

**接口类型说明：**
- `web` - 通用网页支付（会根据device判断，自动返回跳转url/二维码/小程序跳转url等）
- `jump` - 跳转支付（仅会返回跳转url）
- `jsapi` - JSAPI支付（小程序内支付使用）
- `app` - APP支付（iOS/安卓APP内支付使用）
- `scan` - 付款码支付
- `applet` - 小程序支付

**设备类型说明（仅method=web时需要）：**
- `pc` - 电脑浏览器（默认）
- `mobile` - 手机浏览器
- `qq` - 手机QQ内浏览器
- `wechat` - 微信内浏览器
- `alipay` - 支付宝客户端

**请求示例：**
```json
{
  "order_no": "ORDER17212060721234",
  "method": "web",
  "device": "pc"
}
```

**返回示例：**
```json
{
  "code": 0,
  "message": {
    "trade_no": "2024072320222180092",
    "pay_type": "jump",
    "pay_info": "https://pay.yi-zhifu.cn/pay/xxx",
    "order_no": "ORDER17212060721234"
  }
}
```

**pay_type 说明：**
- `jump` - 返回支付跳转url（直接跳转）
- `qrcode` - 返回支付二维码（需要前端展示二维码）
- `jsapi` - 返回JSAPI支付参数（小程序内支付）
- `app` - 返回APP支付参数
- `scan` - 付款码支付成功，返回订单信息
- `wxplugin` - 返回微信小程序插件参数
- `wxapp` - 返回微信小程序跳转参数

---

## 3. 查询订单状态

**接口地址：** `GET /payment/order/:order_no`

**请求头：**
```
Authorization: Bearer {token}  // 需要JWT认证
```

**URL参数：**
- `order_no` - 订单号

**Query参数：**
- `sync` - 是否同步易支付最新状态（可选），值为 `true` 或 `1`

**请求示例：**
```
GET /payment/order/ORDER17212060721234?sync=true
```

**返回示例：**
```json
{
  "code": 0,
  "message": {
    "order_no": "ORDER17212060721234",
    "amount": 10.00,
    "points": 100,
    "payment_type": "alipay",
    "status": 1,
    "status_text": "已支付",
    "paid_at": "2024-07-01T16:49:24.000Z",
    "created_at": "2024-07-01T16:47:32.000Z",
    "yipay_info": {
      "trade_no": "2024072320222180092",
      "api_trade_no": "40001249985198893",
      "status": 1,
      "status_text": "已支付",
      "addtime": "2024-07-01 16:47:32",
      "endtime": "2024-07-01 16:49:24"
    },
    "synced": true
  }
}
```

**订单状态说明：**
- `0` - 待支付
- `1` - 已支付
- `2` - 已退款
- `3` - 已冻结

---

## 完整支付流程示例

### 前端代码示例（JavaScript/TypeScript）

```javascript
// 1. 创建订单
async function createPaymentOrder(amount, points, paymentType) {
  const response = await fetch('/payment/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: amount,
      points: points,
      payment_type: paymentType
    })
  });
  
  const result = await response.json();
  return result.message.order_no;
}

// 2. 获取支付URL
async function getPayUrl(orderNo, method = 'web', device = 'pc') {
  const response = await fetch('/payment/get-pay-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      order_no: orderNo,
      method: method,
      device: device
    })
  });
  
  const result = await response.json();
  return result.message;
}

// 3. 处理支付
async function handlePayment(amount, points, paymentType) {
  try {
    // 步骤1：创建订单
    const orderNo = await createPaymentOrder(amount, points, paymentType);
    console.log('订单创建成功:', orderNo);
    
    // 步骤2：获取支付URL
    const payInfo = await getPayUrl(orderNo, 'web', 'pc');
    console.log('支付信息:', payInfo);
    
    // 步骤3：根据pay_type处理支付
    if (payInfo.pay_type === 'jump') {
      // 直接跳转到支付页面
      window.location.href = payInfo.pay_info;
    } else if (payInfo.pay_type === 'qrcode') {
      // 展示二维码
      showQRCode(payInfo.pay_info);
    } else if (payInfo.pay_type === 'jsapi') {
      // 小程序内支付
      handleJSAPIPayment(JSON.parse(payInfo.pay_info));
    }
    
    // 步骤4：轮询查询订单状态
    pollOrderStatus(orderNo);
    
  } catch (error) {
    console.error('支付失败:', error);
  }
}

// 4. 轮询查询订单状态
function pollOrderStatus(orderNo) {
  const interval = setInterval(async () => {
    const response = await fetch(`/payment/order/${orderNo}?sync=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    const order = result.message;
    
    if (order.status === 1) {
      // 支付成功
      clearInterval(interval);
      alert('支付成功！');
      // 刷新用户积分等信息
    } else if (order.status === 2 || order.status === 3) {
      // 已退款或已冻结
      clearInterval(interval);
      alert('订单状态异常');
    }
  }, 3000); // 每3秒查询一次
  
  // 30秒后停止轮询
  setTimeout(() => {
    clearInterval(interval);
  }, 30000);
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| -1 | 缺少参数 |
| -2 | 无权限 |
| -3 | 服务器错误 |

---

## 注意事项

1. **所有接口都需要JWT认证**（除了支付回调接口）
2. **金额单位**：元，支持两位小数
3. **订单号格式**：`ORDER` + 时间戳 + 4位随机数
4. **支付回调**：支付成功后，易支付会自动调用 `/payment/notify` 接口，无需前端处理
5. **支付返回**：用户支付完成后会跳转到配置的 `return_url`
6. **建议使用HTTPS**：确保支付安全

