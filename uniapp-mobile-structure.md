# KidStory Mobile (Uni-app) 前端结构与接口文档

> 本文档基于现有 Web 项目 `/Users/program/illustration`（Vue 3 + Element Plus）梳理，聚焦手机端"阅读 + AI 创作 + 个人中心"三大场景，剔除与插画编辑器（Editor / EditorPro / LayoutEditor）相关的复杂创作内容。
>
> 技术栈：**Uni-app (Vue 3 setup) + Pinia + uni-ui + uView-plus（可选）+ axios**。后端沿用现有 `https://api.kidstory.cc/` 接口，无需改造。

---

## 一、项目范围

| 模块 | 对应 Web 页面 | 是否纳入 |
|---|---|---|
| AI 插画（文生图 + 保存到我的） | `AIpicture.vue` | ✅ |
| AI 绘本（文生图组图） | `AIBooks.vue` | ✅ |
| 绘本广场 / 绘本详情 / 搜索 | `OriginalBooks.vue` / `OriginalBookdetails.vue` / `SearchBooks.vue` | ✅ |
| 我的主页（我的插画 / 我的绘本 / 我的角色 / 我的收藏 / 我的关注） | `MyHomePage.vue` | ✅ |
| 我的插画详情 / 我的绘本详情 / 收藏绘本详情 | `MyIllusDetails.vue` / `MyBookDetails.vue` / `MyCoBookDetails.vue` | ✅ |
| 作者主页 | `UserG.vue` | ✅ |
| 个人资料 | `UserProfile.vue` | ✅ |
| 登录 / 注册 / 找回密码 / 微信登录 | `LoginRegister.vue` / `ForgotPassword.vue` / `WeChatCallback.vue` | ✅ |
| 会员充值 | `MemberRecharge.vue` / `MemberRechargeSuccess.vue` | ✅ |
| 插画上传（手机相册选图）| `UploadIllustration.vue` | ✅（简化版） |
| 心情日记 | `MoodDiary.vue` | ✅（附赠彩蛋） |
| 迷宫 | `Maze.vue` | ⚠️ 可选 |
| 绘本编辑器 / 插画编辑器 / 布局编辑器 | `Editorpro.vue` / `CreateLayoutIllustration.vue` … | ❌ 不进手机 |
| 新年主题页 / 连接页 / 工具页 | `NewYear*` / `Connection` / `UtilityTools` | ❌ 不进手机 |

---

## 二、技术架构

### 2.1 依赖清单

```json
{
  "dependencies": {
    "@dcloudio/uni-app": "^3.0.0",
    "@dcloudio/uni-h5": "^3.0.0",
    "@dcloudio/uni-mp-weixin": "^3.0.0",
    "@dcloudio/uni-ui": "^1.5.0",
    "pinia": "^2.1.0",
    "vue": "^3.4.0",
    "vue-i18n": "^9.9.0",
    "axios": "^1.6.0",
    "uview-plus": "^3.3.0"
  }
}
```

### 2.2 目录结构

```
src/
├── pages/                    # 所有页面（pages.json 注册）
│   ├── tabbar/               # 底部 Tab 页
│   │   ├── books/books.vue         # 绘本广场
│   │   ├── ai/ai.vue               # AI 创作入口
│   │   └── mine/mine.vue           # 我的主页
│   ├── book/
│   │   ├── detail.vue              # 绘本阅读
│   │   └── search.vue              # 绘本搜索
│   ├── illustration/
│   │   └── detail.vue              # 插画详情
│   ├── ai/
│   │   ├── picture.vue             # AI 生成插画
│   │   └── book.vue                # AI 生成绘本
│   ├── user/
│   │   ├── profile.vue             # 我的资料
│   │   ├── author.vue              # 他人作者主页
│   │   ├── collection.vue          # 我收藏的绘本
│   │   ├── my-book-detail.vue      # 我的绘本详情
│   │   └── my-illus-detail.vue     # 我的插画详情
│   ├── auth/
│   │   ├── login.vue
│   │   ├── register.vue
│   │   ├── forgot-password.vue
│   │   └── wechat-callback.vue
│   ├── member/
│   │   ├── recharge.vue
│   │   └── recharge-success.vue
│   └── upload/
│       └── illustration.vue        # 上传插画（从相册）
├── components/
│   ├── BookCard.vue
│   ├── IllustrationTile.vue
│   ├── AuthorAvatar.vue
│   ├── HeartButton.vue
│   ├── LoadMore.vue
│   └── EmptyState.vue
├── api/                      # 接口层（axios 封装）
│   ├── request.js            # axios 实例 + 拦截器
│   ├── auth.js
│   ├── book.js
│   ├── illustration.js
│   ├── user.js
│   ├── ai.js
│   └── member.js
├── store/                    # Pinia
│   ├── user.js
│   └── app.js
├── utils/
│   ├── image.js              # OSS 缩略图拼接
│   ├── oss.js                # 阿里云 OSS 直传
│   └── token.js
├── locale/
│   ├── zh.js
│   └── en.js
├── static/                   # 静态资源
└── App.vue
```

