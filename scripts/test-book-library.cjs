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
  const ctx = vm.createContext({ localStorage: storage, console: { log() {}, error() {}, warn() {} }, Date, URLSearchParams, process: { env: {} },
    window: { removeEventListener() {} }, clearTimeout() {}, ElMessage: { warning() { warnings++ }, success() {}, error() {} } })
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
  load('src/utils/aibooksGeneration.js')
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

test('switching styles removes previous generated blocks without deleting story text', () => {
  const {ctx}=harness();
  const styles=[{key:'a',artStyle:'水彩',elementDetails:'柔和色彩'}, {key:'b',artStyle:'剪纸',basePrompt:'隐藏规则'}, {key:'c',artStyle:'钢笔',elementDetails:'黑白线条'}];
  const story='小狐狸在天空集市寻找丢失的鞋子。';
  let prompt=`【画风：水彩】柔和色彩\n${story}\n\n【画风：剪纸】`;
  prompt=ctx.replaceBookStyle(prompt,styles,styles[2]);
  assert.ok(prompt.includes(story));assert.ok(!prompt.includes('柔和色彩'));assert.ok(!prompt.includes('画风：水彩'));assert.ok(!prompt.includes('画风：剪纸'));
  assert.equal((prompt.match(/【画风：/g)||[]).length,1);
  assert.equal(ctx.replaceBookStyle(prompt,styles,styles[2]),prompt);
});

test('page regeneration submits only that page, including a restored missing page',async()=>{
  const {instance}=harness();instance.imagePrompts=['第一页描述','第二页描述'];instance.promptSceneIndexes=[0,1];
  let submitted;instance.generateImagesFromPrompts=async jobs=>{submitted=jobs};
  await instance.regeneratePage(1);assert.equal(submitted.length,1);assert.equal(submitted[0].sceneIndex,1);assert.equal(submitted[0].prompt,'第二页描述');
  instance.imagePrompts=['第一页描述'];instance.promptSceneIndexes=[0];instance.storyData.scenes_detail=['第一页描述','恢复的分镜'];
  await instance.regeneratePage(1);assert.equal(submitted[0].prompt,'恢复的分镜');
  instance.generatingImages=true;submitted=null;await instance.regeneratePage(1);assert.equal(submitted,null);
});

test('six page batch uses at most two jobs and retains detailed failures and previous images',async()=>{
  const {instance,ctx}=harness();let active=0,peak=0;
  instance.storyData.scenes=Array(6).fill('scene');instance.bookData.images=Array(6).fill(null);instance.bookData.images[3]='previous-image';
  instance.characterProfiles=[{name:'狐狸'}];instance.selectedHandrawStyle=null;instance.styles=[];
  instance.pickAnchorImageBase64=async()=> 'anchor';ctx.getStyleInfoText=()=> '水彩';ctx.extractApiErrorMessage=()=>'';
  instance.generateOnePageImage=async(index)=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setImmediate(resolve));active--;if(index===3)throw new Error('上游任务失败：capacity');return `image-${index}`};
  await instance.generateImagesForJobs(Array.from({length:6},(_,sceneIndex)=>({sceneIndex,prompt:'描述'})));
  assert.equal(peak,2);assert.equal(instance.bookData.images.filter(Boolean).length,6);assert.equal(instance.bookData.images[3],'previous-image');
  assert.equal(instance.pageGeneration[3],'failed');assert.match(instance.bookData.imageErrors[3],/capacity/);assert.equal(instance.pageGeneration[5],'succeeded');
});

test('fatal queue error stops new submissions and waits for already accepted work',async()=>{
  const {ctx}=harness();const submitted=[];let finishSecond;
  const work=ctx.runBookImageQueue([0,1,2,3,4],async job=>{submitted.push(job);if(job===0)throw new Error('积分不足');await new Promise(resolve=>{finishSecond=resolve})});
  await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(submitted,[0,1]);finishSecond();await assert.rejects(work,/积分不足/);assert.deepEqual(submitted,[0,1]);
});

test('hand-drawn style references accompany character refs with isolated roles',async()=>{
  const {instance,ctx}=harness();let body;
  ctx.buildPageCharacterCard=()=>({card:'狐狸',names:['狐狸']});ctx.buildPageImagePrompt=()=> '本页情节';
  ctx.appendHandrawReferenceIsolation=()=> '只学习画风，不复制主体';
  ctx.postCreateCharacter=async(http,request)=>{body=request;return {message:{image_url:'result'}}};
  ctx.isCreateCharacterResponseOk=()=>true;instance.resolveGeneratedImageUrl=result=>result.image_url;
  instance.getCharacterIdsForApi=()=>['lead-a','lead-b'];
  await instance.generateOnePageImage(0,'情节','水彩',[],'anchor','style');
  assert.deepEqual(Array.from(body.image),['anchor','style']);assert.equal(body.character_ids.length,2);
  assert.match(body.prompt,/第 2 张/);assert.match(body.prompt,/只学习画风/);
  await instance.generateOnePageImage(0,'情节','水彩',[],'','style');assert.equal(body.image,'style');assert.match(body.prompt,/第 1 张/);
  await instance.generateOnePageImage(0,'情节','水彩',[],'anchor','');assert.equal(body.image,'anchor');assert.ok(!body.prompt.includes('风格参考图'));
});

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
