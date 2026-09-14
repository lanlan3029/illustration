# KidStory P0 产品架构与修改大纲

> **文档目的**：将「AI 绘本生产系统」四个 P0 目标，映射到 KidStory 现有前后端代码，给出修改大纲、数据逻辑与分阶段实施路径。  
> **核心判断**：这不是 Prompt 优化项目，而是 **Prompt + 数据结构 + 图片编辑 + 参考图 + 版本系统 + 工作流** 的系统工程。

**关联仓库**

| 仓库 | 路径 | 职责 |
|------|------|------|
| 前端 | `illustration/` | Vue 3、EditorPro、AI 绘本 UI |
| 后端 | `backend/clouddrawing/` | Koa + MongoDB、生图/分割/角色 API |

**文档版本**：v0.1 · 2026-03-14

---

## 1. 四个 P0 的本质

| P0 | 产品问题 | 主要靠什么实现 | 是否只是 Prompt |
|----|----------|----------------|-----------------|
| **P0-1 局部重绘** | 怎么只改画面的一小块 | 选区 + Mask + 原图 + 编辑指令 + 图像编辑模型 | ❌ |
| **P0-2 页级版本历史** | 改坏了怎么办 | 数据库/对象存储 + 版本链 + 版本 UI | ❌ |
| **P0-3 角色一致性** | 下一页还是不是同一个人 | 角色资产 + Reference Image + 模型能力 + 场景 Prompt | ❌ |
| **P0-4 连续工作流** | 改完怎么真正做成一本书 | Book/Page 数据模型 + 页面状态 + API + EditorPro 集成 | ❌ |

**四者关系**

```
P0-1 解决「怎么改」
P0-2 解决「改坏了怎么办」
P0-3 解决「下一页还是不是同一个角色」
P0-4 解决「改完以后怎么真正做成一本书」
```

---

## 2. 现状审计（基于现有代码）

### 2.1 已有能力（可复用）

| 能力 | 位置 | 说明 |
|------|------|------|
| 套索裁切 | `src/views/LassoCropPage.vue`、`LassoCropCanvas.vue`、`lassoCrop.js` | 可产出选区路径，**尚未导出 inpaint Mask** |
| 背景分割 | `ImageSegmentationPage.vue`、`imageSegmentation.js` | rembg + 阿里云通用分割 |
| 贴纸工坊 | `MatteBrushCanvas.vue`、`stickerLab/*` | 抠图 + 笔刷修边，偏素材而非 AI 编辑 |
| EditorPro 画布 | `Editorpro.vue`、`kuaitu-core/` | Fabric 图层、模板、本地草稿 |
| 图层套索 | `lassoCropImg.vue` → `LassoCropDialog.vue` | 编辑器内裁切/抠图 |
| 角色 CRUD | `Character.ts`、`character.ts`、`CharacterStudio*` | 含 `reference_image`、组图 |
| 异步生图 | `create_character.ts`、`ImageGenerationTask.ts` | APIMart / Doubao，轮询任务 |
| AI 绘本 | `AIBooks.vue` | 故事 + 逐页生图 → **收藏到「我的创作」** |
| 排版导出 | `ComposeIllustration.vue` → `ToPdf.vue` | 客户端 300 DPI PDF |
| 书籍模型 | `Book.ts` | `content: illustrationId[]` + `content_snapshot` |

### 2.2 关键缺口

| 缺口 | 影响 |
|------|------|
| **无 generative inpainting** | 无法「选区 + 指令 → 只改局部」 |
| **无 Page / PageVersion 模型** | 一页只有一张 `Illustration.content`，覆盖即丢失 |
| **无统一 Model Adapter** | 生图/分割/风格迁移逻辑分散在各 controller |
| **角色未作为「资产引擎」注入绘本** | 有 reference 字段，但 AIBooks 未系统化调用 |
| **Book 无工作流状态** | AI 绘本 → EditorPro → 排版 靠手动下载/上传 |
| **EditorPro MaskPlugin ≠ inpaint mask** | 仅为工作区遮罩，不能用于 AI 编辑 |

### 2.3 当前数据流（简化）