### 2.3 pages.json（关键配置）

```json
{
  "pages": [
    { "path": "pages/tabbar/books/books", "style": { "navigationBarTitleText": "绘本" } },
    { "path": "pages/tabbar/ai/ai", "style": { "navigationBarTitleText": "AI 创作" } },
    { "path": "pages/tabbar/mine/mine", "style": { "navigationBarTitleText": "我的" } },
    { "path": "pages/book/detail", "style": { "navigationBarTitleText": "绘本详情" } },
    { "path": "pages/book/search", "style": { "navigationBarTitleText": "搜索" } },
    { "path": "pages/ai/picture", "style": { "navigationBarTitleText": "AI 插画" } },
    { "path": "pages/ai/book", "style": { "navigationBarTitleText": "AI 绘本" } },
    { "path": "pages/user/profile", "style": { "navigationBarTitleText": "个人资料" } },
    { "path": "pages/user/author", "style": { "navigationBarTitleText": "作者主页" } },
    { "path": "pages/user/collection", "style": { "navigationBarTitleText": "我的收藏" } },
    { "path": "pages/user/my-book-detail", "style": { "navigationBarTitleText": "我的绘本" } },
    { "path": "pages/user/my-illus-detail", "style": { "navigationBarTitleText": "我的插画" } },
    { "path": "pages/illustration/detail", "style": { "navigationBarTitleText": "插画详情" } },
    { "path": "pages/auth/login", "style": { "navigationBarTitleText": "登录" } },
    { "path": "pages/auth/register", "style": { "navigationBarTitleText": "注册" } },
    { "path": "pages/auth/forgot-password", "style": { "navigationBarTitleText": "找回密码" } },
    { "path": "pages/auth/wechat-callback", "style": { "navigationBarTitleText": "微信登录" } },
    { "path": "pages/member/recharge", "style": { "navigationBarTitleText": "会员充值" } },
    { "path": "pages/member/recharge-success", "style": { "navigationBarTitleText": "支付成功" } },
    { "path": "pages/upload/illustration", "style": { "navigationBarTitleText": "上传插画" } }
  ],
  "tabBar": {
    "color": "#909399",
    "selectedColor": "#8167A9",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/tabbar/books/books", "iconPath": "static/tab/book.png", "selectedIconPath": "static/tab/book-active.png", "text": "绘本" },
      { "pagePath": "pages/tabbar/ai/ai", "iconPath": "static/tab/ai.png", "selectedIconPath": "static/tab/ai-active.png", "text": "AI 创作" },
      { "pagePath": "pages/tabbar/mine/mine", "iconPath": "static/tab/mine.png", "selectedIconPath": "static/tab/mine-active.png", "text": "我的" }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "KidStory",
    "navigationBarBackgroundColor": "#FFFFFF",
    "backgroundColor": "#F6F4FB"
  }
}
```

---

## 三、全局规范

### 3.1 接口基础配置（`src/api/request.js`）

```js
import axios from 'axios'

const BASE_URL = 'https://api.kidstory.cc/'
const STATIC_URL = 'https://static.kidstory.cc/'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 30000
})

// 请求拦截：自动带 token
request.interceptors.request.use((config) => {
  const token = uni.getStorageSync('token')
  if (token && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一判断 code === 0 / desc === 'success'
request.interceptors.response.use(
  (res) => {
    const d = res.data || {}
    const ok = d.code === 0 || d.code === '0' || d.desc === 'success' || d.statuscode === 'success'
    return { ok, data: d.message ?? d.data ?? null, raw: d }
  },
  (err) => {
    if (err.response?.status === 401) {
      uni.removeStorageSync('token')
      uni.redirectTo({ url: '/pages/auth/login' })
    }
    return Promise.reject(err)
  }
)

export { request, BASE_URL, STATIC_URL }
```

### 3.2 图片 URL 处理（`src/utils/image.js`）

后端返回的 `content` 字段可能是：
- 完整 URL `https://xxx`
- 相对路径 `upload/xxx.jpeg`
- Base64 字符串 `data:image/...`

统一处理：

