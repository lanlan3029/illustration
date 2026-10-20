import { fabric } from 'fabric'

export function setDesignTransform(object, matrix) {
  const d = fabric.util.qrDecompose(matrix)
  object.set({ originX: 'center', originY: 'center', left: d.translateX, top: d.translateY,
    angle: d.angle, scaleX: Math.abs(d.scaleX), scaleY: Math.abs(d.scaleY),
    flipX: d.scaleX < 0, flipY: d.scaleY < 0, skewX: d.skewX, skewY: 0 })
  object.setCoords()
}

export function configureDesignPhotoSlot(object) {
  object.set({ selectable: true, evented: true, hasControls: false,
    lockScalingX: true, lockScalingY: true, lockRotation: true,
    lockMovementX: !object.kidstoryPhotoFilled, lockMovementY: !object.kidstoryPhotoFilled,
    objectCaching: false, hoverCursor: object.kidstoryPhotoFilled ? 'move' : 'pointer' })
}

export function constrainDesignPhotoSlot(object) {
  const frame = object?.kidstoryDesignFrame
  if (!frame || !object.kidstoryPhotoFilled) return
  const inverse = fabric.util.invertTransform(frame.matrix)
  const local = fabric.util.multiplyTransformMatrices(inverse, object.calcOwnMatrix())
  const w = object.width * Math.abs(local[0]), h = object.height * Math.abs(local[3])
  const dx = Math.max(0, (w - frame.width) / 2), dy = Math.max(0, (h - frame.height) / 2)
  const x = Math.max(-dx, Math.min(dx, local[4])), y = Math.max(-dy, Math.min(dy, local[5]))
  setDesignTransform(object, fabric.util.multiplyTransformMatrices(frame.matrix,
    [local[0], 0, 0, local[3], x, y]))
}

// Absolute clipPath is independent of the photo. Replacing and panning only
// change the image transform, so rotated frames and arbitrary masks stay fixed.
export async function fillDesignPhotoSlot(object, src, canvas) {
  const image = await new Promise((resolve, reject) => {
    const el = new Image()
    if (!src.startsWith('data:') && !src.startsWith('blob:')) el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('图片读取失败'))
    el.src = src
  })
  const frame = object.kidstoryDesignFrame
  const width = image.naturalWidth, height = image.naturalHeight
  const scale = Math.max(frame.width / width, frame.height / height)
  object.setElement(image)
  object.set({ width, height, cropX: 0, cropY: 0, originSrc: src, kidstoryPhotoFilled: true })
  setDesignTransform(object, fabric.util.multiplyTransformMatrices(frame.matrix, [scale, 0, 0, scale, 0, 0]))
  configureDesignPhotoSlot(object)
  canvas.setActiveObject?.(object)
  canvas.requestRenderAll()
  canvas.fire('object:modified', { target: object })
}
