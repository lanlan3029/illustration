// Data URLs survive destruction of the collage page and are embedded in editor drafts.
let pending = null

export function setPendingCollage(payload) { pending = payload }
export function peekPendingCollage() { return pending }
export function takePendingCollage() { const result = pending; pending = null; return result }

export async function createCollageTransfer(template, settings, photos) {
  const images = await Promise.all(photos.map(async photo => {
    const blob = await (await fetch(photo.url)).blob()
    const src = await new Promise((resolve,reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('照片读取失败'))
      reader.readAsDataURL(blob)
    })
    return { src, zoom: photo.zoom, panX: photo.panX, panY: photo.panY, name: photo.name }
  }))
  return { schema: 1, template: JSON.parse(JSON.stringify(template)), settings: { ...settings }, images }
}
