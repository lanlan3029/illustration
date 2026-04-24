# KidStory 插画平台 · Figma 重设计 Prompt 手册

> 本文档把 `src/views/` 下每个页面的功能、结构、交互整理成可直接喂给 Figma AI / First Draft / Uizard 等工具的 prompt。
>
> **使用建议**：先把下面的「全局设计规范」粘到 Figma 项目的 Design System / Variables 里（颜色、字号、圆角、阴影作为 Token），再用每页的 Prompt 生成稿件——这样产出风格统一，后续调整只需改 Token。

---

## 〇、全局设计规范（Design System）

### 品牌定位
- **目标用户**：儿童内容创作者、AI 绘本 / 插画爱好者、家长与老师。
- **情绪关键词**：`playful` · `creative` · `soft` · `warm` · `modern 2026`。
- **UI 风格**：柔和圆润（soft-rounded），glassmorphism + subtle gradient，禁硬边角、禁暗黑恐怖色调。

### 色板（CSS Variables）

```
--brand-primary:      #8167a9   /* 主紫，按钮、链接、高亮 */
--brand-primary-soft: #a89ac7   /* 次级紫 */
--brand-gradient:     linear-gradient(135deg, #ff9a8b 0%, #ff6a88 45%, #8167a9 100%)  /* 强调渐变 */
--accent-warm:        #ff9a8b   /* 暖粉，CTA 点缀 */
--accent-info:        #409eff   /* 蓝，信息链接 */
--accent-success:     #67c23a   /* 绿 */
--accent-warning:     #e6a23c   /* 黄 */
--accent-danger:      #e14a4a   /* 红 */

--text-primary:       #303133
--text-regular:       #606266
--text-secondary:     #909399
--text-placeholder:   #c0c4cc
--text-on-brand:      #ffffff

--bg-page:            linear-gradient(180deg, #f6f4fb 0%, #eef1f8 100%)
--bg-card:            #ffffff
--bg-muted:           #f5f7fa
--bg-glass:           rgba(255,255,255,0.6) + backdrop-filter: blur(10px) saturate(160%)

--border-default:     #e4e7ed
--border-soft:        #ebeef5
--border-focus:       #8167a9
```

### 字体
- **中文主字**：PingFang SC / Microsoft YaHei / HarmonyOS Sans（正文）。
- **中文手绘/点缀**：阿里妈妈灵动体 · 苦累蛙圓體 · 寒蝉圆体（仅用于心情日记、卡片 Hero 标题）。
- **英文**：Inter / PublicSans（正文）· Caveat（手写点缀）。
- **字号**：`h1 32/36px · h2 24/28px · h3 18/22px · body 14/22px · caption 12/18px`。

### 间距 / 圆角 / 阴影
- **间距**：`4 / 8 / 12 / 16 / 24 / 32 / 48`。
- **圆角**：`sm 8px · md 12px · lg 18px · xl 24px · pill 999px`。
- **阴影**：  
  - `elev-1`: `0 2px 8px rgba(0,0,0,0.06)`  
  - `elev-2`: `0 6px 20px rgba(31,35,41,0.08)`  
  - `elev-3`: `0 12px 24px rgba(0,0,0,0.15)`  
  - `glow-brand`: `0 8px 24px rgba(129,103,169,0.24)`

### 共享组件（sticker 到 Figma 的 Component Library）
- **TopBar**（桌面 60px / 移动 50px，半透明 + backdrop-blur）
- **Footer**（站点底栏，仅首页吸底）
- **Button 系列**：Primary(brand gradient) / Secondary(ghost purple) / Danger(red) / IconButton
- **Card**：cover(4:3) + meta + footer，hover 上浮 + glow
- **Chip / Tag**：圆角 pill，灰底 or 紫底
- **Dialog / Bottom Sheet**：桌面居中弹窗，移动端从下往上的 70% 高 sheet
- **Empty State**：居中大图 + 说明 + CTA
- **Loading**：shimmer skeleton（列表） · spinner（按钮内）
- **ToastMessage**：顶部 72px offset，圆角 pill

### 响应式断点
- **Desktop**：`≥1200px`，多栏、侧边栏、悬浮装饰；
- **Tablet**：`768–1199px`，两栏或折叠侧栏；
- **Mobile**：`≤767px`，单列堆叠 + Bottom Sheet / 汉堡菜单。

---

## 页面 Prompt 总览

