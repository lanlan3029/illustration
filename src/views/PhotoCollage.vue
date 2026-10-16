<template>
  <div class="collage-page" @dragover.prevent @drop.prevent="dropFiles">
    <header class="collage-header">
      <div><span class="eyebrow">COLLAGE STUDIO</span><h1>图片拼图</h1><p>把喜欢的画面，拼成一个故事。</p></div>
      <div class="header-actions"><button :disabled="!canExport || busy" @click="sendEditable">在编辑器中继续编辑</button><button class="primary" :disabled="!canExport || busy" @click="exportImage">{{ busy ? '正在处理…' : settings.mode === 'carousel' ? '导出轮播 ZIP' : '导出 PNG' }}</button></div>
    </header>
    <div class="collage-layout">
      <aside class="collage-sidebar">
        <div class="section-title"><h2>照片</h2><span>{{ photos.length }} / 25</span></div>
        <button class="upload-button" :disabled="uploading" @click="fileInput.click()">{{ uploading ? '正在读取图片…' : '＋ 上传图片' }}<small>支持多选，也可以拖入图片</small></button>
        <input ref="fileInput" class="visually-hidden" type="file" accept="image/*" multiple aria-label="上传图片" @change="uploadFiles($event.target.files); $event.target.value = ''">
        <div v-if="photos.length" class="photo-list">
          <div v-for="(photo,i) in photos" :key="photo.id" class="photo-item" :class="{active:activeIndex===i}" draggable="true" @dragstart="startPhotoDrag($event,i)" @dragover.prevent @drop.stop.prevent="dropPhoto($event,i)">
            <button :aria-label="`选择照片 ${i+1}`" @click="activeIndex=i"><img :src="photo.url" :alt="photo.name"><span>{{ i+1 }}</span></button>
            <div><button :disabled="i===0" :aria-label="`前移照片 ${i+1}`" @click="swapPhotos(i,i-1)">←</button><button :aria-label="`删除照片 ${i+1}`" @click="removePhoto(i)">×</button></div>
          </div>
        </div>
        <div class="section-title"><h2>画布设置</h2></div>
        <div class="segmented"><button :class="{active:settings.mode==='single'}" @click="settings.mode='single'">单张拼图</button><button :class="{active:settings.mode==='carousel'}" @click="settings.mode='carousel'">轮播拼图</button></div>
        <label v-if="settings.mode==='carousel'" class="setting">轮播页数 <select v-model.number="settings.slides"><option v-for="n in 9" :key="n" :value="n+1">{{ n+1 }} 页</option></select></label>
        <label class="setting">{{ settings.mode==='carousel'?'单页比例':'画布比例' }}<select v-model="settings.aspect"><option v-for="ratio in aspects" :key="ratio">{{ ratio }}</option></select></label>
        <label class="setting">背景颜色<input v-model="settings.background" type="color" aria-label="背景颜色"></label>
        <label class="range-setting">图片间距 <output>{{ settings.spacing }}</output><input v-model.number="settings.spacing" type="range" min="0" max="60" aria-label="图片间距"></label>
        <label class="range-setting">外边框 <output>{{ settings.border }}</output><input v-model.number="settings.border" type="range" min="0" max="80" aria-label="外边框"></label>
        <label class="range-setting">圆角 <output>{{ settings.radius }}</output><input v-model.number="settings.radius" type="range" min="0" max="100" aria-label="圆角"></label>
        <div v-if="activePhoto" class="selected-photo"><h2>照片 {{ activeIndex+1 }}</h2><label class="range-setting">缩放 <output>{{ Math.round(activePhoto.zoom*100) }}%</output><input v-model.number="activePhoto.zoom" type="range" min="1" max="4" step="0.01" aria-label="照片缩放"></label><button @click="resetPhoto">重置位置与缩放</button></div>
        <p class="local-note">图片仅在浏览器内处理。离开页面前请导出保存。</p>
      </aside>
      <main class="collage-main">
        <div class="preview-toolbar"><span>{{ dimensions.width }} × {{ dimensions.height }} px{{ settings.mode==='carousel'?` · ${settings.slides} 页`:'' }}</span><label><input v-model="swapMode" type="checkbox">拖动交换照片</label></div>
        <div class="canvas-stage" :class="{'is-empty':!photos.length}">
          <div class="canvas-scroll"><canvas ref="preview" aria-label="拼图预览，拖动移动照片，滚轮或双指缩放，双击重置" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerEnd" @pointercancel="pointerCancel" @wheel.prevent="wheel" @dblclick="resetAt" @dragover.prevent @drop.stop.prevent="dropOnCanvas" /></div>
          <div v-if="!photos.length" class="empty-overlay"><h2>从几张照片开始</h2><p>160 种布局，等你填入自己的画面</p><button class="primary" @click="fileInput.click()">选择图片</button></div>
        </div>
        <p class="preview-hint">{{ swapMode ? '拖动一张照片到另一格，交换顺序。' : '拖动调整照片位置 · 滚轮 / 双指缩放 · 双击重置' }}<span v-if="settings.mode==='carousel'"> · 虚线为分页线，导出时不显示</span></p>
        <p v-if="message" class="status-message" role="status">{{ message }}</p>
        <p v-if="photos.length && !canExport" class="status-message">当前模板需要 {{ currentTemplate.cells.length }} 张照片，已上传 {{ photos.length }} 张。请补充照片或选择匹配模板。</p>
        <section class="template-section"><div class="template-heading"><div><h2>{{ settings.mode==='single'?'拼图模板':'轮播布局' }} <span>{{ filteredTemplates.length }}</span></h2><p>{{ settings.mode==='single'?'包含全部 160 种布局，选择模板即可预览':'照片可以跨越分页线，组成连续的视觉故事' }}</p></div><label v-if="settings.mode=== 'single'">照片数量 <select v-model.number="countFilter"><option :value="0">全部</option><option v-for="n in 25" :key="n" :value="n">{{ n }} 张</option></select></label></div>
          <div class="template-grid"><button v-for="item in filteredTemplates" :key="item.id" class="template-card" :class="{selected:templateId===item.id}" :aria-label="`模板 ${item.id}，${item.cells.length} 张照片`" :aria-pressed="templateId===item.id" @click="selectTemplate(item)"><canvas v-thumbnail="{item,aspect:settings.aspect,mode:settings.mode,slides:settings.slides,radius:settings.radius,background:settings.background}"/><span>{{ item.cells.length }} 张 · {{ item.label }}</span></button></div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, shallowRef, reactive, watch, onMounted, onBeforeUnmount, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import templates from '@/data/collage/templates.json'
