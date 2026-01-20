# 微信登录配置指南

## 前端配置

### 1. 环境变量配置

在项目根目录创建 `.env` 文件（如果不存在），添加以下配置：

```env
# 微信开放平台配置
VUE_APP_WECHAT_APPID=你的微信开放平台AppID
```

### 2. 获取微信 AppID

1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 注册并登录开发者账号
3. 创建网站应用
4. 填写应用信息并提交审核
5. 审核通过后，在应用详情页面获取 `AppID`

### 3. 配置授权回调域名

在微信开放平台的应用详情页面：

1. 进入"开发信息" -> "网站应用"
2. 在"授权回调域名"中添加你的域名（不需要包含协议和路径）
   - 例如：`example.com` 或 `api.example.com`
   - 注意：不能包含 `http://` 或 `https://`
   - 不能包含路径，如 `/callback`

## 后端配置

### 1. 环境变量配置

在服务器上创建 `.env` 文件，添加以下配置：

```env
# 微信开放平台配置
WECHAT_APPID=你的微信开放平台AppID
WECHAT_SECRET=你的微信开放平台AppSecret

# JWT配置
JWT_SECRET=你的JWT密钥（建议至少32位随机字符串）
```

### 2. 获取微信 AppSecret

1. 在微信开放平台的应用详情页面
2. 点击"查看"按钮查看 `AppSecret`
3. **重要**：AppSecret 必须保密，不要提交到代码仓库

### 3. 生成 JWT 密钥

可以使用以下方法生成安全的 JWT 密钥：

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**Python:**
```python
import secrets
secrets.token_urlsafe(32)
```

**命令行:**
```bash
openssl rand -hex 32
```

## 测试步骤

### 1. 前端测试

1. 启动前端开发服务器：`npm run serve`
2. 打开登录页面
3. 点击"微信登录"按钮
4. 应该跳转到微信授权页面或显示二维码

### 2. 后端测试

1. 确保后端服务已启动
2. 使用 Postman 或 curl 测试接口：

```bash
curl -X POST https://your-api.com/auth/wechat/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "测试授权码",
    "state": "测试state"
  }'
```

### 3. 完整流程测试

1. 在前端点击微信登录
2. 使用微信扫码授权
3. 检查是否成功跳转回网站
4. 检查是否成功登录并获取用户信息

## 常见问题

### 1. "redirect_uri 参数错误"

**原因：** 回调域名配置不正确

**解决方案：**
- 检查微信开放平台中配置的授权回调域名
- 确保域名与前端实际使用的域名一致
- 注意：域名不需要包含协议和路径

### 2. "该链接无法访问"

**原因：** 授权URL参数错误或域名未配置

**解决方案：**
- 检查 AppID 是否正确
- 检查 redirect_uri 是否正确编码
- 检查 scope 是否为 `snsapi_login`
- 检查授权回调域名是否已配置

### 3. 前端无法获取 AppID

**原因：** 环境变量未正确配置

**解决方案：**
- 确保 `.env` 文件在项目根目录
- 确保环境变量名称为 `VUE_APP_WECHAT_APPID`
- 重启开发服务器
- 检查 `.env` 文件是否被 `.gitignore` 忽略（应该被忽略）

### 4. 后端接口返回错误

**原因：** 后端配置或代码问题

**解决方案：**
- 检查后端环境变量是否正确配置
- 检查 AppID 和 AppSecret 是否正确
- 查看后端日志获取详细错误信息
- 参考 `WECHAT_LOGIN_BACKEND.md` 文档检查实现

## 安全注意事项

1. **不要将 AppSecret 提交到代码仓库**
   - 使用环境变量存储
   - 添加到 `.gitignore`

2. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - 微信授权回调也需要 HTTPS

3. **验证 state 参数**
   - 前端已实现 state 验证
   - 后端也可以再次验证，增强安全性

4. **保护用户数据**
   - 不要在前端存储敏感信息
   - 使用安全的 token 存储方式

## 相关文档

- [微信登录后端实现指南](./WECHAT_LOGIN_BACKEND.md)
- [微信开放平台文档](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)