| 分组 | 页面 | 路由 |
|---|---|---|
| 入口 | Home 首页 | `/` |
| 入口 | NotFound 404 | `*` |
| 入口 | NewYear / NewYearGallery 春节活动 | `/new-year` |
| 阅读消费 | OriginalBooks 绘本列表 | `/books/` |
| 阅读消费 | OriginalBookdetails 绘本详情/阅读器 | `/books/:bookId` |
| 阅读消费 | OriginalIllustration 插画列表 | `/illustration` |
| 阅读消费 | OriginalIllusdetails 插画详情 | `/illustration/:illId` |
| 阅读消费 | SearchBooks 搜索 | `/search-books/` |
| AI 创作 | AIpicture AI 插画 | `/ai-picture` |
| AI 创作 | AIBooks AI 绘本 | `/AIbooks` |
| AI 创作 | CreateCharacter 创作角色 | `/create-character` |
| AI 创作 | CreateGroupImages 创作组图 | `/create-group-images` |
| AI 创作 | CharacterGroupImages 角色组图 | `/character-group-images/:id` |
| AI 创作 | CreateLayoutIllustration 布局创作 | `/create-layout-illustration` |
| AI 创作 | PromptFill 提示词工坊 | `/prompt-fill` |
| AI 创作 | StyleTransfer 风格迁移 | `/user/upload/style-transfer` |
| AI 创作 | MoodDiary 心情日记 | `/mood-diary` |
| 编辑 | Creation 创作中心 | `/creation` |
| 编辑 | Editorpro 专业编辑器 | `/editorpro` |
| 编辑 | ComposeIllustration 合成绘本 | `/user/upload/compose-illustration` |
| 编辑 | ToPdf 导出 PDF | `/.../topdf` |
| 编辑 | SaveDraft 草稿 | `/save-draft` |
| 上传管理 | Upload 上传中心 | `/user/upload` |
| 上传管理 | UploadIllustration 上传插画 | `/.../upload-illustration` |
| 上传管理 | UploadLocalBook 上传本地绘本 | `/.../upload-local-book` |
| 上传管理 | UploadLocalPdf 上传 PDF | `/.../upload-loacl-pdf` |
| 上传管理 | UploadElement 上传素材 | `/.../upload-element` |
| 上传管理 | SubmitRes 提交成功 | `/.../submit-res` |
| 上传管理 | EditionIll 编辑插画 | `/.../editionillus/:id` |
| 上传管理 | EditionBook 编辑绘本 | `/.../editionbook/:id` |
| 上传管理 | EditionRes 编辑成功 | `/.../edition-success` |
| 用户 | MyHomePage 我的主页 | `/user` |
| 用户 | UserProfile 我的资料 | `/user/profile` |
| 用户 | UserG 他人主页 | `/user/:id` |
| 用户 | MyBookDetails 我的绘本详情 | `/user/mybook/:id` |
| 用户 | MyCoBookDetails 我的收藏详情 | `/user/cobook/:id` |
| 用户 | MyIllusDetails 我的插画详情 | `/user/myillus/:id` |
| 用户 | ForgotPassword 忘记密码 | `/forgot-password` |
| 用户 | MemberRecharge 会员充值 | `/member-recharge` |
| 用户 | MemberRechargeSuccess 充值成功 | `/member-recharge-success` |
| 用户 | WeChatCallback 微信回调 | `/wechat/callback` |
| 其它 | Connection 联系我们 | `/connection` |
| 其它 | UtilityTools 工具 | `/utility-tools` |
| 其它 | Maze 迷宫 | `/maze` |

---

# 一、入口 / 导航

## 1.1 Home 首页 · `/`

- **定位**：平台门户，展示全部创作/消费入口。
- **功能**：左右两栏——左侧功能卡片网格（7 项创作/消费入口），右侧风格图垂直无缝滚动。
- **布局**：Desktop 主内容 + 480px sticky 右栏；Tablet 以下隐藏右栏单列堆叠。
- **关键模块**：主标题渐变文字、功能卡（AI 插画 / AI 绘本 / 创作角色 / 创作组图 / 创作插画 / 布局创作 / 合成绘本）、伪元素装饰图标（右下角 15° 倾斜）。

**Figma Prompt (EN)**
```
Design a desktop landing page for an AI illustration & picture-book creation platform called "KidStory". Two-column layout on ≥1200px screens: left main column contains a gradient-filled h1 title "欢迎使用插画创作平台" with a subtitle below, followed by a responsive feature grid (7 cards, auto-fill minmax 280px). Each card: 12px radius, white semi-transparent background, backdrop-blur, 1px light border, hover lifts by 8px with soft blue glow. Each card shows a centered title, description, and a 15°-rotated translucent icon in the bottom-right corner as background decoration. Right 480px sticky sidebar shows a continuously scrolling 3-column art-style image wall (opacity 0.6, fade on edges), background gets blur+glass look. Mobile collapses sidebar away, shows a single stacked column with tighter padding 16px. Use warm soft gradients (#f6f4fb → #eef1f8) for the page background, purple-to-pink brand gradient on the title, rounded-soft overall. Include a fixed 50px top nav and site footer.
```

---

## 1.2 NotFound · 404

