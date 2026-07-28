# 图片优化说明

## 已完成的优化

### 1. 图片压缩
- ✅ 所有 PNG 图片已从 **86MB** 压缩到 **9.9MB**（压缩率约 **88.5%**）
- ✅ 图片尺寸从 2730x1535 调整为最大 800px（保持宽高比）
- ✅ 使用 macOS `sips` 工具进行压缩

### 2. 懒加载
- ✅ 已启用 `el-image` 组件的 `:lazy="true"` 属性
- ✅ 图片仅在进入视口时加载，减少初始加载时间

### 3. WebP 支持
- ✅ 已创建 WebP 检测工具 (`src/utils/imageOptimizer.js`)
- ✅ 代码已支持 WebP 格式（需要生成 WebP 文件）

## 插画风格预览图

风格预览图已迁移至 CDN，由后端 API 管理：

- 公开列表：`GET /api/illustration-styles/`
- 图片地址：`https://static.kidstory.cc/prompt/{id}.webp`
- 管理上传：站内 `/user/upload/style-prompt`（管理员）

本地不再保留 `src/assets/prompt/` 静态文件。

## 生成 WebP 格式（其他 PNG 资源，可选）

| 项目 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 总大小 | 86MB | 9.9MB | ↓ 88.5% |
| 单张图片（示例） | 5.9MB | 633KB | ↓ 89.3% |
| 加载方式 | 立即加载 | 懒加载 | 按需加载 |
| 格式支持 | PNG | PNG + WebP | 自动选择 |

## 浏览器兼容性

- **PNG**: 所有现代浏览器支持
- **WebP**: Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
- 不支持 WebP 的浏览器会自动回退到 PNG

## 注意事项

1. WebP 文件需要手动生成（运行脚本或手动转换）
2. 如果未生成 WebP 文件，系统会自动使用压缩后的 PNG
3. 压缩后的图片质量已优化，适合网页显示

