// Shared geometry for thumbnails, editing, hit testing and full-resolution export.
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

export function canvasSize(aspect = '1:1', slides = 1, size = 1080) {
  const [w, h] = aspect.split(':').map(Number)
  return { width: Math.round(size * (slides > 1 ? slides : Math.max(1, w / h))), height: Math.round(size * (slides > 1 ? h / w : Math.max(1, h / w))) }
}

function insetPolygon(points, amount, cell) {
  const area = points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p.x * q.y - q.x * p.y }, 0)
  const sign = area > 0 ? 1 : -1
  const edges = points.map((p, i) => {
    const q = points[(i + 1) % points.length]
    const outer = (p.x === cell.x && q.x === cell.x) || (p.x === cell.x + cell.width && q.x === cell.x + cell.width) || (p.y === cell.y && q.y === cell.y) || (p.y === cell.y + cell.height && q.y === cell.y + cell.height)
    const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1
    const d = outer ? 0 : amount
    return { x: p.x - sign * dy / len * d, y: p.y + sign * dx / len * d, dx, dy }
  })
  return edges.map((b, i) => {
    const a = edges[(i - 1 + edges.length) % edges.length], cross = a.dx * b.dy - a.dy * b.dx
    if (Math.abs(cross) < 0.001) return { x: b.x, y: b.y }
    const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / cross
    return { x: a.x + t * a.dx, y: a.y + t * a.dy }
  })
}

export function layoutCells(template, width, height, spacing = 0, border = 0) {
  const unitX = (width - spacing * (template.grid - 1) - 2 * border) / template.grid
  const unitY = (height - spacing * (template.grid - 1) - 2 * border) / template.grid
  return template.cells.map(cell => {
    const rect = { x: border + cell.x * (unitX + spacing), y: border + cell.y * (unitY + spacing), width: Math.max(1, cell.w * (unitX + spacing) - spacing), height: Math.max(1, cell.h * (unitY + spacing) - spacing), shape: cell.clipShape, loose: cell.loose }
    if (cell.clip) {
      let points = cell.clip.map(p => ({ x: border + p.x * (unitX + spacing) - (p.x === cell.x + cell.w ? spacing : 0) + (p.v || 0) * spacing, y: border + p.y * (unitY + spacing) - (p.y === cell.y + cell.h ? spacing : 0) + (p.z || 0) * spacing }))
      if (spacing) points = insetPolygon(points, spacing / 2, rect)
      const xs = points.map(p => p.x), ys = points.map(p => p.y)
      Object.assign(rect, { points, x: Math.min(...xs), y: Math.min(...ys), width: Math.max(1, Math.max(...xs) - Math.min(...xs)), height: Math.max(1, Math.max(...ys) - Math.min(...ys)) })
    }
    return rect
  })
}

export function shapePath(shape, x, y, w, h, path = new Path2D()) {
  const p = path, cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2
  if (shape === 'ellipse') p.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
  else if (shape === 'heart') {
    p.moveTo(cx, y + h * .24)
    p.bezierCurveTo(x, y - h * .2, x - w * .15, y + h * .4, cx, y + h)
    p.bezierCurveTo(x + w * 1.15, y + h * .4, x + w, y - h * .2, cx, y + h * .24)
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * .5 : r; const px = cx + Math.cos(a) * radius, py = cy + Math.sin(a) * radius; i ? p.lineTo(px, py) : p.moveTo(px, py) }
  } else if (shape === 'cross' || shape === 'xcross') {
    const points = shape === 'cross' ? [[.36,0],[.64,0],[.64,.36],[1,.36],[1,.64],[.64,.64],[.64,1],[.36,1],[.36,.64],[0,.64],[0,.36],[.36,.36]] : [[.25,0],[.5,.25],[.75,0],[1,.25],[.75,.5],[1,.75],[.75,1],[.5,.75],[.25,1],[0,.75],[.25,.5],[0,.25]]
    points.forEach(([a,b], i) => i ? p.lineTo(x + a*w, y + b*h) : p.moveTo(x + a*w, y + b*h))
  } else p.rect(x, y, w, h)
  p.closePath()
  return p
}

