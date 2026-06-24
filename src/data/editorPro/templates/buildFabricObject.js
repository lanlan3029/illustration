/** Fabric 5.3 绘本模板 JSON 构建辅助 */

export const PAGE_34 = { width: 810, height: 1080 };
export const PAGE_SPREAD = { width: 2160, height: 1080 };

const FABRIC_VERSION = '5.3.0';

function base(extra) {
  return {
    version: FABRIC_VERSION,
    originX: 'left',
    originY: 'top',
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: '',
    fillRule: 'nonzero',
    paintFirst: 'fill',
    globalCompositeOperation: 'source-over',
    skewX: 0,
    skewY: 0,
    selectable: true,
    evented: true,
    hasControls: true,
    ...extra,
  };
}

export function linearGradientFill(width, height, colorStops, angleDeg = 180) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const len = Math.max(width, height) / 2;
  return {
    type: 'linear',
    gradientUnits: 'pixels',
    coords: {
      x1: cx - Math.cos(rad) * len,
      y1: cy - Math.sin(rad) * len,
      x2: cx + Math.cos(rad) * len,
      y2: cy + Math.sin(rad) * len,
    },
    colorStops: colorStops.map(({ offset, color }) => ({ offset, color })),
  };
}

export function workspace(width, height, fill) {
  return base({
    type: 'rect',
    left: 0,
    top: 0,
    width,
    height,
    fill,
    stroke: null,
    strokeWidth: 0,
    rx: 0,
    ry: 0,
    id: 'workspace',
    name: '画布',
    selectable: false,
    evented: false,
    hasControls: false,
  });
}

export function decorRect({ left, top, width, height, fill, stroke = null, strokeWidth = 0, opacity = 1, rx = 0, ry = 0, name = '装饰' }) {
  return base({
    type: 'rect',
    left,
    top,
    width,
    height,
    fill: fill ?? 'transparent',
    stroke,
    strokeWidth,
    rx,
    ry,
    opacity,
    id: `decor-${name}-${left}-${top}`,
    name,
    selectable: false,
    evented: false,
    hasControls: false,
  });
}

export function washEllipse({ left, top, rx, ry, fill, opacity = 0.25, name = '水渍笔触' }) {
  return base({
    type: 'ellipse',
    left,
    top,
    rx,
    ry,
    fill,
    stroke: null,
    strokeWidth: 0,
    opacity,
    id: `wash-${left}-${top}`,
    name,
    selectable: false,
    evented: false,
    hasControls: false,
  });
}

/** 模拟手绘笔触：粗线条 + 圆头 + 半透明 */
export function brushLine({ x1, y1, x2, y2, stroke, strokeWidth = 14, opacity = 0.35, name = '笔触' }) {
  return base({
    type: 'line',
    x1,
    y1,
    x2,
    y2,
    stroke,
    strokeWidth,
    strokeLineCap: 'round',
    fill: 'transparent',
    opacity,
    id: `brush-${x1}-${y1}`,
    name,
    selectable: false,
    evented: false,
    hasControls: false,
  });
}

export function brushBorderFrame(width, height, stroke, opacity = 0.4, inset = 36) {
  const x0 = inset;
  const y0 = inset;
  const x1 = width - inset;
  const y1 = height - inset;
  return [
    brushLine({ x1: x0, y1: y0, x2: x1, y2: y0, stroke, opacity, name: '笔触框-上' }),
    brushLine({ x1: x1, y1: y0, x2: x1, y2: y1, stroke, opacity: opacity * 0.9, name: '笔触框-右' }),
    brushLine({ x1: x0, y1: y1, x2: x1, y2: y1, stroke, opacity: opacity * 0.85, name: '笔触框-下' }),
    brushLine({ x1: x0, y1: y0, x2: x0, y2: y1, stroke, opacity: opacity * 0.95, name: '笔触框-左' }),
  ];
}

export function imageSlot({ id = 'slot-image-main', left, top, width, height, label, stroke, fill = 'rgba(200,200,200,0.18)' }) {
  return base({
    type: 'rect',
    left,
    top,
    width,
    height,
    fill,
    stroke: stroke || 'rgba(120,120,120,0.35)',
    strokeWidth: 2,
    strokeDashArray: [8, 6],
    rx: 12,
    ry: 12,
    id,
    name: label || '插画区',
  });
}

export function textSlot({
  id,
  left,
  top,
  width,
  text,
  fontSize = 36,
  fill = '#333333',
  name,
  fontWeight = 'normal',
  textAlign = 'left',
}) {
  return base({
    type: 'textbox',
    left,
    top,
    width,
    text,
    fontSize,
    fontFamily: 'arial',
    fontWeight,
    fill,
    textAlign,
    splitByGrapheme: true,
    id: id || 'slot-text',
    name: name || '文本',
  });
}

export function speechBubble({ left, top, rx, ry, fill, stroke, text, textWidth = 200, id = 'slot-bubble' }) {
  const bubble = base({
    type: 'ellipse',
    left,
    top,
    rx,
    ry,
    fill,
    stroke,
    strokeWidth: 2,
    id: `${id}-shape`,
    name: '对话气泡',
  });
  const label = textSlot({
    id: `${id}-text`,
    left: left + rx - textWidth / 2,
    top: top + ry - 18,
    width: textWidth,
    text,
    fontSize: 22,
    fill: stroke,
    name: '对话文字',
    textAlign: 'center',
  });
  return [bubble, label];
}

export function gutterLine(spreadWidth, height, color = 'rgba(0,0,0,0.08)') {
  const cx = spreadWidth / 2;
  return decorRect({
    left: cx - 1,
    top: 48,
    width: 2,
    height: height - 96,
    fill: color,
    opacity: 1,
    name: '装订线',
  });
}

export function buildPage(objects, width, height, paperFill) {
  return {
    version: FABRIC_VERSION,
    width,
    height,
    objects: [workspace(width, height, paperFill), ...objects],
  };
}

export function pageSizeLabel(width, height) {
  if (width === PAGE_SPREAD.width) return '2:1';
  if (width === 810 && height === 1080) return '3:4';
  return `${width}×${height}`;
}
