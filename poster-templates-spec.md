# 心笺 · 海报模板样式规范（Web 端对齐用）

> 来源：微信小程序 `miniprogram/utils/posters/` 与 `_shared/` 模块（2026-05）。  
> 画布与坐标以 **675×1200 px（9:16）** 为准；设计稿基准 **300×500**，按比例缩放。

---

## 1. 画布与缩放

| 常量 | 值 | 说明 |
|------|-----|------|
| `POSTER_W` | 675 | 合成画布宽 |
| `POSTER_H` | 1200 | 合成画布高 |
| `POSTER_BASE_W` | 300 | 设计稿宽 |
| `POSTER_BASE_H` | 500 | 设计稿高 |
| `SX` | `W / 300` = **2.25** | 水平缩放 |
| `SY` | `H / 500` = **2.4** | 垂直缩放 |
| `SF` | `√(SX·SY)` ≈ **2.324** | 字号缩放 |
| `POSTER_EXPORT_MULTIPLIER` | 2 | 导出 JPG 宽高 ×2（约 1350×2400） |

**Web 换算示例（W=675）：**

| 设计稿数值 | 公式 | 画布 px（约） |
|-----------|------|---------------|
| 字号 10 | `10 × SF` | 23 |
| 行高 16 | `16 × SY` | 38 |
| 页眉字号 10 | `10 × SF` | 23 |
| 页脚字号 6 | `6 × SF` | 14 |
| 摘录字号 7 | `7 × SF` | 16 |
| 摘录行高 11 | `11 × SY` | 26 |

---

## 2. 全局文案规则

### 2.1 主叙述（所有模板共用）

| 规则 | 值 |
|------|-----|
| 常规字数上限 | **120**（`POSTER_USER_BODY_MAX_CHARS`） |
| 紧凑模式上限 | **240**（`POSTER_USER_BODY_COMPACT_MAX_CHARS`） |
| 触发紧凑 | 原文长度 **> 120** |
| 常规字号 | `round(10 × SF)` ≈ **23px** |
| 常规行高 | `round(16 × SY)` ≈ **38px** |
| 紧凑字号 | 固定 **16px**（`POSTER_QUOTE_FONT_COMPACT_CANVAS`） |
| 紧凑行高 | 固定 **28px**（`POSTER_QUOTE_LINE_COMPACT_CANVAS`） |
| 截断策略 | 优先 `。！？` → `，；、` → 硬截 + `…` |

### 2.2 摘录（hitokoto / dbFootQuote）

| 规则 | 值 |
|------|-----|
| 正式合成 | **默认不绘制**（需 `includeFootQuote: true`，仅调试） |
| 字号 | `7 × SF` ≈ 16px |
| 行高 | `11 × SY` ≈ 26px |
| 展示 | 自动包 `「」`；最多 4 行（模板可覆盖，如奶油 2 行、封面 2 行、多图 3 行） |
| 颜色 | 模板自定，常见 `#7a7a7a` / `rgba(255,255,255,0.78)` |

### 2.3 页眉（`_drawPosterHeader`）

| 元素 | 规格 |
|------|------|
| 日期 | 左 `20×SX`（45px），格式 `YYYY年M月D日` |
| 日期/心情垂直中线 | 设计稿 **y=26** → 画布 **62.4px**（`pillRowCy`） |
| 心情 pill 高度 | 默认设计稿 **18** → 43.2px；杂志 **14** → 33.6px |
| 心情 pill 圆角 | 默认 `9×SF`；杂志 `7×SF` |
| 心情 pill 内边距 | 默认设计稿 **14**（总宽 = 字宽 + 14×SX）；杂志 **14** |
| 心情 pill 最小宽 | 默认设计稿 **46**；杂志 **46** |
| 心情 pill X | 右缘 `w - 18×SX - pillW` |
| 页眉字号 | `10 × SF` ≈ 23px，`textBaseline: middle` |

### 2.4 页脚（`_drawMomentsFooter`）

