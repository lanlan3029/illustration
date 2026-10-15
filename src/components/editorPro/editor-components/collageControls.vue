<template>
  <section v-if="root" class="collage-controls" aria-label="可编辑拼图设置">
    <h4>可编辑拼图 · {{ slotCount }} 张</h4>
    <p>切换画布尺寸后自动重新排版，照片保持等比。</p>
    <div class="photo-controls"><h4>模板整体</h4><label>整体缩放 <output>{{ Math.round(frame.width*100) }}%</output><input :value="frame.width" type="range" min="0.1" max="2" step="0.01" aria-label="模板整体缩放" @change="scaleFrame($event.target.value)"></label><button type="button" :aria-pressed="editingFrame" @click="toggleFrame">{{ editingFrame?'完成外框调整':'拖动 / 缩放模板外框' }}</button><button type="button" @click="resetFrame">恢复铺满画布</button><p v-if="editingFrame">拖动外框移动模板；拖动角点或边缘调整大小。完成后可继续调整照片取景。</p></div>
    <label>切换布局<select :value="templateIndex" aria-label="拼图布局" @change="switchLayout($event.target.value)"><option v-for="item in matchingTemplates" :key="item.index" :value="item.index">模板 {{ item.index+1 }}{{ item.clipShape?' · '+item.clipShape:'' }}</option></select></label>
    <label>间距 <output>{{ values.spacing }}</output><input :value="values.spacing" type="range" min="0" max="60" aria-label="拼图间距" @change="changeSetting('spacing',$event.target.value)"></label>
    <label>外边框 <output>{{ values.border }}</output><input :value="values.border" type="range" min="0" max="80" aria-label="拼图外边框" @change="changeSetting('border',$event.target.value)"></label>
    <label>圆角 <output>{{ values.radius }}</output><input :value="values.radius" type="range" min="0" max="100" aria-label="拼图圆角" @change="changeSetting('radius',$event.target.value)"></label>
    <label class="color-row">背景<input :value="values.background" type="color" aria-label="拼图背景" @change="changeSetting('background',$event.target.value)"></label>
    <div v-if="slot" class="photo-controls"><h4>照片 {{ slot.kidstoryCollageIndex+1 }}</h4><p>在画布内拖动照片调整取景。</p><label>缩放 <output>{{ Math.round(zoom*100) }}%</output><input :value="zoom" type="range" min="1" max="4" step="0.01" aria-label="拼图照片缩放" @change="changeZoom($event.target.value)"></label><button type="button" @click="reset">重置取景</button><button type="button" :disabled="loading" @click="fileInput.click()">{{ loading?'正在读取…':'替换此照片' }}</button><input ref="fileInput" class="hidden-input" type="file" accept="image/*" aria-label="替换拼图照片" @change="replace($event)"></div>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup>
import { shallowRef, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import useSelect from '@/components/editorPro/hooks/select'
import templates from '@/data/collage/templates.json'
import { collageRoots, collageSlots, rootForSlot, updateCollage, switchCollageTemplate, zoomCollagePhoto, resetCollagePhoto, replaceCollagePhoto, scaleCollageFrame, setCollageFrame, editCollageFrame, isEditingCollageFrame, COLLAGE_CHANGED } from '@/utils/editorPro/collageSlots'

const { canvasEditor }=useSelect()
const root=shallowRef(null),slot=shallowRef(null),version=ref(0),fileInput=ref(null),loading=ref(false),error=ref('')
const values=computed(()=>{version.value;return root.value?.kidstoryCollage.settings||{}})
const frame=computed(()=>{version.value;return root.value?.kidstoryCollage.frame||{x:0,y:0,width:1,height:1}})
const editingFrame=computed(()=>{version.value;return root.value&&isEditingCollageFrame(root.value)})
function scaleFrame(value){if(root.value)scaleCollageFrame(canvasEditor,root.value,Number(value))}
function resetFrame(){if(root.value)setCollageFrame(canvasEditor,root.value,{x:0,y:0,width:1,height:1})}
function toggleFrame(){if(root.value)editCollageFrame(canvasEditor,root.value,!editingFrame.value)}
const slotCount=computed(()=>{version.value;return root.value?collageSlots(canvasEditor.canvas,root.value).length:0})
const zoom=computed(()=>{version.value;return slot.value?.kidstoryCollagePhoto?.zoom||1})
const matchingTemplates=computed(()=>templates.map((t,index)=>({...t,index})).filter(t=>t.cells.length===slotCount.value))
const templateIndex=computed(()=>{version.value;const template=root.value?.kidstoryCollage.template;return templates.findIndex(t=>JSON.stringify(t.cells)===JSON.stringify(template?.cells)&&t.clipShape===template?.clipShape)})
function sync(){
  const canvas=canvasEditor.canvas,active=canvas.getActiveObject()
  slot.value=active?.kidstoryCollageId&&active.type==='image'?active:null
  root.value=slot.value?rootForSlot(canvas,slot.value):active?.kidstoryCollage?active:!active?collageRoots(canvas).at(-1):null
  version.value++
}
function changeSetting(key,value){if(root.value)updateCollage(canvasEditor,root.value,{[key]:key==='background'?value:Number(value)})}
function switchLayout(index){if(root.value)switchCollageTemplate(canvasEditor,root.value,templates[Number(index)])}
function changeZoom(value){if(slot.value)zoomCollagePhoto(canvasEditor,slot.value,Number(value))}
function reset(){if(slot.value)resetCollagePhoto(canvasEditor,slot.value)}
async function replace(event){
  const file=event.target.files?.[0],target=slot.value;event.target.value=''
  if(!file||!target)return
  loading.value=true;error.value=''
  try{const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});await replaceCollagePhoto(canvasEditor,target,src)}catch{error.value='图片无法读取，请选择有效的图片。'}finally{loading.value=false}
}
const events=['selection:created','selection:updated','selection:cleared',COLLAGE_CHANGED]
onMounted(()=>{events.forEach(name=>canvasEditor.canvas.on(name,sync));sync()})
onBeforeUnmount(()=>events.forEach(name=>canvasEditor.canvas.off(name,sync)))
</script>

<style scoped>
.collage-controls{margin:10px;padding:14px;border:1px solid #dfd3ed;background:#faf7fd;border-radius:9px;color:#4e3c66;text-align:left}.collage-controls h4{margin:0 0 8px;font-size:14px}.collage-controls p{font-size:11px;line-height:1.7;color:#94839f;margin:6px 0 12px}.collage-controls label{display:block;margin:12px 0;font-size:12px}.collage-controls output{float:right;color:#806494}.collage-controls input[type=range]{width:100%;display:block;margin-top:8px;accent-color:#7952ac}.collage-controls select{width:100%;margin-top:7px;padding:6px;background:white;border:1px solid #dfd3ed;border-radius:6px}.color-row{display:flex!important;align-items:center;justify-content:space-between}.color-row input{width:35px;height:26px;background:none;border:0}.photo-controls{border-top:1px solid #dfd3ed;padding-top:12px}.photo-controls button{font:inherit;font-size:12px;padding:7px 9px;border:1px solid #dfd3ed;border-radius:6px;background:white;margin:0 5px 6px 0;cursor:pointer}.hidden-input{position:absolute;opacity:0;width:1px;height:1px}.collage-controls :focus-visible{outline:2px solid #7952ac;outline-offset:2px}
</style>
