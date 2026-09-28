import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
const load = async path => {
  const text = (await readFile(new URL(path, import.meta.url), 'utf8')).replace(/^import .*$/gm, '')
  return import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`)
}
const { wrapPostcardText, formatPostcardDate } = await load('../src/utils/childhoodSharePoster.js')
const { buildShareLink, buildShareDesc } = await load('../src/utils/childhoodMoments.js')
const ctx = { measureText: text => ({ width: Array.from(text).length * 10 }) }
test('shared links always use the story route without unrelated query parameters', () => {
  assert.equal(buildShareLink('abc', 'https://www.kidstory.cc/editor?token=private#section'), 'https://www.kidstory.cc/childhood?mine=abc')
})
test('local previews generate an externally usable QR destination', () => {
  assert.equal(buildShareLink('abc'), 'https://www.kidstory.cc/childhood?mine=abc')
})
test('empty story ID still opens the activity; IDs are URL encoded', () => {
  assert.equal(buildShareLink(''), 'https://www.kidstory.cc/childhood')
  assert.equal(new URL(buildShareLink('a&b')).searchParams.get('mine'), 'a&b')
})
test('invitation makes no unsupported count or daily participation claim', () => {
  assert.equal(buildShareDesc(123), '这让你想起了什么？留下一段回忆，画成你的童年。')
})
test('long stories are bounded and marked as excerpts', () => {
  const result = wrapPostcardText(ctx, '一二三四五六七八九十', 30, 2)
  assert.deepEqual(result, { lines: ['一二三', '四五…'], truncated: true })
})
test('exact-fit text does not get an unnecessary ellipsis', () => {
  assert.deepEqual(wrapPostcardText(ctx, '一二三四五六', 30, 2), { lines: ['一二三', '四五六'], truncated: false })
})
test('newlines and Unicode characters retain their boundaries', () => {
  assert.deepEqual(wrapPostcardText(ctx, '童年\n快乐😊', 30, 5).lines, ['童年', '快乐😊'])
})
test('unknown dates never silently become today', () => {
  assert.equal(formatPostcardDate(''), '')
  assert.equal(formatPostcardDate('invalid'), '')
  assert.equal(formatPostcardDate('2026-09-24T08:00:00Z'), '2026.09.24')
})
