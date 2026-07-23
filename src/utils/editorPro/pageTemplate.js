import { fabric } from 'fabric'

/** 页面模版图层角色 */
export const KIDSTORY_ROLE = {
  PHOTO_SLOT: 'photoSlot',
  DECORATION: 'decoration',
}

const TEXT_TYPES = new Set(['text', 'i-text', 'textbox', 'path-text'])

export function isWorkspaceObject(obj) {
  if (!obj) return false
  return obj.id === 'workspace' || obj.name === 'workspace'
}

export function isEditableTextObject(obj) {
  if (!obj || isWorkspaceObject(obj)) return false
  if (TEXT_TYPES.has(obj.type)) return true
  return Boolean(obj.kidstoryRole === 'text' || obj.kidstoryEditableText)
}

export function isPhotoSlotObject(obj) {
  if (!obj || isWorkspaceObject(obj)) return false
  if (obj.type !== 'image') return false
  if (obj.kidstoryRole === KIDSTORY_ROLE.PHOTO_SLOT) return true
  if (obj.kidstorySlotW || obj.kidstorySlotH || obj.kidstoryPhotoFilled) return true
  if (Array.isArray(obj.strokeDashArray) && obj.strokeDashArray.length > 0) return true
  return false
}

/** 替换/填入前补全照片槽外框信息（兼容旧模版或元数据缺失） */
export function preparePhotoSlotForFill(obj) {
  if (!obj || obj.type !== 'image') return

  if (!obj.kidstorySlotW || !obj.kidstorySlotH) {
    const w = obj.width * (obj.scaleX || 1)
    const h = obj.height * (obj.scaleY || 1)
    obj.kidstorySlotLeft = obj.left
    obj.kidstorySlotTop = obj.top
    obj.kidstorySlotW = w
    obj.kidstorySlotH = h
  }

  ensurePhotoSlotFrameMeta(obj)
  obj.kidstoryRole = KIDSTORY_ROLE.PHOTO_SLOT
}

export function isFilledPhotoSlot(obj) {
  if (!obj || obj.type !== 'image') return false
  if (obj.kidstoryPhotoFilled) return true
  const src = obj.originSrc || obj.src
  if (!src || typeof src !== 'string') return false
  return !src.startsWith('data:image/svg+xml')
}

/** 照片槽固定外框（画布坐标） */
export function getPhotoSlotFrame(obj) {
  return {
    left: obj.kidstorySlotLeft ?? obj.left ?? 0,
    top: obj.kidstorySlotTop ?? obj.top ?? 0,
    width: obj.kidstorySlotW ?? obj.width * (obj.scaleX || 1),
    height: obj.kidstorySlotH ?? obj.height * (obj.scaleY || 1),
  }
}

export function ensurePhotoSlotFrameMeta(obj) {
  if (!obj?.kidstorySlotW || !obj?.kidstorySlotH) return
  if (obj.kidstorySlotLeft == null) obj.kidstorySlotLeft = obj.left
  if (obj.kidstorySlotTop == null) obj.kidstorySlotTop = obj.top
}

export function createPhotoSlotClipPath(frame) {
  return new fabric.Rect({
    left: frame.left,
    top: frame.top,
    width: frame.width,
    height: frame.height,
    absolutePositioned: true,
    originX: 'left',
    originY: 'top',
  })
}

/** 等比 cover：铺满槽位且不变形 */
export function computeCoverFit(frame, imgW, imgH) {
  const scale = Math.max(frame.width / imgW, frame.height / imgH)
  const displayW = imgW * scale
  const displayH = imgH * scale
  return {
    scale,
    left: frame.left + (frame.width - displayW) / 2,
    top: frame.top + (frame.height - displayH) / 2,
  }
}

function getImageNaturalSize(obj) {
  const el = typeof obj.getElement === 'function' ? obj.getElement() : obj._element
  return {
    width: el?.naturalWidth || obj.width,
    height: el?.naturalHeight || obj.height,
  }
}

/** 空槽位：对齐到模版框位置，占位图等比缩放铺满 */
export function syncEmptyPhotoSlotPosition(obj) {
  if (!obj?.kidstorySlotW || !obj?.kidstorySlotH) return
  ensurePhotoSlotFrameMeta(obj)
  obj.set({
    left: obj.kidstorySlotLeft,
    top: obj.kidstorySlotTop,
  })
  obj.setCoords?.()
}

