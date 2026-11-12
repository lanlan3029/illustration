// Shared swatches and Fabric gradient conversion for fill and border controls.
import { fabric } from 'fabric';
export const pictureBookSwatches = [
  { label: '奶油白（纸张感）', hex: '#FFFDF5' },
  { label: '温暖灰', hex: '#E5E1DA' },
  { label: '深石灰', hex: '#4A4A4A' },
  { label: '炭黑', hex: '#2D2926' },
  { label: '蜜桃粉', hex: '#FFCAD4' },
  { label: '珊瑚橙', hex: '#F7A072' },
  { label: '明亮黄', hex: '#F9DC5C' },
  { label: '芥末黄', hex: '#D4A373' },
  { label: '砖红', hex: '#BC6C25' },
  { label: '浅陶土', hex: '#DDB892' },
  { label: '薄荷绿', hex: '#B7E4C7' },
  { label: '橄榄绿', hex: '#7B8F62' },
  { label: '天青蓝', hex: '#A2D2FF' },
  { label: '牛仔蓝', hex: '#4895EF' },
  { label: '雾霾蓝', hex: '#8E9AAF' },
  { label: '香芋紫', hex: '#BDB2FF' },
  { label: '森林深绿', hex: '#2D6A4F' },
  { label: '午夜蓝', hex: '#003049' },
  { label: '梅子色', hex: '#6D597A' },
  { label: '焦糖褐', hex: '#603808' },
];

export function paintToCss(paint, object) {
  if (typeof paint === 'string') return paint;
  if (!paint || !Array.isArray(paint.colorStops)) return '#000000';
  const { x1, y1, x2, y2 } = paint.coords;
  const width = paint.gradientUnits === 'percentage' ? 1 : Math.max(object.width || 0, 1);
  const height = paint.gradientUnits === 'percentage' ? 1 : Math.max(object.height || 0, 1);
  const angle = (Math.atan2((x2 - x1) / width, -(y2 - y1) / height) * 180 / Math.PI + 360) % 360;
  const stops = paint.colorStops.map((stop) => {
    const color = new fabric.Color(stop.color);
    if (stop.opacity != null) color.setAlpha(color.getAlpha() * stop.opacity);
    return `#${color.toHexa()} ${stop.offset * 100}%`;
  }).join(', ');
  return `linear-gradient(${angle}deg, ${stops})`;
}

export function gradientFromPicker(fabric, value, object) {
  const radians = Number(value.angle || 0) * Math.PI / 180;
  const width = Math.max(object.width || 0, 1);
  const height = Math.max(object.height || 0, 1);
  const dx = Math.sin(radians) / 2;
  const dy = -Math.cos(radians) / 2;
  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'pixels',
    coords: { x1: (0.5 - dx) * width, y1: (0.5 - dy) * height, x2: (0.5 + dx) * width, y2: (0.5 + dy) * height },
    colorStops: value.stops.map(({ offset, color, opacity }) => ({ offset, color, ...(opacity == null ? {} : { opacity }) })),
  });
}
