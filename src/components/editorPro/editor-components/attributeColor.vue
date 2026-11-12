
<template>
  <div class="box attr-item-box" v-if="isOne && selectType !== 'image' && selectType !== 'group'">
    <Divider plain orientation="left"><h4>颜色</h4></Divider>
    <!-- 通用属性 -->
    <div class="bg-item">
      <Tooltip placement="top" theme="light">
        <div class="color-bar" :style="{ background: baseAttr.fill }"></div>
        <template #content>
          <color-picker
            v-model:value="baseAttr.fill"
            :modes="['色卡', '渐变', '纯色']"
            :swatches="pictureBookSwatches"
            @change="colorChange"
            @nativePick="dropColor"
          ></color-picker>
        </template>
      </Tooltip>
    </div>
    <button
      v-if="['rect', 'circle', 'triangle', 'polygon'].includes(selectType)"
      type="button"
      class="no-fill-button"
      :class="{ 'is-active': baseAttr.noFill }"
      :aria-pressed="baseAttr.noFill"
      @click="toggleFill"
    >
      <span class="no-fill-icon" aria-hidden="true"></span>
      <span>{{ baseAttr.noFill ? '恢复填充' : '无填充' }}</span>
      <span class="no-fill-status">{{ baseAttr.noFill ? '当前无填充' : '保留边框' }}</span>
    </button>
    <!-- <Divider plain></Divider> -->
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select';
import colorPicker from './color-picker';
import { pictureBookSwatches, paintToCss, gradientFromPicker } from './color-picker/paint';
import { debounce } from 'lodash-es';
import { getCurrentInstance, onMounted, onBeforeUnmount,reactive} from 'vue';
const update = getCurrentInstance();
const { fabric, selectType, canvasEditor, isOne } = useSelect();

/** 颜色由 stroke 而非 fill 控制的元素（画笔路径、直线、箭头等） */
const STROKE_BASED_TYPES = ['path', 'line', 'arrow', 'thinTailArrow'];

const isStrokeBasedType = (type) => STROKE_BASED_TYPES.includes(type);

// 属性值
const baseAttr = reactive({
  fill: '#ffffffff',
  noFill: false,
});
// Keep each shape's previous paint, including a Fabric gradient, while editing.
const previousFills = new WeakMap();

const savePaint = debounce((object) => {
  canvasEditor.canvas.fire('object:modified', { target: object });
}, 300);

const toggleFill = () => {
  const object = canvasEditor.canvas.getActiveObject();
  if (!object) return;
  savePaint.flush();
  if (baseAttr.noFill) {
    const fill = previousFills.get(object) ?? '#ffffff';
    object.set('fill', fill);
    baseAttr.fill = paintToCss(fill, object);
    baseAttr.noFill = false;
  } else {
    previousFills.set(object, object.get('fill'));
    object.set('fill', 'transparent');
    if (!object.stroke) object.set('stroke', '#000000');
    if (!object.strokeWidth) object.set('strokeWidth', 2);
    object.set('strokeUniform', true);
    baseAttr.noFill = true;
  }
  canvasEditor.canvas.fire('object:modified', { target: object });
  canvasEditor.canvas.requestRenderAll();
};

// 属性获取
const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject();
  // 不是当前obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  if (activeObject && isOne) {
    if (isStrokeBasedType(activeObject.type)) {
      const stroke = activeObject.get('stroke');
      baseAttr.fill = paintToCss(stroke, activeObject);
      return;
    }
    const fill = activeObject.get('fill');
    baseAttr.noFill = fill === 'transparent' || fill == null;
    if (!baseAttr.noFill) baseAttr.fill = paintToCss(fill, activeObject);
  }
};

const colorChange = (value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (!activeObject) return;

  const color = String(value.color).replace('NaN', '');
  const strokeBased = isStrokeBasedType(activeObject.type);

  const paint = value.mode === '渐变'
    ? gradientFromPicker(fabric, value, activeObject)
    : color;
  if (strokeBased) {
    activeObject.set('stroke', paint);
    if (activeObject.type === 'arrow' || activeObject.type === 'thinTailArrow') {
      activeObject.set('fill', paint);
    }
  } else {
    activeObject.set('fill', paint);
    previousFills.set(activeObject, paint);
    baseAttr.noFill = false;
  }
  canvasEditor.canvas.renderAll();
  savePaint(activeObject);
};

const dropColor = (value) => {
  if (!baseAttr.fill.startsWith('linear-gradient')) colorChange({ mode: '纯色', color: value });
};

const selectCancel = () => {
  update?.proxy?.$forceUpdate();
};

onMounted(() => {
  // 获取字体数据
  getObjectAttr();
  canvasEditor.on('selectCancel', selectCancel);
  canvasEditor.on('selectOne', getObjectAttr);
  canvasEditor.canvas.on('object:modified', getObjectAttr);
});

onBeforeUnmount(() => {
  savePaint.flush();
  canvasEditor.off('selectCancel', selectCancel);
  canvasEditor.off('selectOne', getObjectAttr);
  canvasEditor.canvas.off('object:modified', getObjectAttr);
});
</script>

<style scoped>
.no-fill-button {
  display: flex; align-items: center; gap: 9px; width: 100%; min-height: 40px;
  margin-top: 8px; padding: 6px 10px; border: 1px solid #e2e5eb; border-radius: 6px;
  background: #fff; color: #384252; cursor: pointer; text-align: left; font-size: 13px;
}
.no-fill-button:hover { border-color: #8bbbf1; background: #f7faff; }
.no-fill-button:focus-visible { outline: 2px solid #2d8cf0; outline-offset: 2px; }
.no-fill-button.is-active { border-color: #529ce9; background: #edf6ff; color: #1766ad; }
.no-fill-icon {
  width: 22px; height: 22px; flex: none; border: 1px solid #ccd3dd; border-radius: 4px;
  background: linear-gradient(135deg, transparent 46%, #e05d67 47%, #e05d67 53%, transparent 54%),
    conic-gradient(#e4e7eb 25%, #fff 0 50%, #e4e7eb 0 75%, #fff 0) 0 0 / 10px 10px;
}
.no-fill-status { margin-left: auto; color: #687587; font-size: 12px; }
.no-fill-button.is-active .no-fill-status { color: #1766ad; }
.color-bar {
  width: 30px;
  height: 30px;
  cursor: pointer;
  border: 2px solid #f6f7f9;
}
:deep(.ivu-input-number) {
  display: block;
  width: 100%;
}

:deep(.ivu-tooltip) {
  display: flex;
}
.ivu-form-item {
  background: #f6f7f9;
  border-radius: 5px;
  padding: 0 5px;
  margin-bottom: 10px;
}

.ivu-row {
  margin-bottom: 10px;
}
</style>
