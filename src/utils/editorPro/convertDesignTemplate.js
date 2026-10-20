import { fabric } from 'fabric'
import { opaquePaperColor } from './designTemplateCompatibility.cjs'
import { setDesignTransform, configureDesignPhotoSlot } from './designPhotoSlots'

const FONT = 'Arial, "Microsoft YaHei", sans-serif'
const IDENTITY = [1, 0, 0, 1, 0, 0]
const svgCache = new Map()
const multiply = fabric.util.multiplyTransformMatrices
const clone = value => JSON.parse(JSON.stringify(value))
const PROPS = ['left', 'top', 'width', 'height', 'originX', 'originY', 'scaleX', 'scaleY',
  'angle', 'flipX', 'flipY', 'skewX', 'skewY', 'opacity', 'fill', 'stroke', 'strokeWidth',
  'strokeDashArray', 'strokeLineCap', 'strokeLineJoin', 'fillRule', 'shadow', 'rx', 'ry',
  'radius', 'path', 'points', 'x1', 'x2', 'y1', 'y2', 'text', 'fontSize', 'fontWeight',
  'fontStyle', 'textAlign', 'lineHeight', 'charSpacing', 'underline', 'linethrough', 'overline', 'styles']
function disableCaching(object) {
  object.objectCaching = false
  object.getObjects?.().forEach(disableCaching)
}

function properties(source) {
  const result = Object.fromEntries(PROPS.filter(k => source[k] != null).map(k => [k, clone(source[k])]))
  result.version = '5.3.0'
  result.objectCaching = false
  if (result.fill && typeof result.fill === 'object') {
    const gradient = result.fill
    gradient.colorStops?.forEach(stop => { stop.offset = Number(stop.offset) })
    const c = gradient.coords
    if (c && c.x1 === c.x2 && c.y1 === c.y2) {
      const angle = (gradient.angle || 0) * Math.PI / 180
      gradient.coords = { x1: .5 - Math.cos(angle) / 2, y1: .5 - Math.sin(angle) / 2,
        x2: .5 + Math.cos(angle) / 2, y2: .5 + Math.sin(angle) / 2 }
    }
  }
  return result
}

function matrixOf(source) { return new fabric.Object(properties(source)).calcOwnMatrix() }
function enliven(json) {
  return new Promise((resolve, reject) => {
    try {
      fabric.util.enlivenObjects([json], objects => objects[0] ? resolve(objects[0]) : reject(new Error('对象无法载入')))
    } catch (e) { reject(e) }
  })
}
function imageFromURL(url) {
  if (!url.startsWith('/editor-design-templates/assets/') && !url.startsWith('data:image/')) throw new Error('非本地模板资源')
  return new Promise((resolve, reject) => fabric.Image.fromURL(url,
    (image, error) => error || !image?.width ? reject(new Error(`图片无法载入：${url}`)) : resolve(image), { crossOrigin: 'anonymous' }))
}

async function svgText(source) {
  const url = source.sourcePath || source.clipSvgUrl
  if (!url?.startsWith('/editor-design-templates/assets/')) throw new Error('缺少本地 SVG')
  if (!svgCache.has(url)) {
    svgCache.set(url, fetch(url).then(async response => {
      if (!response.ok) throw new Error(`SVG 无法载入：${url}`)
      return response.text()
    }))
  }
  let text = await svgCache.get(url)
  const document = new DOMParser().parseFromString(text, 'image/svg+xml')
  if (document.querySelector('parsererror')) throw new Error(`SVG 格式错误：${url}`)
  document.querySelectorAll('script, foreignObject').forEach(node => node.remove())
  document.querySelectorAll('*').forEach(node => {
    for (const attribute of [...node.attributes]) {
      if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name)
      if (/(?:^|:)href$/i.test(attribute.name) && !attribute.value.startsWith('#') && !attribute.value.startsWith('data:image/')) {
        throw new Error(`SVG 包含外部资源：${url}`)
      }
    }
  })
  const nodes = [...document.querySelectorAll('*')]
  for (const replacement of source.fills || []) {
    const id = replacement.id?.toLowerCase()
    if (!id || typeof replacement.fill !== 'string') continue
    for (const node of nodes) {
      const matchesId = node.id?.toLowerCase() === id || [...(node.classList || [])].some(c => c.toLowerCase() === id)
      const matchesColor = /^c[\da-f]{6}$/i.test(id) && node.getAttribute('fill')?.toLowerCase() === '#' + id.slice(1)
      if (matchesId || matchesColor) {
        node.setAttribute('fill', replacement.fill)
        node.style.setProperty('fill', replacement.fill)
      }
    }
    if (/^c[\da-f]{6}$/i.test(id)) {
      const color = new RegExp('(fill\\s*:\\s*)#' + id.slice(1) + '(?![\\da-f])', 'gi')
      document.querySelectorAll('style').forEach(node => { node.textContent = node.textContent.replace(color, '$1' + replacement.fill) })
    }
  }
  return new XMLSerializer().serializeToString(document.documentElement)
}

