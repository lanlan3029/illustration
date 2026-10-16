const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('thumbnails draw only near viewport, batch work and reuse unchanged previews',()=>{
  const frames=new Map(),draws=[];let id=0,callback,disconnected=false;
  const context=vm.createContext({Map,Set,JSON,
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),
    IntersectionObserver:class{constructor(fn){callback=fn}observe(){}unobserve(){}disconnect(){disconnected=true}},
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/utils/collage/thumbnailDirective.js'),'utf8').replace('export ',''),context);
  const directive=context.createThumbnailDirective((el,item,settings)=>draws.push({el,item,settings}));
  const elements=Array.from({length:160},()=>({closest:()=>({})}));
  const values=elements.map((_,i)=>({item:{id:i},aspect:'1:1',radius:0}));
  elements.forEach((el,i)=>directive.mounted(el,{value:values[i]}));
  assert.equal(draws.length,0);assert.equal(frames.size,0);
  callback(elements.slice(0,10).map(target=>({target,isIntersecting:true})));
  const tick=()=>{const [id,fn]=frames.entries().next().value;frames.delete(id);fn()};
  tick();assert.equal(draws.length,6);tick();assert.equal(draws.length,10);
  elements.forEach((el,i)=>directive.updated(el,{value:{...values[i]}}));
  assert.equal(frames.size,0);
  elements.forEach((el,i)=>directive.updated(el,{value:{...values[i],radius:20}}));
  tick();tick();assert.equal(draws.length,20);
  callback([{target:elements[100],isIntersecting:true}]);tick();
  assert.equal(draws.length,21);assert.equal(draws.at(-1).settings.radius,20);
  callback([{target:elements[101],isIntersecting:true}]);
  elements.forEach(el=>directive.unmounted(el));
  assert.equal(frames.size,0);assert.equal(disconnected,true);
});
