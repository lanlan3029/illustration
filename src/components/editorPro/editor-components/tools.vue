<template>
  <div>
    <Divider plain orientation="left">{{ $t('common_elements') }}</Divider>
    <div class="tool-box">
      <span @click="() => addText()" :draggable="true" @dragend="addText">
        <img :src="textIcon" width="26" height="26" />
      </span>
      <span @click="() => addTextBox()" :draggable="true" @dragend="addTextBox">
        <img :src="textBoxIcon" width="26" height="26" />
      </span>
      <span @click="() => addRect()" :draggable="true" @dragend="addRect">
        <img :src="rectIcon" width="26" height="26" />
      </span>
      <span @click="() => addCircle()" :draggable="true" @dragend="addCircle">
        <img :src="circleIcon" width="26" height="26" />
      </span>
      <span @click="() => addTriangle()" :draggable="true" @dragend="addTriangle">
        <img :src="triangleIcon" width="26" height="26" />
      </span>
      <!-- 多边形按钮 -->
      <span @click="() => addPolygon()" :draggable="true" @dragend="addPolygon">
        <img :src="polygonIcon" width="26" height="26" />
      </span>
    </div>
    <Divider plain orientation="left">{{ $t('draw_elements') }}</Divider>
    <div class="tool-box">
      <span
        @click="drawingLineModeSwitch('line')"
        :class="state.isDrawingLineMode && state.lineType === 'line' && 'bg'"
      >
        <img :src="draw1Icon" width="20" height="20" />
      </span>
      <span
        @click="drawingLineModeSwitch('arrow')"
        :class="state.isDrawingLineMode && state.lineType === 'arrow' && 'bg'"
      >
        <img :src="draw2Icon" width="20" height="20" />
      </span>
      <span
        @click="drawingLineModeSwitch('thinTailArrow')"
        :class="state.isDrawingLineMode && state.lineType === 'thinTailArrow' && 'bg'"
      >
        <img :src="draw3Icon" width="20" height="20" />
      </span>
      <span
        @click="drawPolygon"
        :class="state.isDrawingLineMode && state.lineType === 'polygon' && 'bg'"
      >
        <img :src="draw4Icon" width="20" height="20" />
      </span>
      <!-- 隐藏功能入口（路径文本） -->
      <!-- <span
        @click="drawPathText"
        :class="state.isDrawingLineMode && state.lineType === 'pathText' && 'bg'"
      >
        <Icon type="logo-tumblr" :size="22" />
      </span> -->
      <span
        @click="freeDraw"
        :class="state.isDrawingLineMode && state.lineType === 'freeDraw' && 'bg'"
      >
        <Icon type="md-brush" :size="22" />
      </span>
    </div>
  </div>
</template>