```
AIBooks
  POST /generate-story        → 故事 JSON + 每页 prompt
  POST /create-character (×N) → 异步生图
  POST /ill/                  → 收藏单张插画（每页一条 Illustration）

Book
  content: [illId1, illId2, ...]   ← 「页」= 插画 ID，无版本链
  content_snapshot: [{path, title}]  ← 展示快照，非版本历史

EditorPro
  handoff: editorproPendingImage.js  ← 手动带入图片
  localDraft.js (IndexedDB)           ← 单槽草稿，非页级版本

Compose → ToPdf
  选手稿 → 客户端 JsPDF → POST /book/ 发布
```

**结论**：基础设施（Canvas、套索、分割、角色、生图）已有不少；缺的是 **把它们串成有状态的生产流水线**。

---

## 3. 目标架构：五个引擎

```
┌─────────────────────────────────────────────────────────────┐
│                    Book Workflow Engine (⑤)                  │
│  Book → Story → Characters → Pages → EditorProject → Export │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
        ┌───────▼───────┐               ┌───────▼───────┐
        │ Version (②) │               │ Character (③) │
        │ PageVersion │               │ Reference DNA │
        └───────┬───────┘               └───────┬───────┘
                │                               │
                └───────────────┬───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Image Edit Engine (①) │
                    │  image + mask + prompt │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Model Adapter (⑤)    │
                    │ generate / edit / ref  │
                    └───────────────────────┘
```

---

## 4. P0-1：局部重绘（Image Edit Engine）

### 4.1 产品交互

```
绘本页插画 → [AI 修改]
  → 框选 / 涂抹选区
  → 输入：「把苹果换成红色气球」
  → [生成修改]
  → 预览 V(n+1) → 接受 / 放弃
```

### 4.2 技术本质

```json
{
  "image": "original.png",
  "mask": "mask.png",
  "prompt": "把被选中的苹果替换成红色气球，其他内容保持不变"
}
```

- **Mask 决定改哪里**（黑=保留，白=修改）
- **Prompt 决定改成什么**
- 不是「整张图 + Prompt 重生成」

### 4.3 与现有代码的映射

| 模块 | 现状 | 改造方向 |
|------|------|----------|
| 选区 UI | `LassoCropCanvas` 有路径 | 新增 **InpaintMaskEditor**：套索 / 矩形 / 笔刷涂抹 → 导出 PNG mask |
| Mask 生成 | 无 | `utils/inpaint/maskFromSelection.js`：路径 rasterize → 与原图同尺寸 mask |
| 编辑器入口 | `LassoCropDialog` 偏裁切贴纸 | 新增 `AiInpaintDialog.vue`，挂 EditorPro 工具栏 + AIBooks 页预览 |
| 后端 API | 无 | `POST /image-edit/inpaint`（异步任务） |
| 模型调用 | `style-transfer` 仅全图 | Model Adapter 新增 `editImage()` |

### 4.4 后端接口草案

```
POST /image-edit/inpaint
  Body: multipart | { image_url, mask_url, prompt, page_version_id? }
  Response: { task_id }

GET  /image-edit/task/:taskId
  Response: { status, result_image_url, error? }
```

**存储**：结果写入对象存储 → 触发 Version Engine 创建新版本（见 P0-2）。

### 4.5 前端新增文件（建议）

```
src/
  components/inpaint/
    InpaintMaskEditor.vue      # 选区 + 笔刷 mask
    AiInpaintDialog.vue        # 弹窗：mask + prompt + 提交
  utils/inpaint/
    maskFromLasso.js
    maskFromBrush.js
  api/imageEditApi.js
```

### 4.6 改造量评估

| 层 | 工作量 | 风险 |
|----|--------|------|
| 前端 Mask UI | 中 | 低（可复用 lasso + MatteBrushCanvas 笔刷逻辑） |
| 后端 + 模型 | 中 | 中（依赖选用 inpaint 模型，如 GPT Image Edit / SD Inpaint） |
| 与版本系统联动 | 中 | 低（P0-2 就绪后接入） |

---

## 5. P0-2：页级版本历史（Version Engine）

### 5.1 产品规则

**核心原则：不要覆盖原图。**

```
第一次生成     → V1 (is_current=true)
局部修改       → V2 (parent=v1)
再修改         → V3 (parent=v2)
恢复 V2        → current_version=v2（V3 可保留不删）
继续修改       → 基于 current_version.image 作为输入 → V4
```