import { canvasSize, renderCollage, hitCell, imagePlacement, clamp } from '@/utils/collage/renderer'
import { createThumbnailDirective } from '@/utils/collage/thumbnailDirective'
import { generateCarouselLayouts } from '@/utils/collage/carousel'
import { canvasBlob, downloadBlob, carouselZip } from '@/utils/collage/export'
import { takeEditorproPendingImage } from '@/utils/editorproPendingImage'
import { createCollageTransfer, setPendingCollage } from '@/utils/collage/pendingCollage'

const router=useRouter(), preview=ref(null), fileInput=ref(null), photos=ref([]), activeIndex=ref(-1)
const settings=reactive({mode:'single',aspect:'1:1',slides:3,spacing:10,border:10,radius:0,background:'#ffffff'})
const templateId=ref('static-35'), countFilter=ref(0), swapMode=ref(false), busy=ref(false), uploading=ref(false), message=ref('')
const geometry=shallowRef(null), pointers=new Map()
let drag=null, pinch=null, raf=0, disposed=false, uid=0
const shapeNames={heart:'心形',star:'星形',ellipse:'椭圆',cross:'十字',xcross:'交叉'}
const staticTemplates=templates.map((t,i)=>({...t,id:`static-${i+1}`,label:shapeNames[t.clipShape] || (t.shape?'创意布局':`布局 ${i+1}`)}))
const availableTemplates=computed(()=>settings.mode==='single'?staticTemplates:generateCarouselLayouts(photos.value.length || countFilter.value || 4,settings.slides).map((t,i)=>({...t,id:`carousel-${i+1}`,label:`轮播 ${i+1}`})))
const filteredTemplates=computed(()=>settings.mode==='carousel'?availableTemplates.value:availableTemplates.value.filter(t=>!countFilter.value||t.cells.length===countFilter.value))
const currentTemplate=computed(()=>availableTemplates.value.find(t=>t.id===templateId.value)||availableTemplates.value[0])
const dimensions=computed(()=>canvasSize(settings.aspect,settings.mode==='carousel'?settings.slides:1))
const aspects=computed(()=>settings.mode==='carousel'?['1:1','3:4','9:16']:['1:1','3:4','4:3','9:16','16:9'])
const activePhoto=computed(()=>photos.value[activeIndex.value])
const canExport=computed(()=>photos.value.length>0&&currentTemplate.value?.cells.length===photos.value.length&&!uploading.value)

