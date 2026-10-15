// Parameterized layouts span a single continuous canvas; page guides do not crop photos.
export function generateCarouselLayouts(count, slides) {
  if (!count) return []
  const grid = count * slides * 12, cell = (x,y,w,h,clip) => ({x,y,w,h,type:'rect',...(clip ? {clip} : {})})
  const layout = cells => ({grid,aspect:'1:1',cells})
  const columns = weights => { const sum=weights.reduce((a,b)=>a+b,0); let x=0; return layout(weights.map(weight=>{const w=grid*weight/sum; const c=cell(x,0,w,grid);x+=w;return c})) }
  const result = [columns(Array(count).fill(1))]
  if (count >= 2) {
    result.push(columns(Array.from({length:count},(_,i)=>i%2?2:3)),columns(Array.from({length:count},(_,i)=>i%2?3:2)))
    for (const direction of [-1,1]) {
      const w=grid/count, delta=w*.23*direction
      result.push(layout(Array.from({length:count},(_,i)=>cell(0,0,grid,grid,[{x:i?i*w+delta:0,y:0},{x:i===count-1?grid:(i+1)*w+delta,y:0},{x:i===count-1?grid:(i+1)*w-delta,y:grid},{x:i?i*w-delta:0,y:grid}]))))
    }
  }
  for (const rows of [2,3]) if (count >= rows + 1) {
    let remaining=count, cells=[]
    for (let row=0;row<rows;row++) { const n=Math.ceil(remaining/(rows-row));remaining-=n;for(let col=0;col<n;col++) cells.push(cell(col*grid/n,row*grid/rows,grid/n,grid/rows)) }
    result.push(layout(cells))
  }
  if (count>=3) for (const left of [true,false]) { const w=grid*.4,small=grid-w;result.push(layout([cell(left?0:small,0,w,grid),...Array.from({length:count-1},(_,i)=>cell(left?w:0,i*grid/(count-1),small,grid/(count-1)))])) }
  return result
}