- **定位**：页面不存在的兜底。
- **Figma Prompt**
```
Design a friendly 404 page matching the KidStory brand: centered illustration of a lost cartoon creature holding a broken map, large "404" text with the purple-pink brand gradient, a soft subtitle "页面走丢啦，我们先回家看看吧", and a primary pill button "返回首页" with the brand gradient background. Soft lavender background. Desktop and mobile responsive, content always vertically and horizontally centered.
```

---

## 1.3 NewYear · `/new-year` / NewYearGallery

- **定位**：春节主题活动页，卷轴式生肖/祝福互动。
- **特色**：SVG 噪点滤镜、红灯笼装饰、"福"字艺术字、卷轴滚动展开动画。
- **Figma Prompt**
```
Design a Chinese New Year themed seasonal campaign page. Warm red + gold color palette over a paper-texture background (SVG fractal noise). Two hanging red lantern emojis (🏮) float on left & right edges with gentle sway animation. Large calligraphy "福" characters at top-left & top-right corners (opacity 0.35, rotated). Center shows a horizontal scroll-painting reveal: as the user scrolls down, an illustrated scroll unrolls horizontally showing 12 Chinese zodiac animals, each with a short blessing message beneath. Sticky call-to-action button at bottom "领取我的新年绘本", gold-red gradient pill style. Include a companion gallery page (NewYearGallery) showing a masonry grid of user-submitted holiday illustrations with polaroid-style frames.
```

---

# 二、阅读消费（已按 2026 趋势改过）

## 2.1 OriginalBooks · `/books/`

- **定位**：绘本发现列表，2026 UI 趋势版卡片。
- **功能**：Grid 卡片（auto-fill minmax 236px）、分类下拉筛选、排序（最新/最热/收藏多）、无限滚动加载、去重与空页检测、登录态下可一键收藏。
- **卡片**：`aspect-ratio 4/3` 封面 + 玻璃质感分类 chip + 右上 pulse 爱心 FAB + 2 行标题 ellipsis。
- **Figma Prompt**
```
Design a responsive picture-book discovery list page. Header row: left-aligned h1 "原创绘本", right side has a pill-shaped search bar, a category dropdown chip ("全部 / 故事冒险 / 自然探索 / 迷宫 / 情绪成长 …"), and a sort dropdown ("最新 / 最热 / 收藏最多"). Below, a responsive card grid, auto-fill minmax 236px, 22px card radius on desktop (18px on mobile). Each card:
- 4:3 aspect-ratio cover image with soft-fit behavior; shimmer skeleton while loading.
- Bottom-left floating glassmorphic chip showing the category name, 10px padding, 10px radius, backdrop-blur 10px saturate 160%, text tiny 11px.
- Top-right floating heart FAB 32px circle, semi-transparent white, subtle pulse animation when active; filled red when collected.
- On hover: gradient ring border appears via mask-composite technique; the card lifts 4px with elev-2 shadow.
- Title below cover: 2-line ellipsis, 14px medium, text-primary.
Page background brand-soft gradient; mobile collapses grid to 2 columns, 16px gutter. Include infinite-scroll loading with a spinner at bottom. Respect prefers-reduced-motion by disabling hover transforms.
```

---

## 2.2 OriginalBookdetails · `/books/:bookId`

- **定位**：绘本详情 + 沉浸式阅读器。
- **功能**：左封面右元信息、翻页按钮（圆角矩形，阴影）、收藏动画、目录缩略图抽屉。
- **Figma Prompt**
```
Design a book detail & reader page. Header band shows breadcrumb + share + collect button (purple gradient when active, with a tiny heart-burst animation on click). Left side 40% width: large book cover with soft 16px radius and a 2px gradient border ring; below cover four rounded-rectangle action buttons in a row — 上一页 / 下一页 / 目录 / 全屏 — each 80px wide, 44px tall, brand purple border, hover fills brand, click ripple.

Right side 60% width: book title (24px bold), author row with avatar chip, meta row (category chip, page count, collection count), rich-text description, tag chips. Below description show a page reader: paper-like card with 28px radius, elev-2 shadow, 24px padding. Crossfade transition between pages (opacity only). Include a floating bottom-right circular "TOC" button that opens a 70% bottom-sheet on mobile / right-slide-in panel on desktop showing a 3-column thumbnail grid of all pages with current page highlighted by a purple 2px ring.

Mobile: stack cover above details; reader goes full-width; action buttons become a fixed bottom bar with equal-width rounded-rectangle buttons.
```

---

## 2.3 OriginalIllustration · `/illustration`