| 元素 | 规格 |
|------|------|
| 内容 | 用户昵称（居中），无头像、无二维码 |
| `footerY` 约定 | 多数模板 `h - 38×SY` ≈ **1108.8** |
| 昵称 baseline | `footerY + 12×SY + 3×SY` |
| 字号 | `6 × SF` ≈ 14px |
| 颜色 | `theme.brandColor` |

---

## 3. 主题色（`_resolveCommonTheme`）

### 3.1 `cream`（奶油卡片页眉）

| 字段 | 规则 |
|------|------|
| `pillBg` | `dominantHex` 或 `#C8E6B0` |
| `pillTextColor` | 浅底 → `#4F7A3D`；深底 → `#fff` |
| `dateColor` | `#7A7A7A` |
| `brandColor`（页脚） | `#7A7A7A` |

### 3.2 `paper`（报刊 / 多图页眉）

| 字段 | 规则 |
|------|------|
| `pillBg` | `dominantHex`（默认 `#c8e6b0`） |
| `pillTextColor` | 浅 accent → `#111`；深 → `#fff` |
| `dateColor` | `#7a7a7a` |

### 3.3 `dominant`（主色铺底模板页眉/页脚）

| 底色明暗 | 日期 | pill | 页脚 |
|----------|------|------|------|
| 浅 (`isLightHex`) | `rgba(17,17,17,0.78)` | 深 pill + 白字 | `rgba(17,17,17,0.72)` |
| 深 | `rgba(255,255,255,0.85)` | 白 pill + 黑字 | `rgba(255,255,255,0.78)` |

### 3.4 产品色板（`themeColors.js` / `theme.wxss`）

```
bgPage      #F7FBFE    页底 / 报刊底 / 多图底
bgCard      #FFFFFF    奶油卡片内卡
primary     #111111    正文
accent      #C8E6B0    默认强调 / pill
accentStrong #4F7A3D   浅绿 pill 文字
textSecondary #7A7A7A  日期 / 副文
placeholder #A8A8A8    摘录 / 占位
```

---

## 4. 模板列表（合成页顺序）

| id | 中文名 | placement 变体 | 多图 |
|----|--------|----------------|------|
| `coverStory` | 封面 | — | 否 |
| `creamCard` | 奶油卡片 | — | 否（**默认**） |
| `gazette` | 报刊 | — | 否 |
| `framedPhoto` | 影集 | — | 否 |
| `colorBlock` | 色块 | `top` / `bottom` / `left` / `right` | 否 |
| `titleAbove` | 标题 | — | 否 |
| `magazine` | 杂志 | — | 否 |
| `multiGrid` | 多图宫格 | `below` / `above` | **是（2–9 张）** |

---

## 5. 各模板详细样式

### 5.1 封面 `coverStory`

**概念：** 全图 cover + 上下黑色渐变 + 底部白字标题。

| 项 | 值 |
|----|-----|
| 主图 | `cover` 铺满 675×1200 |
| 顶渐变 | 高 18% 画布，`0→55%` 黑 → 透明 |
| 底渐变 | 自 42% 高，`0→55%@0.45→92%@1` 黑 |
| `dominantHex` | **不使用** |
| 页眉主题 | `dominant` + `#000000`（白字） |
| 主文 | 居中，`#ffffff`，宽 `w-100`（左右各 50） |
| 主文对齐 | `center` |
| 摘录 | 居中，色 `rgba(255,255,255,0.78)`，最多 2 行 |
| 页脚主题 | 同页眉（白字） |

---

### 5.2 奶油卡片 `creamCard`

**概念：** 浅蓝页底 + 白圆角卡 + 上图下文。

| 项 | 值（画布 px，675×1200） |
|----|-------------------------|
| 页底 | `#f7fbfe` |
| 白卡 | x=18, y=19.2, w=639, h=1152, 圆角 `14×SF` |
| 主图区 | x=40.5, y=158.4, w=594, h=648, 圆角 clip `14×SF`，占位灰 `#eae6df` |
| 主图缩放 | **cover**（圆角块内） |
| 主文起点 | 图底 + `20×SY`（48px） |
| 主文宽 | **与主图同宽** 594px |
| 主文对齐 | **右对齐**，锚点图右缘 |
| 主文色 | `#111111` |
| 摘录 | 主文下，右对齐，色 `#a39e96`，最多 **2** 行 |
| 页眉主题 | `cream` + `dominantHex`（pill 跟主题色） |
| 页脚 | `footerY = h - 38×SY` |