### 5.2 数据模型（新增）

当前 `Illustration` 只有单一 `content: string`（图片路径）。建议 **不破坏现有 Illustration**，新增 Page + PageVersion：

```typescript
// Page：逻辑上的「绘本一页」
Page {
  _id
  book_id?: string          // 可选，未入书时为 orphan page
  owner_id: string
  page_index?: number      // 在书中的顺序
  current_version_id: string
  character_ids: string[]   // 本页涉及角色
  editor_project_id?: string  // P0-4 关联 EditorPro
  created_at, updated_at
}

// PageVersion：不可变版本记录
PageVersion {
  _id
  page_id: string
  version_number: number    // 1, 2, 3...
  image_url: string
  prompt: string
  mask_url?: string         // 若由 inpaint 产生
  parent_version_id?: string
  source: 'generate' | 'inpaint' | 'upload' | 'restore'
  is_current: boolean       // 冗余字段便于查询；切换时批量更新
  task_id?: string          // 关联异步任务
  created_at
}
```

**与现有 Illustration 的关系（迁移策略）**

| 阶段 | 策略 |
|------|------|
| Phase 1 | 新 AI 绘本页走 Page/PageVersion；旧 Illustration 只读兼容 |
| Phase 2 | `Book.content` 从 `[illId]` 逐步改为 `[pageId]`，或双字段并存 |
| Phase 3 | Illustration 作为「已发布/公开画廊」视图，Page 作为生产源 |

### 5.3 API 草案

```
POST   /pages/                    # 创建页（首次生图后）
GET    /pages/:pageId
GET    /pages/:pageId/versions
POST   /pages/:pageId/versions    # 显式创建版本（inpaint 结果写入）
PATCH  /pages/:pageId/current   # { version_id } 切换当前版本
```

### 5.4 前端 UI

```
┌──────────────────────────────────────┐
│  [V1] [V2] [V3●]     ← 版本切换条    │
│  ┌────────────────────────────────┐  │
│  │         当前版本插画            │  │
│  └────────────────────────────────┘  │
│  [AI修改] [继续修改] [恢复此版本]     │
└──────────────────────────────────────┘
```

**建议组件**：`PageVersionStrip.vue`（版本条）、`PageEditorPanel.vue`（AIBooks / 页详情共用）

### 5.5 改造量评估

| 层 | 工作量 | 风险 |
|----|--------|------|
| 后端模型 + CRUD | 低～中 | **低（P0 中技术风险最低）** |
| 对象存储 | 低 | 沿用现有 upload 目录 |
| 前端版本 UI | 中 | 低 |
| Book.content 迁移 | 中 | 中（需兼容旧书） |

---

## 6. P0-3：角色一致性（Character Engine）

### 6.1 产品定位

不做「Prompt 写详细一点」，做 **角色资产调用**：

```
我的角色：🐱小橘  👧小米  👦乐乐  🐻小熊

创建绘本 → 勾选角色 → 每页生图自动注入 Reference
```

Prompt 只描述 **这一页在做什么**；角色身份由 Reference + character_id 承担。

### 6.2 与现有 Character 模型的差异

**现有**（`Character.ts`）：

```
character_name, description, image_url, reference_image, prompt, tags
CharacterGroupImage（组图）
```

**目标扩展**（渐进，不必一次到位）：

```typescript
Character {
  // 现有字段保留
  character_id: string       // 稳定 ID（已有 _id）
  reference_images: string[] // 多参考图（现多为单 reference_image）
  dna: {                     // 可选结构化属性
    age?, hair?, outfit?, shoes?, style_notes?
  }
  variants?: CharacterVariant[]  // Phase 2：姿势/服装变体
}
```

### 6.3 生成时注入逻辑

```
用户选择 [小米, 妈妈]
        ↓
Character Engine.resolve(char_ids)
        ↓
{
  reference_urls: [...],
  identity_prompt_block: "保持小米的发型、服装与参考图一致…",
  character_ids: ["char_001", "char_002"]
}
        ↓
Model Adapter.generateWithReference({
  prompt: scene_prompt + identity_block,
  reference_images,
  ...
})
```

**接入点**