```js
import { STATIC_URL } from '@/api/request'

export function resolveImageUrl(src) {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('data:')) return src
  return `${STATIC_URL}${src}`
}

// 缩略图（阿里云 OSS）
export function thumb(src, width = 280) {
  const url = resolveImageUrl(src)
  if (!url.includes('static.kidstory.cc')) return url
  return `${url}?x-oss-process=image/resize,w_${width},m_lfit/quality,q_80`
}
```

### 3.3 登录状态（`src/store/user.js`）

```js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    userId: uni.getStorageSync('id') || '',
    info: null
  }),
  getters: {
    isLogin: (s) => !!s.token
  },
  actions: {
    setAuth(token, userId) {
      this.token = token
      this.userId = userId
      uni.setStorageSync('token', token)
      uni.setStorageSync('id', userId)
    },
    async loadInfo() {
      if (!this.userId) return
      const { ok, data } = await request.get(`/user/${this.userId}`)
      if (ok) this.info = data
    },
    logout() {
      this.token = ''
      this.userId = ''
      this.info = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('id')
    }
  }
})
```

---

## 四、TabBar 页面

### 4.1 绘本广场 `pages/tabbar/books/books.vue`

#### 布局

```
┌─────────────────────────────┐
│ 🔍 搜索栏（点击跳 search）   │
├─────────────────────────────┤
│ [最新] [最热]  [全部/经典/..] │  ← 排序 + 分类 chips
├─────────────────────────────┤
│  ┌───────┐  ┌───────┐       │
│  │ 封面  │  │ 封面  │       │
│  │ 书名  │  │ 书名  │       │  ← 2 列网格
│  │ 作者  │  │ 作者  │       │
│  └───────┘  └───────┘       │
│         ...                  │
│       [加载更多]             │
└─────────────────────────────┘
```

#### 状态

```js
const books = ref([])
const page = ref(1)
const sortType = ref('heat')          // heat | createdAt
const category = ref('')              // '' | 'classic' | 'picture' | ...
const hasMore = ref(true)
const loading = ref(false)
```

#### 交互

- 下拉刷新 → 重置 page=1 + 重新拉取。
- 触底加载 → page++ 继续拉。
- 点击卡片 → `navigateTo('/pages/book/detail?id=xxx')`。
- 点击作者头像 → `navigateTo('/pages/user/author?id=xxx')`。

#### 接口

| 接口 | 说明 |
|---|---|
| `GET /book/?sort_param={sort_param}&sort_num=desc&page=1&type=` | 绘本列表 |
| `GET /ill/{firstIllId}` | 取首张插画作为封面（部分绘本） |
| `GET /user/list/collect?id={userId}&category=book` | 登录后标记已收藏状态 |

---

### 4.2 AI 创作入口 `pages/tabbar/ai/ai.vue`

#### 布局