<script setup name="Tools">
import { inject, reactive, onDeactivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { getPolygonVertices } from '@/components/editorPro/utils/math.js';
import useSelect from '@/components/editorPro/hooks/select.js';

import circleIcon from '@/assets/editorpro/icon/layer/circle.svg';
import draw1Icon from '@/assets/editorpro/icon/tools/draw1.svg';
import draw2Icon from '@/assets/editorpro/icon/tools/draw2.svg';
import draw3Icon from '@/assets/editorpro/icon/tools/draw3.svg';
import draw4Icon from '@/assets/editorpro/icon/tools/draw4.svg';
import polygonIcon from '@/assets/editorpro/icon/tools/polygon.svg';
import rectIcon from '@/assets/editorpro/icon/tools/rect.svg';
import textIcon from '@/assets/editorpro/icon/tools/text.svg';
import textBoxIcon from '@/assets/editorpro/icon/tools/textBox.svg';
import triangleIcon from '@/assets/editorpro/icon/tools/triangle.svg';

const { t } = useI18n();
const fabric = inject('fabric');
// 优先从 useSelect 获取 canvasEditor，兜底再从 provide 注入中获取
const { canvasEditor: selectEditor } = useSelect() || {};
const canvasEditor = selectEditor || inject('canvasEditor', null);

const LINE_TYPE = {
  polygon: 'polygon',
  freeDraw: 'freeDraw',
  pathText: 'pathText',
};

// 默认属性
const defaultPosition = { shadow: '', fontFamily: 'arial' };

// 绘制状态
const state = reactive({
  isDrawingLineMode: false,
  lineType: '',
});

const addToCanvas = (obj, event) => {
  if (!fabric || !obj) return;
  // 优先走 kuaitu-core 的 AddBaseTypePlugin，保持与源项目一致（支持 center / 拖拽落点 / 历史记录等）
  if (canvasEditor && typeof canvasEditor.addBaseType === 'function') {
    canvasEditor.addBaseType(obj, {
      event,
      scale: false,
      center: true,
    });
    // 确保新元素被选中，从而触发右侧属性面板
    if (canvasEditor.canvas) {
      canvasEditor.canvas.setActiveObject(obj);
      canvasEditor.canvas.requestRenderAll();
    }
    return;
  }
  // 兜底：直接用 kuaitu 编辑器内部的 canvas 操作
  const fallbackCanvas = canvasEditor && canvasEditor.canvas;
  if (!fallbackCanvas) return;
  if (event && event.clientX != null) {
    const rect = fallbackCanvas.upperCanvasEl.getBoundingClientRect();
    obj.left = event.clientX - rect.left - (obj.width || 0) / 2;
    obj.top = event.clientY - rect.top - (obj.height || 0) / 2;
  } else {
    fallbackCanvas.centerObject(obj);
  }
  fallbackCanvas.add(obj);
  fallbackCanvas.setActiveObject(obj);
  fallbackCanvas.requestRenderAll();
};

const cancelDraw = () => {
  if (!state.isDrawingLineMode || !canvasEditor) return;
  state.isDrawingLineMode = false;
  state.lineType = '';
  canvasEditor.setMode && canvasEditor.setMode(false);
  endConflictTools();
  ensureObjectSelEvStatus(true, true);
};

const addText = (event) => {
  cancelDraw();
  const text = new fabric.IText(t('everything_is_fine'), {
    ...defaultPosition,
    fontSize: 80,
    fill: '#000000FF',
    name: '文本',
  });
  addToCanvas(text, event);
};

const addTextBox = (event) => {
  cancelDraw();
  const text = new fabric.Textbox(t('everything_goes_well'), {
    ...defaultPosition,
    splitByGrapheme: true,
    width: 400,
    fontSize: 80,
    fill: '#000000FF',
    name: '文本框',
  });
  addToCanvas(text, event);
};

const addTriangle = (event) => {
  cancelDraw();
  const triangle = new fabric.Triangle({
    ...defaultPosition,
    width: 400,
    height: 400,
    fill: '#92706BFF',
    name: '三角形',
  });
  addToCanvas(triangle, event);
};

const addPolygon = (event) => {
  cancelDraw();
  const polygon = new fabric.Polygon(getPolygonVertices(5, 200), {
    ...defaultPosition,
    fill: '#CCCCCCFF',
    name: '多边形',
  });
  polygon.set({
    width: 400,
    height: 400,
    pathOffset: { x: 0, y: 0 },
  });
  addToCanvas(polygon, event);
};

const addCircle = (event) => {
  cancelDraw();
  const circle = new fabric.Circle({
    ...defaultPosition,
    radius: 150,
    fill: '#57606BFF',
    name: '圆形',
  });
  addToCanvas(circle, event);
};

const addRect = (event) => {
  cancelDraw();
  const rect = new fabric.Rect({
    ...defaultPosition,
    fill: '#F57274FF',
    width: 400,
    height: 400,
    name: '矩形',
  });
  addToCanvas(rect, event);
};

// 多边形绘制模式
const drawPolygon = () => {
  if (!canvasEditor) return;
  const onEnd = () => {
    state.lineType = '';
    state.isDrawingLineMode = false;
    ensureObjectSelEvStatus(true, true);
  };
  if (state.lineType !== LINE_TYPE.polygon) {
    endConflictTools();
    endDrawingLineMode();
    state.lineType = LINE_TYPE.polygon;
    state.isDrawingLineMode = true;
    canvasEditor.beginDrawPolygon && canvasEditor.beginDrawPolygon(onEnd);
    canvasEditor.endDraw && canvasEditor.endDraw();
    ensureObjectSelEvStatus(false, false);
  } else {
    canvasEditor.discardPolygon && canvasEditor.discardPolygon();
  }
};

// 路径文字（入口暂时隐藏，逻辑保留）
const drawPathText = () => {
  if (!canvasEditor) return;
  if (state.lineType === LINE_TYPE.pathText) {
    state.lineType = '';
    state.isDrawingLineMode = false;
    canvasEditor.endTextPathDraw && canvasEditor.endTextPathDraw();
  } else {
    endConflictTools();
    endDrawingLineMode();
    state.lineType = LINE_TYPE.pathText;
    state.isDrawingLineMode = true;
    canvasEditor.startTextPathDraw && canvasEditor.startTextPathDraw();
  }
};

// 自由绘制
const freeDraw = () => {
  if (!canvasEditor) return;
  if (state.lineType === LINE_TYPE.freeDraw) {
    canvasEditor.endDraw && canvasEditor.endDraw();
    state.lineType = '';
    state.isDrawingLineMode = false;
    ensureObjectSelEvStatus(true, true);
  } else {
    endConflictTools();
    endDrawingLineMode();
    state.lineType = LINE_TYPE.freeDraw;
    state.isDrawingLineMode = true;
    canvasEditor.startDraw && canvasEditor.startDraw({ width: 20 });
    ensureObjectSelEvStatus(false, false);
  }
};

const endConflictTools = () => {
  if (!canvasEditor) return;
  canvasEditor.discardPolygon && canvasEditor.discardPolygon();
  canvasEditor.endDraw && canvasEditor.endDraw();
  canvasEditor.endTextPathDraw && canvasEditor.endTextPathDraw();
};

const endDrawingLineMode = () => {
  if (!canvasEditor) return;
  state.isDrawingLineMode = false;
  state.lineType = '';
  canvasEditor.setMode && canvasEditor.setMode(false);
  canvasEditor.setLineType && canvasEditor.setLineType('');
};

// 直线 / 箭头 / 细尾箭头 绘制模式切换
const drawingLineModeSwitch = (type) => {
  if (!canvasEditor) return;
  if ([LINE_TYPE.polygon, LINE_TYPE.freeDraw, LINE_TYPE.pathText].includes(state.lineType)) {
    endConflictTools();
  }
  if (state.lineType === type) {
    state.isDrawingLineMode = false;
    state.lineType = '';
  } else {
    state.isDrawingLineMode = true;
    state.lineType = type;
  }
  canvasEditor.setMode && canvasEditor.setMode(state.isDrawingLineMode);
  canvasEditor.setLineType && canvasEditor.setLineType(type);
  ensureObjectSelEvStatus(!state.isDrawingLineMode, !state.isDrawingLineMode);
};

// 控制普通对象的可选/事件状态，避免绘制模式下误选中
const ensureObjectSelEvStatus = (evented, selectable) => {
  if (!canvasEditor || !canvasEditor.canvas) return;
  canvasEditor.canvas.forEachObject((obj) => {
    if (obj.id !== 'workspace') {
      obj.selectable = selectable;
      obj.evented = evented;
    }
  });
};

// keep-alive 失活时退出绘制状态
onDeactivated(() => {
  cancelDraw();
});
</script>

<style scoped  >
.tool-box {
  display: flex;
  justify-content: space-around;
}

/* 原来的 .tool-box span {...} */
.tool-box span {
  flex: 1;
  text-align: center;
  padding: 5px 0;
  background: #f6f6f6;
  margin-left: 2px;
  cursor: pointer;
}

/* 原来的 span:hover {...} */
.tool-box span:hover {
  background: #edf9ff;
}

/* 原来的 span:hover svg {...} */
.tool-box span:hover svg {
  fill: #2d8cf0;
}

/* 原来的 .bg {...} */
.tool-box .bg {
  background: #d8d8d8;
}

/* 原来的 .bg:hover svg {...} */
.tool-box .bg:hover svg {
  fill: #2d8cf0;
}

.img {
  width: 20px;
}
</style>
