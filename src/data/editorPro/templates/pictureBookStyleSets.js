import {
  PAGE_34,
  PAGE_SPREAD,
  buildPage,
  brushBorderFrame,
  brushLine,
  decorRect,
  gutterLine,
  imageSlot,
  linearGradientFill,
  speechBubble,
  textSlot,
  washEllipse,
} from './buildFabricObject';

/** @typedef {'cover'|'titlePage'|'single'|'dialogue'|'spread'|'blank'} PageKind */

/**
 * @param {object} theme
 * @param {PageKind} kind
 */
function buildPageByKind(theme, kind) {
  const builders = {
    cover: buildCover,
    titlePage: buildTitlePage,
    single: buildSingle,
    dialogue: buildDialogue,
    spread: buildSpread,
    blank: buildBlank,
  };
  return builders[kind](theme);
}

function buildCover(t) {
  const { width, height } = PAGE_34;
  const paper = linearGradientFill(width, height, t.paperStops, t.paperAngle);
  return buildPage(
    [
      ...t.washes(PAGE_34),
      ...brushBorderFrame(width, height, t.brush, t.brushOpacity, 28),
      brushLine({ x1: 60, y1: height - 120, x2: width - 60, y2: height - 118, stroke: t.accent, strokeWidth: 6, opacity: 0.5, name: '装饰线' }),
      imageSlot({ left: 72, top: 200, width: width - 144, height: 520, label: '封面插画', stroke: t.accentSoft, fill: t.slotFill }),
      textSlot({ id: 'slot-title', left: 64, top: 80, width: width - 128, text: '书名标题', fontSize: 52, fill: t.text, name: '书名', fontWeight: 'bold', textAlign: 'center' }),
      textSlot({ id: 'slot-author', left: 64, top: height - 88, width: width - 128, text: '作者名', fontSize: 24, fill: t.textMuted, name: '作者', textAlign: 'center' }),
    ],
    width,
    height,
    paper
  );
}

function buildTitlePage(t) {
  const { width, height } = PAGE_34;
  const paper = linearGradientFill(width, height, t.paperStopsAlt || t.paperStops, 160);
  return buildPage(
    [
      ...t.washes(PAGE_34, 0.85),
      washEllipse({ left: width / 2 - 180, top: height / 2 - 220, rx: 200, ry: 160, fill: t.accent, opacity: 0.08, name: '扉页光晕' }),
      ...brushBorderFrame(width, height, t.brush, t.brushOpacity * 0.7, 48),
      textSlot({ id: 'slot-title', left: 80, top: height / 2 - 100, width: width - 160, text: '扉页标题', fontSize: 44, fill: t.text, name: '扉页标题', textAlign: 'center' }),
      textSlot({ id: 'slot-subtitle', left: 100, top: height / 2 - 20, width: width - 200, text: '献词 / 卷首选句', fontSize: 22, fill: t.textMuted, name: '扉页副文', textAlign: 'center' }),
      textSlot({ id: 'slot-dedication', left: 100, top: height - 200, width: width - 200, text: '致读者的一句话', fontSize: 20, fill: t.textMuted, name: '献词', textAlign: 'center' }),
    ],
    width,
    height,
    paper
  );
}

function buildSingle(t) {
  const { width, height } = PAGE_34;
  const paper = linearGradientFill(width, height, t.paperStops, t.paperAngle);
  return buildPage(
    [
      ...t.washes(PAGE_34),
      decorRect({ left: 0, top: height - 280, width, height: 280, fill: t.footerWash, opacity: 0.55, name: '页脚渐变层' }),
      imageSlot({ left: 48, top: 56, width: width - 96, height: 620, label: '叙事插画', stroke: t.accentSoft, fill: t.slotFill }),
      textSlot({ id: 'slot-body', left: 64, top: height - 220, width: width - 128, text: '在这里编写本页故事正文……', fontSize: 26, fill: t.text, name: '正文' }),
      brushLine({ x1: 64, y1: height - 240, x2: 280, y2: height - 238, stroke: t.accent, strokeWidth: 4, opacity: 0.45, name: '正文装饰' }),
    ],
    width,
    height,
    paper
  );
}

