# 微信登录后端实现指南

## 概述

本文档说明后端需要实现的微信登录相关接口和逻辑。

## 参考文档

- [微信开放平台 - 网站应用微信登录开发指南](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)

## 后端需要实现的接口

### 1. 微信登录回调接口

**接口路径：** `POST /auth/wechat/callback`

**请求参数：**

```json
{
  "code": "微信授权码",
  "state": "状态参数（用于防止CSRF攻击）"
}
```

**响应格式：**

成功时：
```json
{
  "desc": "success",
  "message": {
    "token": "用户登录token"
  },
  "user_id": "用户ID"
}
```

失败时：
```json
{
  "desc": "error",
  "message": "错误信息"
}
```

## 后端实现步骤

### 第一步：通过 code 换取 access_token

使用微信提供的接口，通过 code 换取 access_token：

**接口地址：** `https://api.weixin.qq.com/sns/oauth2/access_token`

**请求参数：**
- `appid`: 微信开放平台网站应用的 AppID
- `secret`: 微信开放平台网站应用的 AppSecret
- `code`: 前端传来的授权码
- `grant_type`: 固定值 `authorization_code`

**请求示例：**
```
GET https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
```

**响应示例：**
```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 7200,
  "refresh_token": "REFRESH_TOKEN",
  "openid": "OPENID",
  "scope": "SCOPE",
  "unionid": "UNIONID"
}
```

### 第二步：通过 access_token 获取用户信息（可选）

如果需要获取用户基本信息，可以调用：

**接口地址：** `https://api.weixin.qq.com/sns/userinfo`

**请求参数：**
- `access_token`: 上一步获取的 access_token
- `openid`: 上一步获取的 openid
- `lang`: 语言，可选值 `zh_CN`、`zh_TW`、`en`

**请求示例：**
```
GET https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN
```

**响应示例：**
```json
{
  "openid": "OPENID",
  "nickname": "用户昵称",
  "sex": 1,
  "province": "PROVINCE",
  "city": "CITY",
  "country": "COUNTRY",
  "headimgurl": "头像URL",
  "privilege": [],
  "unionid": "UNIONID"
}
```

### 第三步：处理用户登录/注册逻辑

1. **检查用户是否已存在**
   - 使用 `openid` 或 `unionid` 查询数据库中是否已有该用户
   - 如果使用 `unionid`，可以关联同一微信开放平台账号下的多个应用

2. **用户不存在时创建新用户**
   - 创建新用户记录
   - 保存 `openid`、`unionid`、用户信息等

3. **用户已存在时更新信息**
   - 更新用户信息（昵称、头像等）
   - 更新最后登录时间

4. **生成登录 token**
   - 生成 JWT token 或其他认证 token
   - 返回给前端

## Node.js 实现示例

```javascript
const axios = require('axios');
const jwt = require('jsonwebtoken');

// 微信登录配置
const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_SECRET = process.env.WECHAT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

// 微信登录回调接口
app.post('/auth/wechat/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    // 1. 通过 code 换取 access_token
    const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: WECHAT_APPID,
        secret: WECHAT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      }
    });

    const { access_token, openid, unionid } = tokenResponse.data;

    if (!access_token || !openid) {
      return res.json({
        desc: 'error',
        message: '获取微信授权失败'
      });
    }

    // 2. 获取用户信息（可选）
    let userInfo = null;
    try {
      const userInfoResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
        params: {
          access_token: access_token,
          openid: openid,
          lang: 'zh_CN'
        }
      });
      userInfo = userInfoResponse.data;
    } catch (err) {
      console.error('获取用户信息失败:', err);
      // 即使获取用户信息失败，也可以继续登录流程
    }

    // 3. 查找或创建用户
    let user = await User.findOne({ 
      $or: [
        { wechat_openid: openid },
        { wechat_unionid: unionid }
      ]
    });

    if (!user) {
      // 创建新用户
      user = await User.create({
        wechat_openid: openid,
        wechat_unionid: unionid,
        nickname: userInfo?.nickname || '微信用户',
        avatar: userInfo?.headimgurl || '',
        email: '', // 微信登录可能没有邮箱
        created_at: new Date(),
        last_login: new Date()
      });
    } else {
      // 更新用户信息
      if (userInfo) {
        user.nickname = userInfo.nickname || user.nickname;
        user.avatar = userInfo.headimgurl || user.avatar;
      }
      user.last_login = new Date();
      await user.save();
    }

    // 4. 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. 返回成功响应
    res.json({
      desc: 'success',
      message: {
        token: token
      },
      user_id: user._id.toString()
    });

  } catch (error) {
    console.error('微信登录回调处理失败:', error);
    res.json({
      desc: 'error',
      message: error.response?.data?.errmsg || '微信登录失败，请稍后重试'
    });
  }
});
```

## 数据库表结构建议

```sql
-- 用户表需要添加的字段
ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(100);
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
ALTER TABLE users ADD COLUMN last_login DATETIME;

-- 创建索引
CREATE INDEX idx_wechat_openid ON users(wechat_openid);
CREATE INDEX idx_wechat_unionid ON users(wechat_unionid);
```

## 环境变量配置

后端需要配置以下环境变量：

```env
# 微信开放平台配置
WECHAT_APPID=你的微信开放平台AppID
WECHAT_SECRET=你的微信开放平台AppSecret

# JWT配置
JWT_SECRET=你的JWT密钥
```

## 安全注意事项

1. **AppSecret 安全**
   - AppSecret 必须存储在服务器端，绝不能暴露给客户端
   - 使用环境变量或密钥管理服务存储

2. **State 参数验证**
   - 前端已经实现了 state 参数验证，后端也可以再次验证
   - 防止 CSRF 攻击

3. **Token 安全**
   - 使用 HTTPS 传输
   - 设置合理的过期时间
   - 使用安全的签名算法

4. **错误处理**
   - 不要向客户端暴露敏感错误信息
   - 记录详细的错误日志用于排查

## 测试步骤

1. 在微信开放平台配置授权回调域名
2. 确保前端可以正常跳转到微信授权页面
3. 用户扫码授权后，检查后端是否正确接收到 code
4. 验证后端能否成功换取 access_token
5. 验证用户创建/更新逻辑
6. 验证 token 生成和返回

## 常见问题

1. **"redirect_uri 参数错误"**
   - 检查微信开放平台中配置的授权回调域名是否正确
   - 确保回调 URL 与配置的域名一致

2. **"code 已过期"**
   - code 的有效期为 10 分钟
   - 确保后端及时处理回调请求

3. **"access_token 无效"**
   - access_token 有效期为 2 小时
   - 如果过期，需要使用 refresh_token 刷新

## 前端配置

前端需要在 `.env` 文件中配置微信 AppID：

```env
VUE_APP_WECHAT_APPID=你的微信开放平台AppID
```

或者在 `LoginRegister.vue` 中直接替换 `YOUR_WECHAT_APPID`。

