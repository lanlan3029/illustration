import { shallowRef } from 'vue'
import { fillPhotoSlotObject, isPhotoSlotObject } from '@/utils/editorPro/pageTemplate'

/** 当前选中的模版照片槽（fabric 对象） */
export const activePhotoSlot = shallowRef(null)

export function resolveIllustrationUrl(content) {
  if (!content) return ''
  const c = String(content).trim()
  if (c.startsWith('http://') || c.startsWith('https://') || c.startsWith('data:') || c.startsWith('blob:')) {
    return c
  }
  return `https://static.kidstory.cc/${c.replace(/^\/+/, '')}`
}

export function syncActivePhotoSlotFromCanvas(canvas) {
  if (!canvas) {
    activePhotoSlot.value = null
    return
  }
  const active = canvas.getActiveObject()
  activePhotoSlot.value = isPhotoSlotObject(active) ? active : null
}

export function installPhotoSlotSelectionSync(canvasEditor) {
  if (!canvasEditor?.on || !canvasEditor?.canvas) return () => {}
  const sync = () => syncActivePhotoSlotFromCanvas(canvasEditor.canvas)
  canvasEditor.on('selectOne', sync)
  canvasEditor.on('selectCancel', sync)
  sync()
  return () => {
    canvasEditor.off?.('selectOne', sync)
    canvasEditor.off?.('selectCancel', sync)
  }
}

/** 若有选中照片槽则填入图片，返回是否已处理 */
export async function tryFillActivePhotoSlot(imageSrc, canvasEditor) {
  const slot = activePhotoSlot.value
  if (!slot || !imageSrc || !canvasEditor?.canvas) return false
  try {
    await fillPhotoSlotObject(slot, imageSrc, canvasEditor.canvas)
    return true
  } catch {
    return false
  }
}

/**
 * 点击「我的作品」图片：优先填入照片槽，否则添加到画布
 * @returns {'filled'|'added'|'failed'}
 */
export async function insertWorkImageOrAddToCanvas(imageSrc, canvasEditor, loadImageEl) {
  if (!imageSrc || !canvasEditor) return 'failed'

  if (activePhotoSlot.value) {
    const filled = await tryFillActivePhotoSlot(imageSrc, canvasEditor)
    return filled ? 'filled' : 'failed'
  }

  try {
    const image = await loadImageEl(imageSrc)
    const imgItem = await canvasEditor.createImgByElement(image)
    canvasEditor.addBaseType(imgItem, { scale: true })
    return 'added'
  } catch {
    return 'failed'
  }
}
