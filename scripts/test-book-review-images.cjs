const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const context = vm.createContext({})
const source = fs.readFileSync(path.join(__dirname, '../src/utils/bookReviewImages.js'), 'utf8').replace(/export function /g, 'function ')
vm.runInContext(source + '\nglobalThis.api = { resolveBookReviewImage, getBookReviewPages };', context)
const { resolveBookReviewImage, getBookReviewPages } = context.api

test('uploaded relative paths resolve to the static host instead of the admin route', () => {
  for (const value of ['upload/page.jpg', '/upload/page.jpg', './upload/page.jpg', ' upload/page.jpg ']) {
    assert.equal(resolveBookReviewImage(value), 'https://static.kidstory.cc/upload/page.jpg')
  }
})
test('absolute URLs and browser image sources remain intact', () => {
  for (const value of ['https://images.example/page.png', 'data:image/png;base64,AA', 'blob:https://example/id']) assert.equal(resolveBookReviewImage(value), value)
  assert.equal(resolveBookReviewImage('//static.kidstory.cc/upload/page.jpg'), 'https://static.kidstory.cc/upload/page.jpg')
})
test('missing URLs and illustration IDs are never requested as image paths', () => {
  for (const value of [null, undefined, '', '111111111111111111111111', 'javascript:alert(1)']) assert.equal(resolveBookReviewImage(value), '')
})
test('snapshot preview preserves page order and normalizes all image URLs', () => {
  const pages = getBookReviewPages({ content_snapshot: [{ path: 'upload/one.jpg' }, { path: 'upload/two.jpg' }] })
  assert.deepEqual(Array.from(pages, p => p.path), ['https://static.kidstory.cc/upload/one.jpg', 'https://static.kidstory.cc/upload/two.jpg'])
})
test('legacy and blank snapshots fall back to matching illustrations, not query result order', () => {
  const pages = getBookReviewPages({ content: ['a', 'b', 'c'], content_snapshot: [{ path: '' }] }, [{ _id: 'b', content: 'upload/two.jpg' }, { _id: 'a', content: 'upload/one.jpg' }])
  assert.equal(pages.length, 3)
  assert.equal(pages[0].path, 'https://static.kidstory.cc/upload/one.jpg')
  assert.equal(pages[1].path, 'https://static.kidstory.cc/upload/two.jpg')
})