```
┌─────────────────────────────┐
│   👋 你想创作什么？          │
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ 🎨 AI 插画             │   │  ← 卡片入口
│ │ 输入文字，生成单幅画面 │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 📖 AI 绘本             │   │
│ │ 输入故事，生成多页绘本 │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ ❤️ 心情日记           │   │  ← 可选
│ │ 记录心情生成插画       │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

#### 子页面导航

- AI 插画 → `/pages/ai/picture`
- AI 绘本 → `/pages/ai/book`
- 心情日记 → `/pages/ai/mood`（可选）

---

### 4.3 我的 `pages/tabbar/mine/mine.vue`

#### 布局（未登录）

```
┌─────────────────────────────┐
│    [默认头像]                │
│    点击登录                  │
│                              │
│  · 我的插画 →                │
│  · 我的绘本 →                │
│  · 我的收藏 →                │
│  · 我的角色 →                │
│  · 会员中心 →                │
│  · 语言切换 →                │
└─────────────────────────────┘
```

#### 布局（已登录）

```
┌─────────────────────────────┐
│  [头像]  昵称                │
│  💎 99 积分 · 💎 会员到期 1月 │
│  [编辑资料] [充值]           │
├─────────────────────────────┤
│  统计  6 绘本 · 12 插画 · 5 收藏 │
├─────────────────────────────┤
│ [插画] [绘本] [收藏] [角色]   │  ← Tab 切换
│                              │
│  ┌────┬────┬────┐           │
│  │缩图│缩图│缩图│           │  ← 3 列瀑布流
│  └────┴────┴────┘           │
│     ...                      │
│     [加载更多]               │
└─────────────────────────────┘
```

#### 状态

```js
const activeTab = ref('illus')   // illus | books | collect | character
const illList = ref([])
const bookList = ref([])
const collectList = ref([])
const charList = ref([])
const illPage = ref(1)
const bookPage = ref(1)
```

#### 接口

| Tab | 接口 |
|---|---|
| 用户信息 | `GET /user/{id}` |
| 我的插画 | `GET /ill/?page=1&sort_param=createdAt&sort_num=desc` (带 Authorization) |
| 我的绘本 | `GET /book/?page=1&sort_param=createdAt&sort_num=desc&ownerid={id}` |
| 我收藏的绘本 | `GET /user/list/collect?id={id}&category=book` → 每条再查 `GET /book/{bookId}` + `GET /ill/{firstIllId}` |
| 我的角色 | `GET /character?ownerid={id}` |
| 我的关注 / 粉丝 | `GET /user/number/fllow?id={id}&sign=item` / `GET /user/number/fllow?id={id}` |

---

## 五、内容详情页

### 5.1 绘本详情 `pages/book/detail.vue`（核心阅读体验）

#### 布局

```
┌─────────────────────────────┐
│ [< 返回]  标题    [❤ 收藏]   │
├─────────────────────────────┤
│                              │
│     ┌─────────────┐          │
│     │  当前页     │          │
│     │  插画       │  ← 滑动 / 点击翻页
│     │             │          │  双击放大 / 捏合缩放
│     └─────────────┘          │
│                              │
├─────────────────────────────┤
│      · · · ● · · ·           │  ← 进度指示
│      第 4 / 10 页            │
├─────────────────────────────┤
│  [作者头像] 昵称  [关注]      │
└─────────────────────────────┘
```

#### 关键交互

- **左右滑动翻页**：`swiper` 组件 + `:autoplay="false"`。
- **双击放大**：`uni-image` 外层 `scroll-view`，监听 `@dblclick` 切换 `scale(1)` / `scale(2.5)`。
- **捏合缩放**（App 端）：用 `movable-view` + `scale="true"`。
- **图片预加载**：当前页前后 ±2 页预加载。
- **收藏**：调用 `/user/collect/{id}` (POST) / `/user/list/collect?id=xxx` (DELETE)。

#### 接口

```
GET  /book/{bookId}                      # 绘本详情，返回 content[] = 插画 ID 列表
GET  /ill/{illId}                        # 每个 illId 查对应图片（并发）
GET  /user/{authorId}                    # 作者信息
POST /user/collect/{bookId}              # body: { ownerid, type:'book', collectid:bookId }
DELETE /user/list/collect?id={recordId}  # 取消收藏
GET  /user/list/collect?id={userId}&category=book  # 判断当前是否已收藏
```

#### 数据模型

```ts
interface Book {
  _id: string
  title: string
  description: string
  content: string[]       // 插画 ID 列表
  cover?: string          // 封面图片 URL（部分接口返回）
  ownerid: string
  type: string
  is_public: 0 | 1
  collection_num: number
  like_num: number
  createdAt: string
  updatedAt: string
}