- **Figma Prompt**
```
Design a masonry-layout illustration gallery page. Top filter bar: horizontal scrollable chips for style (水彩 / 蜡笔 / 3D / 像素 / 手绘 / 拼贴 …) and color swatches. Below, a 3-column masonry grid on desktop (2 on mobile). Each tile: full-bleed OSS-thumbnailed image with 14px radius; on hover a semi-transparent dark gradient slides up showing title, author avatar, like/collect count. Long-press (mobile) triggers a peek preview with blur backdrop. Infinite scroll with shimmer skeletons. Background soft-lavender gradient. Floating action button bottom-right "+ 上传" with brand gradient.
```

---

## 2.4 OriginalIllusdetails · `/illustration/:illId`

- **Figma Prompt**
```
Design a fullscreen immersive illustration detail page. Black-ish backdrop (#12101a) with subtle noise overlay. The illustration is centered, auto-fits to viewport with 16px padding, 12px radius. Pinch-zoom and double-tap to toggle 1× / 2.5× scale. Left & right arrow buttons overlay (desktop only) to switch between previous/next illustrations in the same collection. Bottom floating glassmorphic bar: author avatar + name, title, tags, and three circular icon buttons (like / collect / download), each with count underneath. Swipe down or click ✕ to close (routes back). Include a small "作者主页" chevron chip next to author that navigates to UserG.
```

---

## 2.5 SearchBooks · `/search-books/`

- **Figma Prompt**
```
Design a mobile-first search results page. Top: sticky rounded search bar with cancel link, shows the current query. Tabs below: 绘本 / 作者. Under each tab a lazy-loaded grid: 2 columns on mobile, 4 on desktop. Empty state shows a friendly illustration + "没有找到相关内容，要不要看看这些？" plus a horizontal suggestion carousel. Before typing, the search page shows history chips (with delete ×) and popular search chips (gradient pills). Keyboard raises with live suggestions dropdown. Brand purple accents.
```

---

# 三、AI 创作

## 3.1 AIpicture · `/ai-picture`

- **定位**：输入 prompt + 选风格 + 生成 AI 插画。
- **功能**：左侧风格网格（19 种风格，带 .webp 预览图）、中央 prompt textarea（含"纯色背景"等前缀自动追加）、右侧参数（尺寸、数量）、底部大图预览结果。
- **Figma Prompt**
```
Design a studio-style AI illustration generation page. Three-column desktop layout:
1. Left 280px — vertical scrollable grid of 19 style cards (2 columns); each card 128×96 with rounded 10px image and label below; selected card gets a 2px purple border + glow.
2. Center — large textarea (240px tall) placeholder "描述你想要的画面… (例如：森林里弹吉他的小狐狸)"; above it a row of quick-prompt suggestion chips; below it a "清空 / 词库" secondary link row. Under textarea: two field groups — size selector (5 aspect-ratio chips 1:1 / 3:4 / 4:3 / 9:16 / 16:9) and count stepper (1-4). Large primary CTA button at the bottom "生成插画" with brand gradient, 48px tall.
3. Right 360px — live result preview panel. Before generation: empty illustrated state "还没有作品哦~". After: 2×2 grid of generated images with click-to-zoom, hover shows action icons (下载 / 重绘 / 保存到创作).
Mobile: collapses to stacked accordion — style picker in a horizontal scroll row, then prompt, then params, then result at bottom.
```

---

## 3.2 AIBooks · `/AIbooks`

- **Figma Prompt**
```
Design an AI storybook generator page. Left 320px wizard panel with 4 stepper sections: 1) 故事主题 / 2) 主角设定 / 3) 风格选择 / 4) 页数设置. Each step a collapsible card with form fields. Right side is a live preview carousel that updates as the user edits — showing a mocked 6-page storybook spread with cover + interior pages, flip animation between pages. Bottom action bar sticky: 保存草稿 / 重新生成 / 发布到我的创作. Use warm cream card background with storybook-like frames (4px double border, dog-ear corner). Mobile: stack wizard on top, preview below, stepper becomes chip tabs.
```

---

## 3.3 CreateCharacter · `/create-character`

- **Figma Prompt**
```
Design a "Create AI Character" page. Hero section at top: large title "创作角色" + subtitle, decorated with floating soft shapes (blob gradients). Form card below, 900px max width, soft shadow, 18px radius. Fields arranged in a 2-column grid:
- 角色名称 (text input)
- 性别 (radio chips: 男孩 / 女孩 / 中性)
- 年龄段 (chip group: 0-3 / 3-6 / 6-12)
- 外貌描述 (multi-line textarea)
- 性格特点 (tag input, comma-separated)
- 绘画风格 (grid of style chips with preview thumbs)
Right side of the form card: live preview placeholder showing a silhouette that "fills in" once generated. Primary CTA "生成角色形象" with loading shimmer during request; once done, show result card with "保存角色 / 重新生成 / 创作组图" button row.
```

---

## 3.4 CreateGroupImages · `/create-group-images` & CharacterGroupImages · `/character-group-images/:id`

