# 微信登录配置指南

## 前端配置

**重要说明：** 前端不需要配置任何环境变量。微信登录的 AppID 和 Secret 都在后端配置，前端通过调用后端 API 来获取微信授权 URL。

### 前端工作流程

根据微信官方文档，微信登录流程分为三个步骤：

**第一步：请求CODE**
1. 用户点击"微信登录"按钮
2. 前端调用后端接口 `/pb/auth/wechat/appid` 获取微信 AppID
3. 前端构建微信授权URL并跳转：
   ```
   https://open.weixin.qq.com/connect/qrconnect?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect
   ```
4. 用户使用微信扫码并确认授权后，微信会重定向到 `redirect_uri` 并带上 `code` 和 `state` 参数

**第二步：通过code获取access_token（后端处理）**
- 前端将 `code` 和 `state` 发送给后端 `/pb/auth/wechat/callback` 接口
- 后端使用 `code` 加上 `AppID` 和 `AppSecret` 调用微信API换取 `access_token`
- 后端创建/更新用户信息，返回 JWT token 给前端

**第三步：完成登录**
- 前端保存 JWT token 和用户信息
- 跳转到首页或之前的页面

**注意：** 当前实现使用的是跳转方式（符合官方文档）。微信还提供了内嵌二维码的方式，可以在页面内显示二维码，无需跳转，但需要引入微信的JS文件。

### 配置授权回调域名

在微信开放平台的应用详情页面：

1. 进入"开发信息" -> "网站应用"
2. 在"授权回调域名"中添加你的域名（不需要包含协议和路径）
   - 例如：`www.kidstory.cc` 或 `kidstory.cc`
   - 注意：不能包含 `http://` 或 `https://`
   - 不能包含路径，如 `/callback`

**重要说明：**
- 当前配置的授权回调域：`www.kidstory.cc`
- `redirect_uri` 的域名部分必须与授权回调域名完全一致
- `redirect_uri` 必须使用 HTTPS（生产环境要求）
- 开发环境如果使用 localhost，需要额外在微信开放平台配置 `localhost` 作为授权回调域名
- 或者开发环境也使用生产域名 `https://www.kidstory.cc/wechat/callback`（当前实现方案）

### 检查清单（重要）

在开始使用微信登录前，请确保：

- [ ] **应用类型正确**：使用的是"网站应用"类型的 AppID（不是移动应用、小程序等）
- [ ] **已申请微信登录功能**：在应用详情页面的"功能信息"中，有"微信登录"且状态为"已审核通过"
- [ ] **应用状态正常**：应用状态为"已审核通过"，没有被暂停或禁用
- [ ] **授权回调域名已配置**：在"开发信息" -> "网站应用"中已配置授权回调域名
- [ ] **AppID 和 AppSecret 匹配**：后端使用的 AppID 和 AppSecret 来自同一个"网站应用"

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

### 3. 后端接口实现

后端已实现以下接口：

#### 方式1：服务端重定向方式（推荐，已实现）

**接口路径：** `GET /pb/auth/wechat/authorize`

**请求参数：**
- `redirect_uri` (string, 必需): 授权回调地址，需要URL编码
- `state` (string, 可选): 状态参数，用于防止CSRF攻击

**响应：** 302重定向到微信扫码登录页面

**前端使用方式：**
```javascript
const callbackUrl = `${window.location.origin}/wechat/callback`
const state = '随机生成的state参数'
window.location.href = `/pb/auth/wechat/authorize?redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`
```

#### 方式2：返回AppID（备用方案，已实现）

**接口路径：** `GET /pb/auth/wechat/appid`

**响应格式：**
```json
{
  "code": 1000,
  "desc": "success",
  "appid": "wx1234567890"
}
```

**前端使用方式：**
```javascript
// 1. 获取 appid
const response = await fetch('/pb/auth/wechat/appid').then(r => r.json())
const { appid } = response

// 2. 前端自行构建授权URL并跳转
const callbackUrl = `${window.location.origin}/wechat/callback`
const state = '随机生成的state参数'
const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
window.location.href = authUrl
```

#### 必需接口：处理授权回调（已实现）

**接口路径：** `POST /pb/auth/wechat/callback`

**请求体：**
```json
{
  "code": "微信返回的授权码",
  "state": "状态参数"
}
```

**响应格式：**
```json
{
  "desc": "success",
  "message": {
    "token": "JWT token"
  },
  "user_id": "用户ID"
}
```

**功能说明：**
- 使用 code 换取 access_token
- 创建/更新用户信息
- 返回 JWT token 供前端使用

**关于授权作用域（scope）：**
- 前端在构建授权URL时使用固定值 `scope=snsapi_login`（这是网站应用的标准授权作用域）
- 后端在通过 code 换取 access_token 时，微信会返回用户实际授权的作用域信息
- 如果后端需要返回scope信息给前端，可以在响应中包含：
```json
{
  "desc": "success",
  "message": {
    "token": "JWT token"
  },
  "user_id": "用户ID",
  "scope": "snsapi_login"  // 可选：返回授权作用域
}
```

**后端换取access_token的API（参考）：**
```
POST https://api.weixin.qq.com/sns/oauth2/access_token
参数：
- appid: 应用唯一标识
- secret: 应用密钥AppSecret
- code: 第一步获取的code参数
- grant_type: authorization_code

返回：
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 7200,
  "refresh_token": "REFRESH_TOKEN",
  "openid": "OPENID",
  "scope": "snsapi_login",
  "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"  // 可选
}
```

