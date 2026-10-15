import { fabric } from 'fabric'
import { v4 as uuid } from 'uuid'
import { layoutCells, cellPath, shapePath, imagePlacement, clamp } from '@/utils/collage/renderer'
import { SvgPath } from '@/utils/collage/svgPath'

export const COLLAGE_CHANGED = 'collage:changed'
const frameEditing = new WeakSet()
const DEFAULT_SETTINGS = { spacing: 10, border: 10, radius: 0, background: '#ffffff', mode: 'single', slides: 1 }

// A logical group of independent Fabric images: each photo remains directly editable.
// Metadata lives on a transparent layout controller, never on an opaque background.
export function collageRoots(canvas) {
  return canvas.getObjects().filter(obj => obj.kidstoryCollage?.schema === 1)
}

export function collageSlots(canvas, root) {
  return canvas.getObjects().filter(obj => obj.kidstoryCollageId === root.id && obj.type === 'image')
    .sort((a,b) => a.kidstoryCollageIndex-b.kidstoryCollageIndex)
}

export function rootForSlot(canvas, slot) {
  return collageRoots(canvas).find(root => root.id === slot?.kidstoryCollageId)
}

function fabricClip(path) {
  return new fabric.Path(path.toString(), { absolutePositioned: true, fill: '#000', strokeWidth: 0, selectable: false, evented: false })
}

function workspaceFrame(editor) {
  const ws=editor.getWorkspase()
  return { left: ws.left || 0, top: ws.top || 0, width: ws.width*(ws.scaleX||1), height: ws.height*(ws.scaleY||1) }
}

export function collageFrame(editor, root) {
  const ws=workspaceFrame(editor), frame=root.kidstoryCollage.frame||{x:0,y:0,width:1,height:1}
  return {left:ws.left+frame.x*ws.width,top:ws.top+frame.y*ws.height,width:ws.width*frame.width,height:ws.height*frame.height}
}

export function setCollageFrame(editor, root, frame) {
  const old=root.kidstoryCollage.frame||{x:0,y:0,width:1,height:1}
  root.kidstoryCollage={...root.kidstoryCollage,frame:{...old,...frame}}
  reflowCollage(editor,root);notify(editor,root)
}

export function scaleCollageFrame(editor, root, scale) {
  const old=root.kidstoryCollage.frame||{x:0,y:0,width:1,height:1}
  const next=clamp(Number(scale),.1,2), ratio=old.width/old.height
  const width=next,height=next/ratio
  setCollageFrame(editor,root,{x:old.x+(old.width-width)/2,y:old.y+(old.height-height)/2,width,height})
}

export function editCollageFrame(editor, root, enabled) {
  if(enabled)frameEditing.add(root)
  else frameEditing.delete(root)
  reflowCollage(editor,root)
  if(enabled)editor.canvas.setActiveObject(root)
  else {
    editor.canvas.discardActiveObject()
    const slot=collageSlots(editor.canvas,root)[0]
    if(slot)editor.canvas.setActiveObject(slot)
  }
  root.setControlsVisibility?.({mtr:false,lock:false})
  editor.canvas.fire(COLLAGE_CHANGED)
}

export function isEditingCollageFrame(root) { return frameEditing.has(root) }

function photoTransform(slot) {
  return { ...slot.kidstoryCollagePhoto, zoom: clamp(slot.kidstoryCollagePhoto?.zoom || 1,1,4), panX: clamp(slot.kidstoryCollagePhoto?.panX || 0,-1,1), panY: clamp(slot.kidstoryCollagePhoto?.panY || 0,-1,1) }
}

export function setPhotoFreeMove(editor,slot,enabled) {
  const frame={x:slot.kidstorySlotLeft,y:slot.kidstorySlotTop,width:slot.kidstorySlotW,height:slot.kidstorySlotH}
  const cx=frame.x+(frame.width-slot.width*slot.scaleX)/2,cy=frame.y+(frame.height-slot.height*slot.scaleY)/2
  slot.kidstoryCollagePhoto={...photoTransform(slot),freeMove:enabled,offsetX:(slot.left-cx)/frame.width,offsetY:(slot.top-cy)/frame.height}
  if(!enabled)capturePan(slot)
  reflowCollagePhoto(editor,slot);notify(editor,slot)
}

