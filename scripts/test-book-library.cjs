const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const parser = require('@babel/parser')
const root = path.resolve(__dirname, '..')

function harness() {
  const values = new Map([['id', 'owner-a']])
  let failWrites = false
  let warnings = 0
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (failWrites) throw new Error('QuotaExceededError'); values.set(key, value) },
  }
  const ctx = vm.createContext({ localStorage: storage, console: { log() {}, error() {} }, Date, URLSearchParams, process: { env: {} },
    window: { removeEventListener() {} }, clearTimeout() {}, ElMessage: { warning() { warnings++ } } })
  function load(file, component = false) {
    let code = fs.readFileSync(path.join(root, file), 'utf8')
    if (component) code = code.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
    const ast = parser.parse(code, { sourceType: 'module' })
    const edits = []
    const names = []
    for (const node of ast.program.body) {
      if (node.type === 'ImportDeclaration') {
        edits.push([node.start, node.end, ''])
        for (const spec of node.specifiers) if (!(spec.local.name in ctx)) ctx[spec.local.name] = () => {}
      }
      if (node.type === 'ExportDefaultDeclaration') edits.push([node.start, node.declaration.start, 'globalThis.component = '])
      if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        edits.push([node.start, node.declaration.start, ''])
        names.push(node.declaration.id.name)
      }
    }
    for (const [start, end, text] of edits.reverse()) code = code.slice(0, start) + text + code.slice(end)
    vm.runInContext(code + '\n' + names.map(name => `globalThis.${name} = ${name};`).join('\n'), ctx)
    return ctx.component
  }
  load('src/utils/bookLibrary.js')
  load('src/utils/aibooksPageVersions.js')
  const component = load('src/views/AIBooks.vue', true)
  const instance = component.data()
  instance.$t = key => key
  for (const [key, method] of Object.entries(component.methods)) instance[key] = method.bind(instance)
  instance.storyData = { title: 'Saved story', scenes: ['one', 'two'] }
  instance.bookData = { images: ['https://example.test/one.png', null] }
  return { ctx, storage, values, component, instance, load, fail: () => { failWrites = true }, warnings: () => warnings }
}

test('legacy uploads and explicit AI source are classified separately', () => {
  const { ctx } = harness()
  assert.equal(ctx.getBookSource({}), 'upload')
  assert.equal(ctx.getBookSource({ source: 'ai' }), 'ai')
})
test('local draft card reports progress and supports old storage format', () => {
  const { ctx, storage } = harness()
  storage.setItem('aibooks_data', JSON.stringify({ storyData: { title: 'Legacy', scenes: ['a', 'b'] }, bookData: { images: ['old', null] } }))
  const card = ctx.readLocalAiBook(storage, 'owner-a')
  assert.equal(card.title, 'Legacy')
  assert.equal(card.completed, 1)
  assert.equal(card.total, 2)
})
test('failed writes retain last saved draft and show one actionable warning', () => {
  const h = harness()
  h.instance.saveToLocalStorage()
  const previous = h.storage.getItem('aibooks_data:owner-a')
  h.fail()
  h.instance.form.prompt = 'unsaved latest text'
  h.instance.saveToLocalStorage()
  h.instance.saveToLocalStorage()
  assert.equal(h.storage.getItem('aibooks_data:owner-a'), previous)
  assert.equal(h.warnings(), 1)
})
test('leaving the page saves the most recent input', () => {
  const h = harness()
  h.instance.form.prompt = 'latest edit'
  h.component.beforeUnmount.call(h.instance)
  assert.equal(JSON.parse(h.storage.getItem('aibooks_data:owner-a')).form.prompt, 'latest edit')
})
test('old drafts restore and new drafts are isolated by account', () => {
  const h = harness()
  h.instance.saveToLocalStorage()
  const key = 'aibooks_data:owner-a'
  const old = JSON.parse(h.storage.getItem(key))
  old.timestamp = Date.now() - 30 * 86400000
  h.storage.setItem(key, JSON.stringify(old))
  h.instance.storyData = null
  h.instance.loadFromLocalStorage()
  assert.equal(h.instance.storyData.title, 'Saved story')
  assert.equal(h.ctx.readLocalAiBook(h.storage, 'owner-b'), null)
  assert.ok(h.storage.getItem(key))
})

test('late filter response cannot replace the latest filter results', async () => {
  const h = harness()
  const component = h.load('src/views/MyHomePage.vue', true)
  const pending = []
  let displayed = []
  const instance = {
    id: 'owner-a', bookSourceFilter: 'ai', bookRequestId: 0,
    $http: { get: url => new Promise(resolve => pending.push({ url, resolve })) },
    $t: key => key,
    loadBookCovers: async () => {}, loadAllBookImages() {},
    setBooks() { displayed = this.toolArr },
    bookListUrl: component.methods.bookListUrl,
  }
  const first = component.methods.getBook.call(instance)
  instance.bookSourceFilter = 'upload'
  const second = component.methods.getBook.call(instance)
  assert.match(pending[0].url, /source=ai/)
  assert.match(pending[1].url, /source=upload/)
  pending[1].resolve({ data: { code: 0, message: [{ title: 'Latest uploads' }] } })
  await second
  pending[0].resolve({ data: { code: 0, message: [{ title: 'Stale AI books' }] } })
  await first
  assert.equal(displayed[0].title, 'Latest uploads')
  assert.equal(instance.loadingBooks, false)
})