interface Illustration {
  _id: string
  title: string
  description: string
  content: string          // 图片 URL 或 upload/ 路径
  type: string
  tags: string[]
  character_id?: string
  ownerid: string
  createdAt: string
}
```

---

### 5.2 绘本搜索 `pages/book/search.vue`

#### 布局

```
┌─────────────────────────────┐
│ [< ]  🔍 搜索绘本        [取消] │
├─────────────────────────────┤
│  热门：[小红帽] [三只小猪]...│  ← 空状态推荐
│                              │
│  搜索结果（2 列网格）         │
│  ┌───┐ ┌───┐                │
│  │书 │ │书 │                │
│  └───┘ └───┘                │
└─────────────────────────────┘
```

#### 接口

```
GET /book/?sort_param=heat&sort_num=desc&keyword={kw}&page={n}
GET /ill/{illId}  # 补齐封面
```

---

### 5.3 插画详情 `pages/illustration/detail.vue`

#### 布局

```
┌─────────────────────────────┐
│ [<] 插画详情      [分享] [❤] │
├─────────────────────────────┤
│      [大图]                  │
│  （双击放大/保存到相册）      │
├─────────────────────────────┤
│  标题                        │
│  描述文案...                  │
│  标签: #奇幻 #童话            │
├─────────────────────────────┤
│  [作者头像] 昵称  [关注]      │
└─────────────────────────────┘
```

#### 接口

```
GET  /ill/{illId}
GET  /user/{authorId}
POST /user/like/{illId}   body: { ownerid, type:'illustration', likeid:illId }
```

---

### 5.4 我的绘本详情 `pages/user/my-book-detail.vue`

与 `5.1 绘本详情` 一致，额外功能：
- 右上角菜单：**编辑 / 删除 / 切换公开私密**（App 端用 `uni.showActionSheet`）。

#### 接口（额外）

```
DELETE /book/{bookId}
PUT    /book/{bookId}        body: { title, description, is_public }
```

---

### 5.5 收藏绘本详情 `pages/user/my-book-detail.vue`（复用）

只有**取消收藏**按钮，无编辑权限。

---

## 六、AI 创作页面

### 6.1 AI 插画 `pages/ai/picture.vue`

#### 布局

```
┌─────────────────────────────┐
│ [<] AI 插画                  │
├─────────────────────────────┤
│  ✍ 描述你想要的画面：        │
│  ┌─────────────────────┐     │
│  │ textarea 4 行       │     │
│  └─────────────────────┘     │
│                              │
│  🎨 画风：                   │
│  [img][img][img][img][img]   │  ← 横向滑动，6 种风格
│                              │
│  [  生成插画  ]              │  ← 大按钮
├─────────────────────────────┤
│  生成中... (转圈)             │
│     或                       │
│  ┌─────────────┐             │
│  │  生成图片   │             │  ← 预览区
│  └─────────────┘             │
│  [保存到我的] [下载到本地]    │
└─────────────────────────────┘
```

#### 状态

```js
const prompt = ref('')
const artStyle = ref('watercolor')   // 6 种风格 key
const generating = ref(false)
const resultUrl = ref('')
```

#### 接口

| 用途 | 接口 | Payload |
|---|---|---|
| 文生图 | `POST /create-character` | `{ prompt, size:'1280x960', response_format:'b64_json', watermark:false }`（3 分钟超时） |
| 保存到我的 | `POST /ill/` | `{ picture, title, description, type:'others' }` |

**响应处理规则**（兼容多种格式）：

```js
const result = response.data.message
// 优先级：image_url > character_image_url > image_base64 > full_response.data[0].b64_json
let imageUrl = result.image_url 
  || result.character_image_url
  || (result.image_base64 && `data:image/jpeg;base64,${result.image_base64}`)
  || (result.full_response?.data?.[0]?.b64_json && `data:image/jpeg;base64,${result.full_response.data[0].b64_json}`)
```

**保存时注意**：base64 要先压缩到 **1 MB 以内**避免 `request entity too large`。Uni-app 中用 `uni.compressImage` 或 canvas 重绘。

**下载到相册**（App / 小程序）：

```js
uni.getImageInfo({
  src: resultUrl.value,
  success: (info) => {
    uni.saveImageToPhotosAlbum({
      filePath: info.path,
      success: () => uni.showToast({ title: '已保存到相册' })
    })
  }
})
```

---

### 6.2 AI 绘本 `pages/ai/book.vue`

#### 布局

```
┌─────────────────────────────┐
│ [<] AI 绘本                  │
├─────────────────────────────┤
│  ✍ 你的故事灵感：             │
│  ┌─────────────────────┐     │
│  │ textarea 6 行       │     │
│  └─────────────────────┘     │
│                              │
│  🎨 画风: [风格卡片横滑]     │
│  📄 页数: [4] [6] [8]        │
│                              │
│  [ 生成故事 ] [ 生成插画 ]    │
├─────────────────────────────┤
│  生成进度：                  │
│  第 2/6 张，xxx              │
│                              │
│  ┌───┬───┬───┐              │
│  │img│img│img│              │  ← 页预览（可点放大）
│  └───┴───┴───┘              │
│  [一键保存绘本到我的]         │
└─────────────────────────────┘
```

#### 状态

```js
const prompt = ref('')
const artStyle = ref('watercolor')
const pageCount = ref(6)
const storyJson = ref(null)          // { title, summary, scenes[], scenes_detail[] }
const images = ref([])               // 每页图片 URL
const step = ref('idle')             // idle | generating-story | generating-images | done
```

#### 接口

```
POST /generate-story         # 生成故事文案（JSON，含 scenes[]）
   body: { prompt, model:'doubao-seed-...', maxCompletionTokens:65535, reasoningEffort:'medium', stylePrompt? }
   timeout: 120s

POST /create-character       # 按 scenes_detail 逐条生成插画（循环 N 次）
   body: { prompt, size:'1280x960', response_format:'b64_json', watermark:false }
   timeout: 180s

POST /ill/                   # 每张保存为插画
   body: { picture, title, description, type:'others' }

POST /book/                  # 创建绘本，content 为插画 ID 数组
   body: { title, description, content:[illId1, illId2, ...], is_public:1 }
