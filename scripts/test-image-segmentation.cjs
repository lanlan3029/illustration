const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
global.localStorage = { getItem: () => 'test-token' }

// Replace bundler aliases; requests still exercise the production dispatch and payload code.
const source = fs.readFileSync(path.join(__dirname, '../src/utils/imageSegmentation.js'), 'utf8')
  .replace("import { DEFAULT_API_ORIGIN, resolveApiOrigin } from '@/utils/createCharacterTask'",
    "const DEFAULT_API_ORIGIN = 'https://api.example.com'; const resolveApiOrigin = value => value || DEFAULT_API_ORIGIN")
  .replace("import { loadImage } from '@/utils/lassoCrop'", 'const loadImage = () => { throw new Error("Unexpected image load") }')
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))

function harness() {
  const calls = []
  return {
    calls,
    http: { post: async (...args) => {
      calls.push(args)
      return { data: { code: 0, message: { imageURL: 'https://example.com/result.png' } } }
    } },
  }
}
const options = { mode: 'hard_edge', timeout: 4321 }

test('browser object URL uploads original bytes as multipart with mode and timeout', async () => {
  const api = await modulePromise
  const { http, calls } = harness()
  const blob = new Blob(['image bytes'], { type: 'image/png' })
  const url = URL.createObjectURL(blob)
  try {
    assert.equal(api.resolveImageSourceUrl(url), url)
    const result = await api.rembgFromImageSource(http, url, options)
    assert.equal(result.imageURL, 'https://example.com/result.png')
    assert.equal(calls.length, 1)
    const [, form, config] = calls[0]
    assert.ok(form instanceof FormData)
    assert.equal(await form.get('image').text(), 'image bytes')
    assert.equal(form.get('image').type, 'image/png')
    assert.equal(form.get('mode'), 'hard_edge')
    assert.equal(config.timeout, 4321)
    assert.equal(config.headers.Authorization, 'Bearer test-token')
    // Direct URL callers receive the same handling.
    await api.rembgFromImageUrl(http, url, options)
    assert.ok(calls[1][1] instanceof FormData)
  } finally {
    URL.revokeObjectURL(url)
  }
})

test('unreadable object URL never reaches the backend', async () => {
  const api = await modulePromise
  const { http, calls } = harness()
  const url = URL.createObjectURL(new Blob(['expired']))
  URL.revokeObjectURL(url)
  await assert.rejects(api.rembgFromImageSource(http, url, options))
  assert.equal(calls.length, 0)
})

test('remote paths and data URLs retain their JSON request formats', async () => {
  const api = await modulePromise
  const { http, calls } = harness()
  for (const input of ['images/a.png', '/images/a.png', 'https://example.com/a.png', 'data:image/png;base64,YQ==']) {
    await api.rembgFromImageSource(http, input, options)
  }
  assert.deepEqual(calls.map(call => call[1]), [
    { image_url: 'https://static.kidstory.cc/images/a.png', mode: 'hard_edge' },
    { image_url: 'https://static.kidstory.cc/images/a.png', mode: 'hard_edge' },
    { image_url: 'https://example.com/a.png', mode: 'hard_edge' },
    { image_base64: 'data:image/png;base64,YQ==', mode: 'hard_edge' },
  ])
})
