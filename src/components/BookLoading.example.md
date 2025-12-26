# BookLoading 组件使用说明

## 功能特点

- ✨ 基于 SVG 描边动画，模拟"魔法画笔勾勒绘本"的过程
- 🎨 柔和的圆角线条，适合儿童和创意类网站
- 📦 轻量级（< 2KB），纯 CSS 动画，性能优秀
- 🎯 可自定义文本和全屏模式
- 📱 响应式设计，支持移动端

## 使用方法

### 基础用法

```vue
<template>
  <div>
    <!-- 内联加载 -->
    <book-loading />
    
    <!-- 带文本的加载 -->
    <book-loading text="正在加载绘本..." />
    
    <!-- 全屏加载 -->
    <book-loading fullscreen text="正在加载..." />
  </div>
</template>

<script>
import BookLoading from '@/components/BookLoading.vue'

export default {
  components: {
    BookLoading
  }
}
</script>
```

### 条件渲染

```vue
<template>
  <div>
    <div v-if="loading">
      <book-loading :text="$t('books.loading')" />
    </div>
    <div v-else>
      <!-- 内容 -->
    </div>
  </div>
</template>
```

### 替换 Element Plus Loading

```vue
<!-- 原来的方式 -->
<el-button :loading="loading">提交</el-button>

<!-- 使用 BookLoading -->
<el-button>
  <book-loading v-if="loading" />
  <span v-else>提交</span>
</el-button>
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| fullscreen | 是否全屏显示 | Boolean | false |
| text | 加载文本提示 | String | '' |

## 动画说明

动画按以下顺序绘制：
1. **左侧页面** (0s) - 书本左侧轮廓
2. **右侧页面** (0.6s) - 书本右侧轮廓
3. **中心装订线** (1.2s) - 书本中心线
4. **左侧文字** (1.6s) - 左侧页面文字线条
5. **右侧文字** (1.8s) - 右侧页面文字线条
6. **装饰星星** (2.2s) - 顶部装饰元素

整个动画循环播放，营造出"魔法画笔正在勾勒绘本"的视觉效果。
