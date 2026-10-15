export const canvasBlob = canvas => new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG 导出失败')), 'image/png'))

export function downloadBlob(blob, name) {
  const url=URL.createObjectURL(blob), a=document.createElement('a')
  a.href=url;a.download=name;a.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}

function crc32(bytes) {
  let crc=0xffffffff
  for (const byte of bytes) { crc^=byte;for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0) }
  return (crc^0xffffffff)>>>0
}

// ZIP STORE: PNG is already compressed; avoid a second compression dependency.
export function zipFiles(files) {
  const chunks=[], central=[];let offset=0,centralSize=0
  for (const file of files) {
    const name=new TextEncoder().encode(file.name), bytes=file.bytes, crc=crc32(bytes)
    const header=new Uint8Array(30+name.length), v=new DataView(header.buffer)
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true)
    v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);header.set(name,30)
    const record=new Uint8Array(46+name.length), r=new DataView(record.buffer)
    r.setUint32(0,0x02014b50,true);r.setUint16(4,20,true);r.setUint16(6,20,true);r.setUint16(8,0x800,true);r.setUint16(14,33,true)
    r.setUint32(16,crc,true);r.setUint32(20,bytes.length,true);r.setUint32(24,bytes.length,true);r.setUint16(28,name.length,true);r.setUint32(42,offset,true);record.set(name,46)
    chunks.push(header,bytes);central.push(record);offset+=header.length+bytes.length;centralSize+=record.length
  }
  const end=new Uint8Array(22), e=new DataView(end.buffer)
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true)
  return new Blob([...chunks,...central,end],{type:'application/zip'})
}

export async function carouselZip(canvas, slides) {
  const files=[], width=canvas.width/slides
  for(let i=0;i<slides;i++) {
    const page=document.createElement('canvas');page.width=width;page.height=canvas.height
    page.getContext('2d').drawImage(canvas,Math.round(i*width),0,width,canvas.height,0,0,width,canvas.height)
    files.push({name:`slide-${String(i+1).padStart(2,'0')}.png`,bytes:new Uint8Array(await (await canvasBlob(page)).arrayBuffer())})
  }
  return zipFiles(files)
}