| 入口 | 文件 | 改造 |
|------|------|------|
| AI 绘本 | `AIBooks.vue` | 创作前选角色；每页 `create-character` 带 reference |
| 角色工作台 | `CharacterStudioWorkbench.vue` | 已有 reference，作为标准源 |
| 后端生图 | `create_character.ts` | 经 Model Adapter 统一传 reference |

### 6.4 产品承诺边界

> **角色参考 + 自动一致性增强 + 不满意可局部修改（P0-1）**

不承诺 100% 一致；用 P0-1 + P0-2 兜底。

### 6.5 改造量评估

| 层 | 工作量 | 风险 |
|----|--------|------|
| 数据模型扩展 | 低～中 | 低 |
| AIBooks 选角 UI | 中 | 低 |
| 模型 reference 能力 | 中～高 | **高（取决于模型）** |
| 多角色同页 | 高 | 高 |

**建议**：Phase 2 再深度做；Phase 1 闭环可先 **单角色 + 单 reference**。

---

## 7. P0-4：连续工作流（Book Workflow Engine）

### 7.1 目标体验

```
创建故事 → 创建/选择角色 → AI 生成绘本
  → 逐页：满意 / AI 修改 / 选版本
  → 完成绘本 → [编辑本书] → EditorPro
  → 文字/装饰/排版 → PDF 导出
```

**禁止**：下载 PNG → 再上传到 EditorPro 的断链体验。

### 7.2 目标数据模型

```typescript
Book {
  // 现有字段
  title, description, content, content_snapshot, ...

  // 新增
  workflow_status: 'draft' | 'generating' | 'editing' | 'layout' | 'published'
  story_id?: string
  character_ids: string[]
  page_ids: string[]              // 有序，替代或补充 content[]
  editor_project_id?: string      // 整书或 per-page 见下
}

EditorProject {
  _id
  book_id: string
  page_id?: string               // 若按页编辑
  canvas_json: object            // EditorPro 序列化
  preview_url?: string
  updated_at
}
```

### 7.3 与现有模块的打通

| 步骤 | 现有 | 目标 |
|------|------|------|
| AI 生成 | `AIBooks` → 散落的 `Illustration` | → 创建 `Book` + `Page[]` + `PageVersion` |
| 页编辑 | 无 | 页内嵌版本条 + AI 修改 |
| 进 EditorPro | `editorproPendingImage.js` 手动 | `router.push({ path: '/editorpro', query: { pageId, bookId }})` |
| 保存回书 | 无 | `PUT /editor-projects/:id` → 更新 Page 封面 / 关联 |
| 排版 | `ComposeIllustration` → `ToPdf` | 从 `Book.page_ids` 拉 **current_version** 图 |
| PDF | 客户端 JsPDF | 短期保持；长期可选服务端渲染 |

### 7.4 EditorPro 集成要点

```
AI绘本 page_id=123  ──→  EditorPro project_id=456
                              │
                         保存 canvas
                              │
                         回到 page_id=123
                              │
                         看到最新版本 / 编辑器预览
```

**改造文件**

- `Editorpro.vue`：读取 `route.query.pageId`，保存时回调 API
- `utils/editorPro/bookHandoff.js`（新建）：Book ↔ EditorPro 状态同步
- `AIBooks.vue`：生成完成后进入「书本工作流」而非仅收藏插画

### 7.5 改造量评估

| 层 | 工作量 | 风险 |
|----|--------|------|
| Book 状态机 | 中 | 中 |
| EditorPro 双向绑定 | 中～高 | 中 |
| 替换 Compose 数据源 | 低～中 | 低 |
| 废弃路径清理 | 低 | `PrintBookLayout.vue` 已 orphan，可归档或接入 |

---

## 8. Model Adapter（横切模块）

### 8.1 问题

当前模型调用分散在：

- `create_character.ts`（APIMart gpt-image-2）
- `image_segmentation.ts`（rembg、阿里云）
- `style_transfer.ts`（阿里云增强）
- `generate-story`（Doubao 等）

### 8.2 目标接口（后端 `services/modelAdapter/`）

