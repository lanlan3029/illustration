const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const source = fs.readFileSync(path.join(__dirname, '../src/utils/editorPro/materialLibrary.js'), 'utf8')
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const item = (id, content = `${id}.png`) => ({ _id: id, content })
const reply = message => ({ code: 0, message })
function harness(createMaterialPager, options = {}) {
  const pending = []
  const state = {}
  const pager = createMaterialPager({ state, request: (query, page, signal) => new Promise((resolve, reject) => {
    pending.push({ query, page, signal, resolve, reject })
  }), ...options })
  return { pager, state, pending }
}

test('deduplicates IDs and images within a page and across overlapping pages', async () => {
  const { mergeMaterials } = await modulePromise
  const result = mergeMaterials([item('a')], [item('a'), item('b'), item('b'),
    item('copy', '/b.png'), item('copy2', 'https://static.kidstory.cc/b.png?version=2'), item('empty', '')])
  assert.deepEqual(result.map(x => x._id), ['a', 'b'])
})

test('latest category request wins even if cancellation is ignored by transport', async () => {
  const { createMaterialPager } = await modulePromise
  const { pager, state, pending } = harness(createMaterialPager)
  const old = pager.reset({ type: 'animal' })
  const latest = pager.reset({ type: 'plant' })
  assert.equal(pending[0].signal.aborted, true)
  pending[0].resolve(reply([item('old')]))
  await old
  assert.equal(state.loading, true)
  assert.equal(state.nextPage, 1)
  pending[1].resolve(reply([item('new')]))
  await latest
  assert.deepEqual(state.items.map(x => x._id), ['new'])
  assert.equal(state.loading, false)
})

test('input invalidation discards stale search and allows page one of latest query', async () => {
  const { createMaterialPager } = await modulePromise
  const { pager, state, pending } = harness(createMaterialPager)
  const old = pager.reset({ keyword: 'cat' })
  await pager.reset({ keyword: 'dog' }, { defer: true })
  pending[0].resolve(reply([item('cat')]))
  await old
  assert.equal(state.items.length, 0)
  const next = pager.reset({ keyword: 'dog' })
  assert.equal(pending[1].page, 1)
  pending[1].resolve(reply([item('dog')]))
  await next
  assert.equal(state.items[0]._id, 'dog')
})

test('concurrent scroll events request only one page and failures retry that same page', async () => {
  const { createMaterialPager } = await modulePromise
  const { pager, state, pending } = harness(createMaterialPager)
  const initial = pager.reset({ type: 'animal' })
  pending[0].resolve(reply([item('a')]))
  await initial
  const pageTwo = pager.loadMore()
  await pager.loadMore()
  assert.equal(pending.length, 2)
  pending[1].reject(new Error('offline'))
  await pageTwo
  assert.equal(state.nextPage, 2)
  assert.equal(state.error, true)
  const retry = pager.loadMore()
  assert.equal(pending[2].page, 2)
  pending[2].resolve(reply([item('a'), item('b')]))
  await retry
  assert.deepEqual(state.items.map(x => x._id), ['a', 'b'])
})

test('duplicate-only pages are bounded instead of loading forever', async () => {
  const { createMaterialPager } = await modulePromise
  const { pager, state, pending } = harness(createMaterialPager)
  let load = pager.reset({ type: 'animal' })
  pending[0].resolve(reply([item('a')]))
  await load
  for (let i = 1; i <= 2; i++) {
    load = pager.loadMore()
    pending[i].resolve(reply([item('a')]))
    await load
  }
  assert.equal(state.items.length, 1)
  assert.equal(state.hasMore, false)
  await pager.loadMore()
  assert.equal(pending.length, 3)
})

test('returning to a category uses cached pages and expiry reloads page one', async () => {
  const { createMaterialPager } = await modulePromise
  let clock = 0
  const { pager, state, pending } = harness(createMaterialPager, { now: () => clock, cacheMs: 100 })
  let load = pager.reset({ type: 'animal' })
  pending[0].resolve(reply([item('a')]))
  await load
  load = pager.reset({ type: 'plant' })
  pending[1].resolve(reply([item('p')]))
  await load
  await pager.reset({ type: 'animal' })
  assert.equal(pending.length, 2)
  assert.equal(state.items[0]._id, 'a')
  assert.equal(state.nextPage, 2)
  clock = 101
  load = pager.reset({ type: 'animal' })
  assert.equal(pending[2].page, 1)
  pending[2].resolve(reply([]))
  await load
  assert.equal(state.hasMore, false)
})

test('API permission failures are errors rather than a successful empty list', async () => {
  const { createMaterialPager } = await modulePromise
  const { pager, state, pending } = harness(createMaterialPager)
  const load = pager.reset({ type: 'animal' })
  pending[0].resolve({ code: 1004, message: 'denied' })
  await load
  assert.equal(state.error, true)
  assert.equal(state.nextPage, 1)
})

test('preview uses available thumbnails while insertion still resolves original image', async () => {
  const { materialImageUrl, materialPreviewUrl } = await modulePromise
  const asset = { content: ['/original.png'], thumbnail_url: 'preview.png' }
  assert.equal(materialPreviewUrl(asset), 'https://static.kidstory.cc/preview.png')
  assert.equal(materialImageUrl(asset), 'https://static.kidstory.cc/original.png')
})

test('unmount aborts in-flight work and prevents late writes', async () => {
  const { createMaterialPager } = await modulePromise
  const { pager, state, pending } = harness(createMaterialPager)
  const load = pager.reset({ type: 'animal' })
  pager.dispose()
  assert.equal(pending[0].signal.aborted, true)
  pending[0].resolve(reply([item('late')]))
  await load
  assert.equal(state.items.length, 0)
  assert.equal(state.loading, false)
})