function draw() { if(preview.value&&currentTemplate.value) geometry.value=renderCollage(preview.value,currentTemplate.value,photos.value,settings,{size:settings.mode==='carousel'?540:800,guides:true,selected:activeIndex.value}) }
function scheduleDraw(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})}
const vThumbnail=createThumbnailDirective((el,item,thumbnailSettings)=>renderCollage(el,item,[],{...thumbnailSettings,spacing:16,border:16},{size:120}))
watch([settings,photos,templateId,activeIndex],scheduleDraw,{deep:true})
watch(()=>settings.mode,()=>{if(!aspects.value.includes(settings.aspect))settings.aspect='1:1';templateId.value=availableTemplates.value.find(t=>t.cells.length===photos.value.length)?.id||availableTemplates.value[0].id;drag=null;pinch=null;pointers.clear()})
function selectTemplate(item){templateId.value=item.id;activeIndex.value=-1;message.value=''}
function matchTemplate(){if(settings.mode==='single'){const match=staticTemplates.find(t=>t.cells.length===photos.value.length);if(match)templateId.value=match.id;countFilter.value=photos.value.length||0}activeIndex.value=photos.value.length?0:-1}

async function uploadFiles(files){
  if(uploading.value||disposed)return
  const input=Array.from(files||[]);if(!input.length)return
  uploading.value=true;message.value='';let failed=0,added=0
  try {for(const file of input){
    if(photos.value.length>=25){message.value='最多支持 25 张照片，超出的图片未添加。';break}
    if(!file.type.startsWith('image/')){failed++;continue}
    const url=URL.createObjectURL(file)
    try {const element=new Image();element.src=url;await element.decode();if(disposed){URL.revokeObjectURL(url);break}photos.value.push({id:++uid,name:file.name,url,element:markRaw(element),zoom:1,panX:0,panY:0});added++}
    catch {URL.revokeObjectURL(url);failed++}
  }}finally{uploading.value=false;if(added)matchTemplate();if(failed)message.value+=` ${failed} 个文件无法读取，请使用 PNG、JPEG 或 WebP 图片。`}
}
function dropFiles(event){uploadFiles(event.dataTransfer.files)}
function removePhoto(i){URL.revokeObjectURL(photos.value[i].url);photos.value.splice(i,1);matchTemplate()}
function swapPhotos(a,b){if(a<0||b<0||a>=photos.value.length||b>=photos.value.length)return;[photos.value[a],photos.value[b]]=[photos.value[b],photos.value[a]];activeIndex.value=b}
function startPhotoDrag(event,i){event.dataTransfer.setData('application/x-collage-photo',String(i));event.dataTransfer.effectAllowed='move'}
function dropPhoto(event,i){const value=event.dataTransfer.getData('application/x-collage-photo');if(value!=='')swapPhotos(Number(value),i);else uploadFiles(event.dataTransfer.files)}
function coordinates(event){const rect=preview.value.getBoundingClientRect();return{x:(event.clientX-rect.left)*preview.value.width/rect.width,y:(event.clientY-rect.top)*preview.value.height/rect.height}}
function indexAt(event){const p=coordinates(event);return geometry.value?hitCell(preview.value.getContext('2d'),geometry.value,p.x,p.y):-1}
function dropOnCanvas(event){const i=indexAt(event);if(i>=0)dropPhoto(event,i);else uploadFiles(event.dataTransfer.files)}
function pointerDown(event){
  if(event.pointerType==='mouse'&&event.button!==0)return
  const i=indexAt(event);if(i<0||!photos.value[i])return
  preview.value.setPointerCapture(event.pointerId);pointers.set(event.pointerId,coordinates(event))
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:activePhoto.value?.zoom||1,index:activeIndex.value};drag=null;return}
  activeIndex.value=i;const p=coordinates(event);drag={index:i,x:p.x,y:p.y,panX:photos.value[i].panX,panY:photos.value[i].panY}
}
function pointerMove(event){
  if(!pointers.has(event.pointerId))return
  const p=coordinates(event);pointers.set(event.pointerId,p)
  if(pinch&&pointers.size>=2){const [a,b]=[...pointers.values()],photo=photos.value[pinch.index];if(photo)photo.zoom=clamp(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance),1,4);return}
  if(!drag||swapMode.value)return
  const photo=photos.value[drag.index],cell=geometry.value?.cells[drag.index];if(!photo||!cell)return
  const placement=imagePlacement(photo,cell)
  photo.panX=clamp(drag.panX-2*(p.x-drag.x)/Math.max(1,placement.width-cell.width),-1,1)
  photo.panY=clamp(drag.panY-2*(p.y-drag.y)/Math.max(1,placement.height-cell.height),-1,1)
}
function pointerEnd(event){if(drag&&swapMode.value)swapPhotos(drag.index,indexAt(event));pointerCancel(event)}
function pointerCancel(event){pointers.delete(event.pointerId);drag=null;pinch=null;if(preview.value?.hasPointerCapture(event.pointerId))preview.value.releasePointerCapture(event.pointerId)}
function wheel(event){const i=indexAt(event);if(i>=0&&photos.value[i]){activeIndex.value=i;photos.value[i].zoom=clamp(photos.value[i].zoom-event.deltaY*.002,1,4)}}
function resetPhoto(){if(activePhoto.value)Object.assign(activePhoto.value,{zoom:1,panX:0,panY:0})}
function resetAt(event){activeIndex.value=indexAt(event);resetPhoto()}
function exportCanvas(){const canvas=document.createElement('canvas');renderCollage(canvas,currentTemplate.value,photos.value,settings);return canvas}
async function exportImage(){if(!canExport.value||busy.value)return;busy.value=true;message.value='';try{const canvas=exportCanvas();downloadBlob(settings.mode==='carousel'?await carouselZip(canvas,settings.slides):await canvasBlob(canvas),settings.mode==='carousel'?'collage-carousel.zip':'collage.png');message.value='已导出，请查看浏览器下载。'}catch(e){message.value=`导出失败：${e.message}`}finally{busy.value=false}}
async function sendEditable(){if(!canExport.value||busy.value)return;busy.value=true;try{const payload=await createCollageTransfer(currentTemplate.value,settings,photos.value);takeEditorproPendingImage();setPendingCollage(payload);await router.push('/editorpro')}catch(e){message.value=`打开编辑器失败：${e.message}`}finally{busy.value=false}}
onMounted(draw)
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(raf);photos.value.forEach(photo=>URL.revokeObjectURL(photo.url));pointers.clear()})
</script>