---

### 5.3 报刊 `gazette`

**概念：** 米白底 + 中部 contain 主图 + 下方居中正文。

| 项 | 值 |
|----|-----|
| 页底 | `#f7fbfe` |
| 主图盒 | x=70, y=150, w=535, h=540，**contain** 居中 |
| 正文区 | 图底 + 80px 起，左右 pad 50，**居中** |
| 正文色 | `#111111` |
| 摘录 | 正文后，居中 `#7a7a7a` |
| 页眉/页脚 | `paper` + `dominantHex`（pill 用主色） |

---

### 5.4 影集 `framedPhoto`

**概念：** 整画布 `dominantHex` + 居中 contain 主图 + 细边框 + 装饰条 + 下文。

| 项 | 值 |
|----|-----|
| 背景 | `dominantHex` 全幅 |
| 主图盒 | 430×540，居中，top y=200 |
| 主图 | **contain** |
| 边框 | 4px，色 = 正文色（随明暗） |
| 装饰条 | 图下 48px，宽 `44×SF`，高 `max(2, 2×SF)` |
| 正文 | 条下 28×SY，左右 pad 60，**居中** |
| 正文色 | 浅底 `#111` / 深底 `#fff` |
| 摘录色 | 浅 `rgba(26,26,26,0.62)` / 深 `rgba(255,255,255,0.7)` |
| 页眉/页脚 | `dominant` + `dominantHex` |

---

### 5.5 色块 `colorBlock`

**概念：** 主色块 + 其余区域主图 cover；色块内居中主文。

| 项 | 值 |
|----|-----|
| placement | `top` / `bottom` / `left` / `right` |
| 色块比例 | 横条（top/bottom）：高 **42%**；竖条（left/right）：宽 **45%** |
| 主图区 | 剩余矩形，**cover** |
| 色块内边距 | 横条 60 / 竖条 30（左右） |
| 主文 | 色块内垂直水平居中 |
| 主文色 | 浅 `#2c2c2e` / 深 `#fff` |
| 摘录 | 色块内、主文下，最多 3 行 |
| 页眉/页脚 | `dominant`（可能叠在 photo 区） |

---

### 5.6 标题 `titleAbove`

**概念：** 主色满铺；标题在主图**上方**固定间距；主图位置固定不随标题上移。

| 项 | 值 |
|----|-----|
| 背景 | `dominantHex` |
| 主图盒顶 | **固定 y=280**（画布坐标） |
| 主图盒 | 宽 `min(515, w-80)`，底 `h-200`，**contain** |
| 标题 | 末行 baseline ≈ 图顶 - **24px** |
| 标题最小顶 | `42×SY` |
| 标题宽 | `w - 120`，居中 |
| 摘录 | 图下，`max(imgBottom+16, h-180)` 起，居中 |
| 页眉/页脚 | `dominant` |

---

### 5.7 杂志 `magazine`

**概念：** 白边 + 内嵌主色板 + 左栏文 + 右侧破框大图。

| 项 | 值 |
|----|-----|
| 外边距 | **40px** 白边 |
| 主色板 | 595×1120，`dominantHex` |
| 主图盒 | 360×540，x = 面板右 - 360 + **32**（破框），y=360 |
| 主图 | **contain**，右对齐 + 垂直居中 |
| 左栏 | 面板左 + 30，分隔线 70×3 @ y=478 |
| 正文 | 左对齐，x=leftPad，baseline 从 **520** 起，栏宽 ≈ 图左 - leftPad - 5 |
| 正文色 | 随主色明暗 `#111` / `#fff` |
| 摘录 | 主图盒下方居中 |
| 页眉 | `paper` + **覆盖**：pill 底 `#f5f0e8`，字色=日期色，pillH=14，radius=7 |
| 页脚 | `dominant`（落在色板内） |

