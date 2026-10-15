// Canvas path recorder: reuse exactly the same shapes for Fabric SVG clip paths.
export class SvgPath {
  constructor() { this.commands = []; this.x = 0; this.y = 0 }
  moveTo(x, y) { this.commands.push(`M ${x} ${y}`); this.x = x; this.y = y }
  lineTo(x, y) { this.commands.push(`L ${x} ${y}`); this.x = x; this.y = y }
  bezierCurveTo(a, b, c, d, x, y) { this.commands.push(`C ${a} ${b} ${c} ${d} ${x} ${y}`); this.x = x; this.y = y }
  closePath() { this.commands.push('Z') }
  rect(x, y, w, h) { this.moveTo(x,y); this.lineTo(x+w,y); this.lineTo(x+w,y+h); this.lineTo(x,y+h); this.closePath() }
  ellipse(cx, cy, rx, ry) {
    this.moveTo(cx-rx,cy)
    this.commands.push(`A ${rx} ${ry} 0 1 0 ${cx+rx} ${cy}`, `A ${rx} ${ry} 0 1 0 ${cx-rx} ${cy}`)
    this.x = cx-rx; this.y = cy
  }
  arcTo(x, y, nx, ny, radius) {
    const ux=this.x-x, uy=this.y-y, vx=nx-x, vy=ny-y
    const u=Math.hypot(ux,uy), v=Math.hypot(vx,vy)
    if (!radius || !u || !v) { this.lineTo(x,y); return }
    const dot=Math.max(-1,Math.min(1,(ux*vx+uy*vy)/(u*v)))
    const angle=Math.acos(dot), cross=ux*vy-uy*vx
    if (Math.abs(cross)<1e-8 || angle<1e-8) { this.lineTo(x,y); return }
    const distance=radius/Math.tan(angle/2)
    this.lineTo(x+ux/u*distance,y+uy/u*distance)
    this.x=x+vx/v*distance; this.y=y+vy/v*distance
    this.commands.push(`A ${radius} ${radius} 0 0 ${cross<0?1:0} ${this.x} ${this.y}`)
  }
  roundRect(x,y,w,h,r) {
    this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.arcTo(x+w,y,x+w,y+h,r)
    this.lineTo(x+w,y+h-r);this.arcTo(x+w,y+h,x,y+h,r)
    this.lineTo(x+r,y+h);this.arcTo(x,y+h,x,y,r)
    this.lineTo(x,y+r);this.arcTo(x,y,x+w,y,r);this.closePath()
  }
  toString() { return this.commands.join(' ') }
}
