<template>
  <div class="home">
    <Layout>
      <!-- 头部区域 -->
      <Top v-if="state.show" :ruler="state.ruler" @update:ruler="rulerSwitch"></Top>
      <Content style="display: flex; height: calc(100vh - 64px); position: relative">
        <!-- 左侧区域 -->
        <Left v-if="state.show"></Left>
        <!-- 画布区域 -->
        <div id="workspace">
          <div class="canvas-box">
            <div class="inside-shadow"></div>
            <canvas id="canvas" :class="state.ruler ? 'design-stage-grid' : ''"></canvas>
            <dragMode v-if="state.show"></dragMode>
            <zoom></zoom>
          </div>
        </div>
        <Right v-if="state.show"></Right>
      </Content>
    </Layout>
  </div>
</template>

<script name="Home" setup>
import { reactive, onMounted, onUnmounted, provide } from 'vue';
import Top from '@/components/editorPro/top/index.vue';
import Left from '@/components/editorPro/left/index.vue';
import Right from '@/components/editorPro/right/index.vue';

import zoom from '@/components/editorPro/editor-components/zoom.vue';
import dragMode from '@/components/editorPro/editor-components/dragMode.vue';
// 功能组件
import { fabric } from 'fabric';
// 本地 kuaitu 核心（替代 npm 包 @kuaitu/core）
import Editor, {
  DringPlugin,
  PolygonModifyPlugin,
  AlignGuidLinePlugin,
  ControlsPlugin,
  CenterAlignPlugin,
  LayerPlugin,
  CopyPlugin,
  MoveHotKeyPlugin,
  DeleteHotKeyPlugin,
  GroupPlugin,
  DrawLinePlugin,
  GroupTextEditorPlugin,
  GroupAlignPlugin,
  WorkspacePlugin,
  HistoryPlugin,
  FlipPlugin,
  RulerPlugin,
  DrawPolygonPlugin,
  FreeDrawPlugin,
  PathTextPlugin,
  SimpleClipImagePlugin,
  BarCodePlugin,
  QrCodePlugin,
  FontPlugin,
  MaterialPlugin,
  WaterMarkPlugin,
  PsdPlugin,
  ImageStroke,
  ResizePlugin,
  LockPlugin,
  AddBaseTypePlugin,
  MaskPlugin,
} from '@/kuaitu-core/core';

import localFonts from '@/assets/editorpro/fonts/font.js';

const state = reactive({
  show: false,
  select: null,
  ruler: true,
});

let canvas = null;
const canvasEditor = new Editor();


onMounted(() => {
  // 初始化fabric
  canvas = new fabric.Canvas('canvas', {
    fireRightClick: true, // 启用右键，button的数字为3
    stopContextMenu: true, // 禁止默认右键菜单
    controlsAboveOverlay: true, // 超出clipPath后仍然展示控制条
    // imageSmoothingEnabled: false, // 解决文字导出后不清晰问题
    preserveObjectStacking: true, // 当选择画布中的对象时，让对象不在顶层。
  });

  // 初始化编辑器（基于本地 kuaitu-core）
  canvasEditor
    .init(canvas)
    .use(DringPlugin)
    .use(PolygonModifyPlugin)
    .use(AlignGuidLinePlugin)
    .use(ControlsPlugin)
    .use(CenterAlignPlugin)
    .use(LayerPlugin)
    .use(CopyPlugin)
    .use(MoveHotKeyPlugin)
    .use(DeleteHotKeyPlugin)
    .use(GroupPlugin)
    .use(DrawLinePlugin)
    .use(GroupTextEditorPlugin)
    .use(GroupAlignPlugin)
    .use(WorkspacePlugin)
    .use(HistoryPlugin)
    .use(FlipPlugin)
    .use(RulerPlugin)
    .use(DrawPolygonPlugin)
    .use(FreeDrawPlugin)
    .use(PathTextPlugin)
    .use(SimpleClipImagePlugin)
    .use(BarCodePlugin)
    .use(QrCodePlugin)
    .use(FontPlugin, {
      // 这里的 repoSrc 可以按需接入你的后端地址
      repoSrc: process.env.VUE_APP_APP_APIHOST || process.env.VUE_APP_API_BASE_URL || '',
      // 本地字体回退（当后端不可用/返回空列表时）
      localFonts,
    })
    .use(MaterialPlugin, {
      repoSrc: process.env.VUE_APP_APP_APIHOST || process.env.VUE_APP_API_BASE_URL || '',
    })
    .use(WaterMarkPlugin)
    .use(PsdPlugin)
    .use(ImageStroke)
    .use(ResizePlugin)
    .use(LockPlugin)
    .use(AddBaseTypePlugin)
    .use(MaskPlugin);

  // 默认打开标尺
  if (state.ruler && canvasEditor.rulerEnable) {
    canvasEditor.rulerEnable();
  }

  state.show = true;
});