function buildDialogue(t) {
  const { width, height } = PAGE_34;
  const paper = linearGradientFill(width, height, t.paperStops, t.paperAngle);
  return buildPage(
    [
      ...t.washes(PAGE_34),
      imageSlot({ left: 48, top: 320, width: width - 96, height: 420, label: '场景插画', stroke: t.accentSoft, fill: t.slotFill }),
      ...speechBubble({
        left: 56,
        top: 72,
        rx: 130,
        ry: 58,
        fill: t.bubbleFill,
        stroke: t.accent,
        text: '角色 A 说…',
        textWidth: 200,
        id: 'slot-bubble-a',
      }),
      ...speechBubble({
        left: width - 56 - 260,
        top: 180,
        rx: 130,
        ry: 58,
        fill: t.bubbleFill,
        stroke: t.accent,
        text: '角色 B 回应…',
        textWidth: 200,
        id: 'slot-bubble-b',
      }),
    ],
    width,
    height,
    paper
  );
}

function buildSpread(t) {
  const { width, height } = PAGE_SPREAD;
  const paper = linearGradientFill(width, height, t.spreadStops || t.paperStops, 90);
  const half = width / 2;
  const inset = 32;
  return buildPage(
    [
      ...t.washes(PAGE_SPREAD),
      gutterLine(width, height, t.gutter),
      decorRect({ left: 0, top: 0, width: half, height, fill: t.spreadLeftTint, opacity: 0.35, name: '左页色调' }),
      decorRect({ left: half, top: 0, width: half, height, fill: t.spreadRightTint, opacity: 0.35, name: '右页色调' }),
      brushLine({ x1: inset, y1: inset, x2: half - inset, y2: inset, stroke: t.brush, strokeWidth: 5, opacity: t.brushOpacity * 0.55, name: '左页笔触' }),
      brushLine({ x1: half + inset, y1: inset, x2: width - inset, y2: inset, stroke: t.brush, strokeWidth: 5, opacity: t.brushOpacity * 0.55, name: '右页笔触' }),
      imageSlot({ id: 'slot-image-left', left: 36, top: 80, width: half - 72, height: height - 160, label: '跨页·左', stroke: t.accentSoft, fill: t.slotFill }),
      imageSlot({ id: 'slot-image-right', left: half + 36, top: 80, width: half - 72, height: height - 160, label: '跨页·右', stroke: t.accentSoft, fill: t.slotFill }),
      brushLine({ x1: half, y1: 40, x2: half, y2: height - 40, stroke: t.brush, strokeWidth: 3, opacity: 0.2, name: '中缝笔触' }),
    ],
    width,
    height,
    paper
  );
}

function buildBlank(t) {
  const { width, height } = PAGE_34;
  const paper = linearGradientFill(width, height, t.paperStopsAlt || t.paperStops, 200);
  return buildPage(
    [
      ...t.washes(PAGE_34, 0.6),
      ...brushBorderFrame(width, height, t.brush, t.brushOpacity * 0.5, 64),
      washEllipse({ left: width / 2 - 120, top: height / 2 - 100, rx: 140, ry: 100, fill: t.accent, opacity: 0.06, name: '留白光斑' }),
      textSlot({ id: 'slot-page-num', left: width - 120, top: height - 72, width: 80, text: '·  ·', fontSize: 18, fill: t.textMuted, name: '页码', textAlign: 'right' }),
    ],
    width,
    height,
    paper
  );
}