```

---

## 七、用户中心 + 登录

### 7.1 登录 `pages/auth/login.vue`

```
┌─────────────────────────────┐
│   [Logo KidStory]            │
│                              │
│  ┌──────────────────┐        │
│  │ 📧 邮箱           │        │
│  └──────────────────┘        │
│  ┌──────────────────┐        │
│  │ 🔒 密码      👁   │        │
│  └──────────────────┘        │
│                              │
│  [     登录     ]             │
│                              │
│  忘记密码?       没账号 注册  │
├─────────────────────────────┤
│      -------- 或 --------    │
│      [  微信登录  ]          │
└─────────────────────────────┘
```

#### 接口

```
POST /pb/login              body: { email, password } → { desc, message:token, user_id }
POST /pb/regist/            body: { email, password } → { desc }
POST /pb/auth/email/send-code   body: { email }
POST /pb/auth/password/verify-code  body: { email, code }
POST /pb/auth/password/reset body: { email, code, newPassword }
GET  /pb/auth/wechat/appid
POST /pb/auth/wechat/callback body: { code, state }
POST /user/iflogin              # 校验 token 是否有效
GET  /user/{userId}             # 登录后拉用户信息
```

#### 存储

```js
uni.setStorageSync('token', response.data.message)
uni.setStorageSync('id', response.data.user_id)
```

### 7.2 微信登录

Uni-app 小程序：

```js
uni.login({
  provider: 'weixin',
  success: (res) => {
    // 把 code 发给后端换 token
    request.post('/pb/auth/wechat/callback', { code: res.code })
  }
})
```

Uni-app App：同上，走原生微信 SDK。

---

### 7.3 个人资料 `pages/user/profile.vue`

#### 字段

- 头像（`uni.chooseImage` + 上传）
- 昵称
- 个性签名
- 生日
- 性别

#### 接口

```
GET /user/{userId}
PUT /user/{userId}   body: { nickname, avatar, signature, birthday, gender }
```

---

### 7.4 作者主页 `pages/user/author.vue`

```
┌─────────────────────────────┐
│   [头像] 昵称                │
│   签名                       │
│   关注 12 · 粉丝 34          │
│   [关注 / 已关注]             │
├─────────────────────────────┤
│ [作品] [绘本]                │
│   瀑布流 2 列                │
└─────────────────────────────┘
```

#### 接口

```
GET  /user/{authorId}
GET  /user/number/fllow?id={authorId}          # 粉丝数
GET  /user/number/fllow?id={authorId}&sign=item # 关注数
GET  /ill/?ownerid={authorId}&sort_param=createdAt&sort_num=desc&page=1
GET  /book/?ownerid={authorId}&sort_param=createdAt&sort_num=desc&page=1
POST /user/fllow/{authorId}                    # 关注
DELETE /user/list/fllow?id={authorId}          # 取消关注
```

---

## 八、会员 & 上传

### 8.1 会员充值 `pages/member/recharge.vue`

#### 布局

```
┌─────────────────────────────┐
│  当前：9 积分 · 普通会员      │
├─────────────────────────────┤
│  [月卡 ¥9]  [季卡 ¥25]       │  ← 套餐卡
│  [年卡 ¥88] [终身 ¥299]      │
├─────────────────────────────┤
│  支付方式:                   │
│  ⦿ 微信支付                  │
│  ○ 支付宝                    │
│  [   立即支付   ]            │
└─────────────────────────────┘
```

#### 接口

```
GET  /user/{userId}                 # 查当前余额/会员
POST /order/create                  # 创建订单
GET  /order/status?id={orderId}     # 查订单状态
POST /pay/wechat                    # 发起微信支付（uni.requestPayment）
```

---

### 8.2 上传插画 `pages/upload/illustration.vue`

#### 布局

```
┌─────────────────────────────┐
│  [+ 从相册选择]               │  ← uni.chooseImage
│  [预览图]                     │
│  标题: ______________         │
│  描述: ______________         │
│  类别: [下拉选择]             │
│  [  上传  ]                   │
└─────────────────────────────┘
```

#### 接口

```
POST /ill/    multipart/form-data
  fields: picture (File) | title | description | type