async function svgObject(source) {
  const text = await svgText(source)
  return new Promise((resolve, reject) => {
    fabric.loadSVGFromString(text, (objects, options) => {
      if (!objects.length) { reject(new Error(`SVG 没有图形：${source.sourcePath || source.clipSvgUrl}`)); return }
      const group = fabric.util.groupSVGElements(objects, options)
      group.set({ originX: 'center', originY: 'center', left: 0, top: 0, objectCaching: false })
      disableCaching(group)
      resolve(group)
    })
  })
}

async function svgImage(source, width = source.width, height = source.height) {
  const text = await svgText(source)
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const root = doc.documentElement
  const ratio = Math.min(1, 2000 / Math.max(width, height))
  const w = Math.max(1, Math.ceil(width * ratio)), h = Math.max(1, Math.ceil(height * ratio))
  root.setAttribute('width', String(w)); root.setAttribute('height', String(h))
  const svg = new XMLSerializer().serializeToString(root)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const el = await new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('SVG rasterization failed')); image.src = url
    })
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(el, 0, 0, w, h)
    const object = await imageFromURL(canvas.toDataURL('image/webp', .9))
    canvas.width = canvas.height = 1
    return object
  } finally { URL.revokeObjectURL(url) }
}

async function clipFor(source) {
  let clip
  if (source.clipPath) {
    const json = { ...properties(source.clipPath), type: source.clipPath.type, absolutePositioned: false }
    clip = await enliven(json)
  } else if (source.clipSvgUrl) {
    clip = await svgObject(source)
    clip.set({ scaleX: source.width / clip.width, scaleY: source.height / clip.height })
  } else {
    clip = new fabric.Rect({ width: source.width, height: source.height, originX: 'center', originY: 'center', left: 0, top: 0, strokeWidth: 0 })
  }
  clip.set({ fill: '#000', strokeWidth: 0, objectCaching: false, inverted: !!source.clipPath?.inverted })
  return clip
}

function fitText(object) {
  const measured = new fabric.Text(object.text || '', { fontFamily: FONT, fontSize: object.fontSize,
    fontWeight: object.fontWeight, fontStyle: object.fontStyle, charSpacing: object.charSpacing || 0 })
  if (measured.width > object.width && object.width > 0) object.set('fontSize', object.fontSize * object.width / measured.width * .98)
}

