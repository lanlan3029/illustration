import { CANVAS_H, CANVAS_W } from '@/data/editorPageTemplates/placeholder'

export const TEMPLATE_BASE_W = CANVAS_W
export const TEMPLATE_BASE_H = CANVAS_H
export const TEMPLATE_ASPECT_RATIO = '3:4'

const ASPECT_TOLERANCE = 0.018

const SCALAR_PROPS = [
  'width',
  'height',
  'fontSize',
  'strokeWidth',
  'rx',
  'ry',
  'padding',
  'charSpacing',
  'kidstorySlotW',
  'kidstorySlotH',
  'kidstorySlotLeft',
  'kidstorySlotTop',
]

function cloneJson(input) {
  return typeof input === 'string' ? JSON.parse(input) : JSON.parse(JSON.stringify(input))
}

export function isWorkspaceJsonObject(obj) {
  return Boolean(obj && (obj.id === 'workspace' || obj.name === 'workspace'))
}

export function getTemplateBaseSize(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json
  const meta = data?.kidstoryTemplateBase
  if (meta?.width && meta?.height) {
    return { width: meta.width, height: meta.height, aspectRatio: meta.aspectRatio || null }
  }
  const workspace = data?.objects?.find(isWorkspaceJsonObject)
  if (workspace?.width && workspace?.height) {
    return {
      width: workspace.width,
      height: workspace.height,
      aspectRatio: formatAspectRatio(workspace.width, workspace.height),
    }
  }
  return { width: TEMPLATE_BASE_W, height: TEMPLATE_BASE_H, aspectRatio: TEMPLATE_ASPECT_RATIO }
}

/** 当前画布 workspace 像素尺寸 */
export function getCurrentWorkspaceSize(canvasEditor) {
  const ws =
    canvasEditor?.getWorkspase?.() ||
    canvasEditor?.canvas?.getObjects()?.find((item) => item.id === 'workspace')
  if (!ws) {
    return { width: TEMPLATE_BASE_W, height: TEMPLATE_BASE_H }
  }
  return {
    width: Math.round((ws.width || TEMPLATE_BASE_W) * (ws.scaleX || 1)),
    height: Math.round((ws.height || TEMPLATE_BASE_H) * (ws.scaleY || 1)),
  }
}

export function formatAspectRatio(width, height) {
  if (!width || !height) return ''
  const ratio = width / height
  const presets = [
    [1, 1],
    [3, 4],
    [4, 3],
    [2, 3],
    [3, 2],
    [9, 16],
    [16, 9],
    [2, 1],
    [1, 2],
  ]
  for (const [w, h] of presets) {
    if (Math.abs(ratio - w / h) < ASPECT_TOLERANCE) return `${w}:${h}`
  }
  return `${width}:${height}`
}

export function aspectRatiosMatch(widthA, heightA, widthB, heightB, tolerance = ASPECT_TOLERANCE) {
  if (!widthA || !heightA || !widthB || !heightB) return false
  return Math.abs(widthA / heightA - widthB / heightB) <= tolerance
}

function scaleJsonObject(obj, scale, offsetX, offsetY, isRoot) {
  if (!obj || isWorkspaceJsonObject(obj)) return

  if (typeof obj.left === 'number') {
    obj.left = obj.left * scale + (isRoot ? offsetX : 0)
  }
  if (typeof obj.top === 'number') {
    obj.top = obj.top * scale + (isRoot ? offsetY : 0)
  }

  SCALAR_PROPS.forEach((key) => {
    if (typeof obj[key] === 'number') obj[key] *= scale
  })

  if (Array.isArray(obj.strokeDashArray)) {
    obj.strokeDashArray = obj.strokeDashArray.map((value) => value * scale)
  }

  if (Array.isArray(obj.objects)) {
    obj.objects.forEach((child) => scaleJsonObject(child, scale, offsetX, offsetY, false))
  }
}

/**
 * 将按基准尺寸设计的模版 JSON 等比缩放并居中适配到目标画布
 * @param {object|string} templateJson
 * @param {number} targetWidth
 * @param {number} targetHeight
 */
export function fitTemplateToCanvas(templateJson, targetWidth, targetHeight) {
  const data = cloneJson(templateJson)
  const base = getTemplateBaseSize(data)
  const baseW = base.width
  const baseH = base.height

  if (!targetWidth || !targetHeight) {
    throw new Error('invalid target canvas size')
  }

  const scale = Math.min(targetWidth / baseW, targetHeight / baseH)
  const offsetX = (targetWidth - baseW * scale) / 2
  const offsetY = (targetHeight - baseH * scale) / 2

  data.objects?.forEach((obj) => {
    if (isWorkspaceJsonObject(obj)) {
      obj.left = 0
      obj.top = 0
      obj.width = targetWidth
      obj.height = targetHeight
      obj.scaleX = 1
      obj.scaleY = 1
      return
    }
    scaleJsonObject(obj, scale, offsetX, offsetY, true)
  })

  data.kidstoryTemplateBase = {
    width: baseW,
    height: baseH,
    aspectRatio: base.aspectRatio || formatAspectRatio(baseW, baseH),
    fittedTo: { width: targetWidth, height: targetHeight, scale },
  }

  return data
}

export function templateMatchesCanvas(templateJson, canvasWidth, canvasHeight) {
  const base = getTemplateBaseSize(templateJson)
  return aspectRatiosMatch(base.width, base.height, canvasWidth, canvasHeight)
}