/** 五套风格主题 */
const STYLE_THEMES = {
  inkWash: {
    paperStops: [
      { offset: 0, color: 'rgba(248,252,255,1)' },
      { offset: 0.55, color: 'rgba(230,240,248,0.95)' },
      { offset: 1, color: 'rgba(210,225,238,0.9)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(245,250,253,1)' },
      { offset: 1, color: 'rgba(220,235,245,0.85)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(235,245,250,1)' },
      { offset: 0.5, color: 'rgba(220,235,245,0.92)' },
      { offset: 1, color: 'rgba(210,228,240,0.88)' },
    ],
    paperAngle: 165,
    brush: 'rgba(58,90,110,0.85)',
    brushOpacity: 0.38,
    accent: '#3a5a6e',
    accentSoft: 'rgba(58,90,110,0.45)',
    text: '#2a3f4f',
    textMuted: 'rgba(42,63,79,0.65)',
    bubbleFill: 'rgba(255,255,255,0.88)',
    slotFill: 'rgba(180,205,220,0.15)',
    footerWash: 'rgba(210,230,245,0.5)',
    gutter: 'rgba(58,90,110,0.12)',
    spreadLeftTint: 'rgba(200,220,235,0.4)',
    spreadRightTint: 'rgba(190,215,232,0.35)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: -40, top: 80, rx: 220, ry: 160, fill: '#7ba3b8', opacity: 0.18 * scale, name: '水墨晕染' }),
      washEllipse({ left: width - 200, top: height - 320, rx: 180, ry: 140, fill: '#5a8499', opacity: 0.14 * scale, name: '水墨晕染' }),
      brushLine({ x1: 40, y1: 160, x2: 200, y2: 200, stroke: '#4a7088', strokeWidth: 18, opacity: 0.22 * scale, name: '枯笔' }),
    ],
  },
  warmDiary: {
    paperStops: [
      { offset: 0, color: 'rgba(255,252,245,1)' },
      { offset: 0.5, color: 'rgba(255,245,228,0.96)' },
      { offset: 1, color: 'rgba(250,235,210,0.9)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(255,250,240,1)' },
      { offset: 1, color: 'rgba(252,238,215,0.88)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(255,248,235,1)' },
      { offset: 1, color: 'rgba(248,228,198,0.9)' },
    ],
    paperAngle: 175,
    brush: 'rgba(160,100,60,0.8)',
    brushOpacity: 0.42,
    accent: '#a8643c',
    accentSoft: 'rgba(168,100,60,0.4)',
    text: '#4a3020',
    textMuted: 'rgba(74,48,32,0.6)',
    bubbleFill: 'rgba(255,252,245,0.92)',
    slotFill: 'rgba(220,180,140,0.12)',
    footerWash: 'rgba(255,235,200,0.55)',
    gutter: 'rgba(160,100,60,0.1)',
    spreadLeftTint: 'rgba(255,240,215,0.45)',
    spreadRightTint: 'rgba(255,232,200,0.4)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: width - 240, top: 40, rx: 200, ry: 120, fill: '#e8b878', opacity: 0.2 * scale, name: '暖光晕染' }),
      decorRect({ left: 24, top: height - 180, width: width * 0.55, height: 120, fill: 'rgba(255,210,150,0.25)', opacity: 0.7 * scale, rx: 60, ry: 60, name: '琥珀渐变块' }),
      brushLine({ x1: 30, y1: height - 100, x2: width - 50, y2: height - 95, stroke: '#c89050', strokeWidth: 12, opacity: 0.28 * scale, name: '手账笔触' }),
    ],
  },
  crayonForest: {
    paperStops: [
      { offset: 0, color: 'rgba(252,255,248,1)' },
      { offset: 0.6, color: 'rgba(235,248,230,0.95)' },
      { offset: 1, color: 'rgba(215,240,210,0.88)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(248,255,245,1)' },
      { offset: 1, color: 'rgba(225,245,218,0.9)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(240,252,235,1)' },
      { offset: 1, color: 'rgba(210,235,200,0.9)' },
    ],
    paperAngle: 150,
    brush: 'rgba(70,120,55,0.85)',
    brushOpacity: 0.45,
    accent: '#4a7837',
    accentSoft: 'rgba(74,120,55,0.42)',
    text: '#2d4a24',
    textMuted: 'rgba(45,74,36,0.62)',
    bubbleFill: 'rgba(255,255,250,0.9)',
    slotFill: 'rgba(140,190,120,0.14)',
    footerWash: 'rgba(200,235,185,0.5)',
    gutter: 'rgba(70,120,55,0.1)',
    spreadLeftTint: 'rgba(210,240,195,0.4)',
    spreadRightTint: 'rgba(195,230,180,0.38)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: 20, top: 60, rx: 160, ry: 110, fill: '#8fd16a', opacity: 0.22 * scale, name: '蜡笔块' }),
      washEllipse({ left: width - 180, top: height - 260, rx: 150, ry: 130, fill: '#6cb850', opacity: 0.18 * scale, name: '蜡笔块' }),
      brushLine({ x1: 80, y1: 140, x2: 260, y2: 100, stroke: '#5a9838', strokeWidth: 20, opacity: 0.3 * scale, name: '蜡笔Stroke' }),
      brushLine({ x1: width - 200, y1: height - 180, x2: width - 60, y2: height - 120, stroke: '#78b848', strokeWidth: 16, opacity: 0.25 * scale, name: '蜡笔Stroke' }),
    ],
  },
  starryLullaby: {
    paperStops: [
      { offset: 0, color: 'rgba(25,35,65,1)' },
      { offset: 0.45, color: 'rgba(35,48,88,0.96)' },
      { offset: 1, color: 'rgba(48,58,105,0.92)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(28,38,72,1)' },
      { offset: 1, color: 'rgba(42,52,98,0.9)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(22,32,62,1)' },
      { offset: 0.5, color: 'rgba(38,48,92,0.95)' },
      { offset: 1, color: 'rgba(52,62,110,0.9)' },
    ],
    paperAngle: 180,
    brush: 'rgba(180,200,255,0.7)',
    brushOpacity: 0.35,
    accent: '#c8d8ff',
    accentSoft: 'rgba(200,216,255,0.45)',
    text: '#eef2ff',
    textMuted: 'rgba(220,228,255,0.65)',
    bubbleFill: 'rgba(45,55,95,0.85)',
    slotFill: 'rgba(100,120,180,0.15)',
    footerWash: 'rgba(60,75,130,0.45)',
    gutter: 'rgba(200,210,255,0.08)',
    spreadLeftTint: 'rgba(40,50,90,0.5)',
    spreadRightTint: 'rgba(55,65,110,0.45)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: width / 2 - 100, top: 80, rx: 120, ry: 120, fill: '#ffeaa0', opacity: 0.15 * scale, name: '月光' }),
      washEllipse({ left: 60, top: height - 200, rx: 90, ry: 70, fill: '#a0b8ff', opacity: 0.12 * scale, name: '星尘' }),
      washEllipse({ left: width - 150, top: 200, rx: 70, ry: 70, fill: '#ffffff', opacity: 0.08 * scale, name: '星尘' }),
      brushLine({ x1: 0, y1: height * 0.7, x2: width, y2: height * 0.72, stroke: '#8090c8', strokeWidth: 8, opacity: 0.15 * scale, name: '夜云笔触' }),
    ],
  },
  softPencil: {
    paperStops: [
      { offset: 0, color: 'rgba(255,254,252,1)' },
      { offset: 0.5, color: 'rgba(252,248,252,0.96)' },
      { offset: 1, color: 'rgba(245,240,248,0.9)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(254,252,255,1)' },
      { offset: 1, color: 'rgba(248,242,250,0.88)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(255,250,252,1)' },
      { offset: 1, color: 'rgba(242,235,245,0.92)' },
    ],
    paperAngle: 170,
    brush: 'rgba(130,110,140,0.75)',
    brushOpacity: 0.32,
    accent: '#826e8c',
    accentSoft: 'rgba(130,110,140,0.38)',
    text: '#443848',
    textMuted: 'rgba(68,56,72,0.58)',
    bubbleFill: 'rgba(255,255,255,0.9)',
    slotFill: 'rgba(200,180,210,0.1)',
    footerWash: 'rgba(240,230,245,0.5)',
    gutter: 'rgba(130,110,140,0.08)',
    spreadLeftTint: 'rgba(250,240,252,0.42)',
    spreadRightTint: 'rgba(245,235,248,0.38)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: width - 220, top: 100, rx: 170, ry: 130, fill: '#d4b8e0', opacity: 0.16 * scale, name: '淡彩晕染' }),
      washEllipse({ left: 40, top: height - 280, rx: 140, ry: 100, fill: '#b8c8e8', opacity: 0.12 * scale, name: '淡彩晕染' }),
      decorRect({ left: 0, top: 0, width, height: height * 0.35, fill: 'rgba(255,255,255,0.35)', opacity: 0.4 * scale, name: '顶部渐白' }),
      brushLine({ x1: 50, y1: 90, x2: 180, y2: 110, stroke: '#9888a8', strokeWidth: 5, opacity: 0.25 * scale, name: '铅笔线' }),
    ],
  },
  coralSunset: {
    paperStops: [
      { offset: 0, color: 'rgba(255,248,242,1)' },
      { offset: 0.45, color: 'rgba(255,228,210,0.96)' },
      { offset: 1, color: 'rgba(255,200,175,0.88)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(255,245,238,1)' },
      { offset: 1, color: 'rgba(255,215,195,0.85)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(255,235,220,1)' },
      { offset: 0.5, color: 'rgba(255,210,185,0.94)' },
      { offset: 1, color: 'rgba(255,185,160,0.9)' },
    ],
    paperAngle: 155,
    brush: 'rgba(200,90,60,0.82)',
    brushOpacity: 0.4,
    accent: '#c85a38',
    accentSoft: 'rgba(200,90,60,0.42)',
    text: '#5c2818',
    textMuted: 'rgba(92,40,24,0.62)',
    bubbleFill: 'rgba(255,250,245,0.9)',
    slotFill: 'rgba(255,180,140,0.14)',
    footerWash: 'rgba(255,200,170,0.52)',
    gutter: 'rgba(200,90,60,0.1)',
    spreadLeftTint: 'rgba(255,210,185,0.42)',
    spreadRightTint: 'rgba(255,195,165,0.38)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: -60, top: height - 360, rx: 280, ry: 200, fill: '#ff9060', opacity: 0.2 * scale, name: '落日晕染' }),
      washEllipse({ left: width - 240, top: 40, rx: 200, ry: 150, fill: '#ffb080', opacity: 0.16 * scale, name: '晚霞' }),
      brushLine({ x1: 0, y1: height * 0.55, x2: width, y2: height * 0.58, stroke: '#e87048', strokeWidth: 10, opacity: 0.18 * scale, name: '地平线笔触' }),
    ],
  },
  oceanBreeze: {
    paperStops: [
      { offset: 0, color: 'rgba(245,252,255,1)' },
      { offset: 0.5, color: 'rgba(225,245,252,0.96)' },
      { offset: 1, color: 'rgba(200,235,248,0.9)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(248,253,255,1)' },
      { offset: 1, color: 'rgba(215,240,250,0.88)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(230,248,255,1)' },
      { offset: 1, color: 'rgba(190,230,248,0.92)' },
    ],
    paperAngle: 160,
    brush: 'rgba(40,120,150,0.78)',
    brushOpacity: 0.36,
    accent: '#287896',
    accentSoft: 'rgba(40,120,150,0.4)',
    text: '#1a4558',
    textMuted: 'rgba(26,69,88,0.6)',
    bubbleFill: 'rgba(255,255,255,0.92)',
    slotFill: 'rgba(120,200,230,0.12)',
    footerWash: 'rgba(180,225,245,0.48)',
    gutter: 'rgba(40,120,150,0.09)',
    spreadLeftTint: 'rgba(210,240,252,0.4)',
    spreadRightTint: 'rgba(195,235,250,0.36)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: width - 280, top: height - 300, rx: 240, ry: 160, fill: '#60c0e8', opacity: 0.16 * scale, name: '海浪晕染' }),
      brushLine({ x1: 20, y1: height * 0.62, x2: width - 20, y2: height * 0.65, stroke: '#48a8c8', strokeWidth: 7, opacity: 0.22 * scale, name: '浪线' }),
      brushLine({ x1: 30, y1: height * 0.68, x2: width - 40, y2: height * 0.66, stroke: '#68b8d8', strokeWidth: 5, opacity: 0.15 * scale, name: '浪线' }),
      decorRect({ left: 0, top: 0, width, height: height * 0.22, fill: 'rgba(255,255,255,0.4)', opacity: 0.35 * scale, name: '天光渐变' }),
    ],
  },
  snowFairy: {
    paperStops: [
      { offset: 0, color: 'rgba(255,255,255,1)' },
      { offset: 0.55, color: 'rgba(245,250,255,0.97)' },
      { offset: 1, color: 'rgba(230,242,255,0.92)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(252,254,255,1)' },
      { offset: 1, color: 'rgba(235,245,255,0.9)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(255,255,255,1)' },
      { offset: 0.5, color: 'rgba(242,248,255,0.96)' },
      { offset: 1, color: 'rgba(225,238,252,0.92)' },
    ],
    paperAngle: 190,
    brush: 'rgba(140,170,210,0.65)',
    brushOpacity: 0.28,
    accent: '#7898c0',
    accentSoft: 'rgba(120,152,192,0.38)',
    text: '#3a4860',
    textMuted: 'rgba(58,72,96,0.55)',
    bubbleFill: 'rgba(255,255,255,0.95)',
    slotFill: 'rgba(180,210,240,0.1)',
    footerWash: 'rgba(220,235,255,0.45)',
    gutter: 'rgba(140,170,210,0.07)',
    spreadLeftTint: 'rgba(245,250,255,0.5)',
    spreadRightTint: 'rgba(235,245,255,0.45)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: 80, top: 120, rx: 100, ry: 100, fill: '#ffffff', opacity: 0.35 * scale, name: '雪花光斑' }),
      washEllipse({ left: width - 160, top: 280, rx: 80, ry: 80, fill: '#e8f0ff', opacity: 0.25 * scale, name: '雪花光斑' }),
      washEllipse({ left: width / 2 - 60, top: height - 180, rx: 90, ry: 90, fill: '#ffffff', opacity: 0.2 * scale, name: '雪花光斑' }),
      brushLine({ x1: 40, y1: 50, x2: 120, y2: 80, stroke: '#a8c0e0', strokeWidth: 4, opacity: 0.2 * scale, name: '冰晶线' }),
    ],
  },
  candyPop: {
    paperStops: [
      { offset: 0, color: 'rgba(255,252,255,1)' },
      { offset: 0.35, color: 'rgba(255,240,250,0.96)' },
      { offset: 0.7, color: 'rgba(240,248,255,0.94)' },
      { offset: 1, color: 'rgba(255,248,220,0.9)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(255,250,255,1)' },
      { offset: 1, color: 'rgba(248,240,255,0.88)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(255,245,252,1)' },
      { offset: 0.5, color: 'rgba(245,248,255,0.95)' },
      { offset: 1, color: 'rgba(255,250,230,0.92)' },
    ],
    paperAngle: 120,
    brush: 'rgba(220,80,140,0.8)',
    brushOpacity: 0.48,
    accent: '#e05098',
    accentSoft: 'rgba(224,80,152,0.42)',
    text: '#4a2040',
    textMuted: 'rgba(74,32,64,0.58)',
    bubbleFill: 'rgba(255,255,255,0.92)',
    slotFill: 'rgba(255,160,200,0.12)',
    footerWash: 'rgba(255,200,230,0.45)',
    gutter: 'rgba(220,80,140,0.08)',
    spreadLeftTint: 'rgba(255,220,240,0.38)',
    spreadRightTint: 'rgba(220,235,255,0.35)',
    washes: ({ width, height }, scale = 1) => [
      washEllipse({ left: 30, top: 80, rx: 120, ry: 90, fill: '#ff80c0', opacity: 0.2 * scale, name: '糖果块' }),
      washEllipse({ left: width - 180, top: 160, rx: 110, ry: 85, fill: '#80c0ff', opacity: 0.18 * scale, name: '糖果块' }),
      washEllipse({ left: width / 2 - 80, top: height - 220, rx: 100, ry: 75, fill: '#ffe060', opacity: 0.16 * scale, name: '糖果块' }),
      brushLine({ x1: 60, y1: 200, x2: 200, y2: 160, stroke: '#ff60a0', strokeWidth: 22, opacity: 0.28 * scale, name: 'POP笔触' }),
    ],
  },
  vintagePrint: {
    paperStops: [
      { offset: 0, color: 'rgba(252,246,235,1)' },
      { offset: 0.5, color: 'rgba(245,232,210,0.96)' },
      { offset: 1, color: 'rgba(235,218,188,0.9)' },
    ],
    paperStopsAlt: [
      { offset: 0, color: 'rgba(250,242,228,1)' },
      { offset: 1, color: 'rgba(238,220,190,0.88)' },
    ],
    spreadStops: [
      { offset: 0, color: 'rgba(248,238,220,1)' },
      { offset: 1, color: 'rgba(232,212,180,0.92)' },
    ],
    paperAngle: 175,
    brush: 'rgba(120,60,40,0.78)',
    brushOpacity: 0.38,
    accent: '#8b4028',
    accentSoft: 'rgba(139,64,40,0.42)',
    text: '#3a2010',
    textMuted: 'rgba(58,32,16,0.58)',
    bubbleFill: 'rgba(252,244,230,0.92)',
    slotFill: 'rgba(180,150,110,0.12)',
    footerWash: 'rgba(230,210,175,0.5)',
    gutter: 'rgba(120,60,40,0.1)',
    spreadLeftTint: 'rgba(240,225,200,0.42)',
    spreadRightTint: 'rgba(235,218,188,0.4)',
    washes: ({ width, height }, scale = 1) => [
      decorRect({ left: 16, top: 16, width: width - 32, height: height - 32, fill: 'transparent', stroke: 'rgba(139,64,40,0.25)', opacity: 1, rx: 4, ry: 4, name: '印刷框' }),
      washEllipse({ left: width - 200, top: height - 250, rx: 160, ry: 120, fill: '#c8a878', opacity: 0.1 * scale, name: '旧纸斑' }),
      brushLine({ x1: 24, y1: 24, x2: width - 24, y2: 24, stroke: '#8b4028', strokeWidth: 3, opacity: 0.35 * scale, name: '线装笔触' }),
      brushLine({ x1: 24, y1: height - 24, x2: width - 24, y2: height - 24, stroke: '#8b4028', strokeWidth: 3, opacity: 0.3 * scale, name: '线装笔触' }),
    ],
  },
};

