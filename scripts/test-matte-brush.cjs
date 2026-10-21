const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/components/sticker/MatteBrushCanvas.vue'), 'utf8')

test('restore maps original pixels to a resized matte and replaces transparent source pixels', () => {
  const calls = []
  const ctx = Object.fromEntries(['save', 'restore', 'beginPath', 'arc', 'clip', 'clearRect', 'drawImage'].map(name => [name, (...args) => calls.push([name, ...args])]))
  const original = { naturalWidth: 1200, naturalHeight: 800 }
  const scope = { matteCanvas: { width: 600, height: 400, getContext: () => ctx }, sourceImage: original,
    brush: { value: 'restore' }, brushRadiusImage: () => 28, Math }
  vm.createContext(scope)
  vm.runInContext(source.slice(source.indexOf('function paintAt('), source.indexOf('\nfunction paintStroke(')), scope)
  scope.paintAt(450, 200)
  assert.deepEqual(calls.find(call => call[0] === 'arc'), ['arc', 450, 200, 28, 0, Math.PI * 2])
  assert.deepEqual(calls.find(call => call[0] === 'drawImage'), ['drawImage', original, 0, 0, 600, 400])
  const clipIndex = calls.findIndex(call => call[0] === 'clip')
  const clearIndex = calls.findIndex(call => call[0] === 'clearRect')
  assert.ok(clipIndex < clearIndex, 'clearing must stay inside the brush')
})

test('finishing a brush stroke preserves restored small details', () => {
  let redraws = 0
  const scope = { painting: true, lastPaint: {}, redrawDisplay: () => redraws++ }
  vm.createContext(scope)
  vm.runInContext(source.slice(source.indexOf('function onPointerUp('), source.indexOf('\nfunction buildStyledSticker(')), scope)
  scope.onPointerUp()
  assert.equal(scope.painting, false)
  assert.equal(scope.lastPaint, null)
  assert.equal(redraws, 1)
})