function offsetCell(cell, frame) {
  return { ...cell, x: cell.x+frame.left, y: cell.y+frame.top,
    points: cell.points?.map(p => ({ x: p.x+frame.left, y: p.y+frame.top })) }
}

function applySlot(slot, cell, radius, template, frame, border) {
  const element=slot.getElement()
  const width=element.naturalWidth||element.width, height=element.naturalHeight||element.height
  const position=imagePlacement({ element:{width,height}, ...photoTransform(slot) },cell)
  const scale=position.width/width
  const clip=fabricClip(cellPath(cell,radius,new SvgPath()))
  if (template.clipShape) {
    clip.clipPath=fabricClip(shapePath(template.clipShape,frame.left+border,frame.top+border,frame.width-2*border,frame.height-2*border,new SvgPath()))
  }
  slot.set({
    left: position.x, top: position.y, width, height,
    scaleX: scale, scaleY: scale,
    originX: 'left', originY: 'top', angle: 0, skewX: 0, skewY: 0,
    clipPath: clip, objectCaching: false, perPixelTargetFind: true,
    kidstoryRole: 'photoSlot', kidstorySlotLeft: cell.x, kidstorySlotTop: cell.y, kidstorySlotW: cell.width, kidstorySlotH: cell.height,
    hasControls: false, lockScalingX: true, lockScalingY: true, lockRotation: true, lockMovementX: false, lockMovementY: false,
    selectable: true, evented: true, strokeWidth: 0, hoverCursor: 'move', moveCursor: 'move',
  })
  slot.setCoords()
}

export function reflowCollage(editor, root, preserveRoot = false) {
  if (!root?.kidstoryCollage) return
  const { template, settings }=root.kidstoryCollage
  const frame=collageFrame(editor,root),editing=frameEditing.has(root)
  const factor=Math.min(frame.width,frame.height)/1080
  const border=settings.border*factor
  const cells=layoutCells(template,frame.width,frame.height,settings.spacing*factor,border)
  if(!preserveRoot)root.set({ left:frame.left,top:frame.top,width:frame.width,height:frame.height,scaleX:1,scaleY:1,fill:'rgba(0,0,0,0)',
    originX:'left',originY:'top',selectable:editing,evented:editing,hasControls:editing,strokeWidth:0,
    lockMovementX:!editing,lockMovementY:!editing,lockScalingX:!editing,lockScalingY:!editing,lockRotation:true,lockScalingFlip:true,kidstoryRole:'decoration' })
  root.setCoords()
  for (const slot of collageSlots(editor.canvas,root)) {
    const cell=cells[slot.kidstoryCollageIndex]
    if (cell) applySlot(slot,offsetCell(cell,frame),settings.radius*factor,template,frame,border)
    slot.evented=!editing;slot.selectable=!editing
  }
  if(editing)root.setControlsVisibility?.({mtr:false,lock:false})
  editor.canvas.requestRenderAll()
}

function notify(editor, target, modified = true) {
  if (modified) editor.canvas.fire('object:modified',{target})
  editor.canvas.fire(COLLAGE_CHANGED)
}

export function updateCollage(editor, root, patch) {
  if(patch.background)editor.getWorkspase().set({fill:patch.background})
  // Replace metadata, never mutate an object held by a history snapshot.
  root.kidstoryCollage={ ...root.kidstoryCollage, settings:{...root.kidstoryCollage.settings,...patch} }
  reflowCollage(editor,root)
  notify(editor,root)
}

export function switchCollageTemplate(editor, root, template) {
  const slots=collageSlots(editor.canvas,root)
  if (template.cells.length !== slots.length) throw new Error('请选择照片数量相同的模板')
  root.kidstoryCollage={...root.kidstoryCollage,template:JSON.parse(JSON.stringify(template))}
  reflowCollage(editor,root);notify(editor,root)
}