- **Figma Prompt**
```
Design a "角色组图生成" page. User picks an existing character (avatar chip carousel at top), then defines up to 10 scene prompts as rows in an editable list. Each row has: 场景序号 / 场景描述 textarea / 动作 tag chips / 小图预览. Below: big brand gradient CTA "批量生成组图". Results render into a responsive grid of 3–5 columns, each image with hover action buttons (重绘 / 保存 / 下载). Include progress bar during batch generation. The companion page (CharacterGroupImages/:id) shows the history of all groups for a specific character, grouped by date with collapsible sections.
```

---

## 3.5 CreateLayoutIllustration · `/create-layout-illustration`

- **定位**：多角色布局编辑器。
- **功能**：页面顶部功能介绍 hero + 中央画布 layout 编辑 + 右侧每个角色属性的 tabs 面板。
- **Figma Prompt**
```
Design a multi-character layout illustration editor page. Top hero strip (160px tall): gradient purple-pink background with a short feature headline "在画布中摆放多个角色，一键生成 AI 插画", a 3-step mini-diagram (角色→布局→生成) in horizontal cards with icons.
Main workspace layout:
- Left 64px vertical toolbar: add character, clear, undo/redo, zoom fit.
- Center: an 800×600 white canvas with dashed-grid background, 20px radius, shadow. User-placed characters appear as draggable boxes, each box shows a cover image inside and a label (名字 + 序号).
- Right 320px: el-tabs with tabs equal to number of placed characters (avatar + name in each tab). Inside active tab: property fields (位置 X/Y sliders, 比例, 动作 select, 表情 select, 描述 textarea).
Bottom sticky bar: "生成布局插画" primary, "保存为模板" ghost, "清空画布" text link.
Mobile: stack hero → canvas → tabs as full-width sections; drag-reorder chips for characters instead of spatial drag.
```

---

## 3.6 PromptFill · `/prompt-fill`

- **Figma Prompt**
```
Design a prompt workshop page with a three-column layout:
1. Left 280px "模板选择" — list of template thumbnails with titles, clicking fills the middle column.
2. Center ~40% "提示词词库" — an accordion of categories (主体 / 风格 / 场景 / 光线 / 镜头 / 色彩 / 情绪), each expands into a wrap of clickable pill chips in different muted colors; clicking a chip appends it to the right column.
3. Right 36% "我的提示词" — the final prompt textarea (auto-growing), with action buttons (复制 / 清空 / 生成插画). Above the textarea show token-style tags for each added phrase, with a × to remove.
Header includes breadcrumb, page title, brief helper text. Brand purple accents. Mobile: stacks the three sections vertically with sticky section headers.
```

---

## 3.7 StyleTransfer · `/user/upload/style-transfer`

- **Figma Prompt**
```
Design a style-transfer tool page. Two stacked cards, each 48% width on desktop, stacked on mobile:
- Left card "原图": drag-drop upload area (dashed 2px border, upload icon + text "点击或拖入图片"). After upload, preview fills the area with a small × to remove.
- Right card "目标风格": grid of 12 style preset thumbs (4 cols), each selectable with active purple ring.
Center vertical divider with an arrow "→" icon. Under the pair: a single primary CTA "开始风格迁移" with gradient, and a progress bar area that morphs into a two-column before/after slider once done. Final result card shows download / save / retry buttons.
Use a clean minimalist background, soft gray.
```

---

## 3.8 MoodDiary · `/mood-diary`

- **定位**：情绪化 AI 图文日记生成。
- **功能**：选心情 icon（dialog）、写日记、选风格（6 张图卡）、生成带软圆角插画+手绘体文字的合成图、保存到我的创作、下载到本地。
- **已有的精细化设计（保留）**：心情选择 dialog 宽 680px 固定、标题后带"清空"小按钮、输入框背景透明心情大图、底部三按钮（生成紫渐变 / 保存胶囊粉紫渐变+❤图标 / 下载白底紫描边+⬇图标）。
- **Figma Prompt**
```
Design a "Mood Diary" page with a soft-diary aesthetic. 880px max-width centered card on a pastel-lavender page background.
Header row: h1 "心情日记" left-aligned, small ghost "清空" button with a tiny trash icon on the right (4px radius, 22px tall, 11px text, gray text until hover becomes red).
Below header: a large textarea (8 rows), placeholder "今天发生了什么？写下你的心情…". Behind the textarea (centered, absolute) show a 160×160px mood emoji image at 60% opacity as a watermark-like background. The textarea itself has a semi-transparent white fill so text stays legible.
Next section "插画风格": a 6-column strip of mini style cards (grid, equal width, 3 cols on mobile), each card is a 72×48 image preview + 10px label; active card has purple ring + glow.
Action row of 3 buttons, equal height 36px, horizontally aligned:
1. "生成心情插画" — primary gradient (brand purple-pink), 14px text, loading spinner inside while generating.
2. "保存心情插画" — capsule pill, pink-to-purple gradient, heart icon on the left; only visible after generation. Hover lifts, saturation increases.
3. "下载到本地" — white pill with purple border + purple text + download icon; hover tinted light purple.
Mobile: three buttons flex: 1 1 0 equal-width.

Generated preview card: 12px radius, off-white bg, 8px padding, shows the composed image (illustration on top with soft blurred rounded corners + text below in handwritten Chinese font "阿里妈妈灵动体", centered, dark purple color). Container has max-height min(70vh, 640px) with custom purple translucent scrollbar for tall images.

Modal "你今天心情怎么样？" on first entry: fixed 680px dialog, 4-column grid of mood options (happy / big-grin / laughing-tears / cool / neutral / worried / sad / frustrated / angry / tired / sick / surprised), each mood cell = 42×42 webp emoji + 11px Chinese label. Click selects mood and closes dialog; selected mood becomes the textarea watermark.
```

