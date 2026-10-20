// Offline adapter for the rectangular, unrotated Photo Collage pilot templates.
// Reject unsupported geometry instead of silently discarding a mask or decoration.
const FONT = 'Arial, "Microsoft YaHei", sans-serif';
const RECT_MASK = '048c8627-a228-4b7c-95e0-b474799fb4d8.svg';
const { opaquePaperColor } = require('../../src/utils/editorPro/designTemplateCompatibility.cjs');
const PROPS = ['left', 'top', 'width', 'height', 'originX', 'originY', 'scaleX', 'scaleY',
  'angle', 'flipX', 'flipY', 'opacity', 'fill', 'stroke', 'strokeWidth', 'rx', 'ry',
  'shadow', 'text', 'fontSize', 'fontWeight', 'fontStyle', 'textAlign', 'lineHeight',
  'charSpacing', 'underline', 'linethrough', 'overline', 'backgroundColor'];

function convertFotorTemplate(page, meta) {
  const width = Number(meta.width), height = Number(meta.height);
  if (!(width > 0 && height > 0) || !Array.isArray(page.objects)) throw new Error('Invalid template');
  let slots = 0;
  const objects = [{ type: 'rect', version: '5.3.0', id: 'workspace', left: 0, top: 0,
    width, height, fill: '#ffffff', strokeWidth: 0, selectable: false, evented: false, hasControls: false }];
  for (const source of page.objects) {
    if (source.type === 'background') {
      if (source.src) throw new Error('Image backgrounds need a local asset adapter');
      objects[0].fill = opaquePaperColor(source.backgroundColor || '#ffffff');
      continue;
    }
    if (source.type === 'imageContainer') {
      if ((source.angle || 0) % 360 || source.flipX || source.flipY || source.skewX || source.skewY) {
        throw new Error('Rotated/skewed photo slots need a frame adapter');
      }
      if (source.clipPath && source.clipPath.type !== 'rect') throw new Error('Unsupported photo mask');
      if (source.clipSvgUrl && !source.clipSvgUrl.split('?')[0].endsWith(RECT_MASK)) throw new Error('Unsupported SVG mask');
      const clip = source.clipPath;
      if (clip && (clip.rx || clip.ry || clip.left || clip.top || clip.angle || clip.inverted || clip.absolutePositioned ||
        (clip.scaleX != null && clip.scaleX !== 1) || (clip.scaleY != null && clip.scaleY !== 1) ||
        Math.abs(clip.width - source.width) > .01 || Math.abs(clip.height - source.height) > .01)) {
        throw new Error('Offset/rounded photo masks need a frame adapter');
      }
      const w = source.width * (source.scaleX ?? 1), h = source.height * (source.scaleY ?? 1);
      if (!(w > 0 && h > 0)) throw new Error('Invalid photo frame');
      const originOffset = (origin, extent) => origin === 'center' ? extent / 2 : origin === 'right' || origin === 'bottom' ? extent : 0;
      const left = source.left - originOffset(source.originX, w);
      const top = source.top - originOffset(source.originY, h);
      const iw = 400, ih = iw * h / w;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iw}" height="${ih}"><rect fill="#e8e0f4" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8167a9" font-family="sans-serif" font-size="24">照片 ${++slots}</text></svg>`;
      objects.push({ type: 'image', version: '5.3.0', id: `${meta.id}-photo-${slots}`, originX: 'left', originY: 'top',
        left, top, width: iw, height: ih, scaleX: w / iw, scaleY: w / iw, angle: 0,
        opacity: source.opacity ?? 1, src: `data:image/svg+xml,${encodeURIComponent(svg)}`, crossOrigin: null,
        kidstoryRole: 'photoSlot', kidstoryPhotoFilled: false,
        kidstorySlotLeft: left, kidstorySlotTop: top, kidstorySlotW: w, kidstorySlotH: h,
        lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true,
        lockRotation: true, hasControls: false, selectable: true, evented: true });
      continue;
    }
    if (!['textbox', 'rect'].includes(source.type)) throw new Error(`Unsupported object: ${source.type}`);
    const obj = Object.fromEntries(PROPS.filter(k => source[k] !== undefined).map(k => [k, source[k]]));
    obj.type = source.type;
    obj.version = '5.3.0';
    obj.id = `${meta.id}-object-${objects.length}`;
    if (source.type === 'textbox') {
      Object.assign(obj, { fontFamily: FONT, styles: {}, editable: true, kidstoryRole: 'text' });
    } else {
      Object.assign(obj, { selectable: false, evented: false, kidstoryRole: 'decoration' });
    }
    objects.push(obj);
  }
  return { version: '5.3.0', objects, kidstoryTemplateBase: { width, height, aspectRatio: meta.aspectRatio } };
}
module.exports = { convertFotorTemplate };