```

**Uni-app 上传写法**：

```js
uni.uploadFile({
  url: `${BASE_URL}ill/`,
  filePath: tempFilePath,
  name: 'picture',
  formData: { title, description, type },
  header: { Authorization: `Bearer ${token}` },
  success: (res) => { /* ... */ }
})
```

---

## 九、接口汇总表

### 9.1 认证 `/pb/*`

| Method | Path | Body / Query | 说明 |
|---|---|---|---|
| POST | `/pb/login` | `{ email, password }` | 登录 |
| POST | `/pb/regist/` | `{ email, password }` | 注册 |
| POST | `/pb/auth/email/send-code` | `{ email }` | 发送验证码 |
| POST | `/pb/auth/password/verify-code` | `{ email, code }` | 验证码校验 |
| POST | `/pb/auth/password/reset` | `{ email, code, newPassword }` | 重置密码 |
| GET | `/pb/auth/wechat/appid` | — | 获取微信 appid |
| POST | `/pb/auth/wechat/callback` | `{ code, state }` | 微信回调 |

### 9.2 用户 `/user/*`

| Method | Path | 说明 |
|---|---|---|
| POST | `/user/iflogin` | Token 有效性检查 |
| GET | `/user/{userId}` | 用户详情（含积分 / 会员） |
| PUT | `/user/{userId}` | 更新资料 |
| GET | `/user/number/fllow?id=&sign=item` | 关注数 / 粉丝数 |
| POST | `/user/fllow/{userId}` | 关注作者 |
| DELETE | `/user/list/fllow?id={userId}` | 取消关注 |
| POST | `/user/collect/{bookId}` | 收藏绘本 |
| DELETE | `/user/list/collect?id={recordId}` | 取消收藏 |
| GET | `/user/list/collect?id={userId}&category=book` | 我的收藏列表 |
| POST | `/user/like/{illId}` | 喜欢插画 |
| GET | `/user/list/like?id=&category=` | 我的喜欢 |

### 9.3 绘本 `/book/*`

| Method | Path | Query / Body | 说明 |
|---|---|---|---|
| GET | `/book/` | `sort_param, sort_num, page, type, keyword, ownerid` | 列表 |
| GET | `/book/{bookId}` | — | 详情 |
| POST | `/book/` | `{ title, description, content[], is_public, type }` | 创建 |
| PUT | `/book/{bookId}` | 同上 | 更新 |
| DELETE | `/book/{bookId}` | — | 删除 |

### 9.4 插画 `/ill/*`

| Method | Path | Query / Body | 说明 |
|---|---|---|---|
| GET | `/ill/` | `sort_param, sort_num, page, type, keyword, ownerid, character_id` | 列表 |
| GET | `/ill/{illId}` | — | 详情 |
| POST | `/ill/` | `{ picture, title, description, type }` 或 FormData | 新建 |
| PUT | `/ill/{illId}` | 同上 | 更新 |
| DELETE | `/ill/{illId}` | — | 删除 |
| POST | `/ill/draft/list` | — | 草稿列表 |

### 9.5 AI 生成

| Method | Path | Body | 超时 | 说明 |
|---|---|---|---|---|
| POST | `/create-character` | `{ prompt, size, response_format, watermark }` | 180s | 文生图 / 图生图 |
| POST | `/generate-story` | `{ prompt, model, maxCompletionTokens, reasoningEffort, stylePrompt? }` | 120s | 故事文案生成 |
| POST | `/image-segmentation/general` | `{ imageUrl }` | 60s | 图像分割（上传扩展） |

### 9.6 角色（可选）

| Method | Path | 说明 |
|---|---|---|
| GET | `/character?ownerid={id}` | 我的角色列表 |
| POST | `/character` | 创建角色 |
| DELETE | `/character/{id}` | 删除 |

---

## 十、通用响应格式

### 10.1 成功

```json
{
  "code": 0,
  "desc": "success",
  "message": { /* 真实数据 */ }
}
```

也可能是：

```json
{
  "statuscode": "success",
  "data": { ... }
}
```

### 10.2 失败

```json
{
  "code": -1,
  "desc": "fail",
  "message": "错误信息"
}
```

### 10.3 全局判断

```js
const isSuccess = (r) => 
  r?.code === 0 || r?.code === '0' 
  || r?.desc === 'success' 
  || r?.statuscode === 'success'
```

---

## 十一、关键数据模型

```ts
interface User {
  _id: string
  email: string
  nickname: string
  avatar: string
  signature: string
  points: number          // 积分
  vip_level: number       // 会员等级 0/1/2
  vip_expire: string      // 会员到期
  createdAt: string
}

interface Book {
  _id: string
  title: string
  description: string
  content: string[]       // illustration IDs
  ownerid: string
  type: 'classic' | 'picture' | 'AI' | 'mood' | 'maze' | 'others'
  is_public: 0 | 1
  is_draft: 0 | 1
  collection_num: number
  like_num: number
  createdAt: string
}