/** 每套 6 种版式，各自独立命名 id */
const STYLE_SETS = [
  {
    id: 'ink-wash',
    nameKey: 'pictureBookTemplates.styles.inkWash',
    pages: [
      { id: 'ink-cover', kind: 'cover', nameKey: 'pictureBookTemplates.inkWash.cover' },
      { id: 'ink-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.inkWash.titlePage' },
      { id: 'ink-single', kind: 'single', nameKey: 'pictureBookTemplates.inkWash.single' },
      { id: 'ink-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.inkWash.dialogue' },
      { id: 'ink-spread', kind: 'spread', nameKey: 'pictureBookTemplates.inkWash.spread' },
      { id: 'ink-blank', kind: 'blank', nameKey: 'pictureBookTemplates.inkWash.blank' },
    ],
    theme: STYLE_THEMES.inkWash,
  },
  {
    id: 'warm-diary',
    nameKey: 'pictureBookTemplates.styles.warmDiary',
    pages: [
      { id: 'warm-cover', kind: 'cover', nameKey: 'pictureBookTemplates.warmDiary.cover' },
      { id: 'warm-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.warmDiary.titlePage' },
      { id: 'warm-single', kind: 'single', nameKey: 'pictureBookTemplates.warmDiary.single' },
      { id: 'warm-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.warmDiary.dialogue' },
      { id: 'warm-spread', kind: 'spread', nameKey: 'pictureBookTemplates.warmDiary.spread' },
      { id: 'warm-blank', kind: 'blank', nameKey: 'pictureBookTemplates.warmDiary.blank' },
    ],
    theme: STYLE_THEMES.warmDiary,
  },
  {
    id: 'crayon-forest',
    nameKey: 'pictureBookTemplates.styles.crayonForest',
    pages: [
      { id: 'crayon-cover', kind: 'cover', nameKey: 'pictureBookTemplates.crayonForest.cover' },
      { id: 'crayon-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.crayonForest.titlePage' },
      { id: 'crayon-single', kind: 'single', nameKey: 'pictureBookTemplates.crayonForest.single' },
      { id: 'crayon-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.crayonForest.dialogue' },
      { id: 'crayon-spread', kind: 'spread', nameKey: 'pictureBookTemplates.crayonForest.spread' },
      { id: 'crayon-blank', kind: 'blank', nameKey: 'pictureBookTemplates.crayonForest.blank' },
    ],
    theme: STYLE_THEMES.crayonForest,
  },
  {
    id: 'starry-lullaby',
    nameKey: 'pictureBookTemplates.styles.starryLullaby',
    pages: [
      { id: 'starry-cover', kind: 'cover', nameKey: 'pictureBookTemplates.starryLullaby.cover' },
      { id: 'starry-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.starryLullaby.titlePage' },
      { id: 'starry-single', kind: 'single', nameKey: 'pictureBookTemplates.starryLullaby.single' },
      { id: 'starry-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.starryLullaby.dialogue' },
      { id: 'starry-spread', kind: 'spread', nameKey: 'pictureBookTemplates.starryLullaby.spread' },
      { id: 'starry-blank', kind: 'blank', nameKey: 'pictureBookTemplates.starryLullaby.blank' },
    ],
    theme: STYLE_THEMES.starryLullaby,
  },
  {
    id: 'soft-pencil',
    nameKey: 'pictureBookTemplates.styles.softPencil',
    pages: [
      { id: 'pencil-cover', kind: 'cover', nameKey: 'pictureBookTemplates.softPencil.cover' },
      { id: 'pencil-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.softPencil.titlePage' },
      { id: 'pencil-single', kind: 'single', nameKey: 'pictureBookTemplates.softPencil.single' },
      { id: 'pencil-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.softPencil.dialogue' },
      { id: 'pencil-spread', kind: 'spread', nameKey: 'pictureBookTemplates.softPencil.spread' },
      { id: 'pencil-blank', kind: 'blank', nameKey: 'pictureBookTemplates.softPencil.blank' },
    ],
    theme: STYLE_THEMES.softPencil,
  },
  {
    id: 'coral-sunset',
    nameKey: 'pictureBookTemplates.styles.coralSunset',
    pages: [
      { id: 'coral-cover', kind: 'cover', nameKey: 'pictureBookTemplates.coralSunset.cover' },
      { id: 'coral-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.coralSunset.titlePage' },
      { id: 'coral-single', kind: 'single', nameKey: 'pictureBookTemplates.coralSunset.single' },
      { id: 'coral-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.coralSunset.dialogue' },
      { id: 'coral-spread', kind: 'spread', nameKey: 'pictureBookTemplates.coralSunset.spread' },
      { id: 'coral-blank', kind: 'blank', nameKey: 'pictureBookTemplates.coralSunset.blank' },
    ],
    theme: STYLE_THEMES.coralSunset,
  },
  {
    id: 'ocean-breeze',
    nameKey: 'pictureBookTemplates.styles.oceanBreeze',
    pages: [
      { id: 'ocean-cover', kind: 'cover', nameKey: 'pictureBookTemplates.oceanBreeze.cover' },
      { id: 'ocean-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.oceanBreeze.titlePage' },
      { id: 'ocean-single', kind: 'single', nameKey: 'pictureBookTemplates.oceanBreeze.single' },
      { id: 'ocean-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.oceanBreeze.dialogue' },
      { id: 'ocean-spread', kind: 'spread', nameKey: 'pictureBookTemplates.oceanBreeze.spread' },
      { id: 'ocean-blank', kind: 'blank', nameKey: 'pictureBookTemplates.oceanBreeze.blank' },
    ],
    theme: STYLE_THEMES.oceanBreeze,
  },
  {
    id: 'snow-fairy',
    nameKey: 'pictureBookTemplates.styles.snowFairy',
    pages: [
      { id: 'snow-cover', kind: 'cover', nameKey: 'pictureBookTemplates.snowFairy.cover' },
      { id: 'snow-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.snowFairy.titlePage' },
      { id: 'snow-single', kind: 'single', nameKey: 'pictureBookTemplates.snowFairy.single' },
      { id: 'snow-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.snowFairy.dialogue' },
      { id: 'snow-spread', kind: 'spread', nameKey: 'pictureBookTemplates.snowFairy.spread' },
      { id: 'snow-blank', kind: 'blank', nameKey: 'pictureBookTemplates.snowFairy.blank' },
    ],
    theme: STYLE_THEMES.snowFairy,
  },
  {
    id: 'candy-pop',
    nameKey: 'pictureBookTemplates.styles.candyPop',
    pages: [
      { id: 'pop-cover', kind: 'cover', nameKey: 'pictureBookTemplates.candyPop.cover' },
      { id: 'pop-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.candyPop.titlePage' },
      { id: 'pop-single', kind: 'single', nameKey: 'pictureBookTemplates.candyPop.single' },
      { id: 'pop-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.candyPop.dialogue' },
      { id: 'pop-spread', kind: 'spread', nameKey: 'pictureBookTemplates.candyPop.spread' },
      { id: 'pop-blank', kind: 'blank', nameKey: 'pictureBookTemplates.candyPop.blank' },
    ],
    theme: STYLE_THEMES.candyPop,
  },
  {
    id: 'vintage-print',
    nameKey: 'pictureBookTemplates.styles.vintagePrint',
    pages: [
      { id: 'vintage-cover', kind: 'cover', nameKey: 'pictureBookTemplates.vintagePrint.cover' },
      { id: 'vintage-title', kind: 'titlePage', nameKey: 'pictureBookTemplates.vintagePrint.titlePage' },
      { id: 'vintage-single', kind: 'single', nameKey: 'pictureBookTemplates.vintagePrint.single' },
      { id: 'vintage-dialogue', kind: 'dialogue', nameKey: 'pictureBookTemplates.vintagePrint.dialogue' },
      { id: 'vintage-spread', kind: 'spread', nameKey: 'pictureBookTemplates.vintagePrint.spread' },
      { id: 'vintage-blank', kind: 'blank', nameKey: 'pictureBookTemplates.vintagePrint.blank' },
    ],
    theme: STYLE_THEMES.vintagePrint,
  },
];