export function cellPath(cell, radius = 0, path = new Path2D()) {
  if (cell.shape) return shapePath(cell.shape, cell.x, cell.y, cell.width, cell.height, path)
  const p = path
  if (cell.points) {
    const points = cell.points
    const last = points[points.length - 1], first = points[0]
    p.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2)
    points.forEach((q, i) => {
      const next = points[(i + 1) % points.length], prev = points[(i - 1 + points.length) % points.length]
      const r = Math.min(radius, Math.hypot(q.x-prev.x,q.y-prev.y)/2, Math.hypot(next.x-q.x,next.y-q.y)/2)
      if (r) p.arcTo(q.x, q.y, next.x, next.y, r)
      else p.lineTo(q.x, q.y)
    })
    p.closePath()
  } else p.roundRect(cell.x, cell.y, cell.width, cell.height, Math.min(radius, cell.width / 2, cell.height / 2))
  return p
}

export function imagePlacement(image, cell) {
  const scale = Math.max(cell.width / image.element.width, cell.height / image.element.height) * clamp(image.zoom || 1, 1, 4)
  const width = image.element.width * scale, height = image.element.height * scale
  // Normalized offsets survive canvas resolution, template and aspect changes.
  const x = cell.x + (cell.width - width) * (clamp(image.panX || 0, -1, 1) + 1) / 2
  const y = cell.y + (cell.height - height) * (clamp(image.panY || 0, -1, 1) + 1) / 2
  return { x, y, width, height }
}

export function renderCollage(canvas, template, images, settings, { size = 1080, guides = false, selected = -1 } = {}) {
  const slides = settings.mode === 'carousel' ? settings.slides : 1
  const { width, height } = canvasSize(settings.aspect, slides, size)
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d'), factor = size / 1080
  const spacing = settings.spacing * factor, border = settings.border * factor, radius = settings.radius * factor
  const cells = layoutCells(template, width, height, spacing, border)
  ctx.fillStyle = settings.background; ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
  ctx.save()
  const outerPath = template.clipShape ? shapePath(template.clipShape, border, border, width - 2 * border, height - 2 * border) : null
  if (outerPath) ctx.clip(outerPath)
  cells.forEach((cell, i) => {
    if (cell.loose && spacing) { ctx.fillStyle = settings.background; ctx.fillRect(cell.x-spacing,cell.y-spacing,cell.width+2*spacing,cell.height+2*spacing) }
    const path = cellPath(cell, radius), photo = images[i]
    ctx.save(); ctx.clip(path)
    if (photo) { const rect = imagePlacement(photo, cell); ctx.drawImage(photo.element, rect.x, rect.y, rect.width, rect.height) }
    else { ctx.fillStyle = ['#d8cdea','#bcded4','#f2d9b8','#c9dcec'][i % 4]; ctx.fillRect(cell.x,cell.y,cell.width,cell.height); ctx.fillStyle = '#625777'; ctx.font = `${Math.max(10, size / 26)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1),cell.x+cell.width/2,cell.y+cell.height/2) }
    ctx.restore()
    if (selected === i) { ctx.strokeStyle = '#8657cc'; ctx.lineWidth = 4 * factor; ctx.stroke(path) }
  })
  ctx.restore()
  if (guides && slides > 1) { ctx.save(); ctx.strokeStyle = '#cf5274'; ctx.lineWidth = 2 * factor; ctx.setLineDash([12*factor,8*factor]); for (let i=1;i<slides;i++) { ctx.beginPath();ctx.moveTo(width*i/slides,0);ctx.lineTo(width*i/slides,height);ctx.stroke() } ctx.restore() }
  return { cells, outerPath, radius }
}

export function hitCell(ctx, geometry, x, y) {
  if (geometry.outerPath && !ctx.isPointInPath(geometry.outerPath,x,y)) return -1
  for (let i=geometry.cells.length-1;i>=0;i--) if (ctx.isPointInPath(cellPath(geometry.cells[i],geometry.radius),x,y)) return i
  return -1
}