---

### 5.8 多图宫格 `multiGrid`

**概念：** 米白底 + 1–9 图智能宫格 + 文块在上或下。

| 项 | 值 |
|----|-----|
| 页底 | `#f7fbfe` |
| `imagePlacement` | `below`（默认）/ `above` |
| 宫格 gap | 12px |
| 侧边距 | 40px |
| 顶区 | header 底 ≈ `50×SY` |
| 底区 | footer 顶 ≈ `h - 60×SY` |
| 主文 | 左对齐，最多 **4** 行，色 `#111` |
| 摘录 | 左对齐 `#7a7a7a`，最多 3 行 |
| 单格图 | **cover**；失败格 `#eee` + `!` |
| 页眉/页脚 | `paper` + `dominantHex` |

**宫格布局（简要）：**

| 张数 | 布局 |
|------|------|
| 1 | 满铺区域 |
| 2 | 左右各半 |
| 3 | 左大 + 右上下两小 |
| 4 | 2×2 |
| 5–9 | 3 列，末行左对齐 |

---

## 6. 合成入参（`composeImageWithCaption` options）

```ts
interface PosterComposeOptions {
  template: 'coverStory' | 'creamCard' | 'gazette' | 'framedPhoto'
    | 'colorBlock' | 'titleAbove' | 'magazine' | 'multiGrid'
  dominantHex?: string          // 主色；封面不用
  colorBlockPlacement?: 'top'|'bottom'|'left'|'right'  // 默认 top
  imagePlacement?: 'above'|'below'  // 仅 multiGrid
  srcPaths?: string[]            // 仅 multiGrid
  colorAdjust?: number           // [-1,1]，色块/主色模板调色（generate 页）
  includeFootQuote?: boolean     // 正式流程 false
  dbFootQuote?: string
}
```

**draft 字段（心情 pill）：**

- `moodEmojiId` → 表情中文名  
- 或 `tags` / 坐标 → 兜底「此刻心情」  
- 展示最长 **14** 字 + `…`

---

## 7. Web 端实现建议

1. **坐标系**：以 675×1200 实现布局，CSS 可用 `aspect-ratio: 9/16` + `transform: scale()` 适配预览。  
2. **字体**：系统无衬线栈 `-apple-system, PingFang SC, Microsoft YaHei, sans-serif`。  
3. **主色**：从用户图提取 `dominantHex`，与小程序 `colorPalette.extractDominantHex` 对齐。  
4. **紧凑模式**：`caption.length > 120` 时切换 `font-size: 16px; line-height: 28px`。  
5. **摘录**：产品默认关闭；Web 若需一致可不渲染 `dbFootQuote`。  
6. **模板记忆**：本地存 `{ id, placement }`（见 `posterTemplatePref.js`）。  

---

## 8. 源文件索引

| 模板 | 实现文件 |
|------|----------|
| 共享常量 | `utils/posters/_shared/constants.js` |
| 主题 | `utils/posters/_shared/theme.js` |
| 页眉/页脚 | `utils/posters/_shared/header.js`, `footer.js` |
| 摘录 | `utils/posters/_shared/excerpt.js` |
| 圆角图 | `utils/posters/_shared/imageBlock.js` |
| 封面 | `utils/posters/coverStory.js` |
| 奶油 | `utils/posters/creamCard.js` |
| 报刊 | `utils/posters/gazette.js` |
| 影集 | `utils/posters/framedPhoto.js` |
| 色块 | `utils/posters/colorBlock.js` |
| 标题 | `utils/posters/titleAbove.js` |
| 杂志 | `utils/posters/magazine.js` |
| 多图 | `utils/posters/multiGrid.js` |
| 入口 | `utils/aiMock.js` → `composeImageWithCaption` |

---

*文档随小程序海报逻辑更新；若常量与代码不一致，以 `constants.js` 与各 `compose*.js` 为准。*