export function zoomCollagePhoto(editor, slot, zoom) {
  slot.kidstoryCollagePhoto={...photoTransform(slot),zoom:clamp(Number(zoom),1,4)}
  reflowCollagePhoto(editor,slot);notify(editor,slot)
}

export function resetCollagePhoto(editor, slot) {
  slot.kidstoryCollagePhoto={zoom:1,panX:0,panY:0}
  reflowCollagePhoto(editor,slot);notify(editor,slot)
}

function reflowCollagePhoto(editor, slot) {
  const root=rootForSlot(editor.canvas,slot)
  if(root){reflowCollage(editor,root);return}
  // Keep photos editable in old drafts whose former backdrop was deleted.
  const element=slot.getElement(),width=element.naturalWidth||element.width,height=element.naturalHeight||element.height
  const cell={x:slot.kidstorySlotLeft??slot.left,y:slot.kidstorySlotTop??slot.top,width:slot.kidstorySlotW||slot.width*slot.scaleX,height:slot.kidstorySlotH||slot.height*slot.scaleY}
  const position=imagePlacement({element:{width,height},...photoTransform(slot)},cell),scale=position.width/width
  slot.set({left:position.x,top:position.y,width,height,scaleX:scale,scaleY:scale,selectable:true,evented:true,hasControls:false,lockMovementX:false,lockMovementY:false,lockScalingX:true,lockScalingY:true,lockRotation:true,objectCaching:false})
  slot.setCoords();editor.canvas.requestRenderAll()
}

function capturePan(slot) {
  const frame={x:slot.kidstorySlotLeft,y:slot.kidstorySlotTop,width:slot.kidstorySlotW,height:slot.kidstorySlotH}
  const excessX=slot.width*slot.scaleX-frame.width, excessY=slot.height*slot.scaleY-frame.height
  if(slot.kidstoryCollagePhoto?.freeMove){slot.kidstoryCollagePhoto={...photoTransform(slot),offsetX:(slot.left-frame.x+excessX/2)/frame.width,offsetY:(slot.top-frame.y+excessY/2)/frame.height};return}
  slot.kidstoryCollagePhoto={...photoTransform(slot),panX:excessX>.01?clamp(2*(frame.x-slot.left)/excessX-1,-1,1):0,panY:excessY>.01?clamp(2*(frame.y-slot.top)/excessY-1,-1,1):0}
}

function loadImage(src) {
  return new Promise((resolve,reject) => {
    const element=new Image()
    if(!src.startsWith('data:')&&!src.startsWith('blob:'))element.crossOrigin='anonymous'
    element.onload=()=>resolve(element)
    element.onerror=()=>reject(new Error('照片读取失败'))
    element.src=src
  })
}

function placeholder(index) {
  const canvas=document.createElement('canvas');canvas.width=400;canvas.height=400
  const ctx=canvas.getContext('2d');ctx.fillStyle=['#d8cdea','#bcded4','#f2d9b8','#c9dcec'][index%4];ctx.fillRect(0,0,400,400)
  ctx.fillStyle='#625777';ctx.font='48px sans-serif';ctx.textAlign='center';ctx.fillText(String(index+1),200,220)
  return canvas.toDataURL('image/png')
}

export async function importEditableCollage(editor, payload) {
  if (payload.schema!==1||!Array.isArray(payload.template?.cells)||payload.template.cells.length>25) throw new Error('无效的拼图模板')
  const template=JSON.parse(JSON.stringify(payload.template))
  const settings={...DEFAULT_SETTINGS,...payload.settings}
  // Decode everything before modifying the canvas; one bad photo must not leave half an import.
  const photos=await Promise.all(template.cells.map(async(_,i)=>{
    const photo=payload.images?.[i],src=photo?.src||placeholder(i)
    return { element:await loadImage(src),src,photo }
  }))
  const root=new fabric.Rect({ id:uuid(),name:'可编辑拼图',kidstoryCollage:{schema:1,template,settings},strokeWidth:0 })
  const slots=photos.map(({element,src,photo},i)=>new fabric.Image(element,{
    id:uuid(),name:`拼图照片 ${i+1}`,originSrc:src,kidstoryCollageId:root.id,kidstoryCollageIndex:i,
    kidstoryCollagePhoto:{zoom:photo?.zoom||1,panX:photo?.panX||0,panY:photo?.panY||0},kidstoryPhotoFilled:Boolean(photo),
  }))
  editor.canvas.discardActiveObject()
  editor.canvas.add(root,...slots)
  reflowCollage(editor,root)
  editor.canvas.setActiveObject(slots[0])
  notify(editor,root)
  return root
}

