const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ctx = vm.createContext({})
vm.runInContext(fs.readFileSync('src/utils/aibooksPrompts.js', 'utf8').replace(/export /g, ''), ctx)
const story = n => ({ title: '小兔', summary: '运胡萝卜', story_plan: { goal: '搬回家', obstacle: '太重', progression: '尝试', climax: '合作', ending: '做汤' }, scenes: Array(n).fill('正文'), scenes_detail: Array(n).fill('出场角色：小兔；森林') })
test('explicit page counts override old schema hints and validate boundaries', () => {
  for (const n of [6, 10, 12]) {
    assert.match(ctx.appendStorySchemaGuide('character_profiles', n), new RegExp(`严格 ${n} 页`))
    assert.equal(ctx.validateStory(story(n), n).scenes.length, n)
  }
  for (const n of [null, 4, 5, 13, 24, 6.5]) assert.throws(() => ctx.buildStoryGuide(n))
})
test('mismatches fail without truncating the ending', () => {
  const draft = story(12)
  assert.throws(() => ctx.validateStory(draft, 10), /未截断/)
  assert.equal(draft.scenes.length, 12)
  draft.scenes_detail[0] = ''
  assert.throws(() => ctx.validateStory(draft, 12), /空白/)
})
test('review requires report and returns complete revised story', () => {
  const draft = story(10)
  assert.throws(() => ctx.validateStory(draft, 10, true), /审稿/)
  draft.review = { issues: ['结尾突兀'], changes: ['补上铺垫'] }
  assert.equal(ctx.validateStory(draft, 10, true), draft)
  assert.match(ctx.buildStoryReviewPrompt(draft, '分享', 10), /分享/)
  assert.match(ctx.buildStoryReviewPrompt(draft, '分享', 10), /同步修改文案和画面/)
})
test('final story illustration remains an ending rather than a cover request', () => {
  const prompts = ctx.scenesDetailToImagePrompts(['图片1：开场', '图片2：结尾'])
  assert.equal(prompts[1], '结尾')
})
function componentHarness() {
  const parser = require('@babel/parser')
  const localStorage = { getItem: () => 'test', setItem() {} }
  const runtime = vm.createContext({ localStorage, console, process: { env: {} }, ElMessage: { success() {}, warning() {} } })
  vm.runInContext(fs.readFileSync('src/utils/aibooksPrompts.js', 'utf8').replace(/export /g, ''), runtime)
  let code = fs.readFileSync('src/views/AIBooks.vue', 'utf8').match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
  const edits = []
  for (const node of parser.parse(code, { sourceType: 'module' }).program.body) {
    if (node.type === 'ImportDeclaration') {
      edits.push([node.start, node.end, ''])
      for (const spec of node.specifiers) if (!(spec.local.name in runtime)) runtime[spec.local.name] = () => {}
    }
    if (node.type === 'ExportDefaultDeclaration') edits.push([node.start, node.declaration.start, 'globalThis.component = '])
  }
  for (const [start, end, value] of edits.reverse()) code = code.slice(0, start) + value + code.slice(end)
  vm.runInContext(code, runtime)
  const instance = runtime.component.data()
  for (const [key, method] of Object.entries(runtime.component.methods)) instance[key] = method.bind(instance)
  instance.styles = []
  instance.form.prompt = '小兔运胡萝卜'
  instance.form.targetPages = 12
  instance.clearProtagonistRefs = () => {}
  instance.fetchMyCharacters = () => {}
  instance.saveToLocalStorage = () => {}
  instance.notifyApiError = async () => {}
  return instance
}
test('review failure retains draft; retry only reviews and publishes the revised pages', async () => {
  const instance = componentHarness()
  const requests = []
  let failReview = true
  instance.$http = { post: async (url, data) => {
    requests.push(data)
    if (requests.length === 1) return { data: { code: 0, message: story(12) } }
    if (failReview) throw new Error('review unavailable')
    const revised = story(12)
    revised.scenes[11] = '大家一起喝汤'
    revised.review = { issues: ['结尾突兀'], changes: ['结尾呼应开头'] }
    return { data: { code: 0, message: revised } }
  } }
  await instance.generateBook()
  assert.equal(instance.storyData, null)
  assert.equal(instance.imagePrompts.length, 0)
  assert.equal(instance.storyDraft.story.scenes.length, 12)
  assert.equal(instance.generating, false)
  failReview = false
  await instance.retryStoryReview()
  assert.equal(requests.length, 3)
  assert.equal(instance.storyDraft, null)
  assert.equal(instance.storyData.scenes[11], '大家一起喝汤')
  assert.equal(instance.imagePrompts.length, 12)
  assert.equal(requests[2].targetPages, 12)
  assert.equal(instance.progressStatus, 'success')
})