export async function convertDesignTemplate(page, meta) {
  if (!page?.objects || !(meta.width > 0 && meta.height > 0)) throw new Error('无效模板')
  const result = []
  let photos = 0
  const background = page.objects.find(o => o.type === 'background')
  const paper = new fabric.Rect({ id: 'workspace', width: meta.width, height: meta.height,
    left: 0, top: 0, fill: opaquePaperColor(background?.backgroundColor || background?.fill || '#ffffff'),
    strokeWidth: 0, selectable: false, evented: false, objectCaching: false })
  // A white backing is part of the paper, including templates with gradients.
  if (!paper.fill || paper.fill === 'none' || typeof paper.fill !== 'string') paper.set('fill', '#ffffff')
  result.push(paper)

  async function walk(source, parent = IDENTITY, opacity = 1) {
    if (source.visible === false) return
    const matrix = multiply(parent, matrixOf(source))
    const alpha = opacity * (source.opacity ?? 1)
    if (['group', 'elementGroup', 'imageContainerGroup', 'pointLine'].includes(source.type) && source.objects?.length) {
      for (const child of source.objects) await walk(child, matrix, alpha)
      return
    }
    let object
    if (source.type === 'imageContainer') {
      const { width, height } = source
      if (!(width > 0 && height > 0)) throw new Error('照片框尺寸无效')
      const iw = 400, ih = Math.max(1, Math.round(iw * height / width))
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iw}" height="${ih}"><rect width="100%" height="100%" fill="#e8e0f4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8167a9" font-family="sans-serif" font-size="24">照片 ${++photos}</text></svg>`
      object = await imageFromURL(`data:image/svg+xml,${encodeURIComponent(svg)}`)
      setDesignTransform(object, multiply(matrix, [width / object.width, 0, 0, height / object.height, 0, 0]))
      const clip = await clipFor(source)
      setDesignTransform(clip, multiply(matrix, clip.calcOwnMatrix()))
      clip.absolutePositioned = true
      object.set({ id: `${meta.id}-photo-${photos}`, clipPath: clip, opacity: alpha,
        kidstoryRole: 'photoSlot', kidstoryPhotoFilled: false,
        kidstoryDesignFrame: { schema: 1, matrix, width, height },
        kidstorySlotLeft: object.left, kidstorySlotTop: object.top,
        kidstorySlotW: width * Math.hypot(matrix[0], matrix[1]), kidstorySlotH: height * Math.hypot(matrix[2], matrix[3]) })
      if (source.shadow) object.set('shadow', new fabric.Shadow(source.shadow))
      configureDesignPhotoSlot(object)
      result.push(object)
      return
    }
    if (source.type === 'background') {
      if (source.src) {
        object = await imageFromURL(source.src)
        setDesignTransform(object, multiply(matrix, [source.width / object.width, 0, 0, source.height / object.height, 0, 0]))
      } else if (source.fill && typeof source.fill === 'object') {
        object = await enliven({ ...properties(source), type: 'rect', strokeWidth: 0 })
        setDesignTransform(object, matrix)
      } else return
    } else if (source.type === 'svg') {
      object = await svgImage(source, source.width * Math.hypot(matrix[0], matrix[1]), source.height * Math.hypot(matrix[2], matrix[3]))
      setDesignTransform(object, multiply(matrix, [source.width / object.width, 0, 0, source.height / object.height, 0, 0]))
    } else if (source.type === 'grid') {
      const tile = await svgImage(source.fabricObject)
      const sx = source.fabricObject.scaleX || 1, sy = source.fabricObject.scaleY || 1
      const tw = tile.width * sx, th = tile.height * sy
      if (!(tw > 0 && th > 0)) throw new Error('Invalid repeat tile dimensions')
      // Rasterize one repeat tile. Cloning every SVG cell makes dense textures
      // unnecessarily expensive and misses cells before the source tile offset.
      const resolution = Math.min(1, 2048 / Math.max(tw, th))
      const tileCanvas = new fabric.StaticCanvas(null, { width: Math.max(1, Math.ceil(tw * resolution)), height: Math.max(1, Math.ceil(th * resolution)), renderOnAddRemove: false, enableRetinaScaling: false })
      tile.set({ originX: 'left', originY: 'top', left: 0, top: 0, scaleX: sx * resolution, scaleY: sy * resolution })
      tileCanvas.add(tile); tileCanvas.renderAll()
      const raster = document.createElement('canvas')
      raster.width = Math.ceil(source.width * resolution); raster.height = Math.ceil(source.height * resolution)
      const context = raster.getContext('2d')
      const pattern = context.createPattern(tileCanvas.lowerCanvasEl, 'repeat')
      pattern.setTransform(new DOMMatrix().translate((source.fabricObject.left || 0) * resolution, (source.fabricObject.top || 0) * resolution))
      context.fillStyle = pattern; context.fillRect(0, 0, raster.width, raster.height)
      object = await imageFromURL(raster.toDataURL('image/webp', .9))
      tileCanvas.dispose(); raster.width = raster.height = 1
      setDesignTransform(object, multiply(matrix, [source.width / object.width, 0, 0, source.height / object.height, 0, 0]))
    } else if (source.type === 'image') {
      object = await imageFromURL(source.src)
      const view = source.imageViewport
      if (view?.width > 0 && view?.height > 0) {
        const w = object.width, h = object.height
        object.set({ cropX: Math.max(0, view.x || 0) * w, cropY: Math.max(0, view.y || 0) * h,
          width: Math.min(1, view.width) * w, height: Math.min(1, view.height) * h })
      }
      setDesignTransform(object, multiply(matrix, [source.width / object.width, 0, 0, source.height / object.height, 0, 0]))
    } else {
      const type = source.type === 'pointLine' ? 'rect' : source.type === 'textbox' && source.path ? 'text' : source.type
      if (!['rect', 'ellipse', 'circle', 'path', 'polygon', 'line', 'textbox', 'text'].includes(type)) throw new Error(`不支持的模板对象：${source.type}`)
      object = await enliven({ ...properties(source), type })
      if (type === 'textbox' || type === 'text') {
        object.set({ text: (source.text || '').replace(/(?:www\.)?fotor\.com/gi, 'your-website.com'),
          fontFamily: FONT, styles: source.styles || {}, editable: true })
        if (source.path && !Array.isArray(source.path)) {
          object.set('path', await enliven({ ...properties(source.path), type: 'path' }))
          object.initDimensions()
        } else fitText(object)
      }
      setDesignTransform(object, matrix)
    }
    object.set({ id: `${meta.id}-object-${result.length}`, opacity: alpha, objectCaching: false,
      kidstoryRole: source.type === 'textbox' ? 'text' : 'decoration',
      selectable: source.type === 'textbox', evented: source.type === 'textbox' })
    result.push(object)
  }
  for (const source of page.objects) await walk(source)
  const keys = ['id', 'kidstoryRole', 'kidstoryPhotoFilled', 'kidstoryDesignFrame',
    'kidstorySlotLeft', 'kidstorySlotTop', 'kidstorySlotW', 'kidstorySlotH', 'selectable', 'evented', 'hasControls', 'editable', 'objectCaching']
  const objects = result.map(o => o.toObject(keys))
  const localSources = value => {
    if (!value || typeof value !== 'object') return
    if (typeof value.src === 'string' && value.src.startsWith(location.origin + '/editor-design-templates/')) value.src = value.src.slice(location.origin.length)
    Object.values(value).forEach(localSources)
  }
  localSources(objects)
  return { version: '5.3.0', objects,
    kidstoryTemplateBase: { width: meta.width, height: meta.height, aspectRatio: meta.aspectRatio }, photoCount: photos }
}