```typescript
interface ModelAdapter {
  generateImage(params: GenerateParams): Promise<TaskHandle>
  editImage(params: EditImageParams): Promise<TaskHandle>      // P0-1
  generateWithReference(params: RefGenerateParams): Promise<TaskHandle>  // P0-3
  getTaskStatus(taskId: string): Promise<TaskResult>
}

// 实现例
class ApimartGptImageAdapter implements ModelAdapter { ... }
class RembgSegmentAdapter { ... }  // 非生成，可并列
```

**控制器只做**：鉴权、参数校验、调用 Adapter、写 Version、返回 task_id。

### 8.3 前端对应

`src/api/modelTasks.js`：统一轮询、错误格式化（类似现有 `createCharacterTask.js`）。

---

## 9. 推荐实施顺序（不要四个 P0 同时开工）

### Phase 0：最小闭环（MVP，4～6 周量级）

**目标**：单页完整验证产品方向

```
AI 绘本单页生成
  → 创建 Page + Version V1
  → AI 修改（选区 + mask + prompt）
  → 生成 V2
  → V1 / V2 切换 + 恢复
  → 继续修改 → V3
```

| 交付 | 引擎 |
|------|------|
| Page + PageVersion 模型与 API | ② |
| InpaintMaskEditor + AiInpaintDialog | ① |
| POST /image-edit/inpaint + 任务轮询 | ① + ⑤ |
| PageVersionStrip UI | ② |
| AIBooks 单页接入（先不整书） | ④ 局部 |

**不在 MVP 范围**：多角色 reference、整书 EditorPro 打通、Book.content 迁移。

### Phase 1：角色资产注入（+3～4 周）

- Character `reference_images[]` + AIBooks 选角
- `generateWithReference()` 接入 `create-character`
- 每页 Page 记录 `character_ids`

### Phase 2：整书工作流（+4～6 周）

- Book.page_ids + workflow_status
- AIBooks 自动创建 Book 骨架
- EditorPro `pageId` handoff + EditorProject 持久化
- Compose/ToPdf 读 Page current_version

### Phase 3：体验与性能

- 多角色同页、CharacterVariant
- 服务端 PDF（可选）
- 旧 Illustration / Book.content 迁移工具

---

## 10. 端到端用户流程（目标态）

```
                创建故事
                   ↓
               选择角色
                   ↓
              AI 生成绘本
                   ↓
        ┌──────────┴──────────┐
        ↓                     ↓
      满意                   不满意
        ↓                     ↓
      下一页                AI 修改
                              ↓
                            选区域 + Mask
                              ↓
                           输入要求
                              ↓
                          Version+1
                              ↓
                         版本切换 / 恢复
                              ↓
                           下一页 ...
                              ↓
                           完成绘本
                              ↓
                         [编辑本书]
                              ↓
                          EditorPro
                              ↓
                       文字 / 装饰 / 排版
                              ↓
                            PDF
```

---

## 11. 文件级改造清单（汇总）

### 11.1 后端（clouddrawing）

| 动作 | 路径 |
|------|------|
| 新增 | `src/models/Page.ts`, `PageVersion.ts`, `EditorProject.ts` |
| 新增 | `src/controllers/page.ts`, `page_version.ts`, `image_edit.ts` |
| 新增 | `src/services/modelAdapter/index.ts`, `apimart.ts`, … |
| 修改 | `src/main.ts`（注册路由） |
| 修改 | `create_character.ts`（改走 Adapter） |
| 修改 | `Book.ts` / `book.ts`（page_ids, workflow_status，Phase 2） |

### 11.2 前端（illustration）

| 动作 | 路径 |
|------|------|
| 新增 | `src/components/inpaint/*`, `src/api/imageEditApi.js`, `src/api/pageApi.js` |
| 新增 | `src/components/book/PageVersionStrip.vue` |
| 修改 | `AIBooks.vue`（Page 创建、版本条、AI 修改入口） |
| 修改 | `Editorpro.vue`（book/page handoff） |
| 修改 | `ComposeIllustration.vue` / `ToPdf.vue`（读 PageVersion，Phase 2） |
| 复用 | `LassoCropCanvas.vue`, `MatteBrushCanvas.vue` → inpaint mask 逻辑 |

### 11.3 直白解释：这些后端模块是干什么的？

> 下面说的都是 **后端代码**（`clouddrawing`），不是浏览器里的「页面」。  
> 用户看不见它们，但前端每个按钮背后，最终都要调这些接口。