---

# 四、编辑创作

## 4.1 Creation · `/creation`

- **Figma Prompt**
```
Design a "我的创作" dashboard. Top: tab row (全部 / 插画 / 绘本 / 草稿). Below: masonry grid of user's own creations, each card shows cover + title + type chip + edit/delete icon buttons on hover. Empty state with friendly mascot illustration and CTA "去创作". Floating "+" FAB bottom-right with gradient, opening a Bottom Sheet with creation entry options (AI 插画 / AI 绘本 / 合成绘本 / 上传).
```

---

## 4.2 Editorpro · `/editorpro`

- **定位**：专业编辑器（类 Canva）。
- **Figma Prompt**
```
Design a professional illustration/book editor IDE-style workspace:
- Top bar (56px): logo, project name editable, undo/redo, export dropdown, share, user avatar.
- Left sidebar (72px icon rail): 图片 / 素材 / 文字 / 背景 / 图层 / 字体 / 画板设置. Click opens a 280px side panel with search + grid of assets.
- Center: dark gray canvas area with a white 4:3 page in the middle, rulers optional, zoom controls bottom-right (percent + fit + 100%).
- Right panel (300px): properties of selected element — position, size, rotate, opacity, blend, color, shadow, border, effects. Each section collapsible.
- Bottom: page thumbnail strip (horizontal scroll), "+" button to add a new page. Active page highlighted with purple 2px ring.
Use VSCode/Figma-style neutral dark-neutral UI chrome, but with KidStory's warmer purple accents on primary actions.
```

---

## 4.3 ComposeIllustration · `/user/upload/compose-illustration`

- **Figma Prompt**
```
Design a "合成绘本" page that lets users drag existing illustrations into an ordered reel to compile a book. Top: book metadata form (title, cover, description). Center: horizontally scrollable page reel — each slot shows the page number + thumbnail + ✕ remove + drag handle. An empty slot at the end prompts "+ 选择插画". Right drawer: picker of user's illustrations grid. Bottom sticky bar: 保存为草稿 / 预览 / 导出 PDF.
```

---

## 4.4 ToPdf · `/.../topdf`

- **Figma Prompt**
```
Design a PDF export progress page. Centered card showing book cover preview, generation progress bar with percentage, estimated time remaining, and a list of pages being stitched (checkmark next to completed). After done: big success illustration + "下载 PDF" primary button + "分享链接" secondary + "返回我的创作" link.
```

---

## 4.5 SaveDraft · `/save-draft`

- **Figma Prompt**
```
Design a draft auto-save confirmation page / drawer. Small modal: success check icon, "草稿已保存", sub-text with auto-save timestamp, two buttons: 继续编辑 (ghost) / 前往我的创作 (primary). Subtle confetti microinteraction on mount.
```

---

# 五、上传管理

> 这组页面共享同一套表单骨架：面包屑 → 大标题 → 卡片化表单（左预览右字段）→ 底部主辅按钮。生成 prompt 时可复用。

## 5.1 Upload · `/user/upload`（上传中心入口）

- **Figma Prompt**
```
Design an "上传中心" hub page. Header with title "上传作品" + subtitle. Below a 6-card grid (3×2 on desktop, 2×3 on tablet, 1×6 on mobile), each card represents an upload type: 上传插画 / 上传绘本 / 上传本地 PDF / 上传素材 / 风格迁移 / 合成绘本. Each card: icon on top (64px), title, short helper text, hover lifts and shows arrow CTA "开始 →". Brand warm gradient on the background, cards are white semi-transparent glass.
```

---

## 5.2 UploadIllustration · UploadLocalBook · UploadLocalPdf · UploadElement

> 结构类似，差异在字段。