const PAGE_KIND_LABEL = {
  cover: 'pictureBookTemplates.kinds.cover',
  titlePage: 'pictureBookTemplates.kinds.titlePage',
  single: 'pictureBookTemplates.kinds.single',
  dialogue: 'pictureBookTemplates.kinds.dialogue',
  spread: 'pictureBookTemplates.kinds.spread',
  blank: 'pictureBookTemplates.kinds.blank',
};

/** 扁平列表，供 UI 渲染 */
export function getPictureBookTemplateCatalog() {
  const list = [];
  STYLE_SETS.forEach((set) => {
    set.pages.forEach((page) => {
      const built = buildPageByKind(set.theme, page.kind);
      list.push({
        id: page.id,
        styleId: set.id,
        styleNameKey: set.nameKey,
        kind: page.kind,
        kindLabelKey: PAGE_KIND_LABEL[page.kind],
        nameKey: page.nameKey,
        width: built.width,
        height: built.height,
        json: built,
      });
    });
  });
  return list;
}

export function getPictureBookStyleSets() {
  return STYLE_SETS.map((set) => ({
    id: set.id,
    nameKey: set.nameKey,
    pages: set.pages.map((p) => {
      const built = buildPageByKind(set.theme, p.kind);
      return {
        id: p.id,
        kind: p.kind,
        kindLabelKey: PAGE_KIND_LABEL[p.kind],
        nameKey: p.nameKey,
        width: built.width,
        height: built.height,
        json: built,
      };
    }),
  }));
}

export function getPictureBookTemplateById(id) {
  return getPictureBookTemplateCatalog().find((t) => t.id === id) || null;
}
