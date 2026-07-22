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
  if (obj.kidstoryRole === KIDSTORY_ROLE.PHOTO_SLOT) return true
  if (obj.type === 'image') return true
  return false
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

    if (obj.type === 'image') {
      obj.set({
        kidstoryRole: KIDSTORY_ROLE.PHOTO_SLOT,
        selectable: true,
        evented: true,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        stroke: '#8167a9',
        strokeWidth: 2,
        strokeDashArray: [6, 4],
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

/** 将图片填入照片槽，保持槽位尺寸 */
export async function fillPhotoSlotObject(activeObject, imageSrc, canvas) {
  if (!activeObject || !canvas || activeObject.type !== 'image') {
    throw new Error('invalid photo slot')
  }

  const img = await loadImageElement(imageSrc)
  const slotW = activeObject.width * (activeObject.scaleX || 1)
  const slotH = activeObject.height * (activeObject.scaleY || 1)

  await new Promise((resolve, reject) => {
    activeObject.setSrc(img.src, () => {
      activeObject.set({
        scaleX: slotW / img.width,
        scaleY: slotH / img.height,
        originSrc: img.src,
        stroke: '#8167a9',
        strokeWidth: 2,
        strokeDashArray: [6, 4],
      })
      canvas.requestRenderAll()
      resolve()
    }, { crossOrigin: 'anonymous' })
  })

  img.remove?.()
}