**共享 Figma Prompt（模板）**
```
Design an upload form page. Layout: left 40% column for drag-drop file area (480px tall, dashed 2px border, upload icon + "拖入或点击上传"), after file chosen shows preview with file meta (name, size, dimensions) and a "重新选择" ghost button. Right 60% column is the metadata form card:
- 标题 (input)
- 描述 (textarea, 4 rows)
- 分类 (select chips — for 绘本 include 故事冒险/自然探索/迷宫/情绪成长/历史人文/艺术美育; for 插画 include maze 等扩展分类; for element: 贴纸/背景/边框…)
- 标签 (tag input)
- 可见性 (radio: 公开 / 仅自己)
- 是否可商用 (switch)
Bottom of form card: primary "提交" gradient button + "保存草稿" ghost button.
Mobile stacks vertically; upload area becomes full-width, 260px tall.
```

**页面差异**
- **UploadIllustration**：增加"AI 生成"/"本地上传"两种来源切换 radio，分类含 `maze` 选项。
- **UploadLocalBook**：批量多页上传，预览区变成可拖拽排序的页面缩略图网格。
- **UploadLocalPdf**：仅允许 .pdf，显示 PDF 页数预估。
- **UploadElement**：分类是 `sticker/background/frame/icon`，预览带棋盘格透明底。

---

## 5.3 SubmitRes / EditionRes · 提交成功页

- **Figma Prompt**
```
Design a post-submit confirmation page. Centered column, soft confetti fall animation, large success illustration (checkmark inside a purple gradient circle), h2 "提交成功！", subtitle with rules "我们会在 24 小时内审核…". Three button row: 继续上传 (ghost) / 查看我的作品 (secondary) / 返回首页 (primary gradient). Small "分享到朋友圈" inline link below.
```

---

## 5.4 EditionIll / EditionBook · 编辑插画 / 编辑绘本

- **Figma Prompt**
```
Design an edit-illustration / edit-book page identical in skeleton to the upload page, but pre-populated: the left preview shows the existing media (illustrations as single image, books as draggable page reel). Form fields on the right are pre-filled with current metadata. Action bar: 保存修改 (primary) / 取消 (ghost) / 删除 (red text link at far left). Delete confirmation uses a red destructive modal with typed confirmation.
```

---

# 六、用户中心

## 6.1 MyHomePage · `/user`（我的主页）

- **Figma Prompt**
```
Design a user home page. Hero profile band (180px tall, brand soft gradient): large circular avatar with gradient ring, name + handle, 3 stat chips (绘本数 / 插画数 / 粉丝数), action buttons (编辑资料 / 分享主页 / 会员开通). Tab row below: 全部作品 / 绘本 / 插画 / 收藏 / 草稿. Content area shows a responsive masonry grid of the user's items. Side (desktop only) or bottom-sheet (mobile): upload quick actions, mini calendar of creation activity (heat-map). Floating purple "+" FAB bottom-right.
```

---

## 6.2 UserProfile · `/user/profile`（编辑资料）

- **Figma Prompt**
```
Design an edit-profile page. Centered 640px card, soft shadow, 18px radius. Top: avatar uploader (circular drop zone, click to change). Below: stacked fields (昵称 / 简介 textarea 3 rows / 性别 radio / 生日 date picker / 所在地 input / 个人网站 input). Password change section expandable. Bottom: 保存 (primary gradient) / 取消 (ghost). Success toast on save.
```

---

## 6.3 UserG · `/user/:id`（他人主页）

- **Figma Prompt**
```
Design an author/other-user public profile page. Similar to MyHomePage but with 关注 / 已关注 toggle button prominent in the hero; stats (关注 / 粉丝 / 作品); show only public 绘本作品 and 插画作品 tabs. Card items open reader/detail views. Report icon in the top-right overflow menu.
```

---

## 6.4 MyBookDetails / MyCoBookDetails / MyIllusDetails

- **Figma Prompt**
```
Design an "我的作品详情" page. Same skeleton as OriginalBookdetails/OriginalIllusdetails but with author-only actions in the header: 编辑 / 下架 / 统计数据. Below preview area show a stats panel: views / likes / collects over time (simple sparkline), recent comments list. "我的收藏详情 (MyCoBookDetails)" variant replaces editor actions with "取消收藏" + "添加到书架" + "分享".
```

---

## 6.5 ForgotPassword · `/forgot-password`

- **Figma Prompt**
```
Design a forgot-password page. Centered 400px card, clean white bg, 18px radius. Steps stepper (1 输入手机号 → 2 验证码 → 3 设置新密码). Inputs styled consistent with login: floating-label, 40px height, brand focus ring. Primary button gradient. Secondary link "回到登录" below.
```

---

## 6.6 MemberRecharge / MemberRechargeSuccess