**重要安全提示：**
- AppSecret 必须存储在服务器端，不能暴露给客户端
- access_token 和 refresh_token 也应该由后端管理，不要返回给前端
- 建议后端自行管理业务登录态（JWT token），减少用户重新授权次数

### 4. 生成 JWT 密钥

**重要说明：** `JWT_SECRET` 不是从微信开放平台获取的，而是**需要你自己生成**的一个密钥。这个密钥用于签名和验证 JWT token，确保 token 的安全性。

#### 方法一：使用 Node.js 生成（推荐）

在 Node.js 环境中运行：

```javascript
// 在 Node.js 命令行或文件中运行
require('crypto').randomBytes(32).toString('hex')
```

或者创建一个临时文件 `generate-jwt-secret.js`：

```javascript
const crypto = require('crypto');
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
```

然后运行：
```bash
node generate-jwt-secret.js
```

#### 方法二：使用 Python 生成

在 Python 环境中运行：

```python
import secrets
print('JWT_SECRET=' + secrets.token_urlsafe(32))
```

或者：
```python
import secrets
print('JWT_SECRET=' + secrets.token_hex(32))
```

#### 方法三：使用命令行工具（推荐）

**macOS/Linux:**
```bash
openssl rand -hex 32
```

**Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

或者使用在线工具（不推荐用于生产环境）：
- 访问 https://randomkeygen.com/ 生成随机密钥

#### 生成后的使用

生成后会得到一个类似这样的字符串：
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

将这个字符串复制到你的 `.env` 文件中：
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**安全提示：**
- JWT_SECRET 应该是一个足够长的随机字符串（建议至少 32 个字符）
- 不要使用简单的字符串（如 "secret"、"123456" 等）
- 生产环境和开发环境应该使用不同的 JWT_SECRET
- 不要将 JWT_SECRET 提交到代码仓库

## 测试步骤

### 1. 前端测试

1. 启动前端开发服务器：`npm run serve`
2. 打开登录页面
3. 点击"微信登录"按钮
4. 应该跳转到微信授权页面或显示二维码

### 2. 后端测试

1. 确保后端服务已启动
2. 测试获取AppID接口：

```bash
curl -X GET "https://api.kidstory.cc/pb/auth/wechat/appid"
```

预期响应：
```json
{
  "code": 1000,
  "desc": "success",
  "appid": "wx1234567890"
}
```

3. 测试授权接口（会302重定向）：

```bash
curl -I "https://api.kidstory.cc/pb/auth/wechat/authorize?redirect_uri=https://your-domain.com/wechat/callback&state=test123"
```

预期响应：302重定向到微信授权页面

4. 测试回调接口：

```bash
curl -X POST https://api.kidstory.cc/pb/auth/wechat/callback \
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

### 2.1. "Scope 参数错误或没有 Scope 权限"

**原因：** 微信开放平台应用配置问题

**可能的原因：**
1. **应用类型错误**：使用的 AppID 不是"网站应用"类型
   - 检查：登录微信开放平台，查看应用类型
   - 解决：必须使用"网站应用"类型的 AppID，不能使用移动应用、小程序等其他类型
2. **未申请微信登录功能**：应用没有申请或审核通过"微信登录"功能
   - 检查：在微信开放平台的应用详情页面，查看"功能信息"中是否有"微信登录"
   - 解决：申请"微信登录"功能并等待审核通过
3. **应用状态异常**：应用可能被暂停或审核未通过
   - 检查：查看应用状态是否为"已审核通过"
   - 解决：确保应用状态正常

**解决步骤：**
1. 登录 [微信开放平台](https://open.weixin.qq.com/)
2. 进入"管理中心" -> "网站应用"
3. 检查应用类型是否为"网站应用"
4. 检查"功能信息"中是否包含"微信登录"且状态为"已审核通过"
5. 如果未申请，点击"申请"按钮申请微信登录功能
6. 等待审核通过后重新测试

**注意事项：**
- 网站应用必须使用 `scope=snsapi_login`（代码中已正确使用）
- 移动应用使用不同的 scope（如 `snsapi_userinfo`），不能混用
- 确保 AppID 和 AppSecret 来自同一个"网站应用"

### 3. 前端无法获取授权URL（404错误）

**原因：** 后端接口路径不正确或接口未正确实现

**解决方案：**
- 检查后端接口路径是否正确：
  - 方式1：`GET /pb/auth/wechat/authorize`（服务端重定向方式）
  - 方式2：`GET /pb/auth/wechat/appid`（返回AppID）
- 检查后端环境变量是否正确配置（WECHAT_APPID 和 WECHAT_SECRET）
- 查看后端日志获取详细错误信息
- 确保后端接口路径与前端调用路径一致（注意路径前缀 `/pb/auth/wechat/`）

### 4. 后端接口返回错误

**原因：** 后端配置或代码问题

**解决方案：**
- 检查后端环境变量是否正确配置
- 检查 AppID 和 AppSecret 是否正确
- 检查 JWT_SECRET 是否已生成并配置
- 查看后端日志获取详细错误信息
- 参考后端实现文档检查实现

### 5. JWT_SECRET 从哪里获取？

**答案：** JWT_SECRET **不是从任何地方获取的**，需要你自己生成。

**常见误解：**
- ❌ 不是从微信开放平台获取
- ❌ 不是从某个配置文件读取
- ❌ 不是固定的值

**正确做法：**
- ✅ 使用上面"生成 JWT 密钥"部分的方法生成
- ✅ 生成后保存到 `.env` 文件中
- ✅ 确保生产环境和开发环境使用不同的密钥

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

