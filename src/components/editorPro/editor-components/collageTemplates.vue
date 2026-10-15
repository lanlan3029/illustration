<template>
  <section class="collage-library">
    <h4>可编辑拼图模板 <span>160</span></h4>
    <p>适配当前画布比例。添加后选择照片，可调整取景和拼图样式。</p>
    <label>照片数量<select v-model.number="count" aria-label="拼图模板照片数量"><option :value="0">全部</option><option v-for="n in 25" :key="n" :value="n">{{ n }} 张</option></select></label>
    <div class="collage-library-grid"><button v-for="item in list" :key="item.index" :disabled="loading" :aria-label="`添加拼图模板 ${item.index+1}，${item.cells.length} 张`" @click="add(item)"><canvas :ref="el=>thumbnail(el,item)"/><span>{{ item.cells.length }} 张 · #{{ item.index+1 }}</span></button></div>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>
<script setup>
import { ref, computed } from 'vue'
import useSelect from '@/components/editorPro/hooks/select'
import templates from '@/data/collage/templates.json'
import { renderCollage } from '@/utils/collage/renderer'
import { importEditableCollage } from '@/utils/editorPro/collageSlots'
const { canvasEditor }=useSelect()
const count=ref(4),loading=ref(false),message=ref('')
const list=computed(()=>templates.map((t,index)=>({...t,index})).filter(t=>!count.value||t.cells.length===count.value))
function thumbnail(el,item){if(el)renderCollage(el,item,[],{mode:'single',aspect:'1:1',spacing:10,border:10,radius:0,background:'#ffffff'},{size:100})}
async function add(item){loading.value=true;message.value='';try{await importEditableCollage(canvasEditor,{schema:1,template:templates[item.index],images:[]});message.value='已添加拼图槽位，请在右侧替换照片。'}catch(e){message.value=e.message}finally{loading.value=false}}
</script>
<style scoped>
.collage-library{margin:14px 0;text-align:left}.collage-library h4{font-size:14px}.collage-library h4 span{color:#7952ac;font-size:11px;margin-left:6px}.collage-library p{font-size:11px;color:#94839f;line-height:1.7}.collage-library label{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin:10px 0}.collage-library select{padding:5px;border:1px solid #dfd3ed;border-radius:6px;background:white}.collage-library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;max-height:230px;overflow:auto;padding:3px}.collage-library-grid button{padding:5px;border:1px solid #e9e4ee;background:white;border-radius:7px;cursor:pointer;min-width:0}.collage-library-grid canvas{width:100%;display:block}.collage-library-grid span{font-size:10px;color:#94839f}.collage-library-grid button:hover{border-color:#7952ac}.collage-library-grid button:focus-visible{outline:2px solid #7952ac}
</style>
