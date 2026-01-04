# 图标替换指南

## 图标来源

当前 Home.vue 中的图标使用 SVG 格式，通过 data URI 内联在 CSS 中。

## 推荐的图标网站

### 1. Iconify（最推荐）
- 网址：https://iconify.design/
- 特点：包含 200,000+ 图标，支持多种图标库
- 使用方法：
  1. 搜索图标（如 "picture", "book", "user"）
  2. 点击图标
  3. 选择 "SVG" 标签
  4. 复制 SVG 代码

### 2. Heroicons
- 网址：https://heroicons.com/
- 特点：简洁现代的图标
- 使用方法：直接复制 SVG 代码

### 3. Feather Icons
- 网址：https://feathericons.com/
- 特点：简洁的线性图标
- 使用方法：直接复制 SVG 代码

### 4. Material Icons
- 网址：https://fonts.google.com/icons
- 特点：Google 的图标库
- 使用方法：下载 SVG 文件

## 替换步骤

### 步骤 1：获取 SVG 代码

从上述网站获取 SVG 代码，例如从 Iconify 获取：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
</svg>
```

### 步骤 2：修改 SVG 颜色

将 SVG 中的颜色改为 `#409eff`（Element UI 的主题色），或者使用 `fill="%23409eff"`（URL 编码后的 #409eff）。

例如，将 `fill="currentColor"` 或 `fill="black"` 改为 `fill="%23409eff"`。

### 步骤 3：转换为 data URI

使用在线工具或手动转换：

**在线工具：**
- https://yoksel.github.io/url-encoder/
- 或者使用 JavaScript：

```javascript
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23409eff" d="..."/></svg>';
const encoded = encodeURIComponent(svg);
const dataUri = `data:image/svg+xml,${encoded}`;
```

**手动转换：**
1. 将 SVG 代码中的特殊字符进行 URL 编码：
   - `<` → `%3C`
   - `>` → `%3E`
   - `"` → `%22`
   - `#` → `%23`
   - 空格 → `%20`

2. 格式：`data:image/svg+xml,编码后的SVG代码`

### 步骤 4：替换到代码中

在 `Home.vue` 中找到对应的样式，例如：

```css
.feature-card.icon-card-brush :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,你的编码后的SVG代码");
}
```

## 示例：替换 AI插画 图标

### 原始 SVG（从 Iconify 获取）
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  <circle cx="8.5" cy="8.5" r="1.5"/>
  <polyline points="21 15 16 10 5 21"/>
</svg>
```

### 修改颜色后的 SVG
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23409eff">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="%23409eff"/>
  <circle cx="8.5" cy="8.5" r="1.5" fill="%23409eff"/>
  <polyline points="21 15 16 10 5 21" fill="%23409eff"/>
</svg>
```

### 转换为 data URI
```
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23409eff'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2' fill='%23409eff'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5' fill='%23409eff'/%3E%3Cpolyline points='21 15 16 10 5 21' fill='%23409eff'/%3E%3C/svg%3E
```

### 替换到代码
```css
.feature-card.icon-card-brush :deep(.el-card__body)::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23409eff'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2' fill='%23409eff'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5' fill='%23409eff'/%3E%3Cpolyline points='21 15 16 10 5 21' fill='%23409eff'/%3E%3C/svg%3E");
}
```

## 快速替换工具

### 使用 Node.js 脚本（可选）

创建一个 `encode-svg.js` 文件：

```javascript
const fs = require('fs');
const svg = fs.readFileSync('icon.svg', 'utf8');
const encoded = encodeURIComponent(svg);
console.log(`data:image/svg+xml,${encoded}`);
```

运行：`node encode-svg.js`

## 注意事项

1. **颜色编码**：确保 `#409eff` 被编码为 `%23409eff`
2. **viewBox**：保持 SVG 的 viewBox 属性，确保图标正确缩放
3. **透明度**：当前图标透明度为 0.1，在 CSS 中通过 `opacity: 0.1` 设置
4. **大小**：图标大小在 CSS 中设置为 `width: 100px; height: 100px;`

## 当前使用的图标位置

在 `Home.vue` 文件中，图标样式位于：

- `.feature-card.icon-card-brush` - AI插画
- `.feature-card.icon-card-book` - AI绘本
- `.feature-card.icon-card-user` - 创作角色
- `.feature-card.icon-card-images` - 创作组图
- `.feature-card.icon-card-edit` - 创作插画
- `.feature-card.icon-card-layout` - 布局创作插画
- `.feature-card.icon-card-compose` - 合成绘本