export function normalizePhotoSlotPlaceholder(obj) {
  if (!obj || obj.type !== 'image' || isFilledPhotoSlot(obj)) return

  const slotW = obj.kidstorySlotW
  const slotH = obj.kidstorySlotH
  if (!slotW || !slotH) return

  syncEmptyPhotoSlotPosition(obj)

  const { width: naturalW, height: naturalH } = getImageNaturalSize(obj)
  if (!naturalW || !naturalH) return

  const scale = Math.max(slotW / naturalW, slotH / naturalH)

  obj.set({
    scaleX: scale,
    scaleY: scale,
    clipPath: undefined,
    objectCaching: false,
  })
  clampPhotoSlotPan(obj)
}

/** 拖动时限制在槽位内，保证始终 cover 住外框 */
export function clampPhotoSlotPan(obj) {
  if (!obj) return
  const frame = getPhotoSlotFrame(obj)
  const w = obj.width * (obj.scaleX || 1)
  const h = obj.height * (obj.scaleY || 1)

  let left = obj.left
  let top = obj.top

  if (w > frame.width + 0.5) {
    left = Math.min(frame.left, Math.max(frame.left + frame.width - w, left))
  } else {
    left = frame.left + (frame.width - w) / 2
  }

  if (h > frame.height + 0.5) {
    top = Math.min(frame.top, Math.max(frame.top + frame.height - h, top))
  } else {
    top = frame.top + (frame.height - h) / 2
  }

  if (Math.abs(left - obj.left) > 0.01 || Math.abs(top - obj.top) > 0.01) {
    obj.set({ left, top })
    obj.setCoords?.()
  }
}

function enforceUniformPhotoScale(obj) {
  if (!obj || obj.type !== 'image') return
  const sx = obj.scaleX || 1
  const sy = obj.scaleY || 1
  if (Math.abs(sx - sy) < 0.001) return
  const scale = Math.max(sx, sy)
  obj.set({ scaleX: scale, scaleY: scale })
}

/** 已填图：等比 cover + 裁剪 + 可拖动 */
export function applyFilledPhotoSlotLayout(obj, imgW, imgH) {
  ensurePhotoSlotFrameMeta(obj)
  const frame = getPhotoSlotFrame(obj)
  const fit = computeCoverFit(frame, imgW, imgH)

  obj.set({
    left: fit.left,
    top: fit.top,
    scaleX: fit.scale,
    scaleY: fit.scale,
    clipPath: createPhotoSlotClipPath(frame),
    objectCaching: false,
    lockMovementX: false,
    lockMovementY: false,
    hasControls: false,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    stroke: null,
    strokeWidth: 0,
    strokeDashArray: null,
    hoverCursor: 'move',
    moveCursor: 'move',
  })
  clampPhotoSlotPan(obj)
}

function applyPhotoSlotCommonBehavior(obj, { filled = false } = {}) {
  obj.set({
    kidstoryRole: KIDSTORY_ROLE.PHOTO_SLOT,
    selectable: true,
    evented: true,
    lockMovementX: filled ? false : true,
    lockMovementY: filled ? false : true,
    hasControls: false,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
  })
}

function applyFilledPhotoSlotFromObject(obj) {
  const { width: iw, height: ih } = getImageNaturalSize(obj)
  if (!iw || !ih) return false
  applyFilledPhotoSlotLayout(obj, iw, ih)
  applyPhotoSlotCommonBehavior(obj, { filled: true })
  return true
}

function applyEmptyPhotoSlotFromObject(obj) {
  syncEmptyPhotoSlotPosition(obj)
  normalizePhotoSlotPlaceholder(obj)
  obj.set({
    clipPath: undefined,
    stroke: '#8167a9',
    strokeWidth: 2,
    strokeDashArray: [6, 4],
    kidstoryPhotoFilled: false,
  })
  applyPhotoSlotCommonBehavior(obj, { filled: false })
}

