const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

test('replacing a cutout preserves display size and reopens the new image', () => {
  const source = fs.readFileSync(path.join(__dirname,
    '../src/components/editorPro/editor-components/lassoCropImg.vue'), 'utf8')
  const fn = source.slice(source.indexOf('function openLassoCrop()'), source.indexOf('\nfunction init()'))
  const image = {
    type: 'image', originSrc: 'blob:old-image', originWidth: 100, originHeight: 80,
    width: 100, height: 80, scaleX: 2, scaleY: 3,
    get(key) { return this[key] },
    set(key, value) { this[key] = value },
    setSrc(src, done) { this.src = src; this.width = 50; this.height = 40; done() },
  }
  const opens = []
  let renderCount = 0
  const context = {
    canvasEditor: { canvas: {
      getActiveObjects: () => [image], renderAll: () => renderCount++,
    } },
    lassoDialogRef: { value: { open: (input, replace) => opens.push({ input, replace }) } },
  }
  vm.createContext(context)
  vm.runInContext(fn, context)
  context.openLassoCrop()
  opens[0].replace('data:image/png;base64,new-cutout')
  assert.equal(image.width * image.scaleX, 200)
  assert.equal(image.height * image.scaleY, 240)
  assert.equal(renderCount, 1)
  context.openLassoCrop()
  assert.equal(opens[1].input.img, 'data:image/png;base64,new-cutout')
  assert.equal(opens[1].input.naturalWidth, 50)
  assert.equal(opens[1].input.naturalHeight, 40)
})