- **Figma Prompt**
```
Design a membership purchase page. Hero band with tagline "解锁无限创作力" and mascot. Plan selection grid (3 cards: 月度 / 季度 / 年度), each card shows price, original price strikethrough, save-% tag, feature checklist (6 items), "立即开通" CTA. Center card scaled up with "最受欢迎" ribbon. Below: payment method chips (微信 / 支付宝). Order summary sticky bar bottom on mobile, right column on desktop. "续费 / 兑换码" secondary entries.

Success page: centered card, big animated checkmark, plan name + expiry date, confetti burst, two buttons: 查看权益 / 返回首页.
```

---

## 6.7 WeChatCallback · `/wechat/callback`

- **Figma Prompt**
```
Design a silent redirect loading screen for WeChat OAuth callback. Centered: KidStory logo, a soft progress indicator (brand gradient ring animation), sub-text "正在为你登录…". Fallback error state with "登录失败，重试 / 返回登录" buttons if the server returns no code.
```

---

# 七、其它

## 7.1 Connection · `/connection`

- **Figma Prompt**
```
Design a "联系我们" page. Left column: large QR code of WeChat official account, title "关注公众号", tagline "投稿儿童故事 | 阅读原创绘本 | 获取育儿干货". Right column: title "您还可以在这些网站寻找灵感", a 4-col grid of partner logos as tappable cards (link-out arrow on hover). Below: a small legal statement paragraph. Warm ivory background, soft dashed divider.
```

---

## 7.2 UtilityTools · `/utility-tools`

- **Figma Prompt**
```
Design a utility tools page (e.g., 画风迁移 / 背景抠图 / 智能裁剪 / 画质增强). Hero title + description at top. Body: a two-image comparison workspace — left card "原图" (upload area or preview), right card "处理结果"; a central gradient arrow connector. Below the pair: tool tab strip to switch modes. Each mode shows its own parameter panel (e.g., target style grid, crop ratio chips, enhancement strength slider). Primary action button pinned bottom. Loading state replaces result card with a progress ring + step label. Download / retry buttons after done.
```

---

## 7.3 Maze · `/maze`

- **定位**：迷宫游戏中心。
- **功能**：tab 切"基础迷宫 / 创意迷宫"，基础=算法生成 100 个不同形状、创意=后端 book 图片迷宫（瀑布流分组），进入玩法支持 pointer 划线 + 穿墙检测 + 左右滑动翻页（创意迷宫）。
- **Figma Prompt**
```
Design a maze game hub & play page.
Hub view:
- Top tabs: 基础迷宫 / 创意迷宫.
- 基础迷宫 tab shows a 4-column responsive grid of 100 maze cards. Each card: 1:1 aspect-ratio thumbnail (actual rendered mini maze preview with purple walls), below title "迷宫 #N" and difficulty chip (easy/medium/hard) color-coded.
- 创意迷宫 tab shows grouped sections per book — each section has a small cover + title + author, followed by a 4-col image grid (miniature maze images with shimmer skeleton while loading thumbnails). Infinite scroll to load more book groups.
Play view (entered from a card):
- Fullscreen soft lavender canvas. Maze sits centered, 16px radius + elev-2. On top of the maze a transparent draw canvas captures finger / mouse lines; walls detected via black-pixel collision cause the line to shake + break.
- Top-left "← 返回" glass button; top-right "撤销 / 清除 / 难度信息" action chips.
- For image-based creative mazes: left & right floating arrow buttons to page through the book's pages, plus swipe gestures. Show "3 / 12" page indicator.
- Bottom CTA "我走出来了 🎉" celebratory dialog when endpoint reached.
```

---

# 八、通用建议

1. **一致性**：所有页面复用上面的 Design System Tokens，不要出现新色值或新圆角尺寸。
2. **空态 / 错误 / 加载**：每个列表/详情页都补 3 种边界状态稿（Empty / Loading / Error），用同一套吉祥物/插图系列。
3. **响应式变体**：至少交付 `Desktop 1440` 和 `Mobile 390` 两份变体；复杂页面额外出 `Tablet 820`。
4. **Dark Mode**：品牌定位偏暖柔，不建议做全黑深色模式。可出 **Night Reading Mode** 变体：仅阅读器/详情页，背景 `#1e1a2b`、文字 `#f0ecff`、卡片 `#2a2340`、保留紫色 accent。
5. **无障碍**：最小字号 12px、按钮最小点击区 32×32、颜色对比度 ≥ 4.5:1；所有装饰性动画遵从 `prefers-reduced-motion`。
6. **命名规范**：Figma Frame 命名 `Page / {分组} / {页面名} · Desktop` 或 `· Mobile`；Component 命名 `Comp / {类别} / {名称}`。

---

> 本文档生成自 `src/views/*.vue` 页面清单 + 项目已有视觉语言。若有新增页面，按相同 Prompt 模板追加即可。