/** 限制照片槽拖动范围（EditorPro 初始化时挂载） */
export function installPhotoSlotPanConstraint(canvas) {
  if (!canvas?.on) return () => {}

  const onMoving = (e) => {
    const obj = e.target
    if (obj?.kidstoryRole === KIDSTORY_ROLE.PHOTO_SLOT && isFilledPhotoSlot(obj)) {
      enforceUniformPhotoScale(obj)
      clampPhotoSlotPan(obj)
    }
  }

  const onModified = (e) => {
    const obj = e.target
    if (obj?.kidstoryRole === KIDSTORY_ROLE.PHOTO_SLOT && isFilledPhotoSlot(obj)) {
      enforceUniformPhotoScale(obj)
      clampPhotoSlotPan(obj)
      canvas.requestRenderAll()
    }
  }

  const onScaling = (e) => {
    const obj = e.target
    if (obj?.kidstoryRole === KIDSTORY_ROLE.PHOTO_SLOT && isFilledPhotoSlot(obj)) {
      enforceUniformPhotoScale(obj)
      clampPhotoSlotPan(obj)
    }
  }

  canvas.on('object:moving', onMoving)
  canvas.on('object:modified', onModified)
  canvas.on('object:scaling', onScaling)

  return () => {
    canvas.off('object:moving', onMoving)
    canvas.off('object:modified', onModified)
    canvas.off('object:scaling', onScaling)
  }
}

/** 载入模版后：照片槽可替换、文字可编辑、其余装饰锁定 */
export function applyPageTemplateBehavior(canvas) {
  if (!canvas) return

  canvas.getObjects().forEach((obj) => {
    if (isWorkspaceObject(obj)) return

    if (isEditableTextObject(obj)) {
      obj.set({
        kidstoryRole: 'text',
        selectable: true,
        evented: true,
        editable: true,
        lockMovementX: false,
        lockMovementY: false,
        hasControls: true,
      })
      return
    }

    if (obj.type === 'image' && (obj.kidstoryRole === KIDSTORY_ROLE.PHOTO_SLOT || obj.kidstorySlotW)) {
      ensurePhotoSlotFrameMeta(obj)
      if (isFilledPhotoSlot(obj)) {
        applyFilledPhotoSlotFromObject(obj)
      } else {
        applyEmptyPhotoSlotFromObject(obj)
      }
      return
    }

    if (obj.type === 'image') {
      obj.set({
        kidstoryRole: KIDSTORY_ROLE.PHOTO_SLOT,
        selectable: true,
        evented: true,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
      })
      return
    }

    obj.set({
      kidstoryRole: KIDSTORY_ROLE.DECORATION,
      selectable: false,
      evented: false,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
    })
  })

  canvas.requestRenderAll()

  const recheckSlots = () => {
    canvas.getObjects().forEach((obj) => {
      if (obj.type !== 'image' || !obj.kidstorySlotW) return
      ensurePhotoSlotFrameMeta(obj)
      if (isFilledPhotoSlot(obj)) {
        applyFilledPhotoSlotFromObject(obj)
      } else if (!obj.kidstoryPhotoFilled) {
        applyEmptyPhotoSlotFromObject(obj)
      }
    })
    canvas.requestRenderAll()
  }
  requestAnimationFrame(recheckSlots)
  setTimeout(recheckSlots, 120)
}

export function pickLocalImageFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    }
    input.click()
  })
}

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 将图片填入照片槽：等比 cover，可拖动取景 */
export async function fillPhotoSlotObject(activeObject, imageSrc, canvas) {
  if (!activeObject || !canvas || activeObject.type !== 'image') {
    throw new Error('invalid photo slot')
  }

  ensurePhotoSlotFrameMeta(activeObject)
  preparePhotoSlotForFill(activeObject)
  const frame = getPhotoSlotFrame(activeObject)
  activeObject.kidstoryPhotoFilled = true

  const img = await loadImageElement(imageSrc)

  await new Promise((resolve, reject) => {
    activeObject.setSrc(
      img.src,
      () => {
        activeObject.set({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          originSrc: img.src,
          kidstoryPhotoFilled: true,
          kidstorySlotLeft: frame.left,
          kidstorySlotTop: frame.top,
          kidstorySlotW: frame.width,
          kidstorySlotH: frame.height,
        })
        applyFilledPhotoSlotLayout(activeObject, img.naturalWidth || img.width, img.naturalHeight || img.height)
        applyPhotoSlotCommonBehavior(activeObject, { filled: true })
        canvas.setActiveObject(activeObject)
        canvas.requestRenderAll()
        resolve()
      },
      { crossOrigin: 'anonymous' }
    )
  })

  img.remove?.()
}