interface Illustration {
  _id: string
  title: string
  description: string
  content: string        // URL or upload/xxx.jpg
  type: string
  tags: string[]
  character_id?: string
  ownerid: string
  createdAt: string
}

interface Character {
  _id: string
  character_name: string
  character_image_url: string
  description: string
  ownerid: string
  createdAt: string
}

interface CollectRecord {
  _id: string
  ownerid: string
  collectid: string
  category: 'book' | 'illustration'
  createdAt: string
}
```

---

## 十二、Uni-app 端关键适配要点

### 12.1 Web `<img>` → Uni `<image>`

```html
<!-- Web -->
<img :src="url" loading="lazy" />

<!-- Uni -->
<image :src="url" mode="aspectFill" lazy-load />
```

### 12.2 `router.push` → `uni.navigateTo`

```js
uni.navigateTo({ url: `/pages/book/detail?id=${id}` })

// 接收参数
onLoad(options) { this.id = options.id }
```

### 12.3 `axios` 在小程序端

小程序不支持 `axios` 的 `adapter`，需要改写为 `uni.request` 封装：

```js
// src/api/request.js（小程序兼容版）
export function http(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
        ...options.header
      },
      timeout: options.timeout || 30000,
      success: (res) => resolve({ ok: isSuccess(res.data), data: res.data.message, raw: res.data }),
      fail: reject
    })
  })
}
```

或者用 `@escook/request-miniprogram` / `luch-request` 等适配器。

### 12.4 手势

- **绘本翻页**：用 `<swiper>` 组件，`:duration="300"` + `:circular="false"`。
- **双击放大**：App 用 `movable-view scale`；H5 用 `useTouchZoom` 自定义 hook。

### 12.5 国际化

沿用 Web 项目 `src/i18n/locales/zh.json` `en.json`，拷贝到 `src/locale/` 下即可，Uni-app 已内置 `vue-i18n`。

### 12.6 缓存与预加载

| 目标 | 方案 |
|---|---|
| 绘本列表缓存 | Pinia + `uni.setStorageSync` 保留最后一次数据，进入时即显示 |
| 封面缩略图 | `?x-oss-process=image/resize,w_280,m_lfit` |
| 原图延迟加载 | `<image lazy-load>` + IntersectionObserver |
| 阅读预加载 | 进入详情后，当前页前后 ±2 页图片提前 `uni.getImageInfo` 到本地 |

---

## 十三、开发里程碑建议

| 周 | 内容 |
|---|---|
| W1 | 搭 Uni-app 工程 + pages.json + TabBar + 登录/注册/微信登录 |
| W2 | 绘本广场 + 搜索 + 绘本详情（翻页 + 收藏） |
| W3 | 我的主页 4 个 Tab（插画 / 绘本 / 收藏 / 角色）+ 作者主页 |
| W4 | AI 插画 + AI 绘本（关键接口对接 + 生成状态） |
| W5 | 插画上传 + 个人资料 + 会员充值 |
| W6 | 下拉刷新 + 触底加载 + 缩略图 + 图片手势优化 |
| W7 | 适配 H5 / iOS / Android / 微信小程序四端 + 联调 |
| W8 | 压力测试 + 上架准备 |

---

## 十四、环境变量

`src/env.js`：

```js
export const ENV = {
  API_BASE_URL: 'https://api.kidstory.cc/',
  STATIC_URL: 'https://static.kidstory.cc/',
  WECHAT_REDIRECT: 'https://www.kidstory.cc/wechat/callback'
}
```

生产 / 测试可以用 `process.env.UNI_BUILD_MODE` 区分。

---

## 十五、风险点提醒

| 风险 | 解决 |
|---|---|
| AI 接口耗时 2-3 分钟，手机端容易超时/中断 | 加**心跳检测 + 断点续查**；上传 base64 要压缩到 1MB |
| 大量图片并发请求（绘本 10 页 × 每张 1MB） | 串行 / 分批 + OSS 缩略图 + 预加载 |
| 小程序 2MB 大小限制 | 分包加载 AI 创作模块为"分包" |
| 小程序域名白名单 | `api.kidstory.cc` / `static.kidstory.cc` 要在小程序后台配置 request 合法域名 |
| iOS 微信登录 | 需要在 HBuilderX 配置微信 SDK + 跳转 URL Scheme |
| Token 过期 401 | 拦截器统一重定向到登录页 |
| 图片 CORS（H5 下载） | 用后端代理 or OSS 配置 Access-Control-Allow-Origin |

---

这份文档就是手机 APP 的开发蓝图：**页面结构 + 交互 + 接口字段全齐**。开发时每开一页就对照文档写，基本不用再翻 Web 代码。