<style scoped>
.collage-page{--accent:#7952ac;--line:#e9e4ee;background:#f6f4f8;color:#30283b;min-height:100%;text-align:left;padding:28px 32px 40px}.collage-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0 auto 24px;max-width:1600px}.eyebrow{font-size:11px;letter-spacing:3px;color:var(--accent);font-weight:700}.collage-page h1{font-size:30px;margin:7px 0}.collage-page h2{font-size:15px;margin:0}.collage-page p{color:#82788d;font-size:13px;margin:8px 0}.header-actions{display:flex;align-items:center;gap:12px}.collage-page button,.collage-page select{font:inherit;color:inherit;border:1px solid var(--line);border-radius:9px;background:white;padding:9px 13px;cursor:pointer}.collage-page button:hover{border-color:#b9a2d6}.collage-page button:focus-visible,.collage-page a:focus-visible,.collage-page input:focus-visible,.collage-page select:focus-visible{outline:3px solid #b99bdc;outline-offset:3px}.collage-page button:disabled{opacity:.45;cursor:not-allowed}.collage-page .primary{background:var(--accent);color:white;border-color:var(--accent)}.header-actions a{font-size:13px;color:var(--accent)}.collage-layout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:24px;max-width:1600px;margin:auto}.collage-sidebar{background:white;border:1px solid var(--line);border-radius:16px;padding:20px;align-self:start}.section-title{display:flex;align-items:center;justify-content:space-between;margin:0 0 14px}.section-title:not(:first-child){margin-top:24px}.section-title span{font-size:12px;color:#978da0}.upload-button{width:100%;border:1px dashed #b8a1cf!important;background:#faf7fd!important;color:var(--accent)!important;font-weight:600!important}.upload-button small{display:block;font-weight:400;font-size:11px;margin-top:8px;color:#96869e}.visually-hidden{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}.photo-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px;max-height:250px;overflow:auto}.photo-item{min-width:0}.photo-item>button{position:relative;padding:0;width:100%;height:66px;overflow:hidden}.photo-item.active>button{outline:2px solid var(--accent)}.photo-item img{width:100%;height:100%;object-fit:cover}.photo-item span{position:absolute;bottom:2px;left:4px;background:#30283baa;color:white;border-radius:4px;font-size:10px;padding:0 4px}.photo-item>div{display:flex;justify-content:space-between}.photo-item>div button{padding:0 7px;border:0;font-size:14px}.segmented{display:flex;padding:3px;background:#f4f0f7;border-radius:10px;margin-bottom:14px}.segmented button{flex:1;border:0;padding:8px 4px;background:transparent;font-size:12px}.segmented button.active{background:white;color:var(--accent);box-shadow:0 2px 5px #30283b10}.setting{display:flex;align-items:center;justify-content:space-between;font-size:13px;margin:14px 0}.setting select{font-size:12px;max-width:130px}.setting input[type=color]{width:38px;height:28px;border:0;background:none}.range-setting{display:block;font-size:13px;margin:18px 0}.range-setting output{float:right;color:#95869f}.range-setting input{display:block;width:100%;accent-color:var(--accent);margin-top:10px}.selected-photo{border-top:1px solid var(--line);padding-top:16px;margin-top:22px}.selected-photo button{width:100%;font-size:12px}.local-note{font-size:11px!important;line-height:1.8;margin-top:24px!important}.collage-main{min-width:0}.preview-toolbar{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#8a7d97;margin:0 0 12px}.preview-toolbar input{accent-color:var(--accent)}.canvas-stage{position:relative;background-color:#ece9f0;background-image:radial-gradient(#d6cfdf 1px,transparent 1px);background-size:16px 16px;border:1px solid var(--line);border-radius:16px;min-height:410px;display:flex;align-items:center;justify-content:center;padding:24px}.canvas-scroll{max-width:100%;overflow-x:auto;text-align:center}.canvas-scroll>canvas{display:block;max-width:100%;max-height:510px;width:auto;height:auto;object-fit:contain;box-shadow:0 8px 30px #35234516;touch-action:none;cursor:grab;margin:auto}.canvas-stage.is-empty canvas{opacity:.26}.empty-overlay{position:absolute;text-align:center;background:#ffffffed;border:1px solid #ffffff;border-radius:16px;padding:26px;box-shadow:0 10px 30px #3523450c}.empty-overlay h2{font-size:21px}.empty-overlay button{margin-top:12px}.preview-hint{text-align:center;font-size:12px!important;margin:12px 0 20px!important}.status-message{background:#fff8e9;color:#94652c!important;border-radius:8px;padding:12px}.template-section{background:white;border:1px solid var(--line);border-radius:16px;padding:20px}.template-heading{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:18px}.template-heading h2 span{color:var(--accent);font-size:12px;background:#f3edf9;padding:2px 7px;border-radius:6px;margin-left:6px}.template-heading p{font-size:12px}.template-heading label{font-size:12px;white-space:nowrap}.template-heading select{margin-left:6px;font-size:12px}.template-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;max-height:450px;overflow:auto;padding:3px}.template-card{padding:8px!important;min-width:0}.template-card.selected{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);background:#fbf8ff}.template-card canvas{width:100%;height:84px;object-fit:contain;display:block}.template-card span{display:block;text-align:center;color:#8d7e99;font-size:10px;margin-top:7px}
@media(max-width:900px){.collage-page{padding:20px 16px}.collage-layout{grid-template-columns:230px minmax(0,1fr);gap:16px}.header-actions{flex-wrap:wrap;justify-content:flex-end}.canvas-stage{min-height:320px;padding:16px}.template-heading{flex-wrap:wrap}}
@media(max-width:640px){.collage-header{align-items:flex-start;flex-direction:column}.header-actions{width:100%;justify-content:flex-start}.collage-layout{display:flex;flex-direction:column}.collage-sidebar{width:100%;box-sizing:border-box}.collage-main{width:100%}.photo-list{grid-template-columns:repeat(5,minmax(0,1fr));max-height:170px}.photo-item>button{height:58px}.canvas-stage{min-height:280px}.canvas-scroll>canvas{max-height:420px}.empty-overlay{padding:18px}.template-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.preview-toolbar{flex-wrap:wrap}.collage-page h1{font-size:26px}}
</style>
