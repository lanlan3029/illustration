/** 照片槽占位图（SVG data URL） */
export function photoPlaceholder(label = '照片') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#e8e0f4" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8167a9" font-size="24" font-family="sans-serif">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const CANVAS_W = 900
export const CANVAS_H = 1200

export function workspaceObject() {
  return {
    type: 'rect',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width: CANVAS_W,
    height: CANVAS_H,
    fill: 'rgba(255,255,255,1)',
    stroke: null,
    strokeWidth: 0,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    visible: true,
    id: 'workspace',
    selectable: false,
    hasControls: false,
    evented: false,
  }
}

export function photoSlot({ left, top, width, height, label = '照片' }) {
  return {
    type: 'image',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left,
    top,
    width,
    height,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    visible: true,
    src: photoPlaceholder(label),
    crossOrigin: null,
    kidstoryRole: 'photoSlot',
  }
}

export function editableText({ left, top, width, text, fontSize = 36, textAlign = 'center' }) {
  return {
    type: 'textbox',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left,
    top,
    width,
    fill: '#333333',
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    opacity: 1,
    visible: true,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontSize,
    text,
    textAlign,
    lineHeight: 1.2,
    editable: true,
    kidstoryRole: 'text',
  }
}

export function decorationRect({ left, top, width, height, fill = '#8167a9' }) {
  return {
    type: 'rect',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left,
    top,
    width,
    height,
    fill,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    selectable: false,
    evented: false,
    kidstoryRole: 'decoration',
  }
}

export function buildTemplate(objects) {
  return {
    version: '5.3.0',
    objects: [workspaceObject(), ...objects],
  }
}