onUnmounted(() => {
  if (canvas) {
    canvas.dispose();
  }
});
const rulerSwitch = (val) => {
  state.ruler = val;
  if (canvasEditor) {
    if (val && canvasEditor.rulerEnable) {
      canvasEditor.rulerEnable();
    } else if (!val && canvasEditor.rulerDisable) {
      canvasEditor.rulerDisable();
    }
  }
  // 使标尺开关组件失焦，避免响应键盘的空格事件
  document.activeElement.blur();
};

provide('fabric', fabric);
provide('canvasEditor', canvasEditor);
</script>

<style scoped>
.editorpro-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 52px);
  background: #f1f1f1;
}

.editorpro-header {
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #303133;
  display: flex;
  align-items: center;
}

.editorpro-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.editorpro-left {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.editorpro-right {
  width: 300px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.editorpro-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
}

.canvas-wrapper {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 16px;
  border-radius: 8px;
}

.editorpro-canvas {
  width: 900px;
  height: 600px;
  display: block;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.panel-placeholder {
  flex: 1;
  font-size: 12px;
  color: #909399;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  padding: 10px;
  line-height: 1.5;
}

.container {
  width: 50%;
  margin: 20px;
}

/* 属性面板等注释样式已省略，按需可再加 */

:deep(.ivu-menu-vertical .menu-item) {
  text-align: center;
  padding: 10px 2px;
  box-sizing: border-box;
  font-size: 12px;
}
:deep(.ivu-menu-vertical .menu-item > i) {
  margin: 0;
}

:deep(.ivu-layout-header) {
  --height: 45px;
  padding: 0 10px;
  border-bottom: 1px solid #eef2f8;
  background: #fff;
  height: var(--height);
  line-height: var(--height);
}

:deep(.home),
:deep(.ivu-layout) {
  height: 100vh;
}

.icon {
  display: block;
}

.canvas-box {
  position: relative;
}

.inside-shadow {
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: inset 0 0 9px 2px #0000001f;
  z-index: 2;
  pointer-events: none;
}

#workspace {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.content) {
  flex: 1;
  width: 220px;
  padding: 10px;
  padding-top: 0;
  height: 100%;
  overflow-y: auto;
}

:deep(.ivu-menu-light.ivu-menu-vertical .ivu-menu-item-active:not(.ivu-menu-submenu)) {
  background: none;
}

.switch {
  margin-right: 10px;
}

.design-stage-point {
  --offsetX: 0px;
  --offsetY: 0px;
  --size: 20px;
  background-size: var(--size) var(--size);
  background-image: radial-gradient(circle, #2f3542 1px, rgba(0, 0, 0, 0) 1px);
  background-position: var(--offsetX) var(--offsetY);
}

.design-stage-grid {
  --offsetX: 0px;
  --offsetY: 0px;
  --size: 16px;
  --color: #dedcdc;
  background-image: linear-gradient(
      45deg,
      var(--color) 25%,
      transparent 0,
      transparent 75%,
      var(--color) 0
    ),
    linear-gradient(45deg, var(--color) 25%, transparent 0, transparent 75%, var(--color) 0);
  background-position: var(--offsetX) var(--offsetY),
    calc(var(--size) + var(--offsetX)) calc(var(--size) + var(--offsetY));
  background-size: calc(var(--size) * 2) calc(var(--size) * 2);
}

.coordinates-bar {
  --ruler-size: 16px;
  --ruler-c: #808080;
  --rule4-bg-c: #252525;
  --ruler-bdw: 1px;
  --ruler-h: 8px;
  --ruler-space: 5px;
  --ruler-tall-h: 16px;
  --ruler-tall-space: 15px;
  position: absolute;
  z-index: 2;
  background-color: var(--rule4-bg-c);
}

.coordinates-bar-top {
  cursor: row-resize;
  top: 0;
  left: 0;
  height: var(--ruler-size);
  width: 100%;
  background-image: linear-gradient(90deg, var(--ruler-c) 0 var(--ruler-bdw), transparent 0),
    linear-gradient(90deg, var(--ruler-c) 0 var(--ruler-bdw), transparent 0);
  background-repeat: repeat-x;
  background-size: var(--ruler-space) var(--ruler-h), var(--ruler-tall-space) var(--ruler-tall-h);
  background-position: bottom;
}

.coordinates-bar-left {
  cursor: col-resize;
  top: var(--ruler-size);
  width: var(--ruler-size);
  height: 100%;
  left: 0;
  background-image: linear-gradient(0deg, var(--ruler-c) 0 var(--ruler-bdw), transparent 0),
    linear-gradient(0deg, var(--ruler-c) 0 var(--ruler-bdw), transparent 0);
  background-repeat: repeat-y;
  background-size: var(--ruler-h) var(--ruler-space), var(--ruler-tall-h) var(--ruler-tall-space);
  background-position: right;
}
</style>