#### 数据模型（存什么）

| 文件 | 一句话 | 打个比方 |
|------|--------|----------|
| `Page.ts` | 给「绘本里的某一页」发身份证 | 像 Word 里的一页，有页码、属于哪本书 |
| `PageVersion.ts` | 这一页每次改图都留一份，不删旧的 | 像 Google Docs 的历史记录，V1、V2、V3… |
| `EditorProject.ts` | 存 EditorPro 里拖好的文字、贴纸、排版 | 像 PS 工程文件，下次打开还能接着改 |

#### 接口控制器（对外提供什么能力）

| 文件 | 一句话 | 用户能做什么 |
|------|--------|--------------|
| `page.ts` | 创建、查询「某一页」 | 打开第 3 页、列出全书有哪些页 |
| `page_version.ts` | 管理这一页的所有版本 | 看 V1/V2/V3、切回旧版、标记「当前用哪张」 |
| `image_edit.ts` | 接收「原图 + 选区 + 改什么」去 AI 局部改图 | 框住苹果，说「换成气球」，只改那一块 |

#### 模型适配层（怎么调 AI）

| 文件 | 一句话 | 为什么要单独做 |
|------|--------|----------------|
| `modelAdapter/index.ts` | 全站生图、改图、带参考图生图，都走同一套入口 | 换模型时只改一处，不用满项目找 `if model == xxx` |
| `modelAdapter/apimart.ts` 等 | 真正去调 APIMart / 其它供应商 | 每家 API 格式不同，在这里翻译 |

#### 要改的现有文件

| 文件 | 一句话 |
|------|--------|
| `main.ts` | 把新接口挂到服务器上，前端才能调到 |
| `create_character.ts` | 现在的「生插画」改走统一 Adapter，并能和 Page 版本挂钩 |
| `Book.ts` / `book.ts`（Phase 2） | 一本书不再只是一堆插画 ID，而是有状态：生成中 → 编辑中 → 可导出 |

---

### 11.4 对照表：后端模块 ↔ 前端页面 ↔ 用户操作

| 用户想做的事 | 点哪里（前端） | 调谁（后端） | 数据落在哪 |
|--------------|----------------|--------------|------------|
| AI 生成绘本某一页 | `AIBooks.vue` | `create_character.ts` → Adapter | 新建 `Page` + `PageVersion V1` |
| 这一页改坏了，只想改苹果 | `AiInpaintDialog.vue`（新建） | `image_edit.ts` → Adapter `editImage()` | 新建 `PageVersion V2`，V1 还在 |
| 在 V1 和 V2 之间选一张 | `PageVersionStrip.vue`（新建） | `page_version.ts` | 改 `Page.current_version_id` |
| 继续在这一页上改 | 同上 + inpaint 弹窗 | `image_edit.ts`，输入图 = 当前版本 | V3、V4… |
| 用固定角色生下一页 | `AIBooks.vue` 选角色 | Adapter `generateWithReference()` | `Page.character_ids` + 新版本 |
| 进编辑器加字、贴纸 | `Editorpro.vue` | `EditorProject` 相关 API（Phase 2） | `EditorProject.canvas_json` |
| 排版、导出 PDF | `ComposeIllustration.vue` → `ToPdf.vue` | `book.ts` 读 `page_ids` + 每页当前版本图 | `Book.workflow_status` |

**容易混淆的一点**

- `LassoCropPage.vue` / 贴纸工坊：现在是 **裁切、抠图、做贴纸**，面向素材。
- P0 的 **AI 局部修改**：是 **在原画上改内容**（换物体、改颜色等），要走 `image_edit.ts`，不是重新整张生图。

---

### 11.5 增加这些能力后的好处

#### 对用户（创作者）

| 现在 | 加上之后 |
|------|----------|
| 一页图不满意，往往只能 **整张重生成**，其它画好的部分也变了 | **框选一块改**，背景、人物、构图尽量保留 |
| 改几次就 **覆盖原图**，之前的版本找不回来 | **V1/V2/V3 随时切换**，改坏了能回退 |
| 下一页人物 **脸、衣服经常变** | 选好的角色 **带参考图** 生图，跨页更稳（再配合局部修改兜底） |
| 生完图要 **下载 → 再上传 EditorPro** | 从绘本 **一键进编辑器**，保存后还连着同一本书、同一页 |
| 做一本书像 **几个工具拼起来** | 一条线：**写故事 → 生页 → 改页 → 编辑 → 导出 PDF** |