export async function replaceCollagePhoto(editorOrCanvas, slot, src) {
  const canvas=editorOrCanvas.canvas||editorOrCanvas
  const element=await loadImage(src)
  slot.setElement(element)
  slot.originSrc=src;slot.kidstoryPhotoFilled=true
  slot.kidstoryCollagePhoto={zoom:1,panX:0,panY:0}
  // The runtime listener owns the editor and geometry, including irregular clip paths.
  canvas.fire('collage:replace',{target:slot})
  canvas.setActiveObject(slot);canvas.fire('object:modified',{target:slot});canvas.requestRenderAll()
}

export function installCollageSlots(editor) {
  const canvas=editor.canvas
  const refresh=()=>{collageRoots(canvas).forEach(root=>reflowCollage(editor,root));canvas.fire(COLLAGE_CHANGED)}
  const onSizeChange=()=>{
    const roots=collageRoots(canvas)
    const changed=roots.some(root=>{const frame=collageFrame(editor,root);return root.width!==frame.width||root.height!==frame.height})
    refresh()
    if(changed)canvas.fire('object:modified',{target:editor.getWorkspase()})
  }
  const onMoving=({target})=>{
    if(target?.kidstoryCollageId&&target.type==='image')capturePan(target)
    if(target?.kidstoryCollage&&frameEditing.has(target)) {
      const ws=workspaceFrame(editor)
      target.kidstoryCollage={...target.kidstoryCollage,frame:{x:(target.left-ws.left)/ws.width,y:(target.top-ws.top)/ws.height,width:Math.max(.05,target.width*target.scaleX/ws.width),height:Math.max(.05,target.height*target.scaleY/ws.height)}}
      reflowCollage(editor,target,true)
      canvas.fire(COLLAGE_CHANGED)
    }
  }
  const onReplace=({target})=>{reflowCollagePhoto(editor,target);canvas.fire(COLLAGE_CHANGED)}
  const onSelection=()=>{
    const slot=canvas.getActiveObject?.()
    if(!slot?.kidstoryCollageId||slot.type!=='image')return
    const root=rootForSlot(canvas,slot)
    // Layer-list selection explicitly means photo editing, even during frame editing.
    if(root)frameEditing.delete(root)
    reflowCollagePhoto(editor,slot)
    canvas.fire(COLLAGE_CHANGED)
  }
  const onModified=({target}={})=>{if(target?.kidstoryCollage)reflowCollage(editor,target);canvas.fire(COLLAGE_CHANGED)}
  const onRemoved=()=>canvas.fire(COLLAGE_CHANGED)
  editor.on('sizeChange',onSizeChange);editor.on('loadJson',refresh)
  canvas.on('object:moving',onMoving);canvas.on('object:modified',onModified);canvas.on('object:removed',onRemoved)
  canvas.on('object:scaling',onMoving)
  canvas.on('selection:created',onSelection);canvas.on('selection:updated',onSelection)
  canvas.on('history:undo',refresh);canvas.on('history:redo',refresh);canvas.on('collage:replace',onReplace)
  return ()=>{
    editor.off('sizeChange',onSizeChange);editor.off('loadJson',refresh)
    canvas.off('object:moving',onMoving);canvas.off('object:modified',onModified);canvas.off('object:removed',onRemoved)
    canvas.off('object:scaling',onMoving)
    canvas.off('selection:created',onSelection);canvas.off('selection:updated',onSelection)
    canvas.off('history:undo',refresh);canvas.off('history:redo',refresh);canvas.off('collage:replace',onReplace)
  }
}