#### 对产品（KidStory 定位）

- 从「几个 AI 功能堆在一起」变成 **「AI 绘本生产系统」**——能改、能退、能连续做书。
- **局部修改 + 版本历史** 是差异化：很多工具只能重 roll，KidStory 可以「修到满意为止」。
- **角色资产** 可复用：今天为绘本建的角色，明天别的故事还能用，提高留存。
- **工作流打通** 后，用户更少流失到 PS / Canva 再拼回来。

#### 对开发团队

| 好处 | 说明 |
|------|------|
| 职责清晰 | 控制器管鉴权和存库，Adapter 管模型，前端管交互 |
| 换模型成本低 | 新接 inpaint 或换 gpt-image，主要改 `modelAdapter/` |
| 旧数据可兼容 | 不立刻废掉 `Illustration`，新书走 `Page`，老书照常看 |
| 可分期交付 | MVP 先做「单页 + 改图 + 版本」，再接角色、再整书工作流 |
| 可验收 | 每条能力有明确接口和数据表，不用靠「感觉 Prompt 好不好」 |

#### 用三句话总结价值

1. **P0-1 + P0-2**：改图 **像修照片**，不是 **像抽奖重画**。  
2. **P0-3**：角色 **像 cast 演员**，不是 **每页重新捏一个人**。  
3. **P0-4**：做书 **像在一个项目里做完**，不是 **在五个网站之间拷文件**。

---

## 12. 风险与依赖

| 风险 | 缓解 |
|------|------|
| inpaint 模型效果/成本 | Adapter 抽象，可换模型；MVP 先接一种 |
| 存储膨胀（每版本一张图） | 对象存储 + 上限策略（如每页最多 20 版本） |
| 旧数据兼容 | Book.content 双轨；Illustration 不删 |
| 角色一致性的用户预期 | 文案强调「参考增强 + 可局部改」 |
| EditorPro 序列化体积 | EditorProject 独立集合，按需加载 |

---

## 13. 验收标准（MVP / Phase 0）

- [ ] 单页生图后存在 `Page` 与 `PageVersion V1`，且 `is_current=true`
- [ ] 用户可在 UI 上框选/涂抹生成 mask，提交 inpaint 任务
- [ ] 任务成功后自动创建 `V2`，不覆盖 `V1` 文件
- [ ] 版本条可切换 V1/V2，切换后「继续修改」基于当前版本图
- [ ] 「恢复 V1」仅改 `current_version_id`，V2 仍可查
- [ ] 全流程无「下载再上传」步骤

---

## 14. 下一步（文档之后）

1. **评审本文档**：确认 Page/PageVersion  schema 与 MVP 范围  
2. **选定 inpaint 模型**：APIMart / 自建 / 其他，确定 API 规格  
3. **开 Phase 0 后端分支**：Page + PageVersion + image-edit 骨架  
4. **开 Phase 0 前端分支**：InpaintMaskEditor + PageVersionStrip  
5. **AIBooks 选一页试点**：端到端联调  

---

## 附录 A：名词对照

| 用户说法 | 代码现状 | 目标模型 |
|----------|----------|----------|
| 绘本一页 | `Illustration` 一条 / `Book.content[i]` | `Page` |
| 这一页的图 | `Illustration.content` | `PageVersion.image_url` |
| 当前使用的图 | 无（覆盖即丢） | `Page.current_version_id` |
| 角色参考图 | `Character.reference_image` | `Character.reference_images[]` |
| AI 改一点 | 无 | inpaint + mask |
| 编辑这本书 | 手动进 EditorPro | `Book.editor_project_id` |

## 附录 B：相关现有文档

- `seo.md` — 站点 SEO（与 P0 无直接冲突）
- `poster-templates-spec.md` — 海报模板规范（EditorPro 模板体系可参考）
- `creator.md` — 创作者相关说明

---

*本文档为规划说明，实施时以各 Phase 的 PR / 接口文档为准。*
